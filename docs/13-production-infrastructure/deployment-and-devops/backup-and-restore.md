# Infrastructure Backup and Integrated Restore

## Recovery unit

Retain [Phase 10 paired-v3](../../10-microservices/deployment-and-devops/backup-and-restore.md), [Phase 11 recovery](../../11-distributed-system-reliability/deployment-and-devops/backup-and-restore.md) and [Phase 12 data-volume gates](../../12-scalability/deployment-and-devops/backup-and-restore.md).

Both complete owner databases, exact retained metadata/constraints/grants/artifact/schema/configuration/source inventory, current protected keys and external provider reconciliation access form the recovery unit. Kubernetes manifests/etcd/PVC snapshots or broker persistence alone are insufficient.

No new backup manifest version, PITR system, database replica/promotion, managed storage service or smaller recovery objective is introduced.

## Original schedule and resources

Every12h start one paired job. Each database has its own read-only REPEATABLE READ snapshot coordinator and one serial custom-format pg_dump importing that snapshot. Two coordinators plus two dumps use the original four ordinary connections.

Conservative primary UTC bound is captured immediately before own snapshot acquisition. Coordinators start within60s; inventory/counts use each archive's snapshot. The two databases have independent consistent snapshots; no global atomic snapshot is claimed.

Full dump/inventory/encryption/authenticated manifest/off-host read-back/decryption completes≤30m. Any owner failure/skew/schema/inventory/authentication mismatch makes the whole bundle unusable. Retain≥14 complete paired bundles/7d plus one in progress.

Use a protected backup Job/CronJob identity and scoped owner credentials. Forbid schedule overlap, reject duplicate active job, use no automatic blind job retry and keep the job bound≤30m. Kubernetes schedule/concurrency flags do not fence an orphan old job; inspect actual coordinators/connections under the operating lock before replacement.

Backup cannot overlap incompatible DDL/epoch/writer cutover. Ordinary application health/drain does not grant migration/backup superuser access.

## Off-host and key requirements

The approved no-cloud-spend baseline still requires an actual protected off-host recovery target, such as an already available separate machine or separately managed offline medium. Exact facility/capacity/transport/encryption access must be reviewed before operational admission; none is created here.

A host directory, kind volume, Docker volume or another partition on the same machine is not off-host. If no independent target/current key access exists, backup/host-loss recovery gates remain Not run and hosted operation cannot be declared complete.

Store current secret/CA/JWT/provider/webhook/cursor/backup-key version references and protected recovery material separately from owner archives. No plaintext credential or personal kubeconfig enters the manifest or CI bundle.

## Platform reconstruction

Retain approved supported tool/image/CRD/CNI/Gateway/policy/resource/storage mapping inventory outside disposable cluster state. Rebuild an isolated target from exact compatible inputs and verify actual cluster identity, grants, encryption and retained volume paths.

Cluster/etcd recovery is platform evidence, not a replacement paired owner snapshot. A local PV copied after a crash needs original database integrity and accepted-history proof; mounting it does not certify a causal recovery point.

## Integrated restore

1. Start the RTO clock at declared service loss. Contain new purchase/refund/fulfillment and affected writers/relays/consumers. Prove old provider processes/egress fenced.
2. Authenticate a complete usable paired-v3, both encrypted archive digests/read-back and current decryption/access/version material. Use the older conservative bound for actual RPO.
3. Build isolated compatible platform/data targets; keep provider egress/worker dispatch stopped. Restore both owners with stop-on-error and protected existing restore resources.
4. Match complete original schema/constraints/grants/counts/immutable inventories, including new retained scheduling/receipt/source/decision metadata. Validate data-root identity.
5. Recover current keys/access, revoke restored sessions and require fresh login. Rotate active paired runtime epoch under containment; retain immutable original acceptance epochs/keys/bytes/windows/counts/due times.
6. Reconcile each one-sided command/refund/hold/terminal decision/release/stock case using original owner APIs/tools and authenticated retained history.
7. Establish provider gap from at least5m before the older bound through proven quiescence/current inspection. Enumerate all original accounts/APIs and old objects changed/reversed during the gap; creation-time-only lookup is insufficient.
8. Apply only verified original evidence. Missing authority/mapping/earliest-send/Consume cannot be guessed from provider metadata or logs. Unknown money retains original R/holds/windows and safe compensation rules.
9. Validate broker messages against each restored canonical owner outbox before intake/replay. Ahead/missing/conflicting source is quarantined; events cannot invent a paid/confirmed Order.
10. Revalidate private scopes/epoch/process/grants, current source and exactly one executor. Reopen only proved consistent capabilities; an unresolved provider orphan can hold the one-merchant account scope.
11. Stop RTO only at safe integrated service. Record objective miss and remain contained where necessary; two hours never authorizes unsafe reopen.

RPO≤24h and RTO≤2h remain goals. Finite RPO can lose accepted local history; there is no unconditional zero financial loss promise. Genuine provider drill≤100 affected objects and all discovery/action calls share5/sec/burst2/concurrency2.

## Derived/diagnostic recovery

Diagnostics may be lost/rebuilt within original policies; their absence is an evidence gap. Optional cache/standby remains disabled unless its separate gate was activated; a restored cache namespace or ahead-of-restore replica cannot establish business permission.

If optional derived resources were genuinely adopted, perform Phase 12 namespace rotation/standby rebuild and layout inventory before routing resumes. Do not populate lost owner authority from those copies.

## Drill and acceptance

Rehearse isolated restore monthly and after material protocol/schema/source/secret/storage changes. Cover corrupt/missing archives/keys, both snapshot asymmetries, old-refund reversal, lost earliest-send, missing canonical outbox, stale process/epoch and unresolved executor fencing.

Measure dump/off-host/restore/reconciliation/reopen with actual data/resources under declared maintenance/load interference. A fast Pod restart or dump cannot pass integrated recovery. No backup, restore, provider operation or medium is executed by this documentation task.
