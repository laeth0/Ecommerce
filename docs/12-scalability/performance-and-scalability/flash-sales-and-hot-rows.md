# Flash Sales, Hot Rows and Hot Counters

## Problem and business boundary

A popular SKU concentrates reservations on one Inventory row. A common quota class concentrates counter writes. More requests/replicas cannot safely update one authoritative balance simultaneously without serialization.

No promotion, coupon, waiting room, reservation-priority policy, stock shard, oversell allowance or Redis stock counter is introduced. “Flash sale” here is a workload shape using existing prices, carts, quotes and reservations.

## Conservation

Inventory retains whole-unit on_hand/reserved, with 0 ≤ reserved ≤ on_hand and available = on_hand − reserved. Reserve increases reserved; Consume decreases both by quantity; Release/Expire decreases reserved. Every original movement identity applies once with matching balances/version.

An active group expires exactly 900s after creation. Consume is allowed only before that primary deadline. Cart contents and preview quotes do not reserve stock. Checkout acceptance can fail before any Order/receipt/reservation if stock is insufficient.

## Contention scenarios

| Scenario | Offered input | Required invariant / interpretation |
| --- | --- | --- |
| Last unit |100 eligible Customers, distinct quotes/keys, quantity 1 for stock 1, one bounded simultaneous wave | Exactly one new active reservation at most; subsequent Consume/Release/Expire follows original proof. Others do not create accepted purchase state |
| Small batch |Stock 10,100 contenders quantity 1 | Accepted live reservations ≤ 10, conservation/movements exact; replay consumes no more stock |
| Hot multi-product cart |20 product boundary; one SKU shared, other products disjoint | Sorted lock acquisition, all-or-none reservation; failure leaves no partial groups/movements |
| Same intent/key |Concurrent identical accepted submit vs changed canonical body | Original receipt replay once; changed body conflicts; no duplicate group/order/payment |
| Cart race |Same expectedVersion from devices and cleanup during newer edit | One whole-cart write/version result; stale 409; cleanup clears only unchanged purchased cart |
| Price/publication race |Hide product/deactivate category/edit price while accepting stored quote | Primary acceptance recheck; changed total requires new preview; no stale visibility/price authority |
| Deadline/payment uncertainty |Real expiry while provider observation delayed | No deadline extension/late Consume; original late capture compensation and hold protocol |
| Global counter hot row |Burst within/over fixed window across two replicas | One shared allowance, durable committed counter stages, original 429/503 behavior |

Run purchase contention with isolated existing simulator and provider egress fenced. Genuine financial races remain ≤ 100 objects/original small sandbox rates and are separate evidence. Administrative stock setup requires original authorized adjustment reason/version/idempotency/audit, outside timed traffic.

## Capacity model

If one locked stock critical section averages 5ms, its ideal serial upper bound is 200 turns/sec, before lock queueing, WAL/audit/multi-product work. This is an illustrative calculation, not a measured reservation rate. Measure actual owner critical-section duration and useful reservation turns.

Do not equate all reservation conflict 409s with server failure or successful purchase. Classify validation, quote/canonical/version conflicts, stock unavailability, quota 429, capacity/dependency 503, admitted pending, confirmed and review separately. Exact domain codes/statuses are those of the [existing checkout contract](../../06-checkout/functional-requirements/api-and-module-contracts.md); this phase creates no new “sold out” response.

Capture first/last contender response, p50/p95/p99, selected row lock waits, aborted/rollback count, movement/order/receipt cardinality and final stock equation. Repeat one/two replicas with identical total resources/data; fairness of DB lock scheduling is not a promised FIFO/customer lottery.

## Safe tuning

Shorten nonessential local work and use existing sorted locks/indexes; inspect blocking/audit/WAL cost. Release pooled connections before provider/network/response serialization where already allowed. Preserve transactional audit/outbox and guard rechecks.

Hot quota rows stay separate from domain transactions, so quota→Identity/business order is never reversed. Do not bypass shared primary counters by using independent per-replica limits or Redis INCR without a new reviewed policy.

Optimistic reads can avoid unnecessary earlier work only where the original contract allows; final stock mutation still uses authoritative guard. A stale availability read never authorizes allocation. Partitioning a stock table does not make one product row parallel.

## Failure and recovery

Crash before acceptance rolls back all related work. Crash after acceptance retains original receipt/reservation/payment mapping. Lock timeout is a bounded failed local attempt; uncertain commit uses original identity. Cleanup/expiry/closure/compensation retain Phase 11 budgets/fairness/hold safety.

Any negative balance, duplicate movement, partial group, incorrect accepted total or unbacked Confirmed fails the experiment immediately. Preserve evidence and contain affected admission; do not replenish stock/delete records to hide the failure.
