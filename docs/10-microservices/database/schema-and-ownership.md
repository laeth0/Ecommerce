# Schema, Ownership and Local Transactions

**Status:** target PostgreSQL 18 design for later reviewed EF Core/Npgsql migrations. SQL below specifies new structural invariants; no DDL, grant or migration has been executed.

## Transfer and references

| Database | Retained/moved data | Reference policy |
| --- | --- | --- |
| Commerce | identity, catalog, inventory, cart, orders, checkout, notifications and their existing audits/work/outboxes | Existing local FKs retained |
| Payments | All Phase 07 payments tables except source_assignments, plus Phase 09 payments.outbox | Retain all Payments-local FKs; remove external Identity/Orders/Checkout FKs only after reconciliation |
| Commerce additions | source assignments, integration commands, confirmation decisions, fulfillment handoffs, financial hint inbox, remote recovery intents | Local Checkout/Orders/Identity FKs where applicable |
| Payments additions | immutable descriptors, integration roots/receipts, confirmation holds, deferred observations/control, financial hint outbox, replay receipts | Owner-local FKs and unique mapping guards |

Payments bindings retain payment/attempt/Order/customer/compensation IDs as immutable logical references. refund_receipts.admin_id retains the original actor UUID without an Identity FK. Do not migrate Identity/Orders tables to satisfy obsolete FKs. Service APIs validate mapping; reconciliation detects missing/conflicting remote references.

Old source_assignments are transformed into Commerce assignments plus Payments descriptors, preserving original fixture/request/actor/time and accepted binding choices. Exact provider account/API/payment_method/fingerprint remain in Payments. Add source_descriptor_id to historical bindings only after matching the original fingerprint; it never changes accepted source semantics. Descriptors/assignments use the original five fixture codes and approved StripeSandbox source.

## Commerce coordination additions

Representative exact structural DDL for the durable boundary:

```sql
CREATE TABLE checkout.integration_commands (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL,
    attempt_id uuid REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    admin_id uuid REFERENCES identity.users(id) ON DELETE RESTRICT,
    public_key uuid,
    kind text NOT NULL CHECK (kind IN
        ('InitializePayment','RequestClosure','EnsureCompensation',
         'AcquireConfirmation','ResolveConfirmation','IssueRefund')),
    acceptance_epoch uuid NOT NULL,
    authority_receipt_id uuid UNIQUE,
    canonical_request bytea NOT NULL CHECK (octet_length(canonical_request) BETWEEN 1 AND 8192),
    request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
    state text NOT NULL CHECK (state IN ('Pending','Applied','Rejected','ManualReview')),
    active_key boolean NOT NULL DEFAULT false,
    cycle bigint NOT NULL CHECK (cycle BETWEEN 1 AND 9007199254740991),
    attempts smallint NOT NULL CHECK (attempts BETWEEN 0 AND 10),
    work_version bigint NOT NULL CHECK (work_version BETWEEN 1 AND 9007199254740991),
    next_action_at timestamptz,
    lease_token uuid,
    lease_expires_at timestamptz,
    result bytea CHECK (result IS NULL OR octet_length(result) BETWEEN 1 AND 8192),
    created_at timestamptz NOT NULL,
    CHECK ((kind = 'IssueRefund' AND admin_id IS NOT NULL AND public_key IS NOT NULL
            AND authority_receipt_id IS NOT NULL AND attempt_id IS NOT NULL) OR
           (kind <> 'IssueRefund' AND admin_id IS NULL AND public_key IS NULL
            AND authority_receipt_id IS NULL AND NOT active_key AND attempt_id IS NOT NULL)),
    CHECK (NOT active_key OR kind = 'IssueRefund'),
    CHECK (state <> 'Rejected' OR NOT active_key),
    CHECK (kind <> 'IssueRefund' OR
           (state = 'Rejected' AND NOT active_key) OR
           (state <> 'Rejected' AND active_key)),
    CHECK ((state = 'Pending' AND next_action_at IS NOT NULL) OR
           (state <> 'Pending' AND next_action_at IS NULL)),
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (state = 'Pending' AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)),
    CHECK ((state IN ('Applied','Rejected') AND result IS NOT NULL) OR
           (state IN ('Pending','ManualReview') AND result IS NULL))
);
CREATE UNIQUE INDEX checkout_active_refund_key
    ON checkout.integration_commands (admin_id, public_key) WHERE active_key;
CREATE INDEX checkout_command_due
    ON checkout.integration_commands (next_action_at, id) WHERE state = 'Pending';
CREATE INDEX checkout_command_expired
    ON checkout.integration_commands (lease_expires_at, id) WHERE lease_token IS NOT NULL;

CREATE TABLE checkout.confirmation_decisions (
    confirmation_id uuid PRIMARY KEY,
    attempt_id uuid NOT NULL UNIQUE REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    order_id uuid NOT NULL UNIQUE REFERENCES orders.orders(id) ON DELETE RESTRICT,
    payment_id uuid NOT NULL UNIQUE,
    reservation_id uuid NOT NULL REFERENCES inventory.reservation_groups(id) ON DELETE RESTRICT,
    decision text NOT NULL CHECK (decision IN ('Pending','Committed','Aborted')),
    token uuid,
    capture_fact_id uuid,
    decision_id uuid UNIQUE,
    decided_at timestamptz,
    confirmed_order_version bigint,
    stock_disposition text CHECK (stock_disposition IN ('Consumed','Released','Expired')),
    CHECK ((token IS NULL AND capture_fact_id IS NULL) OR
           (token IS NOT NULL AND capture_fact_id IS NOT NULL)),
    CHECK ((decision = 'Pending' AND decision_id IS NULL AND decided_at IS NULL
            AND confirmed_order_version IS NULL AND stock_disposition IS NULL) OR
           (decision = 'Committed' AND token IS NOT NULL AND capture_fact_id IS NOT NULL
            AND decision_id IS NOT NULL AND decided_at IS NOT NULL
            AND confirmed_order_version IS NOT NULL
            AND confirmed_order_version BETWEEN 1 AND 9007199254740991
            AND stock_disposition IS NOT NULL AND stock_disposition = 'Consumed') OR
           (decision = 'Aborted' AND decision_id IS NOT NULL AND decided_at IS NOT NULL
            AND confirmed_order_version IS NULL AND stock_disposition IS NOT NULL
            AND stock_disposition IN ('Released','Expired')))
);

CREATE TABLE orders.payment_handoffs (
    order_id uuid PRIMARY KEY REFERENCES orders.orders(id) ON DELETE RESTRICT,
    confirmation_id uuid NOT NULL UNIQUE
        REFERENCES checkout.confirmation_decisions(confirmation_id) ON DELETE RESTRICT,
    payment_id uuid NOT NULL UNIQUE,
    release_id uuid UNIQUE,
    released_at timestamptz,
    CHECK ((release_id IS NULL AND released_at IS NULL) OR
           (release_id IS NOT NULL AND released_at IS NOT NULL))
);
```

Receipt/audit fields retain actor, server request ID and authorizedAt with immutable canonical bytes. active_key=true persists for Pending/ManualReview/Applied IssueRefund; only definitive rejected admission releases it. Use a short Identity-protected actor/key serialization transaction: unique conflict retry must inspect exact active command without locking its unrelated payment/Order. The partial unique index is the final race guard; no advisory lock or external distributed lock is required.

Pending confirmation may retain acquired token/proof. Aborted without token is allowed only after a known never-admitted hold result and no unresolved acquisition; it cannot resolve a remote hold. Terminal decisions never change. A protected reconciliation finding a hold against a tokenless abort is an integrity conflict, not automatic release.

Additional Commerce tables, with all columns NOT NULL unless stated:

| Table | Required fields and guards |
| --- | --- |
| checkout.payment_source_assignments | PK(customer_id,checkout_key), local customer FK, source_descriptor_id UUID, source_fingerprint32 bytes, fixture enum, original actor/request/time; immutable per accepted key |
| checkout.payment_source_defaults | PK fixture, registered descriptor UUID/fingerprint; operator updates affect only future unaccepted choices |
| checkout.financial_inbox | PK(source,event_id), source=urn:ecommerce:payments, canonical_body1..8192, digest32, payment/attempt/Order UUID, financial_version1..safe-max, occurred_at/received_at; same-ID bytes compared |
| checkout.financial_hints | PK payment_id, local attempt UNIQUE/FK, highest_hint_version≥1, owner_observed_version≥0, pending boolean, version≥1, updated_at; no event-derived financial fields |
| checkout.integration_quarantine | PK UUID; unique(route,reason,digest); allowed codes, safe nullable reported IDs, created_at, nullable resolution/time; no untrusted body |
| checkout.remote_recovery_operations | PK operation_id, operator/authority/request UUIDs, canonical request≤8192/digest32, target event/digest/version, Pending/Completed/Rejected/ManualReview, owner receipt nullable≤8192, cycle/attempt/lease fields as commands; immutable request and attributed audit |

Commands/recovery operations and hint-transfer passes share existing Checkout action slots/pool; financial_inbox intake uses its explicitly budgeted pool. Due/expired/review indexes mirror integration_commands. Quarantine/replay carries optimistic expected versions; lease-active scheduling intervention conflicts. No additional unbudgeted worker process.

## Payments additions

```sql
CREATE TABLE payments.integration_roots (
    payment_id uuid PRIMARY KEY,
    order_id uuid NOT NULL UNIQUE,
    acceptance_epoch uuid NOT NULL,
    stop_requested boolean NOT NULL DEFAULT false,
    stop_command_id uuid,
    next_observation_sequence bigint NOT NULL CHECK
        (next_observation_sequence BETWEEN 1 AND 9007199254740991),
    created_at timestamptz NOT NULL,
    CHECK ((stop_requested AND stop_command_id IS NOT NULL) OR
           (NOT stop_requested AND stop_command_id IS NULL))
);

CREATE TABLE payments.command_receipts (
    command_id uuid PRIMARY KEY,
    payment_id uuid NOT NULL REFERENCES payments.integration_roots(payment_id) ON DELETE RESTRICT,
    kind text NOT NULL CHECK (kind IN
        ('InitializePayment','RequestClosure','EnsureCompensation',
         'AcquireConfirmation','ResolveConfirmation','IssueRefund')),
    canonical_request bytea NOT NULL CHECK (octet_length(canonical_request) BETWEEN 1 AND 8192),
    request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
    outcome text NOT NULL CHECK (outcome IN ('Applied','Rejected')),
    result bytea NOT NULL CHECK (octet_length(result) BETWEEN 1 AND 8192),
    recorded_at timestamptz NOT NULL
);

CREATE TABLE payments.confirmation_holds (
    confirmation_id uuid PRIMARY KEY,
    payment_id uuid NOT NULL UNIQUE REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    reservation_id uuid NOT NULL,
    token uuid NOT NULL UNIQUE,
    capture_fact_id uuid NOT NULL,
    held_version bigint NOT NULL CHECK (held_version BETWEEN 1 AND 9007199254740991),
    state text NOT NULL CHECK (state IN
        ('Held','Finalizing','ResolvedCommitted','ResolvedAborted')),
    decision_id uuid UNIQUE,
    decision_canonical bytea CHECK
        (decision_canonical IS NULL OR octet_length(decision_canonical) BETWEEN 1 AND 4096),
    decision_kind text CHECK (decision_kind IN ('Committed','Aborted')),
    barrier_sequence bigint CHECK (barrier_sequence BETWEEN 0 AND 9007199254740991),
    release_id uuid UNIQUE,
    created_at timestamptz NOT NULL,
    resolved_at timestamptz,
    FOREIGN KEY (capture_fact_id, payment_id)
        REFERENCES payments.facts(id, payment_id) ON DELETE RESTRICT,
    CHECK ((state = 'Held' AND decision_id IS NULL AND decision_canonical IS NULL
            AND decision_kind IS NULL AND barrier_sequence IS NULL AND resolved_at IS NULL) OR
           (state <> 'Held' AND decision_id IS NOT NULL AND decision_canonical IS NOT NULL
            AND decision_kind IS NOT NULL AND barrier_sequence IS NOT NULL)),
    CHECK ((state IN ('Held','Finalizing') AND resolved_at IS NULL) OR
           (state IN ('ResolvedCommitted','ResolvedAborted') AND resolved_at IS NOT NULL)),
    CHECK (state <> 'ResolvedCommitted' OR decision_kind = 'Committed'),
    CHECK (state <> 'ResolvedAborted' OR decision_kind = 'Aborted'),
    CHECK (release_id IS NULL OR state = 'ResolvedCommitted')
);

CREATE TABLE payments.deferred_observations (
    payment_id uuid NOT NULL REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    sequence bigint NOT NULL CHECK (sequence BETWEEN 1 AND 9007199254740991),
    effect_key varchar(512) COLLATE "C" NOT NULL,
    kind text NOT NULL CHECK (kind IN
        ('Captured','NoCapture','RefundSucceeded','RefundFailed','RefundReversed',
         'Closure','Compensation')),
    canonical_evidence bytea NOT NULL CHECK (octet_length(canonical_evidence) BETWEEN 1 AND 8192),
    evidence_digest bytea NOT NULL CHECK (octet_length(evidence_digest) = 32),
    first_verified_at timestamptz NOT NULL,
    applied_at timestamptz,
    PRIMARY KEY (payment_id, sequence),
    UNIQUE (payment_id, effect_key)
);
CREATE INDEX payments_deferred_unapplied
    ON payments.deferred_observations (payment_id, sequence) WHERE applied_at IS NULL;
```

Create integration_roots before adding the owner-local binding FK to it; populate legacy roots from original mapping. Bindings also gain immutable reservation_id and acceptance_epoch, backfilled from the original accepted attempt/reservation and transfer epoch. Root locks permit a stop tombstone before binding exists. All new roots require an approved fresh acceptance epoch or attributed reconciliation authority. Root mapping/epoch is immutable; stop_requested is monotonic.

source_descriptors: UUID PK, account/API/source/fixture/payment_method with original Phase 07 checks, fingerprint32 unique together with exact canonical descriptor, operator request/actor/time. Compare full canonical fields on digest collision. Descriptor UUID/fingerprint may be exposed to Commerce; method/account material is not returned through runtime APIs. Immutable descriptors reference no Commerce table.

## Exact types for the supporting records

The supporting-table inventory above uses the following target definitions. TEXT code fields use bounded allowlists; arbitrary exception messages are never persisted as codes.

```sql
CREATE TABLE payments.source_descriptors (
    id uuid PRIMARY KEY,
    account_id varchar(255) COLLATE "C" NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]+$'),
    api_version text NOT NULL CHECK (api_version = '2026-09-30.endive'),
    source text NOT NULL CHECK (source = 'StripeSandbox'),
    fixture_code text NOT NULL CHECK (fixture_code IN
        ('Success','Decline','ActionRequired','PendingRefund','RefundFailure')),
    payment_method varchar(255) COLLATE "C" NOT NULL
        CHECK (payment_method ~ '^pm_[A-Za-z0-9_]+$'),
    fingerprint bytea NOT NULL UNIQUE CHECK (octet_length(fingerprint) = 32),
    canonical_descriptor bytea NOT NULL CHECK (octet_length(canonical_descriptor) BETWEEN 1 AND 4096),
    operator_subject varchar(128) NOT NULL CHECK (length(operator_subject) > 0),
    request_id uuid NOT NULL UNIQUE,
    created_at timestamptz NOT NULL
);

CREATE TABLE checkout.payment_source_assignments (
    customer_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    checkout_key uuid NOT NULL,
    source_descriptor_id uuid NOT NULL,
    source_fingerprint bytea NOT NULL CHECK (octet_length(source_fingerprint) = 32),
    fixture_code text NOT NULL CHECK (fixture_code IN
        ('Success','Decline','ActionRequired','PendingRefund','RefundFailure')),
    operator_subject varchar(128) NOT NULL CHECK (length(operator_subject) > 0),
    request_id uuid NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (customer_id, checkout_key)
);
CREATE TABLE checkout.payment_source_defaults (
    fixture_code text PRIMARY KEY CHECK (fixture_code IN
        ('Success','Decline','ActionRequired','PendingRefund','RefundFailure')),
    source_descriptor_id uuid NOT NULL,
    source_fingerprint bytea NOT NULL CHECK (octet_length(source_fingerprint) = 32),
    updated_at timestamptz NOT NULL
);

CREATE TABLE checkout.financial_inbox (
    source varchar(32) COLLATE "C" NOT NULL CHECK (source = 'urn:ecommerce:payments'),
    event_id uuid NOT NULL,
    canonical_body bytea NOT NULL CHECK (octet_length(canonical_body) BETWEEN 1 AND 8192),
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    payment_id uuid NOT NULL,
    attempt_id uuid NOT NULL REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    order_id uuid NOT NULL REFERENCES orders.orders(id) ON DELETE RESTRICT,
    financial_version bigint NOT NULL CHECK (financial_version BETWEEN 1 AND 9007199254740991),
    occurred_at timestamptz NOT NULL,
    received_at timestamptz NOT NULL,
    PRIMARY KEY (source, event_id),
    CHECK (occurred_at <= received_at + interval '30 seconds')
);
CREATE TABLE checkout.financial_hints (
    payment_id uuid PRIMARY KEY,
    attempt_id uuid NOT NULL UNIQUE REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    highest_hint_version bigint NOT NULL CHECK (highest_hint_version BETWEEN 1 AND 9007199254740991),
    owner_observed_version bigint NOT NULL CHECK (owner_observed_version BETWEEN 0 AND 9007199254740991),
    pending boolean NOT NULL,
    version bigint NOT NULL CHECK (version BETWEEN 1 AND 9007199254740991),
    updated_at timestamptz NOT NULL
);
CREATE INDEX checkout_hint_pending ON checkout.financial_hints (updated_at, payment_id) WHERE pending;

CREATE TABLE checkout.integration_quarantine (
    id uuid PRIMARY KEY,
    route_code text NOT NULL CHECK (route_code IN ('FinancialRoute','Parking','Unknown')),
    reason_code text NOT NULL CHECK (reason_code IN
        ('Malformed','UnsupportedSchema','SourceMismatch','IdentityConflict',
         'FutureTime','MissingMapping','MissingRestoredSource','ConflictingRestoredSource','ParkingReview')),
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    reported_event_id uuid,
    reported_payment_id uuid,
    created_at timestamptz NOT NULL,
    work_version bigint NOT NULL CHECK (work_version BETWEEN 1 AND 9007199254740991),
    resolution text CHECK (resolution IN ('Replayed','DiscardInvalid','SkipValid')),
    resolved_at timestamptz,
    UNIQUE (route_code, reason_code, body_digest),
    CHECK ((resolution IS NULL AND resolved_at IS NULL) OR
           (resolution IS NOT NULL AND resolved_at IS NOT NULL AND resolved_at >= created_at))
);
CREATE INDEX checkout_quarantine_open ON checkout.integration_quarantine (created_at, id)
    WHERE resolution IS NULL;

CREATE TABLE checkout.remote_recovery_operations (
    operation_id uuid PRIMARY KEY,
    operator_id uuid NOT NULL,
    authority_receipt_id uuid NOT NULL UNIQUE,
    request_id uuid NOT NULL,
    canonical_request bytea NOT NULL CHECK (octet_length(canonical_request) BETWEEN 1 AND 8192),
    request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
    target_event_id uuid NOT NULL,
    target_digest bytea NOT NULL CHECK (octet_length(target_digest) = 32),
    expected_work_version bigint NOT NULL CHECK (expected_work_version BETWEEN 1 AND 9007199254740991),
    state text NOT NULL CHECK (state IN ('Pending','Completed','Rejected','ManualReview')),
    result bytea CHECK (result IS NULL OR octet_length(result) BETWEEN 1 AND 8192),
    cycle bigint NOT NULL CHECK (cycle BETWEEN 1 AND 9007199254740991),
    attempts smallint NOT NULL CHECK (attempts BETWEEN 0 AND 10),
    work_version bigint NOT NULL CHECK (work_version BETWEEN 1 AND 9007199254740991),
    next_action_at timestamptz,
    lease_token uuid,
    lease_expires_at timestamptz,
    created_at timestamptz NOT NULL,
    CHECK ((state = 'Pending' AND next_action_at IS NOT NULL) OR
           (state <> 'Pending' AND next_action_at IS NULL)),
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (state = 'Pending' AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)),
    CHECK ((state IN ('Completed','Rejected') AND result IS NOT NULL) OR
           (state IN ('Pending','ManualReview') AND result IS NULL))
);
CREATE INDEX checkout_remote_recovery_due
    ON checkout.remote_recovery_operations (next_action_at, operation_id) WHERE state = 'Pending';
CREATE INDEX checkout_remote_recovery_expired
    ON checkout.remote_recovery_operations (lease_expires_at, operation_id) WHERE lease_token IS NOT NULL;

CREATE TABLE payments.outbox_replay_receipts (
    operation_id uuid PRIMARY KEY,
    operator_id uuid NOT NULL,
    request_id uuid NOT NULL,
    event_id uuid NOT NULL,
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    canonical_request bytea NOT NULL CHECK (octet_length(canonical_request) BETWEEN 1 AND 8192),
    request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
    result bytea NOT NULL CHECK (octet_length(result) BETWEEN 1 AND 8192),
    recorded_at timestamptz NOT NULL
);

CREATE TABLE checkout.boundary_audit (
    id uuid PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN
        ('RefundAuthorized','LegacyRefundImported','CommandResult','ConfirmationPending',
         'ConfirmationDecided','FulfillmentReleased','RemoteReplayAuthorized','RemoteReplayResult',
         'SourceAssigned','EpochChanged','IntegrityReconciled')),
    actor_kind text NOT NULL CHECK (actor_kind IN ('Admin','Checkout','Worker','Operator')),
    actor_id varchar(128) NOT NULL CHECK (length(actor_id) > 0),
    request_id uuid NOT NULL,
    attempt_id uuid REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    command_id uuid,
    reason text CHECK (reason IS NULL OR
        (char_length(reason) BETWEEN 1 AND 256 AND octet_length(reason) <= 1024)),
    occurred_at timestamptz NOT NULL
);
CREATE INDEX checkout_boundary_audit_history
    ON checkout.boundary_audit (attempt_id, occurred_at, id);

CREATE TABLE checkout.runtime_epochs (
    singleton smallint PRIMARY KEY CHECK (singleton = 1),
    active_epoch uuid NOT NULL UNIQUE,
    paired_configuration_fingerprint bytea NOT NULL
        CHECK (octet_length(paired_configuration_fingerprint) = 32),
    recovery_mode boolean NOT NULL,
    changed_at timestamptz NOT NULL
);
CREATE TABLE payments.runtime_epochs (
    singleton smallint PRIMARY KEY CHECK (singleton = 1),
    active_epoch uuid NOT NULL UNIQUE,
    paired_configuration_fingerprint bytea NOT NULL
        CHECK (octet_length(paired_configuration_fingerprint) = 32),
    recovery_mode boolean NOT NULL,
    changed_at timestamptz NOT NULL
);
```

Execute each owner's definitions in its own database during the reviewed implementation migration. No SQL block authorizes a cross-database reference or Checkout schema access at Payments.

Add local FK integration_commands.authority_receipt_id and remote_recovery_operations.authority_receipt_id → boundary_audit.id with DEFERRABLE INITIALLY DEFERRED for atomic authority/audit creation. Exact command/audit linkage and legacy-import distinction are validated before commit. Audits/requests/results are append-only; runtime updates only permitted work fields.

Extend payments.audit.kind CHECK preserving every old kind and adding SourceRegistered, CommandApplied, CommandRejected, ConfirmationHeld, ConfirmationDecisionRecorded, ConfirmationResolved, FulfillmentReleased, DeferredObserved, OutboxReplay, EpochChanged and IntegrityReconciled. Add nullable integration_command_id UUID FK to payments.command_receipts.command_id for command-associated audit; prebinding audit leaves payment_id NULL and retains original order_id/command linkage. Update all audit producers/readers and version fingerprints within Phase10's future implementation.

New binding descriptor/reservation/acceptance fields are immutable; descriptor ID FK is Payments-local. Hint inbox body/mapping, authority/audit, replay receipts, terminal decisions and deferred evidence cannot be deleted/rewritten by runtime. Operator grants permit only attributed guarded transitions; migration owns DDL.

The new hint outbox uses the exact typed transport column/check/index definition linked from Phase09, with its separately stated financial-hint CHECK/uniqueness/local intent FK. Runtime grants allow immutable envelope insertion and guarded work-column updates; no original body/time/source/ID rewrite. Record table inventory/counts/fingerprints after adding all supporting tables and audit constraints.

integration_outbox: same transport/lease columns/checks/indexes as Phase 09 payments.outbox, but source=urn:ecommerce:payments, type=com.ecommerce.payments.financial-changed.v1 and UNIQUE(aggregate_id,aggregate_version). Build separately so the refund-only CHECK is not inherited. FK aggregate_id to owner intent; event_id is a new UUID. Never change the old outbox's refund-only constraint or add aggregate/version uniqueness to refund facts.

outbox_replay_receipts: PK operation UUID, exact canonical request≤8192/digest32, target ID/digest, immutable result≤8192 and operator/request/authority/time. Effect/audit/receipt commits atomically at Payments. runtime_epochs: current active UUID, paired release/config version and recovery mode, updated by protected operations; exact one active row. Add corresponding Commerce epoch state. Epoch updates are containment changes, not history rewrites.

Deferred evidence is normalized mapped effects/control only: stable effect key, amount/currency, safe provider object/adjustment references, prior fact identity and first verification provenance. No raw Stripe object/PII. Max20 effects per retrieval/application pass, each≤8192 bytes/depth8. A multi-effect canonical observation is admitted/staged atomically; insufficient capacity retains durable original inbox/work and prevents acknowledgement of application. No effect is marked applied before its owner fact/projection/audit/outboxes commit.

## Locks, transactions and integrity guards

**Commerce:** fresh Identity locks for new human intent → four work rows CartCleanup/Cancellation/Compensation/Purchase → attempt → Order → sorted Inventory group/stock → selected coordination rows → audit/outbox. Original ordinary module paths retain their local order. Standalone claims/intake commits release locks before entering this graph. A financial hint never locks a Checkout parent while retaining an inbox lock.

Admin refund authorization is a separate short Identity → actor/key-slot → command/audit transaction. It reads immutable Order/attempt/source mapping and takes no Checkout work, mutable Order or Inventory locks; refunds have no lifecycle cutoff. Worker command-result application enters the parent graph above. This exception avoids inventing a cross-owner transaction or reversing Checkout locks.

**Payments:** integration root → intent → confirmation hold → compensation case → refund rows sorted UUID → mutation/facts/deferred/work → audit/outboxes/receipt. Preserve the old case-before-refund rule; add root/hold ahead of it. Child work is claimed/committed first, then reacquire parent graph for application. Private receipt lookups may read without owner write locks; new admission and duplicate conflict resolution require the parent graph.

Every owner path including Admin, executor, scan, webhook application, repair and compensation must check the root/hold. A missed path defeats serialization. Work leases fence only local result application; original provider operation identity still owns uncertain external effects.

Business transactions≤3s, lock wait≤250ms, command≤2s and pool wait≤1s. No live transaction/connection crosses HTTP, broker confirm or Stripe I/O. `clock_timestamp()` on the primary determines deadlines; recheck after waits. Versions/sequences cannot wrap; exhaustion gives integrity hold/503.

Ordinary owner writes use READ COMMITTED with the explicit row locks/unique guards above. Multi-query financial reads use one bounded REPEATABLE READ snapshot; a required Admin audit makes it read-write rather than read-only. A single statement can provide an equivalent joined snapshot. SERIALIZABLE cannot make separate databases/RPC atomic. A confirmed local40P01/40001 rollback may retry that whole local transaction at most once within the original remaining deadline; no retry encloses remote/provider I/O or invents a new mutation key.

On Confirmed transition verify exact admitted capture token/amount/mapping, actual Consume and local terminal decision together. Payments coverage equations retain Phase 07 integrity-hold exception; no stale Commerce balance decides allocation. Hold release requires drained finite barrier, exact decision and no integrity hold; no SQL row CHECK alone proves it.

## Growth and verification

Retain coordination commands, receipts, decisions, tombstones, source descriptors, deferred evidence and outbox/dedup records with their original financial history. No automatic retention deletion, TTL-based tombstone expiry or orphan cascade. Measure count/bytes and oldest due/review age with keyset/indexed queries.

Inventory all modified FKs and grants before migration; inspect generated SQL/snapshot for drops/cascades/enum mismatch. Verify constraints, root/hold lock graph, race guards, same-ID canonical conflicts, stale leases and crash boundaries in the implementation evidence. Static documentation does not establish executable DDL correctness.
