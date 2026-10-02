# Conditional Partitioning and Retained Data

**Activation:** Disabled. DDL below is an isolated candidate specification, not an applied migration or permission to partition core tables.

## Problem and gate

Row count alone is insufficient. Propose partitioning only after query/index/statistics/maintenance tuning when a named retained table misses target in ≥ 2/3 identical D1 runs or measured maintenance cannot finish inside its declared budget, and plans identify a partitionable access/maintenance pattern.

Require prototype ≥ 30% reduction in the measured query/maintenance cost, full original uniqueness/FK/grant/identity preservation, no greater than 10% write-p95/WAL regression without explicit reviewed trade-off, finite planning/partition count and integrated backup/restore within original objectives.

Partition pruning needs matching predicates; splitting a table does not create a second primary or parallelize one stock row. PostgreSQL [partitioning](https://www.postgresql.org/docs/18/ddl-partitioning.html) explains physical layout/pruning; actual owner invariants decide eligibility.

## Candidate and rejected shortcuts

| Table / layout | Assessment |
| --- | --- |
| orders.order_lines hash(order_id) | Conditional candidate: existing PK(order_id, product_id) contains partition key; detail predicate order_id can select one partition |
| orders.orders range(created_at) | Rejected without a new global identity design: original id, checkout_intent_id and reservation_id uniqueness cannot become (id, time) uniqueness |
| Owner audit/facts range(time) | Rejected without preserved global event/fact/request identity and FK proof |
| Outbox/inbox range(time) | Rejected if dedup/source-ID identity can repeat across partitions or original replay/restore needs unbounded search |
| Inventory stock hash(product_id) | May distribute physical indexes but does not remove single-product serialization; no current measured justification |
| Financial work/receipts/holds | No conversion approved; identity/coverage/window/recovery risk dominates |

PostgreSQL requires parent partitioned-table unique/primary constraints to cover partition-key columns for the supported declarative uniqueness model. Do not silently change original global UUID/request uniqueness or add timestamps to v1 identities to satisfy this limitation. See [CREATE TABLE constraints](https://www.postgresql.org/docs/18/sql-createtable.html).

## Isolated hash prototype

Use a protected isolated Commerce clone with the existing orders.orders/catalog.products parents and valid synthetic Development history. Runtime roles have no access to `scalability_lab`. Compare the actual unpartitioned table to this candidate with identical data/index semantics:

```sql
CREATE SCHEMA scalability_lab;
CREATE TABLE scalability_lab.order_lines_hash
    (LIKE orders.order_lines INCLUDING DEFAULTS INCLUDING CONSTRAINTS)
    PARTITION BY HASH (order_id);
ALTER TABLE scalability_lab.order_lines_hash
    ADD PRIMARY KEY (order_id, product_id);
ALTER TABLE scalability_lab.order_lines_hash
    ADD FOREIGN KEY (order_id) REFERENCES orders.orders(id) ON DELETE RESTRICT;
ALTER TABLE scalability_lab.order_lines_hash
    ADD FOREIGN KEY (product_id) REFERENCES catalog.products(id) ON DELETE RESTRICT;
CREATE TABLE scalability_lab.order_lines_h0
    PARTITION OF scalability_lab.order_lines_hash
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE scalability_lab.order_lines_h1
    PARTITION OF scalability_lab.order_lines_hash
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE scalability_lab.order_lines_h2
    PARTITION OF scalability_lab.order_lines_hash
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE scalability_lab.order_lines_h3
    PARTITION OF scalability_lab.order_lines_hash
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

LIKE copies check/not-null/default semantics here; explicitly add original PK/FKs rather than assuming LIKE copied them. Inspect actual generated DDL, collation/numeric/byte checks and grants. No source facts/events or live table are replaced by this copy.

Compare 4 partitions to unpartitioned D0/D1. A later 16-partition comparison requires its full reviewed remainder set and budget before copy. Do not change modulus/add partial destinations while writes continue.

Measure single detail, heavy-owner history's actual join shape, batched bounded IDs, insert/WAL/vacuum and whole-table backup. Show partitions scanned, planning/execution/buffers, constraints and total indexes. Existing Customer summaries do not read lines, so no claimed summary speedup from line partitioning.

## Time partition learning boundary

Analyze half-open monthly UTC ranges and pruning on isolated nonauthoritative sample data only. Any performance copy that allows duplicate event IDs across months is explicitly unsuitable as an original event store. Do not emit its rows to Notifications or Payments.

Retained business/audit/event data has no approved deletion policy. Dropping/detaching an old partition cannot be used as capacity cleanup. Archived data would still need immutable identity, bounded lookup/replay/access, backups and integrity proof; no archive service is introduced here.

## Migration/rollback proof

Production adoption, if justified, needs [one-writer maintenance migration](migration-and-rollback.md): complete owner constraint/grant inventory, copy counts/digests/FK/equation checks, bounded lock/cutover, compatible readers and postwrite rollback boundary. Do not dual-write or let old/new stores issue events independently.

Preserve original row IDs/cursors/snapshots and all current owner lock order. A partitioned table's indexes/grants/maintenance jobs and backup inventory must be validated at parent and child level. A missing destination must fail/contain without partial accepted mutation.

No global uniqueness registry, trigger scheme, extension, shard or altered persistent key is chosen to rescue an unsafe proposal. Such a redesign requires explicit reviewed scope before implementation.
