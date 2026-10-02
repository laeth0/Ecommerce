# System Design Prerequisites and Learning Exercises

Before implementation, explain each concept with a query/transaction/queue from this project, then name the measured problem, alternatives, cost and failure experiment.

| Concept | Mental model / why it matters | Study / experiment |
| --- | --- | --- |
| Arrival rate, concurrency and think time | A session can be idle; executing requests≈arrival rate×response time in a stable system. Distinguish Little's Law averages from percentile/tail guarantees | [Workload model](performance-and-scalability/workload-model-and-capacity-tiers.md); SCL-X01/X02 |
| Saturation and queue stability | If required work arrives faster than useful service, debt grows; a larger queue does not add service capacity | [Queues](performance-and-scalability/queue-throughput-and-consumer-scaling.md); X05 |
| Open versus closed workload | Closed clients slow their offered rate when the server slows; paced/open arrivals expose overload and dropped iterations | [Workload model](performance-and-scalability/workload-model-and-capacity-tiers.md); X01/X02 |
| Shared fixed-window quotas | Each replica updates the same global/source/actor primary buckets; boundaries permit bursts and hot counter contention | [Original quotas](../08-production-ready-monolith/functional-requirements/api-and-operating-contracts.md#shared-commerce-quotas); X02/X04 |
| Query selectivity, indexes and keysets | Ordered B-tree seeks differ from GIN membership and sort; LIMIT bounds returned rows, not examined rows | PostgreSQL [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html); X03 |
| MVCC, vacuum and statistics | Updates leave versions; long snapshots/lagging slots increase retained storage/maintenance; estimates affect plans | PostgreSQL [vacuum](https://www.postgresql.org/docs/18/routine-vacuuming.html); X03/X10 |
| Hot rows versus hot keys | Database serialization protects one stock balance; cache hot-key stampede is separate duplicated materialization work | [Flash sales](performance-and-scalability/flash-sales-and-hot-rows.md), [cache](performance-and-scalability/cache-design-and-admission-gates.md); X04/X06 |
| Horizontal scaling and pooling | More replicas create pools/workers/RPCs; aggregate CPU and provider quota remain finite | [Budgets](performance-and-scalability/horizontal-scaling-and-connection-budgets.md); X02 |
| Cache-aside and version fencing | Read primary guard→derived key→bounded miss fill; old fill cannot overwrite a new version key | Redis [strings](https://redis.io/docs/latest/develop/data-types/strings/), [eviction](https://redis.io/docs/latest/develop/reference/eviction/); X06 |
| Invalidation versus permission | Invalidating eventually does not guarantee current category visibility; primary guard still decides public eligibility | [Cache gates](performance-and-scalability/cache-design-and-admission-gates.md); X06 |
| Physical replication and replay fence | Primary WAL is received/flushed/replayed at different points; check replay position outside the read snapshot, then establish the permitted snapshot | PostgreSQL [standby](https://www.postgresql.org/docs/18/hot-standby.html), [replication](https://www.postgresql.org/docs/18/warm-standby.html); X07 |
| Partition pruning versus sharding | A table can prune partitions while still sharing one server; id-only uniqueness across time partitions needs separate proof | PostgreSQL [partitioning](https://www.postgresql.org/docs/18/ddl-partitioning.html); X08 |
| Consumer concurrency versus ordering | Competing consumers increase possible completion parallelism and reorder delivery; original idempotency and per-owner facts retain meaning | RabbitMQ [consumers](https://www.rabbitmq.com/docs/consumers); X05 |
| Retry amplification | Receipt queries/duplicates/probes/scan consume capacity even without a new purchase | [Phase 11 retry policy](../11-distributed-system-reliability/reliability-and-failure-scenarios/retry-timeout-and-breaker-policy.md); X09 |
| Capacity economics and recovery | Larger tables/cache/standby affect storage/WAL/backup/restore; diagnostic savings cannot authorize smaller financial proof | [Recovery](deployment-and-devops/backup-and-restore.md); X10/X11 |

## Before selecting an optimization

1. Which operation misses which target under which workload and resource profile?
2. Is the limiting resource quota, generator, CPU, locks, pools, WAL/disk, broker, provider or retained scan?
3. Which owner currently proves visibility, price, permission or money?
4. Does the proposal remove expensive work, or merely add another network lookup?
5. How do stale data, cold restart, outage, poison entry, lag, missing partition and rollback behave?
6. How many new connections, metric series, retained bytes and privileged identities are introduced?
7. Can exact original IDs/bytes/coverage/decisions survive migration and asymmetric restore?
8. What evidence would reject this proposal even if its happy-path p95 improved?

Work the quota/refresh arithmetic and a hot-stock conservation example before writing a load plan. Proposed tests/experiments are described in [X01–11](testing-strategy/experiment-catalog.md); they are not executed evidence or authorization to create automated tests.
