# Retry Amplification, Recovery Fairness and Capacity

## Reference environment

Retain [Phase 10 workloads/resources/pools](../../10-microservices/performance-and-scalability/capacity-and-service-budgets.md). No extra breaker worker, queue process, database pool or provider executor is introduced.

| Resource | Binding envelope |
| --- | --- |
| Application | Aggregate2CPU/2GiB: Commerce1.5CPU/1.5GiB over declared replicas; Payments0.5CPU/0.5GiB |
| Primary / broker / observability | Primary2CPU/4GiB; broker2CPU/2GiB/declared10GiB disk; observability4CPU/4GiB; generator separate |
| Ordinary connection plan | Commerce31r + Payments6 + monitor/migration/operator/backup11 = `31r+17` |
| Replica limit | One Commerce replica48, two79; three110 prohibited under ordinary80/max100 |
| RPC/HTTP admission | Commerce≤100 public executions/r; private2 command+2 read slots/r; Payments≤32 HTTP total, callbacks≤8 within32 |
| Recovery/provider execution | Checkout two action slots/r; Payments existing two executor slots; one account executor |
| Provider budget | All calls≤5/sec, burst2, concurrency2, call≤2s, automatic SDK retries0 |
| Due selection | ≤20 candidates/pass; active wake≤10s, freed slot immediately considers next eligible turn; one-second poll for idle discovery |

Two separate logical DBs do not separate CPU/disk/connection limits. Circuit state stays finite in application memory; it cannot hide a new connection consumer.

## Workloads and evidence classes

1. **Public reference:**100 VUs, one request in flight/VU, one-second think time,10k products/100 categories/10k Customers/100k Orders,65% catalog/10% search/10% Cart/5% history/5% preview/5% submit. Normal JWT/refresh/quota behavior. Two-minute warm-up, ten-minute measurement, three runs, ≥1,000/class/run.
2. **Private transport:**≤10 original commands/sec in isolated Development, valid preaccepted mappings, Initialize and proved never-dispatched Closure, executor stopped and provider egress fenced. No capture/refund fact simulation. Setup/acceptance work is counted separately.
3. **Financial probe:**genuine approved sandbox effects only,≤100 affected objects/drill,≤0.5 new payments/sec and≤0.1 refunds/sec. All retrievals/probes still share account quota. Report sample limitations.
4. **Recovery backlog:**up to100 existing accepted affected attempts, with declared age/state/fanout; use eligible original work. Keep stable same workload/resources when comparing jitter/breaker/fairness policies.

Original Commerce simulator success delay100ms tests local workflow only. It cannot prove extracted Payments latency or financial correctness. The declared VU/think-time setting imposes its own throughput ceiling; record actual offered requests and do not present an unreachable closed-loop rate as system capacity.

## Amplification arithmetic

Measure each boundary separately:

```text
amplification = actual dispatched calls / distinct original logical operations
retryFraction = recovery/repeat calls / all dispatched calls
requiredCallRate = logical arrival rate * mean boundary calls per operation
netDrainRate = useful service rate - incoming required work rate
estimatedDrainTime = eligible backlog / netDrainRate, if netDrainRate > 0
```

Counts include receipt queries, evidence retrievals, provider pagination, reversals, gate probes and scan. Local breaker deferrals are not actual calls; report them separately. A ten-observation limit applies per named work cycle, not ten calls across an entire purchase lifetime. Genuine new facts and attributed resumes can add cycles; total lifetime amplification must still be measured.

Example: three genuine new purchases/second, four provider calls/purchase and mean repeat factor1.5 imply18 calls/second, exceeding5 before retained scan/refunds. This is an arithmetic overload example, **not an approved sandbox workload**. Increasing worker count cannot overcome the account budget.

At concurrency2 and actual two-second call duration, sustainable execution is at most1 call/second even though the rate ceiling is5. A backlog of100 eligible operations requiring three serial observations each needs300 calls; if useful capacity is1/sec and background demand0.2/sec, estimated drain is375s. Five-minute disposition therefore may include ManualReview rather than successful settlement. Report both; never discard work to make drain time look better.

Bounded jitter reduces alignment but shortens mean waits from151s to113.5s before the tenth attempt. Measure one-second outbound-call buckets, p95/p99 concurrency and owner pool wait under the same failures. Do not assume jitter lowers total calls.

## Fair selection and overload

Use existing persisted scheduler continuation with fixed class rotation. Commerce classes cover cancellation/compensation, purchase/command/hold resolution, Cart cleanup and protected remote replay. Payments covers closure/compensation, original mutation/verification, hold/barrier/decision recovery and retained scan.

- Give every eligible nonblocked class a turn within30s under the declared recovery experiment. Record selected/skipped/no-slot turns and oldest eligible wait; a slot turn is not a guarantee of remote success.
- Prefer resolving already accepted safety-critical work over new admission; do not starve retained scan or callback evidence application.
- Do not let one payment repeatedly occupy both executor slots or restart a pass with the same locked row. Use existing parent serialization and bounded candidate continuation.
- A not-yet-due/open-circuit/held-for-proof row is skipped with retained cause/deadline; it cannot busy-loop or hide all other work.
- No waiting task collection behind a full semaphore/pool. Reject/defer within current contract and persist original work.
- If offered work grows faster than useful service rate for three consecutive one-minute windows, inspect amplification/resources and close new affected admission through existing attributed gates. Accepted resolution remains eligible.

No new universal priority table/queue is required. If the actual existing continuation cannot express fairness, propose its narrow owner-local change with evidence during implementation; do not silently add a separate scheduler.

## Measurement experiments

| Comparison | Hold constant | Required report |
| --- | --- | --- |
| Fixed versus persisted jitter | Original accepted backlog, transient fault boundaries, budgets/resources | Due draws, outbound bucket peaks, total calls, useful outcomes/review, restart stability |
| Breaker disabled versus enabled | Same eligible fault workload; enough dispatched calls to meet threshold | Opening time, actual attempts in60s after open, ≥80% reduction, all deferrals/deadline disposition |
| Read saturation versus command recovery | Same VU mix and command backlog | Read/command slot isolation, p95 unrelated routes, heap/tasks, pool/lock wait |
| Healthy versus outage recovery | Same records/resources and fault length | Net drain/service rates, per-class wait, all100 records accounted for, five-minute disposition |
| One versus two Commerce replicas | Divide aggregate Commerce allocation; include31r pool factor | Peak connections≤80, retries/circuit per-instance behavior, no provider quota multiplication |

Three repeated isolated nonfinancial runs establish variability. Financial probes remain bounded and descriptive where sample count is small. Do not inject provider-load faults through excessive calls.

## Growth and next-phase gate

Track bytes/new accepted purchase, command/receipt, deferred observation, inbox/outbox and audit; retained scan bytes/calls/time, oldest review and disk growth horizon. Do not delete evidence or enlarge pools to pass an experiment.

Pass to Phase12 measured limiting resource, per-class service rates, hot-row contention, safe cache candidates and original authority constraints. Larger workload, replica count or provider volume requires a reviewed capacity envelope; Phase11 supplies evidence rather than speculative infrastructure.
