# Payments Performance, Capacity and Provider Budgets

**Status:** proposed access paths, budgets and measured scaling triggers. No throughput/capacity result is asserted.

## Access paths and the problem each solves

| Operation | Mechanism and bound | Benefit, cost and evidence |
| --- | --- | --- |
| Order financial read | Unique binding Order lookup, one intent/work/case primary projection | Constant-size view; no provider calls or refund-history hydration; record plans/rows/bytes |
| Accepted Admin key replay | Unique actor/key receipt + exact canonical comparison | Permanent binding defeats multi-replica duplicates; storage/reason retention cost |
| Refund history | Composite payment/createdAt/id descending B-tree,limit+1≤51 | Deep history avoids OFFSET; independently changing states require refresh |
| New refund | Parent payment lock + O(1) persisted balance counters | Prevents aggregate write skew; same-payment mutations serialize |
| Full compensation | Parent lock, unique case, existing counters and one uncovered allocation | No unbounded SUM or all-refund hydration in hot path; aggregate correctness needs invariant scans |
| Provider observation | Unique object/effect mapping, selected refund/fact | Callback/API duplicates do not repeat money; unmatched external effects need quarantine |
| Work/inbox due discovery | Partial due B-trees,SKIP LOCKED,≤100claims/pass | Bounded polling; index churn/vacuum and starvation monitoring remain |
| Retained reconciliation | Scan-due index and persisted cursor,≤100page/pass | Survives restart and detects callback loss; consumes quota and has explicit lag |
| Wake repair | Partial wake_pending index and version-conditional acknowledgement | Lost in-memory wake cannot strand a fact; at-least-once wake/replay cost |

Obtain `EXPLAIN (ANALYZE, BUFFERS)` for every row above on declared synthetic data, including deep history and due-work bursts. Report estimated/actual rows, buffers, index choice, sort and command/lock/pool duration. ANALYZE executes mutations, so use isolated data. Capture autovacuum cadence/dead tuples/index size and oldest work age. [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html)

## Account-wide external budget

Stripe documents account/endpoint limits and advises against sandbox load testing. Initial **project** budget is5requests/sec,burst2,concurrency2 shared across create, cancel, retrieve, list and refund. This includes provider reconciliation and operator probes; a second tool/process does not receive an independent quota. The configured allowance can only decrease without a reviewed capacity change. [Stripe rate limits](https://docs.stripe.com/rate-limits)

One enabled outbound Payments executor owns the runtime account budget initially. Other API/Checkout replicas persist instructions and return knowledge, then wake the executor; they do not perform inline provider calls. Planned failover/rollout quiesces the old executor and its≤2s calls before enabling the replacement. Automated overlapping executors require a primary-backed shared token bucket and leased call-slot protocol or another proven account-wide limiter before enablement; process-local counters across replicas are insufficient. No Redis dependency is justified for the single-executor baseline.

Within the executor, a fair scheduler alternates closure/unknown capture, compensation, Admin refunds, callback inspection and retained scans, using at mostone eligible action from each class per turn before repeating. Each turn obeys global permits; no class may take an unbounded pass. Reserve at leastone eligible scheduling opportunity per second for closure/compensation when present, subject to the5rps budget. Healthy due-age alerts identify insufficient service rate. Do not send rate-limited calls just to satisfy a due-age target.

All provider calls are cancellable and deadline-bounded; no DB connection is retained. An external429 uses original key and persisted next due time; bounded Retry-After, if supplied, is honored without an in-process sleep holding an action slot. Network/5xx use bounded backoff. After ten unsuccessful observations enter ManualReview. Account5xx/429 trends close new purchase admission before durable work grows without bound; existing facts/receipts remain readable.

## Sustainable throughput model

For admitted rate λpay purchases/sec, λrefund refunds/sec and scan rate λscan, estimate external demand as:

`λexternal = λpay × meanCallsPerPayment + λrefund × meanCallsPerRefund + λscan + λrecovery`.

Measure every create/retrieve/charge/list/cancel/refund call, including duplicate hints and operator traffic. New purchase acceptance can be much faster than provider settlement. More API replicas do not increase one account's quota. Service capacity is also bounded by `actionSlots / meanCallDuration`; with 2slots and2s timeouts, sustained timeout service is at most1call/sec before transaction overhead.

Reference small actual-provider probe admits≤0.5payments/sec and≤0.1refunds/sec only when the measured call amplification and latency leave recovery/scan headroom. This is a maximum input allowance, not an automatic sustainable promise. Reduce admission if queue age or actual calls exceed budgets. The≥5new accepted purchases/sec simulator gate from Phase06 remains a local-source result and cannot be claimed for Stripe. Phase08 mixed100-client runs must report their source and every quote/preparation call separately.

Define the maximum admitted retained-financial dataset from observed24h scan capacity. At100,000 retained actual provider objects, at least 1.16simple object inspections/sec would be needed before extra charge/refund pages; check that against actual slot/quota demand. Synthetic100,000-row plan tests do not prove external scan capacity. If the cycle cannot complete, reduce new admission, increase a reviewed budget with provider approval/evidence, or change the scan strategy in a later phase. Do not declare a24h gate passed from a small sample.

## Hot payments, callbacks and pools

One payment is the correct serialization boundary for refund balances. Requests against many payments can proceed concurrently;100requests against one payment must serialize/reject stale versions. A distributed lock/cache cannot remove this invariant. Do not hold Order/stock locks while Stripe waits. Payment-first financial application and child-only committed claims prevent work/refund lock inversion.

Callback body 262,144bytes×20executing callback admissions is a maximum raw-body buffering envelope of5MiB before framework/parser overhead. Reuse existing global admission100/replica and shared API pool 20; do not allocate another unbounded callback pool/channel. At webhook ingress, provider callbacks need only a small primary transaction; downstream provider work stays in durable rows. A database outage returns503 and lets the sender retry; memory is never a durable fallback.

Payments worker DB poolmaximum2/actionslots2 for the active executor. Inbox/wake/scan/financial work share bounded passes. Count existing Identity/Inventory/Checkout workers and all API replicas before changing database connections. Total request CPU/memory, JSON parse allocation, signature verification time, pool wait, lock wait, provider slot occupancy and queue lag must be included in measurements.

## Performance and failure experiments

1. Compare FinancialView, first refund acceptance, exact replay and deep history at limit 20/50. Include Admin audit and reason normalization; prove response/query bounds.
2. Race100refund instructions against one payment versus100distinct payments. Count accepted unique instructions, stale versions, balance conservation and lock timeout; separate expected conflicts from failures.
3. Race partial refund/compensation/failure reversal. Inspect parent-lock order and aggregate counters; no unlocked history sum or per-refund N+1 read is permitted.
4. Send identical signed callback hints repeatedly, then distinct events for one object. Compare hint/fact counts, rate permits, parse CPU and total outbound amplification.
5. Slow provider calls to 2s, exhaust slots, pause executor and add due work. Verify retail reads/receipts stay local and pool connections return during I/O; report lag/ManualReview timing.
6. Scale API fromone totwo replicas under the same aggregate hardware; keepone outbound executor. Show improved distinct-request throughput only when measured, with no multiplied account budget.
7. Grow due/retained records towardone million only in a declared later local dataset. Measure partial-index churn, vacuum and24h scan headroom before proposing partitioning/a broker.

## Evolution gates

- **100 concurrent clients:** Phase08 repeats mixed commerce traffic and resource/failure isolation with actual source labels.
- **1,000/10,000 clients:** Phase12 measures connection demand, hot-payment distribution, quote/payment admission and provider quota. A queue can smooth bursts but cannot increase settlement service rate.
- **100,000+ users:** distinguish registered users from active concurrent purchases. Evaluate scan/storage/account/service isolation from measured workload before service extraction or partitioning.
- **Cache/read replica:** only sanitized nonauthoritative historical projections are candidates later. Refund admission/proofs/current financial version remain on primary.
- **Broker/outbox:** justified when independently deployed consumers or measured durable-row throughput/availability require it. Preserve inbox/fact idempotency; broker delivery is not financial truth.
- **Service extraction:** justified by credential/failure isolation, team ownership or independent measured scaling. Caller transactions must be replaced explicitly; no current local FK/lock is a distributed guarantee.

## System Design Prerequisites & Concepts to Learn

Study queue stability, Little's Law, rate versus concurrency limiting, head-of-line blocking and pool saturation. Reproduce each experiment under fixed resources and compare useful completed outcomes/lag, not only202RPS. [Quality targets](../non-functional-requirements/quality-targets.md) define the pass conditions.
