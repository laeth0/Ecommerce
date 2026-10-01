# Phase 07 — Payments and Refunds

| Field | Value |
| --- | --- |
| Document | PAY-00 |
| Status | Draft specification for future implementation; documentation only |
| Architecture | Payments module in the ASP.NET Core 10 / EF Core / PostgreSQL 18 modular monolith |
| Dependencies | [Project brief](../../prompt.md), [Identity](../01-identity-and-auth/README.md), [Orders](../05-orders/README.md), [Checkout](../06-checkout/README.md), and Inventory's existing reservation protocol |
| Next phase | Production-ready monolith; later messaging and service extraction require separate specifications |

## Objective and confirmed scope

Payments owns durable financial intent, provider correlation, capture evidence, refund accounting and reconciliation. Checkout continues to own purchase coordination. A provider response loss, repeated callback, process crash or concurrent refund MUST NOT produce a second financial effect for the same operation or authorize fulfillment without eligible consumed stock.

The project owner confirmed **Stripe sandbox/test mode**, **backend-only payment methods assigned through protected operator tooling**, and **restricted Admin full or partial refunds for any captured order, including Shipped/Delivered**. A refund requires a reason and idempotency key. Refunds leave Order lifecycle and Inventory unchanged; cancellation compensation remains automatic.

The owner also confirmed that a refund accepted before historical purchase confirmation stops that unconfirmed purchase: Checkout releases eligible stock, records full remaining compensation and fails the purchase. Refunds after confirmation preserve the existing Order lifecycle.

Keep the existing single merchant, stock location and USD/two-decimal baseline. Shipping remains USD 5.00, destinations US, tax explicitly simulated 0%, quote lifetime five minutes and reservation lifetime fifteen minutes. No raw card entry, frontend, payment-method management, customer refund-request workflow, returns, subscriptions, installments, multicurrency, marketplace transfers, disputes workflow or live payments is included. Unexpected provider disputes or external financial edits require quarantine and reconciliation.

Payments adds a real provider API boundary using synthetic provider funds. It does not establish live settlement, PCI certification or production readiness. Original Phase 06 simulated purchases remain synthetic and keep their original source.

## Document map

| Area | Specification |
| --- | --- |
| Functional requirements, epics and acceptance | [Payment and refund workflows](functional-requirements/payment-and-refund-workflows.md) |
| Public contracts and JSON Schema | [API contracts](functional-requirements/api-contracts.md) |
| Stripe calls, keys, states and verified evidence | [Provider contract](functional-requirements/stripe-provider-contract.md) |
| System design, ownership and transactions | [System design](system-design.md) |
| Decisions and alternatives | [Architecture decisions](architecture-decisions.md) |
| Concepts, study and failure experiments | [System design prerequisites](system-design-prerequisites.md) |
| Measurable non-functional requirements | [Quality targets](non-functional-requirements/quality-targets.md) |
| Performance, contention and scaling | [Capacity and provider budgets](performance-and-scalability/capacity-and-provider-budgets.md) |
| PostgreSQL data model and invariants | [Schema and transactions](database/schema-and-transactions.md) |
| Security and financial trust boundaries | [Threat model and controls](security/threat-model-and-controls.md) |
| Crashes, uncertainty and compensation | [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) |
| Manual verification and future test design | [Verification scenarios](testing-strategy/verification-scenarios.md) |
| Deployment, secrets, reconciliation and recovery | [Configuration and operations](deployment-and-devops/configuration-and-operations.md) |

## Integration changes owned by this phase

This phase activates Checkout's reserved `Sandbox` source after its admission gates pass. At acceptance, Payments freezes a source binding in the same transaction as the accepted attempt/Order/reservation/work. It implements the [existing financial operations](../06-checkout/functional-requirements/payment-boundary-and-simulator.md#owner-operations) and adds dedicated financial-read/refund routes. Existing Order/Checkout response bodies remain valid; financial details are obtained through the new routes.

Stripe's amount range requires a Sandbox admission restriction described in the provider contract. The generic USD representation and prior simulator receipts retain their existing bounds. No accepted purchase is silently repriced, split into charges or converted between sources.

## Scrum work packages

Execute PAY-E1 through PAY-E5 in order. These are logical work packages; estimate and split them into useful Sprint increments during planning. A package may span several Sprints, as the [shared roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md#1-how-to-use-the-roadmap) specifies.

1. **PAY-E1 — Financial ownership:** accepted source binding, immutable facts, balances, state guards, grants and narrow owner operations.
2. **PAY-E2 — Provider boundary:** sandbox adapter, durable dispatch admission, stable provider keys, finite retry window and safe no-capture classification.
3. **PAY-E3 — Observation and recovery:** authenticated webhook inbox, bounded retrieval/reconciliation, restart recovery, stale observation handling and Checkout wake.
4. **PAY-E4 — Refunds:** Admin acceptance/replay, concurrent amount reservations, full-compensation coexistence and refund reversal/failure handling.
5. **PAY-E5 — Operational evidence:** source rollout, secret rotation, latency/capacity/privacy evidence and isolated integrated restore.

Detailed stories and Given/When/Then criteria are in the workflows. Implementation MUST study the prerequisites first. This documentation increment creates no application, migration, test, gateway account, credentials or executable infrastructure.

## Phase implementation Definition of Done

- Every story's acceptance criteria and all [verification gates](testing-strategy/verification-scenarios.md) have recorded evidence, including real PostgreSQL races and actual sandbox provider calls.
- Exactly one source/payment mapping exists per accepted purchase; captured evidence is durable independently of Checkout; no false paid/refunded/no-capture claim is made.
- Concurrent refunds and compensation preserve the financial equations; Unknown keeps its reservation; a verified reversal preserves history and reopens outstanding debt.
- Authorization, raw-body signature validation, account/mode correlation, secret redaction, grants and immutable facts pass inspection and runtime scenarios.
- Provider I/O holds no database connection/transaction; pool, lease, rate and work budgets hold under the declared workloads.
- Earlier simulator sources cannot dispatch at Stripe; callback loss, key-retention expiry and restored missing records lead to recovery or explicit ManualReview.
- Performance results identify simulator/stub versus actual provider measurements. Unavailable evidence remains an explicit unmet gate.
- The [global Definition of Done](../00-project-overview/global-definition-of-done.md) applies. Later phase folders stay empty until requested.
