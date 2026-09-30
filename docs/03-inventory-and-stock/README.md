# Phase 03 — Inventory and Stock

| Field | Value |
| --- | --- |
| Document | STK-00 |
| Status | Draft specification for review; no application code is included |
| Architecture | Inventory module in the existing modular monolith |
| Depends on | [Identity](../01-identity-and-auth/README.md), [Catalog](../02-catalog-and-products/README.md), and the [project roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md) |
| Next phase | Shopping cart; Checkout later consumes the reservation contract |

## Goal

An administrator can establish and correct stock with an audited reason. Internal purchase workflows can reserve a bounded set of products, consume it once, or release/expire it once. The Inventory module enforces stock conservation in PostgreSQL even when requests, workers, or replicas race. Inventory owns quantities and reservations; Catalog remains the source for product identity and publication, and Payments remains the source for money outcomes.

The project owner confirmed one whole-unit stock record per product at the single location, no backorders, and a **15-minute reservation lifetime**. Inventory uses the database clock for that deadline; Phase 06 will decide the checkout response to an uncertain or late payment.

## Contents

| Read | Purpose |
| --- | --- |
| [System design prerequisites](system-design-prerequisites.md) | Conservation, locks, expiry, idempotency and failure experiments |
| [Architecture decisions](architecture-decisions.md) | Stock mapping, reservation model and alternatives |
| [Business workflows](functional-requirements/inventory-workflows.md) | Adjustment, reserve, consume, release, expiry and reconciliation behavior |
| [API and internal contracts](functional-requirements/api-and-module-contracts.md) | Admin wire contract and Inventory operation outcomes |
| [Quality targets](non-functional-requirements/quality-targets.md) | Measurable latency, integrity and recovery gates |
| [Capacity and contention](performance-and-scalability/capacity-and-contention.md) | Hot-row workload, query plans and worker budgets |
| [Schema and transactions](database/schema-and-transactions.md) | Tables, guarded writes, locks, ledger, expiry selection |
| [Security](security/threat-model-and-controls.md) | Stock mutation authority, internal caller boundary and audit privacy |
| [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) | Duplicate commands, crashes, contention and reconciliation |
| [Verification](testing-strategy/verification-scenarios.md) | Future scenarios and evidence |
| [Operations](deployment-and-devops/configuration-and-operations.md) | Settings, worker lifecycle, migration and alerts |

## Scope and dependencies

| Included now | Deferred or excluded |
| --- | --- |
| One stock identity per simple Catalog product at the confirmed single location | Multiple warehouses, transfers, allocations by location |
| Whole-unit on-hand/reserved/available quantities | Fractional units, backorders, preorders, negative availability |
| Reasoned Admin adjustments and append-only movement history | Returns, automatic refund restock, procurement and shipment tracking |
| Durable all-or-none reservation for a bounded set of products | Customer-facing reservation endpoint or cart stock guarantee |
| Consume/release/expiry and bounded recovery worker | Payment settlement, order state, customer cancellation policy |
| Database-backed stock checks and contention measurement | Redis counters, distributed locks, broker scheduling, dedicated Inventory service |

Phase 01 supplies Admin authentication and the transaction-time revocation lock protocol. Phase 02 supplies immutable product IDs and current sellability. Phase 04 carts hold intent only. Phases 05–07 attach orders and payment evidence to Inventory outcomes; a captured payment cannot be inferred from a reservation. Inventory changes no prices or refunds.

## Scrum work package

| Epic | Outcome | Review evidence |
| --- | --- | --- |
| STK-E1 Stock accounting | Reasoned adjustments preserve `on_hand >= reserved >= 0` and movement history | Final balances reconcile to committed deltas |
| STK-E2 Reservation | A bounded set of products is allocated atomically or rejected whole | One-unit contention has one winner; mixed-product failure leaves none allocated |
| STK-E3 Terminal transitions | Consume, release and expiry have one durable outcome | Payment-completion/expiry race cannot double-decrement or double-release |
| STK-E4 Operating recovery | Due reservations survive worker restarts and failures are visible | Restart, lock waits, backlog and restore evidence |

These are work packages, not Sprint tasks. The [global Definition of Done](../00-project-overview/global-definition-of-done.md) requires executed implementation evidence later. Documentation completion alone does not establish a working inventory.
