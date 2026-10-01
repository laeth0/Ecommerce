# Orders Configuration and Operations

**Status:** target Phase 05 operating contract. Orders runs inside the existing monolith/primary PostgreSQL topology. This document creates no deployment/migration/application files or worker.

## Runtime and settings

Use the selected .NET/ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18 generation. Pin supported stable patches/packages/images during implementation. Bind named Options and validate required values at startup; contract limits must agree across replicas.

| Section/key | Value | Validation/meaning |
| --- | --- | --- |
| `Orders:MaximumLines` / `MaximumQuantityPerLine` | `20` / `100` | Exact inherited product/unit bounds |
| `Orders:MaximumVersion` / `MaximumAmountMinor` | `9007199254740991` / `9007199254740991` | Lossless integer representation; item/unit bounds remain smaller |
| `Orders:Pagination:DefaultLimit` / `MaximumLimit` | `20` / `50` | Exact v1 paging bounds |
| `Orders:Cursor:SigningKeyFile` | Required protected shared file | ≥32 random bytes, dedicated to Orders, identical active key across replicas |
| `Orders:Cursor:LifetimeSeconds` / `MaximumCharacters` | `900` / `2048` | Exact expiry/size contract |
| `Orders:Cancellation:AllowedUntil` | `BeforeProcessing` | Confirmed cutoff; not a silent deployment override |
| `Orders:Cancellation:DiscoveryBatchMaximum` | `100` | Bounds internal discovery; no Orders-specific worker |
| `Orders:RequestBodyMaximumBytes` | `16384` | Decoded mutation body limit |
| `Orders:DetailResponseMaximumBytes` / `PageResponseMaximumBytes` | `65536` / `131072` | Bounded decoded UTF-8 response budgets |
| `Orders:Database:LockWaitMilliseconds` / `StatementTimeoutSeconds` / `TransactionDeadlineSeconds` | `250` / `2` / `3` | Existing bounded primary-database policy |
| `Orders:Verification:AllowSimulatedEvidence` | `false` | Explicit isolated Development-only verification may enable; startup rejects enabled normal deployment |
| Existing `Catalog:Currency:Code` / `MinorUnits` | `USD` / `2` | Reuse confirmed monetary policy; no second Orders currency option |

No shipping/tax/region defaults are introduced: Phase 06 owns those policies and supplies required accepted amounts/address. Orders has no provider credential, broker/cache connection, separate pool or financial-status configuration. The cursor key is the only new secret requirement and must never appear in docs/logs/committed examples. Protected secret loading, HTTPS, Admin allowed networks, trusted proxies, CORS and request IDs reuse Phase 01 settings.

API pool remains 20/replica across all modules, pool acquisition one second, executing API requests ≤100/replica, request deadline ten seconds and graceful shutdown 15 seconds. Count all API replicas, existing worker pools (maximum two each), migrations/operators/monitoring and recovery reserve against PostgreSQL's connection limit. A simulation-enabled local check is not the normal sandbox-provider runtime; caller/source validation remains mandatory even in that isolated mode.

## Migration, local use and rollout

Apply reviewed additive EF migration with the one-shot migration identity before admitting Orders routes. Create only Orders tables/constraints/indexes and grants. Prior Identity/Catalog/Inventory/Cart data needs no backfill or rewrite. Review generated SQL for nullable CHECK behavior, immutable grants, FK locks, partial index predicates and destructive changes. Exercise migration/constraints/privileges against actual PostgreSQL before claiming validity.

Local implementation reuses application/PostgreSQL Compose. Populate synthetic accepted orders through trusted owner operations from an explicit restricted Development/operator verification entry point, never a public seed/mark-paid route. Identify every simulated financial outcome and match real Inventory transitions. Normal customer order creation remains Phase 06 Checkout. No automated fixture/test project or production bypass is authorized by this documentation phase.

Before enabling traffic, validate schema/cursor key/contract settings and disable simulated evidence for normal deployment. Overlapping replicas must agree on version, cutoff, cancellation block and transition semantics; changes need compatible rollout/migration review. Rollback keeps historical data and audit, disables affected admission and deploys a compatible prior binary. Do not drop orders, reset versions or rewrite accepted prices as a routine rollback. Existing-order resolution must preserve the documented Order-before-Inventory ordering throughout deployment.

## Health, shutdown and operating signals

Reuse restricted `/health/live` and `/health/ready`, with healthy `200 {"status":"ok"}` and unhealthy `503 {"status":"unavailable"}`. Liveness probes process responsiveness. Readiness checks required config/key/source-mode, compatible Orders/Identity/Inventory schema and the existing one-second primary probe; no probe creates an order. Historical reads do not query Catalog/Payments. Host-level readiness still reflects the existing required worker/schema policy.

Shutdown stops new admission, permits bounded in-flight transactions within 15 seconds, cancels/rolls back uncommitted work and releases resources. Already committed state/request/audit survives even if its response is lost. No Orders-specific queue is drained; Requested cancellation is durable state that later Checkout recovery discovers.

| Signal | Safe dimensions | Initial action |
| --- | --- | --- |
| API latency/rate/errors | Route template, method, bounded result/status class | Unexpected failures >1% for five minutes with ≥100 attempts: investigate primary/schema/admission |
| Transition attempts/conflicts | Command, source/target state, result, actor kind | Check stale clients/illegal-state pressure; conflicts alone are not availability failures |
| Audit/access insert failure | Fixed audit kind and operation | Any occurrence: investigate and hold affected sensitive admission until atomicity is established |
| Pending cancellation count/oldest age | Aggregate count/age, no order IDs | Aged requests >5 minutes trigger investigation when Phase 06 resolver is enabled; Phase 05 simulation reports pending work honestly |
| Snapshot/proof integrity | Fixed violation type | Any occurrence: investigate; no automatic repair/mark-paid |
| Pool/lock/query/transaction waits | Module/operation/outcome | Sustained saturation >2 minutes: inspect resource order, plans and connections |
| History/detail p95 and payload bytes | Route/size distributions | p95 >300 ms for five minutes with ≥1,000 samples: inspect query/audit cost |

Use existing structured logs and tracing boundary; Phase 08 develops full collection/dashboards/alert routing. Include request ID/trace, command/outcome, safe business states/versions and duration. Omit raw order/customer/product/evidence IDs from ordinary telemetry, addresses/names/SKU/reasons, bodies/cursors, tokens and provider details. Metric labels omit all UUIDs/raw versions/unbounded strings. Restricted audits supply actor/order/source attribution for investigations and use separate controlled access.

## Integrity, backups and restore

Operator inspection pages immutable Order UUIDs in bounded batches and independently aggregates child count/subtotals before joining parent, avoiding multiplication through audit joins. Check canonical fingerprint, row/timestamp/cancellation shape, positive version, exact creation mapping and transition-audit sequence. Batches have separate snapshots; record per-order findings/time rather than claiming one global point-in-time result. Reference Inventory/Payments owner evidence only through their authorized inspection paths. No public export/repair endpoint or automatic data/audit purge exists.

Protect combined database backups including address data, and restrict migration/operator credentials. Isolated restore aims at the existing sandbox RPO ≤24 hours/RTO ≤2 hours. Restore compatible schema/application, revoke restored sessions, inspect Orders and existing owner invariants and require fresh client reads. In integrated Phase 07, hold purchase/fulfillment admission while reconciling provider operations/captures/refunds against restored local mappings; quarantine missing/mismatched records. Do not claim zero financial loss or restored purchase safety from successful database startup alone. Real-user retention and financial disaster durability require separate accepted policies.

## System Design Prerequisites & Concepts to Learn

Study additive rollout, least-privilege immutable columns, source-mode validation, graceful shutdown/commit uncertainty and restore reconciliation. Use the [verification plan](../testing-strategy/verification-scenarios.md) to demonstrate these properties when infrastructure exists; reviewed Markdown/SQL cannot establish live migration, provider safety or recovery timing.
