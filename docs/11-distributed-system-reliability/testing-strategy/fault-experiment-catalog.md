# Controlled Fault Experiment Catalog

**Status:** experiment designs for future implementation. No experiments, automated tests, fixtures, scripts or fault tools are created/executed here.

## Common protocol

Use isolated Development/private sandbox owner databases and an explicit reviewed environment identifier. Inventory both releases/schema/profile fingerprints, active epochs, peer certificates, provider account/mode, original mappings, current gates, queues, retained evidence, backup and executor count before touching a link/process.

Record hypothesis, injection boundary/direction, original object count, expected safety/progress result, reversal owner and abort condition. Start with two-minute healthy baseline; active fault normally≤5m; observe at least5m after dependency recovery. A near-expiry/15-minute stock experiment has a separately declared real-time duration and containment plan. No accelerated/faked provider, stock or primary clock.

Injection uses reviewed existing OS/container/network/broker controls or an isolated debugger pause at an actual commit boundary. This phase installs no proxy, chaos platform, sidecar, test adapter or executable hook. Where a needed facility is unavailable, mark the experiment Not run instead of weakening TLS or fabricating a result.

Use genuine sandbox effects only for financial assertions:≤100 affected objects/drill,≤0.5 new payments/sec,≤0.1 refunds/sec, all calls within5/sec/burst2/concurrency2. Transport drills keep executor stopped and provider egress fenced; original roots are closed/proved never-dispatched before any later reopening.

**Abort immediately:** wrong/live account, unexpected external object/amount, identity/integrity conflict, second executor, scope/credential exposure, disk hard gate, required owner proof lost or fault target outside isolation. Preserve original evidence/Unknown coverage; stop dispatch. Reversal removes the injected fault, not a financial hold. Cleanup is successful only when original work is terminal or explicitly assigned safe review and every capability remains correctly contained.

## REL-F01 — Acceptance commit and lost response

**Concept/hypothesis:** one local transaction and original public key recover ambiguous acknowledgement.
**Setup:** valid quote/cart/address, fresh stock, one controlled accepted key; transport mode with provider dispatch fenced.
**Injection:** first terminate Commerce just before commit; then repeat with a different original accepted key and pause after the acceptance transaction commits but before response write; close client connection and restart.
**Observe:** rolled-back run has no receipt/Order/reservation/intents; committed run has all of them once. Same key/body returns original receipt; changed body conflicts.
**Reversal/exit:** restore process, close original test roots through guarded never-dispatched path; retain key/receipt/digest inventory. A trace alone cannot establish commit.

## REL-F02 — Remote admission commit and response loss

**Concept/hypothesis:** transport timeout does not erase owner admission or durable human authority.
**Setup:** immutable Commerce command; genuine captured payment for refund branch, current restricted Admin and original key.
**Injection:** pause Payments after command/allocation/receipt commit before sending response; break only response path. Repeat a second branch with crash before commit. Revoke Admin after durable Commerce authorization in an explicitly isolated branch.
**Observe:** original command/receipt lookup distinguishes branches; admitted refund returns same receipt after appropriate current public authorization; already approved durable intent can complete after revocation. No new UUID/key or second allocation.
**Reversal/exit:** restore link/process; reconcile original command/mutation under quota. Missing restored receipt is a separate restore experiment.

## REL-F03 — Slow RPC and retry synchronization

**Concept/hypothesis:** two-second RPC bounds and persisted jitter disperse repeat calls without shifting identity.
**Setup:**≥10 eligible original nonfinancial commands with provider egress fenced; two declared replicas if budgeted; matched fixed/jitter runs.
**Injection:** delay actual private response beyond2s using existing network facility or isolated handler pause; do not rewrite payload/certificates. Record owner commit boundaries separately.
**Observe:** slot/connection release, original Unknown recovery, charged attempts, exact1..30s draws, one-second outbound buckets. Restart after schedule commit and compare identical due times.
**Reversal/exit:** remove delay; verify disposition and amplification. A jitter graph cannot substitute for original receipt reconciliation.

## REL-F04 — Directional partition and circuit transitions

**Concept/hypothesis:** failing one private class stops repeated dispatch while preserving unrelated availability.
**Setup:** enough eligible calls for ten-call minimum and≥50% failure; declare exact caller/method/routes.
**Injection:** block Commerce→Payments while preserving Commerce DB/public routes; separately block Payments→Commerce decision queries. Keep fault≤5m. Compare breaker-disabled/enabled isolated runs.
**Observe:** Closed/Open/HalfOpen,30s cooldown, one actual half-open original operation,≥80% fewer failing calls in60s after opening, no fallback, finite work review.
**Reversal/exit:** restore only affected path; observe current epoch/certificate validity and original outcomes. Reverse-path success does not prove the blocked forward path works.

## REL-F05 — Saturated reads and recovery fairness

**Concept/hypothesis:** separate bounded classes preserve command capacity; fair turns prevent starvation.
**Setup:** original accepted backlog≤100, declared public mix, bounded financial-read work.
**Injection:** slow/saturate read calls until both read slots/r occupied; separately fill due recovery classes without adding provider load.
**Observe:** command slots remain available, no unbounded semaphore queue/tasks, per-class turn≤30s, complete unrelated p95/CPU/pool data and connection plan.
**Reversal/exit:** stop offered saturation, drain/account every record, preserve explicit review. Do not increase pools/replicas during comparison.

## REL-F06 — Worker ownership loss and shutdown

**Concept/hypothesis:** token fencing rejects stale apply without denying possible remote execution.
**Setup:** original due work, one claim token A; safe isolated pause facility.
**Injection:** pause A after claim, wait actual30s lease expiry, let B claim; resume A with its old result. Repeat process stop during I/O and forced stop after15s drain.
**Observe:** A cannot mutate under stale token/version; B recovers original receipt/evidence; ten-claim/deadline state survives; no operator steal of unexpired lease.
**Reversal/exit:** stop stale process/egress if provider executor involved; one active executor and original outcomes proven. Expired lease is not proof of no provider send.

## REL-F07 — Confirmation hold, stock and finite barrier

**Concept/hypothesis:** each hold/decision boundary survives failure without unbacked fulfillment.
**Setup:** genuine full capture, exact accepted mapping; list each boundary from workflow analysis.
**Injection:** independently pause/kill after Held commit, before/after Commerce decision commit, after Finalizing watermark, mid-deferred application and after owner release before local release. Use a separate near-expiry reservation with real time; admit valid observations while Held/Finalizing.
**Observe:** one terminal decision/consume, no expiry-based hold clearing, no new Admin admission while Held, fixed watermark, one fact per admitted effect, actual application time, no Processing until usable release.
**Reversal/exit:** query exact original decisions/holds and drain through original barrier; conflicts stay held. Historical decision and financial anomaly are reported separately.

## REL-F08 — Late capture and fallible compensation

**Concept/hypothesis:** unusable stock and refunds do not cause duplicate money or automatic restock.
**Setup:** genuine sandbox objects and original compensation case; preserve provider parameters/window.
**Injection:** delay observation so original reservation expires; exercise Admin refund winning preconfirmation; lose refund result after possible send; use a real provider-supported definitive failure/correction only where available.
**Observe:** no late confirmation, original full remaining coverage, Unknown retains R, failed compensation retains FailedHold, repair unique only after definitive proof, reversal reopens same case.
**Reversal/exit:** original-object retrieval and safe review. Provider-window expiry branch uses actual retained old mutation/time; no timestamp rewrite or fabricated “verified” failure/capture. Unsupported correction fixture means Not run for that branch.

## REL-F09 — Publish confirm and consumer ack loss

**Concept/hypothesis:** durable original outbox/inbox produces one logical local sink effect despite duplicates.
**Setup:** ordinary accepted lifecycle/refund event, recorded canonical bytes/digest; safe broker isolation.
**Injection:** sever publish connection after broker acceptance but before confirm; separately stop consumer after inbox/sink commit before ack.
**Observe:** original bytes/source/ID replay, positive confirm/no return guard, manual redelivery dedup and one sink receipt; no money/Order change from message receipt.
**Reversal/exit:** reconcile publisher/inbox/sink and transport attempt counts; drain/account original delivery.

## REL-F10 — Poison message, parking and queue pressure

**Concept/hypothesis:** malformed/unsupported/conflicting input cannot become authority and does not busy-loop.
**Setup:** isolated broker/vhost and reviewed malformed nonfinancial envelopes; explicit canonical source inventory.
**Injection:** one case per malformed/oversize/future/schema/source/identity conflict; fill declared main/parking capacity with safe controlled messages or use an existing isolated pressure facility. Separately make DLX target unavailable.
**Observe:** bounds before parsing, durable digest quarantine/parking, reliable DLX backpressure, delivery/application counters distinct, alerts≤60s and no payload leakage.
**Reversal/exit:** canonical owner inspection and attributed resolution/replay; account each message. Do not drop queues to declare success or alter production queue bounds.

## REL-F11 — Hint delay, ordering and restore-source conflict

**Concept/hypothesis:** hints wake work but never promote owner authority.
**Setup:** genuine owner changes with original canonical hints; capture actual owner-observed version.
**Injection:** delay/reorder/redeliver retained valid hints; send an isolated invalid higher-version hint; race intake with transfer; remove transport only, not owner proof.
**Observe:** local version guarded Pending clear, owner-behind-hint SourceMismatch, later legitimate lower hint still eligible above actual observed version, retained polling catches missing hint, no cycle reset on duplicate.
**Reversal/exit:** query owner and compare hints/inbox/accepted mapping. Postrestore source validation is tested against isolated restored canonical records, never deleted live sources.

## REL-F12 — Database outage, contention and local rollback

**Concept/hypothesis:** no partial owner commit and no DB connection held over network.
**Setup:** local owner transactions, original pending commands; actual plan/pool inventory.
**Injection:** block one logical DB connection path/role without breaking the other's permissions; separately stop shared server; hold a conflicting row lock, and reproduce a controlled local deadlock with reviewed owner lock paths.
**Observe:** pool/lock/command/transaction bounds, whole known-rollback retry≤1, no duplicate receipt/outbox, callback non-200 when inbox cannot commit, overdue sweep after recovery.
**Reversal/exit:** restore role/network/server/locks, retain unchanged grants and both owner proof. A connection refusal is not a schema repair opportunity.

## REL-F13 — Retry storm, retained growth and disk gate

**Concept/hypothesis:** finite cycles/fairness/admission protect recovery reserve under overload.
**Setup:** bounded≤100 accepted affected attempts, isolated disk/resource target and current usable backups.
**Injection:** synchronized eligible transient failures; controlled safe disk pressure approaching gates using existing environment facilities, never corrupt/truncate DB/WAL/broker files.
**Observe:** calls/operation, net drain, attempts/deadlines, per-class turns, planned/actual connections48/79, disk horizon warning/containment and evidence retained.
**Reversal/exit:** remove pressure, verify accepted records and archives/queues; reopen only after resource and integrity proof. No receipt deletion as cleanup.

## REL-F14 — Identity and diagnostic dependency failures

**Concept/hypothesis:** security fails closed while diagnostic outage cannot corrupt business records.
**Setup:** isolated peer certificate variants/roles, current epoch, sanitized telemetry filters.
**Injection:** wrong/expired/untrusted/revoked peer, denied role or stale epoch; separately interrupt Collector/Tempo/Loki/Prometheus availability.
**Observe:** security containment rather than timer-based fallback; metrics/trace/log queues bounded, missing diagnostics alerted, owner audit complete; public context rejected according to existing trust policy.
**Reversal/exit:** restore trust/valid credentials and observed diagnostic service; no TLS bypass/new secret in artifact.

## REL-F15 — Paired asymmetric restore and stale executor

**Concept/hypothesis:** authenticated snapshots require reconciliation and epoch fencing before safe reopen.
**Setup:** original paired-v3 bundle with declared≤60s skew and histories differing at a coordination boundary; isolated target.
**Injection:** restore both owners with known decision/hold asymmetry; keep an old process alive but fenced for a negative epoch attempt. Include provider effects after older bound on old objects, not only newly created objects.
**Observe:** active epoch rotation, rejected old process, original mutation/window preserved, no fabricated Consume, exact hold/decision repair and complete provider-gap inventory, one executor.
**Reversal/exit:** follow restore runbook; safe reopen timed against2h RTO. Missing original history stays contained; no “restore passed” from PostgreSQL startup.

## REL-F16 — Missing accepted history or canonical source

**Concept/hypothesis:** missing restored evidence cannot be reconstructed from logs/provider metadata.
**Setup:** isolated restored pair and retained broker/provider history proving a deliberately selected history gap.
**Injection:** choose an actual older authenticated restore point missing that accepted binding/authority/decision/source; do not edit live data or fabricate snapshots.
**Observe:** source/receipt404 not no-dispatch; orphan one-merchant scope contained; no new Order/payment/key/stock permission; attributed missing-history review remains open.
**Reversal/exit:** restore complete authenticated original history if available, or review safe financial resolution without invented accepted Order. Quarantine/ManualReview alone cannot waive reopening blockers.

## Evidence package

Keep experiment ID/operator/time, exact environment/resources/releases/profile/epoch fingerprints, original protected target references, injection/reversal times, offered/completed/unknown/review counts, before/after owner counts/digests/equations and applicable plots/traces. Store sensitive owner references in protected evidence, not metric labels.

Record **Passed, Failed, Not run** per branch and the actual reason. Include failed/aborted runs. Diagrams, planned assertions and generated specifications are not results.
