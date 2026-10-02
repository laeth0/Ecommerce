# Rollout, Rollback and Executor Handoff

## Baseline and compatibility

Use controlled maintenance/stop/start for owner releases, with Deployment strategy Recreate. Do not infer safe singleton replacement from the strategy flag alone. Actual process/egress evidence is required before successor dispatch.

Independent owner code releases are permitted only within the existing compatible public/private/event/schema contract. No coordinated database transaction or global atomic deploy is claimed.

## Reviewed release procedure

1. Verify exact approved plan/commit/image/config/schema/target/resource/backup fingerprints and current local authority. Acquire one protected release/migration operating lock.
2. Disable HPA/other replica writers. Inspect all actual processes, including terminating/node-partitioned instances, and every enabled pool.
3. Close only affected new admission/dispatch/fulfillment through original owner gates. Preserve exact known receipt replay and safe observation/compensation capacity according to original contracts.
4. Withdraw readiness/traffic and stop claims/consumers. Drain≤15s inside30s grace; record possible sends/unknown work.
5. Verify old process/pools/channels stopped. Payments requires the stronger old-egress proof below.
6. Run any reviewed owner migration under maintenance and one serial authority; no incompatible backup/epoch change overlaps.
7. Start approved compatible image/config with affected gates closed. Verify own schema/epoch/source/grants/protocol, probes, original receipt recovery and full process/resource envelope.
8. For Payments, enable exactly one executor after proof; verify account/rate/work history. For Commerce, verify original decision/stock/hold-release guards before purchase/fulfillment admission.
9. Reopen each proved capability, measure actual valid-request outage/latency/work/debt and record exact release outcome.

Each failure retains current authoritative history and enters Contained. Exceeding the maintenance budget is a failed time objective; timeout does not open gates. A Kubernetes progress-deadline failure does not perform a safe financial rollback automatically.

## Payments external fencing

Payments remains one process with its original API, relay and account executor. No ordinary rolling/blue-green replacement or HPA is allowed.

Before replacement: close new dispatch, wait/cancel old≤2s actions, preserve earliest possible send/params/key/window and prove the old process cannot send again. Approved evidence is actual container/runtime/process termination plus terminated network access, or a verified host/node power/network fence that prevents old egress. Do not rely only on API deletion, lease expiry, certificate-file update, readiness false, desired replica0 or a NetworkPolicy object.

If the node is partitioned, a force-deleted Pod can still have an executing old container. Keep the successor stopped until the original one-process envelope is proved: the old owner process is terminated or its host is verifiably powered off, and old egress is fenced. A network-only dispatch fence is valuable containment but does not authorize a second still-live Payments API/relay process.

After retiring the old process, the successor may bind health and inspect original state with dispatch closed. Enabling dispatch additionally requires the original account/epoch/work evidence. No hidden second Payments process is introduced.

After fencing, use the same accepted work/possible-send identities and retained proof. Retrieve/reconcile Unknown through original rules; do not treat cancellation as definitive provider failure, reset23h windows or release FailedHold/confirmation holds.

An epoch change freezes new process identity under maintenance and blocks stale traffic; it cannot revoke an already in-flight external request. Routine compatible rollout preserves original acceptance epochs and commands.

## Optional serialized Commerce rolling exercise

**Default:** Not run. Admit only for Commerce-compatible code with no active migration/HPA and an approved peak resource/pool/profile/compatibility proof.

An admitted exercise can start with one old full process and permit one new full process under the79 plan. If CPU/memory are the original fixed-total profile, both old/new allocations must actually fit it; an old full-sized Pod plus a new one is a separately approved larger envelope.

Bring up one reviewed new process, verify probes/contracts/receipts, then drain and prove the old process stopped before any additional process. No uncontrolled controller surge or simultaneous terminating third process. Inspect actual runtime state after every step.

At a desired two-Pod deployment, flags maxSurge0/maxUnavailable1 alone do not prove old terminating processes have exited. Kubernetes [Deployment behavior](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) distinguishes rollout availability from all live/terminating resources. Keep the exercise disabled unless its actual serialization/interlock proves the declared ceiling.

A working single surviving replica can reduce downtime only if its remaining measured capacity meets offered traffic and original work obligations. “Zero downtime” requires actual eligible-request evidence for that named exercise; it does not apply to Payments handoff, migration or host loss.

## Rollback

Use an authenticated prior image that is compatible with the current store/metadata/protocol/keys. Contain, drain/fence, replace safely and verify before reopening. Keep the original accepted work and all newer retained state.

Do not restore a pre-release database as a casual undo, reopen the sealed financial copy, delete new records, reset epochs/windows/counts or infer lost authority from logs. Incompatible reverse migration remains contained for reviewed roll-forward or integrated recovery.

## Proof and drill

Record actual old/new process lifetime, pools/resources, requests/outage, source/epoch/key/receipt/due equality, terminal decisions/holds/financial equations, artifact/config/schema fingerprints and rollback/fence evidence.

Exercise stuck termination, image pull/readiness failure, old-node partition, timeout after provider send, duplicate release trigger, incompatible reader and postwrite rollback. A ready image or successful apply cannot pass these branches.
