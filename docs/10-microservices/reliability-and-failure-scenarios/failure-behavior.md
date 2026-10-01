# Failure Behavior and Recovery Boundaries

**Status:** mandatory first-extraction behavior. Read with [coordination](workflow-coordination.md); no prerequisite safety mechanism waits for Phase 11.

## Crash and uncertainty matrix

| Failure boundary | Durable evidence / required recovery | Prohibited assumption |
| --- | --- | --- |
| Commerce acceptance commit, before HTTP202 | Original acceptance key/receipt and Initialize intent | Allocate a new purchase because response was lost |
| Initialize sent, before Payments commit | Original local command Unknown | Remote404 proves a prior provider effect impossible |
| Payments binding/receipt commit, before response | Original receipt lookup/repeat; one binding/mutation | Create another payment/provider key |
| Closure wins before Initialize | Stable root stop latch; later initialization stays stopped | Message arrival order can reopen the root |
| Provider request dispatched, process crashes | Original earliest-send/key/window and uncertainty | Expired lease means request never arrived |
| Capture fact commit, hint not published | Owner hint outbox + periodic polling | Missing event means payment failed |
| Pending local decision, acquisition unknown | Query original command/hold; no consume | Retry with a second confirmation identity |
| Held, before local decision | Commerce original decision query under original locks; stock may expire | Hold/lease/deadline timeout grants fulfillment/refund |
| Local Consume/Confirmed commit, response lost | Immutable Committed decision + lifecycle outbox; resolve original token | Mark Aborted or consume again |
| Resolve committed, before deferred drain | Finalizing + finite barrier; owner bounded application | Treat acknowledgement as fulfillment release |
| Owner release commit, Commerce response lost | Retrieve exact release UUID; local metadata dedup | Reconfirm Order/increment version/publish extra lifecycle event |
| Refund authority commit, before send | Original immutable authorized command | Current revoked account erases accepted work |
| Refund admitted, response lost | Original owner receipt/allocation/provider mutation | Free R or permit changed body/new key |
| Definite refund business rejection | Immutable rejected command; no successful public key | Treat transient503 as permanent rejection |
| EnsureCompensation accepted as deferred control | Recorded command, coverageComplete=false | Order may become terminal before full coverage proof |
| Outbox confirm unknown / inbox ACK lost | Original frozen event/inbox dedup | New event ID or false Published/Delivered |
| Remote replay admitted, response lost | Same operation owner receipt + local Pending audit | Resolve quarantine before owner proof |

## Dependency outages and partitions

**Payments unavailable:** Catalog/Cart/Order history and local stock expiry remain usable. Scoped financial reads/refund admission return existing bounded503; no cached balance. Known accepted financial receipts may be returned only if their immutable receipt was already durably recorded at Commerce and public authority remains current. Never return202 from the authorization intent alone.

Close new StripeSandbox purchase admission on known unsafe/unavailable Payments, preserving existing Phase 07 policy. Commerce can discover the outage after a local acceptance; that accepted purchase retains its receipt/original command/deadline and resolves safely. Availability checks grant no monetary authority or promise remote dispatch. Simulator admission remains restricted to its original isolated Development rules.

**Commerce unavailable:** Payments can accept signed callbacks/retrieve facts and recover original financial operations. Held financial application stays deferred; decision lookup failure cannot resolve a hold. No new human authorization is accepted. Independent provider/case recovery remains subject to original hold/window/account limits.

**Broker unavailable/full:** financial commits preserve owner outboxes while capacity is safe; Checkout polling discovers current owner evidence. Notification/hint lag alerts. Rejecting publication prevents false Published. At measured authoritative disk/admission thresholds contain new work while preserving original resolution capacity. Broker is not the financial source.

**Primary/server unavailable:** both logical databases share the failure. Neither service invents reads/receipts/facts or changes state in memory. Bounded503/readiness failure; liveness does not intentionally crash-loop on database outage.

**Telemetry unavailable:** bounded queues/drop counters; commits never depend on Loki/Tempo/Prometheus. Lost diagnostics are explicitly unknown evidence and have separate alerts.

## Financial races and corrections

Admin admission versus hold is serialized at Payments root/intent/hold: hold first rejects new refund; refund first sets R/refund_started and prevents hold. If accepted preconfirmation refund later fails or reverses, refund_started remains monotonic and the original purchase still cannot confirm. Fail/compensate its remaining captured money using the original case.

Cancellation versus local confirmation is serialized at the original Commerce Order lock. An accepted request blocks confirmation; a historical confirmation remains Committed if it won first. Terminal postconfirmation cancellation uses original full compensation and does not restock consumed units. Shipping/Processing cannot bypass the handoff guard.

Dashboard/external effects can occur while Held. Retrieval normalizes and stages them durably; current public availability is zero. A hold cannot stop the provider's reality. After known terminal decision, genuine postconfirmation refunds/corrections follow historical Order policy; a wrong amount/account/mapping/capture anomaly retains integrity hold and suppresses release. No verified evidence is discarded to preserve a desired Order state.

Refund reversal links the original successful fact once; S decreases once. Replaying old success cannot undo the correction. Unknown and failed compensation reservations follow original R/FailedHold rules. No late payment resurrects expired stock or failed purchase.

## Finite retry and operator recovery

Use original ten observations/cycle, persisted attempts/due/cycle/version and30-second token lease. Backoff1/2/4/8/16/30seconds capped; total2-second RPC and10-second action. Duplicate event/read/restart does not reset a cycle. Stale local workers cannot apply results without matching token; receiver receipt can nevertheless be committed.

After exhaustion alert ManualReview within60seconds of observable state and retain hold/keys/allocations. Protected resume is attributed/version-checked on the original identity, only after evidence of recovered dependency/new genuine facts. No free-running infinite polling cycle. Retained24-hour scan still inspects unresolved original financial objects without redefining exhausted work as healthy.

Repair never derives no-capture from HTTP404, expired window, missing restored row, absence of callback or provider search alone. Missing original dispatch/key history requires protected provider-gap reconciliation. A repair of definitively failed compensation may create a new refund UUID only under the original Phase 07 replacement rules/case; ordinary Unknown never permits replacement.

## Restore asymmetry

Separate snapshots may retain local authorization without remote admission, remote admission without local response, Committed Order without remote resolution, resolved hold without local release, or event bytes newer than one database. All are expected investigation classes.

Change runtime epoch under containment, query both original owners and reconcile immutable IDs/decisions/provider effects. A missing decision is not Aborted. A missing local authorization receipt for an admitted refund is not permission to refund again. One-sided unexplained evidence keeps the applicable account/purchase/fulfillment gate held. See [restore](../deployment-and-devops/backup-and-restore.md).

## Overload and shutdown

No-wait bounded RPC/server admission gives existing503/Retry-After; original authority/intent survives if already committed. Oversized callback/command rejected before expensive processing. Queue/disk pressure does not authorize dropping original accepted work.

On stop: disable new claims/admission, stop consumer delivery, drain/cancel within15seconds, release resources and leave uncertain original work for token/receipt recovery. Do not clear leases/holds or mark failed to make shutdown appear complete. Quiescing an executor requires process/egress fencing as well as lease state.
