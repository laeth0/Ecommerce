# Cart Verification Scenarios

**Status:** future scenario/evidence plan only. This phase adds no application code, automated tests, test projects, fixtures, mocks, dependencies or load harness. Documentation checks do not execute these scenarios.

## Evidence layers

| Layer | Evidence required when implementation exists |
| --- | --- |
| Static/contract | Pinned build/format checks, route/schema metadata, representative payload validation, generated migration review and configuration/grant inspection |
| PostgreSQL | Real PK/FK/CHECK behavior, parent arbitration, version guards, line-count serialization and read snapshots |
| API/module | Exact Customer authority, headers/status/problems, no-op acknowledgements, Catalog projection and internal Checkout input |
| Concurrency/failure | Separate connections/replicas, controlled races, pre/postcommit interruption, expiry/revocation and dependency loss |
| Performance/operations | Declared workload, plans/buffers, response bytes, pool/lock waits, health/shutdown and isolated restore |

Use reproducible manual scenarios until automation is explicitly requested. Preserve existing related tests if implementation is later changed. An in-memory database cannot establish PostgreSQL locking/conflict visibility. Mocked HTTP success cannot establish commit order or durable Cart/Inventory boundaries.

## Scenario matrix

| ID | Requirement | Given / when / then |
| --- | --- | --- |
| CRT-V-01 | FR-01; INV-01/02 | Two Customers with different choices read/edit only their own cart. Supplying customer/cart IDs, owner fields or Admin role labels is rejected. An eligible Admin has no access; anonymous/revoked/disabled identities fail appropriately. |
| CRT-V-02 | FR-01/02; lazy creation | A new Customer GET receives virtual version 0, null time and zero subtotal with no persisted parent. First effective addition commits one parent/version 1 and one line; invalid product/quantity leaves no parent. |
| CRT-V-03 | Input and wire contract | Exercise missing/empty/oversized/compressed bodies, duplicate/unknown fields, invalid/lowercase/noncanonical UUIDs, queries, fractions/exponents and version bounds. Check exact headers/status/field errors without reflected values. |
| CRT-V-04 | FR-02; INV-03 | Quantities 1/100 succeed, 0/101/fractions fail. Replacing an existing quantity in a 20-line cart succeeds; a new 21st line fails atomically. Unavailable lines count toward the limit. |
| CRT-V-05 | FR-02/03/04; INV-04 | At current version, same permitted quantity, absent-line removal and empty clear are no-ops with unchanged time/version. Each effective set/remove/clear increments once; clearing 20 lines increments once. A stale no-op conflicts. |
| CRT-V-06 | FR-02; first race | Two first additions at version 0 on different replicas produce one parent. For distinct effective edits, at most one succeeds; the contender loads the committed winner in a fresh statement or returns bounded dependency failure. |
| CRT-V-07 | FR-02/04; concurrency | Race two same-version quantity edits, different-product edits and clear/add. At most one effective change commits. Race two true no-ops and verify both may succeed unchanged. |
| CRT-V-08 | INV-03/05; cap race | With 19 lines, two additions at the shared version never create 21. Inject a failure after line write/before parent update and after parent update/before commit; no partial state survives. |
| CRT-V-09 | FR-03/04; version reuse | Remove/clear a hidden or archived product without a Catalog lookup. Clear to a retained empty parent, refill, then submit an old version: it conflicts; no old version becomes current again. Missing-parent remove/clear at 0 creates nothing. |
| CRT-V-10 | FR-01/02; visibility | Reprice, hide/archive and deactivate/reactivate a category around GET and SetItem. New reads follow Catalog visibility, hide reason/private fields are absent, and a failed SetItem has no effect. A same-quantity SET on a blocked line fails. |
| CRT-V-11 | FR-01; read snapshot | Pause GET after intent loading, change cart lines and Catalog price/state on another connection, then hydrate/resume. Intent, price and status follow the original shared snapshot. Next GET shows later committed data without price-driven Cart version changes. |
| CRT-V-12 | INV-08/09; money | Check one-cent and maximum unit price with quantities 1/100 and 20 maximum-price lines: full maximum is 199,999,998,000 cents. Empty cart has zero; any unavailable line makes full subtotal null. Reject forged prices/currencies and detect persisted invalid currency. |
| CRT-V-13 | FR-02; INV-06 | Add/edit/read/clear publicly sellable products with zero stock and competing carts. Inventory balances, movement rows and reservations remain byte-for-byte/logically unchanged. No Cart route allocates stock or creates a purchase. |
| CRT-V-14 | FR-05; duplicate/uncertainty | Interrupt before commit and after commit/before response. Reload from another replica and retry original version; verify rollback or conflict without duplicate effect. Do not classify matching current quantity as a historical receipt. |
| CRT-V-15 | Identity ordering | Race write with logout, account disable and password reset in both lock orders. Hold Cart/Catalog lock past session expiry; after waiting, the fresh-time recheck denies the write. Inspect final authority and intent. |
| CRT-V-16 | Failure/deadlines | Stop PostgreSQL, fail Catalog hydration, exhaust the pool and hold locks past 250 ms. GET/SetItem fail deliberately, remove/clear make no Catalog call, no fallback returns success, and cancellation releases resources. |
| CRT-V-17 | Integrity/exhaustion | Using deliberate isolated operator corruption, detect a committed version-0 parent, extra line, broken relationship and invalid monetary value. At maximum intent version, effective write fails closed while true no-op remains unchanged. No automatic repair occurs. |
| CRT-V-18 | FR-06; Checkout input | An internal verified owner/version returns bounded sorted intent under parent FOR UPDATE and caller-owned transaction. Empty/stale outcomes are distinct; caller rollback leaves Cart untouched. Competing edit waits/fails; no independent commit or provider call occurs. |
| CRT-V-19 | NFR-01–09; capacity | Run the declared three normal workloads and separate hot-owner/max-line/outage cases. Record every class/sample count, useful throughput, errors, response size, plans, query count and pool/lock waits. |
| CRT-V-20 | Operations and privacy | Inspect actual API/migration/operator grants; API cannot delete parents or perform DDL. Verify readiness/liveness, 15-second shutdown and that logs/traces omit credentials, raw paths, shopping payloads and unbounded metric labels. |
| CRT-V-21 | NFR-10; restore | Restart without clearing carts, then restore a combined backup in isolation. Revoke restored sessions, inspect Cart and existing Inventory invariants, issue fresh credentials and reload before editing. Record measured RPO/RTO. |

## Controlled race procedure

Use two database connections or API replicas with synthetic Customer credentials. Record the starting parent/version/lines, place controlled pauses after parent discovery or before acquiring required locks, release requests in both orders, then inspect both outcomes and final committed state. First-write evidence must include the unique-key wait and the separate winner SELECT. Cap evidence must include all lines rather than only the changed product. Catalog race evidence must include product/category state and hidden-field inspection. No wait/sleep hook belongs in production code.

For commit-loss evidence, distinguish disconnecting a client from killing the API or database before/after commit. A final GET can race an in-flight transaction, so wait for its resolution before drawing historical conclusions. Inspect unchanged Inventory counters/movements and parent/line atomicity in the same scenario record.

## Evidence and implementation Definition of Done

For every scenario record its ID, requirement/invariant IDs, revision, environment, exact synthetic setup and requests, expected/actual outcomes, server request IDs, final database observations and status: Passed, Failed, Not run, or Not applicable with reason. Avoid real tokens or shopping payloads in shared artifacts. Race records include both participants and final version/line count; performance records include errors and sample sufficiency.

Phase 04 implementation exits only when owner isolation, lazy/retained persistence, version conflicts/no-ops, cap races, current/blocked presentation, money/stock boundaries, rollback/uncertainty, internal handoff and required operational evidence pass alongside the [quality targets](../non-functional-requirements/quality-targets.md) and [global Definition of Done](../../00-project-overview/global-definition-of-done.md). Missing PostgreSQL, replica/load or restore infrastructure leaves the corresponding gate Not run. Markdown/schema checks alone establish documentation consistency.

## System Design Prerequisites & Concepts to Learn

Study deterministic interleavings, invariants and the difference between observable state and a historical command result. The [prerequisites](../system-design-prerequisites.md) explain each failure experiment; implement the smallest real setup that can establish the property being claimed.
