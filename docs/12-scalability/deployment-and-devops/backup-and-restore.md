# Capacity, Backup and Restore

## Original recovery contract

Retain [Phase 10 paired-v3](../../10-microservices/deployment-and-devops/backup-and-restore.md) and [Phase 11 restore semantics](../../11-distributed-system-reliability/deployment-and-devops/backup-and-restore.md). No manifest version, snapshot atomicity, retention deletion or RPO/RTO promise changes.

Both owner snapshots/authenticated encrypted off-host archives every 12h, full job ≤ 30m, coordinator skew ≤ 60s, ≥ 14 complete pairs/7d, backup connections 4 already counted. RPO ≤ 24h uses older conservative bound; RTO ≤ 2h includes security/grants/session revocation/epoch/process fencing/provider gap/decisions/holds/events and safe reopen.

Growing Catalog/Orders/events changes scan/dump/index/WAL/restore time even if HTTP latency is good. A capacity tier is not admitted when its data volume cannot satisfy original recovery.

## Inventory and optional resources

| Component | Recovery rule |
| --- | --- |
| Primary owners | Complete original tables/constraints/grants/scheduling/receipt/decision/fact/outbox/inbox/tombstone inventory |
| Approved indexes/partitions | Include exact parent/child/index/constraint/grant/dependency/data count/digests in existing inventory |
| Derived Redis | Disposable; no business backup/source authority; fresh namespace/key-version validation after restore |
| Physical standby | Disposable/rebuildable; no promotion or replacement paired backup source; protect cluster-wide data/grants |
| Prototype copies | Protected isolated evidence only; cannot fill missing accepted business history |
| Capacity records | Protected plan/proposal/evidence fingerprints separate from business manifest; no credentials |

No arbitrary archives from different jobs form a pair. No incompatible DDL/cutover/epoch rotation overlaps the bundle. New inventory fits the existing protected fields; a needed manifest wire change would require a reviewed versioned contract.

## Data growth gate

At D0/D1 or any claimed larger retained volume, measure actual per-owner dump/inventory/checksum/encryption/off-host validation time, archive/index/partition/WAL bytes and restore/reconciliation throughput. Include normal load/maintenance interference and cold restore.

Provider population is separately genuine. Estimate gap retrieval/reversal/pagination amplification at original 5/sec/burst 2/concurrency 2; two 2s calls can yield only 1/sec. A million simulator Orders does not imply a million real provider objects.

If volume/missing original history prevents safe recovery ≤ 2h or full scan ≤ 24h, record Failed and keep data/topology growth unapproved. Faster database startup cannot waive provider/authority/source proof.

## Restore and derived invalidation

1. Contain new affected admission/dispatch/fulfillment; fence old provider processes/egress and preserve external possible-effect history.
2. Authenticate complete original pair/schema/grants/key references and restore both owners into an isolated declared target.
3. Validate complete original record/digest/constraint inventories; revoke sessions/obsolete access and rotate active owner deployment epochs.
4. Preserve original acceptance epoch, command/event bytes, earliest-send/window, counts/due/cycle deadlines/R/holds. Overdue work reaches original guarded review.
5. Reconcile exact Commerce terminal decision/stock Consume with Payments hold/barrier/release, original receipts/authority/provider gap and broker canonical sources.
6. Rotate disposable cache namespace before optional reads; old restored version numbers cannot select pre-restore entries. Rebuild/validate standby source/timeline/epoch/grants before optional read fence.
7. Prove one provider executor/fenced old egress, complete gap accounting and no blocking history/integrity scope; reopen each capability with actual evidence.

Missing mapping/authority/decision/source is not reconstructed from cache, standby screenshot, logs or provider metadata. An orphan effect can keep the one-merchant purchase/refund/fulfillment scope closed; ManualReview/quarantine is not reopening permission.

## Partition-specific proof

Dump/restore includes every child, range/hash mapping, constraint and grant. After restore verify original PK/FK/check/global identity and representative pruning/owner query semantics. A missing child or wrong dependency OID blocks writer reopening.

Original evidence retention has no automatic partition drop/archive shortcut. A migration rollback after new writes keeps the current authoritative data, not a stale prepartition copy.

## Evidence

Record conservative pair bounds, job/decryption/off-host checks, service loss/containment, actual restore/security/epoch/provider/source/decision times, derived rebuild/invalidation and safe reopen. Keep exact missing/Failed/Not run branches and actual resources.

No backup, restore, provider reconciliation or optional rebuild is performed by this documentation task.
