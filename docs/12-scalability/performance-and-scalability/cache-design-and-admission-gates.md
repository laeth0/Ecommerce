# Conditional Cache Design and Admission Gates

**Activation:** Disabled. This is a reviewed-candidate design, not authorization to install Redis or change public freshness.

## What would justify a cache

Retain the [Phase 08 gate](../../08-production-ready-monolith/performance-and-scalability/baseline-and-capacity.md#cache-admission-gate):

1. After query/statistics/index/batching tuning, a named safe class misses p95 in ≥ 2 of 3 identical runs, or primary utilization ≥ 70% continuously 5m.
2. Repeated reads contribute ≥ 40% DB command execution or ≥ 30% appCPU.
3. Captured distribution supports a projected ≥ 2× reduction in that class's primary reads, with key/size/hotness evidence and later measured verification.
4. ADR specifies fields/visibility, staleness/invalidation races, TTL/negative entries, stampede/fallback/outage/resource/security/restore behavior.
5. Any changed public consistency/security contract is explicitly approved. This phase does not grant such a change.

A mandatory primary guard is a primary read. The existing single-query Catalog detail cannot claim 2× fewer SQL commands if every hit still executes that guard. Report commands, buffers, bytes and CPU separately; do not rename “hydration avoided” as “all primary reads avoided.” If no eligible path meets the established gate, record Rejected/Not justified and retain PostgreSQL-only.

## Safe candidate and exclusions

Candidate: versioned **public, nonsecret Catalog descriptive materialization** only, keyed by environment/cache namespace/product UUID/product version/category UUID/category version. Product name/SKU/description come from a trusted primary snapshot; price, currency, publication/category eligibility and all current control fields remain primary-provided.

No cache of stock, Cart, quote/accepted money, financial view/evidence, confirmation/release, session/role/revocation, quota, whole Catalog/search pages, existence/404 or Admin data. No addresses/customer/token/idempotency/provider material. Order-snapshot caching is not included; it would expand private-data/authority scope and needs its own proposal.

Public headers stay Cache-Control:no-store, with unchanged DTOs/errors/cursors/no public ETag. No new Catalog integration event is introduced into the existing Orders/refund/hint contracts.

## Read and fill algorithm

1. Apply original quotas and request/auth rules. In one primary statement, read current product/category identity, versions, eligibility, current price and other noncached response fields.
2. Not visible/missing produces original 404 or page semantics. Never consult a negative cache.
3. Release DB resources. Read exact derived key with a total ≤ 20ms cache-call budget, no cache-client retries. Validate bounded closed shape, key/versions/namespace and authenticated producer integrity before use.
4. A valid hit composes the original DTO using only materialization matching that primary snapshot. Concurrent hide after the guard does not change its statement snapshot; a new read performs a new guard.
5. Miss/timeout/eviction/conflict uses a bounded fresh primary **full authoritative query** if fallback admission is available. Return all fields from that fresh query, not a mixture of two mismatched snapshots.
6. A trusted fill freezes the exact result's versions/descriptive fields and writes only that versioned key after releasing the DB connection. A slow old fill cannot overwrite a newer version key.

No database transaction/connection is held over Redis. No partial Redis result grants public visibility/price. Unknown/corrupt entry fails as a miss with integrity alert; it never becomes user-visible arbitrary content.

## Candidate entry integrity and keys

Use canonical bounded UTF- 8 bytes with schemaVersion 1, namespace UUID, product/category IDs and positive exact versions, SKU/name/description; ≤ 16KiB. Validate earlier Unicode/SKU bounds, duplicate keys and unknown members. An authenticated writer MAC binds exact key and bytes using a separate protected cache-integrity key; a digest alone cannot protect against forged matching-version content.

Namespace and MAC-key versions are nonsecret references in a reviewed candidate config; no key is created/committed here. Secret rotation reader overlap is bounded by maximum TTL; fresh writer uses current key. Namespace rotates after restore/source change before reads, because restored version numbers may collide with pre-restore materialization.

Redis ACL grants only the narrow namespace and needed commands; private encrypted transport and instance isolation required. Treat cache storage as disposable derived data, not business/audit storage. Redis [strings](https://redis.io/docs/latest/develop/data-types/strings/) and [eviction policy](https://redis.io/docs/latest/develop/reference/eviction/) describe implementation primitives; the fences here are project requirements.

## Bounded TTL, memory and fill

Initial candidate TTL uniformly 60..90s, sampled once on fill; maximum 90s. TTL limits retained keys, not business permission. Best-effort postcommit deletion of superseded keys can reduce waste; failed invalidation never relaxes primary guards.

Candidate allocation proposal:≤ 0.5CPU/512MiB process, maxmemory 256MiB, allkeys-lru on this isolated derived cache. No persistence/restore of business authority; empty restart expected. Exact client/server version/license/support review precedes implementation.

One bounded reusable client/replica, ≤ 4 concurrent cache calls/replica and ≤ 4 miss fills/replica, no waiting queue. Per-key local single-flight map ≤ 1,024 entries, at most one fill/key/process and explicit cleanup; it is load suppression, not a financial distributed lock. Across two replicas simultaneous duplicate fills remain possible but bounded.

Fallback is **also bounded** by existing primary pool/API admission and candidate fill slots. Cache outage cannot enqueue all cold requests or exceed planned primary connections. Saturated fallback returns original 503 rather than stale content. Original eligible failures count against availability.

No runtime allocation is active until the resource gate is approved; these numbers are proposal ceilings, not resources hidden in the original 2CPU/2GiB comparison.

## Failure and acceptance

Reproduce hide/category deactivation/name/price changes, slow old fill, malformed/MAC/key conflict, mass expiry, restart, cache outage, primary outage, fallback saturation and pre-restore namespace collision. Primary unavailable means no cached public permission.

Require zero stale visibility/accepted-money/authority errors, original payload equality at the permitted primary snapshot, measured gate benefit and unchanged healthy/fault bounds. Cache hit ratio alone cannot pass; include compulsory guards, quota writes, cold misses, network/serialization/MAC cost and full resource economics.

Validated means the isolated prototype met its proposal. Activation of a concrete runtime change is a separate authorized step after compatible rollout/security/restore evidence. Disable by routing to the bounded primary path; do not delete original business history.
