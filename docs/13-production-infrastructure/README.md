# Phase 13 — Production Infrastructure

**Status:** specification complete; deployment and runtime evidence remain Not run.
**Objective:** make the selected architecture reproducible, secure to release and recoverable under the existing business contracts.

## Approved scope

- Local Kubernetes with kind on one physical machine, no cloud spend and no high-availability claim.
- GitHub Actions for builds and verification, with protected manual release approval.
- Gateway API with Envoy Gateway for HTTPS routing; Commerce and Payments continue direct private mTLS calls.

This phase documents the implementation work. It does not create application code, automated tests, Dockerfiles, manifests, workflows, clusters, credentials, registries or archives. No resource is provisioned and no artifact is published.

“Production infrastructure” names the engineering subject. A private sandbox on one machine cannot establish public identity readiness, real-payment readiness, physical failure isolation or an achieved hosted availability SLO.

## Entry and compatibility

Review the [Phase 12 handoff](../12-scalability/phase-13-handoff.md) and missing implementation evidence. An unrun earlier requirement stays Not run; infrastructure cannot supply lost financial authority or turn a failed workload into supported capacity.

Payments remains the only extracted domain. Commerce owns Identity, Catalog, Inventory, Cart, Orders, Checkout and local Notifications. One PostgreSQL server hosts two separately authorized logical databases. One Payments process owns the provider executor. RabbitMQ, OpenTelemetry, Prometheus, Tempo, Loki and Grafana retain their earlier contracts.

USD cents, US-only shipping at USD 5.00, simulated 0% tax, five-minute accepted preview, fifteen-minute reservation, current primary authorization/publication/price and the nonexpiring confirmation hold remain binding. Private sandbox accounts, operator-assisted recovery and restricted Admin access continue. Redis, read replicas and partitioning remain disabled unless their Phase 12 gates have separate actual activation evidence.

## Reading map

| Concern | Documents |
| --- | --- |
| Design and learning | [System design](system-design.md), [ADRs](architecture-decisions.md), [prerequisites](system-design-prerequisites.md) |
| Stories and operating contracts | [Workflows](functional-requirements/infrastructure-workflows.md), [release records](functional-requirements/release-and-operating-contracts.md) |
| Measurable gates | [Quality targets](non-functional-requirements/quality-targets.md) |
| Trust and privileges | [Identities and secrets](security/identities-secrets-and-access.md), [threat model](security/threat-model-and-controls.md) |
| Resources and elasticity | [Budgets](performance-and-scalability/resource-and-connection-budgets.md), [autoscaling](performance-and-scalability/autoscaling-and-capacity-gates.md) |
| Persistent ownership | [Storage](database/persistent-state-and-ownership.md), [migration](database/migrations-and-compatibility.md) |
| Failure behavior | [Failure matrix](reliability-and-failure-scenarios/failure-matrix.md) |
| Future evidence | [Experiments](testing-strategy/experiment-catalog.md), [verification](testing-strategy/verification-scenarios.md) |
| Build and local deployment | [Containers](deployment-and-devops/container-artifacts.md), [kind topology](deployment-and-devops/local-kubernetes-topology.md), [CI/CD](deployment-and-devops/ci-cd-and-promotion.md) |
| Runtime | [Edge](deployment-and-devops/gateway-tls-and-routing.md), [configuration/probes](deployment-and-devops/configuration-health-and-lifecycle.md), [rollout](deployment-and-devops/rollout-rollback-and-executor-handoff.md) |
| Operations | [Signals](deployment-and-devops/observability-and-alerts.md), [backup/restore](deployment-and-devops/backup-and-restore.md), [runbooks](deployment-and-devops/incident-and-recovery-runbooks.md) |
| Completion | [Project exit](project-completion-and-release-readiness.md) |

## Scrum work packages

Each epic may span Sprints. Forecast implementation only after reviewing actual host facilities, supported versions and prerequisite evidence.

| Epic | Story | Acceptance | Dependency |
| --- | --- | --- | --- |
| INF-E01: Reproducible artifacts | As an engineer, I can identify the exact binary and dependencies to release | Given one approved commit, build once and verify exact image/config/schema references without secrets | Phase 12 entry |
| INF-E02: Local platform | As an operator, I can recreate the declared kind environment without erasing accepted data | Given protected inventory, recover nodes/configuration and mount retained owner storage with proof | E01 |
| INF-E03: Secure edge | As a sandbox customer, I reach only the original HTTPS API | Given public/internal path and spoofed-header cases, preserve routes, bytes, errors and private denial | E02 |
| INF-E04: Identity/configuration | As an operator, I can rotate a secret without granting broader authority | Given role/CA/key change, prove permissions, retained overlap and connection revocation | E02 |
| INF-E05: Release/migration | As an owner, I can release and roll back without duplicate money or lost history | Given accepted work and incompatible schema, contain, hand off one executor and retain the current store | E01–04 |
| INF-E06: Controlled elasticity | As a learner, I can explain the cost and limits of scaling | Given one/two replicas and delayed metrics, preserve 48/79 connections and one provider executor | E02/E05 |
| INF-E07: Operation/recovery | As an operator, I can detect failure and restore safe service | Given host loss or asymmetric owner history, authenticate paired-v3 and reconcile before reopening | E03–06 |
| INF-E08: Project evidence | As a learner, I can defend the system's demonstrated envelope | Given the evidence index, distinguish Passed, Failed, Not run and Analytical across all phases | E01–07 |

## Definition of Done

INF-FR-01–12 and INF-NFR-01–32 map to INF-V01–48. All executed scenarios have protected evidence and actual timings; unrun scenarios are explicit.

Release gates require artifact integrity, exact current authority, supported configuration, complete resource/connection inventory, original contracts, negative access checks, one executor and safe rollback/restore. The application must satisfy inherited latency, useful throughput, work/scan and recovery targets at the declared achieved tier.

A running Pod, a successful workflow, a ready Gateway or a restored volume is insufficient. Documentation completion is separate from operational completion; the [exit record](project-completion-and-release-readiness.md) defines that boundary.
