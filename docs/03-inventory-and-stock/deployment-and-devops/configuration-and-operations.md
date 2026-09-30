# Inventory Configuration and Operations

**Status:** target Phase 03 deployment and operating contract. Inventory runs inside the Phase 01/02 ASP.NET Core monolith with PostgreSQL; expiry uses bounded database polling, not a broker or Redis.

## Configuration

Bind named .NET Options at startup. Values that define the v1 business/API contract are fixed across replicas; a change requires contract and migration review, not a silent environment override.

| Section/key | Phase 03 value | Startup validation |
| --- | --- | --- |
| `Inventory:Location:Mode` | `Single` | Exact mode; no location ID in v1 API |
| `Inventory:Quantity:MaximumOnHand` | `1000000000` | Exact database/API bound |
| `Inventory:Adjustment:MaximumAbsoluteDelta` | `1000000` | Exact API bound; zero remains invalid |
| `Inventory:Reservation:LifetimeSeconds` | `900` | Exact 15-minute policy; shared by replicas |
| `Inventory:Reservation:MaximumLines` | `20` | Exact internal contract bound |
| `Inventory:Reservation:MaximumQuantityPerLine` | `100` | Exact internal contract bound |
| `Inventory:Expiry:Enabled` | `true` | Worker must run for a ready Inventory deployment |
| `Inventory:Expiry:PollIntervalSeconds` | `2` | Positive; target for routine progress |
| `Inventory:Expiry:MaximumGroupsPerWake` | `100` | Positive and bounded; each group has its own transaction |
| `Inventory:Reconciliation:BatchSize` | `100` | Positive bounded operator scan |
| `Inventory:Database:LockWaitMilliseconds` | `250` | Matches bounded Phase 01 lock wait |
| `Inventory:Database:StatementTimeoutSeconds` | `2` | Matches Phase 01 statement limit |
| `Inventory:Database:TransactionDeadlineSeconds` | `3` | Positive and below the ten-second API request deadline |
| `ConnectionStrings:InventoryWorker` | Required protected credential when worker enabled | Separate least-privilege role; pool maximum two connections per worker process |

The API reuses the Phase 01 primary connection pool limit of 20 per replica and the ten-second request deadline. Identity/Admin-network, reverse-proxy, request-ID and CORS settings remain in effect. Keep connection strings and operator credentials outside the repository. A missing worker credential or incompatible setting prevents the worker from starting; do not silently run with unlimited database rights or disable expiry.

## Migration and rollout

Use a one-shot reviewed EF Core migration identity. For the initial Phase 03 cutover, stop Catalog product writes and Inventory/Checkout admission, create the Inventory schema, backfill one zero-balance item per existing Catalog product, then deploy the product-create application flow that calls both owner operations. Verify no product is missing an item before reopening writes. This is a small sandbox maintenance window; later online rollouts need an explicit dual-version compatibility plan. Do not let every API replica race to migrate or seed stock.

Review generated SQL, foreign keys, partial unique/due indexes, grants, backfill row counts and rollback implications. A generated down migration cannot be assumed to restore deleted movements. Readiness checks compatible Inventory schema and primary PostgreSQL reachability, as Phase 01 does for its schema. `/health/live` checks process responsiveness. The worker records its last successful poll and oldest due age; poll failure or lag raises an alert. A separate worker process has its own readiness; if hosted in the API process, an ongoing failure is surfaced operationally and must not be hidden as healthy expiry progress.

## Worker and operator modes

On each two-second wake, each worker replica completes at most 100 single-group transactions using due-index selection with `FOR UPDATE SKIP LOCKED`. Stop admitting new work on shutdown; finish or cancel the current transaction within the Phase 01 15-second graceful window. Cancellation before commit rolls back; another replica/wake retries. Never hold a database lock while waiting on a payment provider. Record processed count, failure class and oldest due age; no in-memory schedule is the source of truth.

Provide a restricted read-only `inventory reconcile --batch-size 100` operator mode using a separate database credential. It runs no HTTP listener or background worker and prints sanitized item IDs/counts and mismatches, not raw customer data. It does not fix rows. An operator investigating a mismatch pauses stock-changing traffic under controlled maintenance, inspects rows/backups, and approves a separate correction procedure. Routine Admin adjustments are not a substitute for silently rewriting a corrupted ledger.

## Observability and alerts

| Signal | Initial action threshold |
| --- | --- |
| Oldest due Active reservation and due count | Age >15 seconds under normal load, or count growing for two poll cycles: inspect worker/database contention |
| Last successful worker poll | >15 seconds: alert and inspect worker credential, database and process health |
| Inventory unexpected 5xx / timeouts | ≥5% for five minutes with ≥100 attempts: inspect database, locks and pool |
| Lock waits and guarded stock conflicts | Sudden sustained rise: inspect hot product and offered load; do not remove guards |
| Movement write failure or reconciliation mismatch | Any occurrence: stop affected stock-changing work and investigate before resuming |
| Reservation terminal conflicts | Track by bounded outcome code; spike may indicate a checkout deadline/payment policy problem |

Metrics use route/operation, status class and bounded reason code only. Do not label by product, intent, reservation, actor, free-text adjustment reason or customer ID. Structured logs include server request ID, safe operation/group UUID where necessary, transition result and duration. Never log Bearer tokens or whole request bodies. Full observability infrastructure comes in Phase 08.

## Backup and recovery

Back up the combined PostgreSQL database so Catalog product IDs, Inventory stock/group/movement rows and Identity authority restore coherently. Practice an isolated restore; check constraints, product/item mapping, movement sums, Active-line reserved sums and expiry backlog. Revoke restored Identity sessions before reopening Admin access. Report actual RPO/RTO against the Phase 01 sandbox target of ≤24 hours and ≤2 hours. After reopening, the durable worker discovers due groups; a backup restore does not imply they were already released. If a mismatch persists, hold stock-changing operations and investigate rather than inventing a compensating movement.

## System Design Prerequisites & Concepts to Learn

Study migration/backfill safety, readiness versus worker progress, leaderless polling and restore validation. Demonstrate worker restart during a backlog and a restore with overdue Active groups. Build/format success is useful static evidence, but it cannot prove row-lock, expiry or restore behavior.
