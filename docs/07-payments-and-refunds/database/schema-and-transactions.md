# Payments Schema and Transactions

**Status:** proposed PostgreSQL 18 schema/protocol for a reviewed EF Core/Npgsql migration. No SQL, trigger, migration, grant or transaction has been executed. State guards and transaction-time evidence validation below are REQUIRED in addition to the structural DDL.

## Owner data model

Bindings are immutable acceptance records. Intent balances are current projections of append-only financial facts and refund allocations. Compensation cases describe full-refund obligations; they are distinct from individual provider Refund objects. Mutation rows preserve external retry identity/window. Work and inbox are scheduling/observation records, never financial truth.

```sql
CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE payments.source_assignments (
    customer_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    checkout_key uuid NOT NULL,
    fixture_code text NOT NULL CHECK (fixture_code IN
        ('Success','Decline','ActionRequired','PendingRefund','RefundFailure')),
    assigned_by text NOT NULL CHECK (length(assigned_by) BETWEEN 1 AND 128),
    request_id uuid NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (customer_id, checkout_key)
);

CREATE TABLE payments.bindings (
    payment_id uuid PRIMARY KEY,
    attempt_id uuid NOT NULL UNIQUE REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    order_id uuid NOT NULL UNIQUE REFERENCES orders.orders(id) ON DELETE RESTRICT,
    customer_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    compensation_id uuid NOT NULL UNIQUE,
    account_id varchar(255) COLLATE "C" NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]+$'),
    api_version text NOT NULL CHECK (api_version = '2026-09-30.endive'),
    source text NOT NULL CHECK (source = 'StripeSandbox'),
    fixture_code text NOT NULL CHECK (fixture_code IN
        ('Success','Decline','ActionRequired','PendingRefund','RefundFailure')),
    payment_method varchar(255) COLLATE "C" NOT NULL CHECK (payment_method ~ '^pm_[A-Za-z0-9_]+$'),
    amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 501 AND 99999999),
    currency_code varchar(3) COLLATE "C" NOT NULL CHECK (currency_code = 'USD'),
    reservation_expires_at timestamptz NOT NULL,
    accepted_at timestamptz NOT NULL,
    source_fingerprint bytea NOT NULL CHECK (octet_length(source_fingerprint) = 32),
    UNIQUE (payment_id, account_id),
    CHECK (reservation_expires_at > accepted_at)
);

CREATE TABLE payments.payment_intents (
    id uuid PRIMARY KEY REFERENCES payments.bindings(payment_id) ON DELETE RESTRICT,
    account_id varchar(255) COLLATE "C" NOT NULL,
    provider_intent_id varchar(255) COLLATE "C",
    provider_charge_id varchar(255) COLLATE "C",
    state text NOT NULL CHECK (state IN ('Prepared','Pending','Captured','Rejected','Aborted')),
    captured_minor bigint NOT NULL DEFAULT 0 CHECK (captured_minor BETWEEN 0 AND 9007199254740991),
    refunded_minor bigint NOT NULL DEFAULT 0 CHECK (refunded_minor BETWEEN 0 AND 9007199254740991),
    reserved_minor bigint NOT NULL DEFAULT 0 CHECK (reserved_minor BETWEEN 0 AND 9007199254740991),
    refund_started boolean NOT NULL DEFAULT false,
    closure_requested boolean NOT NULL DEFAULT false,
    integrity_hold boolean NOT NULL DEFAULT false,
    version bigint NOT NULL CHECK (version BETWEEN 1 AND 9007199254740991),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    FOREIGN KEY (id, account_id) REFERENCES payments.bindings(payment_id, account_id) ON DELETE RESTRICT,
    UNIQUE (id, account_id),
    CHECK (provider_intent_id IS NULL OR provider_intent_id ~ '^pi_[A-Za-z0-9]+$'),
    CHECK (provider_charge_id IS NULL OR provider_charge_id ~ '^ch_[A-Za-z0-9]+$'),
    CHECK (integrity_hold OR refunded_minor + reserved_minor <= captured_minor),
    CHECK ((state = 'Captured' AND captured_minor > 0) OR
           (state <> 'Captured' AND captured_minor = 0)),
    CHECK (updated_at >= created_at)
);
CREATE UNIQUE INDEX payments_provider_intent
    ON payments.payment_intents (account_id, provider_intent_id) WHERE provider_intent_id IS NOT NULL;
CREATE UNIQUE INDEX payments_provider_charge
    ON payments.payment_intents (account_id, provider_charge_id) WHERE provider_charge_id IS NOT NULL;

CREATE TABLE payments.compensation_cases (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL UNIQUE REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    capture_fact_id uuid NOT NULL,
    target_minor bigint NOT NULL CHECK (target_minor BETWEEN 501 AND 99999999),
    original_reason text NOT NULL CHECK (original_reason IN ('Cancellation','StockLost','LateCapture','RefundBeforeConfirmation')),
    next_allocation bigint NOT NULL CHECK (next_allocation BETWEEN 1 AND 9007199254740991),
    created_at timestamptz NOT NULL,
    UNIQUE (id, payment_id)
);

CREATE TABLE payments.refunds (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    account_id varchar(255) COLLATE "C" NOT NULL,
    compensation_id uuid,
    allocation_number bigint,
    origin text NOT NULL CHECK (origin IN ('Admin','Compensation','Imported')),
    amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 1 AND 99999999),
    provider_refund_id varchar(255) COLLATE "C",
    state text NOT NULL CHECK (state IN ('Prepared','Pending','Succeeded','Failed','Voided')),
    allocation_state text NOT NULL CHECK (allocation_state IN ('Reserved','Settled','Released','FailedHold')),
    replaces_refund_id uuid REFERENCES payments.refunds(id) ON DELETE RESTRICT,
    repair_request_id uuid UNIQUE,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    FOREIGN KEY (compensation_id, payment_id) REFERENCES payments.compensation_cases(id, payment_id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id, account_id) REFERENCES payments.payment_intents(id, account_id) ON DELETE RESTRICT,
    UNIQUE (id, payment_id),
    UNIQUE (compensation_id, allocation_number),
    UNIQUE (account_id, provider_refund_id),
    CHECK (provider_refund_id IS NULL OR provider_refund_id ~ '^re_[A-Za-z0-9]+$'),
    CHECK ((origin = 'Compensation' AND compensation_id IS NOT NULL AND allocation_number IS NOT NULL
             AND allocation_number BETWEEN 1 AND 9007199254740991) OR
           (origin <> 'Compensation' AND compensation_id IS NULL AND allocation_number IS NULL)),
    CHECK ((state IN ('Prepared','Pending') AND allocation_state = 'Reserved') OR
           (state = 'Succeeded' AND allocation_state = 'Settled') OR
           (state = 'Voided' AND allocation_state = 'Released') OR
           (state = 'Failed' AND allocation_state IN ('Released','FailedHold'))),
    CHECK (allocation_state <> 'FailedHold' OR origin = 'Compensation'),
    CHECK ((replaces_refund_id IS NULL AND repair_request_id IS NULL) OR
           (replaces_refund_id IS NOT NULL AND repair_request_id IS NOT NULL AND origin = 'Compensation')),
    CHECK (replaces_refund_id IS NULL OR replaces_refund_id <> id),
    FOREIGN KEY (replaces_refund_id, payment_id) REFERENCES payments.refunds(id, payment_id) ON DELETE RESTRICT,
    CHECK (updated_at >= created_at)
);
CREATE UNIQUE INDEX payments_one_replacement
    ON payments.refunds (replaces_refund_id) WHERE replaces_refund_id IS NOT NULL;
CREATE INDEX payments_refund_history ON payments.refunds (payment_id, created_at DESC, id DESC);
CREATE INDEX payments_reserved_refunds ON payments.refunds (payment_id, id)
    WHERE allocation_state IN ('Reserved','FailedHold');

CREATE TABLE payments.refund_receipts (
    admin_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    idempotency_key uuid NOT NULL,
    refund_id uuid NOT NULL UNIQUE REFERENCES payments.refunds(id) ON DELETE RESTRICT,
    request_canonical jsonb NOT NULL CHECK (jsonb_typeof(request_canonical) = 'object'
        AND octet_length(request_canonical::text) <= 4096),
    request_fingerprint bytea NOT NULL CHECK (octet_length(request_fingerprint) = 32),
    receipt jsonb NOT NULL CHECK (jsonb_typeof(receipt) = 'object' AND octet_length(receipt::text) <= 1024),
    created_at timestamptz NOT NULL,
    PRIMARY KEY (admin_id, idempotency_key)
);

CREATE TABLE payments.provider_mutations (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    refund_id uuid REFERENCES payments.refunds(id) ON DELETE RESTRICT,
    kind text NOT NULL CHECK (kind IN ('CreatePayment','CancelPayment','CreateRefund')),
    operation_id uuid NOT NULL,
    provider_key varchar(255) COLLATE "C" NOT NULL UNIQUE,
    parameters jsonb NOT NULL CHECK (jsonb_typeof(parameters) = 'object' AND octet_length(parameters::text) <= 4096),
    request_fingerprint bytea NOT NULL CHECK (octet_length(request_fingerprint) = 32),
    first_send_at timestamptz,
    safe_retry_until timestamptz,
    created_at timestamptz NOT NULL,
    UNIQUE (kind, operation_id),
    FOREIGN KEY (refund_id, payment_id) REFERENCES payments.refunds(id, payment_id) ON DELETE RESTRICT,
    CHECK ((kind = 'CreateRefund' AND refund_id IS NOT NULL AND operation_id = refund_id) OR
           (kind <> 'CreateRefund' AND refund_id IS NULL AND operation_id = payment_id)),
    CHECK ((first_send_at IS NULL AND safe_retry_until IS NULL) OR
           (first_send_at IS NOT NULL AND safe_retry_until IS NOT NULL
             AND first_send_at >= created_at AND safe_retry_until = first_send_at + interval '23 hours'))
);

CREATE TABLE payments.facts (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    refund_id uuid REFERENCES payments.refunds(id) ON DELETE RESTRICT,
    kind text NOT NULL CHECK (kind IN ('Captured','NoCapture','RefundSucceeded','RefundFailed','RefundReversed')),
    effect_key varchar(512) COLLATE "C" NOT NULL,
    amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 0 AND 9007199254740991),
    currency_code varchar(3) COLLATE "C" NOT NULL CHECK (currency_code = 'USD'),
    provider_object_id varchar(255) COLLATE "C",
    provider_adjustment_id varchar(255) COLLATE "C",
    prior_fact_id uuid REFERENCES payments.facts(id) ON DELETE RESTRICT,
    admissible boolean NOT NULL,
    observed_at timestamptz NOT NULL,
    UNIQUE (payment_id, effect_key),
    UNIQUE (id, payment_id),
    UNIQUE (id, payment_id, refund_id),
    FOREIGN KEY (refund_id, payment_id) REFERENCES payments.refunds(id, payment_id) ON DELETE RESTRICT,
    FOREIGN KEY (prior_fact_id, payment_id, refund_id) REFERENCES payments.facts(id, payment_id, refund_id) ON DELETE RESTRICT,
    CHECK ((kind IN ('Captured','NoCapture') AND refund_id IS NULL) OR
           (kind LIKE 'Refund%' AND refund_id IS NOT NULL)),
    CHECK ((kind = 'NoCapture' AND amount_minor = 0) OR (kind <> 'NoCapture' AND amount_minor > 0)),
    CHECK ((kind = 'RefundReversed' AND prior_fact_id IS NOT NULL) OR
           (kind <> 'RefundReversed' AND prior_fact_id IS NULL))
);
CREATE UNIQUE INDEX payments_one_refund_reversal ON payments.facts (prior_fact_id)
    WHERE kind = 'RefundReversed';
ALTER TABLE payments.compensation_cases ADD CONSTRAINT payments_case_capture_fact
    FOREIGN KEY (capture_fact_id, payment_id) REFERENCES payments.facts(id, payment_id) ON DELETE RESTRICT;

CREATE TABLE payments.financial_work (
    payment_id uuid PRIMARY KEY REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    state text NOT NULL CHECK (state IN ('Scheduled','Idle','ManualReview')),
    next_action_at timestamptz NOT NULL,
    observations integer NOT NULL CHECK (observations BETWEEN 0 AND 10),
    cycle bigint NOT NULL CHECK (cycle BETWEEN 1 AND 9007199254740991),
    lease_token uuid,
    lease_expires_at timestamptz,
    wake_pending boolean NOT NULL DEFAULT false,
    wake_version bigint NOT NULL CHECK (wake_version BETWEEN 0 AND 9007199254740991),
    scan_due_at timestamptz NOT NULL,
    scan_cursor jsonb CHECK (scan_cursor IS NULL OR (jsonb_typeof(scan_cursor) = 'object'
        AND octet_length(scan_cursor::text) <= 2048)),
    changed_at timestamptz NOT NULL,
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (lease_token IS NOT NULL AND lease_expires_at IS NOT NULL))
);
CREATE INDEX payments_due_work ON payments.financial_work (next_action_at, payment_id)
    WHERE state = 'Scheduled';
CREATE INDEX payments_wake_pending ON payments.financial_work (payment_id) WHERE wake_pending;
CREATE INDEX payments_scan_due ON payments.financial_work (scan_due_at, payment_id);

CREATE TABLE payments.webhook_inbox (
    id uuid PRIMARY KEY,
    account_id varchar(255) COLLATE "C" NOT NULL,
    event_id varchar(255) COLLATE "C" NOT NULL,
    event_type varchar(128) COLLATE "C" NOT NULL,
    api_version varchar(64) COLLATE "C",
    object_type varchar(64) COLLATE "C" NOT NULL,
    object_id varchar(255) COLLATE "C" NOT NULL,
    operation_hint uuid,
    livemode boolean NOT NULL,
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    state text NOT NULL CHECK (state IN ('Received','Processed','Ignored','Quarantined','ManualReview')),
    observations integer NOT NULL CHECK (observations BETWEEN 0 AND 10),
    next_action_at timestamptz NOT NULL,
    lease_token uuid,
    lease_expires_at timestamptz,
    received_at timestamptz NOT NULL,
    UNIQUE (account_id, event_id),
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (lease_token IS NOT NULL AND lease_expires_at IS NOT NULL))
);
CREATE INDEX payments_received_events ON payments.webhook_inbox (next_action_at, id) WHERE state = 'Received';

CREATE TABLE payments.quarantine (
    id uuid PRIMARY KEY,
    account_id varchar(255) COLLATE "C" NOT NULL,
    object_id varchar(255) COLLATE "C" NOT NULL,
    code text NOT NULL CHECK (code IN ('MappingMismatch','AmountMismatch','CurrencyMismatch','LiveMode',
        'UnknownObject','UnsupportedVersion','ConflictingDelivery','DuplicateEffect','Disputed','InvalidShape')),
    safe_evidence jsonb NOT NULL CHECK (jsonb_typeof(safe_evidence) = 'object'
        AND octet_length(safe_evidence::text) <= 8192),
    dedup_digest bytea NOT NULL UNIQUE CHECK (octet_length(dedup_digest) = 32),
    first_observed_at timestamptz NOT NULL
);

CREATE TABLE payments.audit (
    id uuid PRIMARY KEY,
    order_id uuid,
    payment_id uuid REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    refund_id uuid REFERENCES payments.refunds(id) ON DELETE RESTRICT,
    fact_id uuid REFERENCES payments.facts(id) ON DELETE RESTRICT,
    kind text NOT NULL CHECK (kind IN ('IntentPrepared','DispatchAdmitted','ClosureRequested','NoCapture','CaptureObserved',
        'AdminRefundAccepted','RefundSucceeded','RefundFailed','RefundReversed','CompensationCovered',
        'CompensationAllocation','IntegrityHold','ManualReview','OperatorResume','OperatorRepair','AdmissionChanged','AdminRead')),
    actor_kind text NOT NULL CHECK (actor_kind IN ('Admin','Checkout','Worker','Operator')),
    actor_id text NOT NULL CHECK (length(actor_id) BETWEEN 1 AND 128),
    request_id uuid NOT NULL,
    financial_version bigint,
    reason text CHECK (reason IS NULL OR (length(reason) BETWEEN 1 AND 256 AND octet_length(reason) <= 1024)),
    created_at timestamptz NOT NULL,
    CHECK (financial_version IS NULL OR financial_version BETWEEN 1 AND 9007199254740991),
    CHECK (kind <> 'AdminRead' OR order_id IS NOT NULL)
);
CREATE INDEX payments_audit_payment ON payments.audit (payment_id, created_at, id);

CREATE TABLE payments.account_gates (
    account_id varchar(255) COLLATE "C" PRIMARY KEY,
    new_purchase_allowed boolean NOT NULL DEFAULT false,
    new_refund_allowed boolean NOT NULL DEFAULT false,
    dispatch_allowed boolean NOT NULL DEFAULT false,
    consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures BETWEEN 0 AND 5),
    failure_window_started_at timestamptz,
    cooldown_until timestamptz,
    manual_hold boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL,
    CHECK ((consecutive_failures = 0 AND failure_window_started_at IS NULL) OR
           (consecutive_failures > 0 AND failure_window_started_at IS NOT NULL))
);
```

## Required guards beyond structural DDL

The migration MUST install before-update/delete guards or equivalent database column privileges for immutable bindings, assignments, receipt identity/payload, facts and audit. Bindings/accepted receipts/facts/audit cannot be updated/deleted by runtime roles. Mutation kind/operation/key/parameters/fingerprint never change; first_send_at/safe_retry_until may be populated together once and are thereafter immutable. Provider mapping changes only null→one value; a different later ID is quarantine, never a rewrite. Intent id/account/created_at are immutable. Refund id/parent/account/origin/amount/case/generation/replacement/repair identity and timestamps of creation are immutable; lifecycle/allocation fields are guarded by owner transitions.

State/equation guards MUST validate nonnull operands explicitly; SQL CHECK passes UNKNOWN, so nullable coupled fields always use IS NULL/IS NOT NULL. Composite FKs bind a refund's mutation/fact/replacement to the same payment and a reversal to the same refund/payment. Owner validation also checks the prior fact's success kind/exact amount, source/effect identity and cross-field lifecycle. The DDL above is structural design, not a claim that SQL alone enforces the complete protocol.

Guard refund_started and closure_requested against true→false updates. Effective financial projection changes advance version exactly once in their owner transaction and persist required audit; no unchanged read/lease bookkeeping alters version. Provider_refund_id permits only null→one immutable value, including imported observations. An imported/accepted refund sets refund_started; this latch preserves the preconfirmation policy after a later failure/void.

`Captured` requires actual financial facts, not merely a positive counter; Rejected/Aborted require the exact no-capture/no-dispatch fact. Case UUID equals the binding's compensation UUID, capture_fact belongs to the same payment and target equals the validated captured total. Normal full-compensation creation requires one exact admitted USD capture. Additional/mismatched external captures stay held for an operator-reviewed reconciliation plan; an existing case's target is not silently changed.

Net S equals sum of unique RefundSucceeded amounts less linked unique RefundReversed amounts. R equals amounts in Reserved/FailedHold allocations. A parent-lock transaction changes selected allocations and counters together; no unlocked SUM followed by INSERT. Restricted invariant scans recompute sums from history to detect corruption; they are outside hot admission, bounded by persisted keyset. `integrity_hold` permits recording verified external anomalies that violate the normal reservation equation, and MUST NOT be used to bypass normal admission. Set hold and preserve evidence atomically; public available becomes0.

## Transactions and lock protocol

Use READ COMMITTED; all freshness/deadline checks use primary `clock_timestamp()` after the final relevant wait. API poolwait≤1s, lockwait≤250ms, statement≤2s, transaction≤3s. The caller decides commit for composed operations. Any mapping/equation/audit failure rolls back the local instruction; already committed provider facts remain.

### Accepted source binding

Select the candidate assignment/default descriptor after Checkout holds its existing Identity user/session SHARE locks and before Cart/Inventory locks. Insert binding only after Checkout has inserted its new Order and holds its attempt, Identity and Inventory locks. Cross-domain FKs acquire only locks already owned by that acceptance transaction. Exact accepted replay bypasses new binding/source checks. Freeze the selected descriptor even if defaults later change.

Protected operator assignment takes the target Customer user row FOR UPDATE through the Identity owner, then performs a trusted ordinary accepted-key read and inserts the immutable assignment only if no acceptance exists. It never locks a Checkout attempt or financial row. Checkout acceptance already holds that user FOR SHARE, so assignment and source selection cannot race: assignment wins before the purchase lock, or waits and rejects after committed acceptance. This reuses the existing lock root and blocks other writes for that Customer during a short, rare setup operation; it changes no Identity fields. No assignment→Identity/Checkout lock path is permitted.

The account gate is rechecked FOR SHARE near acceptance commit, after existing owner locks. Gate mutation transactions lock only the account gate and append an AdmissionChanged audit; they never take payment/Checkout/Order/stock locks. This prevents gate/financial lock inversion. No financial-only operation updates/reinserts cross-domain bindings. Audit order_id is an immutable logical target reference, without an Orders FK that could acquire an Order lock from a financial-only path; it records Admin access even before an intent exists.

### Intent preparation and dispatch

Caller Ensure/Abort inserts payment/work after Order/Inventory locks; local FKs target immutable binding. For missing-intent races, `INSERT ... ON CONFLICT DO NOTHING`, then lock/compare exact mapping. Preparing tombstone/intent insertion uses one owner operation; no provider I/O.

Standalone gate locks payment, then financial work/mutation. Prepared + eligible fresh deadline→Pending, version+1, first-send window/mutation/audit committed. Prepared + expired/abort→Aborted with immutable no-dispatch fact/version/audit. A Pending record never becomes Aborted due to deadline. Missing response remains Pending. Sender rechecks original window/source immediately before each POST in a separate short transaction, releases it, then sends within the two-second envelope. A lease does not prove that old external execution stopped.

AbortUndispatchedOrInspect on an already Pending operation sets the irreversible closure_requested latch and schedules close/inspect; it still returns actual Pending knowledge. Payment creation/confirmation sends and retries also require closure_requested=false and fresh time before the reservation deadline. After either guard closes, a missing ID requires correlation/manual review; do not reissue create-and-confirm merely to obtain an ID. Known-ID cancellation/retrieval/refund retains its own original safety window and recovery policy. First closure instruction advances financial version with ClosureRequested audit; repeat instruction is a no-op.

### New Admin refund and replay

Identity user SHARE → session SHARE → payment UPDATE → existing case → selected refund → financial work. Recheck Identity/role/source/expiry after waits. Read accepted actor/key receipt without locking another payment; immutable exact match returns original receipt. New request checks version/source/capture/hold/available. The existing refund_started latch does not reject further eligible partial Admin refunds; it blocks new purchase confirmation. Insert refund, receipt, provider mutation, reservation delta, work and audit atomically; set refund_started=true/version+1. No postcommit read is needed for 202.

Unique receipt insert races under the same actor/key resolve to one winner. If another payment won, roll back tentative target effects and compare the immutable winning request without taking its parent's lock. A rollback/rejection binds no key. No transaction holds two payment locks to classify key replay.

### Full compensation and failed-allocation replacement

Checkout takes its established four work locks/attempt/Order/Inventory, then payment, case, selected refunds and financial work. Create/replay one case. Compute uncovered `C−S−R` under parent lock; if positive, insert one Prepared compensation allocation with the next persisted generation, increment R and schedule dispatch. Its immutable UUID becomes the refund provider identity; a repeat reuses coverage and never repeats allocation.

If an outstanding Admin allocation fails with an open case, atomically release it, allocate the uncovered gap and preserve `S+R=C`. Compensation failure retains FailedHold. Protected replacement locks payment→case→old refund; verify authoritative terminal failure and original amount, then release FailedHold and insert/reserve one replacement with unique repair UUID/replaces_refund_id and required audit. Exact repair replay checks stored mapping before new guards. Unknown never qualifies. A subsequent failed replacement is repaired through that new row, preserving the whole chain.

For a Succeeded compensation refund's later reversal, decrease S and convert that refund to FailedHold, increasing R by the same amount. For a reversed Admin refund with open case, decrease S and insert a case allocation for the gap. Without a case, a verified reversed Admin refund simply decreases S and becomes Released. Required evidence/proof checks run before any reservation is freed; incomplete failure evidence retains unavailable coverage plus ManualReview.

### Financial observation, facts and wake

Ordinary discovery resolves parent identity; application locks payment → case → selected refunds in UUID order → financial work → selected inbox. Acquire only applicable rows, no broad history lock. Deduplicate normalized effect_key and compare exact existing evidence. On genuine effect, append fact(s), update counters/current projection, version+1 once and required audit; set wake_pending/wake_version to the committed financial version. Repeated observations do not increment version/audit.

Mapped external refund/capture is imported once under parent lock; preserve real evidence even if local Unknown reservations conflict. Set hold instead of silently reducing such reservations. Foreign currency/unmatched/malformed objects are bounded quarantined evidence and cannot masquerade as valid USD capture/refund facts. Unknown-object quarantine has no cross-domain FK or Order effect.

After financial commit, call Checkout wake outside all financial locks. In a later Payments-only transaction clear wake_pending only if its wake_version is the acknowledged version. Newer facts remain pending. Financial-only paths never acquire Order/Checkout/Inventory/Cart locks, including indirect FK interactions.

### Work and inbox claims

```sql
SELECT payment_id
FROM payments.financial_work
WHERE state = 'Scheduled' AND next_action_at <= @database_time
  AND (lease_token IS NULL OR lease_expires_at <= @database_time)
ORDER BY next_action_at, payment_id
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

One-row claim sets a random token/now+30s, increments observations before I/O and commits. A pass claims at most100, only with a free action slot. Application reacquires payment before work and verifies token/deadline after all waits; never keep a work/inbox claim while taking payment. Exhaustion claim releases its lock first, then parent-first rechecks and audits ManualReview. Lease/due bookkeeping does not increment financial version/public timestamps. Any new exposure of ManualReview changes financial version once. Resume/new genuine fact starts an audited new cycle; old duplicate events/unchanged polls cannot reset its budget.

The query above claims recovery work. Retained observation separately discovers scan_due_at candidates in any state, including Idle/ManualReview, then claims the same lease only if free/expired. It advances its persisted scan due/cursor, not the exhausted recovery observation count, and performs read-only provider inspection. Each scan action is still bounded by one page/call, the account permits and pass budget. A failed scan preserves ManualReview and schedules its next scan; it cannot reopen provider mutation or reset the recovery cycle. Only a genuinely new verified fact may wake/reset original recovery. Inbox hints use their own bounded observation counter, so a newly delivered fact can be verified after financial-work exhaustion without reviving old unknown dispatch retries.

Inbox claim follows the same one-row/release pattern. After resolving a mapping, mark Processed only after the hint is durably linked to scheduled financial work or its verified effect/quarantine. A crash after facts before inbox acknowledgement replays safely. Matching duplicates keep the first durable envelope; structural conflicts add quarantine. A different raw formatting digest by itself is not a financial conflict; compare immutable parsed identity/type/object/mode first.

## Reads, indexing and migrations

FinancialView is one owner-scoped primary snapshot with binding/intent/work/optional case; refunds are independently keyset-paged. Admin read audit commits with the authorized read; audit failure returns503. Catalog, address and provider payload are absent. History B-tree supports payment equality plus descending keyset; due partial indexes prevent full history polling. No GIN/GiST/full-text/partitioning index is justified for bounded descriptors consumed by identity.

Review actual `EXPLAIN (ANALYZE, BUFFERS)` for owner lookup, key replay, history, due/scan/wake/inbox paths and aggregate invariant scan on declared data. Limit100 per discovery/scan page; persist continuation; record vacuum/bloat and row estimates. Indexes are not substitutes for parent locks or temporal guards.

An additive migration creates only Payments tables/grants/guards and the Phase07 adapter integration; preserve all earlier schemas/receipts/proofs. No simulator→provider backfill. Review FK lock interactions and committed-binding completeness with Checkout acceptance. Runtime API role gets only required read/refund instruction rights; worker gets narrow projection/work writes and append facts/audit; ingress inserts bounded inbox/quarantine only; operator assigns/resumes/repairs; migration role owns DDL. A shared monolith credential cannot prove process-level isolation, so code module ownership and actual database grants must be reported separately.

Retain accepted bindings, client/provider keys, mutation windows, facts, refunds, receipts/cases and audit with the purchase. No automatic financial/idempotency purge. Inbox/quarantine retention initially also has no deletion job; storage growth is monitored. Future real-user retention/legal policy requires a coordinated design rather than deleting deduplication or recovery evidence independently. Encrypt backups and restrict audit/receipt reasons/source identifiers.
