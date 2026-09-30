# Catalog Search and Capacity

**Status:** planned query design and measurement procedure, not observed performance.

## Query shapes

All public visibility checks execute on the PostgreSQL primary. Product detail joins `catalog.products` to `catalog.categories` by category ID and requires `product.status = 'Published' AND category.status = 'Active'` in that statement. Product pages use the same predicate, optional exact category slug, optional English text predicate, optional keyset position, `ORDER BY product.name COLLATE "C", product.id`, and `LIMIT limit + 1`. Category pages require Active status and the same name/ID ordering. Public responses never merge separately cached category/product status. See the [schema](../database/schema-and-transactions.md) for representative SQL.

For `q`, use `websearch_to_tsquery('english'::regconfig, @q)` against a generated `tsvector` containing product name and description. Search is lexical; results remain alphabetic, not ranked. Do not concatenate untrusted input into SQL, pass it as a parameter. Query input is normalized and bounded before PostgreSQL parsing. An empty `tsquery` gives an empty page. The generated vector changes transactionally with a name/description edit; there is no asynchronous search index to reconcile.

## Indexes and plan evidence

| Read | Candidate index | Trade-off |
| --- | --- | --- |
| Public categories | Partial B-tree on Active categories, `(name COLLATE "C", id)` | Small ordered scan; status changes update index |
| Public products | Partial B-tree on Published products, `(name COLLATE "C", id)` | Supports ordered pages; category filter may still require join/filter work |
| Category-specific products | Partial B-tree on Published products, `(category_id, name COLLATE "C", id)` | Supports common category pages; extra write/storage cost |
| Product text search | Partial GIN on Published `search_document` | Speeds lexical membership; name/ID sort may require sorting bounded or matching rows |
| Admin/detail lookup | UUID primary keys; unique SKU/slug indexes | Direct lookup and integrity, not a public visibility shortcut |

These are candidate indexes for the stated 10,000-product workload. Review `EXPLAIN (ANALYZE, BUFFERS)` for common/rare queries, first/deep pages, category filter, no search match, and worst allowed search terms. Record actual versus estimated rows, execution time, buffers, sort strategy, and whether GIN or ordered B-tree was chosen. A sequential scan can be reasonable for tiny or broad result sets; index presence alone is not a performance result. Revisit redundant indexes only after measured plans and write cost are understood. [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html), [text-search indexes](https://www.postgresql.org/docs/current/textsearch-indexes.html), and [EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) are the reference behavior.

## Capacity and admission

The API caps page size at 50 and request body at 16 KiB; search is capped at 80 scalars/320 UTF-8 bytes, and a cursor at 2,048 characters. Cursor pagination avoids an offset proportional to page depth. Each public page reads at most 51 qualifying rows and returns at most 50, although the database may examine more rows to enforce visibility/search. A time budget still bounds expensive broad searches and joins. Use the Phase 01 two-second PostgreSQL statement timeout and ten-second API request deadline so the API can return a controlled failure. Do not add an unbounded application retry queue.

Budget application/database connections across all modules, not per catalog endpoint. Keep the Phase 01 API's 100 concurrent-request ceiling and its pool accounting; two replicas must not silently double the permitted database connections. If measurements show a hot query, first inspect plan/statistics, predicate selectivity and data shape. A read replica would introduce publication/price lag; it requires an explicit stale-read policy and is outside Phase 02. An external search engine or cache likewise needs a new consistency and invalidation contract.

## System Design Prerequisites & Concepts to Learn

Study keyset versus offset pagination, GIN posting lists, selectivity, and the cost of sorting text matches. Compare a common term, a rare term, an all-stop-word query, and a category with many products. Record the plans before tuning; if a broad term scans many rows, state that limit honestly rather than asserting all search queries are index-only.
