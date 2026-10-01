# Shopping Cart: System Design Prerequisites & Concepts to Learn

**Status:** Phase 04 study plan and future failure experiments. Read the [roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md#04--shopping-cart), [Identity authorization contract](../01-identity-and-auth/database/schema-and-transactions.md), [Catalog decisions](../02-catalog-and-products/architecture-decisions.md), and [Inventory contracts](../03-inventory-and-stock/functional-requirements/api-and-module-contracts.md) first.

## 1. Purchase intent and authoritative facts

**Concept.** A cart records which products a customer wants and in what quantities. Catalog owns current publication and prices. Inventory owns stock allocation. Orders will own the accepted purchase snapshot.

**Under the hood.** Read the customer's durable product IDs and quantities, obtain current permitted Catalog fields, then calculate a display subtotal. Later Checkout must revalidate publication, obtain an accepted price snapshot, and call Inventory to reserve stock. A cart read or write creates no reservation.

**Problem and rationale.** Two customers can place the last unit in their carts. Reserving on every cart edit would let abandoned shopping block stock and would turn an ordinary editing action into a timed purchase workflow. Deferring allocation to Checkout keeps stock decisions under Inventory's existing transaction rules.

**Alternatives and costs.** Reserving when adding an item can support a different shopping experience, but requires expiry, renewal, abuse controls and payment coordination. It is outside the Phase 04 roadmap. Current cart prices can change between reads, so the response must explain display amounts without promising a purchase price.

**Experiment.** Put the same product in two carts while only one unit is available. Inspect Inventory counters and movements before and after both edits. They must remain identical. Explain why later Checkout still needs a final-unit race experiment.

## 2. Lost updates and optimistic concurrency

**Concept.** A version detects whether the state a client edited has changed. A database transaction makes checking that version and applying the edit one operation.

**Under the hood.** Two clients read the same cart version. Each submits an intended edit with that version. The first state change advances the stored version. The second writer must compare against the current locked state and follow the documented conflict policy. Comparing only before opening the transaction leaves a race.

**Problem and rationale.** A stale clear or quantity replacement can erase a newer decision from another device. An absolute quantity such as “set to three” is easier to reason about during retries than an increment such as “add one.” A whole-cart version also protects edits involving different lines and the total line limit.

**Alternatives and costs.** Last write wins is simple but can lose customer intent. Per-line versions permit independent edits but need additional rules for clear, line creation and cart-wide limits. Holding a database lock while a person edits is unacceptable. A short lock during a write complements an optimistic client precondition.

**Experiment.** Open two clients on one cart. Change a quantity in one, then clear from the stale other client. Inspect quantities and version; explain how the selected policy protects the newer edit. Study [EF Core concurrency tokens](https://learn.microsoft.com/en-us/ef/core/saving/concurrency).

## 3. Uniqueness, first-write races and version reuse

**Concept.** Checking that a cart or line does not exist does not reserve the absent key. Database uniqueness arbitrates concurrent creation. Reusing a version after deleting/recreating an empty cart can make an old edit appear current.

**Under the hood.** Use a unique customer key for the cart and a unique cart/product pair for its lines. A creation conflict must load the committed winner in a fresh statement before evaluating its version. Clearing items must not silently reset the customer's version history.

**Problem and rationale.** Two first writes can both see no cart, and two independent additions can both see room for the final allowed line. One parent serialization point makes the item-count decision safe. A SQL CHECK on a quantity cannot enforce a count across multiple child rows.

**Alternatives and costs.** A document column makes the cart one row but shifts line validation and product references into application logic. Parent/child rows use ordinary relational constraints at the cost of multiple writes per edit. Database triggers are another way to enforce cross-row rules, with additional lock and migration complexity.

**Experiment.** Race first additions on different replicas, then race additions at the line cap. Confirm one cart, unique lines and a bounded final count. Clear and refill a cart while retaining an old client version. Study [PostgreSQL INSERT and conflict handling](https://www.postgresql.org/docs/18/sql-insert.html).

## 4. Snapshots and response versions

**Concept.** A cart version describes stored intent. A response also contains independently changing Catalog data. These are different version domains.

**Under the hood.** Read a cart's parent and lines consistently. Hydrate all its products through a bounded Catalog operation using an explicit database snapshot contract. Preserve lines whose products are no longer publicly sellable, while omitting hidden product fields. Calculate exact integer-cent amounts only from eligible current products.

**Problem and rationale.** Fetching the parent version, then the lines, then each product independently can assemble a response from several incompatible observations. A price edit or category deactivation can alter the displayed response without a cart edit. Therefore a cart-intent version alone cannot identify every byte of that response.

**Alternatives and costs.** One composed statement or a short read transaction with a shared snapshot can provide a consistent display. Separate statement snapshots cost less coordination but must expose their weaker guarantee. A snapshot becomes stale immediately after it is taken; it does not authorize a later purchase. A database or Catalog failure must remain a dependency failure, rather than turning every product into an unavailable line.

**Experiment.** Pause a read between intent loading and Catalog hydration. Change quantity, price and category status from another connection, then resume. Confirm the documented snapshot result. Repeat a read after a price edit and explain why the cart version can stay unchanged. Study [PostgreSQL isolation](https://www.postgresql.org/docs/18/transaction-iso.html) and [HTTP validator semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1).

## 5. Ownership and revocation ordering

**Concept.** A Customer role permits access to that customer's own cart. An Admin role does not imply support access to customers' carts. A valid JWT also needs the Phase 01 authoritative account/session checks.

**Under the hood.** Derive the owner from the verified subject, constrain every cart operation to that owner, and reject client-supplied ownership. For writes, take Identity user and session shared locks in that order before the cart lock and recheck eligibility. Revocation uses conflicting locks, establishing a durable ordering.

**Problem and rationale.** A role-only check leaves object access vulnerable. An authorization check outside a write transaction can become stale while the mutation waits. A process-local lock cannot order either race across API replicas.

**Alternatives and costs.** Checking ownership only in a controller can be bypassed by internal callers. Database row security can add protection but introduces connection-context and policy management. Explicit scoped module operations fit the current monolith. Shared Identity locks add contention with logout/reset and must remain short.

**Experiment.** Use two customers and one Admin. Attempt owner injection and cross-account access, then race a cart write with logout and account disable in both lock orders. Inspect committed state and sanitized responses. Study [PostgreSQL lock modes](https://www.postgresql.org/docs/18/explicit-locking.html).

## 6. Unknown commits, bounded work and evolution

**Concept.** Losing a response after commit leaves the client uncertain. A state-setting operation and a monotonic version bound duplicate effects, but do not prove which request caused the current state.

**Under the hood.** Commit before acknowledging a write. After a timeout, reload current intent and reconcile it with the intended edit. Do not automatically replace a rejected version with a newer one. Bound lines, quantities, response fields, database statements and connection waits so one cart cannot consume unbounded work.

**Problem and rationale.** An automatic retry that clears a newly edited cart may be technically successful while destroying user intent. Returning a full repriced cart after committing a write also adds a dependency that can fail after success; a small mutation acknowledgement avoids that extra failure boundary.

**Alternatives and costs.** A durable idempotency receipt per edit can identify historical results but adds retention, payload matching and another write. A cache as the only cart store introduces loss, eviction and persistence configuration. A separate Cart service introduces network failures during hydration and checkout snapshot exchange. Add these only when measurements or product requirements justify them.

**Experiment.** Interrupt before commit and after commit/before the response. Reload from another replica, then issue the original edit using its original version. Record outcomes and final intent without assuming a timeout means rollback. Compare database work for one-line and maximum-size carts before proposing caching or extraction.
