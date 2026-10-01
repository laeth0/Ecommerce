# Phase 06 — Checkout

| Field | Value |
| --- | --- |
| Document | CHK-00 |
| Status | Draft specification for future implementation; documentation only |
| Architecture | Checkout coordinator in the existing ASP.NET Core/EF Core/PostgreSQL modular monolith |
| Dependencies | [Identity](../01-identity-and-auth/README.md), [Catalog](../02-catalog-and-products/README.md), [Inventory](../03-inventory-and-stock/README.md), [Cart](../04-shopping-cart/README.md), [Orders](../05-orders/README.md) and [project brief](../../prompt.md) |
| Next phase | Payments supplies the verified sandbox-provider adapter, callbacks, refunds and reconciliation |

## Goal and confirmed policy

Checkout turns an explicitly accepted purchase into a durable, recoverable attempt. It owns submission identity and coordination; Orders owns historical purchase/business state, Inventory owns stock, and the payment boundary owns financial facts. Response loss, process restart and concurrent submissions must not create another order or financial operation for the same intent.

The project owner confirmed:

- A stored preview quote lasts **five minutes**. Submission explicitly accepts that quote and rechecks Cart, prices, shipping/tax policy and stock. Changed prices or totals require a new preview.
- Destinations are restricted to **US**, using the ISO 3166-1 alpha-2 code. Shipping is **USD 5.00 per order**; tax is an explicitly **simulated 0%**. This is a sandbox learning policy, with no real tax or deliverability claim.
- Reservations retain the existing **15-minute deadline**, including unknown payment outcomes. Expired stock cannot authorize fulfillment; later capture requires compensation.
- After confirmation, cleanup clears the purchased cart only when its submitted version is unchanged. Newer edits are preserved. Attempts that fail or cancel before confirmation leave the cart intact.

The development simulator is the only financial source implemented in Phase 06. It is restricted to explicitly isolated Development operation and labeled in responses/evidence. Phase 07 establishes actual provider behavior. This increment creates documentation only: no application, migrations, tests, simulator executable or deployment files.

## Document map

| Read | Purpose |
| --- | --- |
| [System design prerequisites](system-design-prerequisites.md) | Intent identity, acceptance, uncertainty, leases and compensation |
| [Architecture decisions](architecture-decisions.md) | Ownership, preview policy, atomic acceptance and durable recovery |
| [Checkout workflows](functional-requirements/checkout-workflows.md) | Invariants, purchase resolution, cancellation and cart cleanup |
| [API and module contracts](functional-requirements/api-and-module-contracts.md) | Customer routes, schemas, errors, replay and owner extensions |
| [Payment boundary and simulator](functional-requirements/payment-boundary-and-simulator.md) | Durable financial operations, proof requirements and deterministic fault cases |
| [Quality targets](non-functional-requirements/quality-targets.md) | Latency, convergence, bounded work and consistency gates |
| [Capacity and contention](performance-and-scalability/capacity-and-contention.md) | Indexes, shared pools, final-unit contention and worker capacity |
| [Schema and transactions](database/schema-and-transactions.md) | Persistence, fingerprints, locks, leases and retention |
| [Security](security/threat-model-and-controls.md) | Owner isolation, accepted authority, simulator access and address privacy |
| [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) | Lost acknowledgements, expiry, duplicates, stale workers and recovery |
| [Verification](testing-strategy/verification-scenarios.md) | Future manual scenarios and implementation exit evidence |
| [Operations](deployment-and-devops/configuration-and-operations.md) | Options, workers, rollout, health, diagnostics and restore |

## Scope and stage boundary

| Included | Deferred or excluded, with reason |
| --- | --- |
| Preview, explicit acceptance and exact USD component calculation | Coupons, promotions, payment-method selection and address books add business scope |
| Atomic attempt/reservation/order acceptance and durable idempotency | Independent services, brokers and distributed transactions have no current boundary requiring them |
| Database-backed recovery, cancellation resolution and conditional cart cleanup | General workflow engines and event sourcing add unnecessary machinery |
| Tagged durable financial simulator, full compensation for unfulfillable purchases | Actual provider credentials/callbacks, customer financial APIs and partial refunds belong to Phase 07 |
| Restart discovery, bounded retries, leases and manual-review escalation | Redis, caches and distributed locks need measured justification |
| US destination grammar and sandbox flat shipping/tax policy | Carrier integration, address verification and real tax calculation remain excluded |

Accepted idempotency keys remain bound for the retained lifetime of the attempt/order. A quote can produce at most one accepted attempt. Different quotes and keys are distinct purchase intents; clients must recover an uncertain original submission before deliberately starting another purchase. Checkout has no duplicate-purchase guarantee across independently accepted intents.

## Scrum work packages and completion

| Epic | User/technical story | Acceptance evidence |
| --- | --- | --- |
| CHK-E1 Explicit acceptance | As a Customer, I preview the current purchase and explicitly accept its totals/destination | Quote expiry, cart/price changes and fixed sandbox calculations |
| CHK-E2 Durable submission | As a Customer, I recover the same purchase after response loss | Same-key replay, changed-key payload conflict and one quote/attempt/order |
| CHK-E3 Purchase coordination | As an operator, I can account for payment and stock outcomes without false fulfillment | Exact financial proof, final-unit/expiry races and atomic owner changes |
| CHK-E4 Recovery and cancellation | Accepted work survives crashes and cancellation blocks fulfillment | Lease expiry, bounded retry, late capture, compensation and manual review |
| CHK-E5 Safe cart cleanup | A successful purchase clears only its unchanged cart | New edits, repeated cleanup and cancellation-before-confirmation preserve intent |
| CHK-E6 Operability | Operators can inspect progress without exposing address/financial payloads | Query/resource budgets, privacy, rollout and isolated restore |

These are epics and acceptance outcomes, not a detailed task backlog. Implementation exits through the [verification gate](testing-strategy/verification-scenarios.md), [quality targets](non-functional-requirements/quality-targets.md) and [global Definition of Done](../00-project-overview/global-definition-of-done.md). PostgreSQL, concurrency, API, load and restore scenarios are **Not run** in this documentation delivery. Phase 07 financial integration remains a separate gate.
