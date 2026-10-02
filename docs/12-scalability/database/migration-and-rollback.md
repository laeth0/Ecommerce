# Gated Migration, Adoption and Rollback

## Default and proposal boundary

No application/persistent schema/topology change is applied here. PostgreSQL tuning proposals, optional Redis/standby/hash-line candidates and any larger resource/pool change need measured gate evidence and current authorization for the concrete scope.

Keep all original owner tables/keys/receipts/cursors/facts/events/provider windows and the paired-v3 format. An isolated performance copy is never an accepted financial/event/stock source.

## Adoption checklist

1. **Inventory:** record actual artifacts, schema/constraints/FKs/indexes/triggers/collations/grants, owner processes/pools/queues/keys/epochs and original record counts/digests. Inspect the installed implementation before writing a migration.
2. **Measure:** record the baseline and named bottleneck with full denominators, representative data/skew and query/write/maintenance evidence.
3. **Propose:** specify the mechanism, eligible fields/reads, resource/connection/security/failure/rollback design and proof that earlier guarantees survive.
4. **Approve prototype:** establish current operator/reviewer authority outside request JSON; name the isolated target, rates/data, bounded duration and abort/reversal.
5. **Validate:** measure benefit and the full baseline, hot-row safety, dependency failure, privacy, retention and timed restore. Missing evidence remains Not run.
6. **Prepare concrete adoption:** specify compatible readers/writers, maintenance, valid overlap budget, one designated writer, authenticated off-host backup and safe rollback boundary.
7. **Quiesce/migrate:** stop relevant admission/claims, finish or fence possible sends and active writers; copy/backfill through the owner-controlled process with exact counts/digests/identity/FK/equation proof. No dual event/financial producer.
8. **Verify/reopen:** check original grants/protocol/epoch/process/provider identity, plans, due/count/window equality, one executor and safe capability reopening. Record actual operation timings.

## Mechanism-specific rules

| Mechanism | Safe activation/rollback |
| --- | --- |
| Query/index | Original schema semantics and constraint indexes remain; inspect invalid/failure state; compatible query rollback |
| Redis candidate | Primary authority retained; gradual warming within fill budget; namespace/producer integrity; disable to bounded primary path; no business restore from cache |
| Standby candidate | No promotion; fixed source/timeline/epoch/grants/fence; count primary WAL/slot/connection/disk budget; disable routing before rebuild/removal |
| Hash Order-line adoption | Preserve existing PK(order_id, product_id), FKs/checks and immutable lines; switch one writer after complete exact copy; review parent/child permissions and all code paths |
| Larger resource/replica/pool profile | User-authorized allocation and complete replacement connection budget, maintenance/overlap/recovery costs; no borrowed reserved slots |
| New queue layout | Not selected; separate approved wire/routing/dedup/parking/sink/cutover design required |

Renaming tables does not automatically retarget every FK/view/function/grant/ORM mapping to a replacement OID. Inventory and explicitly migrate dependencies; if the owner graph cannot be preserved, do not adopt. No runtime dynamic SQL or generic repository is introduced to disguise a cutover.

## Rollback boundary

Before new authoritative writes, a reversible isolated prototype can be discarded with egress fenced and accepted work retained in its original owner. Discarding a clone is not deleting production financial history.

After new authoritative writes, roll back only to a compatible release using the current owner store and all newly retained metadata. Never reopen the sealed old Payments copy, rewind Order/stock/money, erase commands/resume receipts or reset first-send/cycles/epochs.

A partition adoption rollback needs a complete authoritative data move preserving all new writes and dependencies. If no safe reverse migration exists, roll forward under containment. Destructive down migration is never implied by application rollback.

## Compatibility and locks

Closed v1 public/private/event objects remain closed. Added fields/enums/cursor semantics require a reviewed reader policy or v2; no such wire change is specified.

Current owner lock order, claim/lease/token/epoch fencing and sorted stock locks remain. Mutation/audit/outbox commit atomically even when a table is partitioned. No database connection spans Redis, standby, broker or provider I/O.

## Evidence for review

Retain proposal/run IDs, artifact/schema/config/resource/identity fingerprints, all gate outcomes, copy counts/immutable digests, grants/negative access, possible-send/worker fencing proof, backup/restore timing and before/after latency/WAL/disk/queue debt.

Abort on violated global uniqueness/source identity, unexplained money/stock/provider effect, a second executor, unsupported public staleness, unbudgeted sessions or lost audit/accepted history. Preserve original uncertainty; do not repair by creating new keys or clearing holds.
