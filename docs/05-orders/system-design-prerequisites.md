# Orders: System Design Prerequisites & Concepts to Learn

**Status:** Phase 05 study plan and future failure experiments. Read the [roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md#05--orders), [global module boundaries](../00-project-overview/global-architecture-and-evolution.md), [Cart contract](../04-shopping-cart/functional-requirements/api-and-module-contracts.md), and [Inventory contract](../03-inventory-and-stock/functional-requirements/api-and-module-contracts.md) before implementation.

## 1. Aggregate boundaries and historical snapshots

**Concept.** An order groups the facts accepted for one purchase. Current product/account/address data and accepted historical facts have different owners and lifetimes.

**Under the hood.** Checkout validates current inputs, then asks Orders to persist product identity, SKU/name, quantity, accepted USD unit price, component amounts and shipping address together. Future reads use those saved fields. A Catalog rename, hide or reprice cannot change the order's accepted meaning.

**Problem and rationale.** Joining historical order lines to current Catalog prices rewrites history. Reusing a mutable account address can send an old order to a new destination. Stable snapshots make purchase records interpretable even after their source data changes.

**Alternatives and costs.** References alone save storage but lose accepted facts. Snapshotting every Catalog field copies unnecessary data. A bounded snapshot copies only fields needed to explain price and fulfillment; it adds storage and deliberate retention/privacy obligations. Price arithmetic must use exact USD cents and preserve the confirmed two-decimal monetary policy.

**Experiment.** Create an isolated order snapshot through the internal owner operation, then change product name/price/publication and the source address. Read the order again and compare every saved field. Force failure while writing the last line and confirm the whole snapshot rolls back.

## 2. State machines and guarded transitions

**Concept.** A lifecycle is a set of allowed transitions with actors, guards and effects. A status string alone does not protect a business invariant.

**Under the hood.** Authorize the caller, lock or conditionally update the current order, compare the client version where required, evaluate the source state and relevant facts, write the new state/version and required audit together, then acknowledge after commit.

**Problem and rationale.** A generic “set status” endpoint permits shipment before payment or delivery before shipment. Separate commands make each business action reviewable and keep forbidden transitions explicit.

**Alternatives and costs.** A transition table or domain methods can both implement a small state machine. A workflow engine is unnecessary for a short local lifecycle. Client optimistic versions plus short PostgreSQL row locks surface stale decisions and serialize competing writes; holding locks while a person decides would waste capacity.

**Experiment.** Race cancellation and fulfillment against the same order from two clients/replicas. Verify that the documented winner blocks the incompatible action. Repeat a transition using stale and current versions and inspect state/audit. Study [PostgreSQL locks](https://www.postgresql.org/docs/18/explicit-locking.html) and [EF Core concurrency tokens](https://learn.microsoft.com/en-us/ef/core/saving/concurrency).

## 3. Order state, money truth and stock truth

**Concept.** Purchase acceptance, financial capture/refund and stock consumption are separate facts. Successful payment alone does not prove fulfillability; an order outcome alone does not prove money moved.

**Under the hood.** Payments validates and records provider evidence. Inventory applies its reservation state machine using database time. Checkout coordinates their outcomes and asks Orders to make the permitted business transition. An order snapshot must agree with the amount/currency and product quantities verified by those owners.

**Problem and rationale.** Combining payment and fulfillment in one enum makes a partially refunded delivered order difficult to represent and can erase late financial success. Treating an overdue stored Active reservation as valid stock permission bypasses Phase 03's locked expiry check.

**Alternatives and costs.** A local transaction can combine compatible database changes in the monolith, but cannot include an external provider call. A later service extraction needs durable coordination and compensation. Separate facts add intermediate outcomes that must be observable; they preserve the evidence required to recover an uncertain purchase.

**Experiment.** Simulate verified capture with a consumable reservation, then with an expired reservation. Only the first may become fulfillable. Replay the same input and verify no duplicate consumption. Display a refund outcome without rewinding shipment history. Identify every simulated fact until Phases 06–07 supply real owner contracts.

## 4. Cancellation intent and external uncertainty

**Concept.** A customer's cancellation request can be committed locally even while a provider outcome is unknown. Request acceptance and completed cancellation are different milestones.

**Under the hood.** A local transaction records permitted cancellation intent and prevents incompatible fulfillment from starting. Checkout/Payments later resolves any in-flight payment and Inventory outcome. Completion follows the defined guards, rather than the HTTP client's timeout or an operator guess.

**Problem and rationale.** Immediately labeling an uncertain payment failed can lose a valid late capture. Failing to persist cancellation intent lets a crash forget the customer's request. Starting fulfillment after accepting cancellation defeats its purpose.

**Alternatives and costs.** Disallowing cancellation during uncertainty simplifies behavior but is a product policy. A durable request makes recovery discoverable; it adds progress/evidence and requires later coordination. Reservation release and physical restock remain distinct: Phase 03 supports releasing Active reservations, while consumed-stock restoration uses an authorized adjustment, not a generic order status update.

**Experiment.** Pause payment confirmation, accept or reject cancellation according to the selected cutoff, then resume confirmation in both orders. Inspect the order's durable request, stock terminal outcome and verified money evidence. Kill the process after request commit and show that the request remains discoverable.

## 5. Cross-module transaction and lock ordering

**Concept.** Composing individually correct module operations can still deadlock if they acquire shared resources in different orders. A transaction owner must make both the boundary and ordering explicit.

**Under the hood.** Human mutations take Identity user/session locks first. Cart input has its own parent lock; Inventory requires reservation group before Catalog/stock. Orders must fit its aggregate lock into an acyclic order, and every coordinator path must use that order. Owner operations participate in a caller transaction without committing it independently.

**Problem and rationale.** One callback holding a reservation and waiting for an order can deadlock with cancellation holding the order and waiting for the reservation. A process-local lock cannot fix that across API replicas. A provider network call while holding locks can exhaust the shared connection pool.

**Alternatives and costs.** Database deadlock detection aborts a participant but does not replace a consistent order or recovery policy. Distributed locks introduce another owner and failure boundary. Short local transactions with explicit owner contracts fit the current monolith; extracted services require a revised coordination design.

**Experiment.** Draw the resource graph for creation, confirmation, cancellation and Admin fulfillment. Pause competing transactions after the first resource, then complete each interleaving. Record bounded lock failures and inspect whole-transaction rollback. Study [PostgreSQL isolation](https://www.postgresql.org/docs/18/transaction-iso.html).

## 6. History pagination, privacy and evidence

**Concept.** Customer history is an owner-scoped, bounded read over immutable ordering keys. Cursor authenticity and Customer authorization solve different problems.

**Under the hood.** Restrict rows by verified owner, order by creation time and a unique ID, fetch one bounded page, and retain ordering position for the next request. Avoid OFFSET over large history, expensive global counts, and hydrating every order's lines/address when only a summary is needed.

**Problem and rationale.** Unsigned owner selection creates an object-access vulnerability. Fetching full addresses into lists/telemetry exposes unnecessary personal data. Paging while lifecycle states change does not create a snapshot of the entire history; the contract must explain that limit.

**Alternatives and costs.** Keyset pages fit immutable creation order and use an ordinary composite B-tree. Offset is simpler but gets expensive for deep history. Search, partitioning and replicas require measured need and explicit lag/privacy policies. Constraints protect row structure; line counts, subtotal sums and owner/evidence relationships also need transaction-level enforcement.

**Experiment.** Populate synthetic deep history, compare first/later page plans, insert another order while paging and inspect duplicate/missing behavior. Attempt a cursor from another Customer and confirm denial. Verify address data is absent from summary/log/metric payloads. Study [PostgreSQL constraints](https://www.postgresql.org/docs/18/ddl-constraints.html) and record real database evidence separately from schema/document validation.
