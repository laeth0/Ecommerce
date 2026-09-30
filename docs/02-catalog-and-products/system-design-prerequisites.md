# Catalog: System Design Prerequisites & Concepts to Learn

**Status:** study plan and failure experiments for Phase 02. Read before implementation.

## 1. Domain ownership and price truth

**Concept.** The catalog owns today's product description and price. A cart holds intent; an order later stores an accepted snapshot; Inventory owns stock. Only the catalog may change its current price.

**Under the hood.** A client reads a published product and observes a price version. An administrator may later edit it. Checkout must ask the catalog for current authoritative price and publication before accepting a purchase. Once accepted, the order stores the agreed amount independently of later catalog edits.

**Why.** Persisting a copied price in every domain as if it were current creates conflicting sources of truth. Reading from the catalog at checkout adds a dependency; an explicit acceptance policy for price changes belongs to Phase 06.

**Alternatives and costs.** Holding a catalog row lock across payment is unacceptable. An immutable price history inside catalog could support more pricing rules, but no Phase 02 requirement needs it; order snapshots preserve transaction history later. Versioned updates prevent lost admin edits but produce conflicts that an editor must resolve.

**Experiment.** Read a product, change its price, and compare the old response with the current catalog row. Show that a later order would need an explicit accepted snapshot and could not rely on the old response.

## 2. Optimistic concurrency and state machines

**Concept.** A row version is a precondition for a write. Publication is a guarded state transition, not a Boolean that arbitrary clients can flip.

**Under the hood.** Admin A and Admin B both read version 4. A writes version 5. B's update requires version 4, affects no row, and returns a precondition failure. A product can move through Draft, Published, Hidden, and Archived only as the lifecycle allows.

**Why.** A last-write-wins admin form can silently undo a price or publication change. A version check localizes the conflict to the product or category that changed.

**Alternatives and costs.** Pessimistic locks held while a human edits would be long-lived. A shared global catalog version would create contention across unrelated products. The selected per-row version requires clients to re-read and reconcile after `412`.

**Experiment.** Send two conflicting `PATCH` requests with the same `If-Match` value to different replicas. Exactly one mutation and its audit record may commit. Repeat a publish while its category is being deactivated.

**Study.** [EF Core concurrency tokens](https://learn.microsoft.com/en-us/ef/core/saving/concurrency) and PostgreSQL [row locking](https://www.postgresql.org/docs/current/explicit-locking.html).

## 3. Indexes, query plans, and bounded pagination

**Concept.** A B-tree supports ordered lookups and range predicates; a partial index contains only rows meeting a stable predicate. Pagination must impose a total order and a maximum response size.

**Under the hood.** Public list queries filter to Published products in Active categories, then order by name and ID. A cursor carries the last ordered key and exact filters; the next query reads rows strictly after that key. The database uses an index for the product predicate/order when it can, and a category lookup to enforce visibility.

**Why.** Unbounded lists and large offsets grow with catalog size. An index speeds relevant reads but costs storage and write work. A cursor avoids scanning a growing offset; it does not freeze a changing catalog.

**Alternatives and costs.** Offset pagination is simpler for tiny catalogs but becomes expensive at deep pages and can duplicate/skip rows during edits. A snapshot held over multiple HTTP requests would consume resources and add lifecycle complexity. The chosen cursor documents that updates between pages can change what appears.

**Experiment.** Compare `EXPLAIN (ANALYZE, BUFFERS)` for a list query at 100 and 10,000 products; compare an offset page at 10,000 with a cursor page. Record time, rows examined, and buffers, not merely index presence.

**Study.** PostgreSQL [indexes](https://www.postgresql.org/docs/current/indexes.html), [partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html), [EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), and [EF Core pagination](https://learn.microsoft.com/en-us/ef/core/querying/pagination).

## 4. Full-text search and its limits

**Concept.** PostgreSQL full-text search turns product text into indexed lexemes. A query is parsed into lexemes and matched with `@@`; a GIN index accelerates membership tests.

**Under the hood.** Store a generated `tsvector` from name and description using the explicit English configuration. Convert user text using `websearch_to_tsquery('english', q)`, combine with publication/category predicates, then sort the bounded result by name and ID. An all-stop-word query returns an empty page.

**Why.** Leading-wildcard substring matching across a growing table can be expensive. Full-text search is a meaningful PostgreSQL learning exercise for the specified English sandbox catalog.

**Alternatives and costs.** B-tree prefix search does not provide lexical matching in descriptions. A separate search engine adds another data store, lag, recovery and operating burden. PostgreSQL stemming/stop words may surprise users, and this design does not promise fuzzy matching, prefix autocomplete, multilingual relevance, or ranked results.

**Experiment.** Compare a sequential text scan and a GIN-assisted search over the same 10,000-product dataset. Search a stop word, punctuation, and a term present only in hidden products; record exact results and plans.

**Study.** PostgreSQL [full-text search](https://www.postgresql.org/docs/current/textsearch-intro.html) and [text-search indexes](https://www.postgresql.org/docs/current/textsearch-indexes.html).

## 5. Authorization, cache truth, and failure boundaries

**Concept.** Public catalog data may eventually be cached, but a cache cannot authorize an administrator or establish a purchasable current price. Public and Admin views are separate information boundaries.

**Under the hood.** Public reads apply publication and active-category filters in SQL. Admin writes validate the Phase 01 bearer session and source network, then revalidate under the identity shared locks during the catalog transaction. Errors return no draft details to public clients.

**Why.** Filtering after a query or using a cached publication bit can leak hidden records. A revoked Admin token that passed middleware earlier can otherwise mutate catalog after revocation.

**Alternatives and costs.** Phase 02 keeps reads on the primary PostgreSQL database and disables response caching. Later cache introduction must define invalidation, acceptable staleness, and fallback before deployment. Primary reads increase database load; the query baseline supplies evidence for Phase 08.

**Experiment.** Deactivate a category containing Published products while public searches run. Each query must use one consistent database statement snapshot and return no product whose category is inactive in that snapshot. Revoke Admin access during a paused product update and inspect the order of commits.

**Study.** [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) and [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html).
