# Orders Schema and Transactions

**Status:** target PostgreSQL 18 design for a future reviewed EF Core/Npgsql migration. SQL is specification material; no migration or transaction has been run.

## Ownership and persistence

Orders owns parent snapshots/lifecycle, immutable lines, transition audit and restricted Admin access audit. The monolith permits Identity/product/reservation foreign keys; extracting an owner requires a migration plan. Payments evidence IDs are stable references validated through its future owner contract; no nonexistent Payments table is referenced by this Phase 05 DDL.

```sql
CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE orders.orders (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    checkout_intent_id uuid NOT NULL UNIQUE,
    reservation_id uuid NOT NULL UNIQUE
        REFERENCES inventory.reservation_groups(id) ON DELETE RESTRICT,
    snapshot_fingerprint bytea NOT NULL CHECK (octet_length(snapshot_fingerprint) = 32),
    line_count integer NOT NULL CHECK (line_count BETWEEN 1 AND 20),
    currency_code varchar(3) COLLATE "C" NOT NULL CHECK (currency_code = 'USD'),
    items_subtotal_minor bigint NOT NULL CHECK (items_subtotal_minor BETWEEN 1 AND 199999998000),
    shipping_minor bigint NOT NULL CHECK (shipping_minor BETWEEN 0 AND 9007199254740991),
    tax_minor bigint NOT NULL CHECK (tax_minor BETWEEN 0 AND 9007199254740991),
    total_minor bigint NOT NULL CHECK (total_minor BETWEEN 1 AND 9007199254740991),
    recipient_name text NOT NULL CHECK (char_length(recipient_name) BETWEEN 1 AND 100 AND octet_length(recipient_name) <= 400),
    address_line_1 text NOT NULL CHECK (char_length(address_line_1) BETWEEN 1 AND 200 AND octet_length(address_line_1) <= 800),
    address_line_2 text CHECK (address_line_2 IS NULL OR (char_length(address_line_2) BETWEEN 1 AND 200 AND octet_length(address_line_2) <= 800)),
    city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 100 AND octet_length(city) <= 400),
    region text CHECK (region IS NULL OR (char_length(region) BETWEEN 1 AND 100 AND octet_length(region) <= 400)),
    postal_code text CHECK (postal_code IS NULL OR (char_length(postal_code) BETWEEN 1 AND 32 AND octet_length(postal_code) <= 128)),
    country_code varchar(2) COLLATE "C" NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    status text NOT NULL CHECK (status IN ('PendingPayment','Confirmed','Processing','Shipped','Delivered','Cancelled','Failed')),
    version bigint NOT NULL CHECK (version BETWEEN 1 AND 9007199254740991),
    cancellation_state text NOT NULL CHECK (cancellation_state IN ('None','Requested','Completed')),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    confirmed_at timestamptz,
    capture_evidence_id uuid,
    processing_started_at timestamptz,
    shipped_at timestamptz,
    delivered_at timestamptz,
    ended_at timestamptz,
    failure_code text,
    failure_evidence_id uuid,
    cancellation_requested_at timestamptz,
    cancellation_completed_at timestamptz,
    cancellation_resolution_id uuid,
    CHECK (total_minor = items_subtotal_minor + shipping_minor + tax_minor),
    CHECK (updated_at >= created_at),
    CHECK ((confirmed_at IS NULL) = (capture_evidence_id IS NULL)),
    CHECK ((failure_code IS NULL AND failure_evidence_id IS NULL AND status <> 'Failed') OR
           (status = 'Failed' AND failure_evidence_id IS NOT NULL AND failure_code IS NOT NULL AND
            failure_code IN ('PaymentRejected','ReservationExpired','Unfulfillable'))),
    CHECK (
      (status = 'PendingPayment' AND confirmed_at IS NULL AND processing_started_at IS NULL AND shipped_at IS NULL AND delivered_at IS NULL AND ended_at IS NULL) OR
      (status = 'Confirmed' AND confirmed_at IS NOT NULL AND processing_started_at IS NULL AND shipped_at IS NULL AND delivered_at IS NULL AND ended_at IS NULL) OR
      (status = 'Processing' AND confirmed_at IS NOT NULL AND processing_started_at IS NOT NULL AND shipped_at IS NULL AND delivered_at IS NULL AND ended_at IS NULL) OR
      (status = 'Shipped' AND confirmed_at IS NOT NULL AND processing_started_at IS NOT NULL AND shipped_at IS NOT NULL AND delivered_at IS NULL AND ended_at IS NULL) OR
      (status = 'Delivered' AND confirmed_at IS NOT NULL AND processing_started_at IS NOT NULL AND shipped_at IS NOT NULL AND delivered_at IS NOT NULL AND ended_at IS NOT NULL AND ended_at = delivered_at) OR
      (status = 'Cancelled' AND processing_started_at IS NULL AND shipped_at IS NULL AND delivered_at IS NULL AND ended_at IS NOT NULL) OR
      (status = 'Failed' AND confirmed_at IS NULL AND processing_started_at IS NULL AND shipped_at IS NULL AND delivered_at IS NULL AND ended_at IS NOT NULL)
    ),
    CHECK (
      (cancellation_state = 'None' AND cancellation_requested_at IS NULL AND cancellation_completed_at IS NULL AND cancellation_resolution_id IS NULL AND status <> 'Cancelled') OR
      (cancellation_state = 'Requested' AND cancellation_requested_at IS NOT NULL AND cancellation_completed_at IS NULL AND cancellation_resolution_id IS NULL AND status IN ('PendingPayment','Confirmed')) OR
      (cancellation_state = 'Completed' AND cancellation_requested_at IS NOT NULL AND cancellation_completed_at IS NOT NULL AND cancellation_resolution_id IS NOT NULL AND status = 'Cancelled' AND cancellation_completed_at = ended_at)
    ),
    CHECK (
      (confirmed_at IS NULL OR (confirmed_at >= created_at AND confirmed_at <= updated_at)) AND
      (processing_started_at IS NULL OR (processing_started_at >= confirmed_at AND processing_started_at <= updated_at)) AND
      (shipped_at IS NULL OR (shipped_at >= processing_started_at AND shipped_at <= updated_at)) AND
      (delivered_at IS NULL OR (delivered_at >= shipped_at AND delivered_at <= updated_at)) AND
      (ended_at IS NULL OR (ended_at >= created_at AND ended_at <= updated_at)) AND
      (cancellation_requested_at IS NULL OR (cancellation_requested_at >= created_at AND cancellation_requested_at <= updated_at)) AND
      (cancellation_completed_at IS NULL OR (cancellation_completed_at >= cancellation_requested_at AND cancellation_completed_at <= updated_at))
    )
);

CREATE TABLE orders.order_lines (
    order_id uuid NOT NULL REFERENCES orders.orders(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    sku varchar(32) COLLATE "C" NOT NULL CHECK (sku ~ '^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$' AND char_length(sku) BETWEEN 3 AND 32),
    product_name text NOT NULL CHECK (char_length(product_name) BETWEEN 3 AND 160 AND octet_length(product_name) <= 640),
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
    unit_price_minor bigint NOT NULL CHECK (unit_price_minor BETWEEN 1 AND 99999999),
    line_subtotal_minor bigint NOT NULL CHECK (line_subtotal_minor = quantity::bigint * unit_price_minor),
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE orders.transition_audit (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders.orders(id) ON DELETE RESTRICT,
    operation text NOT NULL CHECK (operation IN ('Create','Confirm','Fail','RequestCancellation','CompleteCancellation','StartProcessing','Ship','Deliver')),
    actor_kind text NOT NULL CHECK (actor_kind IN ('Customer','Admin','Checkout','Simulator')),
    actor_user_id uuid,
    source_id uuid,
    request_id uuid NOT NULL,
    reason text,
    before_version bigint,
    after_version bigint NOT NULL CHECK (after_version BETWEEN 1 AND 9007199254740991),
    before_status text,
    after_status text NOT NULL,
    before_cancellation text,
    after_cancellation text NOT NULL,
    occurred_at timestamptz NOT NULL,
    UNIQUE (order_id, after_version),
    CHECK ((actor_kind IN ('Customer','Admin') AND actor_user_id IS NOT NULL AND source_id IS NULL) OR
           (actor_kind IN ('Checkout','Simulator') AND actor_user_id IS NULL AND source_id IS NOT NULL)),
    CHECK ((actor_kind = 'Admin' AND reason IS NOT NULL AND char_length(reason) BETWEEN 1 AND 256 AND octet_length(reason) <= 1024) OR
           (actor_kind <> 'Admin' AND reason IS NULL)),
    CHECK ((operation = 'Create' AND before_version IS NULL AND after_version = 1 AND before_status IS NULL AND before_cancellation IS NULL) OR
           (operation <> 'Create' AND before_version IS NOT NULL AND before_version >= 1 AND before_status IS NOT NULL AND before_cancellation IS NOT NULL AND after_version = before_version + 1))
);

CREATE TABLE orders.access_audit (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL,
    actor_user_id uuid NOT NULL,
    request_id uuid NOT NULL UNIQUE,
    occurred_at timestamptz NOT NULL
);

CREATE INDEX orders_customer_history
    ON orders.orders (customer_id, created_at DESC, id DESC);
CREATE INDEX orders_fulfillment_queue
    ON orders.orders (status, created_at DESC, id DESC)
    WHERE cancellation_state = 'None' AND status IN ('Confirmed','Processing','Shipped');
CREATE INDEX orders_requested_cancellation
    ON orders.orders (cancellation_requested_at, id) WHERE cancellation_state = 'Requested';
CREATE INDEX orders_access_history ON orders.access_audit (order_id, occurred_at, id);
```

Checks protect row shape and exact parent-component/line equations. They do not enforce accepted destination policy, sum/count across children, immutable updates, real financial evidence, reservation mappings, transition legality or audit completeness. Creation validates actual line count/sum, matching reservation intent/quantities and canonical fingerprint in one transaction. Every writer obeys owner guards and narrow column grants. SQL CHECK expressions must reject invalid non-null states explicitly; nullable CHECK results alone are not an integrity guarantee. Review [PostgreSQL constraint semantics](https://www.postgresql.org/docs/18/ddl-constraints.html).

Access audit deliberately has no Order foreign key: it records an already-authorized observed snapshot without acquiring a parent key lock after that read. Order IDs are stable and there is no delete API. The access event is inserted only after a successful authorized detail lookup, with no address/line payload. Transition audit uses the locked/inserting Order and commits with its state. Both are append-only; no-op/rejected commands add no transition event. Enforce valid state/cancellation enums and actor-operation pairing in application audit mapping: only Admin fulfills, Customer/Admin requests, Checkout/Simulator creates/confirms/fails/completes.

## Canonical creation identity

The unique Checkout intent is the creation key. Fingerprint is SHA-256 of canonical compact UTF-8 JSON with exact member order: v(1), customerId, checkoutIntentId, reservationId, lines, shippingAddress, totals. Sort lines by UUID; each has productId, sku, name, quantity, unitPriceMinor, lineSubtotalMinor in that order. Address members follow API order. Totals members are currency(`USD`), itemsSubtotalMinor, shippingMinor, taxMinor, totalMinor. Normalize/trim permitted text first; emit null optional address values, Unicode directly, JSON-required escapes only, and canonical integer decimal values. IDs are canonical UUIDs. Server order ID, timestamps and lifecycle are excluded.

On exact intent replay compare owner/reservation/fingerprint and canonical immutable fields; return the existing order identity/creation time. A hash collision cannot authorize changed canonical content. Different address/price/quantity/owner/mapping conflicts. No fingerprint/creation key is returned to public clients or logged with raw snapshots.

## Transactions and lock order

All writes use one primary READ COMMITTED transaction, lock wait 250 ms, statement timeout two seconds, transaction deadline three seconds inside the ten-second request deadline. Human mutations take Identity user FOR SHARE then session FOR SHARE and revalidate current role/source/owner/version/expiry under the Phase 01 contract. Recheck fresh database time after Order waits before expectedVersion/domain classification and before the effect. Never upgrade the shared user lock after session acquisition.

| Path | Required order |
| --- | --- |
| Human cancellation/fulfillment | Identity user/session → owner-scoped existing Order FOR UPDATE → guarded state/audit; no Inventory/Payments work |
| New accepted purchase | Identity → Cart parent → Inventory intent/group → Catalog products/categories → stock → insert new Order/lines/audit; caller owns atomic commit |
| Creation replay after Inventory locks | Ordinary immutable Order lookup/comparison only; never lock/update an existing Order here |
| Existing-order confirmation/resolution | Coordinator establishes its own authority/attempt order → existing Order FOR UPDATE → Inventory group → sorted stock → Orders state/audit; no Cart lock acquired afterward |
| Inventory expiry | Inventory group → stock; never call Orders while holding these locks |

Phase 06 places its attempt/Payments records in this acyclic order and must not introduce a path from group/stock back to an existing Order lock. Orders may lock before Inventory without changing Phase 03's required group-before-Catalog/stock order. External provider calls, sleeps and user decisions remain outside every transaction. A transaction failing after an Inventory write must roll back all local owner changes unless the coordinator deliberately applies and commits the permitted expired/failure/cancellation outcome. Callback financial truth that was already independently committed is never erased by a later local rollback.

Human scoped lock shape:

```sql
SELECT * FROM orders.orders
WHERE id = @order_id AND customer_id = @verified_customer_id
FOR UPDATE;
```

Admin may use ID lookup only after restricted authority. Never load another Customer's order then filter it after exposing state. Compare expectedVersion after lock/authority/existence, before transition or no-op. For StartProcessing the essential guard is:

```sql
UPDATE orders.orders
SET status = 'Processing', version = version + 1,
    processing_started_at = @database_time, updated_at = @database_time
WHERE id = @order_id AND version = @expected_version
  AND status = 'Confirmed' AND cancellation_state = 'None'
  AND capture_evidence_id IS NOT NULL AND confirmed_at IS NOT NULL
  AND version < 9007199254740991
RETURNING id, status, version, updated_at, cancellation_state;
```

RequestCancellation similarly guards status in PendingPayment/Confirmed and cancellation None. Set Requested/time and increment once; it leaves status unchanged. CompleteCancellation writes Cancelled/Completed plus resolution/end time after trusted terminal-stock/financial checks. Confirm writes capture proof/time only after actual mapped Consume. Fail writes controlled failure/evidence/end time only after safe terminal resolution. Ship/Deliver guard their exact source and cancellation None. Insert one transition event using RETURNING state in the same transaction. Any missing guarded row after expected lock classification, evidence mismatch or audit failure rolls back; never clamp/wrap a version or fix state by an unrestricted update.

Creation inserts PendingPayment/version 1/cancellation None with all transition times/proofs null. It must join the caller's transaction, validate matched reservation under its held group lock and insert parent/lines/audit all-or-none. Shared intent-group serialization prevents two same-intent creations; unique keys remain the final guard. An unexpected uniqueness conflict rolls back the caller transaction; reconcile using stable intent rather than an unsafe in-transaction catch/retry. Existing replay after later consumption returns immutable creation data without replaying price acceptance or reservation allocation.

## Reads, history and permissions

Detail can use one owner-scoped joined parent/lines statement, ORDER BY product_id LIMIT 21, giving one READ COMMITTED snapshot. Detect zero/inconsistent line_count, >20 lines, wrong sum/fingerprint or invalid row shape and fail safely instead of truncating. No Catalog/Inventory/Payments hydration is required. Customer read uses the Phase 01 protected-read authorization snapshot. For Admin detail, execute that one snapshot statement in a short transaction, append access audit, commit and only then return; the audit does not increment business version. Release connections before serializing to slow clients.

History query:

```sql
SELECT id, status, version, created_at, updated_at, total_minor,
       cancellation_state, cancellation_requested_at, cancellation_completed_at
FROM orders.orders
WHERE customer_id = @verified_customer_id
  AND (created_at, id) < (@cursor_created_at, @cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT @limit_plus_one;
```

Use a separate first-page form without the tuple predicate. Admin queues bind required status, cancellation None and the same keyset shape, without owner input. Preserve exact timestamp microseconds in the cursor. Pending-cancellation recovery reads ≤100 identifiers with `(cancellation_requested_at,id)` ascending keyset; it does not claim work or call providers. Phase 06 supplies recovery claim/coordinator behavior. No unbounded audit history is loaded for a detail response.

API runtime needs SELECT/INSERT on Orders, UPDATE only the mutable lifecycle/cancellation/evidence/version/time columns, immutable line INSERT, and audit INSERT. Grant no Orders/line/audit DELETE, no line UPDATE, no snapshot-column UPDATE and no DDL. The migration identity owns schema changes; operator read-only inspection checks count/sum, mapping, fingerprint, row/audit versions and trusted proof relationships. Audit constraints/generated migrations and actual grants/locks must be exercised against PostgreSQL before acceptance.
