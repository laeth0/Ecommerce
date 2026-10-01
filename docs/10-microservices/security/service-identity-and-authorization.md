# Service Identity and Authorization

**Status:** required private mTLS baseline. Public JWT authority stays at Commerce; no human token, password or refresh token is forwarded to Payments.

## Transport identity

Use a private trusted CA, HTTPS server authentication and client certificates. Issue distinct certificates/keys for Commerce→Payments and Payments→Commerce roles; authenticate exact configured subject alternative name identities and intended client/server EKUs, certificate chain, validity and approved revocation policy. Do not authorize by Common Name string, source IP alone or possession of any trusted certificate.

Use separate private listeners/network rules. The public edge may reach only Payments' exact Stripe webhook listener/path; it cannot reach internal paths. Private listeners require the workload certificate at TLS handshake. Do not trust an internet-supplied certificate forwarding header. A future TLS-terminating internal proxy needs its own authenticated design before replacing direct mTLS.

ASP.NET Core certificate authentication supplies platform chain/usage/validity validation; operation authorization and issuer/SAN/revocation policy remain explicit project controls. See [Microsoft certificate authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/certauth?view=aspnetcore-10.0).

## Principal/scope matrix

| Principal | Allowed operations | Denied authority |
| --- | --- | --- |
| commerce-payment-writer | Initialize/Closure/Compensation/Acquire/Resolve and durable-authorized IssueRefund; own command lookup | Provider metadata/keys, arbitrary money facts or hold deletion |
| commerce-financial-reader | Scoped FinancialView/refund page | Mutation/recovery or cross-order arbitrary export |
| commerce-payment-coordinator | Scoped PaymentEvidence/HoldView/Capabilities | Public human authorization or financial writes outside commands |
| commerce-recovery-inspector | Protected canonical-event inspection | Replay/state changes |
| commerce-recovery-writer | Attributed durable operator outbox replay | Money/stock/Order overwrite |
| payments-decision-reconciler | Exact confirmation-decision query | Commerce writes, Identity queries or arbitrary Orders listing |
| Operator/migration/backup roles | Explicit owner setup/reconciliation grants under restricted maintenance | Routine runtime identity or shared application credential |

Separate client certificates or explicitly allowlisted identities per role avoid granting every caller the writer scope. Current runtime epoch is mandatory for every private request. Reject wrong peer/role/epoch before receipt lookup. A certificate identifies a workload; it does not prove human intent on its own.

Payments validates the committed command provenance and original accepted mapping. Commerce is the trusted human-authorization issuer and could authorize money if compromised; mTLS does not make this trust disappear. Least privilege, audit, network isolation and restricted deployment/secrets access contain that risk.

## Durable human authority

Commerce uses original fresh Identity locks/time checks when persisting Admin command authority. Immutable receipt includes actor UUID, request ID, normalized public request/key/Order, authorizedAt, command UUID and exact mapping. No access token is retained.

The user approved authorization before remote financial admission. Revocation before the local commit prevents intent; afterward accepted intent may finish. Payments cannot pretend to perform fresh Identity checks and must not maintain a stale role cache that overrides this model. New public replays still require current Commerce eligibility.

Protected recovery replay follows the same attributed durable operator-intent model. An operator cannot provide arbitrary command JSON through public routes. Each operation is allowlisted, constrained to original evidence, version-checked and locally/remotely audited.

For financial reads, Commerce fresh-authorizes/scopes and commits required audit before I/O; Payments checks asserted Order/customer provenance from only the reader identity and commits its own required audit. No multi-database fresh-read transaction is claimed.

## Certificate, secret and epoch lifecycle

Private keys live in mounted protected secret storage; no repository credential, log, URL or bundle plaintext. Plan certificate renewal at≤30 days remaining, alert≤7 days, fail closed at expiry. Configure trust rotation with overlapping old/new CA/cert allowlists until every supported peer upgrades; then revoke/remove old trust. Exercise connection recycling so reused TLS connections do not indefinitely bypass rotation/revocation enforcement.

Revocation changes require terminating affected active connections/process access, not merely updating a file for the next handshake. Use an approved bounded local revocation/allowlist policy when offline CA status is unavailable; do not silently disable validation to restore availability.

Runtime epoch is a recovery fence, not a credential or financial ID. Operator updates both stores/peer configuration under containment; stale processes/connections cannot submit new work. Missing restored old-epoch identity remains held. Secrets restored outside archives must match actual provider/cursor/account history; ordinary compatible key rotation preserves original cursor overlap and provider evidence.

Each process freezes its configured deployment epoch at startup and compares it with its owner's active epoch before request mutation, claims or provider dispatch. A stale process cannot adopt a newly read database epoch as its own identity. Rotation still requires old-process/egress fencing; epoch validation alone does not revoke a possibly in-flight external request.

## Required security evidence

Wrong CA/SAN/EKU, expired/revoked peer, absent certificate, forged forwarding header, wrong scope, public internal path, stale epoch and actor/order mismatch all fail boundedly without sensitive diagnostics. Verify runtime cross-database denial, two-owner audit failure behavior, key/CA rotation and restriction of recovery tools. No security control is waived for the local learning topology.
