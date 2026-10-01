# Extraction Threat Model and Controls

**Status:** incremental threat model; retain all earlier Identity, provider, money, webhook and event controls.

## Assets and trust boundaries

Assets: human sessions/authority, stock and historical Orders, original payment/refund keys/receipts/facts, provider credentials/test-method descriptors, confirmation decisions/tokens/releases, command authority, canonical event history, private certificates and authenticated backups.

Boundaries: private client→edge→Commerce; Stripe→edge→Payments raw callback; Commerce↔Payments mTLS; each runtime→its database; each publisher/consumer→broker; operator/migration/backup→protected owner tooling; telemetry exporters→diagnostic storage. The physical PostgreSQL server is still a common administrative/failure boundary.

## Threat/control table

| Threat | Control and required negative scenario |
| --- | --- |
| Public caller impersonates Commerce | Private listener/network + required mTLS; arbitrary actor/proof headers from internet grant no permission |
| Trusted certificate gains every role | Exact SAN/issuer/EKU + scope allowlist; reader certificate cannot IssueRefund/Resolve/replay |
| Cross-customer financial disclosure | Local current owner check, remote exact mapping, actor-bound cursor; nonowned/absent Order gives identical public404 |
| Revoked Admin creates new intent | Primary Identity serialization before authority commit; new attempts require current authority; approved earlier immutable intent may finish |
| Changed request under original identity | Canonical bytes plus digest and exact fields; command/key conflict cannot rewrite receipt |
| Forged money hint/capture Boolean | Event intake schedules only; owner evidence and held proof required for actual Consume; no public paid/refund-status controls |
| Refund bypasses hold through scan/operator path | All owner writers root→intent→hold check; no direct update grants or “clear hold” tool |
| Lost response causes duplicate charge/refund | Stable operation/provider keys, immutable command receipts, original 23-hour window and uncertainty retention |
| Replay stale runtime after restore | Paired epoch validation; old original history inspection only after reconciliation; missing old binding cannot become a fresh charge |
| Closure arrives after initialization retry | Original root stop latch survives ordering/restarts; intact-history proof required for no-dispatch |
| Compromised webhook or body parser | Original signature/raw256KiB/depth32/time rules; private command limit is separate; mapped verified owner retrieval remains authority |
| Arbitrary URL/SSRF/private redirect | Explicit allowlisted HTTPS peer/provider hosts; no client URL/header controls, no redirects or user-defined callback destination |
| Broker credential injection / poisoned envelope | Route/type/source/schema/digest/budget/mapping checks; events cannot authorize money; minimal quarantine and reliable parking |
| Excessive work/connection/body consumption | Fixed pools/RPC slots/callback limits/prefetch/body limits; no unbounded memory queue/retry |
| Shared database bypass | Revoke PUBLIC CONNECT and inherited privilege; separate runtime creds with owner-only grants; no FDW/dblink/shared EF context |
| Secrets/PII in telemetry or events | Allowlisted fields; no JWT/card/method/provider payload/authorization reason/address; safe codes and protected UUID metadata only |
| Backup tampering or one-sided restore | Authenticated two-archive manifest/digests, paired recovery containment, both-owner/provider/event reconciliation |
| Old runtime still executes provider work | Stop/egress/secret/lease fencing and one executor proof; copying a lease is not safe cutover |
| Operator fixes symptom by dropping evidence | Attributed constrained resume/replay/repair with immutable receipts; retention and no arbitrary balance/decision update |

## Storage and data minimization

Payment private source/provider identifiers and reason/authority records require restricted access; UUIDs are pseudonymous references, not public anonymous data. Serialize normalized mapped evidence only; original signed raw webhook body is validated but not retained. Retain hashes/codes/minimal provider hints according to Phase 07.

Keep source descriptors in Payments and only opaque reference/fingerprint at Commerce. Cursor key moves with Payments; JWT/refresh secrets remain Commerce. Neither ordinary app credential owns schemas, can DDL, assumes the backup role or directly mutates arbitrary append-only fact/audit/decision rows.

Use protected encrypted host storage for PostgreSQL, broker, secret mounts and retained diagnostic volumes, plus authenticated encrypted off-host backups. Verify actual volume/access/key-recovery configuration before deployment; this specification does not select a new application encryption library or claim that current host storage is encrypted. Transport to databases/broker/telemetry retains the earlier private TLS policy. Encryption does not replace owner grants or sensitive-field minimization.

Telemetry storage is diagnostic, not business evidence. Loki does not authorize a cancellation/refund or repair a missing command. Retained authenticated owner records/provider proof decide those operations.

## Residual risks and review gates

Commerce remains a trusted authorization issuer; Payments compromise can access its provider account. A shared server administrator can access both logical stores. The single-node broker/server and edge have shared outages. Hold safety deliberately trades completion availability for proof.

Private sandbox scope excludes public onboarding, live payment/card collection, email recovery/MFA and external notification destinations. Any such expansion needs its own security/product review. This phase makes no PCI/compliance certification claim.

Review actual grants, listeners/proxy behavior, certificate rotation, malformed-input diagnostics, all financial writer paths, restore identity reconciliation and capacity shedding before declaring implementation complete.
