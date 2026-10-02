# Identities, Secrets and Access

## Threat and trust model

Kubernetes introduces identities that can deploy code, attach storage or read credentials. Those permissions can exceed the business Admin role. Preserve the [original workload scopes](../../10-microservices/security/service-identity-and-authorization.md) and current Commerce human authority.

| Identity | Allowed authority | Explicit denial |
| --- | --- | --- |
| Untrusted PR/build | Read source, run unprivileged checks in isolated CI | Runtime/provider/cluster/archive secrets and publication |
| Trusted build/publisher | Approved source and narrow private artifact publication | Local kubeconfig, database and provider access |
| Release reviewer | Approve exact immutable plan | Approval cannot be supplied by plan JSON |
| Local release operator | Approved namespace application/configuration resources | No blanket cluster-admin, owner data editor or secret dump |
| Platform bootstrap/security operator | Reviewed cluster/CNI/Gateway/RBAC/encryption/trust setup | Separate from ordinary application release |
| Commerce/Payments runtime service accounts | No Kubernetes API access by default; automount token disabled | Secret listing, workload creation, cross-owner database |
| Owner migration | One scoped owner DDL job/connection | Runtime shared credential or other owner migration |
| Backup/restore | Protected archive/data/key operations under original policy | Retail Admin session or CI build identity |
| Telemetry viewer/admin | Separate restricted diagnostic privileges | Business/secret mutation |

Creating a Pod/Deployment with an owner's secret mount can grant effective secret access even without `secrets/get`. Restrict workload creation, exec/debug, service-account impersonation, RoleBinding and image mutation to reviewed trusted release capabilities. Runtime service-account restrictions alone cannot contain a malicious deployer.

Kubernetes [RBAC practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) explain escalation risks. Namespace/RBAC boundaries must be tested against the actual deployed rules.

## Runtime secrets

Use protected operator-managed injection into owner-specific read-only mounted files or the established runtime configuration mechanism. No plaintext value, base64 secret manifest, env dump, provider object, kubeconfig or private key enters Git, CI artifact, image layer, command history or diagnostic output.

Encrypt Kubernetes secret data at rest in the actual API/etcd configuration and protect host/VM/backup storage. Kubernetes Secret encoding alone is not encryption. Verify read permissions, node/host admin exposure and current decryption material before admitting the environment. See [Secrets practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/).

The lean baseline introduces no Vault, External Secrets controller, cert-manager or cloud KMS. A later secret-service proposal must justify dependencies, availability, privileges and recovery. Secret/version inventory records references, never values.

## Certificate and key rotation

Public edge and backend-server certificates are separate from private financial workload client certificates. The Gateway receives no Commerce writer/coordinator or Payments decision-reconciler private key.

Private HTTPS authenticates exact CA/SAN/EKU/role/epoch, not source IP/Common Name or forwarded client-cert header. Direct Commerce↔Payments calls keep original principal scopes and two-second total deadline.

Renew certificates at ≤30d remaining, alert at ≤7d and fail closed at expiry. Trust rotation uses a reviewed bounded old/new overlap and connection recycling. Revocation terminates affected active connections/process access; replacing a mounted file is insufficient.

JWT/refresh/cursor/quota/provider/webhook/backup keys stay separate. Cursor reader overlap remains the original15m; webhook overlap matches the reviewed destination policy; JWT rotation uses original validation/expiry rules. New provider test credential must retrieve retained original objects in the same account before activation.

Secret-file projection and environment injection have different update behavior; verify pinned platform/client reload behavior. Restarting the Payments process follows the same fenced executor handoff. No routine key rotation resets accepted epochs, first-send or provider identities.

## Network policy

Default-deny ingress/egress in application/data/telemetry namespaces; allow only reviewed DNS, listener, owner DB, original AMQPS, private mTLS and OTLP flows. Gateway reaches retail/callback listeners only. Human operator access uses a protected local management path, separate from retail bearer/Admin auth.

The selected CNI MUST enforce the declared policy. kind installation alone is not proof; CNI choice/support is an implementation admission decision. Inspect both source and destination policy, actual endpoint addresses and trusted proxy behavior.

Native NetworkPolicy does not automatically constrain provider DNS names. Only Payments may reach external HTTPS where required; application configuration fixes the original approved Stripe host/account and rejects arbitrary URLs. If stronger hostname egress policy is claimed, prove the selected enforcement feature separately. No blanket “allow all” is described as Stripe-only.

NetworkPolicy is additive and changes may not terminate already established connections. Native policy also cannot block the Pod's own loopback or its resident node's access. Protect host/node administration and retain listener authentication; default-deny does not replace those controls.

Emergency financial fencing requires verified process/network-namespace/host egress termination, not a deny-policy object alone. Kubernetes [network policy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) documents these boundaries.

## Account protection and data

Keep private sandbox accounts/operator-assisted recovery, original password hashing/rate limits, fresh primary session checks and restricted Admin source network. Infrastructure does not add public registration readiness, MFA, reset/verification flow or real card entry.

Encrypt customer/financial backups and protect retained owner storage. Diagnostic scrubbing excludes bodies/headers/raw URLs/SQL/value/reason/name/email/address/provider IDs/secrets. No PCI-compliance certification follows from sandbox mode; the application never collects raw card details in this baseline.

## Acceptance

Prove runtime API denial, unauthorized workload/secret/exec/role creation, cross-owner CONNECT denial, incorrect certificate/epoch, revoked reused connection, expired public/backend certificate and current secret recovery. Abort on any credential exposure, wrong/live account or loss of original authority.
