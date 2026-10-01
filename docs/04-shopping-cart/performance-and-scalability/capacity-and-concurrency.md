# Cart Capacity and Concurrency

**Status:** planned query/load experiments; no observed capacity claim. PostgreSQL is the Cart system of record in this phase.

## Bounded access paths

| Operation | Required work and access path | Evidence |
| --- | --- | --- |
| Identity eligibility | Existing bounded primary user/session lookup, or shared row locks for mutation | Authorization time, execution/pool/lock wait |
| Intent GET | Customer primary-key lookup and `(customer_id,product_id)` range; at most 21 rows for detecting an invalid extra line | Actual rows, buffers, sort and plan |
| Current product hydration | One Catalog-owned batch for ≤20 IDs, product/category primary-key lookups and SQL visibility predicate | One query for all lines; payload/currency and snapshot inspection |
| SetItem | Unique parent arbitration, parent lock, one Catalog product/category check, line point lookup/count and bounded writes | Wait time, statements, guarded version update |
| Remove/Clear | Parent lock, scoped point delete or ≤20-row owner range delete and one version update | No Catalog/Inventory query, commit time |
| Checkout intent | Parent lock and bounded owner line fetch in caller transaction | Lock holding duration and acquisition order |

Do not issue a Catalog request per product, load every cart/customer, count the whole catalog, or parallelize EF commands on one DbContext/connection. The GET read transaction runs sequentially: intent, Catalog batch, materialization, transaction end. Release it before writing the network response. A 20-line cart increases hydration/arithmetic work but does not increase Catalog query count.

Capture `EXPLAIN (ANALYZE, BUFFERS)` on synthetic isolated data for intent lookup, Catalog batch, scoped count/delete and parent lookup at the [declared dataset](../non-functional-requirements/quality-targets.md). Record actual/estimated rows, loops, buffers, sorting, index choice and duration. Explain plans establish access behavior for that dataset; they are distinct from client latency. Modifying ANALYZE executes its statement, so use disposable data or a deliberate rollback. Review [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html) before running it.

## Parent serialization and overload

The parent serializes writes for one customer, including different products. Typical customers edit infrequently; this is a smaller contention surface than Inventory's shared popular-product row. A cart read uses a snapshot without parent write locks. Product rows are shared-locked only by SetItem, and Cart never competes for Inventory stock locks. An Admin hide/reprice can delay SetItem because Catalog owns current sellability.

The confirmed optimistic policy intentionally exposes a stale editor even when two edits target different products. Do not retry a version conflict after secretly refreshing its version. A 100-writer attack on one account can consume pool capacity; the existing admission, lock and transaction budgets bound work. Reject saturation visibly, release canceled work and count it in the appropriate availability denominator. Do not create an unbounded per-owner request queue or use sticky sessions/local mutexes for correctness.

The shared API pool maximum remains 20 per replica across Identity, Catalog, Inventory and Cart. Do not allocate an additional 20-connection Cart pool. Count existing Inventory worker pools (two per worker process), all replicas, migration/operator connections and reserved recovery slots against PostgreSQL's server limit. Reuse one connection within each operation. Per replica, allow at most 100 executing API requests under the host admission policy; pool acquisition ≤1 second, lock wait ≤250 ms, statement ≤2 seconds, Cart transaction ≤3 seconds, request ≤10 seconds. Cancellation must dispose the transaction and release the connection after rollback/commit resolution.

## Experiments and evolution triggers

1. Compare virtual-empty, one-line, five-line and 20-line GETs with the same product/visibility distribution; record query count and serialized bytes.
2. Compare one and two API replicas using distinct owners, then repeat with one hot owner. Hold total CPU/memory fixed and record pool/lock waits and useful throughput.
3. Pause an Admin Catalog mutation while SetItem waits, then test hidden/visible outcomes in both orders. Verify lock-timeout classification and unchanged Cart state on failure.
4. Hold a Cart snapshot deliberately, change Catalog in another connection, and measure read duration/deadline enforcement; do not leave long read transactions that delay database maintenance.
5. Exhaust the shared pool and raise offered load above admission. Record offered/completed/rejected calls and recovery after pressure stops, with no leaked connections or partial edits.

At 100, 1,000 and 10,000 concurrent users, first measure database execution, admission/pool queues and product-read concentration. The latter two are Phase 12 experiments, not Phase 04 promises. A cache needs a measured repeated-read bottleneck, a permitted staleness window, version/owner-aware keys and clear outage behavior. A dedicated Cart service needs evidence for independent scaling/deployment and new network/Checkout snapshot contracts. Extra replicas alone cannot parallelize one locked parent, and neither extraction nor caching may weaken ownership or mutation preconditions.

## System Design Prerequisites & Concepts to Learn

Study how short row locks cooperate with optimistic client versions and how pool saturation raises tail latency. Use the [prerequisites](../system-design-prerequisites.md) to explain why bounded query count is more useful here than adding concurrent per-line I/O or a cache before profiling.
