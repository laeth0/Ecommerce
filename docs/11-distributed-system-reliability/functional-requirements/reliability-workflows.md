# Functional Reliability Requirements

**Actors:** Customer, restricted Admin, authenticated operator, Commerce coordinator, Payments executor, relay/intake/sink workers. Workload identity authorizes a service operation; it does not establish a human role. All monetary values remain integer USD cents.

## REL-FR-01 — Recover a lost command result

**Actor/trigger:** durable sender observes timeout/reset/5xx after an accepted immutable command could have reached its owner.
**Preconditions:** original request bytes/digest, command ID, accepted mapping/authority and current deployment epoch are retained.
**Flow:** release HTTP resources; persist Unknown and bounded next due; on an eligible turn query the original receipt or send the original command; authenticate the owner result; recheck exact mapping and apply under current local token/version.
**Rules:** no replacement payment/refund/provider key; no assumed rejection; receipt replay precedes new financial guards at the owner but follows workload/epoch validation.
**Validation/errors:** changed bytes/actor mapping conflict; missing restored receipt/binding is integrity uncertainty; unavailable dependency keeps Unknown until finite review.
**Result/consistency:** one known local projection of the original owner receipt, or alerted ManualReview. Remote admission and local projection are separate commits.
**Edge/authorization:** response arrives after lease loss; discard stale local application and let current work read original truth. Approved pre-revocation Admin intent can complete; each new public request/replay still requires current human authority.

## REL-FR-02 — Bound and disperse retry work

**Actor/trigger:** owner worker schedules another unsuccessful observation or transport attempt.
**Preconditions:** nonterminal eligible original work; remaining cycle/attempt/business deadline budget.
**Flow:** charge the claim before I/O; classify actual response; atomically store one jitter draw/profile/due time with the outcome; retry only after due.
**Rules:** ten claimed observations/attempts per cycle; five-minute cycle deadline; 30-second maximum new backoff; restart, duplicate intake and unchanged owner facts never reset it.
**Validation/errors:** invalid profile/version/delay prevents activation; unexpired active lease blocks intervention; expired cycle enters review without new dispatch.
**Result/consistency:** committed schedule survives restart/restore; finite review remains visible with original coverage/hold intact.
**Edge/authorization:** breaker/slot deferral before claim has no network charge but keeps its deadline. A committed claim is never refunded. Only proved new eligible owner evidence or attributed allowed resume can start a new cycle. [Policy](../reliability-and-failure-scenarios/retry-timeout-and-breaker-policy.md).

## REL-FR-03 — Isolate an unavailable private RPC class

**Actor/trigger:** private client observes enough classified peer failures.
**Preconditions:** fixed caller/route breaker class, bounded slots, compatible peer identity/configuration.
**Flow:** count completed dispatched calls; open at threshold; defer durable work or fail synchronous financial reads boundedly; admit exactly one eligible half-open original operation after cooldown.
**Rules:** no HTTP retries/hedging, financial fallback, synthetic mutation or borrowed class slots; library selected later.
**Validation/errors:** mTLS/role/epoch/integrity failure invokes security containment, not automatic half-open recovery. A primary-backed 404 never becomes zero money/no capture.
**Result/consistency:** process-local admission state changes; business records change only through existing owner protocols.
**Edge/authorization:** sparse failures may never meet minimum throughput; finite work deadlines still expose exhaustion. Restart closes circuit memory but does not reset work. [Exact transitions](../reliability-and-failure-scenarios/retry-timeout-and-breaker-policy.md#private-circuit-breaker-behavior).

## REL-FR-04 — Preserve confirmation under a partition

**Actor/trigger:** Commerce/Payments loses a response or stops at any hold/decision/finalization boundary.
**Preconditions:** original mapped capture, confirmation ID/token, owner receipt and local Pending decision.
**Flow:** recover acquisition knowledge; Commerce commits actual Consume/Confirmed/Committed or safe Aborted; send/query exact terminal decision; Payments drains fixed deferred watermark and resolves; Commerce records usable release.
**Rules:** hold never expires; 15-minute stock deadline remains unchanged; no new Admin refunds while held; release guards Processing until usable owner proof is locally recorded.
**Validation/errors:** token/mapping/capture/decision mismatch, missing history or financial integrity conflict retains containment. Exhaustion changes work to ManualReview, not hold permission.
**Result/consistency:** one terminal Commerce decision, one consume at most, one original release identity. Each owner commit is local.
**Edge/authorization:** callbacks during hold become verified deferred effects; first verification time remains private, new fact/event time is actual later application. Normal postconfirmation refunds do not rewind Order/stock. [Race analysis](../reliability-and-failure-scenarios/workflow-and-compensation-analysis.md).

## REL-FR-05 — Resolve late capture, cancellation and refund uncertainty

**Actor/trigger:** current verified capture arrives after stock expiry/cancellation, or preconfirmation Admin refund admission wins.
**Preconditions:** exact accepted mapping and original capture/case/refund identities; owner locks/equations.
**Flow:** block confirmation/fulfillment, release/expire active stock through Inventory; request original closure/compensation; Payments allocates uncovered captured money and recovers each original refund.
**Rules:** deadline never extended; consumed stock has the existing manual-adjustment policy; Unknown refund keeps R; definitive failed compensation retains FailedHold; ordinary refunds preserve Order lifecycle.
**Validation/errors:** malformed/unmapped/contradictory money is quarantined/held, not rounded or overwritten. Proof-based replacement requires actual definitive failure and the original repair guards.
**Result/consistency:** original cancellation/failure outcome only when owner predicates permit; financial settlement/review reported separately. Compensation is not an atomic rollback.
**Edge/authorization:** accepted Admin refund before local confirmation stops that purchase and fully compensates remaining captured money. Financial notifications never decide this flow.

## REL-FR-06 — Resume original work with attribution

**Actor/trigger:** authenticated operator reviews ManualReview work after a corrected cause or original-outcome lookup plan.
**Preconditions:** narrow owner capability, exact original target, current expected work version, no active lease, admissible current source/epoch/financial gates, bounded evidence/reason.
**Flow:** read original operation receipt; lock original owner hierarchy; recheck eligible state/cause/version; commit new finite cycle, operation receipt and append-only audit together.
**Rules:** no business-state overwrite, token deletion, budget reset on already Scheduled work, replacement identity or unconditional hold clearing.
**Validation/errors:** changed operation bytes/actor conflict; stale version or active lease conflicts; audit failure rolls back scheduling; missing proof preserves review.
**Result/consistency:** immutable receipt proves scheduling/unchanged outcome, never completion. All mutation is one owner-local transaction; no transaction spans inspection RPC.
**Edge/authorization:** repeated operation ID replays original receipt after current operator authorization. A new reason alone cannot make Unknown refund replaceable. [Contracts](recovery-and-operating-contracts.md).

## REL-FR-07 — Recover messages without granting business authority

**Actor/trigger:** relay/intake/sink observes duplicate, missing confirm/ack, delayed hint, malformed envelope or parking backlog.
**Preconditions:** trusted source/type/route, bounded bytes, original outbox/inbox identity and current consumer compatibility.
**Flow:** original publication, durable intake, manual ack; reconcile original source on restore/parking; transfer financial hints to existing work; query authoritative owner evidence.
**Rules:** hints never authorize capture/consume/refund; same identity compares exact canonical bytes; ten application cycles and broker delivery count remain separate.
**Validation/errors:** unsupported schema/future time/source mismatch/canonical conflict → quarantine/parking and alert; no rewrite/recreation of event IDs.
**Result/consistency:** one logical sink effect or explicit review; eventual delivery without exactly-once transport claim.
**Edge/authorization:** canonical replay requires original attributed operator receipts; authoritative source missing after restore stays unresolved. [Message contracts](event-and-compatibility-contracts.md).

## REL-FR-08 — Expose fair, bounded recovery progress

**Actor/trigger:** schedulers process healthy or post-outage accepted work.
**Preconditions:** existing connection/slot/account budget, persisted due/indexed selection and class continuation.
**Flow:** bounded scans select eligible work fairly; prioritize safe resolution without starving scan/other classes; record attempt/disposition/debt/oldest age and correlated trace links.
**Rules:** no queue of unbounded tasks, hidden worker/pool, extra provider executor or telemetry-dependent business commit.
**Validation/errors:** sustained arrival ≥ service rate closes new admission through existing attributed gates; missing telemetry produces an operational alert, not fabricated healthy data.
**Result/consistency:** accepted work is accounted for as pending, legitimate terminal, quarantine or ManualReview; progress evidence never deletes original intent.
**Edge/authorization:** hot rows and slow provider calls reduce useful service rate; report them before increasing concurrency. [Capacity](../performance-and-scalability/retry-amplification-and-recovery-capacity.md).

## REL-FR-09 — Reconcile restore before reopening

**Actor/trigger:** authenticated recovery team restores paired owner snapshots.
**Preconditions:** authenticated paired-v3 manifest, isolated target, fenced old processes/provider egress, bounded recovery credentials.
**Flow:** restore both databases; rotate active deployment epochs/revoke sessions; inventory original coordination/work/event identities; reconcile asymmetric terminal decisions and complete provider gap; prove one executor; reopen by capability.
**Rules:** restore never resets first-send/window, deletes unknown coverage, fabricates stock Consume or reconstructs an accepted Order from provider metadata.
**Validation/errors:** missing binding/authority/decision/event source or incomplete provider gap holds affected scope. RTO includes safe reconciliation and reopening, not only database startup.
**Result/consistency:** recoverable owner histories with explicitly accounted gaps; no globally atomic snapshot claim.
**Edge/authorization:** expired restored retry cycles enter review; original due times remain unchanged. [Restore procedure](../deployment-and-devops/backup-and-restore.md).
