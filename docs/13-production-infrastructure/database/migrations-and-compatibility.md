# Owner Migrations and Release Compatibility

## Trigger and fixed boundaries

Container replacement does not make schema change safe. Mixed releases can interpret scheduling metadata, enum values, constraints or grant policy differently. Retain the [Phase 10 cutover](../../10-microservices/database/migration-and-cutover.md), [Phase 11 scheduling migration](../../11-distributed-system-reliability/database/leases-recovery-and-integrity.md) and [Phase 12 adoption rules](../../12-scalability/database/migration-and-rollback.md).

This task creates no migration, schema change or new release table. Protected release artifacts refer to exact existing owner schema fingerprints and required readers.

## Compatibility matrix

Every migration proposal MUST list:

- Old/new Commerce and Payments artifacts and supported public/private/event versions.
- Existing, expanded and contracted schema fingerprints; readable metadata and permitted writer for each stage.
- Original retry-profile/legacy due-time and receipt readers, source bindings and accepted command/event bytes.
- Grant/constraint/index dependencies, lock order, copy counts/digests, disk/maintenance and paired backup effects.
- Compatible postwrite rollback target and a contained roll-forward plan if no safe reverse migration exists.

Closed v1 DTOs/enums cannot acquire fields silently. Consumer-before-producer and versioned retained readers remain required for a genuine contract evolution; no such evolution is selected here.

## One migration authority

Use one protected migration job at a time across the shared PostgreSQL server and one ordinary SQL connection already in the 48/79 plan. Separate scoped owner credentials perform only that owner's reviewed DDL. Application Pods have no migration credentials and MUST NOT auto-migrate on startup.

A Kubernetes Job can be retried or duplicated. Use exact migration identity/history and a protected database serialization guard; do not assume Job parallelism1 or workflow concurrency is sufficient. Unknown DDL commit is inspected before repeating. No provider/broker I/O occurs inside a migration transaction.

Baseline changes run under maintenance: close affected admission, quiesce/verify writers and workers, exclude backup/epoch/cutover conflicts, and perform bounded DDL. Transaction-capable migrations commit atomically; special commands such as concurrent indexing have separately reviewed validity/cleanup behavior.

Original runtime lock250ms/command2s/transaction3s remain. A longer migration operation needs a reviewed finite migration-specific deadline/resource plan; it cannot silently change runtime budgets.

## Expand/contract learning sequence

1. Inspect actual dependency graph and old-reader behavior. Establish current usable paired backup and timed recovery evidence.
2. Add backward-compatible nullable/defaulted metadata or a safe index only where the actual implementation needs it.
3. Deploy compatible readers before a new writer/profile activates. Preserve old original due/count/epoch/window evidence.
4. Quiesce incompatible writers; activate the reviewed owner policy under maintenance.
5. Verify exact original IDs/bytes/constraints/grants and new metadata before reopening.
6. Defer contract cleanup until no supported/rollback reader needs it and retained records remain interpretable.

This teaches expand/contract; it does not promise zero downtime for arbitrary DDL. A needed incompatible change uses explicit maintenance/versioning and safe migration scope.

## Rollback and persistent history

Application rollback uses the current authoritative store and retained metadata. Never reactivate the sealed pre-extraction Payments copy, rewind provider effects, delete original commands/receipts/tombstones or reset stock/hold/first-send/retry identities.

A backup is disaster recovery material, not an automatic release undo. Restore after accepted writes requires full old-process/provider-gap/owner reconciliation; a pre-release snapshot may omit external effects.

Partition/cache/standby adoption remains gated by Phase 12. Table rename does not retarget every dependency OID/ORM/FK automatically. An incompatible reverse data move remains contained; prefer reviewed roll-forward if no safe rollback exists.

## Required evidence

Record exact migration digest, authenticated authority, lock/operation timings, actual pre/post schema/grants/counts/digests, writer inventory, supported rollback artifact and failed/unknown branches. Verify omitted/wrong grant, duplicate job, interrupted DDL, stale writer, backup overlap and postwrite rollback scenarios.
