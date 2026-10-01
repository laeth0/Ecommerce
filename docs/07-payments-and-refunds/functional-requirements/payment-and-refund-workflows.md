# Payment and Refund Functional Requirements

**Status:** normative sandbox workflows. MUST/MUST NOT describe required behavior; they do not assert implementation. [API](api-contracts.md), [provider](stripe-provider-contract.md), [system design](../system-design.md) and [database](../database/schema-and-transactions.md) supply exact contracts.

## Invariants and vocabulary

| ID | Required rule | Concrete assertion |
| --- | --- | --- |
| PAY-INV-01 | One accepted source/payment identity per Checkout attempt/Order | Unique attempt, Order and payment operation mappings; source/account/method/amount cannot change after acceptance |
| PAY-INV-02 | Server owns exact monetary amounts | USD integer cents; original amount equals accepted immutable Order total; no body/provider metadata price overrides |
| PAY-INV-03 | Financial evidence survives coordinator rollback | A committed capture remains queryable even if stock/Order application fails |
| PAY-INV-04 | No fulfillment from payment alone | New confirmation requires verified exact full capture and actual matching consumed stock under existing cancellation/time guards |
| PAY-INV-05 | Unknown cannot authorize no-capture | A timeout, provider 5xx/404, search miss or exhausted retries never becomes Rejected/Aborted proof |
| PAY-INV-06 | Monetary conservation | Ordinary mutations preserve `successfulNetRefundMinor + reservedRefundMinor ≤ capturedMinor`; both are nonnegative |
| PAY-INV-07 | Unknown refund keeps its amount reserved | Neither response loss nor lease expiry makes that amount available to another refund |
| PAY-INV-08 | Refund settlement and Order lifecycle are separate | Refund never changes Order status/address/totals or applies a stock movement |
| PAY-INV-09 | Evidence and corrections are retained | A correction appends linked facts; no financial fact is overwritten/deleted |
| PAY-INV-10 | Every financial instruction is attributable | Accepted Admin refund, compensation coverage, provider fact and operator repair have required transactional audit |
| PAY-INV-11 | Source separation | Simulator operations never call Stripe; Sandbox evidence requires the original approved account and false livemode |
| PAY-INV-12 | Bounded recovery with honest visibility | Unresolved work becomes explicit ManualReview; exact retries reuse original identities and frozen request parameters |

Captured is a historical gross money fact; refund does not erase capture. `refundStatus` is a current aggregate: None when S=0; Partial when 0<S<C; Full when S=C. `recoveryStatus` is Scheduled/Idle/ManualReview. These are independent of payment/business lifecycle. A verified reversal can change Full back to Partial/None. No customer funds are claimed to have reached a bank based on sandbox or an initial refund response.

## PAY-E1 — Durable financial identity

### PAY-FR-01 / PAY-S1 — Freeze the accepted sandbox source

**Actor:** trusted Checkout and protected local operator. **Preconditions:** eligible Customer, unaccepted valid quote/key, admissible Sandbox configuration. **Trigger:** ordinary Checkout acceptance.

**Flow:** the operator may assign one approved test fixture to `(Customer, Checkout key)` before acceptance. Unassigned purchases use the configured approved Success fixture. Checkout selects an immutable source descriptor, validates the provider's supported amount range, then atomically commits the Payments binding with its accepted purchase. Rejection/rollback creates no financial dispatch. Accepted-key replay loads the original receipt before current source/default/amount checks.

**Validation:** mapping equals accepted attempt/payment/compensation/Order/Customer IDs, USD total and reservation deadline. API version, account identity, fixture code and exact provider payment-method token are frozen. Unknown fixture, invalid configuration, unsupported amount or binding conflict prevents new acceptance. Client/Admin cannot supply or change a fixture.

**Consistency/authorization:** caller-owned acceptance transaction; only protected operator assignment and trusted Checkout can write the source descriptor. Assignment takes the target Customer Identity user UPDATE lock; acceptance already holds its SHARE lock. The winner before source selection is frozen, and assignment waiting behind committed acceptance is rejected. The operator never takes a Checkout attempt lock. No general scenario HTTP route exists.

**Acceptance:** Given an accepted attempt, when the default fixture or active API configuration changes, then its recorded method/version/account and receipt remain identical. Given rollback, then no provider mutation occurs. Given an exact replay after a mode switch, then the original source is retained.

### PAY-FR-02 / PAY-T1 — Prepare or abort one intent

**Actor:** Checkout. **Preconditions:** durable accepted binding; correctly ordered caller transaction. **Trigger:** Purchase/Cancellation recovery.

`EnsurePaymentIntent` creates Prepared once or returns the exact existing intent. `AbortUndispatchedOrInspect` creates an Aborted tombstone for a missing intent or atomically changes Prepared to Aborted; Pending/Captured/Rejected returns actual knowledge. Mapping mismatch is IntentConflict and no effect. Both use the original payment operation UUID; they never independently commit or call Stripe.

**Acceptance:** Given concurrent prepare and abort, when both complete, then one immutable payment identity remains. Given Aborted, when dispatch runs, then it returns the stored no-dispatch proof without provider I/O.

## PAY-E2 — External payment boundary

### PAY-FR-03 / PAY-S2 — Dispatch and observe the original payment

**Actor:** bounded Payments executor. **Preconditions:** Prepared, accepted Sandbox source, no dispatch hold, fresh database time before reservation expiry. **Trigger:** scheduled financial work or Checkout's trusted financial operation.

Under payment lock, recheck source/time, commit Pending plus exact create-and-confirm key/request/send window, release connection, then call Stripe. Response is classified by the provider contract. Persist mapping/facts in a financial-only transaction. Repeated Pending calls retrieve the known original object or retry its exact mutation within the safety window. No second method/confirmation attempt is offered in this phase.

**Expected result:** Captured exact total; Pending/Unknown; or verified Rejected after safe provider closure. An overdue Prepared intent becomes Aborted without dispatch. A dispatch admitted just before expiry may complete later; stock eligibility still decides purchase confirmation. Authentication-required/declined methods are canceled and inspected; a transient decline status alone is not permanent no-capture proof.

**Errors/edges:** response loss, cached 500, concurrent-key conflict, 429, provider outage, late response and mapping unknown all preserve original key and honest knowledge. Retry budget exhaustion makes ManualReview without inventing decline. A newly verified capture remains admissible after escalation or contradictory earlier evidence.

**Acceptance:** Given provider capture and a lost response, when recovery runs, then one original object/capture is recorded. Given an expired safety window with unknown object ID, then no financial POST is retried. Given capture after stock expiry, then no fulfillment is authorized and full compensation is required.

### PAY-FR-04 / PAY-T2 — Admit verified financial facts

**Actor:** Payments classifier. **Preconditions:** authenticated provider response/retrieval, immutable local binding or durable unmatched quarantine. **Trigger:** response, callback-driven fetch or reconciliation.

Validate account credential context, object type, false livemode, original provider/local IDs, metadata correlation, amount, currency and charge capture fields. Store one stable normalized fact per effect. Capture is only an Order proof when it exactly matches the accepted full USD total. Metadata by itself cannot create a binding. Contradictory verified capture is preserved with an integrity hold; a terminal business outcome cannot reopen.

**Acceptance:** Given an unrelated, live-mode, foreign-currency or wrong-amount object, then no purchase proof/confirmation is emitted; durable bounded quarantine retains investigation evidence. Given API response and multiple distinct events describing the same effect, then the financial balance/version changes once.

## PAY-E3 — Callbacks, reads and recovery

### PAY-FR-05 / PAY-T3 — Durably accept authenticated callbacks

**Actor:** configured Stripe endpoint. **Preconditions:** permitted HTTPS ingress, raw uncompressed body/signature bounds. **Trigger:** event POST.

Verify original bytes and timestamp using the endpoint secret before trusting event fields. Extract only a bounded event identity/type/API version/object reference/account context/livemode/hash. Commit the event hint or recognize a matching durable duplicate, then return 200. Invalid signatures return a sanitized 400 and cause no durable business write. Supported events schedule retrieval; ignored types commit an Ignored receipt. Unknown versions/mappings become quarantined records.

**Edges:** a repeated event ID with conflicting object/type/mode is an incident; preserve the original and quarantine the delivery. Separate event IDs for the same fact are safe. Invalid/tampered/stale requests cannot schedule financial effects. Raw body/signature are not retained or logged.

**Acceptance:** Given database commit failure, then ingress returns 503 and does not acknowledge durability. Given valid duplicate or reversed event order, then original money facts are neither repeated nor regressed. Given provider outage, then durable inbox processing remains scheduled/ManualReview rather than blocking ingress on provider I/O.

### PAY-FR-06 / PAY-S3 — Read current own financial progress

**Actor:** owning Customer or restricted Admin. **Preconditions:** current eligible account/session and mapped retained Order. **Trigger:** dedicated financial-summary/refund-history GET.

Return original amount, source, current payment state, captured/net-refunded/reserved/available amounts, aggregate refund status, compensation status, financial version and recovery state. Never return payment-method token, provider ID, client secret, webhook payload or Admin reason. Admin sensitive reads commit access audit before response. These reads use a coherent primary snapshot and cause no provider call/dispatch/wake.

**Errors:** absent/nonowned Order is identical 404; authorized old Order without an accepted financial binding is Payments.PaymentNotAvailable. Simulator projection uses its owner and `source=Simulator`; new discretionary refund mutation on such a source is rejected.

**Acceptance:** Given Customer A and B, then A cannot inspect B's financial state or refund IDs. Given an unknown refund, then its reservation and Scheduled/ManualReview status are visible. Given a later refund reversal, then the current net amount changes while historical capture and Order total remain.

### PAY-FR-07 / PAY-T4 — Reconcile and wake without reversing lock order

**Actor:** financial worker/operator. **Trigger:** scheduled due work, known event hint, unresolved dispatch, periodic retained-object scan or postcommit wake retry.

Retrieve original PaymentIntent/charge/refund IDs within provider budgets; unknown-create lookup uses an exhaustively paginated bounded interval scan with persisted continuation. Empty/eventually consistent search is not definitive absence. Apply under parent lock and fence; commit; wake Checkout outside financial locks. Discovery covers lost callbacks and failed wakes. At most ten unsuccessful observations per cycle; only genuinely new evidence or audited operator resume starts another cycle.

**Acceptance:** Given a failed postcommit wake, when discovery runs, then Checkout sees the same committed fact and can resolve/compensate. Given a stale worker, then its scheduling state cannot overwrite a newer lease/result. Given a late capture after ManualReview, then it remains durable and wakes original compensation work.

## PAY-E4 — Refunds and compensation

### PAY-FR-08 / PAY-S4 — Accept a restricted Admin full or partial refund

**Actor:** eligible restricted Admin from an allowed source. **Preconditions:** Sandbox capture, matching current financial version, no integrity hold/full-compensation case, positive currently available amount. **Trigger:** POST refund with one original key, expectedVersion, exact cents and normalized required reason.

Lock/recheck Identity and payment. Inspect an accepted Admin key before new guards. Exact replay returns the immutable original 202 receipt even after settlement/version changes; changed payment/body conflicts. For a new key, validate version, capture/hold and `amount ≤ C−S−R`. Reserve amount, insert Prepared refund, frozen provider key/request, required audit and scheduled work, then commit. Provider call occurs later.

Full means the explicitly supplied amount equals the available remaining amount observed under the lock; there is no `full=true` or omitted-amount convention. Refunds may include shipping/tax cents because they operate against the total capture, with no line allocation in this phase. Any captured Order lifecycle is eligible. No automatic Order cancellation/restock/return is implied.

An accepted instruction sets the irreversible refund_started latch. Under the owner's confirmed policy, if historical purchase confirmation has not yet committed, Checkout stops that purchase, releases eligible stock, covers the full remaining capture and fails Unfulfillable (or completes an already-requested cancellation). This safe branch is specified in [system design](../system-design.md#refund-before-confirmation). After confirmation, the refund preserves the Order lifecycle and stock. A failed/voided refund does not clear the latch or resume an unconfirmed purchase.

**Errors:** stale version 409; changed accepted key409; no capture/amount/hold/source restriction409; infrastructure503; malformed body 400. Rejection does not bind the key. Response loss requires the original body/key. Another Admin cannot replay a key owned by the first actor; authority and scope are independently enforced.

**Acceptance:** Given capture 5,498 and a prior net refund 1,000 plus pending reservation 2,000, then a new refund may be at most 2,498. Given two simultaneous full requests from the same version, then one accepts and the other is stale. Given Delivered, then a valid refund accepts while status and stock remain unchanged.

### PAY-FR-09 / PAY-T5 — Execute, settle or reverse a refund

**Actor:** Payments executor/classifier. **Preconditions:** exact accepted refund mapping/reservation. **Trigger:** due work/provider evidence.

Commit Pending and mutation timing before I/O. Retry the original frozen request/key only within its safe window. Unknown retains R. Verified success converts R to S once; verified failure/canceled status releases Admin R or preserves a compensation failed hold. Refund `requires_action` is unsupported, remains reserved and enters ManualReview. Do not instruct a customer to authenticate through this backend phase.

On verified failure after prior success, append one linked reversal and decrease S exactly once. A compensation case atomically reserves the reopened gap. Preserve original success and failure evidence. Failed never silently retries with a fresh key. A fresh Admin request after definitive failure is a new deliberate business instruction with new current version/key; a compensation replacement follows the protected repair protocol.

**Acceptance:** Given timeout, then no other refund can spend its reserved cents. Given repeated success or failure, then balances/version/audit have one effective application. Given Succeeded then provider Failed, then the reversal and remaining obligation are visible and an older Succeeded event cannot undo them.

### PAY-FR-10 / PAY-T6 — Cover full remaining capture for cancellation or stock loss

**Actor:** Checkout. **Preconditions:** verified capture and ordered caller transaction, terminal stock/business resolution guards. **Trigger:** cancellation, stock loss or late capture.

Use the stable compensation operation UUID to create/replay one full-compensation case targeting C. Existing successful/outstanding refunds count as coverage; allocate only the uncovered difference under payment lock. Persist case/coverage evidence, necessary Prepared refund(s), reservations/work/audit in the caller transaction before Orders completes cancellation/failure. Original cause is retained; another permitted cause returns the same valid coverage instead of creating a reason-only conflict.

If an outstanding Admin refund later fails, its released amount is immediately allocated to the case. If a compensation refund fails, its FailedHold remains reserved until a protected operator validates failure and atomically replaces that allocation. Unknown/Pending cannot be replaced. New allocations have durable unique identities and never re-send an old ambiguous effect under a new key.

**Acceptance:** Given C=5,498, S=1,000 and R=2,000, then first coverage allocates 2,498 and `S+R=C`. Given the 2,000 Admin refund later fails, then one new 2,000 case allocation is reserved atomically. Given fully refunded capture, then coverage needs no new provider refund. Given cancelled Order and later refund failure, then Order remains Cancelled and financial ManualReview/debt is visible.

## PAY-E5 — Operations and release evidence

### PAY-FR-11 / PAY-T7 — Resume or repair through protected operator authority

**Actor:** authenticated local operator with explicit environment privilege; ordinary Admin HTTP has no recovery override. **Trigger:** diagnosed ManualReview.

Resume preserves IDs/parameters/windows, increments an audited recovery cycle and schedules original work. Permanently failed compensation replacement requires current provider failure evidence, no possible pending/success effect for that allocation, a normalized reason and one unique repair-request UUID. Lock payment/case/old refund; exact repair replay returns its original replacement. Release the old FailedHold and reserve one replacement atomically. Never set paid/refunded, erase a fact, extend stock or reopen the provider safe retry window.

**Acceptance:** Given repair response loss, then the original repair UUID produces one replacement. Given Unknown or unverified failed status, then repair is rejected with no released reservation. Given no privileged operator credential, then no resume or replacement is permitted.

### PAY-FR-12 / PAY-T8 — Preserve safety across source rollout and restore

**Actor:** deployment/recovery operator. **Trigger:** enabling Sandbox, rolling compatible binaries or restoring backup.

Validate schema/protocol/API version/account/false-livemode/worker/callback/secret configuration before admission. Retain or quarantine Simulator recovery using its original owner; never backfill it as Sandbox. Restore all owner schemas together, hold purchase and fulfillment, reconcile the provider over the possible lost interval, quarantine unmapped objects and recover preserved keys/facts before reopening. Document unreconciled identities and the RPO/RTO evidence.

**Acceptance:** Given source switch, then old synthetic proof cannot authorize provider dispatch. Given a backup before a capture/refund, then database startup alone cannot reopen purchasing; the financial gap is reconciled or quarantined with explicit hold.
