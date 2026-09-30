# Catalog Quality Targets

**Status:** proposed acceptance targets. No implementation or measurement is claimed. The [API contract](../functional-requirements/api-contracts.md) and [workflows](../functional-requirements/catalog-workflows.md) define correctness before latency is considered.

## Measurement contract

Use PostgreSQL 18 and the Phase 01 ASP.NET Core/EF Core/Npgsql stack on the primary database. Seed 100 categories and 10,000 products with realistic UTF-8 names, descriptions, prices, and search terms. Distribute products across categories; use 70% Published, 10% Draft, 10% Hidden, and 10% Archived, with 10% Inactive categories. Include common and rare search terms, duplicate names, names near length limits, and a mix of page depths. Record dataset generation and analyze the tables before measurement.

Initial budget: application 2 vCPU/2 GiB, PostgreSQL 2 vCPU/4 GiB, load generator outside both budgets. Record CPU, memory, storage, versions, connection-pool settings, and tracing overhead. Warm up for two minutes, measure ten minutes, and repeat three runs from a recorded dataset. Use 50 concurrent clients with one in-flight request each and a one-second think time. Request mix: 40% public product detail, 30% public product list, 10% category list, 20% product search. At least half of list/search requests use a later cursor; mix present/absent/hidden detail IDs. Count errors and timeouts in the offered workload, and report successful latency separately. Admin write measurements use a separate 2 operations/second workload against distinct products and current ETags so they do not distort public-read results.

## Acceptance requirements

| ID | Requirement | Pass condition in each run |
| --- | --- | --- |
| CAT-NFR-01 | Public detail, product list, category list | p50 ≤100 ms, p95 ≤300 ms, p99 ≤750 ms; combined public-read throughput ≥30 completed requests/second under the declared mix |
| CAT-NFR-02 | Search | p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms for the declared 20% search class |
| CAT-NFR-03 | Admin create/edit/transition | p95 ≤500 ms at 2 operations/second; record version conflicts separately from unexpected failures |
| CAT-NFR-04 | Normal-load failure rate | Unexpected 5xx, timeouts, and rejected valid requests <0.5% of attempts; do not remove them from denominators |
| CAT-NFR-05 | Publication and authorization | Zero Draft/Hidden/Archived or Inactive-category products in public results; zero successful unauthorized Admin operations, including a mutation ordered after revocation |
| CAT-NFR-06 | Data integrity | Zero duplicate SKU/slug, lost versioned update, partial audit/mutation commit, invalid USD price, or product without a category |
| CAT-NFR-07 | Bounded reads | ≤50 items per page; ≤51 qualifying rows fetched for a 50-item page; no unbounded offset, total-count, or full-catalog application load |
| CAT-NFR-08 | Dependency failure | Database failures produce a sanitized `503` within the 10-second request deadline; no stale success or public disclosure from an application fallback |
| CAT-NFR-09 | Contract and operations | API schemas and representative SQL agree; invalid required settings prevent readiness; migration and index plans are reviewed before deployment |
| CAT-NFR-10 | Database statement latency | Under the declared workload, p95 ≤150 ms for public detail/list/category statements and ≤300 ms for search statements; record lock/pool wait separately |

Each latency class needs at least 1,000 completed samples per run; extend a run if necessary. Report offered/completed requests, all response classes, percentile method, and confidence limitations. The category/product mix can shift with realistic traffic; a different mix is a new workload, not evidence that this target passed. Correctness gates cannot be relaxed to reach throughput.

## Availability and maintainability

The project's 99.9% availability goal remains a later operating target. Phase 02 has no observation period and makes no availability claim. A primary PostgreSQL outage prevents current catalog reads and Admin writes; `/health/live` can remain healthy while `/health/ready` fails. Use the Phase 01 sandbox backup/restore target of RPO ≤24 hours and RTO ≤2 hours for the combined database, with a drill before claiming recoverability. Restore must also follow Identity's session-revocation procedure.

Keep business guards explicit in the Catalog module, use parameterized SQL/EF queries, and review SQL/migration plans for every schema change. No test project or load harness is created by this documentation increment.

## System Design Prerequisites & Concepts to Learn

Study queueing effects, latency percentiles, statement snapshots, and how data distribution changes query plans. A fast query on 100 products says little about a 10,000-product catalog. Compare the same request mix before and after `ANALYZE`, record plan and buffer differences, and identify which resource limits throughput before proposing another service or cache.
