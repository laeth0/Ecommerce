# System Design Prerequisites & Concepts to Learn

Study these concepts before implementation. Explain each mechanism using one normal execution, concurrent contention, process crash and recovery. All experiments below are future manual evidence plans; no harness, fixture or automated test is created now.

## MON-E1 — Workload, percentiles and queueing

**Concept:** an offered workload is distinct from completed useful work. A percentile describes a distribution, not a sum/average of other percentiles. A closed model with 100 users and think time can hide saturation by reducing offered work as responses slow.

**Mental model:** clients wait → executing admission → pool acquisition → row locks/query execution → serialization → client response. At each stage, arrival rate, service time and number of slots determine waiting. Little's Law relates average in-system work to achieved arrival rate and residence time only under the appropriate stable conditions; a growing backlog is not a stable operating point.

**Why this design:** record offered/completed throughput, all waits and background arrival/service rates instead of calling a bigger pool scaling. Separate the final-unit contention experiment from ordinary eligible success paths.

**Study:** queueing/service demand, coordinated omission, histogram buckets and closed/open workload models. [Prometheus histograms](https://prometheus.io/docs/practices/histograms/) explain aggregation and quantile trade-offs.

**Experiment:** add a controlled slow read, observe pool/latency/throughput/backlog, then reduce the read cost. Raising pool size without measurement may increase primary saturation rather than improve useful throughput.

## MON-E1/E4 — PostgreSQL plans and index cost

**Concept:** a B-tree orders comparisons; composite leading keys and partial predicates constrain useful access. GIN fits the existing full-text operators. Covering indexes can reduce heap work when visibility conditions allow, but add write and storage cost.

**Mental model:** planner estimates rows from statistics → chooses scan/join/order → executor visits index/heap and buffers → locks/I/O/CPU consume time. A plan cost is an estimate, not elapsed milliseconds. Run representative parameter distributions and deep cursors.

**Why this design:** identify repeated lookups, broad scans, bad estimates and sort spills before choosing new infrastructure. The existing Catalog GIN and owner due-work indexes are starting candidates, not evidence of optimality.

**Study:** [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html), selectivity, buffers, statistics, autovacuum, index write amplification and additive migrations.

**Experiment:** inspect a slow Catalog search and worker due scan on disposable realistic data; compare before/after plans and mutation cost. Never execute a mutating `EXPLAIN ANALYZE` against ordinary shared financial state.

## MON-E2 — Logs, metrics, traces and correlation

**Concept:** metrics summarize counts/distributions; logs describe discrete events; traces connect timed spans. A correlation UUID is not a W3C span context. Sampling removes some traces and cannot drive complete SLI counts.

**Mental model:** a server root creates trace/span IDs → request log maps server UUID → SDK batches signals → Collector filters/bounds pipelines → Prometheus/Tempo/Loki store diagnostics → Grafana correlates them. A later worker starts a new root with a link to stored origin context; its durable business key remains separate.

**Why this design:** persisted owner context survives a crash without holding a long HTTP span or inventing a new event bus. Label allowlists prevent an ID per customer from creating a series/stream explosion.

**Study:** [OpenTelemetry .NET traces](https://opentelemetry.io/docs/languages/dotnet/traces/), [Collector pipelines](https://opentelemetry.io/docs/collector/architecture/), head sampling, context links, Loki labels versus structured metadata, trace/log privacy.

**Experiment:** restart a worker after acceptance; locate the new trace through its origin link. Disable the Collector and verify bounded drop/backlog behavior and preserved business work. Unsampled/missing context must be ordinary diagnostic absence.

## MON-E3 — Admission, fixed windows and failure isolation

**Concept:** rate limits bound arrivals over time; executing slots bound instantaneous work; connection pools bound database access. None substitutes for the other. A fixed-window boundary permits bursts across adjacent windows.

**Mental model:** normalize source → validate route/actor → commit global/source/actor counters separately → release counter locks → acquire original Identity/domain locks. Exhaustion denies before business effects. Workers use separate bounded pools and durable scheduling.

**Why this design:** reusing the primary counter owner avoids per-replica multiplication; independent pool/action budgets stop a provider wait from holding retail capacity. No local fallback is safe when the primary supplies authority too.

**Study:** bulkheads, backpressure, fair scheduling, HMAC identifiers, trusted-proxy boundaries, lock graphs and timeout composition.

**Experiment:** two replicas hit one bucket at a minute boundary while provider calls time out. Verify shared allowances, bounded executing requests, expiry progress and absence of database connections during provider I/O.

## MON-E4 — Compatibility and controlled release

**Concept:** additive schema changes can still be incompatible with strict clients, old grant sets or retained provider versions. Expand/migrate/contract is a compatibility process, not a promise that every DDL statement is harmless.

**Mental model:** review artifact/SQL/grants → deploy schema and consumers compatible with both versions → activate new behavior → preserve retained rows for rollback → remove old structures only in a separately reviewed future change.

**Why this design:** nullable diagnostics and explicit 429 schemas permit a controlled rollout; manual stop/start prevents competing outbound executors. A runtime process never migrates its database on ordinary startup.

**Study:** [PostgreSQL concurrent index creation](https://www.postgresql.org/docs/18/sql-createindex.html), constraint validation, EF reviewed migration SQL, artifact immutability and rollback limits.

**Experiment:** interrupt a migration and restart with outstanding original payment work. Identify actual schema state and recover using a compatible binary; never drop history to make rollback succeed.

## MON-E5 — Backups, RPO/RTO and external-ledger recovery

**Concept:** RPO bounds missing local data; RTO includes usable service recovery. A provider's ledger is outside the database snapshot. A backup that cannot be decrypted/restored is not a recovery point.

**Mental model:** one primary snapshot → complete encrypted off-host archive plus protected manifest → isolated all-owner restore → sessions/grants/invariants → authenticated provider enumeration across the gap → original-work recovery or quarantine → reviewed reopening.

**Why this design:** a whole-database snapshot preserves local atomic relationships; separate manifest/account access discovers effects whose local rows were lost. A daily job without duration/failure margin cannot reliably satisfy a 24-hour age objective.

**Study:** [PostgreSQL SQL dumps](https://www.postgresql.org/docs/18/backup-dump.html), [continuous archiving/PITR](https://www.postgresql.org/docs/18/continuous-archiving.html), secret recovery, orphan correlation, financial uncertainty and operator authority.

**Experiment:** back up, then capture/refund in the real sandbox, restore the older archive and discover missing local mappings before reopening. Missing first-send information forbids inventing a fresh provider POST window.

## Cache concepts to study without implementation

Cache-aside: read cache → miss → primary → populate; simultaneous misses can stampede. Invalidation races can repopulate a withdrawn product. TTL bounds age only under a declared policy and does not make current authorization valid. Study single-flight, jitter, negative entries, versioned keys and capacity-limited fallback. The [cache gate](performance-and-scalability/baseline-and-capacity.md#cache-admission-gate) demands evidence and a new policy before introducing any cache.

## Prerequisite acceptance

Before a work package starts, the implementer can draw its lock/resource/data flow, identify authoritative proof, explain a crash before/after commit and predict the required failure outcome. If an experiment cannot be run, record Not run and retain the implementation gate.
