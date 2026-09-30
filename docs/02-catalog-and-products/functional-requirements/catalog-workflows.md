# Catalog Business Workflows

**Status:** proposed Phase 02 behavior. [API contracts](api-contracts.md) define exact wire shapes and errors; [schema and transactions](../database/schema-and-transactions.md) define atomicity. All monetary values are USD cents.

## Shared rules and invariants

| ID | Rule | Owner and consistency |
| --- | --- | --- |
| CAT-INV-01 | Each product UUID and SKU identify one durable product; IDs and SKUs are never reused | Catalog; PostgreSQL uniqueness |
| CAT-INV-02 | Every product belongs to exactly one existing category; catalog never changes Inventory's stock | Catalog; foreign key and module boundary |
| CAT-INV-03 | Public product visibility requires `Published` and an `Active` category at the read's statement snapshot | Catalog read query; primary PostgreSQL |
| CAT-INV-04 | Every product price is an integer from 1 to 99,999,999 cents and has currency `USD`; a mutation cannot silently round or convert | Catalog transaction and database checks |
| CAT-INV-05 | Each committed Admin state change increments only the target row version by one and commits its audit record with it; a canonical no-op PATCH leaves both unchanged | Catalog transaction |
| CAT-INV-06 | An archived product never returns to another state; published products can be hidden and republished | Catalog transition guard |
| CAT-INV-07 | An accepted order in a later phase stores its own historical price; later catalog edits do not rewrite it | Order owner, future phase |

Names and descriptions are plain Unicode text normalized to NFC at write time. Trim leading/trailing Unicode whitespace. Product name: 3–160 Unicode scalar values and at most 640 UTF-8 bytes. Category name: 2–80 scalars and at most 320 bytes. Description: 0–2,000 scalars and at most 8,000 bytes. Names reject Unicode control characters and line breaks; description allows LF but rejects other controls, including NUL and CR. Internal spaces/newlines remain as submitted. The API renders these values as data, never trusted HTML.

SKU is 3–32 uppercase ASCII letters/digits/hyphens, begins and ends with a letter or digit, and may contain consecutive internal hyphens. SKU is immutable and unique. Category slug is 3–48 lowercase ASCII letters/digits/hyphens, begins and ends with a letter or digit, has no consecutive hyphens, and is immutable/unique. A slug is a stable filter identifier, not a translated display name. Duplicate names are allowed because UUID/slug/SKU, rather than name, carry identity.

Exact policy decisions: each product has one required category at creation; a product begins Draft; a category begins Active; price must be supplied when creating Draft. Inventory availability is never included in this phase's public product shape. Public browsing and search do not reserve stock or guarantee a future checkout price.

## Actors and epic CAT-E1: categories

### CAT-FR-01 — Create a category

**Actor and preconditions:** eligible Admin session from an allowed source network; validated slug and name.

**Trigger and flow:** `POST /api/v1/admin/catalog/categories`. Identity authorization and source restriction pass. Insert one Active category at version 1 and an audit event atomically. Return `201` with resource and strong ETag.

**Validation and errors:** duplicate slug → `409 Catalog.SlugInUse`; malformed/unknown input → `400 Validation.Failed`; lost authorization → `401` or `403`; database/audit failure → `503`. A duplicate request has no idempotency key: once the first commit is known, a repeat receives `409` and creates no second category.

**Acceptance:** given two concurrent requests with the same slug, when both finish, exactly one category and one creation audit event exist. Public category listing includes the Active category.

### CAT-FR-02 — Edit category name or visibility

**Actor and preconditions:** eligible Admin; exact current category ETag in `If-Match`.

**Trigger and flow:** `PATCH /api/v1/admin/catalog/categories/{id}` changes name only. `POST /api/v1/admin/catalog/categories/{id}/deactivate` changes Active → Inactive. `.../activate` changes Inactive → Active. Each successful change increments version and writes audit in the same transaction. Target state reached already is a conflict, not a new mutation.

**Business rules:** deactivation immediately hides all Published products in that category from a new public statement. Their product status and version do not change. Reactivation immediately makes those same Published products visible. An Admin must inspect this implication before activation; no mass product update is performed. Draft, Hidden and Archived products remain invisible in either category state.

**Validation and errors:** missing `If-Match` → `428 Catalog.PreconditionRequired`; wrong version → `412 Catalog.VersionMismatch`; absent category → `404 Catalog.CategoryNotFound`; repeat active/inactive transition with current ETag → `409 Catalog.InvalidTransition`. Concurrent product publishing and category deactivation serialize on the category row.

**Acceptance:** given one Published product, when its category is deactivated, public detail/list/search no longer returns it. When category is reactivated, it returns again without a product version change. Two same-version rename requests produce one success and one `412`.

### CAT-FR-03 — Browse categories

**Actor:** anonymous, Customer or Admin. **Trigger:** `GET /api/v1/catalog/categories` with bounded limit/cursor.

**Flow and result:** list only Active categories ordered by name under C collation, then ID. Include an Active category even if it has no Published products. Each page is one primary-database statement snapshot. No total-count query is promised.

**Errors/edges:** bad filter/cursor → `400`; PostgreSQL outage → `503`. A category renamed/deactivated between pages may be missed or appear at a different position; the API does not promise a multi-request snapshot.

**Acceptance:** no Inactive category appears in a page started after the deactivation commit; page size never exceeds the configured maximum.

## Epic CAT-E2: product lifecycle

### CAT-FR-04 — Create a Draft product

**Actor and preconditions:** eligible Admin; existing category, Active or Inactive; valid immutable SKU, name, description, USD-cent price.

**Trigger and flow:** `POST /api/v1/admin/catalog/products`. Validate category existence. Insert one Draft product at version 1 and one audit event in a local transaction; return `201` and ETag.

**Errors:** duplicate SKU → `409 Catalog.SkuInUse`; absent category → `404 Catalog.CategoryNotFound`; invalid price/currency → `400`; database/audit outage → `503`. A category removed by a migration or race fails through the foreign key; the API translates a known missing target to `404` after rechecking.

**Acceptance:** given a valid new SKU, creation yields an Admin-visible Draft product that no public route returns. Given a duplicate SKU with different fields, the existing product is unchanged.

### CAT-FR-05 — Edit a non-Archived product

**Actor and preconditions:** eligible Admin; product ID; exact current product ETag; nonempty patch containing only `name`, `description`, `categoryId`, or `price`. `price` is a complete USD amount object.

**Trigger and flow:** `PATCH /api/v1/admin/catalog/products/{id}`. Authorize/revalidate; lock the target product and any new category required for a move; compare version; validate fields; apply provided changes; increment version and write audit. The update takes effect on subsequent public statements when product and category are visible.

**Business rules:** SKU/ID/status are immutable through this endpoint. A no-op patch (same canonical values) returns `200` with the existing representation/ETag and no audit or version increment. A price edit does not reserve price for carts or orders. A Published product may be moved to an Inactive category; it becomes publicly hidden until that category becomes Active. Price or name updates to a Published product in an Inactive category remain Admin-visible and public-hidden.

**Errors:** absent product → `404 Catalog.ProductNotFound`; Archived → `409 Catalog.InvalidTransition`; absent new category → `404 Catalog.CategoryNotFound`; missing/mismatched ETag → `428`/`412`; invalid field → `400`; transaction/audit failure → `503`.

**Acceptance:** two concurrent updates using one ETag cannot both change the product. An edit after a successful publish uses the new version. Future order price snapshots cannot be rewritten by this operation.

### CAT-FR-06 — Change publication state

**Actor and preconditions:** eligible Admin; product ETag; valid state transition.

| Command | Allowed from | Result and guard |
| --- | --- | --- |
| `publish` | Draft, Hidden | Published only if assigned category is Active |
| `hide` | Published | Hidden; immediately excluded from new public statements |
| `archive` | Draft, Published, Hidden | Archived; permanently excluded from public statements and future edits |

**Trigger and flow:** `POST /api/v1/admin/catalog/products/{id}/{command}` with no body. Revalidate Admin authority in the mutation transaction, compare version, validate category when publishing, change state, increment version and audit; return `200` with the new Admin representation and ETag.

**Errors:** current-state repeat or forbidden transition → `409 Catalog.InvalidTransition`; publish while category Inactive → `409 Catalog.CategoryInactive`; absent product → `404`; missing/mismatched ETag → `428`/`412`. An archived product cannot be recreated with the same SKU.

**Acceptance:** given a Draft product in an Inactive category, publish fails and leaves version/audit unchanged. Given two concurrent publish/hide commands with one ETag, at most one commits. Archived detail is inaccessible publicly but remains readable by Admin and future historical owners.

## Epic CAT-E3: product discovery

### CAT-FR-07 — Public detail

**Actor:** anyone. **Trigger:** `GET /api/v1/catalog/products/{id}` with a canonical UUID.

**Flow:** one primary-database query joins product/category and requires Published plus Active. Return public fields including immutable ID/SKU, name, description, category, USD price, product version, and UTC update time.

**Privacy/errors:** Draft/Hidden/Archived product, Inactive category, and unknown product all return the same `404 Catalog.ProductNotFound` response. Invalid UUID → `400`. No inventory quantity or private audit is returned.

**Acceptance:** switching any visibility predicate makes the next public request return `404`; an Admin route may still read the record.

### CAT-FR-08 — Public product list and basic search

**Actor:** anyone. **Trigger:** `GET /api/v1/catalog/products` with optional `category`, optional `q`, `limit`, and `cursor`.

**Flow:** validate filters; `category` is an exact slug; `q` is normalized NFC and trimmed, 2–80 Unicode scalars and 320 UTF-8 bytes, with no control characters or line breaks. Phase 02 search is English lexical matching of product name and description through PostgreSQL full-text search; it has no substring, fuzzy, prefix, translation, or ranking promise. A query that reduces to no searchable lexemes yields an empty page. Unknown or Inactive category slug yields an empty list, so the filter cannot reveal hidden category existence.

**Ordering and consistency:** list matches in `(name COLLATE "C", id)` ascending order. Each page is one statement snapshot. The cursor encodes the last ordered key and filters; no total count is returned. Changing a product name, category, visibility, or search text between pages can omit or repeat it. An unchanged row with unchanged filter fields is returned at most once while the cursor remains valid.

**Errors:** unsupported filters, oversize query, tampered/expired/mismatched cursor → `400 Validation.Failed`; database outage → `503`. No fallback from a stale search index exists.

**Acceptance:** a hidden product never appears in list or search, including when its text matches exactly; `limit=50` returns at most 50 products and indicates whether another page exists; a very deep catalog cannot force offset scanning.

## Epic CAT-E4: administration and audit

### CAT-FR-09 — Inspect one Admin record

**Actor:** eligible Admin. **Trigger:** `GET /api/v1/admin/catalog/categories/{id}` or `GET /api/v1/admin/catalog/products/{id}`.

**Flow:** authorize before target lookup; return full editable fields, lifecycle status, version, and strong ETag. Product read includes category ID and current status even when hidden/archived. No list of all drafts or bulk export is included; Admin knows IDs from mutation responses or its private operating records.

**Errors:** Customer → `403` regardless of existence; missing target → entity-specific `404`; database outage → `503`. Admin record reads do not create catalog audit events; the request remains in access-controlled operational logs. Future need for Admin listing requires a bounded separate contract.

**Acceptance:** Customer cannot infer hidden product state through Admin routes. Admin reads show the current version required for mutations.

## System Design Prerequisites & Concepts to Learn

Study the [phase prerequisites](../system-design-prerequisites.md) before implementing any epic. For each workflow, identify the invariant owner, transaction/statement snapshot, concurrent mutation that can invalidate a precondition, and evidence that a failed action left state unchanged. The state machine and per-row versions make these questions concrete without adding distributed infrastructure.
