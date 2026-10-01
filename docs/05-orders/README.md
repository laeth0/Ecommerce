# Phase 05 — Orders

| Field | Value |
| --- | --- |
| Document | ORD-00 |
| Status | Draft specification for future implementation; documentation only |
| Architecture | Orders module in the existing ASP.NET Core/EF Core/PostgreSQL modular monolith |
| Depends on | [Identity](../01-identity-and-auth/README.md), [Catalog](../02-catalog-and-products/README.md), [Inventory](../03-inventory-and-stock/README.md), [Cart](../04-shopping-cart/README.md), and the [project brief](../../prompt.md) |
| Next phases | Checkout establishes purchase coordination; Payments supplies verified financial integration |

## Goal and confirmed policy

Orders preserves the accepted purchase and shipping destination, provides customer history, and enforces permitted business transitions under concurrent commands. Catalog changes cannot rewrite historical lines or amounts. Customer/Admin actions cannot invent payment success or bypass Inventory.

The project owner confirmed **PendingPayment → Confirmed → Processing → Shipped → Delivered**, with **Cancelled** and **Failed** outcomes. Confirmation requires verified payment and consumed stock. Payment and refund states remain separate. Customers and restricted Admins may request cancellation while PendingPayment or Confirmed, until Processing begins. A committed cancellation request blocks confirmation/fulfillment while Checkout resolves it. Active reservations are released through Inventory; consumed-stock restoration follows the existing authorized manual-adjustment policy.

One immutable shipping-address snapshot and manual whole-order fulfillment are included. Phase 06 decides shipping-charge rules, selling regions, taxes and final price acceptance. Orders specifies exact accepted USD-cent component storage and guards without assuming a tax or shipping value. No application, database migration or test suite is created by this documentation increment.

## Document map

| Read | Purpose |
| --- | --- |
| [System design prerequisites](system-design-prerequisites.md) | Aggregates, snapshots, transitions, external uncertainty and lock ordering |
| [Architecture decisions](architecture-decisions.md) | Order/financial separation, cancellation intent, persistence and integration |
| [Business workflows](functional-requirements/order-workflows.md) | Creation, reads, confirmation, failure, cancellation and fulfillment |
| [API and module contracts](functional-requirements/api-and-module-contracts.md) | Routes, schemas, pagination, errors and trusted internal operations |
| [Quality targets](non-functional-requirements/quality-targets.md) | Integrity, latency, bounded work and evidence requirements |
| [History and contention](performance-and-scalability/history-and-contention.md) | Indexes, deep history, shared pools and concurrency experiments |
| [Schema and transactions](database/schema-and-transactions.md) | Snapshots, guards, audit, grants and resource ordering |
| [Security](security/threat-model-and-controls.md) | Ownership, Admin access, trusted evidence and address privacy |
| [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) | Races, late outcomes, duplicates, commit loss and recovery |
| [Verification](testing-strategy/verification-scenarios.md) | Future manual scenarios and implementation exit gate |
| [Operations](deployment-and-devops/configuration-and-operations.md) | Settings, migrations, health, diagnostics and restore |

## Scope and stage boundary

| Included now | Excluded or deferred, with reason |
| --- | --- |
| Immutable 1–20-line purchase/address snapshot and exact USD totals | Public order creation: Checkout owns validation, accepted price and idempotent purchase submission in Phase 06 |
| Customer detail/history; narrow Admin detail/work queues | Search/export, customer support impersonation and business reporting add feature/privacy scope |
| Guarded business lifecycle and cancellation request/completion boundary | Provider calls, callbacks, refund execution and recovery scheduling belong to Checkout/Payments |
| Admin start-processing, ship and deliver commands with audit | Carrier integration, tracking URLs, partial shipments and warehouse allocation are excluded |
| Owner-controlled internal creation/confirmation/failure operations | Generic status PATCH, human mark-paid commands and direct stock mutations are excluded |
| Database transactions, history indexes and manual evidence plan | Cache, broker, service extraction and event sourcing need a demonstrated problem |

Phase 05 can be implemented and exercised using explicitly identified, isolated simulations of purchase evidence. Normal purchase entry arrives in Phase 06, and verified sandbox-provider integration in Phase 07. Orders never treats a public Boolean or an Admin command as financial proof. Cancelled/Failed are business outcomes; neither means captured money was refunded. The order API deliberately has no payment/refund status fields at this stage; later financial views must come from Payments and preserve this lifecycle.

## Scrum work packages and completion

| Epic | User/technical story | Acceptance evidence |
| --- | --- | --- |
| ORD-E1 Historical purchase | As a Customer, I can inspect my accepted lines, totals and destination; implement atomic immutable snapshots | Catalog/address changes do not alter history; failed creation leaves no partial order |
| ORD-E2 Scoped history | As a Customer, I can page through my own orders; Admin sees narrow fulfillment data | Owner isolation, signed cursor binding, bounded lists and deep-page plans |
| ORD-E3 Safe lifecycle | As an operator, I can apply only legal transitions supported by owner evidence | Forbidden/duplicate transitions, immutable totals, confirmation/expiry and audit rollback |
| ORD-E4 Cancellation and fulfillment | As a Customer, an accepted cancellation blocks processing; Admin records whole-order fulfillment | Cancellation/processing races, durable request recovery and exact cutoff behavior |
| ORD-E5 Operability | Operators can inspect failures without exposing addresses or inventing money outcomes | Budget, grants, privacy, restart/restore and declared workload evidence |

These are epics and stories with acceptance outcomes, not a detailed task backlog. Implementation completion requires the [verification scenarios](testing-strategy/verification-scenarios.md), [quality gates](non-functional-requirements/quality-targets.md), reviewed migration/grants and [global Definition of Done](../00-project-overview/global-definition-of-done.md). SQL, concurrency, load and recovery scenarios remain Not run in this documentation delivery. Phase 06/07 integration evidence remains a separate gate.
