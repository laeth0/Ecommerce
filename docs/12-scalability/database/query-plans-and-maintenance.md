# PostgreSQL Query Plans and Maintenance

## Primary authority and query inventory

Use PostgreSQL 18 owner schemas/PK/FK/check/uniqueness/grants from earlier phases. No changed data type, money precision, identifier, snapshot, transaction isolation or public pagination is introduced.

| Path | Original predicate /access requirement | D0/D1 evidence |
| --- | --- | --- |
| Catalog detail | Published product joined Active category, same primary statement | Full vs candidate guard cost, read equality, wide description/skew |
| Catalog pages | Visibility+optional category/q, English search, C name/UUID keyset, limit+1 ≤ 51 | First/deep/broad/rare/stop-word/inactive/tied-name plans |
| Customer Order history | Current eligible owner, customer equality, created_at/id descending keyset | Heavy 20k-Order owner, summary only, no line/address/N+1 |
| Order detail | Parent/≤ 20 lines coherent owner read, immutable accepted money |1/20 lines, query count/fingerprint/equations |
| Inventory | Existing PK/sorted stock locks, reservation due partial index | Last-unit, spread/skew, expiry contention |
| Identity/quota | Current user/session/token digest and global→source→actor counters | Protected-state lookup, counter lock/writes, refresh growth |
| Checkout | Four work rows, original receipt/quote/mapping, local command due/deadline/lease | No unbounded command/history scan; review states included |
| Financial owner | Root/intent/case/refund/fact/hold snapshots and bounded scan | Original provider population small; no simulated verified facts |
| Messaging | Due/lease/deadline partial indexes, source-ID inbox/sink uniqueness | Healthy/large backlog/parking/review plans |

## Evidence and tuning order

Capture artifact/schema fingerprints, data cardinality/distribution, statistics age, index bytes, planning/execution time, examined rows, buffers, loops, sort spill, lock/pool wait and complete HTTP/background latency. pg_stat_statements is a conditional existing/approved diagnostic facility, not an extension installed here.

EXPLAIN ANALYZE executes its statement; use isolated owner data. Write plans require deliberate local rollback and no network/financial executor effect. PostgreSQL [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html) explains plan evidence; query correctness remains an owner obligation.

1. Verify stable predicates/parameters/cursors and remove redundant/N+1 fetches within unchanged response semantics.
2. Inspect estimate mismatch/skew; maintain appropriate ANALYZE statistics rather than forcing every query onto an index.
3. Compare existing B-tree/partial/GIN support to actual query/selectivity/order. Broad lexical search can need sorting even with GIN membership.
4. Propose one measured index/query change, including write/WAL/storage/backup effects.
5. Recheck the baseline, class latency, hot writes, authority/races and restore inventory.

No offset pagination, total-count contract, external search engine, ranked search or asynchronous Catalog projection is added. LIMIT bounds emitted rows, not arbitrary join/search work; statement/admission time budgets remain.

## Index proposals

Record the exact owner table, columns/collation, order/predicate/INCLUDE bytes, matching query and expected plan in the proposal. Preserve unique constraint indexes and FK support. Do not replace a guard index with one that omits publication/owner/source semantics.

Online CREATE INDEX CONCURRENTLY, if selected, needs a reviewed deployment: it may perform extra scans/waits and leave an invalid index on failure; it cannot run inside the normal transaction migration block. Inspect validity/grants/name and plan rollback before activation. See [CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html).

Set statement/lock/operation deadlines and resource limits through protected migration mode; no unbounded runtime startup indexing. Parent partition indexes need their own review if that candidate is admitted. Add covering/GIN/GiST/BRIN indexes only for a demonstrated query benefit.

## Vacuum, WAL and maintenance

Track dead tuples, transaction age, table/index bytes, autovacuum progress/lag, I/O/checkpoint/WAL rate, temporary bytes and long snapshots. Keep fsync/durability and original commit guarantees enabled. A faster unsafe commit cannot pass the capacity gate.

Study [routine vacuum](https://www.postgresql.org/docs/18/routine-vacuuming.html) and [statistics](https://www.postgresql.org/docs/18/monitoring-stats.html). Proposed autovacuum/statistics tuning is specific to the table and records effective settings and measurements; it does not assume globally optimal settings.

Long backup/inspection/replica snapshots and replication slots can prolong retained storage; include their interference in full-mix runs. Bound owner inspection and stop optional diagnostic/load work before risking authoritative disk. Do not delete financial/event/receipt history to reduce vacuum cost.

## Transactions and locks

Preserve Read Committed with explicit write locks and bounded Repeatable Read financial/multi-query snapshots. Commerce retains work→attempt→Order→sorted Inventory→coordination/audit/outbox; Payments retains root→intent→hold→case→sorted refunds→evidence/work/audit/outboxes.

Quota transactions finish before domain locks. Claims commit separately before owner application. Network/Redis/standby/provider work never holds a primary transaction/connection.

Known local 40P01/40001 rollback allows one whole-local retry within the remaining deadline; no retry block spans I/O or rewrites an uncertain commit. Record blockers/SQLSTATE using sanitized fixed operation codes, not raw SQL/values.

## Maintenance capacity gate

At a claimed D1/data tier, baseline queries and required work remain healthy while declared routine vacuum/statistics and paired backup execute. Report bytes/object, write amplification, available disk horizon and safe restore time.

If maintenance/backups/scan cannot support the data volume, stop approving growth and identify the limiting path. Optional replica/partition/cache experiments do not waive this gate.
