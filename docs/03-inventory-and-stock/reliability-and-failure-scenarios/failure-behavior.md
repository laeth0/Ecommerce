# Inventory Failure and Recovery Behavior

**Status:** expected state after concurrency and failure. [Schema and transactions](../database/schema-and-transactions.md) define the commit boundary.

## Concurrency outcomes

| Race or retry | Required outcome |
| --- | --- |
| Two new intents compete for one available unit | At most one group becomes Active with a Reserve movement. The loser has no committed group/line/movement and gets `InsufficientStock` or a bounded dependency failure under lock overload. |
| One multi-product request has an unavailable line | All group/line/balance/movement writes roll back; no partial reservation remains. |
| Two requests use one intent UUID and identical lines | One unique group commits; the other returns that group's current outcome with no second allocation. |
| One intent UUID is reused with altered lines | Return `IntentConflict`; do not mutate either request's stock. |
| Consume races Release or Expire | Group lock selects one terminal state. The loser sees it and writes no movement. A late payment after expiry cannot be treated as fulfillment stock. |
| Expiry deadline arrives while worker is stopped | Active reserved units remain withheld until a worker or caller expires the group; Consume at/after deadline checks database time and fails. |
| Two Admin adjustments or a repeated operation UUID overlap | Different operation UUIDs each apply their signed delta serially if valid; one UUID commits at most one adjustment. Same UUID with different actor or payload conflicts. |
| Admin adjustment races reservation or product archive | Catalog/stock locks establish order. The adjustment cannot make `on_hand < reserved`; archive does not erase already reserved units or stock history. |
| Admin revocation races adjustment | Identity share/update locks establish order. Revocation first denies mutation; adjustment first leaves durable actor/movement evidence. |

## Crash and dependency boundaries

| Failure point | State and response |
| --- | --- |
| Before reservation/adjustment commit | PostgreSQL rolls back all group, line, balance and movement work. A caller timeout still requires checking the stable intent/operation identity before concluding no commit. |
| After commit but before response | Durable group or movement exists. Retry with the same intent/operation UUID returns its stored outcome/receipt after authorization; a new identity could create a second effect and must not be used casually. |
| Movement insert or constraint fails | Roll back the entire balance/group transaction; sanitize the error and investigate a repeated failure. |
| Worker dies before expiry commit | Group remains Active and indexed as due. Another wake/replica resumes it. |
| Worker dies after expiry commit | Group is Expired, reserved decrement and movements are durable; replay is a no-op. |
| PostgreSQL unavailable, pool exhausted, or lock wait times out | Return bounded sanitized `503` for Admin API; internal caller receives `Unavailable`. Never return a valid-looking reservation/consume success without committed evidence. |
| Identity unavailable during Admin adjustment | Deny with `503` before stock mutation; internal worker can continue if Inventory database is reachable. |
| Catalog unavailable when reserving | New reservation fails; an already committed intent can be replayed from Inventory state without new Catalog validation. |

An overdue Active group is ineligible for consumption even if the worker has not yet committed its release. A Consume/Release attempt on it commits Expired and returns that outcome. Inventory does not create a financial result: Phase 06/07 must preserve verified payment truth and compensate late success when no stock can be consumed. A refund never automatically changes `on_hand`.

## Safe retry and reconciliation

`GET` stock is safe to retry and may observe a later state. An Admin adjustment timeout is uncertain: retry only with the same operation UUID and identical canonical fields. A reserve timeout is uncertain: retry with the same intent UUID and exact sorted lines. Terminal operations can be retried with reservation ID plus expected intent; the group state prevents repeated movement. An insufficient-stock or not-sellable attempt that rolled back may be retried later with the same intent after conditions change; no failed group was committed. Do not assume an immediate absence check proves rollback while the first transaction may still be running.

After a database/worker outage, first restore reachability and migration compatibility. Resume the worker; it finds due Active groups from PostgreSQL. Run read-only reconciliation of each item's counters against movement deltas and Active lines. A mismatch is an incident: pause Inventory mutations under controlled maintenance, inspect transaction/audit evidence and use a separately reviewed correction procedure. Do not rewrite movements, reset counters from a cache, or automatically restock a paid order.

Backup/restore covers Identity, Catalog, Inventory and later Orders as one local database at this stage. Verify foreign keys, missing stock items, group/line counts, movement uniqueness and sample stock equations after an isolated restore. Revoke restored sessions before reopening Admin access under the Phase 01 procedure. Report achieved RPO/RTO rather than inferring it from a successful restore command.

## System Design Prerequisites & Concepts to Learn

Study linearization points, unknown commits and crash recovery. Kill the worker before/after commit, pause Consume and Expire on one group, and compare all related rows. The result is correct only if terminal state, balance, movement and caller outcome agree.
