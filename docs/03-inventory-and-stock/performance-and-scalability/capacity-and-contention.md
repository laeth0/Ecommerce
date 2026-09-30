# Inventory Capacity and Contention

**Status:** planned baseline and experiments, not observed capacity.

## Hot-row write path

A product's `stock_items` row is the serialization point for its stock. Every Reserve, Consume, Release, Expire, or Adjustment affecting that product updates it. This makes one-unit correctness simple, but throughput for a popular SKU is limited by one row's transaction rate. Extra API replicas add contenders and database connections; they cannot make that row update concurrently. Use a short transaction, bounded 250 ms lock wait, two-second statement timeout and ten-second request deadline consistent with the earlier phases. A lock timeout returns a sanitized dependency failure; it never authorizes stock without a committed update.

The reservation batch caps at 20 distinct products and 100 units per line. Lock Catalog products, categories, and stock items in their documented UUID order, with the unique intent group acquired first. Keep provider calls, HTTP calls, sleeps, and user interaction outside the transaction. Under a hot final unit, a guarded `UPDATE` or stock row lock plus recheck yields at most one winner. Do not attempt to improve throughput by reading an eventually consistent count or reducing the guard.

## Read, worker and index budgets

| Access | Index/limit | Evidence to collect |
| --- | --- | --- |
| Admin stock detail/adjustment | Product UUID primary key and one stock row | Point-lookup plan, pool/lock wait |
| Reserve replay | Unique `intent_id` | Exact-intent lookup and concurrent uniqueness wait |
| Expiry worker | Partial `(expires_at,id)` index on Active groups; one locked group per transaction | Due scan plan, skipped locks, oldest due age, groups per wake |
| Reservation terminal | Group UUID primary key; line primary key `(reservation_id,product_id)` | Line fetch and sorted stock-lock plan |
| Reconciliation | Product-batched movement and Active-line aggregates | Rows/buffers/time per batch, no unbounded in-memory ledger load |

Worker wakes every two seconds and processes at most 100 due groups per replica per wake, each in its own transaction. A replica can skip a locked group and handle another; a later wake finds unprocessed work. If arrivals exceed drain capacity, due-group age rises visibly. Do not enlarge an unbounded queue or start a worker per reservation. A 100-group wake is a maximum, not a promise that all groups finish within one interval under contention. The [PostgreSQL `SKIP LOCKED` contract](https://www.postgresql.org/docs/current/sql-select.html) supports queue-like selection; it does not provide a consistent general-purpose read.

Budget database connections across Identity, Catalog, Inventory and the worker. Keep the Phase 01 API pool maximum of 20 connections per replica and a separate worker pool of at most two connections per worker process. With multiple replicas, count all pools plus migration/operator/recovery reserve against the PostgreSQL server limit. The worker's database load must be included in the [quality workload](../non-functional-requirements/quality-targets.md), not measured in isolation and forgotten.

## Plan and overload experiments

Capture `EXPLAIN (ANALYZE, BUFFERS)` for stock lookup, intent replay, due reservation selection, terminal line fetch, and reconciliation at the declared 10,000-item/100,000-group dataset. Record actual/estimated rows, buffers, sort, index choice and timing. Do not run modifying `EXPLAIN ANALYZE` against valuable data. [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) explains plan interpretation.

Then run three separate pressure tests: final-unit contention, one hot product with replenishment, and worker backlog after a pause. For each, record offered/committed/rejected operations, p50/p95/p99, lock/pool waits, CPU, database connections and final ledger reconciliation. A future stock sharding strategy, queue or separate service needs these measurements and a new invariant-preserving design. Phase 12 owns large-scale experiments; Phase 03 supplies the baseline.

## System Design Prerequisites & Concepts to Learn

Study queueing at a serial hot row and the difference between throughput and accepted work. Compare 1, 2, 10 and 100 contenders on one product, then spread the same attempts across many products. This reveals whether the limit is a hot lock, the connection pool or database CPU before introducing another component.
