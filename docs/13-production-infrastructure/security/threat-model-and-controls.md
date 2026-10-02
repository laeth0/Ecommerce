# Infrastructure Threat Model and Controls

## Assets and boundaries

Protect exact artifacts/release approval, host/cluster identity, owner stores, current credentials, private scopes, original receipt/decision/window/hold history, broker source identities and off-host recovery material.

New boundaries are untrusted source→CI, CI artifact→local release, human operator→cluster API, public client→Gateway→retail listener, node/container→retained host storage and secret projection→runtime. Each needs an explicit authorization or integrity proof.

| STRIDE threat | Required control / failure |
| --- | --- |
| Spoofing: wrong cluster/context | Actual API CA/identity and inventory fingerprint; context name alone rejected |
| Spoofing: wrong image under familiar tag | Exact approved manifest digest, source/provenance verification; no mutable deployment tag |
| Spoofing: client forwarding/source/certificate headers | Strip untrusted authority, known proxy topology and direct private handshake; never public certificate forwarding |
| Spoofing: counterfeit workload SAN or stale epoch | Original CA/SAN/EKU/role/current epoch checks before receipt lookup |
| Tampering: changed approved plan/config/image | Exact plan bytes/digest and outside-record authenticated approval; changed plan rejected |
| Tampering: leaked runtime secret through image/layer/log | Build context exclusion, secret/dependency/image scanning, allowlisted logging and revoked leaked material |
| Tampering: wrong/empty mount initializes new history | Protected PV/path identity and schema/grant/inventory verification before writer start |
| Tampering: rewrite callback or edge retry | Original raw bytes/signature/depth/size rules; retries/mirroring/automatic replay disabled |
| Tampering: duplicate migration/executor | Owner migration serialization and actual old-process/egress fencing; no permit from Job/Lease alone |
| Repudiation: unrecorded release/secret/repair | Protected actor/time/target/plan digest/transition evidence, original owner audit |
| Repudiation: dropped failed/unrun evidence | Complete outcome index; missing proof cannot become Passed |
| Information disclosure: public private path or health detail | Exact retail route allowlist, separate listeners/Services/policies, bounded Health body |
| Information disclosure: CI can access personal machine | Hosted unprivileged CI without kubeconfig/runtime secret; local scoped promotion |
| Information disclosure: namespace release creates secret-reading Pod | Restrict workload/exec/image/service-account/RoleBinding operations to trusted reviewed capability |
| Information disclosure: etcd/base64/host exposure | Actual at-rest encryption, narrow read access and protected external recovery keys |
| Denial of service: terminating Pods multiply pools | Actual-process/pool/resource interlock, baseline Recreate and no third full Commerce process |
| Denial of service: dependency probes restart all owners | Responsive-only liveness, primary/config readiness and separate remote capabilities |
| Denial of service: CPU HPA overloads shared primary | Gated max2 profile, headroom and actual termination checks; no Payments HPA |
| Denial of service: image/node/backup staging disk exhausts host | Separate byte/horizon inventory, original storage gates and protected resolution reserve |
| Elevation: retail Admin controls infrastructure | Separate local/platform/migration/backup identities; no public release/restore API |
| Elevation: Gateway gains financial client cert | Backend-server trust only; direct financial mTLS certificates stay at owners |
| Elevation: restore reconstructs authority from broker/log/provider | Authenticated original owner history and original integrated reconciliation; hold unknown scopes |

## Supply-chain and release policy

Pin toolchain/base images/runtime images/action commits/chart/CRD dependencies after supported-version review. Produce SBOM/provenance and actual scan results. Reachable unresolved high/critical advisory blocks release unless the user/owner accepts a specific mitigated risk with expiry; missing scan is missing evidence.

A deployment approval cannot authorize a changed digest or a broad secret read. Fork/PR code gets no publish/release secret and never runs on a privileged personal self-hosted runner. Trusted build and local deploy permissions are distinct.

## Failure containment

Close affected admission/dispatch/fulfillment on source/account/epoch/identity breach, exposed secret or unexplained external effect. Preserve exact accepted work and original uncertainty. Revoke relevant access and prove connection/process fencing before recovery.

A safe shutdown does not reset compensation coverage, payment windows, retry attempts or nonexpiring confirmation holds. An expired cluster lease, deleted Pod or rotating epoch cannot undo an already sent provider request.

## Evidence

Inspect negative trust/RBAC/source/route/secret/PV cases as well as healthy release. Search protected build/export artifacts for synthetic secret/PII markers without using real credentials in demonstrations. Record exact privilege/configuration version, branch, response/effect and containment proof.

All automated security/test tooling remains future implementation scope; this documentation creates no scans, attack scripts, credentials or operational messages.
