# Phase 10 — Payments Service Extraction

| Field | Value |
| --- | --- |
| Specification | MS-010 |
| Status | Draft implementation specification; extraction, migration and recovery evidence are pending |
| Dependencies | Implemented phases 01–09 and their required evidence |
| Selected extraction | Payments; all other business modules and Notifications remain in Commerce |
| Approved topology | Two logical PostgreSQL databases on one server; independent credentials; private mTLS HTTPS; existing RabbitMQ |
| Approved authority model | Commerce durably authorizes an immutable Admin refund request before remote financial admission |
| Approved confirmation model | Durable conservative hold; terminal Commerce decision required; no expiry into financial or fulfillment permission |

MUST/MUST NOT/REQUIRED follow [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). Requirements and acceptance assertions are implementation gates. This folder contains documentation only.

## Objective and learning scope

Separate provider credentials, webhook ingress, financial operations and provider recovery from the Commerce process. Demonstrate exclusive ownership, independent releases, uncertain network outcomes, persisted coordination, single-writer migration and recovery across separate database commits.

This is a justified learning experiment. Phase 07 already bounds provider work inside the monolith; extraction does not automatically improve performance or availability. Completion requires evidence that stopping/releasing Payments isolates its process/secrets while Commerce retains its documented safe behavior.

Keep ASP.NET Core 10, EF Core/Npgsql 10, PostgreSQL 18, supported pinned RabbitMQ and the Phase 08 observability stack. Retain private sandbox accounts, restricted Admin networks, one merchant/location, whole-unit stock, USD cents, US destinations, USD 5.00 shipping, simulated 0% tax and backend-only Stripe sandbox methods. No raw card entry, live payments, MFA, cache, replica, Kafka, service mesh, workflow engine, Kubernetes or further extraction is added.

## Document map

| Area | Specification |
| --- | --- |
| Ownership, topology and dependency direction | [System design](system-design.md) |
| Problems, options and consequences | [Architecture decisions](architecture-decisions.md) |
| Concepts, exercises and understanding gates | [Prerequisites](system-design-prerequisites.md) |
| Epics, stories and acceptance | [Extraction workflows](functional-requirements/extraction-workflows.md) |
| Public compatibility and authority timing | [Compatibility and authority](functional-requirements/compatibility-and-authority.md) |
| Private routes, messages and structural schemas | [Service API contracts](functional-requirements/service-api-contracts.md) |
| Events, broker topology and consumption | [Integration events](functional-requirements/integration-events.md) |
| Distributed purchase and refund protocol | [Workflow coordination](reliability-and-failure-scenarios/workflow-coordination.md) |
| Crash, timeout, partition and correction cases | [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) |
| Ownership, additions and local locks | [Schema and ownership](database/schema-and-ownership.md) |
| Data transfer, cutover and rollback | [Migration and cutover](database/migration-and-cutover.md) |
| Measurable requirements | [Quality targets](non-functional-requirements/quality-targets.md) |
| Resources, workload and capacity gates | [Capacity](performance-and-scalability/capacity-and-service-budgets.md) |
| Threats and data protection | [Threat model](security/threat-model-and-controls.md) |
| mTLS, principals and authorization provenance | [Service identity](security/service-identity-and-authorization.md) |
| Required implementation evidence | [Verification scenarios](testing-strategy/verification-scenarios.md) |
| Options, service deployment and shutdown | [Configuration and operations](deployment-and-devops/configuration-and-operations.md) |
| Signals and investigation | [Observability](deployment-and-devops/observability-and-alerts.md) |
| Separate snapshots and integrated recovery | [Backup and restore](deployment-and-devops/backup-and-restore.md) |
| Required exit evidence and later experiments | [Phase 11 handoff](phase-11-handoff.md) |

## Scrum work packages

1. **MS-E1 — Boundary and contracts:** extraction decision, ownership inventory, public compatibility, service authentication and protocol state machines.
2. **MS-E2 — Durable remote coordination:** Commerce command intent, Payments receipt deduplication, confirmation/cancellation/refund races and financial recovery.
3. **MS-E3 — Data migration:** complete transfer, single writer, source descriptors, cursor/receipt preservation and reconciliation.
4. **MS-E4 — Independent operations:** service resources, event routing, telemetry, releases, multi-database backups and restore containment.
5. **MS-E5 — Evidence:** crash/partition/security/cutover drills, reference capacity and safe Phase 11 handoff.

Each package may span multiple Sprints. Follow its prerequisite exercise before implementation; stories and Given/When/Then assertions are in the workflows.

## Compatibility and precedence

This phase supplies an explicit overlay for a new service boundary. Earlier documents remain the historical monolith specifications. Their transaction composition, cross-owner FKs and direct Payments-to-Checkout wake apply before cutover; after cutover use this folder's replacements. Public schemas and financial/provider identities remain binding.

Changes requiring particular attention: delayed remote initialization after local purchase acceptance; durable authorization of Admin refund intent; a conservative confirmation protocol; a temporary fulfillment release guard; logical cross-service references; service-owned recovery operations; and independent backup snapshots. Their limitations are explicit in the linked contracts.

Phase 09 notification events retain their original schema/source/identity/bytes. New financial-change events feed Commerce reconciliation, not direct fulfillment. Notifications never acquires financial authority.

## Implementation Definition of Done

Apply the [global Definition of Done](../00-project-overview/global-definition-of-done.md). Required evidence includes exclusive database access, authenticated contracts, unchanged public receipt/schema behavior, every distributed crash boundary, safe refund/confirmation/cancellation races, one-provider-executor proof, complete migration/cutover/rollback and timed multi-database/provider reconciliation.

No financial safety gate is deferred to Phase 11. Unknown, held or exhausted work remains blocked, durable and alerted. Report Passed/Failed/Not run/Not applicable with reasons. Documentation completion is separate from implementation readiness.

Only Phase 10 is populated by this task. Phases 09 and 00–08 are unchanged; phases 11–13 remain empty. No application, migration, automated test, credential or executable infrastructure is created.
