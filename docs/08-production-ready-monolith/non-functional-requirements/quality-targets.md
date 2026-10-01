# Monolith Non-Functional Requirements

**Status:** proposed acceptance targets; no runtime, load, availability or restore evidence exists from this documentation delivery. Workload/resource/source details are fixed in the [benchmark](../performance-and-scalability/baseline-and-capacity.md); the [global baseline](../../00-project-overview/global-definition-of-done.md#4-initial-measurable-quality-targets) remains authoritative.

## Latency and capacity

Measure client-observed complete responses, including admitted validation, primary authority, persistence and serialization. Warm two minutes, measure ten minutes, three runs, extend until every reported class has ≥1,000 observations. Require every target in every run; report all failures and cold-start results. Resources: application processes aggregate 2 vCPU/2 GiB; primary 2 vCPU/4 GiB; separate generator and declared telemetry/edge storage/resources.

| ID | Operation/metric | Pass condition |
| --- | --- | --- |
| MON-NFR-01 | Catalog detail/list and Order history | p50 ≤100 ms, p95 ≤300 ms, p99 ≤750 ms |
| MON-NFR-02 | Catalog search | p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms |
| MON-NFR-03 | Cart operations | p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms |
| MON-NFR-04 | Durable Checkout acceptance | p50 ≤250 ms, p95 ≤750 ms, p99 ≤1,500 ms; provider settlement excluded |
| MON-NFR-05 | Checkout preview | Phase 08 added target: p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms |
| MON-NFR-06 | Useful completed request throughput | ≥50 requests/sec with the complete 65/10/10/5/5/5 mix; no sustained required-work backlog growth |
| MON-NFR-07 | Unexpected eligible failures | <0.5%, including timeouts, 5xx, and unexpected quota/capacity rejection. Deliberate invalid requests/conflicts reported separately |
| MON-NFR-08 | Interactive database command | p95 ≤100 ms including execution/lock wait; report pool wait and total per-request DB time separately |
| MON-NFR-09 | Healthy simulator purchase convergence | Acceptance→legitimate terminal outcome p95 ≤5 sec, p99 ≤15 sec; source Success has 100 ms delay |
| MON-NFR-10 | Routine due background work | Eligible→action p95 ≤5 sec, p99 ≤15 sec for expiry and scheduled healthy local work; unchanged source deadlines |
| MON-NFR-11 | Financial-specific operations | Preserve all [Phase 07 targets and workloads](../../07-payments-and-refunds/non-functional-requirements/quality-targets.md); report them separately from the shared benchmark |

Do not average route percentiles or run percentiles. Report per-operation distributions and counts; a combined dashboard distribution does not excuse a slow class. True stock/money/authority violations have zero tolerance regardless of throughput. Benchmark source exclusions must be explicit: no simulator result is actual Stripe capacity or live settlement evidence.

## Availability, consistency and recovery

| ID | Requirement | Target and evidence |
| --- | --- | --- |
| MON-NFR-12 | Critical API availability | Operating objective 99.9% over rolling 30 days; actual claim needs sustained evidence in 13 |
| MON-NFR-13 | Fault convergence | At ≤100 affected attempts, ≥99% legitimate terminal or explicitly alerted ManualReview within five minutes after dependencies recover; zero concealed unresolved attempts |
| MON-NFR-14 | Integrated restore | RPO ≤24 hours; RTO ≤2 hours including primary authority, sessions, grants, invariants and provider-gap reconciliation |
| MON-NFR-15 | Decision consistency | Identity/stock/prices/publication/cart/Orders/money use primary owner contracts; no stale authority. External effects/work application remain explicitly eventual |
| MON-NFR-16 | Idempotency and durability | Every acknowledged receipt maps to committed intent; duplicate requests/callbacks/restarts preserve original keys and evidence; no ordinary duplicate financial effect |
| MON-NFR-17 | Single executor isolation | One outbound Payments executor, ≤5 calls/sec, burst 2, concurrency 2, including scans/operator probes; actual Stripe functional traffic stays within Phase 07 small-probe limits |
| MON-NFR-18 | Retained financial reconciliation | Full persisted cycle within 24 hours at the measured admitted dataset size; inability to meet it blocks unsupported growth |

Availability numerator is correctly handled eligible critical requests; denominator is all valid in-budget requests, including requests rejected by infrastructure. Expected business conflicts are reported explicitly; malformed/unauthorized/intentional over-quota traffic is excluded and counted separately. Maintenance downtime counts. Lack of traffic or telemetry gaps is missing evidence, not 100% success. A quick 202 with indefinite unfinished work fails the workflow SLI.

A finite local RPO permits missing recent records. It does not promise zero financial loss. The [restore runbook](../deployment-and-devops/backup-and-restore.md) holds purchase/financial mutation/fulfillment until missing provider effects are matched or safely resolved. Later RPO ≤5 minutes/RTO ≤60 minutes belongs to 13.

## Resource and operating bounds

| ID | Requirement | Required bound/assertion |
| --- | --- | --- |
| MON-NFR-19 | API admission and pools | ≤100 executing requests/replica; shared API pool 20/replica; no unlimited waiting queue |
| MON-NFR-20 | Deadlines | Pool 1 sec, row lock 250 ms, command 2 sec, business transaction 3 sec, request 10 sec; nested budgets consume remaining outer time |
| MON-NFR-21 | Workers/shutdown | Existing worker pools/actions/leases/scan sizes remain bounded; drain/cancel ≤15 sec and preserve committed work |
| MON-NFR-22 | Database connection reserve | Budget all processes against initial `max_connections=100`, with ≥20 reserved headroom; measured combined peak within planned budget |
| MON-NFR-23 | Telemetry export | Asynchronous bounded queues; each enabled signal/backend outage cannot cause unbounded growth or block a business commit; drop/backlog counters visible |
| MON-NFR-24 | Telemetry overhead | Added gate: instrumented benchmark keeps all primary targets; p95 latency and application CPU increase ≤10% against the same uninstrumented comparison; application memory remains within 2 GiB |
| MON-NFR-25 | Cardinality/retention | ≤10,000 active application metric series per deployment; allowed dimensions only; configured diagnostic retention/volume caps are exercised |
| MON-NFR-26 | Query/data access | Bounded pagination and batch reads; no N+1, unbounded enumeration or DB transaction across provider I/O; retained scans use persisted continuation |

All earlier request/response limits remain route-specific; the callback's 256 KiB allowance must not raise ordinary API body limits. Operating configuration cannot enlarge the 15-minute reservation or 23-hour retry horizon as a performance fix. Raising pool sizes or worker concurrency requires a measured resource/account budget review.

## Security and maintainability

| ID | Requirement | Acceptance assertion |
| --- | --- | --- |
| MON-NFR-27 | Account protection | Private sandbox/operator-assisted recovery and restricted Admin networks; zero authority bypass or cross-customer disclosure |
| MON-NFR-28 | Privacy and secrets | Zero secret, PII, raw card/provider payload or raw untrusted URL/query in responses/telemetry/committed artifacts; synthetic IDs only in authorized inspection |
| MON-NFR-29 | Least privilege | API/worker/monitor/backup/migration/operator identities have only declared grants; runtime cannot DDL or change arbitrary finance facts |
| MON-NFR-30 | Release compatibility | Strict error consumers updated before quota rollout; nullable diagnostic additions readable by supported binaries; no destructive rollback |
| MON-NFR-31 | Configuration and dependencies | One named Options boundary, fail-closed validation, supported stable patches and reviewed vulnerabilities; no silently adopted cache/broker/runtime upgrade |
| MON-NFR-32 | Evidence and future testability | Reproducible manual scenario/evidence mapping; business logic separated from external I/O where practical. No new automated tests/framework without explicit request |

Verification assertions for these rows are in [V01–V23](../testing-strategy/verification-scenarios.md). When a target lacks implementation/infrastructure, its result is Not run rather than Passed. No contractual SLA or compliance certification is created by this specification.
