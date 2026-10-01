# Phase 09 — Event-Driven Architecture

| Field | Value |
| --- | --- |
| Specification | EVT-009 |
| Status | Draft implementation specification; delivery and capacity targets are unmeasured |
| Dependencies | Implemented phases 01–08 and their required evidence |
| Architecture | Existing modular monolith and PostgreSQL primary, plus one RabbitMQ broker |
| Approved scope | PostgreSQL outbox/inbox; Order lifecycle and verified refund events; durable local notification sink |

MUST/MUST NOT/REQUIRED use [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). Acceptance criteria are implementation gates. Documentation completion does not establish that the application or infrastructure exists.

## Objective and boundaries

Make notification work survive a committed purchase, process crash, broker outage and repeated delivery. Teach the separate guarantees of a local commit, publisher confirmation, consumer acknowledgement and sink completion.

Retain ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18. Add supported stable RabbitMQ 4.x and its official .NET client 7.x, pinned and checked at implementation. The broker is justified by independently operated delivery and routing; [the decision record](architecture-decisions.md) compares PostgreSQL-only dispatch. There is one broker technology.

Keep one merchant/location, whole-unit stock, USD cents, US destinations, USD 5.00 shipping, simulated 0% tax, private sandbox accounts, restricted Admin access and Stripe sandbox payments. Existing JWT, version checks, financial keys/windows, refund correction rules and 15-minute reservation deadlines remain authoritative. No cache or read replica is added.

| Capability | Scope |
| --- | --- |
| Order integration events | Create and every effective business-status transition; cancellation request alone is excluded |
| Refund integration events | Newly admitted verified success and reversal facts, including Admin, compensation and imported refunds |
| Notifications | One typed local database receipt per event; protected operator inspection |
| Broker recovery | Confirmed publication, durable intake, bounded retries, quarantine, parking and original-identity replay |
| External delivery | Email, SMS, push, customer notification APIs and templates containing personal addresses are excluded |
| Purchase orchestration | Existing Checkout/Payments coordination stays synchronous through owner contracts and durable owner work |
| Distributed deployment | Service extraction, advanced reliability, scale and hosting infrastructure remain phases 10–13 |

## Document map

| Area | Document |
| --- | --- |
| Epics, requirements and acceptance | [Event and notification workflows](functional-requirements/event-and-notification-workflows.md) |
| Wire schemas and compatibility | [Event contracts](functional-requirements/event-contracts.md) |
| Owner and operator interfaces | [Module and operating contracts](functional-requirements/module-and-operating-contracts.md) |
| Topology, commits and locks | [System design](system-design.md) |
| Choices and alternatives | [Architecture decisions](architecture-decisions.md) |
| Concepts and experiments | [Prerequisites](system-design-prerequisites.md) |
| Measurable gates | [Quality targets](non-functional-requirements/quality-targets.md) |
| PostgreSQL design | [Schema and transactions](database/schema-and-transactions.md) |
| Resources, benchmarks and backlog | [Delivery and capacity](performance-and-scalability/delivery-and-capacity.md) |
| Trust boundaries | [Threat model](security/threat-model-and-controls.md) |
| Crashes and recovery | [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) |
| Required evidence | [Verification scenarios](testing-strategy/verification-scenarios.md) |
| Broker policy and deployment | [Configuration and operations](deployment-and-devops/configuration-and-operations.md) |
| Metrics, logs and traces | [Observability and alerts](deployment-and-devops/observability-and-alerts.md) |
| Complete recovery | [Backup and restore](deployment-and-devops/backup-and-restore.md) |

## Scrum progression

1. **EVT-E1 — Contracts and producer commits:** immutable envelopes, source ownership, event cutover and owner-local outboxes.
2. **EVT-E2 — Durable transport:** protected topology, claim leases, confirmations, return handling and bounded retries.
3. **EVT-E3 — Notification effects:** inbox deduplication, atomic intent, local receipts, delayed facts and reversals.
4. **EVT-E4 — Recovery and operations:** quarantine, parking, audited replay, complete backup and broker reconstruction.
5. **EVT-E5 — Evidence:** reference performance, crash boundaries, two replicas, security and restore drills.

These are logical work packages that may span several Sprints. Their stories and Given/When/Then assertions appear in the workflows; prerequisites precede implementation.

## Integration changes and Definition of Done

Orders and Payments append publication intent in their existing transactions. Add two owner outboxes and a Notifications-owned schema. Outbox failure rolls back the associated local transition; it cannot undo an already occurred external payment. Owner recovery must rediscover that external fact.

Consumers MUST NOT call financial, fulfillment or stock mutation contracts. Notifications do not replace primary reads or the Payments-to-Checkout wake protocol. Existing routes, bodies, status codes, idempotency receipts and authorization remain unchanged.

The [global Definition of Done](../00-project-overview/global-definition-of-done.md) and all Phase 08 gates apply. Exit requires atomicity/deduplication evidence, every crash boundary, delayed/reversed facts, broker loss, poison handling, scoped replay, measured resource/lag results and integrated restore. Report every scenario as Passed, Failed, Not run or Not applicable with a reason.

This phase creates specifications only. No application code, migration, executable infrastructure, automated test or credential is created. Phases 10–13 remain empty.
