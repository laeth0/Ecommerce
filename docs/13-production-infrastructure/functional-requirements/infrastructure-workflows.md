# Infrastructure Functional Requirements

MUST/MUST NOT denote release gates. Requirements add protected operating workflows; all public APIs, private mTLS contracts, original owner receipts and event bytes remain unchanged.

## INF-FR-01 — Build and identify the artifact

**Actor/trigger:** engineer submits an approved source revision.
**Preconditions:** reviewed supported dependency locks/toolchain and no runtime credentials in build context.
**Flow:** verify source and existing static checks, run existing relevant tests if available, build owner images once, scan dependencies/images/secrets and produce protected digest/SBOM/provenance evidence.
**Errors:** missing checks, mutable artifact identity, reachable unresolved high/critical finding or leaked credential blocks promotion; no success by skipping a required gate.
**Acceptance:** Given an approved revision, When promotion occurs, Then the same verified image digest is deployed without a rebuild and no application/cluster/provider secret reaches the build.

## INF-FR-02 — Prepare the local platform

**Actor:** platform operator.
**Preconditions:** explicit kind/host identity, supported version matrix, available resource/storage budget and protected prior data.
**Flow:** establish private cluster access, namespace/RBAC/CNI enforcement, reviewed resource objects and retained host-backed volumes; prove original owner grants and separate environment identities.
**Edges:** an unsupported CNI, unknown storage persistence or insufficient host allocation makes the dependent setup Not run.
**Acceptance:** Given a node or cluster recreation, When storage is reattached, Then original owner data/constraints/grants are validated before a writer starts; no new executor runs concurrently with Compose.

## INF-FR-03 — Expose only the original HTTPS contract

**Actor:** private sandbox client/provider callback.
**Preconditions:** approved TLS listener, exact host/routes, backend HTTPS identity and trusted proxy inventory.
**Flow:** validate bounded transport, strip untrusted forwarding/correlation authority, route Commerce retail and exact signed Payments callback, preserve permitted headers/body and original Problem responses.
**Edges:** internal/management access, wrong host/path, rewritten callback bytes or unsafe backend trust blocks readiness.
**Acceptance:** Given a freshly signed callback, When it crosses the edge, Then Payments verifies the original bytes and returns 200 only after its durable receipt; an edge-generated 200 is forbidden.

## INF-FR-04 — Supply and rotate configuration/secrets

**Actor:** scoped security/operator identity.
**Preconditions:** current protected secret versions, owner Options boundaries, CA/SAN/EKU/role policy and external recovery access.
**Flow:** inject owner-specific references, verify effective nonsecret fingerprints, rotate within original overlap rules and terminate affected connections on revocation.
**Edges:** missing key/source/epoch, divergent limits or unavailable decryption keeps affected capability closed.
**Acceptance:** Given a revoked private identity, When a reused connection or new request is attempted, Then it cannot keep financial authority merely because a secret volume was updated.

## INF-FR-05 — Obtain protected release approval

**Actor:** release reviewer and separate scoped local deploy authority.
**Preconditions:** exact plan/commit/image/config/schema/target digest and complete required evidence.
**Flow:** approve that immutable plan, verify actual cluster identity/current permission locally, acquire one release/migration operating lock and execute only the declared scope.
**Edges:** changed plan, stale approval, wrong target, unavailable repository protection or concurrent release blocks application.
**Acceptance:** Given an approval for plan A, When plan bytes/image/target change, Then approval does not authorize plan B; a new reviewed release identity is required.

## INF-FR-06 — Release compatible applications safely

**Actor:** owner release operator.
**Preconditions:** compatible readers/schema/events, original gates/receipts and verified process/pool budget.
**Flow:** contain affected admission, suspend scaling, drain/stop old processes, prove quiescence, apply reviewed images, validate probes/negative access/original receipt recovery and reopen capabilities.
**Edges:** ambiguous apply or failed readiness is inspected by exact release/target generation; never rebuild, truncate history or reopen by timeout.
**Acceptance:** Given accepted work, When Recreate or a gated serialized Commerce rollout occurs, Then original receipt/key/stock/decision history survives and actual full Commerce processes never exceed two.

## INF-FR-07 — Hand off the Payments executor

**Actor:** protected financial operator.
**Preconditions:** no second executor, original possible-send/key/window record and current account/epoch proof.
**Flow:** close new affected financial admission/dispatch, finish or cancel bounded calls, preserve Unknown results, stop old process and prove old egress impossible; only then enable one successor with original work.
**Edges:** node partition, force-deleted Pod, lease expiry or unproved shutdown keeps successor dispatch disabled.
**Acceptance:** Given a provider timeout during replacement, When the successor inspects work, Then it uses the original identity/earliest-send and cannot infer definitive failure or start a new POST window.

## INF-FR-08 — Migrate owner state

**Actor:** owner migration authority.
**Preconditions:** exact reviewed migration, current backup/recovery evidence, one serial migration slot and compatible reader/writer inventory.
**Flow:** quiesce relevant writers/backup conflict, apply bounded owner-local changes, validate constraints/grants/counts/digests, deploy compatible readers and reopen only with integrity evidence.
**Edges:** incompatible closed v1 shape, failed DDL or uncertain commit requires inspection; destructive down migration is not automatic rollback.
**Acceptance:** Given post-migration accepted writes, When application rollback is requested, Then it uses the current authoritative store and all new retained metadata, never the sealed old financial copy.

## INF-FR-09 — Measure bounded elasticity

**Actor:** measurement operator; optional reviewed HPA controller.
**Preconditions:** admitted one/two-process profile, actual termination/pool interlock, valid metric/request settings and inherited Phase 12 workload.
**Flow:** compare manual one/two replicas first, then a gated HPA experiment; count pending/terminating processes, startup lag, resource cost and complete outcomes.
**Edges:** missing metrics, quota/primary/provider saturation or stuck termination blocks scale-up and preserves current accepted work.
**Acceptance:** Given desired replicas two and a terminating old full process, When another process would bring the actual total to three, Then scaling is denied; Payments never gains an HPA or another account allowance.

## INF-FR-10 — Observe and contain operational failure

**Actor:** operator using restricted telemetry and owner tools.
**Preconditions:** bounded signals, current operator authority and protected runbook/evidence access.
**Flow:** detect observable integrity/resource/readiness/debt/backup faults, identify affected capability, contain new unsafe work and inspect original evidence; record diagnostics gaps honestly.
**Acceptance:** Given broker/provider/telemetry outage, When liveness is evaluated, Then responsive applications are not blanket-restarted; original capability gates and recovery policies determine behavior.

## INF-FR-11 — Back up and restore the integrated system

**Actor:** backup/recovery operator.
**Preconditions:** authenticated paired-v3, protected off-host archive/current keys and old-process/egress fencing.
**Flow:** execute original independent owner snapshots, validate full pair/off-host read-back, restore both in isolation, revoke restored sessions, rotate active epoch and reconcile provider/decision/source gaps before reopening.
**Edges:** missing authority/source/Consume, one-sided snapshots, corrupt archives or host-only copies prevent safe reopen.
**Acceptance:** Given Payments release evidence without Commerce's original Consume/decision, When restore is reviewed, Then fulfillment remains blocked; a queued event or ready PVC cannot invent the missing authority.

## INF-FR-12 — Record project completion honestly

**Actor:** learner/operator/reviewer.
**Flow:** map requirements to exact evidence, disclose actual resources/versions/failure domains, reached workload/RPO/RTO and failed/unrun branches; distinguish the local sandbox result from future public hosting.
**Acceptance:** Given a short successful local drill, When completion is reported, Then hosted 30-day availability, cloud HA and live-payment readiness remain unproved and no omitted earlier blocker is assigned “Passed.”
