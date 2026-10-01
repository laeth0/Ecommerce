# Distributed Workflow Coordination

**Status:** REQUIRED first-extraction protocol. These safeguards precede Phase 11. The user approved the conservative confirmation hold and durable Commerce authorization model.

## Rules and identity

Retain original payment, attempt, Order, reservation, compensation and refund IDs. New private command IDs identify immutable instructions; original provider keys/earliest-send/23-hour windows identify external mutations. Network retries never allocate a replacement identity.

Commerce retains the four Checkout work rows and their fixed lock order: CartCleanup → Cancellation → Compensation → Purchase, then attempt → Order → Inventory group/stock. New local command/decision rows are locked after their parent attempt as defined in [database design](../database/schema-and-ownership.md). Standalone work claims commit before that order. Payments has its own local root → payment → case → selected refunds → work/evidence/outbox order.

Every RPC happens after releasing database transactions/connections. HTTP success is classified against a persisted owner receipt and exact mapping. Timeout/cancellation/5xx/unknown response means Unknown. Worker token fencing cannot undo a committed remote command.

## New state transitions

| Record | Permitted transition / trigger | Forbidden transition |
| --- | --- | --- |
| Commerce command | Pending→Applied/Rejected on matching known owner result; Pending→ManualReview at finite exhaustion/integrity conflict; ManualReview→Pending on attributed corrected cause or genuine new evidence | Applied/Rejected request/result rewrite; Unknown→Rejected solely from timeout; replacement financial identity |
| Confirmation decision | Pending→Committed with actual Consume/Confirmed; Pending→Aborted with safe stock and acquired token, or proved never-admitted acquisition | Terminal decision reversal; missing/unknown remote acquisition treated as never held |
| Payments hold | Held→Finalizing on exact terminal decision; Finalizing→ResolvedCommitted/ResolvedAborted after finite barrier | Expiry/manual review→resolved permission; second identity/token replacing original; resolved decision reversal |
| Fulfillment handoff | Closed→Released on exact usable owner proof; released UUID retained historically | Client override; timeout→Released; Order business version/event changed just for metadata |
| Root stop latch | false→true on original closure; survives initialization and restart | true→false; missing restored root→automatic no-dispatch |
| Remote recovery intent | Pending→Completed/Rejected on definitive attributed outcome; Pending→ManualReview on exhaustion/conflict; ManualReview→Pending by original-ID reviewed resume | Unknown→Completed/quarantine resolved; new event/operation identity as blind retry |

Receipt fields, terminal decisions and mapping identity are immutable. Allowed scheduling resumes change only work metadata. Original Payment/Refund/Inventory/Order business state machines remain governed by phases 03/05/07; this table adds coordination states only.

## Confirmation sequence

```mermaid
sequenceDiagram
    participant C as Commerce coordinator
    participant CD as Commerce database
    participant P as Payments service
    participant PD as Payments database
    C->>CD: Commit Pending decision and Acquire intent
    C->>P: AcquireConfirmation outside local transaction
    P->>PD: Lock root and financial guards; commit Held receipt
    P-->>C: Original token and exact capture proof
    C->>CD: Recheck stock/cancellation; Consume and Confirmed plus Committed
    Note over C,CD: Or Aborted with safe stock; one terminal decision
    C->>P: Resolve original terminal decision
    P->>PD: Commit decision and finite finalization barrier
    P-->>C: Acknowledgement; completion may still be pending
    P->>PD: Apply retained effects and commit safe release
    C->>P: Query original current hold resolution
    P-->>C: Matching release proof
    C->>CD: Record release metadata; allow normal processing
```

Commerce alone commits actual Inventory/Order changes. Payments alone admits financial proof and release. Requests are synchronous private HTTP; the next step is durable local work, while financial-change events asynchronously accelerate discovery. Each gap between commits can lose a response or crash. The persisted identity/decision, rather than elapsed time, determines recovery. No transaction or connection spans an arrow between services.

## Purchase steps

| Step | Owner commit | Next action / failure recovery |
| --- | --- | --- |
| Accept | Commerce quote/reservation/Order/receipt/work/source reference and initialization intent | Return original 202; send initialization after commit |
| Initialize | Payments binding/intent/command receipt/work | Provider dispatch is now eligible only under original gate/deadline/closure rules |
| Capture | Payments original provider mutation and admitted verified facts | Emit durable financial-change hint; Commerce also polls owner evidence |
| Prepare confirmation | Commerce durable Pending decision; Payments Held receipt with token and exact capture proof | New refunds/monetary application blocked until terminal local decision |
| Decide | Commerce actual Consume + Order Confirmed + Committed decision/audit/outbox in one transaction, or Aborted decision with safe stock disposition | Retry terminal decision communication; never infer it from a timeout |
| Finalize | Payments records exact Committed/Aborted decision, drains deferred evidence and resumes owner recovery | Publish/read final resolution and fulfillment release where safe |
| Release/cleanup | Commerce records owner resolution; clears handoff guard; ordinary historical-confirmation Cart cleanup | StartProcessing remains blocked until release; newer Cart intent preserved |

Provider dispatch still requires actual initialized binding and financial mutation commit, fresh deadline and original source/window. An unavailable service is not payment rejection. Reservation expiry remains 15 minutes and cannot extend for a hold.

Query PaymentEvidence for current mapping, capture/no-capture IDs, version and coverage; public FinancialView alone is insufficient for coordination. A deferred-control receipt or Finalizing resolution receipt is immutable acknowledgement, not eventual completion proof. Subsequent evidence/hold queries discover the current result without changing the original receipt.

## Confirmation hold acquisition

Commerce creates one confirmation decision identity per attempt before issuing AcquireConfirmation. Payments locks its integration root then payment and verifies exact source/binding/Order/reservation/accepted amount, current financial version, an admitted full USD capture, S=0, R=0, refund_started=false, closure_requested=false, no integrity hold and no incompatible confirmation record.

On success create one durable Held row and random token, recording capture fact/held version. Admission visibility changes advance financial version once. An exact known command/hold replays its immutable acquisition result before new guards. Public available money becomes 0 and recovery is Scheduled (or ManualReview on exhausted recovery).

A definitive VersionConflict before any admitted hold may lead to a new immutable acquisition command using genuinely newer owner evidence while retaining the original confirmationId. Never issue that successor while the original acquisition is Unknown. A definitive preconfirmation refund/closure result takes the safe abort/compensation branch; it does not retry until the purchase happens to confirm.

The hold does not expire. A worker lease, elapsed deadline, lost connection or manual-review state cannot clear it. No other confirmation identity can replace it.

## Serialized financial application

While Held:

- Deny new Admin refund reservations with existing FinancialHold; successful older receipt replay still returns its original result.
- Record closure/compensation requests durably as deferred control without releasing coverage or granting no-capture knowledge.
- Keep signed webhook ingress operational. Provider retrieval may continue under original limits.
- Append newly verified mapped financial effects to bounded immutable deferred-observation records; do not yet mutate admitted facts/projections/allocations or emit their fact notifications.
- Quarantine malformed/unmatched evidence immediately. Stop new outbound mutations for the held payment; already admitted external operations retain their uncertainty and original identity.

This extends the serialization formerly supplied by the payment row lock. Durable staged knowledge is visible as a financial hold; APIs cannot authorize actions from the prior balance. It does not stop Stripe/Dashboard reality. Once the logical Order decision is known, apply retained effects in original observed sequence through normal correction/equation rules. No verified evidence is silently discarded.

An in-flight retrieval checks the hold under parent locks before application and stages if necessary. Stage each normalized effect once, with exact canonical evidence and its first verified time. Unchanged polls/duplicates do not create effects or reset recovery.

## Commerce decision and races

After acquiring a hold, Commerce reacquires the original local lock sequence and compares the exact stored token/proof. It rechecks Order cancellation/state, authority-independent accepted mapping and fresh Inventory deadline.

For an eligible PendingPayment Order, Inventory.Consume and Order Confirmed commit with decision Committed, confirmation proof/token and the original audit/outbox. Set the new fulfillment handoff guard closed. CartCleanup becomes eligible according to historical confirmation, independently of transport completion.

Keep the existing Purchase work Scheduled until the handoff is resolved, although purchaseOutcome is already historically Confirmed. Its state becomes ManualReview on exhausted command/hold recovery and Idle after proved resolution. Cancellation/Compensation commands similarly project into their original parent work states. The unchanged public Checkout GET still reads at most four work rows and exposes pending/review recovery without a new public schema or unbounded command query.

If cancellation/terminal stock/other local guard prevents confirmation, persist Aborted under the same parent order, releasing/materializing expiry where appropriate. Never mark Aborted while the historical confirmation exists. If the confirmation commit won, future inspection always returns Committed even after cancellation/fulfillment. If cancellation won first, the Order request blocks confirmation and permits only Aborted.

Payments and Commerce clocks do not authorize a lost-result assumption. Commerce's terminal decision is the source of the Order result; only exact authenticated decision communication/query resolves the remote hold.

## Finalization and fulfillment release

ResolveConfirmation records the immutable decision and moves Held → Finalizing. Repeated identical decision is a no-op; changed token/decision/proof conflicts and remains held for review.

Under the integration root lock, the transition to Finalizing fixes a sequence watermark covering every effect/control staged before that transition. The Payments worker drains records through this watermark in bounded passes and preserves normal financial corrections. Later observations use ordinary application because the Commerce decision is now known; they still serialize under the root and cannot bypass integrity checks. New discretionary refund admissions remain blocked until resolution. This finite barrier prevents continuous webhook traffic from extending the original barrier indefinitely.

Retain first_verified_at in deferred evidence. On initial admission of a deferred financial fact, facts.observed_at is the actual primary-clock application time, which also supplies its new Phase 09 event time. Do not backdate a new event or rewrite an existing frozen event. Capture/amount/mapping integrity anomalies retain integrity_hold and suppress release. Normal postconfirmation refunds follow the existing policy: they do not rewind Order/stock.

After the retained application barrier completes, state becomes ResolvedCommitted or ResolvedAborted. For Committed with intact mapping and no integrity hold, create one immutable fulfillment-release UUID. Commerce retrieves/verifies it and records the guard release in a local transaction. This metadata update does not increment Order business version or publish a second lifecycle event.

Processing is allowed only after historical confirmation, cancellation None and recorded release proof. Until that proof is recorded, Payments unavailability/unknown resolution blocks fulfillment. Once recorded, the handoff guard requires no fresh Payments RPC; ordinary postconfirmation rules and explicit operator integrity containment apply. Release proves the completed original handoff, not a promise that no future provider correction can occur. No public boolean can open the guard.

For Aborted, retain no fulfillment release. Resolve original closure/compensation before Order Failed/Cancelled as required. If the hold cannot be reconciled, its finite recovery cycle reaches alerted ManualReview while the hold remains effective.

A resolved Committed decision with integrity_hold=true retains no usable release and remains visible for owner review. Only attributed proof-based reconciliation of the original mapping/equations/provider evidence can remove that integrity cause; the resulting owner transaction creates its first release UUID if none exists. If a release was issued earlier, keep that identity and historical evidence. There is no unconditional “clear hold” operation.

## Cancellation, closure and compensation

Customer/Admin cancellation still commits locally before Processing and blocks local confirmation/fulfillment. Send RequestClosure using the original payment identity. A pre-initialization integration root stop latch prevents later first dispatch; Payments can issue definitive no-dispatch evidence only when it proves no earlier dispatch under its intact epoch/history. Missing restored binding is not proof.

Known Pending provider operation remains Unknown until original canonical no-capture/capture evidence. Payment timeout or stock expiry alone cannot authorize terminal failure. Late capture on expired/released/terminal stock is compensated through the original case and cannot confirm.

For captured funds, send EnsureCompensation with original case UUID/cause. Payments reserves uncovered C−S−R under its parent lock, counting prior successful/outstanding refunds. Commerce completes terminal Order cancellation/failure only after known safe no-capture or a durable remote full-compensation obligation, plus terminal mapped stock. A lost coverage receipt repeats original case identity.

Consumed stock remains consumed; no automatic restock. Failed compensation retains failed coverage for existing protected repair. Unknown refund does not release R or justify a replacement UUID.

## Admin refund flow

Commerce commits authorization and command identity; Payments atomically validates current financial version/source/capture/hold/coverage, reserves amount, creates proposed refund UUID/provider mutation/work and original public receipt/audit. Known admission gives public 202. A hold wins before admission → FinancialHold and no allocation/key binding; admission wins first → refund_started and confirmation acquisition fails.

Public timeout leaves the authorized command active/Unknown. Retry the same key/body and command; current authority is required on each public attempt. Permanent business rejection closes only that command, not its public key for future authorized submissions. System command retries retain the original actor/authority receipt after later revocation.

## Events, polling and exhaustion

Financial-change events are hints. Intake deduplicates, records highest version and schedules existing work only for a genuinely newer owner version. It never authorizes Consume/confirmation from the payload. A missing event is covered by bounded owner polling/retained reconciliation.

Each command/hold recovery cycle has at most ten claimed network observations, using existing 1,2,4,8,16,30-second capped backoff. Record due time, attempt and 30-second lease before I/O; action≤10s/RPC≤2s. A result is applied locally only under the current token. Exhaustion enters ManualReview and alerts; original command/hold/keys remain.

Payments may query Commerce's durable decision outside all locks. A legitimate Missing decision triggers investigation, not automatic Aborted; a new pending decision can be closed only by Commerce under its original Order lock. A duplicate event, restart or unchanged poll never resets a cycle. Genuine owner facts or attributed original-ID resume may start a new reviewed cycle.
