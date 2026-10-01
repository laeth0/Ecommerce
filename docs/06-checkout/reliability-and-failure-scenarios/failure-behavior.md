# Checkout Failure Behavior

**Status:** proposed fault/recovery contract. [Workflows](../functional-requirements/checkout-workflows.md), [financial boundary](../functional-requirements/payment-boundary-and-simulator.md) and [locks](../database/schema-and-transactions.md) determine permitted effects; no fault scenario has been executed.

## Failure matrix

| Scenario | Required behavior | Evidence/recovery |
| --- | --- | --- |
| Preview response lost | A new preview may be requested; no reservation/order/payment exists | Bounded unused quote retention, no purchase effect |
| Price/cart/policy changes after preview | Requote conflict; whole submission rolls back | Quoted accepted values are never silently replaced |
| Product hidden/category inactive or insufficient final units | Inventory owner rejection; no partial accepted attempt/reservation/Order | At most one winner for final stock, conserved balances |
| Quote expires during lock wait | Fresh final database-time check rejects and rolls back | No response-time/start-time grace |
| Same Customer/key/quote submitted concurrently | One accepted binding; exact replay returns original receipt | Same attempt/reservation/Order, no second financial identity |
| Accepted key reused with another quote | IdempotencyConflict before current business checks | Original mapping/receipt unchanged |
| Another key accepts the same quote | QuoteAlreadyAccepted; no new purchase | Quote lock and accepted-quote uniqueness |
| Another Customer guesses quote/attempt/key | Uniform scoped 404 or own-key classification; no cross-owner receipt | No address or foreign existence disclosure |
| Accepted replay after quote expiry, Catalog hide, Cart clear or fulfillment | Return immutable 202 receipt after current authority | No price/reserve/payment replay or status regression |
| Failure on last acceptance write/audit/work row | Roll back every local acceptance effect | No committed Preparing row or missing member of four work rows |
| Disconnect/DB loss during commit | Outcome uncertain; recover original key/body | No new intent inferred from timeout/temporary absence |
| Crash after acceptance before financial preparation | Due Purchase row survives and is claimed after restart | Stable operation IDs and no early financial dispatch |
| Crash after Prepared/Pending financial intent | Replay original owner operation | Prepared may atomically abort; Pending remains unknown until actual facts |
| Cancellation wins undispatched gate | Aborted proof prevents every later start for that operation | Requested resolves with terminal stock, no capture |
| Dispatch wins before cancellation | Pending cannot be guessed Aborted; release stock and retain request while unknown | Reconcile same operation, compensate actual capture |
| Financial response lost after capture | Preserve financial owner proof; retry inspection/local resolution | One captured operation, no missing money fact |
| Stock lock wait crosses reservation deadline | Inventory Expired wins; never consume/confirm | Terminal-time stock proof; late capture compensation |
| Unknown payment outlives reservation | Stock expires normally; Order/attempt remains pending/manual review until safe financial fact | No extension, replacement reservation or invented failure |
| Capture arrives after expired/released stock | Ensure durable full compensation before permitted terminal Order failure/cancellation | Never reacquire stock/confirm; financial truth preserved |
| Capture arrives on Failed/Cancelled | Preserve terminal Order/outcome and schedule original compensation | No reopening; exactly one compensation identity |
| Confirmation and cancellation race | Existing Order lock serializes; Requested suppresses new Consume/confirmation | Confirmation first remains cancellation-eligible until Processing |
| Cancellation and Admin processing race | Orders cutoff/expectedVersion determines one winner | No processing after accepted Requested, even with refreshed version |
| Consumed stock on later cancellation/refund | Leave consumption terminal | No automatic stock increase; separate verified Inventory adjustment |
| Compensation response lost/unknown | Inspect original refund operation and retain Scheduled work | No new refund key or false settlement |
| Compensation definitively fails/exhausts | Audited ManualReview; Order stays terminal/cancellation block stays | Visible unresolved financial work, no shipment/restock fallback |
| Cart edited before cleanup | Mark Skipped, preserve higher version and all lines | Never clear/retry against refreshed version |
| Cleanup crashes or response is lost | Cart clear/work/audit commit together or roll back | Finished replay does not clear/increment twice |
| Logout/disable after acceptance | Deny new human actions; trusted recovery continues accepted obligations | No impersonation, money/stock work remains discoverable |
| Worker lease expires during response | Replacement can claim; stale token cannot apply local results | Same financial operation ID on every execution |
| Different work kinds compete on one attempt | Full fixed work-row order before attempt | No attempt→existing work inversion |
| Financial settlement wakes Checkout | Financial commit/releases locks before Checkout wake | No financial→Order/Checkout lock inversion |
| Source fact/request repeats after manual review | Same markers do not reset retry cycle | Only new verified fact or audited operator resume wakes anew |
| DB outage, pool/lock timeout, deadlock | Bounded sanitized failure; rollback known local transaction | No cache, empty progress, guessed paid or in-transaction recovery |
| Missing work/reference, bad fingerprint/sum/state, version exhaustion | Integrity/manual-review alert; no automatic repair | Affected acceptance/resolution fails safely |
| Simulator enabled in normal deployment/forged HTTP source | Startup/source rejection, no purchase authority | Synthetic proof never becomes provider proof |
| Restore loses recent local records | Hold admission and inspect combined source/keys/stock/Orders; provider reconciliation gate in Phase 07 | Finite RPO is not zero financial loss |

## Unknown commit and replay

Materialize the small receipt before acceptance commit and return success only after known commit. Before commit starts, request cancellation should roll back pending work. During/after commit, disconnect cannot undo durable acceptance; the client reuses the original key and quote. Every replay still checks current Identity. A temporary read during an in-flight transaction cannot prove rollback, and an original 202 replay cannot prove the current purchase is confirmed.

No automatic API write retry is introduced. Retry-After is a pressure hint; it never permits replacing a key, quote, expected cart/order version or financial operation. Unique/serialization/connection failure rolls back the entire caller transaction where known. Reconcile a uniqueness winner outside an aborted PostgreSQL transaction. Do not conceal uncertain commit as a business rejection/success.

## Recovery cycles and stale execution

One claim consumes an observation attempt before external work, so crash loops also reach the ten-attempt limit. Delays are 1, 2, 4, 8, 16, then 30 seconds. Repeated Unknown or dependency failures do not reset the counter. Exhausted or unsafe work becomes audited ManualReview with retained identities and visible age. A new committed payment/refund proof or first new cancellation request can schedule a new cycle once; separate persisted input markers prevent replay from generating unbounded retries. Protected operator resume reuses identities and requires a reason/inspection.

Claim holds one work row only and commits. Applying/waking/resuming locks the four-row set in fixed order before attempt/owners. Validate token and fresh deadline after final waits. Lease expiry cannot delete already captured/refunded financial truth. A repeated external request from a paused process must still be idempotent at its financial owner; fencing alone cannot guarantee one network execution.

Source observation continues for due simulated outcomes and Requested cancellation after purchase work is Idle/ManualReview. A late fact is not discarded because retry stopped. It can only authorize the permitted current Order/Inventory consequence. Captured plus expired stock creates compensation, never a new stock allocation. Real Phase 07 callback/reconciliation must preserve the same post-financial-commit wake boundary and proof validation.

## Local rollback and cross-owner truth

Acceptance combines all local purchase members. Resolution combines allowed Inventory/Orders/financial compensation-intent/Checkout audit-work changes on one connection. Provider dispatch is outside that transaction. A captured financial record committed independently remains intact if later confirmation/audit fails. Inventory Consume returning Expired may commit with durable non-fulfillable pending recovery, safe failure or cancellation; it cannot produce a false Confirmed response.

Historical Confirmed outcome does not disappear when the Order later cancels. Conditional Cart cleanup belongs to that confirmation and does not reverse on refund. Attempts never confirmed have no eligible cleanup. Operator investigation checks exact snapshot/currency/components, quote/key/intent mapping, all four work rows, lease/input markers, audit versions, reservation terminal movements and financial/compensation evidence. No generic paid/status/snapshot override is available.

## Restart and restore

Restart claims due or expired-lease work, observes due source plans and discovers cancellation without in-memory queues. Graceful shutdown stops new claims/admission, finishes bounded work or releases/cancels uncommitted transactions; already committed source/acceptance state survives response loss.

Restore all owner schemas together in isolation, revoke restored sessions, validate mapping/count/sum/fingerprint/state/audit/source invariants and force client reload. Inspect accepted bindings and unresolved financial work before reopening. Phase 07 requires provider reconciliation/quarantine for recent operations missing from restored local data; successful database startup alone cannot erase an external capture or establish safe purchase admission.

## System Design Prerequisites & Concepts to Learn

Study acknowledgement versus commit, lease versus financial idempotency, durable late facts and bounded escalation. Use the [verification plan](../testing-strategy/verification-scenarios.md) to pause at each owner boundary and inspect persisted evidence; a fast response is not a recovery proof.
