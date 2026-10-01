# Checkout Verification Scenarios

**Status:** future manual scenario/evidence plan. This increment creates no automated tests, test project/files, fixtures, mocks, dependencies or load harness. All application/SQL/worker/load/restore scenarios below are Not run.

## Evidence layers

| Layer | Required implementation evidence |
| --- | --- |
| Static/contracts | Actual pinned build/format, schema/route/example validation and generated migration/grant review |
| PostgreSQL | Unique/row/JSON/nullable CHECK behavior, exact mappings, all-or-none acceptance/resolution/audit, four work rows and retained key protection |
| Customer/module | Quote/acceptance/current progress, owner/source isolation, replay and new owner extensions |
| Concurrency/failure | Separate connections/replicas, quote/final-unit/expiry/cancellation races, worker leases and pre/postcommit interruption |
| Simulator | Durable deterministic source plans/proofs, abort gate, full compensation and visible synthetic source |
| Operations/load | Declared dataset/resources, plans/percentiles/convergence, privacy, readiness/shutdown and isolated combined restore |
| Phase 07 integration | Actual provider idempotency/no-capture/callback/refund/reconciliation evidence; simulation does not satisfy it |

Manual evidence is acceptable until automation is requested. Preserve related existing application tests when future code touches them. In-memory persistence cannot establish PostgreSQL uniqueness waits/row locks, and synthetic capture cannot establish a provider payment or refund.

## Scenario matrix

| ID | Requirement | Given / when / then |
| --- | --- | --- |
| CHK-V-01 | FR-01/policy | Given valid cart/version/US address, When previewed, Then sorted exact quoted lines, 500 shipping/0 simulated tax and five-minute expiry commit with no stock/Order/financial effect. |
| CHK-V-02 | Validation | Given null optional address fields and exact scalar/byte boundaries, When previewed, Then valid canonical values pass; non-US/lowercase code, controls, missing/empty/unknown/duplicate fields and malformed integers/media fail safely. |
| CHK-V-03 | Cart/price/publication | Given a quote, When cart version/price/policy/publication/category changes, Then the correct requote/unavailable conflict rolls back the full submission. A name-only edit preserves the quoted accepted name. |
| CHK-V-04 | Expiry | Given quote validity near expiry, When Cart/stock lock waits cross the deadline, Then final fresh database time rejects; transaction start time provides no grace. |
| CHK-V-05 | Acceptance | Given eligible quote and stock, When accepted, Then one Accepted/version-1 attempt, matching reservation/Order, accepted quote, four work rows and audit commit; only Purchase is Scheduled. Receipt is immutable. |
| CHK-V-06 | Local atomicity | Given failures at parent/last line/quote/attempt/work/audit/commit, When interrupted, Then inspect full rollback or actual committed receipt; no Preparing/partial accepted purchase is allowed. |
| CHK-V-07 | Idempotency | Given concurrent same Customer/key/quote from two replicas and response loss, When replayed after expiry/fulfillment/cleanup, Then original 202 body/Location persists and no second purchase/financial operation is created. |
| CHK-V-08 | Changed identity | Given an accepted key, When another quote is supplied, Then IdempotencyConflict; another key for its original quote yields QuoteAlreadyAccepted; original mapping is unchanged. Canonical mismatch cannot pass a deliberately colliding hash. |
| CHK-V-09 | Owner/authority | Given two Customers, Admin, revoked/disabled sessions and foreign IDs/keys, When reading/submitting, Then ownership and role fail closed with uniform scoped errors, no quote/address/receipt leakage. |
| CHK-V-10 | Authority race | Given logout/reset/disable or session expiry while waiting, When acceptance competes in both lock orders, Then a write ordered after revocation/expiry cannot commit; accepted system recovery continues without impersonation. |
| CHK-V-11 | Final unit | Given 100 buyers and one unit, When accepting distinct valid quotes, Then at most one reservation/purchase wins, availability stays nonnegative and losers have no partial effects. |
| CHK-V-12 | Dispatch durability | Given restart after acceptance/Prepared/Pending financial commit, When worker resumes, Then original mappings/plans recover; no financial call preceded acceptance or held a local DB connection/lock. |
| CHK-V-13 | Capture/confirmation | Given Success or Decline, When source proof resolves, Then matching capture+actual Consume confirms once; definitive no-capture releases/fails; mismatched amount/currency/source/order/intent/quantities never confirms. |
| CHK-V-14 | Timeout/late fact | Given TimeoutThenSuccess/NeverResolves, When response is unknown, Then no decline is invented; same operation is inspected; outcome resolves or audited ManualReview remains queryable with zero duplicate charge. |
| CHK-V-15 | Reservation deadline | Given DelayedSuccessBeyondExpiry, When expiry and late capture occur, Then deadline is unchanged, stock terminally expires and full compensation precedes permitted failure; no reacquisition/confirmation. |
| CHK-V-16 | Cancellation dispatch race | Given requested cancellation versus Prepared→Pending, When run in both orders, Then Aborted winner prevents dispatch; Pending winner stays uncertain and stock releases until actual money is resolved. |
| CHK-V-17 | Cancellation confirmation/cutoff | Given cancellation versus confirmation/processing, When both orders are exercised, Then accepted Requested blocks new Consume/fulfillment; Confirmed still permits cancellation before Processing, and later cutoff denies. |
| CHK-V-18 | Cancellation proof | Given Active/Expired/Released/Consumed stock and Aborted/Rejected/Pending/Captured finance, When cancellation resolves, Then only terminal stock plus no-capture/durable full compensation permits completion; unknown stays Requested; consumed stock never increases. |
| CHK-V-19 | Compensation | Given captured unfulfillable/cancelled purchase, When refund repeats/loses response/fails, Then one original compensation ID is used; terminal business state persists; Succeeded finishes work and Failed is ManualReview. |
| CHK-V-20 | Late capture/source scope | Given a manual-review Pending purchase, When delayed simulator capture appears, Then work wakes once and compensates after stock loss; repeated old proof cannot reset retries. Truly new provider capture after a prior no-capture terminal Order is a Phase 07 gate; do not mutate an immutable synthetic Aborted/Rejected proof to claim this scenario passed. |
| CHK-V-21 | Cart cleanup | Given unchanged versus higher-version cart—even same-looking lines—When cleanup runs/replays, Then one clear/version increment or durable Skipped preserves edits. Unconfirmed Failed/Cancelled creates no scheduled cleanup. |
| CHK-V-22 | Historical outcome | Given confirmed purchase then later cancellation, When viewed, Then purchaseOutcome remains Confirmed and current Order cancellation/recovery is separate; no automatic Cart restoration/restock occurs. |
| CHK-V-23 | Lease takeover | Given A pauses beyond 30 seconds after claim, When B reclaims and A resumes, Then stale local effects fail the fence, original financial identity remains and every changed state/audit is coherent. |
| CHK-V-24 | Cross-job ordering | Given Purchase/Cancellation/Compensation/CartCleanup contenders and wake/resume, When paused around all work/attempt/owner locks, Then fixed full-set order holds; no existing work after attempt or Cart after existing Order. |
| CHK-V-25 | Bounded retry/resume | Given repeated Unknown/dependency failure/crash after claim, When ten observations are consumed, Then audited alerted ManualReview occurs; replayed facts do not reset it; verified new fact/operator resume retains all identities. |
| CHK-V-26 | Integrity/grants | Given corrupt count/sum/JSON/owner/receipt/mapping/work/proof/version or API-credential snapshot mutation, When inspected, Then safe denial/alert with no silent repair; nullable SQL CHECK and actual privileges are verified. |
| CHK-V-27 | Simulation isolation | Given every deterministic scenario and enabled normal deployment/forged HTTP scenario, When started/exercised, Then only explicit isolated Development accepts simulator source; restart preserves plan and responses identify simulation. |
| CHK-V-28 | Resources/privacy | Given slow SQL/pool exhaustion/deadlock/financial delay/admission pressure/shutdown, When exercised, Then declared budgets hold, no connection leaks/network-under-lock occurs, and logs/metrics omit private payloads/IDs. |
| CHK-V-29 | Load/plans | Given the declared three-run workload, When measured, Then operation samples/latency/throughput/convergence/errors/bytes and query plans meet every gate; no success-only or simulator-provider claim. |
| CHK-V-30 | Cleanup/retention | Given expired unused versus accepted quotes and retained keys, When cleanup races submit/replay, Then only eligible unused quotes delete in bounded batches; accepted replay protection remains intact. |
| CHK-V-31 | Restart/restore | Given loss at acceptance/financial/lease/audit boundaries and combined isolated backup restore, When resumed, Then due work/source/cancellation recover, sessions revoke, mappings/invariants are inspected and financial reconciliation holds integrated admission. |

## Controlled experiments

Use synthetic accounts/data and separate PostgreSQL connections/API replicas. Record starting quote/cart/version/stock/source/work, pause at the declared lock/commit boundary, release both participants in each order, then inspect every owner/audit. Never add a wait/bypass/paid endpoint to normal production behavior. Show the deliberate refreshed-version processing attempt after cancellation, cleanup after same-looking newer intent, and stale worker after replacement completion.

Simulator evidence includes exact operator assignment/default, accepted source/mapping, persisted dispatch/due times, terminal proof and final stock/Order/compensation/work. Report which facts are synthetic. Financial truth committed before a later local failure must remain discoverable. For unknown commit, inspect/replay the original key instead of resetting data to hide ambiguity.

## Evidence and implementation Definition of Done

Record scenario/requirement, revision, environment/resources, exact synthetic requests/setup, expected/actual result, server correlation and final DB observations with Passed/Failed/Not run/Not applicable with reason. Keep credentials/address-bearing rows out of shared reports. Concurrency evidence includes both responses, final acceptance/Order/stock/work/lease/audit and operation IDs under restricted handling.

Phase 06 implementation exits when quote policy/explicit acceptance, retained replay, atomic local coordination, owner/source isolation, fixed deadline, cancellation/compensation, conditional cleanup, leases/restart/escalation and operating gates pass with the [quality targets](../non-functional-requirements/quality-targets.md) and [global Definition of Done](../../00-project-overview/global-definition-of-done.md). Missing PostgreSQL/replicas/load/restore leaves that gate Not run. Phase 07 actual financial/provider integration remains open; static Markdown/schema review cannot claim an executed race, refund or restore.

## System Design Prerequisites & Concepts to Learn

Study controlled interleavings, database evidence, acknowledgement ambiguity and admissible source facts. The [prerequisites](../system-design-prerequisites.md) explain the mechanisms; establish each invariant at its actual owner before claiming it passed.
