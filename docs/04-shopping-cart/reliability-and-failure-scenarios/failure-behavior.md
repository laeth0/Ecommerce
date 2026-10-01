# Cart Failure Behavior

**Status:** proposed failure/recovery contract. A display snapshot is temporary; committed Cart intent is durable. The [workflow](../functional-requirements/cart-workflows.md) and [transaction](../database/schema-and-transactions.md) contracts determine outcomes.

## Failure matrix

| Scenario | Required behavior | Durable evidence/recovery |
| --- | --- | --- |
| Two first writes, same owner/version 0 | Unique parent arbitrates; winner may commit version 1; other reads winner in a new statement and conflicts, or hits bounded dependency wait | One parent, no duplicate lines; inspect final version |
| Two effective edits at one version | Parent lock and comparison allow at most one effective commit | Loser leaves version/lines unchanged; client reloads deliberately |
| Two no-op edits | Both may succeed without advancing version/time | No new rows or writes; this is not a lost update |
| Concurrent additions at 19 lines | Parent serializes cap and version; only one new line can fill the slot with the shared precondition | Final count ≤20; rejected addition has no parent/line effect |
| Stale clear/remove | Version mismatch precedes deleting anything, even if the desired line is now absent | Newer customer intent retained |
| Hide/archive/category deactivate races SetItem | Catalog product/category locks determine order; winner's state is rechecked | An addition can commit before later hiding; the next read blocks it. If hide won first, no addition commits |
| Price changes after a cart read | New read shows current snapshot price; stored intent/version unchanged | Future Checkout must establish price acceptance independently |
| Existing line becomes unavailable | Preserve ID/quantity, null hidden fields and line/cart subtotals | Remove/clear remains possible without Catalog lookup |
| Available stock falls to zero | Cart display/edit is unchanged for a publicly sellable product | Inventory remains allocation authority; no cart stock effect |
| Catalog batch fails during GET | Fail the whole GET with `503`; do not return empty/partially hydrated success or label all products unavailable | Retry a read when dependency recovers |
| Catalog fails during SetItem | Roll back parent/line/version transaction, including lazy parent | Existing intent retained; remove/clear has no Catalog dependency |
| PostgreSQL or Identity authority unavailable | Fail closed within request budget; readiness fails | No durable/local cache fallback |
| Crash before commit, or line/parent write fails | Roll back transaction and release connection/locks | Neither partial line state nor version advance survives |
| Crash/disconnect after commit, before response | Mutation may be complete; client outcome is uncertain | Reload current intent; original-version replay cannot double-apply an effective edit |
| Duplicate command after effective success | Original expectedVersion is stale and conflicts; no historical receipt replay | GET provides current state, not proof of original request identity |
| Pool exhaustion, slow query or lock timeout | Bounded sanitized `503`, no fallback or automatic refreshed-version retry | Release resources, record outcome/waits and recover after pressure |
| Deadlock/serialization abort | Roll back entire transaction; report sanitized dependency failure | Inspect order; never resume statements inside the aborted transaction |
| Session expires while waiting | Fresh time eligibility recheck rejects before effect/no-op | No committed unauthorized mutation |
| Revocation races a mutation | Conflicting Identity locks establish order; write ordered after revocation is denied | Before/after authority and Cart state support the outcome |
| Missing referenced product/owner or over-cap persisted cart | Integrity failure `503`, restricted alert and investigation | Do not truncate, delete, clamp or auto-repair data |
| Version/arithmetic exhaustion | Fail closed and roll back; never wrap or round | Operator diagnoses; version evolution requires reviewed contract/migration |
| Cart snapshot transaction held too long | Deadline/cancellation aborts read and releases snapshot | No persistent intent changes; record transaction duration |
| Restart or account logout/disable | Committed Cart survives; logout/disable changes access, not intent | Newly eligible session can read retained intent |
| Restore older backup | Follow combined restore/session-revocation procedure; clients reload authoritative restored state | Inspect Cart invariants and existing Inventory ledger before ingress |

An unavailable public product is a successfully determined business state. A dependency outage is an inability to determine that state. The API MUST preserve this distinction.

## Commit uncertainty and retries

No automatic application retry is introduced for writes, deadlocks, timeouts or conflicts. The operation is state-setting with a version guard, not a durable command-idempotency log. `Retry-After: 1` delays pressure but never authorizes a new expectedVersion. A client can repeat its exact original command/precondition; if an effective write already committed it receives a conflict, while a rolled-back attempt can still apply if the version remains current. No-op repeats can both succeed unchanged.

After losing a response, GET current intent and decide whether further editing is needed. Another transaction may still be in flight or may have changed the cart afterward. A current matching quantity does not identify the earlier request; a differing quantity does not prove it never committed. A clear must never be resubmitted with a newly loaded version automatically. There is no increment API that could add the same quantity twice.

When a request is canceled before commit begins, cancel and roll back if possible. During/after commit, a disconnected client cannot retroactively undo durable work; a failed acknowledgement remains uncertain. Do not return a domain error after a known successful commit just because the client connection closed. Build the compact receipt before commit and avoid a postcommit Catalog query that creates an unnecessary second failure boundary.

## Failure boundaries and recovery

Cart has no expiry worker, event publisher, consumer, retry queue or external provider dependency. Existing Inventory expiry may proceed while Cart requests fail. A product hide does not delete or release reservations through Cart. Remove/clear needs Identity and Cart database state but no Catalog hydration; GET and SetItem additionally need Catalog owner operations.

For an invariant alert, stop admitting affected Cart writes if safety cannot be established, collect restricted parent/line relationship evidence, and investigate the writer/transaction path. Repair requires an explicit operator procedure; no background loop silently rewrites customer intent. Restore the combined database in isolation, revoke restored sessions, inspect Cart owner/product/version/count constraints and the existing Inventory recovery checks, and require fresh client reads before further editing. Backup restore can roll data back in time, so old in-memory versions/receipts are not trusted across that recovery boundary.

## System Design Prerequisites & Concepts to Learn

Study unknown commit versus rollback, statement snapshots, idempotent state-setting and cancellation boundaries. Execute the [manual failure scenarios](../testing-strategy/verification-scenarios.md) against actual PostgreSQL when implementation exists, inspecting committed Cart and unchanged Inventory state. An HTTP timeout alone cannot establish any database outcome.
