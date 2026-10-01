# Order History and Contention

**Status:** planned access paths and experiments, not observed capacity. Orders uses the existing primary database without a cache, search service or read replica.

## Bounded access paths

| Operation | Access path/bound | Evidence |
| --- | --- | --- |
| Customer history | `(customer_id,created_at DESC,id DESC)` B-tree, owner equality, tuple cursor, limit+1 ≤51 | First/deep-page actual rows, buffers and timing |
| Admin work queue | Partial `(status,created_at DESC,id DESC)` where eligible status/cancellation None | Queue predicate/index agreement and moving-membership behavior |
| Detail | Owner/ID parent lookup and `(order_id,product_id)` line range, ≤21 rows for corruption detection | One coherent parent/line statement; no live Catalog join |
| Human transition | Existing Order primary-key lock/version guard and one audit insert | Lock duration, conflicts, commit/audit I/O |
| Creation replay | Unique checkout_intent_id/reservation_id and bounded immutable field comparison | Replay after Catalog/terminal changes; no existing Order lock after group/stock |
| Pending cancellation discovery | Partial request-time/UUID keyset, ≤100 identifiers | Queue count/age and bounded scan plan; no work claim in this phase |
| Admin access audit | One append after successful detail; indexed order/time for restricted inspection | Write latency and append-only grants |

Summaries fetch no lines/addresses and no total count. Detail materializes bounded snapshots sequentially on one connection, ends its transaction before response serialization, and performs no per-line HTTP/SQL Catalog request. Do not run parallel EF commands on a shared DbContext. Avoid multiplying parent totals when aggregating joined lines: sum each order's child values independently and compare once.

Capture `EXPLAIN (ANALYZE, BUFFERS)` on the declared synthetic dataset for first/later Customer pages, the 20,000-order owner, each Admin status queue, detail and pending cancellation scan. Record estimated/actual rows, loops, sort, index choice, buffers and timing. Status changes/request flags maintain the partial queue index and add write cost. Covering indexes, partitioning and another read model require a measured benefit; row count alone does not justify them. Study [PostgreSQL multicolumn indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html) and [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html). Modifying ANALYZE executes writes; use isolated data and deliberate rollback when appropriate.

## Contention and shared budgets

One Order row serializes competing transitions. Normal traffic spreads across orders, while duplicate callbacks or aggressive retries can concentrate on one aggregate. Extra API replicas increase contenders, not the concurrent transition capacity of that row. Use short locks, explicit expectedVersion/proof replay and no provider calls inside a database transaction. Pending cancellation is a durable guard, not a process-local flag.

Reuse API pool maximum 20 per replica across all modules, pool acquisition ≤1 second, executing API admission ≤100/replica, lock wait ≤250 ms, statement ≤2 seconds, Orders transaction ≤3 seconds and request ≤10 seconds. Orders adds no separate pool or worker. Include existing worker pools (maximum two each), all replicas, migration/operator access and recovery reserve in PostgreSQL's connection budget. Cancellation/shutdown must dispose transactions/connections and distinguish unknown commit from rollback. Failure to append required transition/access audit cannot become an unrecorded success fallback.

## Experiments and evolution

1. Compare first and deep Customer pages at 20/50 limits with creation-time ties. Contrast an isolated OFFSET baseline without adopting it into the contract.
2. Compare one-line/20-line detail and summaries; record response bytes and query count. Prove that Catalog hide/outage does not add dependencies to historical reads.
3. Run one then two replicas within the same total CPU/memory envelope, using distinct orders, then concentrate 100 contenders on one cancellation/processing target. Report useful transitions and conflicts/timeouts separately.
4. Inject transition/audit lock waits, exhaust the shared pool and interrupt a transaction. Inspect final snapshot/state/audit and all released connections.
5. Increase synthetic history toward one million orders only as a declared later workload; identify slow index maintenance, storage/vacuum and query pressure before recommending partitioning or replicas.

At 100 clients the Phase 08 mixed purchase workload is the shared baseline. At 1,000/10,000/100,000 active users, Phase 12 identifies actual database/pool/CPU and owner-distribution limits rather than extrapolating this phase's capacity. A future replica read may lag status/cancellation and requires a declared read-your-write policy; mutation guards remain authoritative. A cache would need owner-aware keys, privacy controls and invalidation/lag behavior. A separate Orders service requires evidence for independent deployment/scaling plus a new Checkout coordination and snapshot/FK migration design.

## System Design Prerequisites & Concepts to Learn

Study immutable paging keys versus mutable queue membership, serialized transitions and total connection demand. Reproduce the bottleneck and collect useful accepted work before admitting a cache, partition, queue or extracted service. The [prerequisites](../system-design-prerequisites.md) connect each experiment to a concrete correctness problem.
