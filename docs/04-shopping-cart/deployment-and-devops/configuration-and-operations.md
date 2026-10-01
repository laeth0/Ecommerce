# Cart Configuration and Operations

**Status:** target Phase 04 operating contract. Cart runs in the existing ASP.NET Core monolith and uses its primary PostgreSQL pool. This document creates no deployment files, credentials, migration or application worker.

## Configuration and runtime

Use the Phase 01 .NET/ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18 generation; pin supported stable patches/packages/images at implementation. Bind named .NET Options at startup. Business-contract values are consistent across replicas and require contract/migration review to change.

| Section/key | Value | Validation/meaning |
| --- | --- | --- |
| `Cart:MaximumLines` | `20` | Exact API/internal cap and parent-serialized rule |
| `Cart:MaximumQuantityPerLine` | `100` | Exact whole-unit API/database bound |
| `Cart:MaximumVersion` | `9007199254740991` | Exact lossless JSON/database version bound |
| `Cart:AutomaticExpiryEnabled` | `false` | Confirmed no-expiry policy; no worker silently removes intent |
| `Cart:RequestBodyMaximumBytes` | `16384` | Exact decoded-body protocol bound |
| `Cart:ResponseMaximumBytes` | `65536` | Maximum decoded UTF-8 GET response under declared field/line bounds |
| `Cart:Database:LockWaitMilliseconds` | `250` | Positive bounded lock wait, consistent with Phase 01 |
| `Cart:Database:StatementTimeoutSeconds` | `2` | Existing database statement limit |
| `Cart:Database:TransactionDeadlineSeconds` | `3` | Bounds reads and writes; below ten-second request deadline |
| Existing `Catalog:Currency:Code` / `Catalog:Currency:MinorUnits` | `USD` / `2` | Retain the Phase 02 configured monetary policy; Cart validates returned USD cents |

The currency entries reuse the [Phase 02 settings](../../02-catalog-and-products/deployment-and-devops/configuration-and-operations.md); Cart has no separate currency option. Cart adds no secrets, cache connection, provider credential, separate pool or worker. Use the existing protected primary connection string, API pool maximum 20 per replica, one-second pool acquisition, 100 executing requests per replica, ten-second request deadline and 15-second graceful shutdown. Include existing Inventory worker pools and all replicas/operator/migration reserve in server connection budgeting.

Required/malformed settings, unsupported contract limits or incompatible schema prevent readiness. Configure HTTPS/trusted proxies/CORS/request IDs and explicit Customer policies through existing host mechanisms. Do not enable session affinity to compensate for process-local Cart storage or locking. Credentials/connection strings remain outside source control.

## Migration and local rollout

Apply a one-shot reviewed EF Core migration using the dedicated migration identity before enabling Cart routes. Create only Cart schema/tables/constraints/indexes and required grants. Carts are lazy, so no account/product/stock backfill is needed. Inspect generated SQL for FK relationships, version bounds, lock queries, update predicates, privileges and accidental writes to prior schemas. Execute against actual PostgreSQL before claiming migration validity.

For local development, extend the existing application/PostgreSQL Compose topology when application implementation exists. Create two synthetic Customer identities, an eligible Admin, public/hidden products and single-location stock through existing owner flows. No additional infrastructure is required. Keep manual scenario setup distinct from committed test fixtures; automated infrastructure is not authorized by this documentation phase.

Enable Cart only after schema compatibility and grants pass. In a later compatible rolling application upgrade, all active replicas must agree on quantity/line/version/no-op semantics; adding API replicas does not add capacity to a single locked cart. Contract-bound changes require coordinated rollout or an explicit compatible migration. Rolling deployment alone does not establish schema safety. Rollback should disable Cart admission/deploy the prior compatible binary while retaining Cart data; do not drop the schema or reset versions as a routine rollback.

## Health, shutdown and telemetry

Reuse restricted `/health/live` and `/health/ready`. Healthy responses are `200 {"status":"ok"}`; unhealthy are `503 {"status":"unavailable"}`. Liveness checks process responsiveness; readiness includes the existing one-second primary probe, required configuration and compatible Cart/Identity/Catalog schema. Do not create a cart or mutate data in a probe. Inventory's existing expiry-worker readiness remains a host concern and is not replaced by Cart health.

On shutdown, stop new admission and allow in-flight work up to the existing 15-second budget. Cart transactions remain bounded to three seconds; cancel/rollback work that has not committed and dispose resources. A committed edit survives shutdown even if its acknowledgement is lost. Cart has no in-memory pending intent to flush and no recovery queue to drain.

| Signal | Labels/data | Operator action |
| --- | --- | --- |
| Request count/duration | Route template, method, bounded result/status class; client and server latencies | Investigate NFR tail/error regression with database timings |
| Mutation outcomes | Set/Remove/Clear, changed/no-op/conflict/unavailable/limit/dependency | Distinguish ordinary stale editors from saturation/defects |
| Database/pool/lock/transaction duration | Module, operation and bounded outcome; no owner/product labels | Find held transactions, pool leakage or Catalog lock contention |
| Response bytes / line count | Bounded distributions | Detect projection/cap regressions |
| Integrity violations | Fixed type: VersionZero, OverCap, MissingReference, Money, VersionExhausted | Any occurrence triggers investigation; no automatic repair |
| Cancellation/read snapshot duration | Route/operation and outcome | Detect lingering connections/snapshots after cancellation |

Structured events correlate through server request ID and, when the host tracing baseline exists, its trace/span. Include command, before/after intent version, changed flag, item count and duration only; omit owner/session/product IDs, SKU/name, quantities, raw URLs/queries, bodies and credentials. Metric labels never contain UUIDs, names or raw versions. Reuse existing instrumentation; Phase 08 develops complete OpenTelemetry collection/dashboards/alert routing.

Proposed operational triggers: any integrity violation, repeated readiness failure, or unexpected Cart failures above 1% for five minutes with at least 100 attempts. Sustained p95 above 500 ms for five minutes with at least 1,000 eligible samples prompts latency investigation. Version conflicts alone are not availability alerts. Record offered work/timeouts and inspect pool/lock saturation before changing budgets. These are initial alert rules for later implementation, not monitored results.

## Integrity and restore procedure

Use an operator read-only scan in bounded Customer UUID batches. Check committed positive version, ≤20 lines, quantity bounds, owner existence/role and Catalog references. Each batch has its own snapshot; report per-cart findings/time without claiming one global snapshot. Inspect through restricted tooling; no public cart export/repair endpoint exists. Do not silently delete extra lines or increment/reset versions to hide a mismatch.

Backup all existing schemas together and protect exports. For an isolated restore drill, measure the sandbox RPO ≤24 hours/RTO ≤2 hours target, restore compatible application/schema versions, revoke all restored Identity sessions before ingress, run Cart integrity and existing Catalog/Inventory reconciliation, issue fresh synthetic credentials and GET current carts. Old client receipts/versions may refer to a later lost state and must be discarded across restore. Broader disaster recovery evidence belongs to Phase 08; no recovery claim is made here.

## System Design Prerequisites & Concepts to Learn

Study connection budgets, additive migration rollout, readiness versus liveness, transaction cancellation and restore boundaries. Use the [verification plan](../testing-strategy/verification-scenarios.md) to demonstrate restart durability and postcommit response uncertainty. An application build or reviewed SQL file does not establish live shutdown, database permissions or recovery timing.
