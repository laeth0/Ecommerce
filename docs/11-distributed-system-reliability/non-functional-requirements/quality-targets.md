# Distributed Reliability Quality Targets

**Status:** measurable implementation gates. These are targets, not measured results. Phase 07/08/09/10 targets remain binding; fault windows and deliberate invalid traffic must be declared separately.

| ID | Requirement and target | Required evidence |
| --- | --- | --- |
| REL-NFR-01 | Zero duplicate ordinary financial effects, oversell, unbacked confirmation or fabricated restored proof | Original owner/provider/Inventory/decision inventory at all crash boundaries |
| REL-NFR-02 | Zero unauthorized new public/owner operations; original approved durable Admin intent retains its agreed completion semantics | Fresh authority, service role, revocation, replay and audit-failure scenarios |
| REL-NFR-03 | Every durable acknowledgement maps to exact original committed owner intent/receipt; no success from a timeout/default | Before/after commit response-loss traces and protected receipt comparison |
| REL-NFR-04 | One terminal decision/consume at most and one original release identity; unknown hold never expires | Acquisition/decision/barrier/release crash and race evidence |
| REL-NFR-05 | ≤10 charged observations/attempts per cycle, new backoff1..30s with exact attempt-specific bounds; one committed draw | Counter/due/profile inventory, restart, legacy activation and boundary examples |
| REL-NFR-06 | Active cycle≤300s before exhaustion; no dispatch after deadline; known truth still safely applicable | Primary-clock sweep and active lease evidence; reclaim overhead reported separately |
| REL-NFR-07 | At ≤100 affected attempts, ≥99% legitimate terminal or explicitly alerted ManualReview within 5m after dependency recovery | Offered/unfinished/terminal/review denominators; review never counted as purchase success |
| REL-NFR-08 | Complete public/private/action/provider/database/lease/shutdown bounds from transport policy | Call phases, cancellations, pool wait and stale result evidence |
| REL-NFR-09 | Unrelated Commerce classes retain inherited healthy targets during a Payments-only outage and p95 regression≤10% | Same Phase 10 public mix/resources before/during/after, failures included |
| REL-NFR-10 | Healthy public Catalog/detail/history p50≤100ms/p95≤300ms/p99≤750ms; search/Cart/preview150/500/1000ms; acceptance250/750/1500ms | Inherited complete reference workload; ≥1,000/class/run, three runs |
| REL-NFR-11 | Healthy useful throughput≥50req/s, unexpected eligible failures<0.5%, interactive DB command p95≤100ms | Full mix/quotas/CPU/memory/locks/pool data; no sustained required-work backlog |
| REL-NFR-12 | Healthy private commands and financial reads p50≤100ms/p95≤300ms/p99≤750ms under Phase 10 declared experiments | ≥1,000/class/run; commands≤10/sec isolated with executor/egress disabled |
| REL-NFR-13 | Healthy genuine capture→handoff resolution/release p95≤5s/p99≤15s; accepted→remote binding5s/15s | Genuine sandbox sample count/limits; no fabricated verified facts or large-load claim |
| REL-NFR-14 | Private breaker exactly three fixed classes; thresholds/cooldown/half-open and error classes as specified; zero hidden retries/hedges | Effective handler/library configuration and actual request counts |
| REL-NFR-15 | During sustained eligible failure above threshold, ≥80% fewer actual failing RPCs after opening than matched breaker-disabled baseline | Same durable input, 60s comparison window after opening; local rejects/deferrals/attempts recorded |
| REL-NFR-16 | Open-breaker/saturated-read fault cannot consume command slots or create an unbounded wait/task queue | Four RPC slots/replica, queue/heap/active-request measurements |
| REL-NFR-17 | Eligible nonblocked recovery classes get a scheduler turn within30s during declared outage recovery; healthy due work p95≤5s/p99≤15s | Per-class oldest eligible wait, slot use and persisted continuation; blocked work disclosed |
| REL-NFR-18 | Provider calls≤5/sec/burst2/concurrency2, one account executor, no SDK auto retry; full retained scan≤24h | Aggregate calls incl reads/probes/scan, rate windows, executor/egress proof |
| REL-NFR-19 | Ordinary DB pool plan≤80; 48/79 at one/two Commerce replicas; no additional recovery/breaker pools | Effective process/pool inventory plus peak sessions and reservation grants |
| REL-NFR-20 | Aggregate app≤2CPU/2GiB in original split; instrumented p95 latency and CPU regression≤10% | Paired workload runs with same resources; diagnostic queue/drop/series inventory |
| REL-NFR-21 | Integrity, stale epoch, second executor, unresolved hold>30s, review, quarantine/parking alert≤60s while monitoring is available | Condition timestamp→observable alert/ack evidence; monitoring gaps disclosed |
| REL-NFR-22 | ≤10,000 active application metric series total, finite labels; no forbidden sensitive telemetry/events | Sanitized series/export/log/trace review and cardinality stress |
| REL-NFR-23 | Current authorized original-work resume is atomic with receipt/audit; stale version/active lease/changed actor/request rejected | Owner transaction/rollback/replay evidence; zero arbitrary state editing |
| REL-NFR-24 | Independent compatible service releases and scheduling overlay preserve retained v1 bytes/receipts and committed due times | Reader/writer/rollback matrix and before/after digest inventory |
| REL-NFR-25 | Paired-v3 snapshots every12h, completion≤30m/skew≤60s; authenticated off-host copies; RPO≤24h/RTO≤2h including reconciliation | Timed actual integrated restore, provider gap and safe capability reopening |
| REL-NFR-26 | No automatic deletion of original financial/command/decision/event/operation evidence; disk warning70% or<24h horizon, containment85% or<6h | Growth projection, owner inventories and safe resolution reserve |
| REL-NFR-27 | Fault experiments isolated, attributed, bounded and reversed; zero unapproved live effect or fabricated Stripe fact | Precondition/abort/cleanup/evidence review for each experiment |
| REL-NFR-28 | Retain99.9% rolling30-day critical API objective; distributed convergence measured separately | Hosted rolling evidence required later; short sandbox drills cannot prove an SLA |

## How to measure honestly

Use complete client duration, including failures, admission/pool/lock/network/serialization and response buffering. Do not average class/run percentiles. For timed-out requests report configured bound, actual duration, unresolved result and whether owner commit was later found.

For workflow SLIs use original owner primary commit timestamps and exact accepted identity. Cross-owner clocks require declared synchronization/uncertainty; calculate intervals from trusted evidence and report ambiguous/negative durations as clock-quality failures. Count accepted→confirmed, confirmed→released, cancellation→safe disposition, coverage→settlement and notification delivery separately.

Every accepted record enters the denominator until accounted for. Report legitimate terminal, ManualReview, quarantine, Pending/Unknown, oldest age and telemetry gaps. A 202, deferred-control receipt or broker confirm cannot be counted as financial convergence.

Retry wait math is not a measured recovery SLO. Queueing, action execution, primary outage, provider rate gates and expired lease reclaim add delay. A deadline violation affects liveness/operations; it never relaxes financial safety.

Synthetic simulator, isolated private transport and genuine-provider outcomes need separate labels in evidence reports. Insufficient samples are descriptive only; preserve inherited capacity gates as Not run where genuine-provider volume cannot safely establish them. This phase does not weaken PAY-NFR acceptance/refund/callback targets.
