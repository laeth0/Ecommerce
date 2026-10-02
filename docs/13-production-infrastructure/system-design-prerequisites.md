# System Design Prerequisites and Learning Exercises

Study each concept using an actual owner request, release or recovery timeline. Explain the trigger, alternatives, cost and negative case before selecting a platform feature.

| Concept | Mental model | Project exercise / primary study |
| --- | --- | --- |
| Immutable artifact versus release | A commit builds an image digest once; the release binds that digest to reviewed configuration/schema/target | INF-X01; [Docker build secrets](https://docs.docker.com/build/building/secrets/) |
| Desired state versus actual process | Controllers request a replica count; old, pending and terminating processes can differ from the desired number | INF-X02/X06; [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) |
| Startup/readiness/liveness | Startup allows initialization; readiness routes traffic; liveness checks responsiveness. Remote dependency loss need not restart the process | INF-X05; [Pod probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/) |
| Graceful termination and fencing | Stop new work, drain existing bounded actions, then prove old external dispatch impossible before enabling a successor | INF-X06/X07; [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) |
| Strong identity versus network location | CA/SAN/EKU/role/epoch authenticate a private workload; network policy only constrains reachability | INF-X03/X04; [original mTLS scopes](../10-microservices/security/service-identity-and-authorization.md) |
| RBAC and secret escalation | Permission to create a privileged workload or read a secret can exceed apparent API verbs | INF-X04; [RBAC practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) |
| Persistent identity versus durability | A PVC survives specified object transitions; host loss, wrong mounts and deletion policy still require backup | INF-X08/X11; [persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) |
| Expand/contract compatibility | Add compatible readers/schema first, transfer writing authority safely, remove only after retained data/readers permit | INF-X08; [owner migration contracts](database/migrations-and-compatibility.md) |
| Autoscaling as delayed feedback | Metrics, controller timing, scheduling, readiness and pool startup delay scale-out; a new Pod can worsen a shared primary | INF-X09; [HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) |
| Fault domains and quorum | Multiple processes on one host still share power, kernel, disk and cluster failure | INF-X02/X11; [kind configuration](https://kind.sigs.k8s.io/docs/user/configuration/) |
| Gateway control versus data plane | Accepted route configuration and an available proxy are different observations; backend TLS and exact routes must be proven | INF-X03; [Gateway TLS](https://gateway-api.sigs.k8s.io/guides/user-guides/tls/) |
| RPO/RTO and causal recovery | Individual database snapshots can be asymmetric; safe service requires authority/provider/decision/event reconciliation | INF-X11; [paired-v3 recovery](../10-microservices/deployment-and-devops/backup-and-restore.md) |
| Supply-chain trust | Untrusted PR code can exfiltrate credentials if it runs in a privileged release context; building and approval are distinct | INF-X01/X06; [GitHub security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) |
| Error budgets and measurement | Planned maintenance and failed valid requests affect observed availability; a short drill cannot establish a hosted SLO | INF-X10/X12; [project evidence](project-completion-and-release-readiness.md) |

## Worked reasoning

1. With `31r+17` ordinary connections, one/two/three Commerce processes plan 48/79/110. A Deployment asking for two replicas can still have a terminating third; list actual enabled pools before authorizing another.
2. A provider POST times out during Pod shutdown. Its original identity and earliest-send remain Unknown. Replacing the Pod does not prove failure or create another safe POST window.
3. The Payments archive includes a committed confirmation release, while the Commerce archive lacks the actual Consume/terminal decision. A ready database and queued event do not supply the missing Commerce authority; keep fulfillment contained.
4. A 60% CPU HPA target is measured relative to requested CPU. Doubling process count without changing a per-Pod request increases allocated resources; reporting that as the original fixed-resource speedup is false.

## Before implementation

Explain which data survives Pod, node-container, kind-cluster and physical-host loss. Identify every runtime/build/release/migration/backup principal and what it can access. Derive an overlap budget including terminating processes. Describe how a local operator obtains a verified artifact without granting GitHub a personal kubeconfig.

For every new tool, record supported pinned versions, compatibility, privileges, resource cost, failure/rollback and an actual admission gate. All future experiments are specified in [INF-X01–12](testing-strategy/experiment-catalog.md); none are executed by this documentation task.
