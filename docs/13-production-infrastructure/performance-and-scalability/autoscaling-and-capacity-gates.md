# Autoscaling and Capacity Gates

**Default:** fixed one/two Commerce processes selected through the measured resource profile. HPA, node autoscaling and vertical autoscaling are disabled. Payments remains one process/executor.

## Problem and gate

Horizontal scaling helps only when more safe Commerce execution capacity reduces an application bottleneck. It cannot raise primary quotas, serialize one hot stock row faster, increase account provider limits or eliminate retained recovery cost.

Before an HPA prototype:

1. Pass dependent Phase 11/12 safety/recovery and actual manual one/two-process comparison.
2. Demonstrate sustained named application CPU pressure at the valid workload, while primary/pools/hot locks/provider/queues/scan/storage have headroom.
3. Approve the complete new resource profile and all metric/controller overhead. Use the original 48/79 SQL inventory.
4. Prove supported CNI, metric API, requests/limits, exact process/termination interlock, worker fencing and stop/reversal.
5. Keep no more than two actual full processes, including old/terminating/orphaned processes.

If any gate is missing, the prototype is Not run. A lower CPU graph alone does not satisfy it.

## Candidate feedback settings

| Setting | Proposed gated value |
| --- | --- |
| API | Supported stable autoscaling/v2 |
| Target | Commerce only |
| Minimum/maximum desired replicas |1/2 |
| CPU target |60% of explicit per-Pod CPU request |
| Scale-up stabilization |60s |
| Scale-up bound |At most one Pod per60s |
| Scale-down stabilization |300s |
| Scale-down bound |At most one Pod per300s |
| Owner release/migration/restore |HPA removed/suspended through reviewed desired-state ownership before changes |
| Metrics failure/stuck termination |No safe scale-up; contain experiment and preserve bounded current work |

Use a constant per-Pod Commerce request/limit in this prototype, sized so its two-Pod peak and Payments fit the approved profile. This differs from the Phase 12 fixed-total allocation; report that resource change explicitly.

No controller may simultaneously own replicas with a release tool or another autoscaler. An HPA desired max2 is insufficient to enforce actual process max2 during deletion/replacement. A reviewed interlock must verify quota, actual runtime processes and closed old pools before permitting another process. Kubernetes HPA is a delayed control loop; missing metrics/readiness and request configuration affect its decisions. See [HPA behavior](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## Measurement and edge cases

Measure demand→metric availability→desired change→scheduling→image start→readiness→actual useful completion. Include dropped offered iterations, valid quota503/429, pool startup, GC/CPU throttling, event amplification and old-process drain.

Reproduce load up/down, missing/stale metrics, Pending scheduling, image pull failure, slow readiness, crash, stuck termination and desired-state conflict. At most one scale action per configured policy; no hidden client retry or benchmark-only token/source bypass.

Known metric/controller behavior MUST be verified for the pinned version. A telemetry outage is not permission to manually force an unsafe third process. Accepted work continues through the original claims/leases/receipt rules.

## Rolling/autoscaling interaction

The HPA experiment is disabled before rollout. Baseline Recreate release has an intentional measured outage; its preconditions differ from a rolling exercise.

After release, verify actual process count and profile before reactivating the same approved HPA proposal. A different artifact/resource/quota profile invalidates earlier comparison assumptions.

Payments, PostgreSQL, RabbitMQ and diagnostics have no automatic scaling policy in this phase. Multiple RabbitMQ replicas would require a new quorum/failure-domain/storage plan; two Payments processes would require a new external-executor fencing design.

## Exit

Show useful-rate/latency improvement or a reasoned rejection, aggregate cost, startup/shutdown delay, actual peak process/pool counts and original invariants. Keep 1,000-user reached/unreached status honest; 10k/100k remain Analytical until separately admitted and measured.
