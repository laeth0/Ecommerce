# Baseline, Capacity and Cache Admission

**Status:** future measurement specification. Limits are initial budgets, not measured ceilings. No cache, replica, partitioning or new load tool is installed here.

## Reference benchmark

Use the [global workload](../../00-project-overview/global-definition-of-done.md#41-reference-workload-for-phase-08) unchanged:

| Item | Required declaration |
| --- | --- |
| Data | 10,000 published products, 100 categories, 10,000 synthetic Customers, 100,000 historical Orders; enough stock for eligible success |
| App/primary resources | Aggregate application processes 2 vCPU/2 GiB; primary 2 vCPU/4 GiB; declare disk/host/network/patches/settings |
| Clients | 100 virtual users, ≤1 request in flight/user, 1-second think time; authenticate before timing |
| Mix | 65% Catalog detail/list, 10% search, 10% Cart, 5% Order history, 5% Checkout preview, 5% Checkout submission |
| Source | Existing isolated Development simulator Success/100 ms; required explicit Simulator/Orders flags; no real Stripe dispatch |
| Window | 2-minute warm-up +10-minute measurement, three runs; extend each run to ≥1,000 samples per reported class |
| Generator | Outside app/DB budgets; record achieved/offered rate and generator saturation |

Every new submission explicitly accepts its own stored quote with an original unique key. Pair Customer state so a preview supplies the next submission; report mismatched mix or underfilled classes as an invalid run. Cart reads/replenishment/version discovery belong in the 10% Cart budget. Preview prerequisites, replay, failures and auxiliary traffic are counted; do not create free invisible setup traffic during measurement. Use protected out-of-band read-only observation for work convergence, accounting for its DB load. If polling is used instead, report its extra offered/completed load separately and preserve the required core mix.

Access JWTs last 300 seconds, shorter than a reference run. Perform normal rotating refresh before expiry, with one refresh in flight per session and the original session/credential rules. Report refresh calls, bytes, failures and resource cost as auxiliary traffic; the six-class mix and ≥50 useful requests/sec refer to the core commerce workload. Do not extend token lifetimes, cache authority or exclude authentication failures to make the run pass. Keep refresh within existing Identity quotas; refresh timing must not use a synchronized burst across all users.

Pace initial login within the existing 30-per-source/minute limit; 100 users behind one source need multiple minutes of setup before warm-up. Prepare the synthetic dataset through reviewed isolated owner setup before the run; this specification creates no seeding executable or fixture. No benchmark-only authentication bypass, altered token lifetime, uncounted setup mutation or disabled quota is permitted.

No shared hot final unit in the normal run. Separate last-unit, duplicate-key, same-cart/version and concurrent-refund workloads report all conflicts and invariants; they cannot replace normal useful throughput. Purchase cleanup clears only the unchanged accepted cart; coordinate preparation deliberately so it does not submit an empty or edited cart.

Capture client complete-response p50/p95/p99 by class, offered/completed/rejected/timed-out counts, bytes, GC/CPU/RSS, pool utilization/wait, lock/execution/transaction time, worker eligible age/service rates and lease/retry outcomes. Preserve warm/cold/failed runs. [Quality targets](../non-functional-requirements/quality-targets.md) determine pass/fail. A single fast route or average percentile cannot pass the complete benchmark.

## Source-specific performance

Retain [Phase 07 financial workload and provider budgets](../../07-payments-and-refunds/performance-and-scalability/capacity-and-provider-budgets.md). Simulator results do not exercise Stripe callbacks, partial Admin refunds or verified reversals. Those are separate small actual sandbox functional probes or a later explicitly authorized adapter verification design, labeled honestly.

Do not load-test Stripe: ≤0.5 new payments/sec, ≤0.1 new refunds/sec, ≤100 affected objects per recovery drill and all calls ≤5/sec, burst 2, concurrency 2. Original scan/probe/cancel/refund/reconciliation calls share that account allowance. Measure source settlement/propagation separately from 202 acceptance.

The retained scan must cover the actual dataset in 24 hours. Even 100,000 objects need at least 1.16 one-object reads/sec before call amplification, while two slots with two-second calls sustain at most one call/sec. List-page economics may help only when the pinned provider contract provides sufficient verified facts. Count retrieval amplification and write recovery demand; do not assume an allowed 5 calls/sec is an achievable service rate. Unsupported scan volume blocks growth or requires a later measured capacity decision.

## Connection and execution budget

One shared API Npgsql data source/pool per replica services all module API work using the established compatible runtime grants. Do not instantiate a separate pool of 20 for every module/connection-string alias. Workers keep separate bounded data sources/credentials; component health checks use their existing applicable pool and deadline, not hidden extra pools.

| Process/role | Max connections | Instantaneous work budget |
| --- | ---: | --- |
| API | 20 per replica | 100 executing requests/replica, no unbounded admission queue |
| Identity cleanup | 2 per enabled replica | Existing bounded cleanup transactions/passes |
| Inventory expiry | 2 per enabled replica | 2-second poll, ≤100 groups/wake, one transaction/group |
| Checkout driver/simulator/quote cleanup | 2 per enabled replica | 2 action slots, 1-second poll, existing independent pass budgets |
| Outbound Payments executor | 2 total | Exactly one executor, 2 slots shared across financial/inbox/wake/scan work |
| PostgreSQL monitoring | 2 total | Read-only aggregate queries, bounded sampling |
| Migration authority | 1 total | One operator-controlled migration, no startup race |
| Protected operator inspection | 4 total | Bounded queries; no arbitrary full history export |
| Backup/isolated restore job | 2 total per target | One backup at a time; restore concurrency ≤2 in its isolated database |

Conservatively enabling all first three workers on `r` API replicas uses `26r + 2` runtime connections. Add 9 for monitor/migration/operator/backup: planned maxima **37 at r=1; 63 at r=2**. Actually record which workers run; never subtract a pool while its process is still enabled. Other tools and parallel backup jobs are not free.

Initial primary `max_connections=100`; reserve 20 connections from ordinary application use, configured as 17 `reserved_connections` plus 3 `superuser_reserved_connections`. Only approved recovery/operator roles may use the non-superuser reserve; runtime/monitor/backup cannot. This protects administrative access, not resource-free recovery. Validate actual PostgreSQL settings/role grants; [connection documentation](https://www.postgresql.org/docs/18/runtime-config-connection.html) defines reserved-slot behavior. Normal planned maximum is ≤80. A third conservative replica plans 89 and fails this envelope before deployment; increasing the database limit requires measured CPU/memory/worker/account capacity review.

Keep pool wait 1 sec, lock wait 250 ms, command 2 sec, transaction 3 sec and request 10 sec. Propagate remaining time; retries cannot reset the outer deadline. Provider call ≤2 sec with no acquired DB connection; action ≤10 sec, lease 30 sec, shutdown 15 sec. No background parallelism is increased to hide slow service.

## Diagnose and tune in order

1. Compare offered work with useful completion and due-work arrival/service rates. Identify whether pressure is CPU, pool, locks, disk, provider or telemetry.
2. Inspect the bounded owner query inventory; eliminate duplicated fetches/N+1 and unused columns. Preserve snapshot and ordering semantics.
3. Inspect representative estimates/buffers/sorts with maintained statistics; compare existing indexes against predicates/cursors. Add/replace an index only with evidence and write-cost review.
4. Investigate hot-row contention with the documented lock graph. Never remove a protecting lock/version check for a benchmark gain.
5. Re-run the affected workload and all reference classes. Retain the first failed evidence and changed configuration fingerprint.

Bulkheading can preserve unrelated reads during a provider outage; primary-wide exhaustion remains a shared failure. An overload run with 200 users or a controlled slow query is a separate stress experiment, not evidence that the 100-user baseline passed. Observe finite resources and controlled 503/429; count them in availability when valid in-budget requests are affected.

## Worker fairness and retained data

Measure Inventory expiry separately from Checkout purchase/cancellation/compensation/cart cleanup; measure financial ingress observation, dispatch, wake and retained scan independently. Give each existing class a bounded turn per poll and persist continuation. No job may load all accepted attempts/refunds into memory or hold a claim while waiting for a different earlier owner lock.

At normal load there is no sustained growth in required eligible backlog over the measurement window; p95/p99 scheduling targets hold. Under outage, show offered versus recovered service rate and oldest eligible item. ManualReview still needs alert/inspection and retained scan; it is not a forgotten terminal-success bucket. Security/quote cleanup retains its existing independent budget and cannot starve action work.

Record growth/cost for receipts, immutable audits, movements, work and financial facts. Do not delete unresolved/accepted financial records to regain capacity. Extend the dataset for a separate retention/scan experiment; this does not claim 1,000/10,000/100,000 concurrent-user readiness. Those workload/topology decisions belong to 12.

## Cache admission gate

The owner explicitly selected PostgreSQL-only in 08. No automatic threshold turns on a cache. A future proposal may be opened only when all of the following are evidenced:

1. After query/batch/index/statistics tuning, a named safe read class still misses its p95 target in at least two of three identical reference runs, or shows primary utilization ≥70% continuously for five minutes at the declared eligible workload.
2. Repeated reads of that class account for ≥40% of measured DB command execution time or ≥30% of application CPU in the same run. Lock contention/provider latency alone does not justify caching.
3. A captured request distribution supports a projected ≥2× reduction in that class's primary reads, with key volume, size, memory and hot-key assumptions stated; a later experiment must verify the projection.
4. An ADR names permitted staleness, safe fields/visibility, invalidation race handling, negative entries, TTL/jitter, cold restart/stampede control, fallback admission budget and outage behavior.
5. New public staleness/security/contract behavior is reviewed and approved before implementation. Current no-store/current-publication behavior cannot be silently relaxed.

A later cache may accelerate safe reads. It never authorizes stock allocation, identity/role, payment/refund decisions, accepted prices or final Checkout totals. Withdrawal of a product/category must satisfy the chosen public-visibility policy even on cache hits. A cache outage cannot send unlimited fallback traffic to PostgreSQL. The target sequence is baseline → measure → bottleneck → reviewed cache → explicit failure/staleness policy → measure again.

## Report acceptance

For each run record artifact/config/data fingerprint, source, time window, all class counts/percentiles, throughput/errors, resource maxima, DB/worker evidence and invariant result. Report Passed/Failed/Not run with exact limits. Only measured bottlenecks justify a follow-up infrastructure proposal.
