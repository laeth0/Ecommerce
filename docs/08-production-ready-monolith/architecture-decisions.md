# Phase 08 Architecture Decisions

**Status:** accepted specification direction within the owner's sandbox choices; implementation evidence remains required. These ADRs refine the phase 00 architecture without changing the roadmap.

## MON-ADR-01 — Measure PostgreSQL before adding a cache

- **Problem:** repeated Catalog reads may eventually dominate resources, but there is no measured cache requirement. Existing publication and final-price rules demand current primary truth.
- **Options:** primary queries/indexes/batching; cache now; replica/search engine.
- **Decision:** keep PostgreSQL-only. Use the [cache measurement gate](performance-and-scalability/baseline-and-capacity.md#cache-admission-gate) to justify a later proposal.
- **Rationale:** the owner explicitly chose baseline → measure → identify bottleneck before cache adoption. Existing access paths may meet targets without another consistency boundary.
- **Costs/failures:** primary is the read availability/capacity boundary; repeated reads remain costly. A later cache introduces invalidation, privacy/visibility staleness, cold misses and stampede/outage load.
- **Verification:** capture CPU/DB time for repeated reads, tune the measured path and repeat all reference runs. A hypothetical future hit rate cannot pass the current phase.

## MON-ADR-02 — Keep the private account model

- **Problem:** operational hardening could accidentally imply public onboarding or real-user recovery readiness.
- **Options:** preserve sandbox/operator recovery; add public verification/self-service recovery/Admin MFA.
- **Decision:** retain private fixtures and restricted Admin networks, explicitly confirmed by the owner.
- **Rationale:** phase scope is measured system operation; public identity protection requires its own product/recovery policy and delivery.
- **Costs/failures:** operator access is privileged; compromised private credentials still require revocation and investigation. This model does not support unrestricted public or live-money rollout.
- **Verification:** attempt cross-customer use, Admin use outside approved networks, forged forwarding and stale restored sessions. Each must be denied through original authority rules.

## MON-ADR-03 — Bound shared resources across modules and replicas

- **Problem:** one slow query/worker can exhaust a primary; multiplying pools or waiting queues hides overload rather than adding capacity.
- **Options:** enlarge pools/unbounded queues; separate services; existing executing slots, finite pools and owner work budgets.
- **Decision:** retain shared API pool 20/replica, explicit worker pools and the [connection envelope](performance-and-scalability/baseline-and-capacity.md#connection-and-execution-budget). Keep exactly one outbound Payments executor.
- **Rationale:** local isolation and measured queue/service rates expose the bottleneck before extraction. Durable work permits delayed action without holding HTTP resources.
- **Costs/failures:** overload rejects requests; replica count is a budget decision; hot-row locks remain. A fixed provider rate can make a 24-hour retained scan impossible at large volume.
- **Verification:** saturate API/worker pools separately, slow provider calls and restart workers. Check bounded memory/connections, original receipts, fair recovery and age alerts.

## MON-ADR-04 — Reuse primary-backed counters for commerce

- **Problem:** per-process limits multiply during a two-replica deployment; arbitrary anonymous traffic consumes shared DB capacity.
- **Options:** local limits only; add Redis coordination; reuse Identity counter ownership with distinct scopes.
- **Decision:** extend the existing HMAC fixed-window mechanism and explicitly widen commerce Problem schemas for 429.
- **Rationale:** reuses the current primary consistency boundary and cleanup rather than introducing cache infrastructure. Counters finish before business locks.
- **Costs/failures:** counter contention and additional writes; NAT sharing; adjacent-window bursts; primary outage fails closed. 429 is an explicit compatibility addition for strict consumers.
- **Verification:** race two replicas against one bucket and a minute boundary; spoof IP headers; fail the counter write; confirm zero business effects on denied requests.

## MON-ADR-05 — Separate diagnostic storage from authoritative records

- **Problem:** logs alone cannot explain distributed execution across API replicas/background actions; full payload logging would expose secrets and create unbounded storage.
- **Options:** local logs; user-selected OpenTelemetry + Prometheus + Tempo + Loki + Grafana; a managed telemetry stack.
- **Decision:** use the selected private stack with explicit retention, resource caps and safe attributes. Optional owner diagnostic columns carry original server context into worker trace links.
- **Rationale:** metrics show prevalence, traces show execution/waits, searchable structured logs connect events. Stored context survives restart with negligible data per existing row and no new workflow store.
- **Costs/failures:** extra processes/storage; sampling/queue drops; missing traces; cardinality and retention configuration mistakes. Diagnostic availability is independent from immutable audit/business durability.
- **Verification:** disable each backend, fill export queues and restart a linked worker; business outcomes remain unchanged and drop/gap signals are visible. Search for synthetic secret/PII markers in every export.

## MON-ADR-06 — Restore all owners together and reconcile provider gaps

- **Problem:** separate schema snapshots or lost recent keys can leave stock/Orders/Payments inconsistent while external captures remain real provider facts.
- **Options:** individual schema dumps; one whole-database logical backup; physical/PITR recovery now.
- **Decision:** whole-database custom-format logical backup every 12 hours, encrypted off-host, plus protected manifest/secret/reconciliation material; timed integrated restore. Tighter PITR objectives remain 13.
- **Rationale:** one snapshot fits the shared monolith transaction boundary and the current RPO/RTO learning targets. A 12-hour cadence leaves margin for a failed run under a 24-hour RPO.
- **Costs/failures:** long snapshot/read I/O, missing cluster roles/secrets, restore duration and finite data loss. Provider effects outside the snapshot must be discovered and resolved; successful `pg_restore` alone is insufficient.
- **Verification:** restore a backup preceding a sandbox capture/refund, find missing mappings, revoke restored sessions and time safe reopening. Incomplete enumeration leaves the recovery gate failed.

## MON-ADR-07 — Use controlled deployment downtime in this stage

- **Problem:** an unsafe migration or overlapping provider executors can reinterpret retained work or spend the account budget twice.
- **Options:** manual controlled stop/start; immediate automated rolling/HA deployment; a new global maintenance-state database.
- **Decision:** protected ingress maintenance, bounded drain/stop, one migration authority and compatible restart. Add no public operator API or operational global row lock.
- **Rationale:** demonstrates release/rollback correctness with the existing deployment boundary. It avoids a new cross-module lock solely for rare operating transitions.
- **Costs/failures:** downtime counts against availability; operator procedure must prove all senders stopped. Configuration flags alone cannot recall in-flight financial requests.
- **Verification:** stop during acceptance and provider uncertainty, migrate, restart and replay original identities. Refuse rollback to a binary unable to understand retained sources. Full rolling/HA deployment evidence is later scope.
