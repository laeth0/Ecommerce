# Phase 04 — Shopping Cart

| Field | Value |
| --- | --- |
| Document | CRT-00 |
| Status | Draft specification for future implementation; documentation only |
| Architecture | Cart module in the existing ASP.NET Core/EF Core/PostgreSQL modular monolith |
| Depends on | [Identity](../01-identity-and-auth/README.md), [Catalog](../02-catalog-and-products/README.md), [Inventory](../03-inventory-and-stock/README.md), and the [roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md) |
| Next phases | Orders, then Checkout and Payments |

## Goal and confirmed baseline

A customer can retain product choices across sessions and devices, see current public prices, and deliberately resolve conflicting edits. Cart owns product IDs and desired quantities. Catalog owns current product visibility and prices; Inventory owns allocations; a future Order owns the accepted purchase record.

The project owner confirmed one persistent cart per customer, at most **20 distinct products**, **1–100 whole units per line**, no automatic cart expiry, current USD prices on each read, and unavailable products retained as removable blocked lines. Every mutation requires a whole-cart `expectedVersion` in JSON; a stale edit returns `409 Cart.VersionMismatch`. The existing one-merchant, one-location, sandbox and USD/two-decimal policy applies.

## Document map

| Read | Purpose |
| --- | --- |
| [System design prerequisites](system-design-prerequisites.md) | Lost updates, creation races, snapshots, ownership and unknown commits |
| [Architecture decisions](architecture-decisions.md) | Persistence, concurrency, projection, mutation receipts and future boundaries |
| [Business workflows](functional-requirements/cart-workflows.md) | Reads, absolute quantity edits, removal, clear and Checkout input |
| [API and module contracts](functional-requirements/api-and-module-contracts.md) | Routes, schemas, response semantics, error precedence and internal snapshot |
| [Quality targets](non-functional-requirements/quality-targets.md) | Measurable integrity, latency, boundedness and recovery gates |
| [Capacity and concurrency](performance-and-scalability/capacity-and-concurrency.md) | Bounded queries, parent contention, pools and scaling experiments |
| [Schema and transactions](database/schema-and-transactions.md) | Constraints, first-write arbitration, lock order and read snapshots |
| [Security](security/threat-model-and-controls.md) | Owner isolation, hidden fields, input limits and diagnostics |
| [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) | Stale data, duplicates, crashes, rollback and dependency loss |
| [Verification](testing-strategy/verification-scenarios.md) | Future manual scenarios, evidence and implementation exit gate |
| [Operations](deployment-and-devops/configuration-and-operations.md) | Settings, migrations, rollout, health, metrics and restore |

## Scope

| Included | Excluded or deferred, with reason |
| --- | --- |
| Authenticated customer cart shared across that customer's sessions | Guest carts and guest merging add identity/linking policy outside the lean scope |
| Read, set quantity, remove line, clear all lines | Wishlists, saved lists and multiple named carts add repetitive feature work |
| Durable lines, unique owner/product keys and optimistic conflict rejection | Automatic merging needs a separate policy for quantity and destructive edits |
| Current visible Catalog fields, exact USD-cent subtotals and blocked lines | Tax, shipping, discounts and final payable totals belong to future purchase policy; coupons remain excluded |
| Bounded transactional input for future Checkout | Stock checks, reservation, checkout routes, payment and automatic post-purchase cart clearing are later responsibilities |
| Database persistence, failure diagnostics and manual verification plan | Redis, a broker, abandoned-cart workers and a separate Cart service have no demonstrated need |

Cart reads do not publish exact stock counts. A zero-stock product can remain in the cart with a displayed price. Displayed sellability means Published product plus Active category; only Inventory's guarded reservation determines whether a quantity can be allocated. A display subtotal never establishes customer acceptance of changed prices.

## Scrum work packages

| Epic | User/technical story | Acceptance evidence |
| --- | --- | --- |
| CRT-E1 Durable intent | As a Customer, I can read and maintain my cart across sessions; implement owner and product uniqueness | CRUD boundaries, restart persistence and another customer's isolation |
| CRT-E2 Concurrent edits | As a Customer, I receive a conflict when my edit is stale; serialize version, count and line changes | Two-device edits, first-write race, final-slot race and clear/refill evidence |
| CRT-E3 Current presentation | As a Customer, I see current prices and removable unavailable lines; implement bounded Catalog hydration | Reprice/deactivate snapshots, exact subtotal and unavailable-field checks |
| CRT-E4 Purchase handoff and operation | As Checkout, I can obtain one owned, versioned intent in a local transaction; operators can diagnose failures | Lock-order review, unknown-commit recovery, query plans and restore evidence |

Study the prerequisites before implementing any epic. These are work packages with acceptance criteria, not a detailed Sprint backlog. The implementation Definition of Done requires the scenarios and quality gates in the linked documents, reviewed migrations/grants, and the [global Definition of Done](../00-project-overview/global-definition-of-done.md). At this documentation stage, application, SQL, load, concurrency and restore scenarios remain unexecuted.
