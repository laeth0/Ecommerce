# Persistent State and Ownership

## Preserved owner model

No business table, persistent identifier, precision, index/partition layout, isolation rule or ownership changes merely because the process runs in Kubernetes.

Commerce credentials CONNECT only to its logical database and original schemas. Payments credentials CONNECT only to its database/payments schema. No FDW/dblink, shared runtime migration credential, cross-owner SQL/foreign key or distributed database transaction is added.

Keep current sorted Inventory locking, owner transaction/audit/outbox boundaries, exact original command/event bytes, acceptance epochs, provider windows, retry profiles/counts/due times, compensation R/hold and source-ID uniqueness.

## Storage inventory

| Persistent component | Required inventory / transition rule |
| --- | --- |
| PostgreSQL | One protected data root, actual PGDATA/tablespace/WAL locations, both logical databases/grants, pinned image and compatible filesystem ownership |
| RabbitMQ | One durable node data root, stable node identity/vhost/topology/policies, original queues and credentials |
| Prometheus |35d/12GiB data cap inside16GiB volume; diagnostic policy |
| Tempo/Loki |72h/8GiB traces;7d/8GiB logs; original bounded retention |
| Grafana | Original protected settings/dashboard state; separate operator access |
| Backup staging | Bounded temporary protected encrypted output; not the off-host recovery copy |
| Current keys/certificates | Separate protected recovery material; not recovered from application tables or image layers |

The pinned PostgreSQL image determines its data directory and UID/GID. Inspect it; do not assume an older image's volume path. Verify mounted bytes are actually used before starting writers.

## Host-backed local PV design

Use protected host directories outside disposable kind node-container layers, explicitly mapped into the selected node and referenced by local PVs. Owner/data-directory mapping is fixed and inventoried. The data root and runtime filesystem must meet actual PostgreSQL/RabbitMQ durability semantics.

Data PV reclaim policy is Retain; storage administration is separate from ordinary application release. Stateful components are single replicas with stable identity and reviewed shutdown/restart. Avoid a provisioning default that deletes the host path when a PVC or cluster object is removed.

Confirm node affinity, filesystem ownership, encryption, access-mode behavior and mount persistence under Pod/node-container/cluster recreation. RWO does not prove single-process fencing. A scheduling object or stale attachment can coexist with an orphan old process; application/database quiescence still needs proof.

Kubernetes [PV/PVC semantics](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) describe attachment/reclaim behavior. This project's host mappings, grants and recovery inventory are additional requirements.

## Data loss boundaries

Pod restart, kind-node recreation, cluster recreation and physical host loss are different drills. Protected host-mounted data can survive the first three only if actual path/mount/removal behavior is proven. The physical host's loss requires an authenticated off-host pair and current decryption/secret access.

Multiple node containers on the same machine do not isolate host disk/kernel/power failure. A directory on another partition of the same host is not an off-host backup.

PostgreSQL fsync/durability and original commit guarantees MUST remain enabled. RabbitMQ uses original single-member quorum queues; no replicated durability or majority-survival claim follows from the queue name.

## Retention and disk pressure

No automatic prune/truncate/drop/detach operation removes accepted business/audit/outbox/inbox/receipt/tombstone history. Diagnostic cleanup obeys earlier limits and cannot be applied to owner evidence.

Measure data/index/WAL/temp and snapshot-bloat growth, broker logs/unacked/parking, Docker image/ephemeral space and staging/archive needs. Stop unsupported data growth/new affected admission at inherited gates while preserving resolution capacity.

## Reattachment verification

Keep writers/provider egress stopped. Match data-root identity, PostgreSQL major/schema/grants, broker node/vhost/topology, owner row counts/constraints/immutable inventory and active epoch. A missing empty mount MUST fail startup rather than silently initialize a new accepted-history store.

For genuine restored data use [integrated restore](../deployment-and-devops/backup-and-restore.md), not a routine reattachment shortcut. No accepted mapping/authority/Consume is reconstructed from broker or diagnostics.
