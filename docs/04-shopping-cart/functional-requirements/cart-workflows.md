# Cart Business Workflows

**Status:** proposed Phase 04 requirements. MUST/MUST NOT define implementation obligations; SHOULD requires a documented reason for an exception. The confirmed operating model is one authenticated, persistent cart per Customer, 20 distinct lines, 1–100 whole units per line, USD cents, no automatic expiry, and whole-cart JSON version preconditions.

## Invariants and ownership

| ID | Required invariant | Owner/enforcement |
| --- | --- | --- |
| CRT-INV-01 | A cart and every line belong to the verified Customer subject; no public input can select another owner | Identity authority plus owner-scoped Cart operations |
| CRT-INV-02 | At most one parent per Customer and one line per product in that cart | PostgreSQL primary keys |
| CRT-INV-03 | A committed cart has 0–20 distinct lines and each line has 1–100 whole units | Parent-serialized transaction and quantity CHECK |
| CRT-INV-04 | Every effective mutation increments the parent version once; no-op preserves version/time; versions never reset on clear | Locked parent, guarded update and retained parent |
| CRT-INV-05 | Version comparison and all parent/line changes are atomic; rejected or rolled-back writes have no persistent effect | One primary-database transaction |
| CRT-INV-06 | Cart owns no accepted price, stock allocation, reservation, payment or Order state | Module boundaries; Inventory tables unchanged |
| CRT-INV-07 | Display product fields require Published product and Active category in the read snapshot | Catalog owner operation |
| CRT-INV-08 | Unavailable lines remain removable, have no public product fields/subtotal, and make the full subtotal null | Read projection and response validation |
| CRT-INV-09 | All display arithmetic uses checked 64-bit USD cents; no rounding/floating point or client monetary authority | Catalog price bounds and Cart calculation |
| CRT-INV-10 | Successful acknowledgements follow commit; uncertain commits require state reconciliation | Application flow and recovery policy |

## CRT-FR-01 — Read my cart

**Actor/preconditions:** authenticated, Active Customer with an eligible Phase 01 session. Anonymous, Admin and revoked/disabled identities cannot use Cart routes. An Admin who wants to shop must use a separate Customer account.

**Trigger and flow:** `GET /api/v1/cart`. Derive owner from the validated JWT subject. In a short read-only shared-snapshot transaction, load parent/lines, obtain a bounded Catalog public projection, classify each line and calculate the display subtotal. Return items sorted by canonical product UUID. A missing parent returns an empty virtual cart with version 0, null `updatedAt` and zero USD subtotal; GET MUST NOT create a parent.

**Rules:** a visible product is `Listed`, regardless of current stock. Its line carries current public SKU/name, unit price and exact quantity-times-price line subtotal. Hidden, Draft, Archived or Inactive-category products become `Unavailable`; product and line subtotal are null. Do not expose status reason, hidden name/SKU/price or a previously saved product snapshot. Unavailable lines count toward the 20-line cap. If any exists, `hasUnavailableItems=true` and the cart subtotal is null. Otherwise sum every line subtotal; the empty sum is zero. This subtotal excludes future tax, shipping and discount policy and is not a payable total.

**Consistency:** one transaction snapshot covers intent and Catalog hydration. A read started before a later hide or price commit can return its earlier snapshot; the next new read observes the committed state. A Catalog/DB error is `503`, not an empty cart or a cart full of unavailable products. Authority follows the Phase 01 protected-read snapshot rule; later revocation does not cancel an already authorized read.

**Acceptance:** an edit survives logout/login and process restart. After a price edit, a new GET shows the new price with unchanged Cart version. After category deactivation, a saved line is blocked without hidden fields and the subtotal is null. Zero stock changes none of these display rules.

## CRT-FR-02 — Add a product or set its desired quantity

**Actor/preconditions:** eligible Customer, canonical product UUID, required JSON `expectedVersion` and `quantity`. Quantity is an absolute whole-unit value from 1 through 100; zero is invalid and removal has its own command. The product must be currently publicly sellable.

**Trigger and flow:** `PUT /api/v1/cart/items/{productId}`. Begin one write transaction; revalidate Identity under user/session shared locks, acquire/create the owned parent and lock it, compare version, then use Catalog's product/category lock protocol to verify sellability. If the product already has a line, set its quantity. Otherwise ensure fewer than 20 lines and insert the unique line. Advance the parent version/time once for an effective change. Commit before returning a `MutationReceipt`.

**Rules:** two first additions serialize through the unique parent. The temporary creation version is 0 inside the uncommitted transaction; the first effective addition commits at version 1. Failed product/limit validation rolls back a newly inserted parent. Replacing a quantity in a 20-line cart is allowed. Setting the existing quantity of a still-sellable product is a no-op after version and sellability checks. Setting an unavailable line, even to its unchanged quantity, fails; it can be removed instead. No write checks or changes Inventory, so desired quantity may exceed available stock.

**Errors and precedence:** malformed input → `400 Validation.Failed`; stale version → `409 Cart.VersionMismatch`; absent or nonpublic product → the same `409 Cart.ProductUnavailable`; a new 21st line → `409 Cart.LineLimitExceeded`; lock/DB timeout → sanitized `503`. Check version before product or line-cap rules, and sellability before the new-line cap. No error includes hidden product fields. A price change alone does not cause a Cart version conflict or store an accepted price.

**Acceptance:** quantity 1 and 100 succeed for eligible products, while 0/101/fractions fail. Two same-version effective edits cannot both commit. An invalid first addition leaves no parent. Twenty valid lines fit; a 21st is rejected with no version change. Stock movements and reservations remain unchanged.

## CRT-FR-03 — Remove one product

**Actor/preconditions:** eligible Customer and canonical product UUID; JSON contains only required `expectedVersion`. No current Catalog sellability or stock is required.

**Trigger and flow:** `POST /api/v1/cart/items/{productId}/remove`. Revalidate Identity and lock the owned parent if it exists. Compare the current version, then delete only that owner's matching line. If a line was removed, increment parent version/time once. Retain the parent even when empty. Return the committed acknowledgement.

**Rules and edges:** an absent line at the correct version is a successful no-op. A missing parent has virtual version 0; removal with expected 0 is a no-op and creates nothing. A stale version conflicts before an absent-line no-op. Unknown and unavailable products can be removed without revealing whether Catalog has a row. On a missing parent, a concurrent first addition may serialize after the no-op; the acknowledgement does not promise the cart stays unchanged after that observation.

**Acceptance:** remove a blocked line after hide/archive/category deactivation. Other lines survive. Remove the same product again using the current version and observe `changed=false`. Reusing a stale original version conflicts even if the line is now absent.

## CRT-FR-04 — Clear my cart

**Actor/preconditions:** eligible Customer and JSON containing only required `expectedVersion`.

**Trigger and flow:** `POST /api/v1/cart/clear`. Revalidate Identity, lock the owned parent, compare version, delete all its lines and increment the parent once if any existed. A current empty cart returns a no-op. A missing parent at expected 0 returns the virtual no-op and creates nothing.

**Rules:** no product lookup, Inventory release or reservation cancellation is performed. Cart had allocated no stock. Clear cannot bypass the version check or reset/delete the parent. No TTL or logout action clears the cart. Account disable blocks access but retains its contents; enable does not restore old sessions.

**Acceptance:** clearing 20 lines increments once, leaves an empty durable parent and zero subtotal on the next read. A stale clear leaves newer lines untouched. Clear/refill never makes an earlier version valid again.

## CRT-FR-05 — Resolve conflict and uncertain response

**Actor/preconditions:** a client received `Cart.VersionMismatch`, timeout, cancellation, connection loss or a dependency failure during a mutation.

**Flow:** GET the current cart when authority and PostgreSQL are available. Reconcile the intended operation with that observed intent. A conflict requires a deliberate new decision using the latest version. After an ambiguous result, the original precondition may be retried unchanged; if the earlier change committed, it cannot apply a second effective edit. Never automatically substitute a newer version, especially for clear/remove.

**Rules:** equality with the desired quantity shows current state, not historical proof of which request succeeded. A GET while the first transaction is still in flight may observe older committed data; a subsequent conditional write still arbitrates under the parent lock. No command ID/receipt-history endpoint is supplied. Request IDs are diagnostic and cannot deduplicate business edits.

**Acceptance:** simulate rollback before commit and response loss after commit. Reload through another replica and inspect version/lines. Original-version retries do not double-apply an increment or clear newer content. A successful no-op and its duplicate may both return the same version.

## CRT-FR-06 — Supply owned intent to future Checkout

**Actor/preconditions:** trusted in-process Checkout flow after Customer authentication and transaction-time Identity checks. It supplies a verified owner, expected Cart version and a caller-owned primary transaction. Public clients cannot call this operation directly.

**Flow:** Cart locks its parent `FOR UPDATE`, compares version and returns the sorted product/quantity lines. Empty intent returns `Empty`; mismatch returns `VersionMismatch`. The lock remains with the caller's transaction. No product price, display subtotal or public availability Boolean is accepted as purchase authority.

**Rules:** Cart neither commits nor reserves, calls a provider, creates an Order, or clears itself. Phase 06 acquires Inventory intent group before Catalog/stock locks, then validates/accepts prices and creates durable local purchase state before provider work. The extended order is Identity user/session → Cart parent → reservation group → Catalog products/categories → stock. Do not lock Cart after holding group/Catalog/stock locks. The eventual post-purchase cleanup rule must protect newer edits and is deferred to Phase 06.

**Acceptance:** a competing cart edit cannot change the captured lines while the transaction holds the lock; it waits within budget or fails. Rollback releases the lock and leaves intent unchanged. A Customer A context cannot be replaced with B's UUID by public input. A Phase 04 cart route creates no Checkout or payment records.

## System Design Prerequisites & Concepts to Learn

For each workflow, study the [prerequisites](../system-design-prerequisites.md), identify its serialization/snapshot point, and reproduce a normal, boundary, conflict and rollback case. The same HTTP status can arise from different interleavings; inspect committed parent/lines and untouched Inventory data to establish the invariant.
