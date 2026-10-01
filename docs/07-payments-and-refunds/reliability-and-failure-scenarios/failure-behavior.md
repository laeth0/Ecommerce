# Payments Reliability and Failure Behavior

**Status:** required future recovery behavior. The [provider classifier](../functional-requirements/stripe-provider-contract.md) defines what constitutes money evidence; transport/retry state never substitutes for it.

## Failure matrix

| Failure/trigger | Required behavior | Observable recovery assertion |
| --- | --- | --- |
| Response lost before local acceptance commit | Rollback binds no key or amount; retry original request/key | Either original receipt exists or one new local acceptance commits; no partial reservation/receipt |
| Response lost after refund acceptance commit | Original immutable receipt replay before new guards | One original refund allocation/key/audit |
| Process crashes before dispatch gate | Prepared can abort at deadline/cancellation | No provider mutation if Aborted wins |
| Crash after Pending commit before send | Original mutation/window remains; retry exact key within window or inspect | No new financial operation; ambiguity preserved |
| Provider captures but response lost | Callback/retrieval/list reconciliation records original capture | Capture survives local failure, one effect and correct Checkout wake |
| Provider500/cached500 | Unknown; retain mapping/key/window; bounded inspection | No invented decline or fresh charge key |
| Provider429/concurrent key execution | Persist bounded next due time; original parameters/key; count unsuccessful observation | No hot loop, extra process quota or replacement instruction |
| Provider unavailable/slow | Two-second call deadline, no connection held; backoff; hold new affected admission | Reads/exact receipts survive if primary healthy; debt/unknown remains visible |
| Missing ID after safe retry window | No POST replay; correlate authenticated hints/paginated list/manual review | Empty/partial scan never proves no capture/refund |
| Cancellation before dispatch | Missing/Prepared→Aborted under parent lock; terminal stock handled by Checkout | Safe no-dispatch proof, no later provider execution |
| Cancellation after dispatch | Close/inspect original known intent; Pending until definitive capture/no-capture | Request blocks fulfillment; unknown cannot complete financial classification |
| Stock expires during Unknown | Original15-minute deadline stands; Checkout records stock loss | Late capture gets compensation, never new reserve/confirmation |
| Capture succeeds and stock/Order transaction fails | Preserve independently committed financial fact; retry original owner operations | One movement/confirmation or durable compensation; no erased money |
| Capture after Order already Failed/Cancelled | Keep earlier evidence and new capture; hold and full compensation/manual review | Business terminal outcome unchanged; no fulfillment restart |
| Admin refund before historical confirmation | Latch purchase blocked; Checkout releases eligible reservation, covers full remaining capture and fails Unfulfillable | No paid-but-refunded purchase confirmation; historical outcome stays Failed |
| Partial refund overlaps cancellation | Parent lock counts prior S and R; allocate only uncovered case amount | Same capture cannot be over-reserved/refunded |
| Refund response lost | Pending/Unknown retains full allocation | No released money for another instruction |
| Refund pending due to provider balance | Continue original inspection; no success claim; bounded ManualReview if unresolved | Provider Pending remains reserved; stock/Order are independent |
| Refund fails before success | Release Admin allocation; retain compensation FailedHold | New deliberate Admin request or reviewed failed-case replacement only |
| Refund reports success then later fails | Append one reversal; reduce net S; reopen/reserve compensation debt | Earlier success preserved, current state corrected, older success ignored |
| Refund requires_action | Unsupported interactive flow; reserved ManualReview | No client-secret/URL/customer-authentication workaround |
| External Dashboard refund/dispute | Retrieve and import/quarantine once; hold when reservations/mapping conflict | Actual money never erased to satisfy local constraints |
| Duplicate callback/event object | Verify every delivery; dedup inbox and normalized effect | Distinct events/API responses cannot repeat counters/version/audit |
| Callback before API response | Correlate accepted binding and original operation; compare response later | One provider mapping, no overwritten ID |
| Out-of-order callback | Retrieve current object; facts/verified reversal guard progression | Arrival time/provider created timestamp not used as version order |
| Callback lost | Pending and retained scans observe original objects | Useful outcomes do not depend solely on event delivery |
| Callback database failure |503; no durable acknowledgement/in-memory substitute | Sender retry or reconciliation recovers |
| Unsupported callback version/unknown mapping | Durable quarantine,200 only after commit, alerted inspection | No Order effect/proof from unfamiliar payload |
| Conflicting event ID/object identity | Preserve original inbox and separate quarantine | No replacement envelope or trusted effect |
| Wake lost after financial commit | wake_pending version survives; indexed discovery calls Checkout outside locks | Latest financial version remains pending until acknowledged |
| Worker lease expires during provider I/O | External outcome may still happen; fence scheduling/current application | Verified capture retained; stale worker never overwrites newer work |
| Worker dies holding local transaction | DB rollback releases locks; committed intent/window/work remains | Original IDs replay after takeover |
| Deadlock/lock timeout/pool exhaustion | Rollback local mutation, sanitize503 or bounded work retry | No partial counters/audit/instruction; no changed financial key |
| Audit/constraint/invariant failure | Rollback instruction; hold/alert corruption; preserve independent provider truth | No successful un-audited local mutation |
| API/signing credential rotation | Same-account validation/overlap; immutable operation descriptors | Old pending objects remain readable, no source reinterpretation |
| Source mode switch/rollback | Existing binding chooses its original owner/version forever | Simulator cannot execute at Stripe; keys/facts retained |
| Restored local backup misses provider effect | Hold purchase/fulfillment; reconcile whole gap and orphan mappings | Startup alone does not authorize dispatch/fulfillment |

Redis, broker and search are absent from this phase; their failure modes cannot be claimed as verified. Later extraction must define their delivery/compensation behavior explicitly.

## Recovery scheduling and external isolation

One financial work row per payment and durable inbox hints replace process-memory assumptions. Claims are≤100/pass, action10s,lease 30s, providercall2s. Increment an unsuccessful-observation attempt before I/O; crash uses budget. Backoff1,2,4,8,16,30s, maximumten unsuccessful observations per cycle. Persist wait rather than sleeping under a connection/action slot. Retry only an idempotent original operation whose provider safe window still permits it.

Unknown/exhausted cases become audited ManualReview withinfive minutes of healthy scheduling. Database outage can prevent that write; measure the recovery interval from restored primary availability too. Meaningful new verified proof or audited operator resume starts another cycle once. A duplicate hint/unchanged provider state cannot repeatedly reset budget. A later capture/reversal remains discoverable after ManualReview through signed ingress and retained reconciliation.

For provider transport/5xx, five consecutive failures observed within one minute close new Sandbox purchase/refund admission and ordinary outbound mutations for 30s. The single executor permits one bounded read-only account/known-object probe after cooldown; success reopens only gates permitted by validated Options, failure persists the hold. Auth401/403, true livemode, account mismatch and integrity failures require correction/manual review, not automatic reopening.429 pauses until the bounded indicated delay/backoff and reduces new admission when backlog targets cannot hold. These guards use durable account admission state; no circuit-breaker library/Redis dependency is required.

The hold isolates new demand and unsafe dispatch; it never deletes accepted instructions, treats an outage as no-capture or prevents authentic evidence from being persisted. Reads/probes/callback inbox and protected reconciliation retain separate bounded opportunities. A malformed object is poison input: bounded quarantine/alert, no endless deserialization retry. No generic dead-letter broker exists; ManualReview/quarantine rows are the explicit durable inspection queue.

## Late/stale observation rules

Payment capture facts are immutable financial effects and remain eligible even if their discovering worker lease expired. Record an independently verified positive effect through the parent-locked classifier; lease fencing controls work/scheduling, not deletion of actual financial evidence. Stale no-capture, pending or regressive refund-state snapshots require fresh observation and cannot overwrite newer knowledge.

A refund-success response arriving after a verified reversal is retained as earlier evidence but cannot restore S. Failed/reversed guard wins; a genuinely contradictory fresh current object is quarantined. A response claiming no effect is never allowed to discard an already-recorded capture. Duplicate fact uniqueness compares exact content; conflicting content produces hold/manual review instead of pretending it is an exact replay.

If a late earlier success is discovered after a verified Failed record that had no stored success, do not add an unmatched successful-balance fact. With complete original success/current failure adjustment evidence, append the success and its linked reversal together with zero net counter change. Otherwise retain bounded quarantined observation and require fresh investigation. This preserves history without allowing stale success to recreate refunded funds.

## Full-compensation repair boundary

Coverage records an obligation; settlement is separate. A failed compensation refund retains reserved FailedHold and operator visibility. Fixing provider funding while its refund is Pending continues the original operation. A permanently failed allocation may be replaced only after fresh failure evidence proves no pending effect and the protected repair request atomically swaps held coverage for one new allocation. Stable case UUID remains; new child identity is a deliberate new repair instruction with its own unique provider key. Unknown can never use this path.

An Admin refund failure after an open case immediately allocates its uncovered amount to the case. A reversed successful compensation refund moves its amount into FailedHold. A reversed successful Admin refund with a case creates one new case allocation. Money already successfully returned is not refunded again. Repeated cause/request/failure observations do not repeat allocation.

## Learning and failure evidence

Capture the exact crash boundary, original IDs/keys/windows, lease tokens in restricted inspection, before/after DB snapshots/facts/audit, verified provider objects and final Order/Inventory/financial outcome. Use actual PostgreSQL and small sandbox calls for network/result races; label isolated simulations separately. The [verification matrix](../testing-strategy/verification-scenarios.md) translates these rules into executable manual scenarios when infrastructure exists.
