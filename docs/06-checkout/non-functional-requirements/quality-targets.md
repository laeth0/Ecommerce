# Checkout Quality Targets

**Status:** proposed future acceptance gates. No API, PostgreSQL, worker, race, load or restore measurement has been made in this documentation increment.

## Declared workload

Use the established .NET/EF Core/Npgsql/PostgreSQL 18 stack, 10,000 synthetic Customers/products and 100,000 historical Orders. Typical purchase has 1–5 lines; 20% uses 20 lines; include boundary-length text, equal creation times, expired quotes, every work/outcome state and deep retained history. Normal traffic has sufficient stock; final-unit contention/negative scenarios are separate.

Resources are application processes 2 vCPU/2 GiB in aggregate and PostgreSQL 2 vCPU/4 GiB; generator runs outside those budgets. Record storage, patches, pools, all active workers and telemetry overhead. Run 50 concurrent Customer clients with at most one in-flight request each and one-second think time. Target operation mix is 25% quote previews, 25% submissions and 50% attempt reads; quote→submit pairs use their own fresh quotes/keys and reads follow accepted attempts. Include all preparation traffic/failed attempts in reporting; do not reuse stale quotes or silently omit auxiliary work to improve the mix.

Default simulator is Success with persisted 100 ms payment/refund response delay, two-second external deadline, and Checkout worker concurrency two. Authenticate before measurement. Warm up two minutes, measure ten minutes, repeat three runs; extend until each operation class has ≥1,000 completed samples. Count original acceptances versus replays separately. Fault modes/provider behavior are separate runs, never mixed into a real-provider claim.

## Acceptance requirements

| ID | Requirement | Pass condition in every declared run |
| --- | --- | --- |
| CHK-NFR-01 | Quote preview latency | p50 ≤150 ms; p95 ≤500 ms; p99 ≤1,000 ms, including authority/canonical persistence |
| CHK-NFR-02 | Durable acceptance latency | p50 ≤250 ms; p95 ≤750 ms; p99 ≤1,500 ms, through local commit/receipt; no financial settlement included |
| CHK-NFR-03 | Current attempt read | p50 ≤100 ms; p95 ≤300 ms; p99 ≤750 ms, including authority/coherent projection |
| CHK-NFR-04 | Useful throughput/errors | ≥30 completed valid API requests/second and ≥5 new accepted purchases/second; unexpected 5xx/timeouts/capacity rejections <0.5% |
| CHK-NFR-05 | Healthy purchase convergence | From durable acceptance to confirmed or required policy outcome: p95 ≤5 seconds, p99 ≤15 seconds; background failures are counted |
| CHK-NFR-06 | Healthy cancellation/cleanup work | From committed eligible request/confirmation to permitted resolution/cleanup decision: p95 ≤5 seconds, p99 ≤15 seconds |
| CHK-NFR-07 | Database command latency | p95 ≤100 ms per normal interactive command including lock wait; report pool and aggregate transaction time separately |
| CHK-NFR-08 | Identity and acceptance integrity | Zero unauthorized ownership/source access, changed-key successful replays, duplicate accepted quote/key/order or partial local acceptance |
| CHK-NFR-09 | Purchase/financial integrity | Zero false confirmation, deadline extension, duplicate simulated financial effect, missing compensation coverage or stale-lease local application |
| CHK-NFR-10 | Cart preservation | Zero cleanup of newer cart version, clear on unconfirmed failed/cancelled attempt, or duplicate clear/version increment |
| CHK-NFR-11 | Bounded work/payload | 1–20 lines/1–100 units; quote ≤65,536 decoded UTF-8 bytes; receipt ≤1,024; AttemptView ≤4,096; exactly four work rows; discovery ≤100 |
| CHK-NFR-12 | Failure visibility | Every accepted attempt remains queryable; unknown/compensation failure resolves or reaches explicit audited ManualReview; no secret/address payload telemetry |

For each class report offered/completed counts, useful acceptances, replays/conflicts, all errors/timeouts, latency percentile method, bytes, worker queue age, lease waits/takeovers and resource use. A fast 202 followed by stranded work cannot pass convergence. Exclude deliberate invalid/stock-conflict traffic from normal latency/error denominators while reporting its totals; never reclassify unexpected rejection of eligible work. Integrity/privacy tolerates zero violations even if all timing targets pass.

## Budgets and fault gates

API admission ≤100 executing requests/replica; shared API pool maximum 20/replica, pool wait ≤1 second; lock wait ≤250 ms; statement ≤2 seconds; local transaction ≤3 seconds; request ≤10 seconds; shutdown ≤15 seconds. Checkout worker has maximum two concurrent actions/replica and a pool maximum two shared with its simulator settlement/cleanup tasks. External operation ≤2 seconds; one worker action ≤10 seconds; lease 30 seconds. No connection is held across an external wait. Count existing Identity/Inventory pools, replicas, operators/migrations/monitoring and reserve against database capacity.

Retry schedule is 1, 2, 4, 8, 16, then 30 seconds, maximum ten unsuccessful/unknown observations per cycle. With healthy scheduling a permanently unknown operation reaches visible ManualReview within five minutes; a dependency outage may delay that write, so measure recovery from restored database availability as well. Do not report retry exhaustion as financial decline. A verified new terminal fact remains admissible after escalation. Stale takeover safety is separate from timing: a crashed claim may wait up to lease expiry before becoming eligible.

Run at most 100 affected attempts for the recovery drill. After dependencies recover, ≥99% reach a permitted business outcome or explicit alerted ManualReview within five minutes. Include durable work before/after restart, pending cancellation and delayed capture beyond expiry. Inventory expiry still meets its existing eligible-work target; Checkout's retry state never extends stock. Inspect every accepted attempt and conserved stock/financial operation identity.

The shared 99.9%/30-day API objective and 100-client mixed purchase benchmark remain Phase 08 gates; 1,000/10,000/100,000-user limits are measured later. Simulator results cannot establish real provider availability/latency. Use sandbox RPO ≤24 hours/RTO ≤2 hours for the combined isolated restore drill; successful database startup alone does not establish safe purchase recovery. Phase 07 must reconcile provider truth before integrated restore admission.

## System Design Prerequisites & Concepts to Learn

Study acceptance latency versus convergence, tail latency under shared pools, independent fault denominators and queue age. Compare the declared [capacity experiments](../performance-and-scalability/capacity-and-contention.md) under fixed resources and use the [global targets](../../00-project-overview/global-definition-of-done.md) to state precisely what each result proves.
