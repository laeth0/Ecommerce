# Infrastructure Architecture Decisions

**Status:** accepted documentation direction; actual deployment requires implementation evidence and the release contract.

## INF-ADR-01 — Local kind learning target

**Problem:** the project needs orchestration practice without an unbudgeted cloud environment.
**Options:** Compose alone remains simpler; cloud Kubernetes adds paid services and physical hosting decisions; local kind demonstrates Kubernetes contracts on the existing machine.
**Decision:** kind on one host, with no cloud spend or HA claim. Compose remains the earlier development environment.
**Rationale:** learn controller, networking, release and storage behavior under explicit resource limits.
**Cost/failure:** cluster overhead, CNI/storage setup and shared host failure. Host admission and off-host recovery are required.
**Verification:** INF-V05–08/38–42.

## INF-ADR-02 — Separate build, approval and local release

**Problem:** a CI job running untrusted code must not hold runtime or cluster authority.
**Options:** direct cloud deploy does not match the target; a personal always-on self-hosted runner risks host/secrets; provider-neutral contracts lose the requested concrete CI learning.
**Decision:** GitHub Actions builds and verifies; protected manual approval produces the reviewed release bundle; a scoped local operator applies that exact bundle.
**Rationale:** hosted CI needs no path to the local cluster or runtime secrets. Promote the same digest without rebuilding.
**Cost/failure:** local handoff and identity/entitlement verification. A green check or arbitrary artifact locator is not approval.
**Verification:** INF-V01–04/18–22/45.

## INF-ADR-03 — Gateway API with Envoy Gateway

**Problem:** HTTPS exposure must preserve original routes, callback bytes and private boundaries.
**Options:** a static reverse proxy is simpler but provides less Kubernetes routing practice; a service mesh would alter private transport and add unrelated controllers.
**Decision:** Gateway API/Envoy Gateway handles public routing; private calls remain direct mTLS.
**Rationale:** separate platform-owned listener/TLS policy from narrowly scoped application routes.
**Cost/failure:** controller/CRD/data-plane version compatibility, exact error formatting and trusted-source behavior need implementation proof. No permissive default routes.
**Verification:** INF-V09–14.

## INF-ADR-04 — Retain owner-local persistent state

**Problem:** kind nodes and Pods are replaceable, while accepted financial/stock/event history is not.
**Options:** ephemeral database/broker containers lose evidence; a managed database adds hosting/cost; shared runtime credentials erase extraction boundaries.
**Decision:** one protected host-backed PostgreSQL server and RabbitMQ node, with explicit retained PV inventory and original separate owner access.
**Rationale:** preserve the current ownership model while learning persistent workload operations.
**Cost/failure:** host storage is one failure domain. PVC/StatefulSet identity does not give HA or an authenticated paired recovery point.
**Verification:** INF-V23–28/38–42.

## INF-ADR-05 — Conservative release before rolling optimization

**Problem:** three full Commerce processes exceed 80 ordinary connections; any Payments executor overlap risks external duplicate effects.
**Options:** default surge can exceed budgets; blue/green duplicates the application resources; strategy flags alone do not prove old processes stopped.
**Decision:** controlled Recreate/maintenance release baseline with verified quiescence. A serialized rolling Commerce experiment is gated separately.
**Rationale:** safe history and bounded pools come before uptime claims.
**Cost/failure:** planned downtime counts in availability. Unproved process death keeps successor dispatch disabled.
**Verification:** INF-V18–22/29–32.

## INF-ADR-06 — Explicit runtime secret authority

**Problem:** base64 encoding or hiding a value in a manifest does not protect it from cluster/CI administrators.
**Options:** committed secrets are prohibited; a new Vault/cloud secret service adds cost and availability obligations.
**Decision:** protected operator-managed secret injection, cluster at-rest encryption, narrow service accounts and original finite rotation policies. No secret manager product is introduced.
**Rationale:** keep the local baseline lean while making privileged access and recovery dependencies visible.
**Cost/failure:** manual issuance/renewal, protected external recovery material and actual host encryption/enforcement proof.
**Verification:** INF-V15–17/43–45.

## INF-ADR-07 — Gate autoscaling by shared capacity

**Problem:** CPU scaling can multiply pools/workers while the primary, quotas and provider remain fixed.
**Options:** immediate HPA changes the resource comparison and ignores termination overlap; manual scale is easier to reason about.
**Decision:** fixed one/two Commerce baseline; optional HPA experiment uses a new declared profile, actual-process interlock and max two. Payments remains one with no HPA.
**Rationale:** expose delayed feedback and resource costs without bypassing original authority or capacity.
**Cost/failure:** missing metrics, churn, slow starts and terminating processes can block scale-up; rejection is a valid outcome.
**Verification:** INF-V33–36.

## INF-ADR-08 — Recover both owners before reopening

**Problem:** Kubernetes/PVC recovery can restore processes without causal owner or external provider consistency.
**Options:** isolated per-service restore ignores one-sided transactions; logs/events/provider metadata cannot reconstruct accepted authority.
**Decision:** retain paired-v3, current secret recovery/session revocation, process/epoch fencing and integrated provider/decision/event reconciliation.
**Rationale:** infrastructure restores facilities; original owner history establishes business permission.
**Cost/failure:** RTO can fail safely; unresolved original-history gaps remain contained.
**Verification:** INF-V38–42/46–48.
