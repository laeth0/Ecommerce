# Checkout: System Design Prerequisites & Concepts to Learn

**Status:** study plan and future controlled experiments. Read the [roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md#06--checkout), [module boundaries](../00-project-overview/global-architecture-and-evolution.md), [Cart contract](../04-shopping-cart/functional-requirements/api-and-module-contracts.md), [Inventory contract](../03-inventory-and-stock/functional-requirements/api-and-module-contracts.md) and [Orders contract](../05-orders/functional-requirements/api-and-module-contracts.md) first.

## 1. Customer acceptance versus authoritative validation

**Concept.** A preview records what the customer saw; stock and current prices remain authoritative at submission. A cart version describes product quantities, not a guaranteed price or reservation.

**Under the hood.** Lock/read the owned cart, read a bounded Catalog batch, calculate exact USD cents and save a five-minute quote. Submission locks that quote and cart, reserves through Inventory, compares locked current prices and policy, then persists the accepted order. No preview reserves stock.

**Problem and rationale.** Trusting a browser's total permits tampering. Silently charging a new price violates explicit acceptance. Reserving during every preview ties stock to abandoned browsing. A quote plus revalidation makes the acceptance boundary explicit.

**Alternatives and costs.** Client-supplied accepted prices can work with rigorous comparison but duplicate snapshot rules on the client. Freezing every price or stock balance for a preview changes merchant policy and increases contention. Stored quotes add short-lived address data, cleanup and expiry checks.

**Experiment.** Preview, then change quantity, price, publication, destination policy or final-unit availability before submission. Inspect rejection and verify that no attempt/reservation/order partially commits. Pause a lock wait across quote expiry; database time after the wait decides eligibility.

## 2. Idempotency and request fingerprints

**Concept.** Idempotency identifies one logical effect across repeated requests. The key, canonical request and scope form one durable identity; a server correlation ID solves a different problem.

**Under the hood.** Bind a Customer's Idempotency-Key to the submitted quote. A unique database key arbitrates concurrent replicas. After a known commit, exact replay returns the immutable acceptance receipt before current quote/cart/stock validation. Changed input conflicts. After an unknown commit, reuse the original key and body.

**Problem and rationale.** A timeout cannot show whether acceptance committed. A process cache or pre-insert lookup alone can lose identity or race. Stable retained binding prevents a retry from becoming a second order.

**Alternatives and costs.** A globally scoped key creates cross-user interference. Expiring accepted bindings without a recovery policy allows duplicate effects. Permanent binding for retained purchases uses storage and needs a future coordinated retention policy. Quote uniqueness prevents a second key from buying the same quote; it cannot identify separately accepted intents as duplicates.

**Experiment.** Submit the same key/body from two replicas, disconnect after commit and replay after quote expiry and fulfillment. Change the quote under the accepted key and verify conflict with no new effect. Study [PostgreSQL unique constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).

## 3. Local atomicity and external uncertainty

**Concept.** One PostgreSQL transaction can combine monolith owner writes. It cannot atomically commit a provider network operation.

**Under the hood.** Commit attempt, reservation and order first. A payment owner persists a stable financial intent before dispatch. Record financial outcome separately, then resolve Orders/Inventory in a short local transaction. A timeout retains unknown work; it does not become a decline.

**Problem and rationale.** Calling a provider before durable local identity can leave a capture with no recoverable purchase. Holding database locks while waiting exhausts pools and still cannot guarantee rollback of money.

**Alternatives and costs.** A synchronous happy path alone loses crash recovery. Two-phase commit requires participants the provider does not offer. Durable coordination adds intermediate states and compensation. The local transaction changes after service extraction; Phase 11 revisits that boundary.

**Experiment.** Interrupt after acceptance, after financial-intent commit, after simulated capture and before local confirmation. Resume the same operation and inspect every owner. Study [EF Core shared transactions](https://learn.microsoft.com/en-us/ef/core/saving/transactions#cross-context-transaction): participating contexts share both connection and transaction; simultaneous commands on one context are not the design.

## 4. Leases, fencing and delivery at least once

**Concept.** A lease limits which worker may apply a current workflow result. It does not guarantee that an external call happened only once.

**Under the hood.** Claim one due work row with SKIP LOCKED, store a random lease token/deadline and commit. Perform bounded external work without a connection/lock. Reacquire the work row and verify the still-valid token before applying local effects. A replacement worker reuses the same financial operation identity.

**Problem and rationale.** A worker can crash or pause after dispatch. A lease may expire while the old process is still running. Fencing protects local progress, while owner idempotency protects repeated financial requests.

**Alternatives and costs.** Holding a row lock during network I/O prevents takeover but consumes scarce connections. A process mutex cannot coordinate replicas. A broker adds another runtime before it is needed. PostgreSQL work rows reuse existing durability but require indexes, bounded scans, vacuum and stale-lease recovery. [SKIP LOCKED](https://www.postgresql.org/docs/18/sql-select.html#SQL-FOR-UPDATE-SHARE) deliberately skips contenders and does not provide a globally consistent queue snapshot.

**Experiment.** Pause worker A after claim beyond the lease, let B claim and finish, then resume A. A cannot apply a stale local mutation; any repeated financial call retains the original operation key. Kill a process at each claim/dispatch/commit boundary.

## 5. Expiry, cancellation and compensation

**Concept.** Money truth, stock terminality and business cancellation are separate facts. Compensation is another durable, fallible operation; it is not a rewind.

**Under the hood.** Inventory's locked database-time check decides whether consumption is still permitted. Cancellation persists in Orders before financial resolution. Release stock immediately when permitted, abort undispatched payment atomically at its owner, and otherwise inspect the original financial operation. Captured but unfulfillable money gets a full remaining-capture compensation intent before terminal Orders resolution.

**Problem and rationale.** Extending reservations whenever payment is unknown can monopolize stock indefinitely. Inferring failure from a timeout loses late capture. Refunding cannot authorize shipment or automatically restock consumed units.

**Alternatives and costs.** The selected fixed 15-minute deadline bounds stock ownership and accepts that late capture may need a refund. Durable compensation adds recovery and manual-review obligations. Provider-specific proof of no capture and refund accounting are Phase 07 requirements, not assumptions about an arbitrary gateway.

**Experiment.** Cross the reservation deadline with delayed simulated capture; stock expires and compensation completes without confirmation. Race cancellation with payment dispatch and with Admin processing. Inject refund failure and verify visible manual review without reopening Orders.

## 6. Lock composition and conditional cleanup

**Concept.** Individually correct owner operations can deadlock when a coordinator reverses their lock order. Cleanup is a separate consequence of confirmation, not permission to overwrite newer cart edits.

**Under the hood.** Acceptance takes Identity, attempt, quote, Cart, Inventory group, Catalog and stock, then inserts a new Order. Existing resolution takes work, attempt, Order, Inventory and financial-owner rows. Cart cleanup uses a separate work/attempt/Cart transaction and checks the accepted cart version. No Cart lock follows an existing Order lock.

**Problem and rationale.** Group→existing Order and Order→group create a cycle. Clearing after confirmation without a version guard deletes edits made while payment was pending. A separate guarded cleanup step preserves those edits and survives interruption.

**Alternatives and costs.** Clearing at acceptance removes the cart even on financial failure. Holding Cart through payment blocks edits. Deferred conditional cleanup adds one durable job; a conflict safely skips it. Study [PostgreSQL explicit locks and deadlocks](https://www.postgresql.org/docs/18/explicit-locking.html).

**Experiment.** Draw every path, including foreign-key locks and owner callbacks. Race cart edits with cleanup in both orders, and replay cleanup after response loss. Verify one version increment or a preserved newer cart, with no Order/Inventory lock in cleanup.
