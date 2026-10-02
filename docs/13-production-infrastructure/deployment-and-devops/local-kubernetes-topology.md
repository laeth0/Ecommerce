# Local Kubernetes Topology and Admission

**Target:** kind on one physical machine. No cluster, kubeconfig, CNI, manifest, volume or cloud resource is created here.

## Why kind

The environment must teach desired/actual state, Pods, Services, readiness, networking, storage and controlled deployment. Compose stays useful for early development; kind provides the planned Kubernetes exercise with no cloud hosting budget.

kind runs Kubernetes nodes as containers; see its [quick start](https://kind.sigs.k8s.io/docs/user/quick-start/) and [configuration](https://kind.sigs.k8s.io/docs/user/configuration/). All local nodes still share the machine, VM/container runtime, power and physical disk.

## Required inventory

| Layer | Baseline |
| --- | --- |
| Host/runtime | Actual protected Linux container host or Docker/WSL VM, supported tooling and verified allocatable capacity |
| kind cluster | One explicitly identified cluster; one node is sufficient for baseline; extra same-host node containers only for admitted scheduling drills |
| CNI/DNS | Supported policy-enforcing CNI and bounded CoreDNS; exact version chosen and proven during implementation |
| Namespaces | Separate Commerce, Payments, data, telemetry, edge/platform and protected operational jobs |
| Commerce | One/two application Pods, original owner/worker budgets |
| Payments | One application Pod/process; fenced controlled executor replacement |
| Data | One PostgreSQL persistent server/two logical databases; one RabbitMQ node/original single-member quorum queues |
| Edge | Envoy Gateway controller and separate bounded data plane; exact approved public HTTPS routes |
| Diagnostics | Original Collector/Prometheus/Tempo/Loki/Grafana, restricted management |
| Optional metrics-server | Only for a gated HPA experiment; explicit support/resource budget |
| Optional Redis/standby/partition | Disabled unless separate Phase 12 activation evidence exists |

Use ClusterIP Services for internal targets; no database/broker/management NodePort/host publication. Private mTLS listeners are distinct from retail/callback listeners. Namespace names are reviewed environment identifiers, not API identities.

## Bootstrap sequence

1. Verify host/VM capacity, Docker disk/encryption, supported toolchain, current operator authority and retained/off-host recovery access.
2. Establish cluster identity/CA and protected scoped kubeconfig. Prevent accidental use of another context; verify actual API fingerprint on every release.
3. Install the pinned policy-enforcing CNI/DNS and prove default-deny/allowlisted behavior. If enforcement is unavailable, affected secure deployment cannot pass.
4. Establish namespace/RBAC/Pod-security/resource policies and actual secret-at-rest encryption.
5. Map protected host-backed retained data roots, PVs and explicit Retain policy; verify mount identity/ownership before starting data processes.
6. Apply owner roles/schema through one protected migration authority. Restore or setup does not grant runtime cross-owner access.
7. Establish original broker vhost/exchanges/queues/policies and credentials with scoped topology authority.
8. Inject current owner keys/certificates/configuration; start compatible applications with affected admission/dispatch closed.
9. Verify exact private peers/epochs, public/backend HTTPS, original gates/receipts and one executor before reopening each capability.
10. Start bounded telemetry and validate alerts/gaps; execute required negative access and recovery checks.

No init container or replica silently initializes a missing accepted-history database. No startup migration race. Platform setup excludes actual live payment credentials and unreviewed provider account.

## Persistent storage and host access

Use [owner PV contracts](../database/persistent-state-and-ownership.md). Kind extra mounts must reach actual retained host storage; a path inside a disposable node layer is insufficient. Do not adopt generic hostPath access for application Pods.

Cluster-admin/bootstrap access is separate from local application release. Kubernetes API and dashboard/admin/diagnostic access remain protected local management, with no internet-wide bind.

## Development and callback connectivity

Keep environment-specific source/account/vhost/data roots separate from Compose. Never run two provider executors for the same account across environments.

No public tunnel, DNS domain purchase, load balancer or external publication is authorized. Genuine callback drills may use the original approved isolated Stripe CLI destination through a controlled local route, with its own signing secret and original bounds. If that ingress facility is unavailable, callback network verification remains Not run; polling cannot pretend the route was exercised.

## Replacement and teardown

Deleting/recreating a kind node or cluster is not a backup strategy. Before any teardown, contain/fence writers/provider egress, inventory retained paths and validate usable off-host recovery. Protect data PVs and external keys from delete/prune operations.

Automatic Pod replacement after a node partition does not prove old containers stopped. In this local topology, inspect the host/runtime or fence the node network/physical host before authorizing replacement financial dispatch.

## Admission evidence

Record versions/CRD/controller schemas, actual host allocations, policies/grants, storage mapping, all enabled processes/pools and negative paths. Unsupported hardware/features remain Not run. No single-host readiness result establishes HA, automatic failover or a cloud SLO.
