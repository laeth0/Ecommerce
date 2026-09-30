# Catalog Failure and Recovery Behavior

**Status:** expected outcomes for the Phase 02 design. These rules complement the [transaction contract](../database/schema-and-transactions.md) and [API error catalog](../functional-requirements/api-contracts.md).

## Concurrency and known conflicts

| Scenario | Result |
| --- | --- |
| Two category/product edits carry one ETag | One transaction can commit. The other sees the new version under lock and returns `412`; its row and audit remain unchanged. |
| Category deactivation races product publish | Both contend on the category row. If deactivation commits first, publish returns `409 Catalog.CategoryInactive`; if publish commits first, deactivation can commit afterward and the product becomes public-hidden. |
| Category reactivation after published products were hidden by category status | Previously Published products become visible again with unchanged product versions. The Admin must understand this effect before issuing activate. |
| Product edit moves a Published product to Inactive category | Edit commits with new product version; the next public statement excludes it. |
| SKU/slug create races | The unique constraint selects one winner; the other gets `409` and creates no audit row. |
| Admin logout/revocation races a catalog mutation | User/session share locks and Phase 01 update locks establish order. If revocation commits first, mutation is denied. If mutation commits first, its audit/state are durable before revocation. |
| Public read overlaps publication change | Each SQL statement sees one committed snapshot. A read started earlier can return the old public state; one started after commit must see the new state. |
| Rows change between cursor pages | A changed row can move, disappear or repeat across requests. No cross-page snapshot or total count is promised. |

## Dependency and process failures

| Failure point | Required response and persisted state |
| --- | --- |
| Identity validation database unavailable | Admin route fails closed with sanitized `503`; no catalog mutation begins. Public catalog reads may continue if the catalog database is reachable. |
| Catalog query/database unavailable | Public/Admin catalog operation returns sanitized `503` within the request deadline; no cached or guessed price/publication success is returned. |
| Audit insert fails before commit | Roll back category/product change; return `503`; no successful response. |
| Process cancels or crashes before commit | Database transaction rolls back; no mutation/audit is durable. If the client cannot know whether commit happened, treat result as uncertain until reconciliation. |
| Process crashes after commit but before response | Row and audit are durable. The client may see a timeout; it must re-read current resource and, if necessary, ask an operator to inspect the request ID before retrying a non-idempotent create. |
| Cursor signing key missing or invalid at startup | Catalog readiness fails; do not generate unsigned cursors or accept them with a fallback key. |
| Cursor expires or key rotates without overlap | Return `400 Validation.Failed` with `field=cursor`; client restarts listing from first page. |
| Search query times out | Cancel the database command and return `503`; no partial results or hidden-state fallback. |

`GET` requests are safe to retry after a dependency failure, subject to changed catalog state. A PATCH or transition with a known `412`/`409` must be resolved by re-reading and choosing a new action. A timed-out write is uncertain: do not blindly resubmit with a new ETag. Create has no idempotency key; a repeated request can return duplicate-key `409`, which establishes that the unique value is occupied but not by which request. Use server request ID, audit and row inspection for recovery. Never infer rollback merely because one immediate read found no audit while the first transaction may still be running.

## Recovery and operation

Catalog has no background worker or external index to replay. PostgreSQL backup/restore recovers catalog rows and audit together. Use the combined database restore procedure in Phase 01; revoke restored sessions before reopening Admin access. Check category/product counts, foreign keys, constraints, indexes and a sample of hidden/public results after restore. If an audit/state mismatch is found, keep Admin writes closed and investigate rather than fabricating compensating audit rows.

Readiness depends on compatible schema, reachable primary database and required cursor secret; liveness checks only process responsiveness. Monitor query timeout/503 rates, pool and lock waits, audit-write failures, and migration compatibility. A database outage is service unavailability, not a reason to serve stale publication or price.

## System Design Prerequisites & Concepts to Learn

Study commit uncertainty, retry safety, row-lock ordering, and read snapshots. Pause two database sessions around publish/deactivate, then compare both HTTP outcomes and final product/category/audit rows. Kill a process around commit and use the request ID to distinguish a known rollback, a known commit, and an unresolved in-flight operation.
