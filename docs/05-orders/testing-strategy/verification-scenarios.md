# Orders Verification Scenarios

**Status:** future manual scenario/evidence plan. This documentation phase creates no automated tests, test project, fixtures, mocks, test dependencies or load harness. SQL/API/simulation scenarios below remain unexecuted.

## Evidence layers

| Layer | Evidence required when implementation exists |
| --- | --- |
| Static/contract | Pinned build/format, route/schema validation, generated migration/grant review and representative payloads |
| PostgreSQL | Real PK/FK/CHECK, immutable column permissions, sums/counts, unique creation and state/audit atomicity |
| API/module | Owner/source boundaries, cursor binding, legal commands, receipts and replay semantics |
| Concurrency/failure | Separate connections/replicas, cancellation/processing/expiry races, lock waits and pre/postcommit interruption |
| Operations/performance | Declared dataset/resources, plans, percentiles/errors, privacy, readiness/shutdown and isolated restore |
| Purchase integration | Tagged synthetic Phase 05 evidence; concrete Checkout simulator in 06; verified provider/financial integration in 07 |

Manual evidence is acceptable until automation is explicitly requested. Preserve existing related tests when application work later touches them. An in-memory database cannot establish PostgreSQL locks/constraint behavior, and simulation cannot establish a provider capture or refund.

## Scenario matrix

| ID | Requirement | Given / when / then |
| --- | --- | --- |
| ORD-V-01 | FR-01; INV-02–05 | Create a complete accepted snapshot with matched active reservation: one PendingPayment/version-1 order, bounded lines, explicit shipping/tax and create audit commit together. Missing required amount/address or invalid line fails without partial state. |
| ORD-V-02 | Creation/replay | Repeat exact intent from separate replicas after commit/response loss and later fulfillment: same identity, no new allocation. Changed owner/reservation/name/address/price/quantity conflicts even if the hash is deliberately colliding in isolated verification. |
| ORD-V-03 | Snapshot immutability | Rename/reprice/archive product and change source address. Stored lines/address/components remain identical. Attempt snapshot/line UPDATE and parent/line DELETE using API credential; grants deny. |
| ORD-V-04 | Money/bounds | Exercise 1/20 lines, quantities 1/100, one-cent/max unit price, maximum item subtotal and lossless total bounds. Exact products/sums required; omitted tax/shipping cannot default to zero. Fractional/wrong currency/overflow/duplicate lines fail. |
| ORD-V-05 | Address/input | Test all scalar/UTF-8 limits, NFC/trim, controls/newlines, optional null versus empty, countryCode syntax and unknown fields. Structural acceptance is not treated as shipping-region/address-deliverability validation. |
| ORD-V-06 | FR-02/03; ownership | Two Customers cannot read/cancel each other's order and see uniform NotFound. Anonymous/revoked/disabled users and disallowed-source Admin fail. Customer cannot use Admin queue/fulfillment or supply owner/evidence/role fields. |
| ORD-V-07 | History/cursors | First/deep pages, equal timestamps and newly inserted orders follow descending immutable keys without owner leakage. Tamper/expire/change actor/route/limit/status on cursor: Validation.Failed. Admin lists expose no address/line/owner fields. |
| ORD-V-08 | Detail/access audit | Authorized detail has bounded immutable fields. Admin detail appends restricted access audit before response without changing version; failed access-audit insert fails response. Customer/queue reads do not create per-order access events. |
| ORD-V-09 | FR-04; confirmation | Tagged verified full capture and actual matching Consume produce one Confirmed state/audit. Wrong amount/currency/order/intent/quantities or unrelated/Released/Expired stock cannot confirm. Stored Active with elapsed deadline cannot authorize it. |
| ORD-V-10 | Confirmation/replay | Replay exact confirmation evidence after Processing/Delivered/Cancelled: AlreadyApplied, no state regression or stock movement. Different incompatible proof conflicts. Public/Admin mark-paid/failure/completion routes are absent. |
| ORD-V-11 | Failure/financial separation | Definitive failure with terminal stock and safe money resolution yields Failed; a timeout/unknown result does not. Captured but unfulfillable work retains financial truth/compensation. Refund/late capture never rewinds/reopens business state. |
| ORD-V-12 | FR-05; cutoff | PendingPayment/Confirmed owning Customer or restricted Admin request returns committed 202/Requested and one increment. Processing/Shipped/Delivered/Failed rejects. Repeat Requested at current version is unchanged 202; Completed unchanged 200; stale version conflicts first. |
| ORD-V-13 | Cancellation/processing race | Two same-version requests compete. Cancellation winner blocks processing even with refreshed version; processing winner blocks request by cutoff. Inspect cancellation/status/time/version/audit and both responses. |
| ORD-V-14 | Cancellation/confirmation race | Pause coordinator after Order lock. Run both orders: request first suppresses confirmation/consumption; confirmation first reaches Confirmed and remains cancellation-eligible until Processing. No false capture or stock release is invented. |
| ORD-V-15 | Expiry/confirmation race | Hold group/stock across expiry, then resume confirmation versus worker in both orders. Exactly one stock terminal outcome; Confirmed only accompanies Consumed. Expired keeps a non-fulfillable pending/resolved outcome and compensation if captured. |
| ORD-V-16 | FR-06; cancellation completion | Active reservation releases/expires once; Consumed stays consumed. Unknown money leaves Requested. Known no-capture or durable full compensation intent permits Cancelled/Completed with proof/audit; refund settlement may remain pending. Late capture schedules compensation without reopening. |
| ORD-V-17 | FR-07; fulfillment | Restricted Admin goes Confirmed→Processing→Shipped→Delivered with reasons/audit. Skip/repeat/backward transition, Customer command, or Requested cancellation guard fails atomically. Whole-order quantities/address/prices remain immutable. |
| ORD-V-18 | Atomicity/failure | Fail last line, guarded update, transition audit, access audit and commit at controlled points. Inspect complete rollback or acknowledged commit; no partial local Order/Inventory state. Previously committed Payments truth remains. |
| ORD-V-19 | Authority/expiry | Race logout/reset/disable with human command in both lock orders, and hold Order lock past session expiry. Fresh-time checks deny stale authority before version/domain effects; no revoked mutation ordered afterward succeeds. |
| ORD-V-20 | Commit uncertainty | Disconnect before/after commit and reload from another replica. Original stale version cannot repeat an effective human change; current-state equality is not historical receipt proof. Stable internal creation/evidence replay remains safe. |
| ORD-V-21 | Budgets/order | Exhaust shared pool, inject slow query/deadlock/lock timeout, cancel requests and shut down. Bounded sanitized outcomes and no leaks; no path acquires existing Order lock after group/stock or calls provider under locks. |
| ORD-V-22 | Integrity/simulation | Detect invalid count/sum/fingerprint/timestamps, missing references and version exhaustion without automatic repair. Deliberately verify SQL NULL handling. Simulation source is accepted only in explicit isolated Development verification and rejected in normal deployment/HTTP. |
| ORD-V-23 | Performance/privacy | Execute three declared runs and separate deep-history/max-line/hot-order cases; record samples, useful throughput, all errors, response bytes, plans and waits. Logs/metrics/audit contain no addresses/credentials/provider payloads. |
| ORD-V-24 | Restart/restore | Restart after Requested and discover indexed work with block intact. Restore combined backup in isolation, revoke sessions, inspect snapshot/state/audit/Inventory, reconcile financial owner evidence when integrated and measure RPO/RTO. |

## Controlled concurrency and simulation

Use synthetic identities/orders and separate PostgreSQL connections/API replicas. Record starting version/snapshot/reservation, pause at a documented lock boundary, release participants in both orders, and inspect final parent/lines/audit plus Inventory balances/movements. Never add wait hooks or bypass endpoints to production behavior. Creation replay must show absence of an existing Order lock after Inventory; cancellation/processing evidence must include a deliberate refreshed-version processing attempt after the request wins.

Phase 05 verification uses restricted tagged synthetic financial evidence with stable IDs and actual Inventory transitions where infrastructure exists. State exactly which financial facts were simulated, who supplied them and how HTTP/normal deployment cannot use that source. Phase 06 replaces abstract coordinator evidence with concrete durable simulator/attempt/recovery behavior; Phase 07 establishes provider amount/currency/idempotency/callback/refund facts. Keep these evidence layers separately reported.

## Evidence and implementation Definition of Done

Record scenario/requirement IDs, revision, environment, exact synthetic setup/requests, expected/actual results, server correlation, final database observations and Passed/Failed/Not run/Not applicable with reason. Keep credentials/address-bearing records out of shared reports. Race proof includes both participants, final version/status/cancellation/audit and stock outcome. Money proof includes verified source identity/mapping and compensation disposition rather than an arbitrary Boolean.

Phase 05 implementation exits when local snapshot, ownership/history, explicit lifecycle, request block, replay/atomicity, required audit, simulation isolation and operating gates pass with the [quality targets](../non-functional-requirements/quality-targets.md) and [global Definition of Done](../../00-project-overview/global-definition-of-done.md). Missing PostgreSQL, replica/load/restore infrastructure leaves its gate Not run. Checkout/Payments integration stays open until those phases execute it. Documentation/link/schema checks cannot claim an order race, financial resolution or restore succeeded.

## System Design Prerequisites & Concepts to Learn

Study controlled interleavings, SQL three-valued logic, durable proof and financial uncertainty. The [prerequisites](../system-design-prerequisites.md) explain the mechanisms; evidence must establish each invariant at its actual owner.
