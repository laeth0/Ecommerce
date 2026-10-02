# Distributed Workflow and Compensation Analysis

## Worked purchase and its proof boundaries

Example: two products total USD 49.98; shipping USD 5.00; simulated tax zero; accepted capture target **5,498 cents**. Prices/address/lines are the immutable accepted snapshots. This example introduces no discount/tax feature.

| Step | Committed proof | Failure immediately afterward | Recovery / forbidden inference |
| --- | --- | --- | --- |
| Quote acceptance | Commerce receipt, Order, reservation, original source/payment/compensation mapping, four work rows and Initialize intent | Process dies before returning 202 | Same customer key/body reads original receipt; no second reservation |
| Initialize | Payments original binding/intent/command receipt | Response lost | Original command lookup/replay; no new payment ID |
| Possible provider send | Original mutation parameters/key and earliest possible send stored before I/O | Executor dies before observing response | Retrieve original objects/evidence; preserve 23-hour safe POST window |
| Verified capture | Exact account/PI/Charge/USD/amount mapping and owner fact | Broker/hint link lost | Existing owner polling/retained scan discovers capture; event is optional acceleration |
| Prepare | Commerce Pending confirmation decision and Acquire command | Peer outage | Original acquisition stays Unknown; no successor while admission uncertain |
| Held | Payments token/capture proof/held version and immutable receipt | Response lost | Original receipt/hold query; no second hold or timeout release |
| Decide | Actual Consume + Confirmed + Committed decision/audit/outbox atomically, or safe Aborted | Process dies after DB commit | Recover terminal decision; never consume twice or reverse it |
| Finalize | Payments terminal decision and fixed deferred sequence watermark | Executor dies mid-drain | Resume original barrier; effects applied once under owner locks |
| Owner resolution | ResolvedCommitted/Aborted and usable release only if integrity intact | Commerce misses result | Query exact original hold; no public override |
| Local release | Commerce records exact owner release proof | Payments becomes unavailable | Ordinary Processing may proceed under existing local rules; original proof remains historical |

No step holds a database connection across a service/provider arrow. Source material is the [Phase 10 coordination protocol](../../10-microservices/reliability-and-failure-scenarios/workflow-coordination.md); this phase supplies failure reasoning and evidence obligations, not a substitute protocol.

## What makes this a saga

Acceptance, payment admission, stock decision and refund allocation are separate local commits. The coordinator persists which original step needs knowledge/recovery. When a purchase can no longer confirm, an original compensation case requests new financial operations to cover captured money.

The saga does not give isolation automatically. This project adds the specific confirmation hold to prevent a refund from changing the financial predicate between proof acquisition and stock/Order decision. It does not use 2PC or reserve a database transaction over HTTP. Compensation can be pending/failed and must have its own original identity and budget.

## Refund versus confirmation

### Refund admission wins first

1. Commerce durably authorizes the Admin instruction after current role/network/account checks.
2. Payments locks root/intent and admits refund R, original receipt, work/mutation and `refund_started`.
3. AcquireConfirmation cannot admit a fresh full-capture/no-refund proof.
4. Commerce safely stops the unconfirmed purchase, releases active reservation and requests compensation of all remaining captured money.
5. Existing Admin allocation contributes to coverage. Unknown allocation is not released; remaining gap belongs to the original case.

Public timeout between 2 and the response does not make the refund nonexistent. Original receipt lookup resolves it. The approved durable instruction may complete after later Admin revocation; newly submitted public requests/replays still require current authority.

### Confirmation hold wins first

1. Payments admits Held only with exact full capture, S=0, R=0, refund_started=false, no closure/integrity conflict and exact current version.
2. New Admin refund admission receives the existing FinancialHold rejection; no allocation/public accepted-key binding is created.
3. Newly verified effects and closure/compensation controls are retained as deferred evidence/control. External reality can still change.
4. Commerce rechecks cancellation/stock deadline and commits its one terminal decision.
5. Payments fixes a finite sequence watermark and drains retained items; newly arriving effects after the barrier use ordinary owner application because the decision is known.
6. Integrity anomalies keep the handoff closed. Ordinary postconfirmation financial changes preserve historical Order/stock.

Continuous webhooks cannot extend the fixed barrier indefinitely. A lease, circuit cooldown, deadline or ManualReview never ends Held.

## Cancellation and the stock deadline

Cancellation Requested before Processing blocks new confirmation/processing and cannot be withdrawn. If Commerce has not committed Consume, it releases or lets the original reservation expire and resolves payment/compensation safely. If Consume already committed, stock remains consumed and follows manual adjustment policy.

At the 15-minute primary-clock deadline, fresh Consume is forbidden even if payment retrieval/hold recovery is slow. Late success on released/expired/terminal stock is compensation work; it never extends the deadline or confirms that purchase. Unknown capture/no-capture keeps recovery visible rather than inventing a terminal money result.

Failed/Cancelled Order predicates are the original phase-specific closure/coverage rules. A deferred-only control receipt is not proof of no capture or full compensation. Public acceptance, historical confirmation, financial settlement, compensation coverage and notification delivery are distinct outcomes.

## Compensation arithmetic

Let C be verified captured cents, S be net successful refunds after linked reversals, and R be retained Reserved/FailedHold coverage.

- Ordinary allocations require `S + R ≤ C`. Integrity contradictions are retained/held; they are not silently clipped.
- Original full-compensation target remains C. New uncovered amount is `C − S − R` while the equation is valid.
- Unknown refunds retain R. A failed compensation retains FailedHold; a definitively failed Admin allocation releases its R and may expose a gap in the existing case.
- Replacement of a failed compensation refund requires original definitive failure proof, exact amount/case, one unique repair identity and replacement chain. Unknown never qualifies.

For C=5,498, S=1,000 and R=2,000, original case allocation is 2,498. R then totals 4,498, so S+R=C. This is **covered**, not settled. If the 2,000 unknown refund is later successful, its R moves to S without increasing coverage. If a compensation refund definitively fails, its FailedHold remains until protected repair. A subsequent successful-refund reversal reduces S and reopens the uncovered gap in the same case, subject to integrity guards.

A timeout does not release R, refund stock, change C or permit another refund UUID. Provider effects cannot be compensated by editing a local status.

## Knowledge lattice and safe action

| Known information | Safe action | Still forbidden |
| --- | --- | --- |
| Sent original command, no response | Original receipt lookup/replay | New identity; assume rejection |
| Financial hint claims version 9 | Query current owner evidence | Promote local money/version to 9 |
| Held acquired, decision unknown | Query original terminal decision | Release by elapsed time |
| Committed decision, resolution pending | Communicate decision/drain original barrier | StartProcessing before release |
| Covered compensation, refunds unknown | Original retrieval/recovery | Report settled money |
| Restored receipt missing | Reconcile original owner history/provider gap | Fresh charge or fabricated Order |
| Usable release previously recorded | Existing local fulfillment rules | Rewrite historical confirmation after ordinary refund |

Explain every branch using owner records and invariants, then reproduce its crash boundary in [experiments](../testing-strategy/fault-experiment-catalog.md). Traces locate evidence; protected owner history establishes it.
