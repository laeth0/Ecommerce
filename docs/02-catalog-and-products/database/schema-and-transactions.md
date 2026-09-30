# Catalog Schema and Transactions

**Status:** target PostgreSQL 18 schema and transaction contract for a future EF Core/Npgsql migration. This SQL is review material; no migration has run.

## Ownership and schema

Catalog owns `catalog.categories`, `catalog.products`, and `catalog.audit_events`. Identity owns `identity.users` and `identity.sessions`. Store the Admin actor UUID in catalog audit without a cross-module foreign key; Identity can disable an actor without deleting catalog history. Inventory later references the immutable product UUID but owns its own balances. Product rows are never physically deleted through this phase's API.

The migration must create equivalent columns, checks and indexes in one reviewed schema change. Application validation adds NFC, Unicode scalar/control rules and canonical UUID parsing; database checks protect the core invariants even if a writer bypasses the API.

```sql
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.categories (
    id uuid PRIMARY KEY,
    slug varchar(48) COLLATE "C" NOT NULL UNIQUE,
    name varchar(320) NOT NULL,
    status text NOT NULL DEFAULT 'Active',
    version bigint NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT categories_slug_format CHECK (
        slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 48
    ),
    CONSTRAINT categories_name_length CHECK (
        char_length(name) BETWEEN 2 AND 80 AND octet_length(name) <= 320
    ),
    CONSTRAINT categories_status CHECK (status IN ('Active', 'Inactive')),
    CONSTRAINT categories_version CHECK (version > 0),
    CONSTRAINT categories_time CHECK (updated_at >= created_at)
);

CREATE TABLE catalog.products (
    id uuid PRIMARY KEY,
    sku varchar(32) COLLATE "C" NOT NULL UNIQUE,
    category_id uuid NOT NULL REFERENCES catalog.categories(id) ON DELETE RESTRICT,
    name varchar(640) NOT NULL,
    description varchar(8000) NOT NULL,
    price_minor bigint NOT NULL,
    currency_code varchar(3) COLLATE "C" NOT NULL DEFAULT 'USD',
    status text NOT NULL DEFAULT 'Draft',
    version bigint NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    search_document tsvector GENERATED ALWAYS AS (
        to_tsvector('english'::regconfig, name || ' ' || description)
    ) STORED,
    CONSTRAINT products_sku_format CHECK (
        sku ~ '^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$' AND char_length(sku) BETWEEN 3 AND 32
    ),
    CONSTRAINT products_name_length CHECK (
        char_length(name) BETWEEN 3 AND 160 AND octet_length(name) <= 640
    ),
    CONSTRAINT products_description_length CHECK (
        char_length(description) <= 2000 AND octet_length(description) <= 8000
    ),
    CONSTRAINT products_price CHECK (price_minor BETWEEN 1 AND 99999999),
    CONSTRAINT products_currency CHECK (currency_code = 'USD'),
    CONSTRAINT products_status CHECK (status IN ('Draft', 'Published', 'Hidden', 'Archived')),
    CONSTRAINT products_version CHECK (version > 0),
    CONSTRAINT products_time CHECK (updated_at >= created_at)
);

CREATE TABLE catalog.audit_events (
    id uuid PRIMARY KEY,
    request_id uuid NOT NULL UNIQUE,
    actor_user_id uuid NOT NULL,
    entity_type text NOT NULL CHECK (entity_type IN ('Category', 'Product')),
    entity_id uuid NOT NULL,
    operation text NOT NULL CHECK (operation IN
        ('Create', 'Edit', 'Activate', 'Deactivate', 'Publish', 'Hide', 'Archive')),
    before_version bigint,
    after_version bigint NOT NULL CHECK (after_version > 0),
    before_state jsonb,
    after_state jsonb NOT NULL CHECK (jsonb_typeof(after_state) = 'object'),
    occurred_at timestamptz NOT NULL,
    CONSTRAINT audit_before_state CHECK (
        (operation = 'Create' AND before_version IS NULL AND before_state IS NULL) OR
        (operation <> 'Create' AND before_version IS NOT NULL AND
         jsonb_typeof(before_state) = 'object')
    ),
    CONSTRAINT audit_operation_type CHECK (
        (entity_type = 'Category' AND operation IN ('Create', 'Edit', 'Activate', 'Deactivate')) OR
        (entity_type = 'Product' AND operation IN ('Create', 'Edit', 'Publish', 'Hide', 'Archive'))
    ),
    CONSTRAINT audit_version_change CHECK (
        (before_version IS NULL AND after_version = 1) OR
        (before_version > 0 AND after_version = before_version + 1)
    )
);

CREATE INDEX categories_public_page
    ON catalog.categories (name COLLATE "C", id) WHERE status = 'Active';
CREATE INDEX products_public_page
    ON catalog.products (name COLLATE "C", id) WHERE status = 'Published';
CREATE INDEX products_public_category_page
    ON catalog.products (category_id, name COLLATE "C", id)
    WHERE status = 'Published';
CREATE INDEX products_public_search
    ON catalog.products USING gin (search_document) WHERE status = 'Published';
CREATE INDEX audit_entity_history
    ON catalog.audit_events (entity_type, entity_id, occurred_at DESC);
```

The category and product names use Unicode length rules in the API. PostgreSQL's `char_length` and `octet_length` enforce lower/upper bounds and storage size; the application is responsible for NFC, trimming, scalar counting, and forbidden controls. A future migration must preserve the USD constraint until a complete currency/exponent policy is approved. Check `bigint` overflow before incrementing a version; never wrap it.

Audit `before_state` and `after_state` are whitelisted catalog snapshots: category slug/name/status or product SKU/category/name/description/price/currency/status. No bearer token, raw request body, customer data, or identity session appears there. `before_state` is null only for Create. The audit event ID and request ID are generated server-side; a client-supplied request ID cannot create an idempotency guarantee. Do not update/delete audit through the API role. Retention/archival policy is an operator decision before real data, not silent cleanup in this phase.

## Transaction and lock order

Use `READ COMMITTED`, one primary connection and one transaction for each Admin mutation. After normal middleware validation, take `identity.users FOR SHARE` and then `identity.sessions FOR SHARE`, rechecking current Admin role, Active status, security version, session ownership/revocation/expiry and allowed network. These locks order the catalog mutation against Phase 01 revocation (`FOR UPDATE`). Acquire them before any catalog row lock. Read `clock_timestamp()` after relevant locks for authoritative expiry/update/audit times. The [Identity lock contract](../../01-identity-and-auth/database/schema-and-transactions.md) remains the source for the exact user/session checks.

Then use these catalog locks:

| Operation | Catalog lock and recheck |
| --- | --- |
| Create category | Insert unique slug; no existing catalog row lock |
| Edit/activate/deactivate category | Target category `FOR UPDATE`; compare version and state under lock |
| Create product | Assigned category `FOR SHARE`; check existence, then insert unique SKU |
| Edit product | Target product `FOR UPDATE`; compare version/status, then if `categoryId` changes, target category `FOR SHARE` and recheck existence |
| Publish product | Target product `FOR UPDATE`, then assigned category `FOR SHARE`; compare version and require Active category |
| Hide/archive product | Target product `FOR UPDATE`; compare version/state |

There is no catalog path that takes a category lock and later an existing product lock. A category status update waits for a concurrent publish holding its category share lock; a publish waits for a concurrent category status update. Whichever takes the category lock first determines the transition order. Product category moves can target an Inactive category; visibility then follows the joined read predicate. After all guards pass, update one target row with `version = version + 1` and `updated_at` from database time, append one audit event, commit, and only then return success. Unique constraint violations map to the documented 409 codes; all other database failures roll back. A no-op PATCH still checks the current ETag and state, but leaves row/version/audit unchanged.

The version comparison is inside the row lock. An outdated ETag produces `412` even if the current state would also reject the transition. A missing row is `404`. No automatic retry of a failed precondition occurs; the Admin re-reads the resource. If the audit insert fails, the state update rolls back. Keep the transaction deadline within the request budget; deadlock/serialization errors are sanitized dependency failures unless a deliberate safe retry policy is later specified.

## Public read consistency and representative SQL

One SQL statement produces each public page; `READ COMMITTED` gives that statement one database snapshot. The application maps the returned rows without a second visibility query. For product pages, the core shape is:

```sql
SELECT p.id, p.sku, p.name, p.description, p.price_minor,
       p.currency_code, p.version, p.updated_at,
       c.id AS category_id, c.slug, c.name AS category_name
FROM catalog.products AS p
JOIN catalog.categories AS c ON c.id = p.category_id
WHERE p.status = 'Published' AND c.status = 'Active'
  AND (@category_slug IS NULL OR c.slug = @category_slug)
  AND (@search_query IS NULL OR
       p.search_document @@ websearch_to_tsquery('english'::regconfig, @search_query))
  AND (@last_name IS NULL OR
       (p.name COLLATE "C", p.id) > (@last_name COLLATE "C", @last_id))
ORDER BY p.name COLLATE "C", p.id
LIMIT @limit_plus_one;
```

Build dynamic parameterized predicates for supplied filters rather than assuming the optional-OR form above produces the best plan. Category page uses `WHERE status='Active'` and the same keyset tuple. Detail uses product ID plus both visibility predicates. Admin detail reads are identity-authorized and may return any status. A public request beginning after a hide/deactivation commit must not return the hidden product. Requests already holding an earlier snapshot may complete with the earlier state; `Cache-Control: no-store` prevents application/HTTP reuse. Cursor pages are separate snapshots, so edits between them can change membership.

## Migration and recovery

Use reviewed EF Core migrations through a one-shot migration identity, before API replicas start. Inspect generated SQL for constraints, generated-column support, collation, index predicates, locks and destructive operations. The API role needs only the SELECT/INSERT/UPDATE permissions required for its operations and audit INSERT; it needs no DDL, catalog DELETE, or audit UPDATE/DELETE. Schema compatibility is part of readiness. For a failed or uncertain mutation, inspect the unique audit request ID and current row version using an operator credential after database reachability returns; absence during an in-flight transaction is not proof of rollback. Backup/restore follows the combined Phase 01 procedure, including revoking restored sessions before ingress reopens.

## System Design Prerequisites & Concepts to Learn

Study [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html), [READ COMMITTED snapshots](https://www.postgresql.org/docs/current/transaction-iso.html), and [EF Core concurrency tokens](https://learn.microsoft.com/en-us/ef/core/saving/concurrency). Reproduce a publish/deactivate race and a same-version edit race with two connections. Inspect committed rows and audit together; an HTTP status alone cannot establish atomicity.
