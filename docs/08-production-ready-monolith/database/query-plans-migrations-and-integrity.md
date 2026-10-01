# PostgreSQL Plans, Migrations and Integrity

**Status:** target database specification. Existing owner schemas remain authoritative; no migration is executed or SQL engine validation claimed here. Phase 08 adds no new domain table, generic event store or financial cleanup policy.

## Diagnostic schema extension

Background actions need a durable link to the server execution that first accepted them. Add four nullable fields to `checkout.attempts`, `payments.financial_work` and `payments.refunds`. These are diagnostic fields, not keys/FKs/public representations. There is no trace-ID index: lookups already use owner identity.

The following is design DDL for a reviewed future migration. Apply the same explicitly stated constraint to all three target tables.

```sql
ALTER TABLE checkout.attempts
    ADD COLUMN diagnostic_request_id uuid,
    ADD COLUMN diagnostic_trace_id varchar(32) COLLATE "C",
    ADD COLUMN diagnostic_span_id varchar(16) COLLATE "C",
    ADD COLUMN diagnostic_recorded boolean,
    ADD CONSTRAINT checkout_attempt_diagnostic_context CHECK (
        (diagnostic_request_id IS NULL AND diagnostic_trace_id IS NULL
         AND diagnostic_span_id IS NULL AND diagnostic_recorded IS NULL)
        OR
        (diagnostic_request_id IS NOT NULL AND diagnostic_trace_id IS NOT NULL
         AND diagnostic_span_id IS NOT NULL AND diagnostic_recorded IS NOT NULL
         AND diagnostic_trace_id ~ '^[0-9a-f]{32}$'
         AND diagnostic_trace_id <> '00000000000000000000000000000000'
         AND diagnostic_span_id ~ '^[0-9a-f]{16}$'
         AND diagnostic_span_id <> '0000000000000000')
    );

ALTER TABLE payments.financial_work
    ADD COLUMN diagnostic_request_id uuid,
    ADD COLUMN diagnostic_trace_id varchar(32) COLLATE "C",
    ADD COLUMN diagnostic_span_id varchar(16) COLLATE "C",
    ADD COLUMN diagnostic_recorded boolean,
    ADD CONSTRAINT payments_work_diagnostic_context CHECK (
        (diagnostic_request_id IS NULL AND diagnostic_trace_id IS NULL
         AND diagnostic_span_id IS NULL AND diagnostic_recorded IS NULL)
        OR
        (diagnostic_request_id IS NOT NULL AND diagnostic_trace_id IS NOT NULL
         AND diagnostic_span_id IS NOT NULL AND diagnostic_recorded IS NOT NULL
         AND diagnostic_trace_id ~ '^[0-9a-f]{32}$'
         AND diagnostic_trace_id <> '00000000000000000000000000000000'
         AND diagnostic_span_id ~ '^[0-9a-f]{16}$'
         AND diagnostic_span_id <> '0000000000000000')
    );

ALTER TABLE payments.refunds
    ADD COLUMN diagnostic_request_id uuid,
    ADD COLUMN diagnostic_trace_id varchar(32) COLLATE "C",
    ADD COLUMN diagnostic_span_id varchar(16) COLLATE "C",
    ADD COLUMN diagnostic_recorded boolean,
    ADD CONSTRAINT payments_refund_diagnostic_context CHECK (
        (diagnostic_request_id IS NULL AND diagnostic_trace_id IS NULL
         AND diagnostic_span_id IS NULL AND diagnostic_recorded IS NULL)
        OR
        (diagnostic_request_id IS NOT NULL AND diagnostic_trace_id IS NOT NULL
         AND diagnostic_span_id IS NOT NULL AND diagnostic_recorded IS NOT NULL
         AND diagnostic_trace_id ~ '^[0-9a-f]{32}$'
         AND diagnostic_trace_id <> '00000000000000000000000000000000'
         AND diagnostic_span_id ~ '^[0-9a-f]{16}$'
         AND diagnostic_span_id <> '0000000000000000')
    );
```

CHECK explicitly requires all present fields non-null; SQL NULL must not let a partial tuple pass. All-null is valid for old rows, missing instrumentation or invalid input normalized before SQL. A database persistence failure is still a business transaction failure; asynchronous exporter/backend failures are not. Do not swallow a database error and continue an aborted acceptance transaction.

- Checkout fills context at initial accepted insertion in the existing transaction; committed Preparing rows remain forbidden. The trusted context belongs to the accepting server activity.
- Checkout's existing scheduling operation passes optional context to Payments; Payments freezes it on the first financial-work insert alongside intent. Exact replay/no-op does not overwrite it.
- An Admin refund stores its own accepting context on its new refund row. Automatically generated/imported refunds may have absent context; they never invent a request origin.
- Workers use an action root linked to stored payment/attempt and, for a selected Admin refund, its accepting context. Maximum two links/action. No baggage/tracestate/payload is persisted. Context never supplies a lease, idempotency key or permission.
- Extend reviewed owner immutability guards and column grants so ordinary operations cannot replace diagnostic context. Old records are not backfilled from caller headers or guessed trace IDs.
- Context remains with its existing owner record under that record's retention, even after the short-lived trace/log backend expires. It adds bounded non-PII identifiers, no payload. No new deletion/expunge worker or financial retention permission is introduced. Existing retention/grants still govern business rows.

Acceptance: all-null and valid complete context insert successfully; one missing member, uppercase/short/zero trace/span are rejected in real PostgreSQL. Old binaries omit nullable fields; new workers tolerate absent context. Primary facts and receipt bytes are identical with tracing enabled/disabled. Attempt/refund context cannot be replaced by replay, dispatch or ordinary UPDATE privilege.

## Query inventory and evidence

| Owner/path | Inspect before optimizing | Preserve |
| --- | --- | --- |
| Identity authority/counters/cleanup | Indexed user/session/key lookup, fixed-window contention, bounded cleanup | Fresh authority, HMAC subjects, counter-before-domain order |
| Catalog list/detail/search | Publication/category predicates, generated English full-text GIN, ordered partial/composite B-trees, row estimates/sort cost | Current visibility and USD price, stable ordering, page caps |
| Cart view/mutation | Short repeatable-read snapshot, one batch for ≤20 lines, version parent lock | ≤21-row corruption detection and whole-cart expectedVersion |
| Order history/fulfillment | Customer/time/ID keyset scan, snapshot projection, lifecycle locks | Owner privacy, immutable lines/address, cancellation block |
| Inventory reserve/expire | Group/stock indexes, sorted locks, expiry discovery, terminal movement uniqueness | One deadline/terminal effect and no stock oversell |
| Checkout due work/cleanup | Fixed work rows, due/lease indexes, accepted-key uniqueness, unused-quote cleanup | Four-work lock order, claim commit, exact replay/conditional cart cleanup |
| Payments intent/refund/inbox/scan | Parent mapping, O(1) S/R counters, reserved/history indexes, due/scan/wake queries | Verified facts, corrective reversals, original keys/windows, no parent lock after child claim |

Start from each earlier owner's indexes. List exact query template, parameters as synthetic distributions, returned/scanned rows, buffers, spills, execution and lock/pool time, plan version and cumulative calls. Never infer an index is unused from a short warm-up; inspect complete read/write/recovery paths first. Covering/partial/composite indexes are candidates only when actual access benefits them. Do not add GiST/partitioning/replicas solely to practice them.

Enable `pg_stat_statements` through reviewed PostgreSQL configuration and extension authority, with normalized query IDs and restricted access. It requires preload configuration/restart; see [the PostgreSQL module](https://www.postgresql.org/docs/18/pgstatstatements.html). Export fixed owner/query-template aggregates, not query text or parameter values. Runtime/monitor credentials cannot reset statistics or install extensions. Log-duration inspection is operator-restricted with parameter/error-statement disclosure controlled; do not export raw SQL to Loki.

Use `EXPLAIN (ANALYZE, BUFFERS, SETTINGS)` for representative **read-only** operations on isolated synthetic data. It actually runs the statement; mutating analysis can fire triggers or side effects even if a later transaction is rolled back. See [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html). Measure p95 across observations; one plan's execution time is not a percentile.

## Transactions, deadlocks and maintenance

Keep original READ COMMITTED mutations and defined snapshot reads. Original owner row/FK lock graphs remain the source of truth. No new cross-owner diagnostic FK or control-plane global lock is added. No pool connection/transaction spans Stripe or telemetry export.

A deadlock/serialization/lock timeout aborts its transaction. Preserve earlier owner-specific retry allowances; Phase 08 adds no blanket retry. Retry only explicitly safe complete units with original identity and remaining outer time. Repeated deadlocks require a lock-order review, not larger timeouts. Inspect fresh DB clock/authority/lease/window after final waits.

Keep autovacuum and statistics maintenance enabled. Record dead tuples, long transactions/snapshots, relation/index size, disk free and vacuum age. Counter/unused-quote/Identity cleanup keep declared bounded retention and independent budgets. Never delete audit/receipt/financial uncertainty to reduce table size. A dump's long snapshot can increase bloat; observe its impact alongside normal traffic.

## Migration and compatibility

1. Review generated EF SQL, previous/current model snapshots, nullability/defaults/CHECKs/indexes/grants and failure state. No runtime startup migration.
2. Use controlled maintenance for initial nullable diagnostics/constraint changes if lock duration cannot be bounded safely. Existing rows default to null; no large backfill.
3. For a measured large index change, consider `CREATE INDEX CONCURRENTLY` outside the ordinary migration transaction; inspect validity and cleanup after interruption. It cannot execute inside a transaction block; see [CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html).
4. Avoid drop-first index replacement. Verify the new query plan and all uniqueness/foreign-key dependents before a reviewed old-index removal.
5. Large added checks may use NOT VALID plus controlled VALIDATE, but admission to behavior requiring them remains closed until validation succeeds. Record locks and duration; do not label every additive change zero downtime.
6. Activate new producers only after compatible schema, grants and consumers. Roll back application code only to a binary supporting retained source/fact/error semantics; keep additive columns/data.

[EF migration deployment guidance](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying?tabs=dotnet-core-cli) is the implementation reference for reviewed scripts. This document neither generates nor executes one.

## Restore integrity acceptance

Check all owner uniqueness/FKs/CHECKs, canonical cart/version limits, reservation balances/movements, exact Order/attempt/binding/source mappings, four-row Checkout work completeness, financial net S/R/facts/corrections/quarantine and original provider windows. Inspect actual grants after restore, run ANALYZE and compare representative plans. [Backup and restore](../deployment-and-devops/backup-and-restore.md) specifies reconciliation and admission; database structural validity alone cannot establish financial safety.
