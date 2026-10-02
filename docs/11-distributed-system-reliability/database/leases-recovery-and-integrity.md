# Persistence, Leases, Recovery and Integrity

**Status:** future implementation design. No migration or SQL is executed by this phase documentation.

## Ownership and narrow additions

Commerce stores all Checkout scheduling/decisions/authority/work and Orders/Inventory state. Payments stores all financial work/holds/provider proof and receipts. No cross-database FK, join, FDW, dblink, shared runtime credentials or transaction is introduced.

Reuse existing work/command/outbox/delivery tables. Add fields to their actual owner rows rather than one generic workflow store:

| Metadata | Constraint / use |
| --- | --- |
| cycle | Exact bigint1..2^53−1; reuse existing field, add to checkout.work if absent |
| work_version | Exact bigint1..2^53−1; reuse existing work version; add to checkout.work/payments.financial_work where absent |
| retry_profile | Legacy or rel11-equal-jitter-v1, never a caller-chosen algorithm |
| cycle_started_at / cycle_deadline_at | Both null for inactive legacy work or paired; activated deadline exactly start+300s |
| retry_delay_ms | Nullable for initial/no retry; new profile integer1,000..30,000 within attempt-specific range |
| scheduling_reason | Nullable bounded diagnostic enum from retry policy; map to existing public owner error projections |
| next_action_at / lease_token / lease_expires_at | Reuse existing names/checks; no second competing scheduler |

Work version advances for claim, result/deferral schedule, resume and other guarded work mutations. It does not change Order business version, financial fact identity or financial version solely to record retry metadata. A financial wake version retains its existing distinct meaning; do not use it, xmin or timestamps as the work's optimistic version.

Cycles belong to the existing work unit. Parent Purchase/Compensation/Cancellation work and its required command retain consistent scheduled/review projection in one Commerce transaction. They cannot alternate independent resets to bypass a deadline. A new command for a genuinely never-admitted stale-version acquisition keeps the original confirmation identity and requires explicit prior outcome proof.

A command observation also consumes its applicable parent recovery budget; moving from receipt query to evidence/hold query cannot obtain a fresh parent allowance. Its effective dispatch ceiling includes the active parent's deadline even if the child's own stored start+300s deadline is later. Parent exhaustion projects review to its unresolved required command work under the same local transaction; original result inspection/hold safety remains intact. Resume of reviewed required work checks all affected parent/child state and leases under the original locks, then records every changed row/version in the audit; it cannot silently reset a still-active associated cycle. Terminal commands/decisions remain untouched. At the safe-integer version/cycle limit, stop in explicit integrity review; never wrap or serialize an inexact number.

## Original-work operation receipts

Add owner-local `checkout.work_resume_receipts` and `payments.work_resume_receipts`, each for the typed resume operation only. Retain existing event replay, remote replay, refund receipt and failed-compensation repair tables for their own meanings.

Receipt fields: operation_id UUID PK; authenticated operator_id UUID; server request_id UUID; target_kind bounded owner subset; target_id UUID; canonical_request bytea1..2,048; digest bytea32; before_version/after_version/cycle exact positive safe bigint; outcome Scheduled/AlreadyScheduled/Terminal; canonical_result bytea1..2,048; recorded_at timestamptz. Append original reason/evidence and audit linkage in the same transaction. Unique operation identity compares actor and bytes, not only digest. Commerce target kinds cannot appear in Payments receipts and vice versa.

Extend the existing owner audit-kind checks/readers with WorkResumed and WorkResumeObserved for changed scheduling and AlreadyScheduled/Terminal observations respectively; preserve every prior kind. Store operation ID, authenticated actor, target, reason/evidence references, before/after work versions, cycle and primary time. A same-operation receipt replay creates no second mutation audit. Grant only the appropriate protected operator capability access to receipt insertion and owner-validated scheduling.

Composite checkout.work targets use (attempt_id, kind); all others use their existing PK. Typed target validation is mandatory inside the owner transaction; a single polymorphic target_id cannot create cross-owner FK authority. Local facts/audits/decisions referenced as evidence must exist and match the target. Runtime workers cannot create human authority receipts.

Concurrent operationId insertion conflict rolls back tentative scheduling and audit, then compares the immutable winner after rollback. There is no partial “scheduled without receipt” result.

## Claim and apply protocol

1. Check the process-frozen deployment epoch against the active owner epoch and available action slot.
2. Select a bounded eligible due candidate using the indexed due order and `FOR UPDATE SKIP LOCKED`. Claims are short standalone transactions; they never acquire business locks afterward in that same transaction.
3. Recheck work state/due/cycle budget/lease. Increment count/work version and set a new random lease token/primary expiry; commit before I/O.
4. Release connection, perform one bounded observation or known local step. Each additional network observation must be charged before its send. Before dispatch, recheck current action/lease eligibility, process epoch and all original provider/stock/window guards applicable to that action; a paused expired action cannot send just because it once held a claim.
5. Apply under original owner business lock order and recheck current token, unexpired lease, work version, epoch and mapping. Store canonical known result/evidence or classified retry schedule; clear/retain lease according to the existing action protocol.
6. A stale apply is ignored as local application and diagnosed. The remote result may still be real; current work queries the original owner identity.

PostgreSQL notes that `SKIP LOCKED` gives an inconsistent view appropriate to queue-like selection rather than ordinary business reads. It does not provide financial isolation or fair scheduling by itself. See [SELECT locking clauses](https://www.postgresql.org/docs/18/sql-select.html).

Never manually clear a lease to claim that a possible provider send did not execute. Local lease fencing prevents stale database apply; original provider identity/window and process/egress fencing address external uncertainty.

## Exact lock discipline

- Commerce operational apply/resume: CartCleanup → Cancellation → Compensation → Purchase work, then attempt → Order → sorted Inventory group/stock where required, then local coordination/work metadata → receipt/audit/outbox. Reuse the full existing order even if one operation touches a subset.
- Admin authorization: Identity → actor/key serialization → immutable command/audit; no reverse acquisition of mutable Order/stock/work.
- Payments: integration root → intent → confirmation hold → case → sorted refunds → mutation/fact/deferred/work → receipt/audit/outboxes. Every financial writer checks root/hold, including callback application, scan and operator repair.
- Transport-only replay retains its earlier quarantine → one target transport-row discipline, without business rows.

Ordinary writes remain Read Committed with explicit owner locks; multi-query financial snapshots remain bounded Repeatable Read. Retry only whole local known-rolled-back 40P01/40001 transactions, at most once within deadline. No retry delegate includes network I/O.

## Index and query plan requirements

Retain existing partial due, expired lease and unapplied deferred sequence indexes. Add/extend only when plans show a need:

- Pending/Scheduled due index on (next_action_at, stable target identity).
- Active expired lease index on (lease_expires_at, stable identity).
- Active cycle-deadline index on (cycle_deadline_at, stable identity) for bounded exhaustion sweep.
- ManualReview index on (changed_at, stable identity) for protected keyset inspection.
- Receipt PK operation_id and measured target/time lookup index if incident history needs it.

Inspect `EXPLAIN (ANALYZE, BUFFERS)` on sanitized isolated owner data for due, lease reclaim, deadline sweep and inspection. Include selectivity at healthy/incident backlog and lock/WAL write cost. Use an isolated transaction for write-plan analysis and roll back only when all effects are local; do not run a provider worker as an EXPLAIN experiment.

No table partitioning/GIN/GiST/covering index is mandated without a matching query and measured gain. Retained history growth is a capacity input; avoid scan-and-delete cleanup.

## Migration and scheduling-policy activation

1. Inventory actual implementations, owner schema/column/grant checks, inactive and active cycles, pools and exact prior due/receipt digests. Detect fields already supplied by earlier implementations before adding them.
2. Expand nullable scheduling fields/new receipt tables and compatible reader support. Preserve existing state enum checks/public projections. Backfill work versions/cycles deterministically with retained migration audit.
3. Quiesce claims in the existing maintenance procedure; finish/fence old writers and record active leases/possible sends. No concurrent legacy writer may resample or overwrite the new profile.
4. For inactive/terminal records, retain null cycle times and their historical metadata. For active legacy work, derive start from original retained cycle evidence and deadline=start+300s. If start cannot be proved, keep ManualReview with cause; do not invent a fresh cycle.
5. Preserve every committed next_action_at, count, first-send/window, immutable command/event bytes and original identity. Already expired cycles are reviewed; active unexpired leases retain their protection.
6. Activate the owner profile fingerprint after both services/readers are compatible. Only newly committed retries draw bounded jitter. Record counts/digests before/after and negative grant checks.
7. Resume claims under the original pool/slot budget; compare due-time dispersion and amplification. Retain old schedules as legacy until naturally resolved.

Rollback may disable new breaker admission behavior or restore a compatible application release, but cannot erase newly accepted metadata/receipts or rewind a budget. Old releases that cannot understand the scheduling overlay are ineligible rollback targets. Keep schema expansion; a destructive down migration is not implied by application rollback.

## Integrity and retention

Amounts, mappings, decisions, provider mutation parameters, canonical facts/events and successful receipt results are immutable under the earlier rules. Scheduling changes do not repair financial contradictions. Persist audit failures as operational failures; never commit an unaudited operator change.

Backups include new work fields/receipts/audit kinds and original inactive cycles. Restore preserves due/first-send times; obsolete process epochs are rejected before mutations/claims/dispatch. No automatic evidence deletion or new tombstone expiry policy is introduced.
