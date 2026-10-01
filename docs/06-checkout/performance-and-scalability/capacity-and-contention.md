# Checkout Capacity and Contention

**Status:** proposed access paths and experiments, not measured capacity. The coordinator uses primary PostgreSQL with durable work; no cache, broker, replica or distributed lock is introduced.

## Access paths and rationale

| Path | Concrete problem and selected bound | Trade-off/evidence |
| --- | --- | --- |
| Customer/key replay | Unique `(customer_id,idempotency_key)` avoids races across replicas; inspect one attempt | Retained binding/storage; inspect exact replay and uniqueness wait |
| Quote acceptance | Owner/UUID lock and one accepted attempt per quote | Contenders serialize; quote expiry remains a final database-time check |
| Preview/current prices | One Cart intent plus one ≤20-product Catalog batch | No per-line query; preview may become stale, which submission detects |
| Attempt read | One owner-scoped statement with Order and exactly four work rows | No address/line/source hydration; avoid join multiplication in projection |
| Worker discovery | Partial due-work B-tree; one SKIP LOCKED claim per transaction | Queue polling/index churn/vacuum; no global ordering or exactly-once promise |
| Work application | Four fixed-order work locks, one attempt, then owner locks | Prevents cross-job lock inversion; same-attempt actions serialize deliberately |
| Cancellation discovery | Existing Orders request-time keyset ≤100, then Checkout wake outside owner locks | Independent snapshots, no Order-to-Checkout lock inversion |
| Quote cleanup | Partial `(expires_at,id)` for unused quotes, ≤100 deletions/transaction | Address retention/write cost; used quotes/accepted keys remain retained |
| Due simulation | Partial payment/refund due indexes, ≤100 discoveries/class/pass | Development-only financial row work; no provider capacity claim |

Orders/reservation/financial-operation unique indexes already serve exact mappings; do not add duplicate B-trees. JSONB stores a bounded quote payload consumed as a whole by ID; a GIN index or arbitrary JSON search has no access requirement. Child line identities/equations/canonical text are validated by the owner, not by assuming a JSONB index provides integrity.

Capture `EXPLAIN (ANALYZE, BUFFERS)` on declared synthetic data for owner/key replay, quote lock/read, AttemptView, due/expired-lease work, requested cancellation and quote/source cleanup. Record actual rows, buffers, sort, estimate error, index choice and lock/pool wait. Use isolated data for modifying ANALYZE because it executes the statement. Review [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html).

## Shared resources and backpressure

Checkout adds one worker pool capped at two connections/replica and two concurrent actions; simulator settlement/discovery/quote cleanup share it. External waits use no database connection. The existing API pool maximum 20 is shared across modules. Never create a second API pool just for Checkout. Count every replica/worker plus migration/operator/recovery reserve against PostgreSQL's connection budget. Work queues are durable rows, not unbounded in-memory channels; claim only when an action slot is free.

Claims repeat in bounded passes of at most 100 jobs, pausing until the next one-second tick when the pass budget is exhausted. Settlement discoveries are ≤100 payments and ≤100 refunds per pass; cancellation discovery ≤100; unused-quote cleanup has its separate 15-minute/ten-transaction budget. Give each class a separate bounded turn rather than allowing a purchase backlog to suppress cancellation/late financial evidence. Record backlog/oldest age. Do not scan an entire work/history table on every tick.

Final-unit stock remains a serialization point at Inventory, not Checkout's cache or process memory. More replicas add contenders and connections; they do not permit concurrent consumption of the same unit. Lease expiry permits duplicate execution, so stable owner operation IDs protect finance while fencing protects local state. Required audit/source writes are part of latency/capacity, not disabled during measurement.

## Controlled experiments

1. Compare first acceptance, exact replay after expiry and changed-body conflict. Count every DB statement/lock, Order/reservation/source row and receipt byte.
2. Compare one versus 20 lines with cold/warm data and boundary text. Prove that quote/attempt result bounds and no per-product I/O hold.
3. Race 100 buyers for one unit, then the same key and different keys for one quote. Record accepted purchases/business conflicts/timeouts separately; availability never goes negative.
4. Run one/two replicas within the same aggregate CPU/memory budget. Spread distinct attempts, then concentrate jobs/cancellation on one attempt. Inspect fixed work lock order and useful completed outcomes.
5. Exhaust API/worker pools, pause a financial response, expire a lease and resume the old worker. Record bounded failure/takeover and absence of connections held during the wait.
6. Grow retained attempts/quotes and backlogs toward one million only as a declared later workload. Inspect due-index churn, vacuum, cleanup lag and audit storage before proposing partitioning/caching/another queue.

A pure acceptance RPS number cannot prove sustainable purchase throughput; the worker must keep convergence and oldest-work age within the [quality targets](../non-functional-requirements/quality-targets.md). Phase 08 repeats the shared 100-client mixed workload, with fresh quote preparation traffic explicitly included/reported. Phase 12 evaluates 1,000/10,000/100,000 active users from measured distribution/resource limits. A future service extraction needs revised transactions, messaging and financial/stock compensation; it cannot reuse a local connection as a distributed guarantee.

## System Design Prerequisites & Concepts to Learn

Study contention, queue service rate versus admission, partial-index maintenance and total connection demand. Compare useful committed purchases and convergence under fixed resources before admitting another technology; the [prerequisites](../system-design-prerequisites.md) explain each mechanism's safety boundary.
