# Cart Schema and Transactions

**Status:** target PostgreSQL 18 design for a future reviewed EF Core/Npgsql migration. SQL is specification material; it has not been executed.

## Data ownership and schema

Cart owns only parent/line state. Identity owns users/sessions, Catalog owns product IDs/publication/prices and Inventory owns stock. The shared monolith permits foreign keys to existing owners; only Cart operations write Cart rows. Catalog product IDs are immutable and product physical deletion is already excluded. Identity disables accounts rather than deleting cart ownership.

```sql
CREATE SCHEMA IF NOT EXISTS cart;

CREATE TABLE cart.carts (
    customer_id uuid PRIMARY KEY
        REFERENCES identity.users(id) ON DELETE RESTRICT,
    version bigint NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT carts_version CHECK (version BETWEEN 0 AND 9007199254740991),
    CONSTRAINT carts_time CHECK (updated_at >= created_at)
);

CREATE TABLE cart.items (
    customer_id uuid NOT NULL
        REFERENCES cart.carts(customer_id) ON DELETE RESTRICT,
    product_id uuid NOT NULL
        REFERENCES catalog.products(id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    PRIMARY KEY (customer_id, product_id),
    CONSTRAINT items_quantity CHECK (quantity BETWEEN 1 AND 100)
);
```

The parent key guarantees one cart per Customer; the composite child key guarantees one line per product and supports owner-prefixed reads/removal/clear. These primary-key B-tree indexes are the initial access indexes. No price, currency, product text, stock count, session ID, expiry, reservation, order or payment reference is stored. Empty parents remain durable. No reverse product lookup exists in the Phase 04 workload; add an index on `product_id` only after a concrete query or future FK-maintenance requirement demonstrates the need.

The migration CHECK deliberately permits temporary version 0 for first-write arbitration. **Application transactions MUST NOT commit a version-0 parent.** Zero in the public contract means no parent, not a stored empty parent. The writer enforces 0–20 child lines, positive version for every committed parent, Customer-role ownership and exactly one increment per effective edit. These are cross-row/transaction rules beyond the quantity CHECK. Validate them through operator integrity inspection and restrict direct writes. No database trigger is introduced solely for these rules.

Map version as an application-managed EF concurrency token in addition to explicit transaction logic. When updating, include the expected stored version and upper-bound predicate. Do not use PostgreSQL `xmin` as the public version, SQL Server rowversion, or a timestamp equality token. Generated SQL must preserve the explicit locks and exact guarded increment. [EF Core documents application-managed concurrency tokens](https://learn.microsoft.com/en-us/ef/core/saving/concurrency).

## Write transaction and lock order

Use one primary connection and `READ COMMITTED` transaction for each mutation. Admission/request parsing occurs before entering the transaction. Set local lock wait to 250 ms and statement timeout to two seconds; enforce a three-second transaction deadline within the ten-second request budget.

1. Through Identity, lock the verified user's `identity.users` row `FOR SHARE`, then the JWT-bound `identity.sessions` row `FOR SHARE`. Recheck Active status, Customer role, user/session/token security-version agreement, session owner, no revocation, and absolute/inactivity deadlines using fresh database time. Follow the [Phase 01 exact contract](../../01-identity-and-auth/database/schema-and-transactions.md#protected-reads-and-sensitive-future-mutations); never upgrade the user lock after session acquisition.
2. For SetItem only, attempt the zero-version parent insert below. Remove/clear select an existing parent without creating one. Lock the owner-scoped parent `FOR UPDATE`; obtain its actual version after any wait. A missing parent has virtual version 0.
3. Recheck Identity eligibility with fresh database time after parent acquisition, then compare `expectedVersion` with that current version. Mismatch rolls back, including a just-inserted parent, before Catalog lookup. A missing-parent remove/clear at expected 0 is a no-op and commits no data only after this authority recheck.
4. For SetItem, use Catalog's transactional operation: product `FOR SHARE`, then assigned category `FOR SHARE`, recheck Published/Active after locks. Defer mapping any typed Catalog rejection until the following Identity time recheck. Remove/clear skip Catalog entirely.
5. Recheck Identity eligibility with fresh `clock_timestamp()` after Catalog lock waits and immediately before changing lines or returning a no-op. An expired authority takes precedence over a pending Catalog rejection. If authority still holds, missing/nonpublic ProductUnavailable requires whole-transaction rollback. Identity locks prevent concurrent revocation; time itself can still expire a session while waiting. Use the same recheck in a future Checkout coordinator before its sensitive local mutation.
6. Determine line existence/count under the parent lock. For a new line enforce count <20; for existing lines set the absolute quantity. Remove deletes one scoped line; clear deletes all scoped lines. A permitted no-op preserves version/time. An effective edit performs the guarded parent update below, using database time, and materializes its receipt.
7. Commit, then send the receipt. Any error cancels/rolls back the entire transaction and releases resources. No Catalog hydration, provider call or other external I/O occurs after commit to build this acknowledgement.

Cart locks precede Catalog locks. For future Checkout the full order is Identity user → Identity session → Cart parent → unique Inventory reservation group → Catalog products in sorted UUID order → distinct categories in sorted UUID order → stock rows in sorted UUID order. The group must be acquired before Catalog as Phase 03 requires. Terminal Inventory work does not lock Cart; Catalog/Inventory must not call back into Cart after their locks. No app-local mutex provides correctness across replicas. Study [PostgreSQL lock behavior](https://www.postgresql.org/docs/18/explicit-locking.html).

## First addition and guarded mutation

For SetItem, after Identity locks, capture one database instant and execute:

```sql
INSERT INTO cart.carts (customer_id, version, created_at, updated_at)
VALUES (@verified_customer_id, 0, @database_time, @database_time)
ON CONFLICT (customer_id) DO NOTHING;

SELECT customer_id, version, created_at, updated_at
FROM cart.carts
WHERE customer_id = @verified_customer_id
FOR UPDATE;
```

These are **separate statements**. A conflicting insert can wait for another transaction whose row was invisible at statement start. The next READ COMMITTED statement must load the committed winner, then compare its version. Do not combine conflict handling and winner discovery in one snapshot-dependent CTE or overwrite the winner with `ON CONFLICT DO UPDATE`. A database/unique wait can exceed the budget and yield `503`; no success is fabricated. [PostgreSQL specifies this conflict visibility behavior](https://www.postgresql.org/docs/18/transaction-iso.html#XACT-READ-COMMITTED).

A failed first addition rolls back the temporary parent. A successful first addition inserts the line and advances 0→1 atomically. All later effective edits use the same essential parent guard:

```sql
UPDATE cart.carts
SET version = version + 1,
    updated_at = @mutation_database_time
WHERE customer_id = @verified_customer_id
  AND version = @locked_version
  AND version < 9007199254740991
RETURNING version, updated_at;
```

Line writes and this parent update commit together. A missing RETURNING row after the lock requires rollback and diagnostic classification; it cannot leave a line changed. Never clamp or wrap a version. At the maximum version, permitted no-ops/removals of absent lines can still return unchanged state, but any effective change fails closed with `503` and operator intervention. Database time supplies update timestamps; a detected time/integrity violation rolls back instead of inventing success.

For remove/clear with no parent, the absent-key observation is the no-op's serialization point. A simultaneous first SetItem may validly commit afterward. For a present parent, even a no-op first checks the locked version. Every mutation path, including a future internal one, must acquire the parent before changing children or counting them. This prevents two additions at count 19 from both committing a 20th/21st line.

## Read snapshot and batch hydration

After the normal Phase 01 protected-read authority check, use a short `REPEATABLE READ READ ONLY` transaction for GET. The first intent statement establishes the snapshot; the following Catalog batch query uses the same connection/transaction. A parent/line query can have this shape:

```sql
SELECT c.version, c.updated_at, i.product_id, i.quantity
FROM cart.carts AS c
LEFT JOIN cart.items AS i ON i.customer_id = c.customer_id
WHERE c.customer_id = @verified_customer_id
ORDER BY i.product_id
LIMIT 21;
```

No result means virtual empty version 0. One row with null product ID means a persisted empty parent. Materialize at most 20 lines; an extra row or a version-0 stored parent is an invariant failure, not a result to truncate silently. The implementation SHOULD fetch at most 21 line rows for corruption detection and return `503` if the cap is exceeded.

Cart passes the bounded product IDs to the Catalog-owned batch operation. Its public projection evaluates `products.status='Published' AND categories.status='Active'` in SQL. It returns only SKU/name/unit price for visible products and a typed integrity failure if a referenced product/category is absent; it must not fetch hidden payloads for filtering in Cart. Correctly evaluated nonvisible products are omitted from the visible map and represented as blocked lines by Cart. Product version/category status need not be exposed in CartView. An empty cart skips hydration. Capture all data and checked amounts, end the read transaction, then serialize the response. Do not retain a database snapshot while streaming to a slow client.

Catalog can implement the single bounded hydration statement below inside its owner adapter. Every requested ID gets either public projected fields, a nonvisible marker with null fields, or an integrity marker. Cart receives only the resulting safe map/typed outcome, not unrestricted Catalog entities.

```sql
SELECT requested.product_id,
       (p.id IS NULL OR category.id IS NULL) AS missing_reference,
       COALESCE(p.status = 'Published' AND category.status = 'Active', false) AS visible,
       CASE WHEN p.status = 'Published' AND category.status = 'Active'
            THEN p.sku END AS sku,
       CASE WHEN p.status = 'Published' AND category.status = 'Active'
            THEN p.name END AS name,
       CASE WHEN p.status = 'Published' AND category.status = 'Active'
            THEN p.price_minor END AS price_minor,
       CASE WHEN p.status = 'Published' AND category.status = 'Active'
            THEN p.currency_code END AS currency_code
FROM unnest(@product_ids::uuid[]) AS requested(product_id)
LEFT JOIN catalog.products AS p ON p.id = requested.product_id
LEFT JOIN catalog.categories AS category ON category.id = p.category_id
ORDER BY requested.product_id;
```

At unit maximum, `100 × 99,999,999 = 9,999,999,900` cents per line and `20 × 9,999,999,900 = 199,999,998,000` cents per cart. Use checked signed 64-bit arithmetic and verify USD for every visible price. A persisted invalid price/currency is an invariant failure. An unavailable line has a null subtotal and makes the full subtotal null. Cart never stores these calculations.

## Checkout input and migration integrity

The internal Checkout operation participates in the caller's READ COMMITTED write transaction after Identity locks, takes the parent `FOR UPDATE` from the outset and then reads bounded lines. Compare expected version before returning `Empty` or a nonempty snapshot; a missing parent is virtual zero. Starting with FOR UPDATE avoids a later shared-to-exclusive upgrade if Phase 06 needs a cart mutation. The caller owns commit/rollback and must not make provider calls while holding the lock.

Apply the new schema through a reviewed one-shot migration identity before Cart admission. No Identity/Catalog/Inventory backfill or mutation is required because carts are created lazily. Inspect EF-generated SQL, foreign-key rights, guarded updates and primary-key plans against actual PostgreSQL. Operator checks compare per-parent line count ≤20, positive committed version, quantities in range, owner role and referenced identity/product existence; report findings without automatic repair. Migration/build/schema inspection is distinct from executing these scenarios.
