# Catalog Verification Scenarios

**Status:** scenario specification only. This documentation phase creates no automated tests, test projects, fixtures, or load tools. When implementation exists, record executed evidence; do not label a document review as a runtime pass.

## Evidence layers

| Layer | Evidence |
| --- | --- |
| Static/contract | Pinned build and format checks, JSON Schema validation, route/error metadata, configuration validation, reviewed migration SQL and database grants |
| PostgreSQL behavior | Actual constraints, generated search vector, GIN/B-tree plans, row-lock order, audit atomicity, statement snapshots |
| API behavior | Exact status/headers/payloads, public/Admin boundary, ETag precedence, size and normalization rules, no-store |
| Concurrency/failure | Two connections and replicas, revocation races, process kill near commit, database/audit failures, cursor rotation |
| Capacity/operation | Declared 10,000-product load, plans/buffers, resource use, readiness, restore |

Existing relevant tests can be run/updated when code is changed. New automated suites remain a later explicit request under the repository instructions; reproducible manual scenarios may provide interim evidence.

## Scenario matrix

| ID | Requirement | Given / when / then |
| --- | --- | --- |
| CAT-V-01 | CAT-FR-01/04; uniqueness | Concurrent creates with one slug or SKU yield one row and one audit event; duplicate attempt returns `409` without overwriting. |
| CAT-V-02 | Input/price | Boundary Unicode names/descriptions, NFC equivalents, controls, SKU/slug grammars, 1 and 99,999,999 cents, zero/overflow/fractional/exponent values and wrong currency follow the exact validation/DB rules; no rounding occurs. |
| CAT-V-03 | CAT-FR-02/06; lifecycle | Every permitted and forbidden transition is exercised; Draft and Archived never appear publicly, publish in Inactive category fails, and archive is irreversible. |
| CAT-V-04 | CAT-FR-05; version/no-op | Two same-version edits on two connections/replicas produce one commit and one `412`; a canonical no-op with a current ETag returns the unchanged version and no audit. Missing/weak/wildcard ETags follow `428`/`400`. |
| CAT-V-05 | Category/public visibility | Deactivate an Active category with Published products: new detail/list/search requests exclude them; reactivate and they reappear with unchanged product versions. An empty Active category remains listed. |
| CAT-V-06 | Publish/deactivate race | Pause transactions at category lock on two connections in both orders; only the documented final state/outcomes occur and there is no deadlock or leaked public row. |
| CAT-V-07 | Admin revocation race | Pause catalog write around Identity user/session share locks, then revoke/logout from another replica; commit order determines success/denial and no mutation commits after prior revocation. |
| CAT-V-08 | Public/Admin authorization | Customer/anonymous/disallowed-source Admin cannot access Admin records; invalid/expired/revoked bearer is denied; public missing/nonpublic product detail has the same `404` body. Forged forwarded headers cannot bypass source restriction. |
| CAT-V-09 | Search | Name-only and description-only terms match; hidden and inactive-category matches do not. Common/rare, punctuation, stemming, stop-word-only and Unicode query cases obey lexical and length rules. |
| CAT-V-10 | Pagination | First/deep pages obey name-C-collation/UUID order and ≤50 items; a cursor is bound to endpoint, filters, limit and expiry. Tampering, wrong key, overlength and rotated key fail. Concurrent edits may move rows only as documented. |
| CAT-V-11 | Contract/errors | Every route verifies schemas, headers, status, Location/ETag, error precedence, validation field codes, media/size rules, UTC timestamps and `Cache-Control: no-store`. |
| CAT-V-12 | Audit and uncertain commit | A failed audit insert rolls back the row; process termination before/after commit yields coherent row/audit outcomes. A timed-out create is reconciled by server request ID and unique value before retry. |
| CAT-V-13 | Outage/readiness | Stop PostgreSQL or make the schema incompatible; API returns sanitized `503` by deadline, readiness fails and liveness remains responsive. Missing cursor key prevents readiness. |
| CAT-V-14 | Plans and capacity | At 10,000 products, capture `EXPLAIN (ANALYZE, BUFFERS)` for detail, category/list, common/rare search and deep cursor; run the stated latency/throughput workload without hiding failures. |
| CAT-V-15 | Restore and future boundary | Restore catalog with Identity using the sandbox procedure; verify old sessions cannot write, constraints/audit remain coherent, and future Inventory/Orders ownership is not implied by catalog price/visibility. |

## Record and exit criteria

For each scenario, record specification ID, code revision, environment, setup/data distribution, commands or requests, expected/actual status, sanitized row/audit evidence, timing if relevant, and Passed/Failed/Not run/Not applicable with reason. Race evidence includes both client outcomes and final database state. Performance evidence includes all attempts, actual samples, percentile method and resource use. Do not commit bearer tokens or raw private connection strings in evidence.

Implementation review requires applicable scenarios, [quality targets](../non-functional-requirements/quality-targets.md), and the [global Definition of Done](../../00-project-overview/global-definition-of-done.md). A missing PostgreSQL/replica/load environment leaves those gates Not run; parsing Markdown or JSON cannot replace them.

## System Design Prerequisites & Concepts to Learn

Study how to prove a database invariant rather than only an API response. For example, an audit failure should be checked against both tables after rollback. A two-request race should be repeated with controlled lock order on real PostgreSQL because an in-memory substitute cannot reproduce the transaction contract.
