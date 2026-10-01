# Orders Failure Behavior

**Status:** proposed failure/recovery contract. The [workflows](../functional-requirements/order-workflows.md) and [transaction protocol](../database/schema-and-transactions.md) determine business outcomes; Payments remains financial truth and Inventory remains stock truth.

## Failure matrix

| Scenario | Required behavior | Evidence/recovery |
| --- | --- | --- |
| Duplicate creation, same intent/snapshot | Unique intent/reservation and group serialization return the original order identity; no allocation or order duplication | Compare immutable snapshot, fingerprint, parent/lines and create audit |
| Intent replay changes owner/address/amount/lines | Typed IntentConflict; whole caller transaction rollback | Original snapshot unchanged; no new order/reservation |
| Product renamed/repriced/hidden or current Catalog fails | Historical reads retain saved SKU/name/price; no Catalog dependency is introduced | Snapshot bytes/equations unchanged |
| Failure inserting parent/last line/create audit | Roll back all local attempt/reservation/order work | No partial accepted purchase |
| Cancellation wins before processing | Requested commits; later processing fails even with the new version | Request/version/audit and unchanged processing time |
| Processing wins first | Later cancellation is stale or past cutoff and cannot change the order | Processing state remains; no Requested flag |
| Cancellation races confirmation | Order lock serializes; a request winning first blocks new confirmation/consumption. Confirmation winning first still permits cancellation while Confirmed | One coherent business state; stock/financial evidence preserved |
| Expiry races confirmation | Inventory decision after group/all stock locks decides eligibility; Expired cannot confirm | Consumed+Confirmed or Expired+pending/failure/cancellation recovery; never false confirmation |
| Capture known, mapped stock Expired/Released | Order remains non-fulfillable; record durable compensation work; only permitted failure/cancellation completion follows safe financial resolution | Preserve capture at Payments, no stock allocation fabricated |
| Provider result unknown or timeout | No invented capture/failure/no-capture; retain PendingPayment or Requested and durable coordinator recovery | Phase 06/07 owns reconciliation and pending-age limits |
| Late capture on Failed/Cancelled | Record financial truth and schedule idempotent compensation; never reopen confirmation or fulfillment | Terminal Order retained, visible financial recovery |
| Refund fails or is partial | Preserve capture/refund truth and existing business lifecycle; cancellation compensation remains visible | Refund cannot rewind Delivered or increase stock |
| Active stock released by cancellation | Release/expiry through Inventory once | No duplicate terminal movements |
| Cancellation after stock Consumed | Keep consumption terminal; no automatic on-hand increment | Separate verified Admin physical adjustment if needed |
| Duplicate confirmation/failure/completion proof | Exact stored source/proof is AlreadyApplied with no version/audit/stock change; incompatible proof conflicts | Current business state may be later than the original applied transition |
| Duplicate human transition | Original stale version conflicts; a current-version repeat of fulfillment is InvalidTransition | No second transition/audit |
| Repeated accepted cancellation | At current version Requested returns unchanged 202; Completed returns unchanged 200 | No new request time/version/audit; stale version still conflicts |
| Audit insert failure | State/sensitive read fails; transition rolls back with every local owner effect | No unrecorded mutation or Admin detail success |
| Crash before local commit | Roll back and release resources | No partial state/lines/audit; previously committed financial truth remains |
| Crash/disconnect after commit before response | Local action may have succeeded; client reconciles through detail/current version | Do not infer rollback from timeout or replay with a refreshed version automatically |
| Identity revoked/disabled or expires while waiting | Shared lock order/fresh-time check denies a write ordered after revocation/expiry | No unauthorized effective mutation |
| PostgreSQL outage, lock/pool timeout, deadlock | Bounded sanitized failure, whole transaction rollback where known, uncertain commit reported honestly | No local cache/empty history/status fallback |
| Missing line/reference, wrong sum/fingerprint or version exhaustion | Integrity failure and restricted alert; no truncation/clamping/automatic repair | Operator inspection before further affected writes |
| Admin queue state changes between pages | Each page is its own authorized snapshot; refresh to see changed membership | Cursor is a position, not a queue claim or whole-history snapshot |
| Simulator proof in normal deployment | Deny source/invalid configuration; no confirmation | Public/Admin caller cannot enable simulation |
| Backup restore loses recent purchase records | Keep ingress/fulfillment held until combined invariant and provider reconciliation procedures complete | Revoke sessions, reload clients and quarantine mismatches |

## Unknown commit and replay

No automatic write retry is introduced here. Human commands use expectedVersion and explicit transitions. After an uncertain result, read the current Order and decide whether another command is appropriate. Matching current status does not prove which request committed, and a changed status may reflect subsequent work. Never replace a failed/stale version automatically, especially for cancellation. `Retry-After: 1` is a pressure hint, not command deduplication.

Creation replays use stable Checkout intent and exact immutable accepted payload. Trusted transition replays use stable owner evidence/resolution identity; source facts are not replaced merely because a response was lost. An exact confirmation replay after subsequent processing/cancellation is AlreadyApplied and cannot consume again or move the Order backward. Incompatible evidence is rejected. Phase 06/07 supplies durable discovery/attempt/compensation records; Orders public request IDs are diagnostic, not idempotency keys.

Before commit begins, cancellation of the HTTP request should cancel/roll back pending work. During/after commit, a disconnected client cannot undo committed state; an acknowledgement loss is uncertain. Materialize the small receipt before commit and avoid postcommit projection I/O. Never continue statements inside a PostgreSQL-aborted transaction. A known DB error cannot be hidden as a domain success.

## Cross-owner recovery

Existing-order resolution locks Order before Inventory. Creation replay performs only an ordinary immutable lookup after group/stock locks, never an existing Order lock. Inventory expiry cannot call Orders while holding group/stock. This avoids cancellation/confirmation lock inversion. If Inventory.Consume determines Expired, the coordinator must either commit that expiry with allowed non-fulfillable recovery/failure/cancellation state or roll the entire local transaction back; it never confirms anyway. Financial evidence already committed by Payments is retained independently and must remain discoverable after that rollback.

Requested cancellation survives restart and blocks all incompatible guards. Orders supplies an indexed bounded discovery read, with no Orders-specific provider/retry worker in Phase 05. Phase 06 owns claiming/recovery and chooses the concrete money-resolution evidence; Phase 07 establishes refund idempotency/provider behavior. Until then, only explicitly labeled isolated simulation exercises completion. Do not describe a pending request as completed because no worker exists yet.

Operator investigation checks snapshot/count/amount/fingerprint, state/cancellation/timestamps, transition audit sequence, matched reservation lines/terminal result and verified financial/compensation records. No automatic snapshot repair, status override or audit rewrite is allowed. Restore the combined database in isolation, revoke restored sessions, check all existing owner invariants, reconcile provider outcomes in Phase 07 and force client reload before reopening purchase/fulfillment. A restored local state alone cannot erase a provider capture.

## System Design Prerequisites & Concepts to Learn

Study local rollback versus committed external truth, request acceptance versus completion, and duplicate proof versus stale human edits. Use the [verification plan](../testing-strategy/verification-scenarios.md) to pause at each commit/owner boundary and inspect persisted evidence. An HTTP outcome alone does not establish stock/money safety.
