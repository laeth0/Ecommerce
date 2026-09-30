# Inventory Verification Scenarios

**Status:** scenario and evidence plan only. This documentation increment adds no tests, test project, fixtures or load harness. Runtime claims require later execution against real PostgreSQL and, where stated, multiple API replicas.

## Evidence layers

| Layer | Required evidence when implementation exists |
| --- | --- |
| Static/contract | Pinned build/format, JSON Schema parse, route metadata, generated migration review, configuration/grant inspection |
| PostgreSQL | Real checks/FKs/unique indexes, lock order, multi-row rollback, `clock_timestamp()` deadlines, movement reconciliation |
| API/module | Exact Admin headers/status/errors and internal Reserve/Consume/Release outcomes, authentication and intent matching |
| Concurrency/failure | Two sessions/replicas, controlled lock order, before/after-commit crash, worker restart, database outage |
| Performance/operations | Declared dataset, plans/buffers, hot-row load, due backlog, readiness, isolated restore |

Manual scenarios are acceptable interim evidence where automation is not requested. An in-memory database cannot establish the PostgreSQL lock/expiry result. Preserve existing related tests if application code is later changed; new automated suites require an explicit request under the repository instructions.

## Scenario matrix

| ID | Requirement | Given / when / then |
| --- | --- | --- |
| STK-V-01 | STK-FR-01; mapping | Given existing and newly created Catalog products, after backfill/new creation every product has exactly one zero-initialized or retained stock item; repeated initialization never resets stock. |
| STK-V-02 | STK-FR-02/03; Admin boundary | Customer, anonymous, revoked Admin and disallowed-source Admin cannot inspect or adjust any item; forged forwarding headers do not bypass Phase 01 controls. |
| STK-V-03 | Input and receipt | UUID, delta, reason and body boundaries follow schema plus semantic normalization; 1 and 1,000,000,000 on-hand endpoints are handled without overflow; success receipt reflects committed counters/version/time. |
| STK-V-04 | Adjustment/idempotency | Two same-operation UUID requests on different replicas add stock once; exact same-actor replay returns original receipt; changed actor/product/delta/reason gets `409` even after later stock edits. |
| STK-V-05 | Reserved stock guard | With on-hand 5/reserved 4, delta −1 succeeds and delta −2 fails without movement. A valid positive delta crossing 1,000,000,000 gets CapacityExceeded. |
| STK-V-06 | Final unit | Two then 100 unique intents contend for one unit. At most one Active group/Reserve movement commits; all losing attempts leave availability nonnegative and no partial state. Record lock timeouts separately. |
| STK-V-07 | Multi-line atomicity | A 2–20-line request whose last line is unavailable or non-sellable creates no committed group, line, balance or movement. Distinct line locking order avoids deadlock across reversed input orders. |
| STK-V-08 | Sellability race | Reserve versus product hide/archive or category deactivate follows Catalog product/category lock order; no new group commits against a non-sellable state that won the lock race. A committed reservation remains durable after later hiding. |
| STK-V-09 | Intent replay | Same intent/lines returns one group after a timeout, after a product price/publication change, and after terminal transition; changed lines return IntentConflict. A failed uncommitted attempt may be retried with the same intent later. |
| STK-V-10 | Consume/release | Consume decrements on-hand and reserved once; release decrements reserved once; duplicate and incompatible terminal requests never create a second terminal movement. |
| STK-V-11 | Exact expiry boundary | At database time just before expiry, Consume can win; at or after expiry, it cannot. Pause worker and verify caller-side expiry returns Expired. Application clock skew does not extend eligibility. |
| STK-V-12 | Worker durability | Kill worker before and after expiry commit; restart one then two workers and verify every due group is eventually processed once. Check skipped locked rows, batch budget, backlog age and no loss. |
| STK-V-13 | Audit/reconciliation | For Adjustment, Reserve, Consume, Release and Expire, movement deltas reconcile to item counters and Active lines. A failed movement insert rolls back state; deliberate sandbox corruption is detected without automatic repair. |
| STK-V-14 | Revocation and outage | Revoke Admin during an adjustment; commit order determines effect. Stop PostgreSQL or exhaust the pool; no stock success appears without durable evidence, and readiness/response deadlines behave as specified. |
| STK-V-15 | Capacity/plans | At 10,000 items/100,000 groups/200,000 movements, capture EXPLAIN plans and the declared normal-load percentiles, throughput, errors, lock/pool waits and expiry lag. Run hot-product pressure separately. |
| STK-V-16 | Restore/grants | Restore a combined sandbox snapshot, revoke restored sessions, verify product/item mapping and stock equations, and exercise API/worker/operator database roles against prohibited writes. |
| STK-V-17 | Checkout transaction boundary | In a local transaction, reserve then fail before Order/attempt commit: no group/stock effect remains. Commit it and crash before provider work: durable attempt/order/reservation can be resumed in Phase 06. |

## Evidence and exit

For each scenario record requirement ID, revision, exact setup/requests, normalized synthetic inputs, expected and actual outcomes, database state/movement evidence, environment and status: Passed, Failed, Not run or Not applicable with reason. Race evidence includes both caller outcomes and the final committed rows. Reconciliation evidence includes the item/product ID, summed deltas and Active-line quantity without customer data. A timeout is an uncertain result until the stable operation/intent identity is inspected after the first transaction settles.

The implementation gate uses these scenarios, [quality targets](../non-functional-requirements/quality-targets.md), and the [global Definition of Done](../../00-project-overview/global-definition-of-done.md). Missing PostgreSQL, replica or load infrastructure leaves the affected gate Not run. Documentation validation does not count as an executed stock race.

## System Design Prerequisites & Concepts to Learn

Study fault injection around commit and deterministic concurrency interleavings. A successful API response is only one observation; inspect balance, group, lines and movement together to prove one business effect.
