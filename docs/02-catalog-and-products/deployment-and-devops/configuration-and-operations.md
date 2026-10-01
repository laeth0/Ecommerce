# Catalog Configuration and Operations

**Status:** target operating contract for the Phase 02 Catalog module. The Phase 01 API and PostgreSQL deployment remain the baseline; this phase adds no separate service or broker.

## Configuration

Use named .NET Options bound at startup. Keep secret bytes outside source control and load them through protected deployment files or the existing secret mechanism. No committed example contains a usable signing key or database credential.

| Section/key | Phase 02 value | Validation |
| --- | --- | --- |
| `Catalog:Currency:Code` | `USD` | Exact `USD`; cannot be overridden to another currency in this phase |
| `Catalog:Currency:MinorUnits` | `2` | Exact `2`; corresponds to integer cents |
| `Catalog:Pagination:DefaultLimit` | `20` | 1–50; contract default remains 20 |
| `Catalog:Pagination:MaximumLimit` | `50` | Exact 50 unless API version/policy is revised |
| `Catalog:Cursor:SigningKeyFile` | Required protected file | At least 32 random bytes; same active key across replicas; no generated fallback |
| `Catalog:Cursor:LifetimeSeconds` | `900` | Exact 900 for the v1 cursor contract |
| `Catalog:Search:Configuration` | `english` | Exact PostgreSQL text-search configuration; migration/query agree |
| `Catalog:Search:MaximumScalars` | `80` | Matches API; lower minimum remains two |
| `Catalog:Search:MaximumUtf8Bytes` | `320` | Matches API |
| `Catalog:Database:CommandTimeoutSeconds` | `2` | Matches the Phase 01 two-second database statement limit; below the ten-second request deadline |
| `Catalog:Request:MaximumBodyBytes` | `16384` | Exact API limit for decoded JSON; edge and app limits agree |

The existing Phase 01 identity, Admin network, reverse-proxy, CORS, request deadline and concurrency settings still apply. For an explicitly allowed browser origin, the shared CORS policy must permit Catalog's `If-Match` request header and expose `ETag` alongside the common response headers; keep the default origin list empty. Catalog uses the existing primary PostgreSQL connection and a separate `catalog` schema; account for catalog traffic in the shared pool budget. A deployment may place cursor keys in a secret manager instead of a file only if startup validation, access restriction and replica consistency remain equivalent. Changing public contract limits requires updating the API version/contract, not a silent environment override.

## Release and migration

Apply a reviewed EF Core migration using a one-shot migration identity before bringing API replicas online. Review its SQL for unique/check/FK constraints, generated `tsvector`, partial indexes, grants, lock duration, and compatibility with the currently deployed application. On a fresh sandbox database, create schema and seed synthetic categories/products through an explicit development seed command or Admin API; no automatic production-like product seed runs at API startup.

For later schema evolution, prefer expand/contract changes compatible with overlapping API versions. A destructive removal or changed price unit requires a data and rollback plan. Back up the combined Identity/Catalog database before a risky migration; do not assume reversing a generated migration restores deleted data. The readiness probe must reject an incompatible catalog schema and missing cursor key. Preserve `/health/live` and `/health/ready` on the restricted management listener with the response contract from Phase 01.

## Operating signals

Record request count/duration by route template, method and status class; database duration, pool waits, command timeouts, lock waits, and audit-write failures by bounded operation type. Expose counts of Published products and Active categories as bounded gauges or an operator query, not per-product metric labels. Avoid product name, SKU, query text, cursor, actor UUID and bearer token as metric labels. Structured logs can include server request ID, route template, result class, entity UUID for authorized Admin mutation events, and the audit event ID; omit raw text, price request bodies and cursor payloads. Central error handling logs an unexpected failure once with safe context.

| Signal | Initial action threshold |
| --- | --- |
| Catalog unexpected 5xx | ≥5% for five minutes with ≥100 requests: inspect PostgreSQL/readiness and recent migration |
| Catalog database timeout or pool wait | Sustained for two minutes: inspect plans, active sessions and connection budget |
| Audit insert failure | Any occurrence: inspect database and hold Admin writes until atomicity is confirmed |
| Public search p95 | Above 500 ms in the declared workload: inspect term distribution and `EXPLAIN (ANALYZE, BUFFERS)` |
| Catalog readiness false | 30 seconds: alert; do not route new traffic to that replica |

Thresholds are initial sandbox action points, not measured service-level objectives. Investigate a publication leak or unauthorized write immediately regardless of percentage. The shared observability platform grows in Phase 08; local structured output and database inspection are sufficient to begin this phase.

## Recovery and rollback

On catalog database outage, return controlled `503` and keep readiness false; do not serve stale price/publication from a local cache. Restore backups into an isolated database, verify constraints/indexes, catalog and audit counts, sample public visibility, and Identity session revocation before reopening the shared sandbox. Record achieved RPO/RTO against the Phase 01 sandbox target. If a release changes schema incompatibly, roll back application only when the active schema supports it; otherwise restore or forward-fix under an explicit maintenance plan.

Cursor key rotation is a coordinated deployment. Either temporarily verify both old and new keys for no more than the 900-second cursor lifetime while signing only with the new key, or deliberately invalidate old cursors and tell clients to restart pagination. Signing and verification key sets must match across replicas; a mismatch appears as intermittent `400` responses and is an operational fault.

## System Design Prerequisites & Concepts to Learn

Study application versus database readiness, rollout overlap, migration locks, and secret rotation. Demonstrate startup with a missing key, a schema mismatch, and a stopped database. Compare first-page and deep-page plans after migration. A successful build does not establish that the migration, grants, full-text index or restore actually works.
