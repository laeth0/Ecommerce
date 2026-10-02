# Phase 12 — Scalability

**Status:** specification complete; capacity, experiments and infrastructure activation remain unmeasured.
**Scope:** the existing Commerce/Payments topology, authoritative PostgreSQL owners, RabbitMQ and private sandbox.

## Objective and approved choices

Determine useful capacity, identify the limiting resource and improve it without weakening correctness or moving uncertainty into a cache. Separate active users, simultaneous requests, arrival rate, useful throughput and retained data.

The user approved:

- PostgreSQL-first execution, with Redis, read replicas and partitioning specified as **gated experiments**.
- Controlled progression toward **1,000 virtual users**; 10,000 and 100,000 users are analytical scenarios until measurements/resources support execution.

No optional mechanism is activated because this document exists. No application, tests, fixtures, executable configuration, infrastructure purchase or extra service is supplied. Phase 13 remains outside scope.

## Entry and compatibility

Review the [Phase 11 handoff](../11-distributed-system-reliability/phase-12-handoff.md) and its failed/Not run evidence. Missing financial, authority, hold, restore or migration proof blocks the dependent experiment; faster queries cannot supply it.

Retain Payments-only extraction, separate logical databases on one PostgreSQL server, private mTLS, RabbitMQ original routes, one provider executor and sandbox payment methods. Commerce owns stock/Orders/terminal decisions; Payments owns money/provider evidence/holds.

USD cents, US-only checkout, USD 5 shipping, simulated 0% tax, five-minute quote, fifteen-minute stock reservation, cart/version rules, immutable Order snapshots and the nonexpiring confirmation hold remain unchanged. Public/private v1 schemas, authorization, cursors, quotas, receipts and frozen event bytes remain binding.

## Reading map

| Concern | Document |
| --- | --- |
| Architecture and learning | [Design](system-design.md), [ADRs](architecture-decisions.md), [prerequisites](system-design-prerequisites.md) |
| Actors/acceptance and operating records | [Workflows](functional-requirements/scalability-workflows.md), [contracts](functional-requirements/api-and-operating-contracts.md) |
| Measurable criteria | [Quality targets](non-functional-requirements/quality-targets.md) |
| Users, rates, quotas and data | [Workload tiers](performance-and-scalability/workload-model-and-capacity-tiers.md) |
| Replicas, resources and pools | [Horizontal scaling](performance-and-scalability/horizontal-scaling-and-connection-budgets.md) |
| Conditional read cache | [Cache gates/design](performance-and-scalability/cache-design-and-admission-gates.md) |
| Flash sales and serialized stock | [Hot rows](performance-and-scalability/flash-sales-and-hot-rows.md) |
| Broker/worker pressure | [Queue scaling](performance-and-scalability/queue-throughput-and-consumer-scaling.md) |
| PostgreSQL plans and maintenance | [Query work](database/query-plans-and-maintenance.md) |
| Conditional standby reads | [Replication](database/read-replicas-and-consistency.md) |
| Conditional table layout | [Partitioning](database/partitioning-and-retained-data.md), [migration](database/migration-and-rollback.md) |
| Failures and threats | [Failure matrix](reliability-and-failure-scenarios/failure-matrix.md), [security](security/threat-model-and-controls.md) |
| Future experiments/evidence | [Catalog](testing-strategy/experiment-catalog.md), [verification](testing-strategy/verification-scenarios.md) |
| Configuration, signals and restore | [Operations](deployment-and-devops/configuration-and-operations.md), [observability](deployment-and-devops/observability-and-alerts.md), [recovery](deployment-and-devops/backup-and-restore.md) |
| Exit | [Phase 13 handoff](phase-13-handoff.md) |

## Scrum work packages

Each package may span multiple Sprints. Plan implementation tasks after prerequisite review and declared measurement inputs; do not create hundreds of speculative tasks.

| Epic | User / technical story | Concrete acceptance | Dependency |
| --- | --- | --- | --- |
| SCL-E01: Capacity model | As a learner, I can explain the rate, quota and resource ceiling before a run | Given the fixed mix, derive global 300RPS/source 150RPS and refresh bounds; record a closed plan | Phase 11 exit |
| SCL-E02: Baseline/query evidence | As an engineer, I can locate expensive reads/writes on retained data | Given identical data/resources, retain three runs, plans, lock/pool/WAL/maintenance evidence | E01 |
| SCL-E03: Controlled user growth | As an operator, I can progress toward 1,000 users with explicit failure boundaries | Given each declared tier, meet its useful-rate/latency criteria or record unreached capacity; no quota bypass | E01–02 |
| SCL-E04: Hot stock/counters | As a customer, I cannot buy stock that another purchase already owns | Given last-unit/skew/counter bursts, preserve conservation, exact replay and finite failure | E02 |
| SCL-E05: Queue growth | As an operator, I can distinguish input rate from useful sink/recovery capacity | Given duplicates/backlog, retain identities, finite retries, fair turns and measured net drain | E02, Phase 09/11 |
| SCL-E06: Optional acceleration | As an engineer, I can defend acceptance or rejection of cache/replica/partition proposals | Given measured bottleneck, pass each gate and prove authority/rollback or retain Disabled/Rejected | E02–05 |
| SCL-E07: Operation/recovery | As an operator, I can stop an unsafe scaling change and recover original work | Given rollout/outage/restore, preserve budgets/epochs/provider keys/holds and safe reopening | E03–06 |
| SCL-E08: Learning exit | As a learner, I can explain supported capacity and its cost/limits | Given full evidence index, separate demonstrated/failed/Not run/analytical claims | E01–07 |

## Definition of Done

- SCL-FR-01–10 and SCL-NFR-01–30 map to SCL-V01–40 with actual evidence or explicit Failed/Not run.
- Original financial/stock/authority/event invariants have zero tolerated violations.
- Every executed tier declares mix, source/session pacing, data, resources, quotas, auxiliary work and complete denominators.
- Larger user counts are not represented as larger supported request rates; analytical scenarios are labeled.
- Pools/threads/queues/telemetry stay bounded; one/two Commerce replicas retain 48/79 planned connections.
- Optional cache/replica/partition changes stay disabled until their gate, approval and compatible implementation evidence exist.
- Original retained history, paired-v3 recovery and provider scan remain feasible at the claimed supported data volume.
- The report identifies the limiting resource and cost, not just a successful fast endpoint.
