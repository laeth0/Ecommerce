# Resource, Process and Connection Budgets

## Original comparison envelope

Retain [Phase 12's complete inventory](../../12-scalability/performance-and-scalability/horizontal-scaling-and-connection-budgets.md). Count every enabled pool, including an idle/terminating process, before authorizing another.

| Role | Ordinary SQL maximum |
| --- | ---: |
| Commerce API, including private decision endpoint |20r |
| Identity cleanup |2r |
| Inventory expiry |2r |
| Checkout commands/hold/simulator/quote cleanup |2r |
| Orders relay |1r |
| Notifications intake/delivery |2r |
| Financial-hint intake |2r |
| Payments API/callback/private routes |3 |
| Payments exclusive executor/inbox/barrier/scan |2 |
| Payments both-outbox relay |1 |
| Monitoring |2 |
| Serial migration |1 |
| Protected operators |4 |
| Paired backup |4 |

Total `31r+17` gives 48 at one Commerce process and 79 at two. Three plan 110 and are prohibited under the ordinary 80 limit. PostgreSQL max_connections100 keeps 17 reserved plus3 superuser slots; runtime/monitor/backup cannot borrow them.

`r` counts actual full enabled processes, not ready endpoints or desired replicas. Old replica pools remain counted until they are closed and process termination is proved. A probe MUST reuse bounded owner API resources; a new diagnostic data source is not free.

WAL senders/replication slots have separate PostgreSQL limits and resource cost, as specified in [Phase 12](../../12-scalability/database/read-replicas-and-consistency.md#pools-and-wal-resource-plan). No standby is activated here.

## CPU and memory

| Workload | Original allocated ceiling |
| --- | --- |
| Commerce total |1.5CPU/1.5GiB, divided across one/two processes in fixed-resource comparisons |
| Payments one process |0.5CPU/0.5GiB |
| Primary PostgreSQL |2CPU/4GiB |
| RabbitMQ node |2CPU/2GiB |
| Diagnostic stack total |4CPU/4GiB |

These sum to 10CPU/12GiB before host OS, Docker/WSL VM, kind control plane, CNI, DNS, Gateway controller/data plane, metrics-server, migration/backup/release tools, image cache and load generator. They are comparison allocations, not a claim that the user's machine has that capacity.

Before implementation, record actual host/VM allocatable CPU/RAM/storage, component request/limit sums, concurrent transient jobs and overhead. Reserve a measured host margin; if the full profile cannot fit, report Not run or a separately declared smaller experiment. Do not silently lower a resource profile and claim the original capacity passed.

No new platform CPU/memory number is fabricated as an already available budget. The approved resourceProfileReference must include those measured allocations before any deployment. HPA uses a separate profile because fixed per-Pod requests change aggregate resources.

## Kubernetes resource policy

Application containers MUST have explicit CPU/memory requests and limits, bounded ephemeral storage, nonroot security and fixed maximum process count. Data workloads MUST have requests/limits and protected PV allocation. Namespace ResourceQuota/LimitRange and admission review MUST reject missing/extra allocations.

The Commerce namespace contains only its application workload and at most two application Pods. Payments contains at most one application Pod. Migration/backup/inspection jobs use a protected separate namespace and existing connection budgets. Verify quota behavior for Pending/Terminating/Failed Pods; do not use force deletion to free a quota while an old node can still execute.

This is defense in depth. Quota/Pod inventory does not fence orphaned containers on a partitioned node; release must verify host/runtime process state and egress where necessary.

Keep Commerce100 public executions/r, private2 command+2 read slots/r; Payments32 HTTP total including callback8, and two original executor action slots. No extra executor, broker retry or pool is added to make a rollout faster.

## Storage and transport

Retain authoritative warning70%/<24h horizon and containment85%/<6h; stricter event budget≥90% or primary free disk<5GiB still applies. Broker free<2GiB warns, <1GiB/alarm blocks publication; queues/parking80% alert.

Primary data, indexes, WAL, temp, image layers, node filesystem, broker log/queues, diagnostics, backup staging and off-host archives need separate measurements. Kubernetes ephemeral-storage pressure or full Docker disk can affect every workload even if a PVC appears healthy.

The original broker10GiB volume, event/index8GiB measurement budget and diagnostic volumes remain declared initial targets. Primary PV sizing uses actual retained data/WAL/maintenance/backup horizon; it is not guessed from product count.

## Acceptance

Record actual process/pool/request/limit/bytes inventory during baseline, release, HPA and restore. Reject unbudgeted helpers, sidecars, connection aliases, controller probes or concurrent jobs. Compare useful throughput per allocated CPU/GiB and complete latency/error/debt before claiming benefit.
