# Orders Quality Targets

**Status:** proposed future acceptance targets. No application, PostgreSQL, concurrency, load or restore result has been measured in this documentation increment.

## Workload and measurement

Use the existing .NET/EF Core/Npgsql/PostgreSQL 18 stack with 10,000 synthetic Customers, 10,000 products and 100,000 historical orders. Typical orders have 1–5 lines; 20% of detail samples use 20-line orders. Include empty-history Customers, a Customer with 20,000 orders, creation-time ties, every business state, requested cancellations and near-bound text. Record distribution, indexes/statistics and source-evidence simulation. Do not seed historical snapshots by joining current prices during measurement.

Resources: application processes 2 vCPU/2 GiB in aggregate; PostgreSQL 2 vCPU/4 GiB; generator outside both. Record patches, storage, pools, active Inventory expiry worker and telemetry overhead. Warm up two minutes, measure ten minutes and repeat three runs. Authenticate before measurement. Normal read workload uses 50 concurrent clients, one in-flight request each, one-second think time: 50% Customer history, 35% Customer detail, 10% Admin queues and 5% Admin detail including access-audit commit. At least half of paged reads use later cursors; report deep-history/max-line and empty results separately.

Human mutation measurement is a separate two-effective-commands/second workload against different prepared orders, with valid versions, eligible Admin sources and required audit. Mix StartProcessing/Ship/Deliver and first Customer/Admin cancellation requests evenly; prepare new eligible records so normal measurement is not predominantly invalid/no-op traffic. Internal creation/confirmation/resolution is measured separately using tagged isolated evidence until Phases 06–07 provide real owners. Record simulator limits and never combine simulated outcomes with a provider correctness claim.

## Acceptance requirements

| ID | Requirement | Pass condition in each declared run |
| --- | --- | --- |
| ORD-NFR-01 | Customer history/detail and Admin queue/detail | p50 ≤100 ms, p95 ≤300 ms, p99 ≤750 ms, including authority, snapshots and required access audit |
| ORD-NFR-02 | Human mutation acknowledgement | p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms at two effective commands/second, including transition audit/commit |
| ORD-NFR-03 | Useful read throughput | ≥30 successful reads/second under declared read mix and resources |
| ORD-NFR-04 | Unexpected errors/timeouts | <0.5% of valid normal attempts; count unexpected 5xx/timeouts/capacity rejection, report deliberate conflicts separately |
| ORD-NFR-05 | Database commands | p95 ≤100 ms per normal interactive command including execution/lock wait; report pool wait and complete transaction time separately |
| ORD-NFR-06 | Snapshot integrity | Zero mutable historical facts, wrong cents/sum/count, duplicate intent/reservation orders or partial parent/line/audit commits |
| ORD-NFR-07 | Lifecycle integrity | Zero confirmation without verified full capture/Consumed stock, illegal transitions, post-request processing, or cancellation/processing double success |
| ORD-NFR-08 | Ownership/privacy | Zero successful unauthorized access, cross-actor cursor acceptance, address/line summary leakage or credentials/address telemetry |
| ORD-NFR-09 | Bounded work | Page ≤50 summaries/fetch ≤51; detail ≤20 lines/fetch ≤21; pending-cancellation scan ≤100; detail ≤65,536 decoded bytes/page ≤131,072/receipt ≤1,024 |
| ORD-NFR-10 | Failure and recovery | Bounded failure within ten seconds, no invented local/external success, durable cancellation after restart and safe isolated restore |

Each reported operation class needs at least 1,000 completed samples per run; extend measurement when Admin detail or a specific mutation class is undersampled, and record the real window. Report each class separately, offered/completed attempts, response bytes, all errors/timeouts and percentile method. A low latency among a few successful responses cannot hide an error/throughput failure. Read no-op/empty/max-line cases are identified, and effective mutations are distinct from rejection/replay. Integrity/security have zero tolerance even if latency passes.

## Concurrency, availability and integration gates

Run cancellation versus processing/confirmation, duplicate creation, expiry versus confirmation and audit-write failure as separate controlled scenarios. With one expected version, only one incompatible effective human command may win; losers have no change. A requested cancellation still blocks processing after the Admin deliberately reloads the new version. Known financial capture remains recorded at Payments even if local confirmation fails. Inventory and Orders effects in a shared transaction commit together or roll back together.

The 99.9%/30-day operating objective, 100-user mixed purchase workload and sustained recovery/convergence SLIs remain later gates. This phase claims no availability observation or provider correctness. Database failure prevents authoritative orders; liveness can stay healthy while readiness fails. Current Catalog unavailability does not block historical reads or human fulfillment/cancellation request, because snapshots are local. Purchase resolution still needs its financial/stock owners.

Use the shared sandbox RPO ≤24 hours/RTO ≤2 hours for an isolated combined restore drill. Revoke restored sessions and check Orders snapshots/transitions plus existing Inventory reconciliation. Before reopening purchase/fulfillment following a financial restore, Phase 07 must reconcile provider truth and quarantine mismatches; row constraints alone cannot prove financial safety. Cancellation recovery speed/refund settlement are specified by the coordinator/payment phases, not fabricated by an Orders worker.

## System Design Prerequisites & Concepts to Learn

Study keyset index behavior, tail latency under shared pools, sparse sample classes and audit I/O. Hold resources/distribution fixed, compare ordinary versus deep history and one versus 20 lines, then reproduce a hot-order race. Use the [performance plan](../performance-and-scalability/history-and-contention.md) and [global targets](../../00-project-overview/global-definition-of-done.md) to explain what each measurement establishes.
