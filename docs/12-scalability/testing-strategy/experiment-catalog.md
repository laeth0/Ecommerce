# Scalability Learning Experiment Catalog

**Status:** future manual/measurement designs. No tests, fixtures, scripts, load tool, new dependency or infrastructure are created/executed here.

## Common controls

Use an isolated Development/private sandbox target with explicit approved source/account/mode, compatible releases/schema/policy fingerprints, actual host resources, original gates/epochs/grants and protected evidence access.

Record hypothesis, input/model/mix, data distribution, expected useful result, one changed variable, operator/reviewer, abort/reversal and cleanup. Healthy HTTP runs use 2m warm-up+10m measurement, three runs and ≥ 1,000/class; extend only within the declared finite plan. No fault facility exists by assumption.

Provider egress/executor is fenced for simulator/transport/data-copy experiments. Genuine financial probes remain ≤ 100 objects/0.5 new payments/sec/0.1 refunds/sec with all calls ≤ 5/sec/burst 2/concurrency 2 and original identities.

Abort immediately on unsafe identity/source/account, financial/stock/authority violation, second executor, lost original history/audit, exceeded pool/storage gates or scope outside isolation. Stop new offered work and unsafe dispatch; preserve accepted work and original uncertainty. Reversal removes the injected/experimental condition, not a financial hold or original receipt.

## SCL-X01 — Baseline and controlled user progression

**Learn:** reference/closed versus paced arrival, useful throughput versus users.
**Setup:** D0 and original 100-user reference; then 250/500/1,000 rosters with approved 90/120/150RPS offers and normal sources/auth.
**Action:** three runs/tier, one variable at a time; count every core/auxiliary/drop/timeout, per-class samples and accepted-work disposition.
**Proof:** original latency/useful-rate/failure goals and no required debt growth; actual executing concurrency separate from roster size. Failed tier retains limiting resource and cannot trigger an unapproved resource/quota edit.
**Cleanup:** stop offered work, reconcile originals, close/prove undispatched transport roots where applicable, pace logout and retain full report.

## SCL-X02 — One/two replicas, quotas and overload

**Learn:** local versus global admission and shared-resource coupling.
**Setup:** same D0/mix/aggregate resource profile; 48/79 connection inventory and current identity/cursor keys.
**Action:** compare r=1/2; exercise minute-boundary burst and bounded 200/400RPS offered stress ≤ 30s separately from healthy tiers.
**Proof:** shared global/source/actor allowance, fixed counters, no third overlapping full process, bounded rejection/pool/tasks, all valid failures reported.
**Cleanup:** return to reviewed baseline instance count; original work and counters remain. No reset of quotas/signing key to improve a result.

## SCL-X03 — Query/data/maintenance progression

**Learn:** selectivity, GIN sort, keysets, statistics and write costs.
**Setup:** D0/D1 on isolated valid owner data; heavy 20k-Order Customer, descriptions/skew/ties and broad/rare/empty lexical search.
**Action:** same Reference100 first, then representative EXPLAIN/maintenance comparison and one reviewed query/index/statistics change. Write EXPLAIN uses known local rollback, never provider I/O.
**Proof:** identical permitted response/visibility/order, examined rows/buffers/estimates/planning/sort/pool/lock/WAL, full baseline and ≤ 10% write regression unless approved.
**Cleanup:** verify index validity/grants and compatible rollback; retain failed plans. D2 remains conditional if disk/backup/host cannot support it.

## SCL-X04 — Last unit, multi-product locks and hot counters

**Learn:** serialized invariant capacity versus more contenders.
**Setup:** authorized stock 1/10,100 valid Customers/quotes/keys, isolated simulator, one/two replicas.
**Action:** bounded simultaneous last-unit/batch/20-line hot cart waves; same-key/changed-body/cart-version/price/category races; shared counter contention.
**Proof:** exact groups/movements/receipts/Order counts/conservation, sorted locks, no duplicate or partial acceptance, normal domain errors and finite lock wait.
**Cleanup:** actual Consume/Release/Expire through owner rules; no blind restock/truncate. Real deadline branch uses actual near-expiry reservation, not modified clock.

## SCL-X05 — Event multiplicity, backlog and worker scaling

**Learn:** publication/sink service and net drain; competing-consumer ordering.
**Setup:** original valid lifecycle events on isolated owner state; declared two worker topology/resources. Synthetic financial shape data, if separately reviewed, stays transport-only and never reaches financial owners.
**Action:** original 10 distinct events/sec healthy run, larger measured accepted mutation workload, ≤ 1,000 distinct backlog, two-minute broker/consumer interruption, duplicate/ack/confirm/reorder cases.
**Proof:** actual required events/mutation/repeats, ≥ 20 local receipts/sec target, frozen identity/bytes/sink effect once, five-minute disposition and backlog service/debt. Preserve hint prefetch 20/two slots versus notification prefetch 10/one intake.
**Cleanup:** original canonical inspection and attributed resume/parking resolution; no queue/history deletion to declare success.

## SCL-X06 — Conditional cache benefit and failure

**Entry:** full cache gate, concrete prototype/resources/security plan approved; otherwise Not run.
**Learn:** compulsory primary guard, cache-aside, old fill race, stampede, bounded fallback.
**Action:** warm/cold comparison, hide/deactivate/price/name update without unsafe stale permission, slow old fill, mass TTL expiry, Redis outage, corrupted key/MAC/schema, primary outage and old restore namespace.
**Proof:** exact permitted snapshot/zero stale control, actual ≥ 2× primary-read benefit including guards or rejected proposal; ≤ 20ms calls/90s TTL/16KiB entries, bounded memory/fills/fallback, no sensitive content.
**Cleanup:** disable to bounded primary, discard derived namespace. Do not activate a failed/unjustified cache.

## SCL-X07 — Conditional standby replay and conflicts

**Entry:** read-volume/gate/security/pool/WAL/rebuild plan approved; otherwise Not run.
**Learn:** receive/flush/replay positions, fresh snapshot after fence and primary current authority.
**Action:** protected immutable read comparison; pause replay/network, open a stale snapshot before fence for negative case, induce bounded read conflict, test wrong source/timeline/epoch and primary outage.
**Proof:** current primary authority, correct conservative fence before read snapshot, immutable fingerprint, bounded fallback; no current control/public route/promotion; all primary/standby sessions/WAL retained counted.
**Cleanup:** disable optional routing, reviewed slot/rebuild procedure if necessary; restore primary capacity and original grants.

## SCL-X08 — Conditional partition benefit and uniqueness

**Entry:** table/layout/gate/constraints/resources/migration plan approved; otherwise Not run.
**Learn:** pruning, global identity, partition planning/maintenance and one-writer cutover.
**Action:** isolated unpartitioned versus four hash-line partitions at D0/D1; detail/joins/write/vacuum/backup; deliberate duplicate PK/FK and missing destination in disposable copy; analyze unsafe time-ID proposal.
**Proof:** unchanged original composite PK/FK/check/collation semantics, actual pruning/cost gain, no global identity weakening or old-data deletion, bounded planning/write/restore cost.
**Cleanup:** disposable copy only; no active table replacement without concrete authorized adoption. Record failed/rejected proposal.

## SCL-X09 — Scaling under distributed faults

**Learn:** capacity claims include accepted-work safety and retry amplification.
**Setup:** declared healthy tier plus ≤ 100 affected original attempts; original breaker/jitter/cycle/profile and provider bounds.
**Action:** existing Phase 11 bounded private directional partition/slow RPC/stale worker/forced shutdown; no new fault platform or handler test hook.
**Proof:** unrelated paths stay bounded, original keys/R/holds/stock deadlines, ten observations/300s cycle, fair turn ≤ 30s, review separate from useful settlement; no callback/financial evidence fabricated.
**Cleanup:** reverse link/process fault, fence unsafe old process/egress, current owner original receipt/evidence recovery and contained unresolved scopes.

## SCL-X10 — Retained volume, disk, scan and backup

**Learn:** data capacity, maintenance interference and recovery economics.
**Setup:** declared D0/D1 and actual genuine provider population separate; authenticated paired recovery access and disk headroom.
**Action:** normal maintenance/paired backup while healthy mix runs; compute measured bytes/object/WAL/cold-history/scan amplification; controlled safe volume pressure in isolated environment only.
**Proof:** full scan ≤ 24h under one account budget, original storage gates/reserve, paired job ≤ 30m/skew ≤ 60s/RPO ≤ 24h; no evidence deletion or hidden source objects.
**Cleanup:** remove experimental nonauthoritative pressure, verify archives/grants/accepted state; unsupported growth stays rejected.

## SCL-X11 — Compatible adoption, rollback and integrated restore

**Learn:** application rollback is not rewinding accepted history; derived copies cannot prove restored money.
**Setup:** complete isolated owner pair and reviewed candidate implementation if any; restore target resource plan and fenced old executor.
**Action:** quiesce/copy/validate one-writer migration; compatible rollback after new retained writes; paired-v3 asymmetric restore/provider gap and old cache/standby namespace negative case.
**Proof:** counts/digests/PK/FK/audit/grants/windows/due/epoch unchanged, no stale source/duplicate executor/fabricated Consume, safe reopen ≤ 2h with real gap inventory.
**Cleanup:** keep unresolved authority/provider/source/history blockers contained; discard only isolated disposable prototypes with egress fenced.

## Evidence format

Each experiment links original plan/run/proposal ID, actual release/schema/data/resource/policy fingerprints, operator/time/input/fault/reversal, all counts/latency/bytes/CPU/locks/pools/WAL/lag/backup, original proof references and cleanup/reopen result.

Record Passed/Failed/Not run/Analytical per branch. Keep aborted runs and limits. Plots/plans, a 202, a cache hit, a broker confirm, a ready replica or completed dump alone cannot pass.
