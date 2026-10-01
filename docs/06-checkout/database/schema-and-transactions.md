# Checkout Schema and Transactions

**Status:** proposed PostgreSQL 18 DDL/protocol for a reviewed EF Core/Npgsql migration. No SQL, migration, lock or lease has been executed. [Workflows](../functional-requirements/checkout-workflows.md) and [financial owner](../functional-requirements/payment-boundary-and-simulator.md) provide the semantic obligations.

## Checkout-owned persistence

Quotes retain a bounded canonical preview. Accepted attempts retain immutable identity/receipt and historical outcome. Four work rows per accepted attempt cover Purchase, Cancellation, Compensation and CartCleanup; all four exist at acceptance, with only Purchase Scheduled. This fixed set permits ordered locking before the attempt, including when one step schedules another. Audit is append-only.

```sql
CREATE SCHEMA IF NOT EXISTS checkout;

CREATE TABLE checkout.quotes (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    cart_version bigint NOT NULL CHECK (cart_version BETWEEN 1 AND 9007199254740991),
    line_count integer NOT NULL CHECK (line_count BETWEEN 1 AND 20),
    quoted_lines jsonb NOT NULL CHECK (jsonb_typeof(quoted_lines) = 'array'
        AND jsonb_array_length(quoted_lines) BETWEEN 1 AND 20
        AND octet_length(quoted_lines::text) <= 32768),
    shipping_address jsonb NOT NULL CHECK (jsonb_typeof(shipping_address) = 'object'
        AND shipping_address->>'countryCode' IS NOT NULL
        AND shipping_address->>'countryCode' = 'US'
        AND octet_length(shipping_address::text) <= 8192),
    currency_code varchar(3) COLLATE "C" NOT NULL CHECK (currency_code = 'USD'),
    items_subtotal_minor bigint NOT NULL CHECK (items_subtotal_minor BETWEEN 1 AND 199999998000),
    shipping_minor bigint NOT NULL CHECK (shipping_minor = 500),
    tax_minor bigint NOT NULL CHECK (tax_minor = 0),
    total_minor bigint NOT NULL CHECK (total_minor BETWEEN 501 AND 199999998500
        AND total_minor = items_subtotal_minor + shipping_minor + tax_minor),
    policy_id text NOT NULL CHECK (policy_id = 'sandbox-us-v1'),
    policy_fingerprint bytea NOT NULL CHECK (octet_length(policy_fingerprint) = 32),
    quote_fingerprint bytea NOT NULL CHECK (octet_length(quote_fingerprint) = 32),
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    CHECK (expires_at = created_at + interval '300 seconds'),
    CHECK (accepted_at IS NULL OR (accepted_at >= created_at AND accepted_at < expires_at))
);

CREATE TABLE checkout.attempts (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    idempotency_key uuid NOT NULL,
    quote_id uuid NOT NULL,
    request_fingerprint bytea NOT NULL CHECK (octet_length(request_fingerprint) = 32),
    stage text NOT NULL CHECK (stage IN ('Preparing','Accepted')),
    payment_operation_id uuid NOT NULL UNIQUE,
    compensation_operation_id uuid NOT NULL UNIQUE,
    cancellation_resolution_id uuid NOT NULL UNIQUE,
    payment_mode text NOT NULL CHECK (payment_mode IN ('Simulated','Sandbox')),
    simulation_scenario text,
    accepted_cart_version bigint,
    order_id uuid UNIQUE REFERENCES orders.orders(id) ON DELETE RESTRICT,
    reservation_id uuid UNIQUE REFERENCES inventory.reservation_groups(id) ON DELETE RESTRICT,
    reservation_expires_at timestamptz,
    currency_code varchar(3) COLLATE "C",
    total_minor bigint,
    accepted_at timestamptz,
    purchase_outcome text,
    cart_cleanup_status text NOT NULL CHECK (cart_cleanup_status IN ('NotEligible','Pending','Cleared','Skipped')),
    stock_loss_reason text CHECK (stock_loss_reason IN ('Expired','Released')),
    stock_loss_observed_at timestamptz,
    version bigint NOT NULL CHECK (version BETWEEN 0 AND 9007199254740991),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE (customer_id, idempotency_key),
    CHECK ((payment_mode = 'Simulated' AND simulation_scenario IS NOT NULL AND
              simulation_scenario IN ('Success','Decline','TimeoutThenSuccess','DelayedSuccessBeyondExpiry','NeverResolves','RefundFails')) OR
           (payment_mode = 'Sandbox' AND simulation_scenario IS NULL)),
    CHECK ((stage = 'Preparing' AND version = 0 AND accepted_cart_version IS NULL
              AND order_id IS NULL AND reservation_id IS NULL AND reservation_expires_at IS NULL
              AND currency_code IS NULL AND total_minor IS NULL AND accepted_at IS NULL
              AND purchase_outcome IS NULL AND cart_cleanup_status = 'NotEligible') OR
           (stage = 'Accepted' AND version >= 1 AND accepted_cart_version IS NOT NULL
              AND accepted_cart_version BETWEEN 1 AND 9007199254740991
              AND order_id IS NOT NULL AND reservation_id IS NOT NULL AND reservation_expires_at IS NOT NULL
              AND currency_code IS NOT NULL AND currency_code = 'USD'
              AND total_minor IS NOT NULL AND total_minor BETWEEN 501 AND 199999998500
              AND accepted_at IS NOT NULL AND accepted_at >= created_at
              AND reservation_expires_at > accepted_at
              AND purchase_outcome IS NOT NULL AND purchase_outcome IN ('Pending','Confirmed','Failed','Cancelled'))),
    CHECK ((purchase_outcome = 'Confirmed' AND cart_cleanup_status IN ('Pending','Cleared','Skipped')) OR
           ((purchase_outcome IS NULL OR purchase_outcome <> 'Confirmed') AND cart_cleanup_status = 'NotEligible')),
    CHECK ((stock_loss_reason IS NULL AND stock_loss_observed_at IS NULL) OR
           (stock_loss_reason IS NOT NULL AND stock_loss_observed_at IS NOT NULL AND stock_loss_observed_at >= created_at)),
    CHECK (updated_at >= created_at AND (accepted_at IS NULL OR updated_at >= accepted_at)
           AND (stock_loss_observed_at IS NULL OR updated_at >= stock_loss_observed_at))
);

CREATE UNIQUE INDEX checkout_one_accepted_quote
    ON checkout.attempts (quote_id) WHERE stage = 'Accepted';

CREATE FUNCTION checkout.protect_attempt_identity() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF ROW(NEW.id, NEW.customer_id, NEW.idempotency_key, NEW.quote_id,
           NEW.request_fingerprint, NEW.payment_operation_id,
           NEW.compensation_operation_id, NEW.cancellation_resolution_id,
           NEW.payment_mode, NEW.simulation_scenario, NEW.created_at)
       IS DISTINCT FROM
       ROW(OLD.id, OLD.customer_id, OLD.idempotency_key, OLD.quote_id,
           OLD.request_fingerprint, OLD.payment_operation_id,
           OLD.compensation_operation_id, OLD.cancellation_resolution_id,
           OLD.payment_mode, OLD.simulation_scenario, OLD.created_at)
       OR (OLD.stage = 'Accepted' AND
           ROW(NEW.stage, NEW.accepted_cart_version, NEW.order_id,
               NEW.reservation_id, NEW.reservation_expires_at,
               NEW.currency_code, NEW.total_minor, NEW.accepted_at)
           IS DISTINCT FROM
           ROW(OLD.stage, OLD.accepted_cart_version, OLD.order_id,
               OLD.reservation_id, OLD.reservation_expires_at,
               OLD.currency_code, OLD.total_minor, OLD.accepted_at)) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'Checkout attempt identity is immutable';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER checkout_attempt_identity_immutable
BEFORE UPDATE ON checkout.attempts
FOR EACH ROW EXECUTE FUNCTION checkout.protect_attempt_identity();

CREATE TABLE checkout.work (
    attempt_id uuid NOT NULL REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    kind text NOT NULL CHECK (kind IN ('CartCleanup','Cancellation','Compensation','Purchase')),
    state text NOT NULL CHECK (state IN ('Scheduled','Idle','ManualReview')),
    step_attempts integer NOT NULL CHECK (step_attempts BETWEEN 0 AND 10),
    next_action_at timestamptz,
    lease_token uuid,
    lease_expires_at timestamptz,
    last_error text CHECK (last_error IN ('UnknownPayment','DependencyUnavailable','IntegrityViolation','CompensationFailed','RetryExhausted')),
    last_payment_fact_id uuid,
    last_refund_fact_id uuid,
    last_cancellation_at timestamptz,
    changed_at timestamptz NOT NULL,
    PRIMARY KEY (attempt_id, kind),
    CHECK ((state = 'Scheduled' AND next_action_at IS NOT NULL) OR
           (state IN ('Idle','ManualReview') AND next_action_at IS NULL AND lease_token IS NULL AND lease_expires_at IS NULL)),
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (lease_token IS NOT NULL AND lease_expires_at IS NOT NULL AND state = 'Scheduled')),
    CHECK (state <> 'ManualReview' OR last_error IS NOT NULL)
);

CREATE TABLE checkout.progress_audit (
    id uuid PRIMARY KEY,
    attempt_id uuid NOT NULL REFERENCES checkout.attempts(id) ON DELETE RESTRICT,
    kind text NOT NULL CHECK (kind IN ('Accepted','Outcome','WorkState','CartCleanup','Resume')),
    work_kind text CHECK (work_kind IN ('CartCleanup','Cancellation','Compensation','Purchase')),
    attempt_version bigint NOT NULL CHECK (attempt_version BETWEEN 1 AND 9007199254740991),
    actor_kind text NOT NULL CHECK (actor_kind IN ('Customer','Worker','Operator')),
    actor_user_id uuid,
    source_id uuid,
    request_id uuid NOT NULL,
    before_outcome text,
    after_outcome text NOT NULL CHECK (after_outcome IN ('Pending','Confirmed','Failed','Cancelled')),
    before_work_state text,
    after_work_state text,
    reason text,
    occurred_at timestamptz NOT NULL,
    CHECK ((actor_kind = 'Customer' AND actor_user_id IS NOT NULL AND source_id IS NULL) OR
           (actor_kind IN ('Worker','Operator') AND actor_user_id IS NULL AND source_id IS NOT NULL)),
    CHECK ((actor_kind = 'Operator' AND reason IS NOT NULL AND char_length(reason) BETWEEN 1 AND 256 AND octet_length(reason) <= 1024) OR
           (actor_kind <> 'Operator' AND reason IS NULL))
);

CREATE UNIQUE INDEX checkout_attempt_version_audit
    ON checkout.progress_audit (attempt_id, attempt_version)
    WHERE kind IN ('Accepted','Outcome','CartCleanup');
CREATE INDEX checkout_quote_cleanup ON checkout.quotes (expires_at, id) WHERE accepted_at IS NULL;
CREATE INDEX checkout_due_work ON checkout.work (next_action_at, attempt_id, kind) WHERE state = 'Scheduled';
CREATE INDEX checkout_manual_review ON checkout.work (changed_at, attempt_id, kind) WHERE state = 'ManualReview';
CREATE INDEX checkout_audit_history ON checkout.progress_audit (attempt_id, occurred_at, id);
```

The Order/reservation unique constraints already index those lookup columns. Do not add duplicate indexes for those access paths; [index review](../performance-and-scalability/capacity-and-contention.md) verifies the actual plans.

Quotes intentionally have no Cart FK; persistent version/lines are verified through Cart. Attempts have no quote FK: exact key replay uses immutable receipt fields independently, and expired unused quote cleanup must not lock a replaying attempt. Used quotes are retained with the purchase. The before-update trigger preserves original key/source identity and accepted receipt even though the API needs initial Preparing→Accepted UPDATE permission. Ordinary column grants cannot distinguish those two row states; this concrete guard adds migration/server-code review and must be exercised on PostgreSQL. Mutable outcome/cleanup/work metadata still uses owner guards. Review [PostgreSQL trigger behavior](https://www.postgresql.org/docs/18/plpgsql-trigger.html).

No Preparing attempt may commit; the application only commits Accepted/all four work rows or rolls back. DDL row checks/immutability guard cannot guarantee that commit rule, quote/owner/reservation/Order mappings, line count/sum, JSON field shapes/canonical values, four-row completeness, real financial proof, transition legality or audit completeness. Enforce those through owner operations and narrow grants; inspect actual migrations and [PostgreSQL constraint semantics](https://www.postgresql.org/docs/18/ddl-constraints.html), including nullable CHECK behavior.

## Simulator-owned persistence

Only the isolated financial adapter/operator writes this schema. No provider table is introduced. Stable Order/attempt references are validated by the owner; deliberately omit FKs back to Checkout/Orders so a financial-only transaction cannot acquire a reverse parent lock while a coordinator holds those parents and waits for financial rows.

```sql
CREATE SCHEMA IF NOT EXISTS checkout_simulator;

CREATE TABLE checkout_simulator.scenario_assignments (
    customer_id uuid NOT NULL,
    idempotency_key uuid NOT NULL,
    scenario text NOT NULL CHECK (scenario IN ('Success','Decline','TimeoutThenSuccess','DelayedSuccessBeyondExpiry','NeverResolves','RefundFails')),
    operator_request_id uuid NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (customer_id, idempotency_key)
);

CREATE TABLE checkout_simulator.payment_intents (
    operation_id uuid PRIMARY KEY,
    attempt_id uuid NOT NULL UNIQUE,
    order_id uuid NOT NULL UNIQUE,
    amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 501 AND 199999998500),
    currency_code varchar(3) COLLATE "C" NOT NULL CHECK (currency_code = 'USD'),
    scenario text NOT NULL CHECK (scenario IN ('Success','Decline','TimeoutThenSuccess','DelayedSuccessBeyondExpiry','NeverResolves','RefundFails')),
    reservation_expires_at timestamptz NOT NULL,
    state text NOT NULL CHECK (state IN ('Prepared','Pending','Captured','Rejected','Aborted')),
    created_at timestamptz NOT NULL,
    dispatched_at timestamptz,
    outcome_due_at timestamptz,
    outcome_at timestamptz,
    evidence_id uuid UNIQUE,
    CHECK (
      (state = 'Prepared' AND dispatched_at IS NULL AND outcome_due_at IS NULL AND outcome_at IS NULL AND evidence_id IS NULL) OR
      (state = 'Pending' AND dispatched_at IS NOT NULL AND outcome_at IS NULL AND evidence_id IS NULL) OR
      (state IN ('Captured','Rejected') AND dispatched_at IS NOT NULL AND outcome_at IS NOT NULL AND evidence_id IS NOT NULL) OR
      (state = 'Aborted' AND dispatched_at IS NULL AND outcome_due_at IS NULL AND outcome_at IS NOT NULL AND evidence_id IS NOT NULL)
    ),
    CHECK (dispatched_at IS NULL OR dispatched_at >= created_at),
    CHECK (outcome_due_at IS NULL OR (dispatched_at IS NOT NULL AND outcome_due_at >= dispatched_at)),
    CHECK (outcome_at IS NULL OR (outcome_at >= created_at AND (dispatched_at IS NULL OR outcome_at >= dispatched_at)))
);

CREATE TABLE checkout_simulator.refund_intents (
    operation_id uuid PRIMARY KEY,
    payment_operation_id uuid NOT NULL UNIQUE
        REFERENCES checkout_simulator.payment_intents(operation_id) ON DELETE RESTRICT,
    amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 501 AND 199999998500),
    currency_code varchar(3) COLLATE "C" NOT NULL CHECK (currency_code = 'USD'),
    reason text NOT NULL CHECK (reason IN ('Cancellation','StockLost','LateCapture')),
    state text NOT NULL CHECK (state IN ('Prepared','Pending','Succeeded','Failed')),
    created_at timestamptz NOT NULL,
    dispatched_at timestamptz,
    outcome_due_at timestamptz,
    outcome_at timestamptz,
    evidence_id uuid UNIQUE,
    CHECK (
      (state = 'Prepared' AND dispatched_at IS NULL AND outcome_due_at IS NULL AND outcome_at IS NULL AND evidence_id IS NULL) OR
      (state = 'Pending' AND dispatched_at IS NOT NULL AND outcome_due_at IS NOT NULL AND outcome_at IS NULL AND evidence_id IS NULL) OR
      (state IN ('Succeeded','Failed') AND dispatched_at IS NOT NULL AND outcome_due_at IS NOT NULL AND outcome_at IS NOT NULL AND evidence_id IS NOT NULL)
    ),
    CHECK (dispatched_at IS NULL OR dispatched_at >= created_at),
    CHECK (outcome_due_at IS NULL OR (dispatched_at IS NOT NULL AND outcome_due_at >= dispatched_at)),
    CHECK (outcome_at IS NULL OR (outcome_at >= created_at AND dispatched_at IS NOT NULL AND outcome_at >= dispatched_at))
);

CREATE INDEX simulation_payments_due ON checkout_simulator.payment_intents (outcome_due_at, operation_id)
    WHERE state = 'Pending' AND outcome_due_at IS NOT NULL;
CREATE INDEX simulation_refunds_due ON checkout_simulator.refund_intents (outcome_due_at, operation_id)
    WHERE state = 'Pending';
```

The adapter enforces plan timing, immutable mapping, terminal proof once, and refund amount = actual Captured payment amount under the payment lock. DDL does not enforce that cross-row equality/source legality. Terminal proof uses actual materialization database time ≥planned due time; dispatch/due are preserved across replay. NeverResolves has no due timestamp; other Pending scenarios require their specified due time through owner validation. Operator assignments are immutable; accepted attempt freezes its selected scenario, including default Success, so later assignment/config changes cannot rewrite it. Scenario assignment is a protected local operator operation, unavailable to the API runtime's public paths.

Assignment and acceptance serialize through the existing Identity lock root. The operator obtains the target Customer user row FOR UPDATE through Identity, validates the target role, reads the Customer/key acceptance through Checkout's trusted ordinary lookup, and inserts an assignment only if no accepted binding exists. It does not change Identity fields or lock a Checkout attempt/work/financial row. Acceptance already holds that user FOR SHARE before selecting its scenario/default. If assignment wins, acceptance freezes that plan; if acceptance commits first, the waiting assignment rejects. Rollback of acceptance leaves an unused key eligible for assignment. Never acquire the Identity root after locking an assignment row. This is the same protocol used for Phase 07 provider fixture assignment.

## Canonical identities

All hashes are SHA-256 of compact UTF-8 JSON with direct Unicode, only JSON-required escapes, canonical integer decimal syntax and explicit nulls. Normalize text using Orders rules first; IDs/times are canonical. Always compare canonical source values as well as fingerprints; a hash collision cannot permit changed intent.

| Identity | Exact member order/content |
| --- | --- |
| Submission fingerprint | v(1), operation(`AcceptQuote`), customerId, quoteId; Idempotency-Key is the separate unique binding |
| Policy fingerprint | v(1), policyId(`sandbox-us-v1`), currency(`USD`), minorUnits(2), allowedCountries([`US`]), shippingMinor(500), taxMode(`Simulated`), taxBasisPoints(0) |
| Quote fingerprint | v(1), customerId, cartVersion, lines, shippingAddress, totals, policyFingerprint(lowercase hex); exclude quote ID/times/acceptance |

Quote lines are sorted UUIDs with productId, sku, name, quantity, unitPriceMinor, lineSubtotalMinor. Address member order and total scalar order match [Orders canonical creation](../../05-orders/database/schema-and-transactions.md#canonical-creation-identity). Inventory intent is attempt.id; all financial/resolution operation UUIDs are server-created once in the attempt. Public keys, request correlation IDs and financial operation IDs are distinct. Receipt serialization uses only immutable accepted columns; current outcome and quote expiry never rewrite it.

## Transactions and lock order

Use primary READ COMMITTED, one connection/caller transaction, lock wait 250 ms, statement deadline two seconds, transaction deadline three seconds and request deadline ten seconds. No external wait/provider call occurs inside these transactions. Recheck fresh `clock_timestamp()` after final waits for Identity, quote, reservation and lease decisions. Commands must not continue in an aborted transaction. Shared EF contexts use the same connection/transaction and execute sequentially.

| Path | Required acquisition order |
| --- | --- |
| Preview | Identity user FOR SHARE → session FOR SHARE → Cart parent → ordinary Catalog batch → insert new quote |
| New acceptance | Identity user/session → preparing attempt → owner quote FOR UPDATE → Cart parent → Inventory group → sorted Catalog products/categories → sorted stock → insert new Order → fill attempt/quote/audit/new four work rows |
| Exact acceptance replay | Identity user/session → Customer/key attempt FOR UPDATE → immutable receipt comparison; no existing work/quote/Cart/Order/Inventory locks |
| Work claim | One due work row FOR UPDATE SKIP LOCKED; update lease and commit; no attempt/owner lock |
| Worker application/wake/operator resume | All four existing work rows in fixed kind order → attempt FOR UPDATE → any required existing Order → Inventory group/stock → financial payment/refund; no Cart afterward |
| Cart cleanup | All four work rows → attempt → Cart parent; no existing Order/Inventory/financial locks |
| Financial-only dispatch/settlement | Payment → its refund if needed; never Checkout/Orders/Cart/Inventory under these locks |
| Quote cleanup | Expired unused quote row only; no attempt/Cart/Order lock |

Fixed work order is CartCleanup, Cancellation, Compensation, Purchase. Acquire individually in this order or use an explicit CASE rank; do not infer it from locale-dependent text sorting. Applying a claimed job MUST start with that full ordered set, not lock its claimed kind first and later request another row. Never acquire an existing work row after the attempt. This prevents Purchase holding attempt while waiting for Compensation work whose worker is waiting for that attempt. Initial acceptance inserts new work rows only; replay never schedules existing work. Every wake/resume follows the same ordered set, validates trusted mapping/input markers and commits before a worker external step. Ordinary discovery reads do not hold an owner lock across this boundary.

### Acceptance and replay

After locked authority, first look up the Customer/key attempt FOR UPDATE; a known accepted binding replays before source-mode or current business checks. If absent, require admissible new-purchase mode, select/freeze the protected scenario/default and financial IDs, then insert Preparing with those values using `ON CONFLICT (customer_id,idempotency_key) DO NOTHING RETURNING id`. A conflict waits within the lock budget; then lock/read the committed winner in a new READ COMMITTED statement. Accepted exact canonical input returns the original receipt. A committed Preparing row is integrity failure. The initial lookup is an optimization/admission distinction; uniqueness remains the concurrency guard. For a new row, lock only the quote matching customer/id; another owner's ID is QuoteNotFound even though the temporary row carries that UUID. Quote accepted_at arbitrates different-key attempts before Cart/Inventory; the partial unique accepted-quote index is the final guard.

Inventory Reserve owns its group-first creation/price-eligibility locks. Current Catalog comparison reuses those held rows with an ordinary owner batch read; do not acquire new/different Catalog category locks after stock. Quoted accepted price/name/address becomes Orders' snapshot. At final acceptance database time, recheck quote still unexpired, identity/session eligible and mapped reservation Active/unexpired. Update quote accepted_at, fill immutable attempt receipt/version 1/Pending, insert all four work rows and Accepted audit, then commit. Rejected domain/dependency outcome rolls the whole caller back. Unexpected uniqueness failure is reconciled outside that aborted transaction using the original Customer/key and owned quote.

### Claim and fence

```sql
SELECT attempt_id, kind
FROM checkout.work
WHERE state = 'Scheduled' AND next_action_at <= @database_time
  AND (lease_token IS NULL OR lease_expires_at <= @database_time)
ORDER BY next_action_at, attempt_id, kind
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

Recheck eligibility with fresh database time after selection; assign random token/now+30 seconds and increment step_attempts before dispatch, then commit. This consumes one bounded observation attempt even if the process crashes. At most ten per cycle. For an exhausted selected row, release the single-row claim transaction without dispatch/increment, then reacquire the full ordered set and recheck before audited ManualReview; never keep the single-row lock while acquiring earlier-ranked work. Claim does not update attempt version or a public progress timestamp.

Application locks all four work rows in fixed order, validates the claimed kind/token/deadline, then locks attempt and required owner rows. Recheck the same fence after the final wait before local effects. Lease loss rolls back local work; independently committed financial truth remains and wakes the replacement. A complete stale financial response may be ignored locally but never deleted at its owner. Claim, retry scheduling and receipt loss do not invent another payment/refund operation.

On successful effective outcome/cleanup, increment attempt version once with corresponding unique version audit. Work-only scheduling/escalation/wake changes append WorkState/Resume audit at the observed attempt version without changing historical purchase outcome. No-op/rejected domain actions add no business audit. Retry due-time/lease bookkeeping alone has no transition audit; bounded diagnostics record its outcome. All work-state changes and their required audit commit together. `changed_at` advances for meaningful work state/input changes, not every lease or same-fact poll; public updatedAt is max(attempt.updated_at, four work.changed_at).

### Reads, cleanup and retention

AttemptView uses one owner-scoped joined statement over attempt, Order and the four work rows, then bounded projection; detect missing/extra work/mapping or inconsistent row shape and fail safely. Do not join live Catalog or execute source side effects from GET. A protected read may finish its authorized snapshot under the Phase 01 rule. QuoteView/receipt materialize before commit; no postcommit source projection is needed.

Keep accepted attempts, keys, used quotes, source evidence and audit with the purchase; no automatic accepted-key/order purge. Delete only unused quotes past expires_at +24 hours, ≤100 per transaction, ≤10 transactions per 15-minute cleanup run, using stable expiry/UUID order and SKIP LOCKED. Recheck accepted_at null under the quote lock; submit may wait and must recheck expiry/existence. Preparing rows are never a cleanup target; any committed one is an incident. Future real-user retention must coordinate quote address/Orders history/source/keys rather than deleting idempotency protection independently.

API grants permit quote/attempt/work/audit insertion, quote accepted_at update and filling a new Preparing attempt under owner logic; immutable accepted identity/receipt fields have no ordinary update/delete route. Worker grants update only outcome/cleanup/stock-loss/version/work fields and append audit; Cart/Orders/Inventory/financial owner grants remain narrow. Cleanup may delete only unused expired quote candidates through its declared guarded operation. Operator alone inserts immutable simulator assignments/resumes with attribution. Migration identity owns DDL. Verify actual grants/locking SQL in PostgreSQL; these application state-dependent rules are not all expressible as ordinary column grants.
