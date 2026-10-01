# Phase 08 — Production-Ready Monolith

| Field | Value |
| --- | --- |
| Specification | MON-008 |
| Status | Draft implementation specification; operating targets have not been measured |
| Dependencies | Completed implementation and evidence from phases 01–07 |
| Architecture | One modular monolith, one authoritative PostgreSQL primary |
| Confirmed scope | Private sandbox accounts; PostgreSQL-only reads; caching requires later measurement and approval |

## Objective and scope

Establish a measured, observable and recoverable operating baseline for the complete sandbox purchase path. This phase strengthens existing controls and supplies evidence for their resource limits. The roadmap label does not establish public-service, live-money or production readiness.

Retain ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18; select supported stable patches at implementation. Retain one merchant/location, whole-unit stock, USD with two decimal places, US destinations, shipping USD 5.00 and explicitly simulated 0% tax. Customer/Admin roles remain mutually exclusive. Private accounts use operator-assisted recovery and network-restricted Admin access. No email verification, self-service recovery or MFA is added.

PostgreSQL remains authoritative for identity, publication, prices, stock, cart versions, Orders and money. No Redis, HTTP response cache, replica, search service or partitioning is introduced. The [measurement gate](performance-and-scalability/baseline-and-capacity.md#cache-admission-gate) makes a future cache proposal reviewable.

| Capability | Selection and reason |
| --- | --- |
| Query plans, indexes, pool budgets and overload admission | Included; expose the complete monolith's shared resource limit |
| Existing Identity, Inventory, Checkout and Payments workers | Hardened and measured; durable work already exists in earlier phases |
| Commerce abuse quotas and safe diagnostics | Included; protect database capacity across API replicas |
| OpenTelemetry, Prometheus and Grafana | Included; quantify latency, failure and work age |
| Trace/log storage and bounded export | Included; investigate request and worker execution without retaining sensitive payloads |
| Backup, isolated restore, financial reconciliation and release drills | Included; database recovery alone cannot recover the purchase workflow |
| New commerce features or identity recovery features | Excluded; they do not address this phase's operating problem |
| Broker, outbox and notification consumers | Deferred to 09; there are no message-delivery claims in this phase |
| Microservice extraction, large-scale topology and hosting orchestration | Deferred to 10–13; preserve the established sequence |

## Document map

| Area | Specification |
| --- | --- |
| Epics, stories and acceptance | [Operational workflows](functional-requirements/operational-workflows.md) |
| Public compatibility and internal contracts | [API and operating contracts](functional-requirements/api-and-operating-contracts.md) |
| Ownership, topology and execution | [System design](system-design.md) |
| Decisions and alternatives | [Architecture decisions](architecture-decisions.md) |
| Concepts and experiments | [System design prerequisites](system-design-prerequisites.md) |
| Measurable requirements | [Quality targets](non-functional-requirements/quality-targets.md) |
| Benchmark, overload, capacity and caching gate | [Baseline and capacity](performance-and-scalability/baseline-and-capacity.md) |
| PostgreSQL, optional diagnostic columns and migrations | [Database design](database/query-plans-migrations-and-integrity.md) |
| Trust boundaries and controls | [Security](security/threat-model-and-controls.md) |
| Dependency failure and recovery | [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) |
| Evidence scenarios | [Verification scenarios](testing-strategy/verification-scenarios.md) |
| Options, deployment and shutdown | [Configuration and operations](deployment-and-devops/configuration-and-operations.md) |
| Signals, dashboards and alert response | [Observability](deployment-and-devops/observability-and-alerts.md) |
| Recovery objectives and runbook | [Backup and restore](deployment-and-devops/backup-and-restore.md) |

## Scrum work packages

Execute MON-E1 through MON-E5 in order. These are logical packages, each potentially spanning multiple Sprints. Estimate and select usable increments during planning; this is not a list of hundreds of tasks.

1. **MON-E1 — Baseline and resources:** reproducible dataset, query inventory, reference workload and complete connection/admission budgets.
2. **MON-E2 — Operational visibility:** privacy-safe metrics/logs/traces, durable diagnostic correlation, dashboards and alert investigation.
3. **MON-E3 — Failure and abuse protection:** shared commerce quotas, overload behavior, worker fairness, shutdown and source isolation.
4. **MON-E4 — Database and release safety:** evidence-driven tuning, maintenance, compatible migrations, controlled rollout and rollback.
5. **MON-E5 — Recovery and evidence:** protected backups, isolated restore including provider gaps, fault drills and final capacity report.

Study the prerequisites before implementation. The [workflows](functional-requirements/operational-workflows.md) define acceptance; the [verification plan](testing-strategy/verification-scenarios.md) specifies evidence.

## Integration changes owned by Phase 08

- Extend Catalog, Inventory, Cart, Orders and Checkout error contracts to accept the existing `429 RateLimit.Exceeded` host response. Success bodies, public routes, amount ranges and original receipts remain unchanged. Strict consumers must adopt the [Phase 08 error schemas](functional-requirements/api-and-operating-contracts.md#commerce-problem-schemas) before quotas are enabled.
- Extend the existing Identity-owned counter mechanism with distinct commerce scopes. Existing Identity and Payments limits retain their values and ownership.
- Add nullable, private diagnostic context to selected existing owner records for worker trace links. It has no authority over leases, payments, stock or order transitions.
- Select and bound telemetry storage, backup operations and manual deployment controls. These are operating requirements, not new public administrator APIs.

## Implementation Definition of Done

The [global Definition of Done](../00-project-overview/global-definition-of-done.md) applies. Completion requires three reported reference runs, truthful API and workflow SLIs, bounded outage/overload/shutdown evidence, authorization and telemetry privacy evidence, PostgreSQL plan/grant/migration evidence and a timed isolated restore including provider reconciliation. Every required scenario has Passed/Failed/Not run/Not applicable with reason; unavailable evidence leaves its gate open.

This increment creates documentation only. No application, migration, dashboard, executable infrastructure, automated test, fixture, account or credential is created. Phases 09–13 stay empty until requested.
