# Capacity and Service Budgets

**Status:** initial measurement envelope. Extraction introduces network/serialization/mTLS/second-runtime overhead. No performance improvement is assumed.

## Workloads and percentile evidence

Preserve the [Phase 08 reference workload](../../08-production-ready-monolith/performance-and-scalability/baseline-and-capacity.md): 10,000 products, 100 categories, 10,000 Customers, 100,000 historical Orders; 100 virtual users, one inflight request/user and one-second think time; 65/10/10/5/5/5 Catalog/search/Cart/history/preview/submit; two-minute warm-up, ten-minute measurement, three runs, ≥1,000 observations/class. Preserve Identity quotas and normal rotating refresh during the run; count auxiliary requests/resources.

The existing isolated Development Success/100ms simulator stays in Commerce and provides the original comparable baseline. It does not exercise the extracted financial workflow. Declare that limitation and compare Phase 09/10 on identical resources/data/configuration.

Add three separate experiments:

| Experiment | Traffic/source | Evidence |
| --- | --- | --- |
| Transport/receipt initialization and closure | Ten total private commands/sec in isolated Development; original valid accepted mappings, fresh IDs, immutable descriptors, executor stopped/provider egress disabled | Three runs≥1,000 commands each; Initialize and proved never-dispatched Closure; no fabricated capture/refund facts |
| Financial read/history and replay | Authorized ordinary reads/replays over sanitized retained sandbox data; no outbound provider call | ≥1,000 observations/class/run; original cursor/authority/quota behavior; declare dataset cardinality |
| Actual payment/confirmation/refund/correction | Genuine approved Stripe sandbox objects only | ≤0.5 new payments/sec, ≤0.1 refunds/sec, ≤100 affected objects/drill; report all small-probe outcomes/sample limits |

The first experiment allows binding initialization while the dispatch gate is closed; it cannot authorize provider I/O. Drive public acceptance through original validation/quotas using enough eligible sandbox accounts or use attributed preaccepted owner data before measurement. Report acceptance/setup as separate counted work. No auth/quota bypass or production benchmark flag. Close each original root before reenabling any executor; discard the isolated database safely with egress still fenced.

Never manufacture “verified Stripe” facts for a volume target. True capture-to-confirmation handoff latency has small genuine-probe evidence here; its p95/p99 estimates are descriptive when sample size is insufficient. A later authorized adapter experiment must remain explicitly synthetic.

Measure useful completed throughput, offered rate/rejections/timeouts, complete client p50/p95/p99, RPC phases, serialization bytes, TLS handshakes/reuse, DB execution/locks/pool wait and durable convergence. Missing/slow completion remains in the denominator. Report each class/run separately.

## Resource envelope

Retain aggregate application 2 vCPU/2 GiB. Initial split: Commerce1.5 vCPU/1.5 GiB across its declared replicas; Payments0.5 vCPU/0.5 GiB, one process. Primary2 vCPU/4 GiB, broker2 vCPU/2 GiB with declared10GiB volume, separate Phase 08 observability4 vCPU/4 GiB budget and external generator. Declare edge, host and storage contention; these are allocations to measure, not proven sufficient limits.

If two Commerce replicas are used, divide Commerce aggregate allocation rather than doubling it. Payments independent release is demonstrated with one instance; API replicas for Payments are deferred until its pool/executor/resource budget is reviewed. Provider executor remains one per account in every topology.

## Complete PostgreSQL budget

`r` is enabled Commerce replica count, including each listed worker. Use one configured API pool per service, with bounded dedicated worker pools; aliases/per-module factories cannot create additional pools.

| Pool/process | Maximum connections |
| --- | ---: |
| Commerce API, including private decision endpoint | 20r |
| Commerce Identity cleanup | 2r |
| Commerce Inventory expiry | 2r |
| Commerce Checkout/commands/hold resolution/simulator/quote cleanup | 2r |
| Commerce Orders relay | 1r |
| Commerce Notifications intake/delivery | 2r |
| Commerce financial-hint intake | 2r |
| Payments API, including private reads/commands/raw callback ingress | 3 total |
| Payments exclusive executor/inbox application/hold finalization/decision reconciliation/scan | 2 total |
| Payments both-outbox relay | 1 total |
| Primary monitoring | 2 total |
| Migration authority, serial across databases | 1 total |
| Protected operator inspection | 4 total |
| Paired backup: two coordinators plus two serial dumps | 4 total |

Total **31r+17: 48 at r=1, 79 at r=2**. At r=3,110 exceeds ordinary80 and is prohibited in this envelope. Both backups count even when the application is busy. Initial max_connections100 reserves17 non-superuser and3 superuser slots; ordinary runtime/monitor/backup cannot use them. Record actually enabled processes/pools and peak server connections. Restore jobs run against an isolated target with separately declared bounds; do not silently add them to the active primary.

Keep pool wait1s, row-lock250ms, DB command2s, local transaction3s, public request10s, private RPC2s, worker action10s, lease30s, drain15s. Health probes reuse their service pool/deadline. Every HTTP/Stripe/broker call releases DB connections first.

## Admission, connection reuse and fairness

Commerce retains≤100 executing public requests/replica. Each replica permits≤4 inflight Payments RPCs: two coordinator/command and two public financial-read slots, bounded no-wait overload rejection. Payments permits≤32 executing HTTP requests total, without an unbounded wait queue; its API pool3 imposes additional pool deadlines. Reserve bounded webhook processing capacity through a fair scheduler (maximum8 concurrent callback handlers within32); oversized body rejection occurs before expensive parsing. Do not guarantee webhook200 when its durable inbox cannot commit.

Payments-to-Commerce decision queries use≤2 concurrent slots within existing executor actions; they are private recovery calls, never nested under a Commerce→Payments RPC. HTTP connections are reused to explicit private hosts with bounded lifetime consistent with certificate rotation/DNS policy. Limit response buffering by schema budgets. No N+1 RPC loop for Order lists; existing Order lists do not enrich each row with remote financial state.

Existing Checkout two action slots share purchase/cancellation/compensation/cart cleanup/command/decision work. Each scheduler turn selects a bounded class and persisted continuation; cap one pass at20 due command/hint-transfer candidates and claim only available slots. Payments existing two executor slots share dispatch, verification, deferred application, decision query and retained scan. Add no hidden unbounded queue or third executor.

The one-second poll is idle discovery, not a ceiling of two completed actions/sec. While eligible due work exists, a freed slot advances the next candidate within the bounded pass; an active wake yields after its candidate budget or ten seconds. One attempt can advance through several known eligible steps within its ten-second action, committing/releasing each owner before the next RPC. Unknown/waiting work stops at its persisted due time; immediate continuation cannot bypass backoff, claim/token fencing or observation budgets. Measure whether actual service rate exceeds arrival rate rather than assuming two slots suffice.

Financial deferred effects process≤20/pass; inbox/outbox due queries use indexed keysets. Duplicate hint/admission paths do not reset work. Keep ten observations/cycle and existing capped backoff; retries consume original outer deadlines.

## Provider and retained-growth constraints

All Stripe calls, including recovery/operator probes/retained scan, share5/sec, burst2, concurrency2 and2s calls. Actual achievable service rate may be lower: two two-second calls sustain only one call/sec. Compute retrieval amplification and 24-hour full-scan coverage before admitting dataset growth. Refund/cancellation work must have fair turns; old retained ManualReview objects cannot disappear from the scan.

Retain outbox/inbox/receipts/commands/decisions/financial evidence. Declare bytes/new purchase, bytes/observation, oldest unresolved age and projected disk horizon at actual arrival/service rates. Alert ordinary authoritative volumes at70% used or projected exhaustion<24h; close new admission at85% or exhaustion<6h through attributed existing gates while preserving resolution reserve. Broker/outbox growth shares Phase 09 gates; measure quorum/WAL/diagnostic overhead.

No cache/read replica/partition/sharding is introduced. The [Phase 08 cache evidence gate](../../08-production-ready-monolith/performance-and-scalability/baseline-and-capacity.md#cache-admission-gate) remains. Future safe reads can be accelerated after measured justification; stock/prices/financial/Identity permissions stay authoritative.

## Learning exit

Explain why two services on one server can improve credential/process isolation while retaining shared capacity/failure risk; why a 202 lowers apparent latency without proving convergence; and why a larger pool can worsen primary contention. Present bottleneck profiles, per-class SLIs, fair recovery service rates and an ADR for any later budget increase.
