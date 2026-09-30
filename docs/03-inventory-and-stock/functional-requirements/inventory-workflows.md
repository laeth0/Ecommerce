# Inventory Business Workflows

**Status:** proposed Phase 03 behavior. [Contracts](api-and-module-contracts.md) define inputs/outcomes; [schema and transactions](../database/schema-and-transactions.md) define atomicity. Inventory never calculates or changes money.

## Shared invariants

| ID | Rule | Enforcement |
| --- | --- | --- |
| STK-INV-01 | A Catalog product has one stable stock identity at the single location; no physical delete or SKU-based rekey | Product UUID primary/foreign key and initialization integration |
| STK-INV-02 | Quantities are whole units with `0 <= reserved <= on_hand <= 1,000,000,000`; `available = on_hand - reserved` | Database checks and guarded stock transaction |
| STK-INV-03 | A reservation group is all-or-none for its distinct product lines | One PostgreSQL transaction and fixed lock order |
| STK-INV-04 | One intent UUID has at most one reservation group and one canonical line fingerprint; a replay cannot allocate again | Unique intent and recheck under lock |
| STK-INV-05 | A group moves from Active to exactly one of Consumed, Released, or Expired; each line receives one matching terminal movement | Locked state transition, unique movement source, same transaction |
| STK-INV-06 | Sum of committed movement deltas from zero equals each materialized counter; no balance change commits without its movement | Same transaction, append-only movement and reconciliation |
| STK-INV-07 | A due Active reservation is ineligible for consumption even before the worker releases its counters | Database time checked after group lock |
| STK-INV-08 | Refund success does not restock; restock requires a separate authorized physical adjustment or a later returns policy | Inventory boundary and global invariant |

`on_hand` is physical stock recorded by Inventory, `reserved` is the total quantity of Active reservation lines, and `available` is derived. When an Active group passes its expiry but worker processing is late, reserved remains allocated until an expiry transaction commits; this is conservative and cannot oversell. No public or cart API promises real-time availability in this phase.

The confirmed reservation lifetime is 15 minutes from database creation time. It is not refreshed by a read or retry. There is no extension or indefinite hold operation in Phase 03. Phase 06 must either complete within that deadline or use the documented late-payment recovery path.

## STK-E1 — Stock identity and adjustments

### STK-FR-01 — Initialize a stock item

**Actor:** product-create application flow coordinating Catalog and Inventory owner operations, and the Phase 03 migration/backfill for existing products.

**Flow:** insert exactly one zero-balance item keyed by the immutable product UUID. The application flow calls Catalog creation and Inventory initialization; Catalog product, Catalog audit and new stock item commit in one local transaction for future creates. A retry of initialization for the same product is a no-op if the item already exists; it must not reset nonzero stock. Backfill existing products once before marking Phase 03 ready.

**Acceptance:** every Catalog product has one Inventory item after migration and after a new product create. A failed item insertion rolls back that product creation, and duplicate initialization never changes balances.

### STK-FR-02 — Inspect current stock

**Actor:** eligible Admin from the Phase 01 allowed network. **Trigger:** `GET /api/v1/admin/inventory/items/{productId}`.

**Flow:** authenticate before product/item lookup; return product ID, on-hand, reserved, derived available, version and UTC update time. This is one primary-database read snapshot. Archived and otherwise nonpublic products remain visible to Admin for reconciliation.

**Errors:** malformed ID → `400`; absent Catalog product → `404 Inventory.ItemNotFound`; missing stock row for an existing product → `503` invariant failure; dependency outage → `503`. No public stock detail is exposed.

**Acceptance:** Admin sees exact current counters; Customer and disallowed-source Admin cannot infer private stock through this route.

### STK-FR-03 — Adjust physical stock

**Actor:** eligible Admin. **Trigger:** `POST /api/v1/admin/inventory/adjustments` with a caller-generated operation UUID, product UUID, signed nonzero delta and 1–256-character reason.

**Flow:** revalidate Admin user/session under Phase 01 shared locks, lock the Catalog product and Inventory item, then apply `on_hand + delta` only if `reserved <= new_on_hand <= 1,000,000,000`. Append one movement with the same operation identity and return a durable receipt with resulting counters. Adjustment is permitted for any existing product status, including Archived, because physical stock can still need reconciliation. It does not publish the product or change a reservation.

**Idempotency:** a committed operation UUID from the same Admin actor with the same product, delta and normalized reason returns the original receipt without another movement. Reuse by a different actor or with different fields returns `409 Inventory.OperationConflict`. If a request failed before commit, the same UUID may be reevaluated against current stock. The server request ID is diagnostic and is not the operation UUID.

**Errors:** absent product/item → `404` or invariant `503` as above; new on-hand below reserved → `409 Inventory.InsufficientUnreservedStock`; valid delta that would exceed 1,000,000,000 → `409 Inventory.CapacityExceeded`; malformed/out-of-range delta input → `400`; database/movement failure → `503`. A rejected adjustment leaves stock and ledger unchanged.

**Acceptance:** a negative adjustment cannot remove units promised to Active groups. Retrying a committed positive adjustment cannot add units twice. A refund callback cannot use this Admin operation or silently trigger it.

## STK-E2 — Internal reservation

### STK-FR-04 — Reserve a bounded product set

**Actor:** trusted internal Checkout operation; a restricted local scenario driver may invoke it with synthetic intent during Phase 03 verification. There is no customer or Admin HTTP reservation route.

**Input:** one stable intent UUID and 1–20 distinct `(productId, quantity)` lines, each quantity 1–100 whole units. Canonicalize lines by product UUID. The fingerprint is SHA-256 of a one-byte version `0x01`, one-byte line count, then each line's 16 UUID bytes in RFC 4122 order and four-byte unsigned big-endian quantity.

**Flow:** first check for an existing intent and return its stored outcome if its fingerprint matches, regardless of later product visibility. For a new intent, use the caller's PostgreSQL transaction or begin one for standalone internal work. Insert the unique Active group first, with `created_at` from database `clock_timestamp()` and `expires_at` exactly 15 minutes later; this uncommitted row serializes concurrent attempts with the same intent. If its insert conflicts with a committed or concurrent winner, read that winner's stored fingerprint/outcome instead of allocating again. Next call Catalog's transactional sellability operation, which locks products in UUID order and distinct categories in UUID order and verifies Published/Active state. Lock the stock items in product-ID order and verify every available count covers its quantity. Create the lines, increment each reserved counter, and append one Reserve movement per line. Commit all or none. An unavailable product/stock row rolls back the new group. No provider call or network wait occurs under these locks.

**Idempotency and errors:** an existing intent with the same fingerprint returns its stored group and current state, including a terminal result, without new allocation. A different fingerprint returns `IntentConflict`; unavailable stock returns `InsufficientStock`; non-sellable product returns `ProductNotSellable`; a missing Catalog product returns `ProductNotFound`; dependency failure is `Unavailable`. Failed new requests create no group, line or movement. The caller must validate customer/cart ownership; an intent UUID is not authority.

**Acceptance:** two simultaneous intents competing for one available unit yield exactly one Active reservation. A two-line request whose second item is unavailable leaves the first item's balance unchanged. A replay after an unknown commit cannot allocate twice.

## STK-E3 — Terminal reservation states

| Command | Active before deadline | Active at/after deadline | Already same terminal | Other terminal |
| --- | --- | --- | --- | --- |
| Consume | Consume all lines; decrement both on-hand and reserved | Expire all lines, then return Expired | Return stored outcome without movement | Return current incompatible terminal outcome |
| Release | Release all lines; decrement reserved | Expire all lines, then return Expired | Return stored outcome without movement | Return current incompatible terminal outcome |
| Expiry worker | Skip before deadline | Expire all lines; decrement reserved | No work | No work |

### STK-FR-05 — Consume once

**Actor:** trusted Checkout completion after payment evidence and order-policy validation in later phases. Lock the group and its stock rows, obtain database time after all locks, apply the table above, and write Consume movements atomically with the group state. The internal result distinguishes `Consumed`, `Expired`, `Released`, and `NotFound`. Only `Consumed` is evidence of committed stock for fulfillment; Inventory itself does not mark an order paid.

**Acceptance:** duplicate Consume has one effect; Consume racing Expire has one terminal winner. If payment succeeds after Expired, Phase 06/07 must keep a non-fulfillable recovery state and arrange compensation rather than claim inventory was committed.

### STK-FR-06 — Release once

**Actor:** trusted Checkout cancellation/failure path. Supply a controlled reason code such as `CheckoutAborted`, `PaymentFailed`, or `CustomerCancellation`; the later order policy decides when each is permitted. Lock the group and its stock rows, then check database time and apply the table above. No on-hand increment occurs because reservation never removed physical stock. A Consumed group cannot be released; any actual return/restock is a separate later business process.

**Acceptance:** duplicate Release does not increase availability twice. Release racing Consume/Expire yields exactly one terminal outcome and matching movements.

### STK-FR-07 — Expire durably

**Actor:** Inventory background worker, including another replica after a crash. Poll the indexed due Active groups in bounded transactions using `FOR UPDATE SKIP LOCKED`. Re-read state and database time under lock; expire all lines, decrease reserved, append movements and commit. A crash before commit leaves the group discoverable; a crash after commit makes replay a no-op. Worker lag is measured, not hidden by pretending expiry occurred earlier.

**Acceptance:** a worker restart cannot lose due work or release a group twice. An overdue Active group cannot be consumed even when the worker is stopped.

## STK-E4 — Reconcile stock

### STK-FR-08 — Detect divergence

**Actor:** restricted operator process. For each bounded batch of items, compare counters against the sum of its immutable movement deltas from the zero baseline and compare reserved against quantities in Active group lines within one database statement snapshot. Report mismatches and the oldest due Active group without changing data. Paginate/batch the scan; batches have separate snapshots, so do not claim one global point-in-time total. A repair requires a separately reviewed, audited operation; this phase has no automatic balance rewrite.

**Acceptance:** a deliberately corrupted sandbox balance is detected. Healthy balances and Active lines reconcile at a consistent database snapshot, including groups awaiting overdue expiry.

## System Design Prerequisites & Concepts to Learn

Use the [phase prerequisites](../system-design-prerequisites.md) to identify each operation's authority, lock order, linearization point, and replay identity. Inspect balance and movement rows together after every failure; a successful response alone does not prove conservation.
