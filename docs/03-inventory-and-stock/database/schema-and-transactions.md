# Inventory Schema and Transactions

**Status:** target PostgreSQL 18 design for a reviewed EF Core/Npgsql migration. The SQL is a proposed schema, not an applied migration. [Workflows](../functional-requirements/inventory-workflows.md) define the business state machine.

## Ownership and DDL

Inventory owns the four tables below. The product foreign key is an allowed relational constraint inside the initial monolith; Inventory alone writes these tables. Catalog continues to own product publication and price. No direct database relationship to a future Order is required yet: `intent_id` is the durable correlation key and Phase 06 will define its order mapping.

```sql
CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE inventory.stock_items (
    product_id uuid PRIMARY KEY REFERENCES catalog.products(id) ON DELETE RESTRICT,
    on_hand bigint NOT NULL DEFAULT 0,
    reserved bigint NOT NULL DEFAULT 0,
    version bigint NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL,
    CONSTRAINT stock_quantity CHECK (
        on_hand BETWEEN 0 AND 1000000000 AND reserved BETWEEN 0 AND on_hand
    ),
    CONSTRAINT stock_version CHECK (version > 0)
);

CREATE TABLE inventory.reservation_groups (
    id uuid PRIMARY KEY,
    intent_id uuid NOT NULL UNIQUE,
    request_fingerprint bytea NOT NULL CHECK (octet_length(request_fingerprint) = 32),
    state text NOT NULL DEFAULT 'Active',
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    ended_at timestamptz,
    end_reason text,
    CONSTRAINT reservation_deadline CHECK (
        expires_at = created_at + interval '900 seconds'
    ),
    CONSTRAINT reservation_state CHECK (
        (state = 'Active' AND ended_at IS NULL AND end_reason IS NULL) OR
        (state = 'Consumed' AND ended_at IS NOT NULL AND
         ended_at >= created_at AND ended_at < expires_at AND end_reason IS NULL) OR
        (state = 'Expired' AND ended_at IS NOT NULL AND
         ended_at >= expires_at AND end_reason IS NULL) OR
        (state = 'Released' AND ended_at IS NOT NULL AND
         ended_at >= created_at AND ended_at < expires_at AND end_reason IS NOT NULL AND
         end_reason IN ('CheckoutAborted', 'PaymentFailed', 'CustomerCancellation'))
    )
);

CREATE TABLE inventory.reservation_lines (
    reservation_id uuid NOT NULL REFERENCES inventory.reservation_groups(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES inventory.stock_items(product_id) ON DELETE RESTRICT,
    quantity smallint NOT NULL CHECK (quantity BETWEEN 1 AND 100),
    PRIMARY KEY (reservation_id, product_id)
);

CREATE TABLE inventory.stock_movements (
    id uuid PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES inventory.stock_items(product_id) ON DELETE RESTRICT,
    cause text NOT NULL CHECK (cause IN ('Adjustment', 'Reserve', 'Consume', 'Release', 'Expire')),
    reservation_id uuid,
    adjustment_operation_id uuid,
    on_hand_delta bigint NOT NULL,
    reserved_delta bigint NOT NULL,
    on_hand_after bigint NOT NULL,
    reserved_after bigint NOT NULL,
    version_after bigint NOT NULL CHECK (version_after > 1),
    actor_user_id uuid,
    reason varchar(1024),
    occurred_at timestamptz NOT NULL,
    FOREIGN KEY (reservation_id, product_id)
        REFERENCES inventory.reservation_lines(reservation_id, product_id) ON DELETE RESTRICT,
    CONSTRAINT movement_after CHECK (
        on_hand_after BETWEEN 0 AND 1000000000 AND
        reserved_after BETWEEN 0 AND on_hand_after
    ),
    CONSTRAINT movement_shape CHECK (
        (cause = 'Adjustment' AND reservation_id IS NULL AND
         adjustment_operation_id IS NOT NULL AND actor_user_id IS NOT NULL AND
         reason IS NOT NULL AND char_length(reason) BETWEEN 1 AND 256 AND
         octet_length(reason) <= 1024 AND reserved_delta = 0 AND
         on_hand_delta BETWEEN -1000000 AND 1000000 AND on_hand_delta <> 0) OR
        (cause = 'Reserve' AND reservation_id IS NOT NULL AND
         adjustment_operation_id IS NULL AND actor_user_id IS NULL AND reason IS NULL AND
         on_hand_delta = 0 AND reserved_delta BETWEEN 1 AND 100) OR
        (cause = 'Consume' AND reservation_id IS NOT NULL AND
         adjustment_operation_id IS NULL AND actor_user_id IS NULL AND reason IS NULL AND
         on_hand_delta = reserved_delta AND reserved_delta BETWEEN -100 AND -1) OR
        (cause IN ('Release', 'Expire') AND reservation_id IS NOT NULL AND
         adjustment_operation_id IS NULL AND actor_user_id IS NULL AND reason IS NULL AND
         on_hand_delta = 0 AND reserved_delta BETWEEN -100 AND -1)
    )
);

CREATE UNIQUE INDEX movements_adjustment_once
    ON inventory.stock_movements (adjustment_operation_id)
    WHERE cause = 'Adjustment';
CREATE UNIQUE INDEX movements_reserve_once
    ON inventory.stock_movements (reservation_id, product_id)
    WHERE cause = 'Reserve';
CREATE UNIQUE INDEX movements_terminal_once
    ON inventory.stock_movements (reservation_id, product_id)
    WHERE cause IN ('Consume', 'Release', 'Expire');
CREATE INDEX reservations_due
    ON inventory.reservation_groups (expires_at, id) WHERE state = 'Active';
CREATE INDEX reservation_lines_by_product
    ON inventory.reservation_lines (product_id, reservation_id);
CREATE INDEX movements_by_product
    ON inventory.stock_movements (product_id, occurred_at, id);
```

`stock_items` starts at zero/version 1 and has no movement for initialization. Every later balance change increments its version once and writes exactly one movement with matching after-counters. A product-create application flow invokes Catalog and Inventory owner operations in one transaction; the migration backfills existing products with zero items and checks counts before readiness. A missing item for an existing product is an invariant failure, never interpreted as zero.

The partial unique indexes prevent repeated adjustment, reserve, or terminal movement for one source/product. They complement, rather than replace, the group state lock. The application must also ensure every Active group has 1–20 lines, each Reserve movement matches its line quantity, each terminal movement matches the same line, and `reserved` equals the sum of Active lines. These cross-row invariants are maintained in one transaction and checked by reconciliation. Restrict direct table writes through database grants; no general SQL client may bypass the module.

## Lock order and write protocol

Use `READ COMMITTED` and short transactions on the primary database. The common order is: Identity user/session for an Admin mutation; reservation group when one is involved; Catalog product rows in ascending UUID; distinct Catalog category rows in ascending UUID; Inventory stock rows in ascending product UUID; movement inserts and commit. A terminal transition does not need Catalog locks and takes group then stock. An Admin adjustment takes Identity, Catalog product, then stock. Product creation is coordinated above the modules: after Identity authorization, the application flow inserts Catalog product/audit and calls Inventory `EnsureItem` before commit. Catalog product mutation already takes product then category locks, so Catalog's transactional sellability operation must lock products before categories. Use `clock_timestamp()` after row locks for expiry/transition decisions; a group creation timestamp is taken when its unique intent row is inserted. [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html) describes the conflict modes.

### Initialize and adjust

`EnsureItem` inserts `(product_id,0,0,1,clock_timestamp())` with `ON CONFLICT DO NOTHING`; it never resets an existing item. For an Admin adjustment, validate authentication/network, then in one transaction hold Phase 01 `identity.users FOR SHARE` and `identity.sessions FOR SHARE` in that order. Recheck current Admin eligibility and session expiry. Look for an existing committed movement by operation UUID after authorization; compare actor, product, signed delta and canonical reason to return the original receipt or conflict. For a new operation, lock the Catalog product `FOR SHARE`, then stock item `FOR UPDATE`. Recheck the operation UUID after the lock, compute the bounded new on-hand, update the stock item/version and append one Adjustment movement. The unique operation index arbitrates cross-product races with the same UUID; if it wins elsewhere, roll back and compare that committed receipt. A ledger insert failure rolls back the balance update. Use the server request ID only for diagnostics, not idempotency.

### Reserve a product set

Compute the exact [line fingerprint](../functional-requirements/inventory-workflows.md#stk-fr-04--reserve-a-bounded-product-set) from a canonical sorted set. If the intent exists, lock its group and compare fingerprints; materialize overdue expiry before returning an existing Active outcome. For a new intent, insert its uncommitted Active group with a unique `intent_id`, `created_at = clock_timestamp()` and `expires_at = created_at + interval '900 seconds'`. Use `INSERT ... ON CONFLICT (intent_id) DO NOTHING RETURNING id` so a uniqueness conflict does not abort the caller's transaction. A concurrent same-intent insertion waits on uniqueness; if no ID is returned, read and lock the winner in a new `READ COMMITTED` statement, compare fingerprints and return its state without stock allocation. This check occurs before testing current Catalog sellability so a replay survives later hiding/archive. Generate `created_at` once in SQL and derive `expires_at` from that same value.

For the new group, invoke Catalog's transactional sellability operation on the same connection: it locks each product `FOR SHARE` in sorted UUID order and each distinct category `FOR SHARE` in sorted UUID order, then rechecks Published/Active. Inventory locks each stock item `FOR UPDATE` in sorted product-ID order and requires `on_hand - reserved >= quantity` for every line. Insert lines, apply guarded `reserved = reserved + quantity` updates with version increments, append Reserve movements, and commit. A missing/non-sellable/insufficient line requires rollback of the caller-owned transaction as well as the new group; no partial Order/attempt may commit. No external provider call runs inside this transaction. A later Checkout caller must observe the same group→Catalog→stock order when combining its Order/attempt writes.

Keep the database predicate on the write even after taking the lock. The reserve update has this essential shape; use its `RETURNING` values for the matching movement:

```sql
UPDATE inventory.stock_items
SET reserved = reserved + @quantity,
    version = version + 1,
    updated_at = @database_time
WHERE product_id = @product_id
  AND on_hand - reserved >= @quantity
  AND version < 9223372036854775807
RETURNING on_hand, reserved, version;
```

Adjustment similarly guards `on_hand + @delta BETWEEN reserved AND 1000000000`; Consume guards `reserved >= @quantity` while subtracting quantity from both counters; Release/Expire guard it while subtracting from reserved only. Any missing `RETURNING` row aborts the complete operation and is classified after inspecting the locked state. Never clamp an invalid result or retry with a new operation identity.

### Consume, release and expire

Lock one group `FOR UPDATE` and recheck state. If already terminal, return its stored outcome without stock locks or a new movement. Otherwise lock that group's stock rows in ascending product UUID, then read `clock_timestamp()` after the last lock. This is the terminal decision time and becomes `ended_at`. If Active but due, choose Expired regardless of the requested Consume/Release action; if still eligible, choose the requested terminal state. Apply guarded deltas for every line, append one terminal movement per line, set state/ended_at/end_reason, then commit. A competing terminal transition waits on the group and sees the winner's state. The group and all lines have one commit boundary. A command that began before expiry may still expire if its stock-lock wait crosses the deadline; a decision made before expiry may commit afterward because the locked transition time, rather than response time, defines eligibility.

The worker reads database `clock_timestamp()` as `@scan_time`, then selects one eligible group per transaction with a shape equivalent to:

```sql
SELECT id
FROM inventory.reservation_groups
WHERE state = 'Active' AND expires_at <= @scan_time
ORDER BY expires_at, id
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

The bound `@scan_time` is a database-derived cutoff that permits an indexed due scan; the worker rechecks state and fresh `clock_timestamp()` under the acquired lock before transitioning. Each wake processes at most 100 groups per replica, committing before selecting another; concurrent replicas skip locks instead of duplicating work. A crash before commit leaves the Active row eligible for the next wake. `SKIP LOCKED` is for queue-like work selection, not ordinary customer reads; [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html) notes its inconsistent view semantics. A volatile wall-clock call directly in the index predicate may prevent the intended index condition; [PostgreSQL volatility guidance](https://www.postgresql.org/docs/current/xfunc-volatility.html) explains that limit.

## Reconciliation and migrations

For a bounded product-ID batch, use one statement snapshot to compare `stock_items.on_hand/reserved` with numeric `SUM(on_hand_delta/reserved_delta)` and the total of reservation lines whose group state is Active. Aggregate movements and Active lines separately before joining to stock items, so multiple movement and line rows do not multiply each other's sums. Compare counts of Catalog products and stock items separately; inspect any missing row. The full scan pages by immutable product ID. Batches have different snapshots, so report per-item findings and time rather than a falsely atomic global total. A mismatch raises an incident; no automatic repair or movement rewrite runs.

The migration owner applies schema/backfill before API replicas enable Inventory operations. Review generated EF SQL for check constraints, foreign keys, partial indexes and backfill locks; run against real PostgreSQL before acceptance. The API role can select and modify Inventory items/groups/lines through the module and append movements, but cannot update/delete movements, delete stock items, or perform DDL. The worker role needs group/line/item read and transition rights plus movement insert, without Admin adjustment rights. Operator reconciliation has read-only Inventory/Catalog access. Audit grants against actual SQL, not only intended roles.

## System Design Prerequisites & Concepts to Learn

Study [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html), row locking and `SKIP LOCKED`. Pause two transactions at the last-unit row and at a group terminal transition. Compare all committed balances, states and movements after each order. A migration parse or EF model build does not establish runtime lock behavior.
