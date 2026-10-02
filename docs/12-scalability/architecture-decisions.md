# Scalability Architecture Decisions

**Status:** accepted direction; optional mechanisms require their evidence gates and approved concrete proposals. No infrastructure is activated.

## SCL-ADR-01 — Separate user count from capacity

**Problem:** registered/virtual users are often mistaken for simultaneous requests or supported RPS.
**Current limit:** the reference proves only its declared workload if actually run; quotas/auth refresh can cap growth first.
**Decision:** controlled 100/250/500/1,000-user plans with paced rates and actual session distribution; 10,000/100,000 remain analytical.
**Alternatives:** proportional extrapolation or a blanket “100k-ready” target hides input, source, quota and resource constraints.
**Cost/failures:** more plans/evidence; generator pacing can mask overload if undeclared. Separate eligible-load and offered-stress runs.
**Verification:** SCL-V01–06, 29–30.

## SCL-ADR-02 — Tune PostgreSQL before new dependencies

**Problem:** broad search, quota counters, lock waits or maintenance may dominate without benefit from a cache.
**Decision:** plans/statistics/query/index/maintenance evidence first; preserve API shape/limits and owner locks.
**Alternatives:** more pools worsen shared contention; read replicas lag decisions; partitioning can weaken uniqueness.
**Cost/failures:** index writes/WAL, statistics drift and online-index failure require measurement/rollback.
**Verification:** SCL-V07–12, 31–33.

## SCL-ADR-03 — Keep the current replica/pool envelope

**Problem:** replicated workers/data sources multiply primary connections and retries.
**Decision:** one/two Commerce replicas only, same aggregate 2CPU/2GiB app allocation; 48/79 connections, no new Payments executor.
**Alternative:** immediate larger topology cannot isolate the limiting resource and is unapproved.
**Cost/failures:** extra replica overhead can reduce useful capacity on the same host; health/circuit state differs per instance.
**Verification:** SCL-V13–16, 31.

## SCL-ADR-04 — Gate Redis with the existing safe-read policy

**Problem:** repeated materialization can cost CPU/I/O, but current publication/price/authority must remain fresh.
**Decision:** retain Phase 08 gate; specify versioned immutable nonsecret materialization with current primary guards, bounded cache memory/TTL/fallback and no cache authority.
**Alternatives:** whole-page/stock/money/session caches violate present contracts; asynchronous invalidation alone leaves stale visibility windows.
**Cost/failures:** guard queries may eliminate the projected gain; miss storms/outage/poisoning add failure modes. Reject the proposal if the gate cannot be met.
**Verification:** SCL-V17–21; [cache design](performance-and-scalability/cache-design-and-admission-gates.md).

## SCL-ADR-05 — Restrict replica experiments to provably safe reads

**Problem:** primary I/O may be dominated by protected immutable history after tuning.
**Decision:** conditional physical-standby experiment, no public route switch, with current primary authority/mapping and replay fence; reads fail closed/fallback boundedly on lag/conflict.
**Alternatives:** route Catalog/status/financial/Identity to asynchronous standby changes truth; synchronous replication adds write availability/latency obligations; automatic promotion changes disaster protocol.
**Cost/failures:** entire cluster data replicated, WAL-slot retention, conflicts and clock/lag measurement. No HA claim or promotion.
**Verification:** SCL-V22–25; [replica design](database/read-replicas-and-consistency.md).

## SCL-ADR-06 — Partition only a demonstrated owner-local problem

**Problem:** retained data may outgrow efficient index/maintenance/scan behavior.
**Decision:** compare existing indexes with isolated partition candidates. Preserve exact global IDs/dedup/FKs; no active core table conversion without an explicit unique-identity/migration proof.
**Alternatives:** time partitions with only (id, time) uniqueness weaken original id-only uniqueness; dropping old partitions violates retained evidence.
**Cost/failures:** pruning requires matching predicates, many partitions increase planning, missing partition blocks writes and backfill/cutover can exceed recovery.
**Verification:** SCL-V26–28, 32–34; [partition design](database/partitioning-and-retained-data.md).

## SCL-ADR-07 — Preserve serialized stock and fair message processing

**Problem:** a flash-sale stock row and one local sink can cap useful completion independently of API throughput.
**Decision:** measure skew/conflicts/lock service and original conservation; measure worker/queue drain under current ownership and counters before any increase.
**Alternatives:** Redis stock, removed locks, oversized prefetch, new ordering guarantees or blind queue sharding threaten correctness.
**Cost/failures:** hot-row capacity remains finite; rejected/held work stays visible rather than “optimized away.”
**Verification:** SCL-V11–12, 14–16, 29–30.

## SCL-ADR-08 — Include recovery and cost in every capacity claim

**Problem:** a fast warm benchmark may have unmanageable retained scan, backup, disk or rollback cost.
**Decision:** report bytes/object, amplification, service/drain, primary/diagnostic/optional resources and paired-v3/provider-gap feasibility. Unreached tiers remain goals.
**Alternatives:** excluding auxiliary auth/setup/recovery or deleting evidence misstates capacity.
**Cost/failures:** safe data volume can be lower than peak HTTP capacity.
**Verification:** SCL-V31–40; [handoff](phase-13-handoff.md).
