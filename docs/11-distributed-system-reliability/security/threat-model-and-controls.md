# Reliability Threat Model and Security Controls

## Assets and trust boundaries

Protect original authority/receipts/decisions, stock, money coverage, provider keys/windows, owner credentials, process epochs and canonical messages. Fault injection/recovery credentials are powerful administrative capabilities and are never ordinary customer access.

Trust boundaries remain browser→Commerce; Commerce↔Payments mTLS; service→own database; broker→intake; Stripe→signed ingress; protected operator→owner tools; off-host archive→isolated restore. One shared PostgreSQL server provides logical ownership isolation only.

## Threats and required controls

| Threat | Control | Verification |
| --- | --- | --- |
| Replay with changed payload/new identity | Exact original canonical bytes/actor/mapping; command/provider idempotency; identity conflict containment | REL-V02/17/20 |
| Retry causes duplicate charge/refund | One retry owner; no handler hedging/SDK automatic retry; original first-send/key/window | REL-V07/13/35 |
| Financial hint forges money/version | Strict source/route/schema/mapping; actual owner query; no hint authority | REL-V24/26 |
| Breaker fallback bypasses security | No zero/cached balance, simulated capture or success default; auth/epoch/TLS separate containment | REL-V12/16 |
| Operator impersonation through JSON | Actor/current capability from authenticated tool context; no caller operatorId field; audit atomicity | REL-V17–19 |
| Revoked Admin creates a new refund | Fresh Identity/network/role check for each public operation/replay; only already committed immutable authority survives later revocation | REL-V19 |
| Workload certificate claims human role | Explicit principal/route/method allowlist; existing Commerce actor provenance; certificate is service authority only | REL-V16/19 |
| Certificate error treated as ordinary outage | Deny invalid/expired/revoked/untrusted peer; alert/repair trust; no validation disabling during a drill | REL-V16/37 |
| Stale worker applies old result | Work token/version and process-frozen epoch check; old credentials/process/egress fenced after restore | REL-V11/37 |
| Old executor sends after lease expiry | One account executor plus process/egress fencing; original mutation identity still resolves possible send | REL-V33/36 |
| “Clear hold” turns uncertainty into fulfillment | No unconditional operation; exact terminal decision/barrier/release and proof-based original repair | REL-V03–05/20 |
| Resume with stale version/active lease | Owner guards, optimistic work version, immutable receipt; no lease stealing | REL-V17/18 |
| Failed audit hidden during recovery | Roll back scheduling/admission/repair; bounded error and alert, no partial success | REL-V18 |
| Retry-After or response directs SSRF/wait abuse | Fixed HTTPS peer allowlist, no dynamic URLs/redirect-following; validated bounded delta-seconds/response bytes | REL-V12/16 |
| Oversized/malformed event or callback | Existing body/depth/header bounds and duplicate-key rejection; signature on raw bytes before parsing; durable bounded metadata | REL-V24 |
| Replayed callback bypasses source/amount checks | Signature freshness≤300s/future check plus full account/object/currency/amount retrieval; callback is a hint | REL-V20/35 |
| Poison message dumps sensitive payload | Digest/safe locators only; canonical owner inspection; no invalid bodies in logs/tickets | REL-V24/30 |
| Recovery SQL accesses another database | Separate CONNECT/schema/grants; typed targets; no FDW/dblink/shared runtime secret/arbitrary query interface | REL-V17/36 |
| Restore accepts forged/stale archive | Encrypted authenticated paired-v3 manifest/count/digest/schema/key/epoch inventory; off-host copies | REL-V36–38 |
| Logs reconstructed as business authority | Protected owner facts/receipts only; Loki/Tempo are diagnostic, not accepted purchase stores | REL-V30/38 |
| Metric/trace IDs leak identity or exhaust memory | Finite labels,≤10k series; request/trace/record UUIDs in protected metadata only; bounded sampled export | REL-V30 |
| Fault credential escapes the sandbox | Explicit isolated target list, short-lived narrow operator permissions, bounded blast radius/reversal; no live account | REL-V32–38 |
| Disk pressure triggers evidence deletion | Contain new admission, retain recovery reserve and immutable history; no deletion as incident shortcut | REL-V31 |

## Existing controls retained

JWT lifetime300s and rotating refresh JSON-Bearer contract, secure password hashing, basic role separation, login protection, sandbox account policy and restricted Admin access stay governed by Phase01/08. No email verification, self-service reset or MFA scope is added here.

TLS/mTLS is validated end-to-end on private calls. Keep fixed peer names/ports, issuer trust/identity mapping, certificate revocation/rotation and runtime-frozen deployment epoch. Same-key known receipt replay still requires workload/epoch validation. Token/authority context is not propagated through broker envelopes.

Provider remains Stripe sandbox, operator-assigned test methods only. No raw card entry, live secret, provider client secret or payment method payload is accepted/logged by these documents. The original callback limits remain256KiB/depth32, signing header≤4,096 bytes and freshness300s with future validation.

## Operator least privilege

Separate Inspect, ResumeOriginalWork, CanonicalReplay, FailedCompensationRepair and GateControl capabilities. Database migration/restore credentials remain distinct from runtime/operator rights. A read-only inspector cannot schedule work; a relay cannot authorize a refund; a fault operator cannot alter money/state to simplify cleanup.

Recheck current human capability on every operator call, including receipt replay. For any already durably authorized cross-owner replay intent, retain its original approved sender/owner handshake and authority policy; no new implicit authority surviving revocation is introduced.

Use structured bounded configuration, secret providers/environment overrides and actual negative permission/network checks. No committed credentials/private keys/certificates/archive secrets or connection strings. Record artifact fingerprints, not secrets.

## Fault experiment security review

Each experiment identifies exact environment, owner/route/direction, credentials, admitted objects, reversible fault and abort gates. Never disable auth/TLS/signature/quota to make a fault easier. Directional network faults block only declared private traffic; public callback/DB disruption is a separate experiment. A hostile payload remains untrusted even when a developer generated it.

Collect sanitized proof references outside telemetry where required. Source/decision/provider evidence stays access-controlled and complete even when sampling drops a trace. Any credential exposure, unexpected live account/mode, second executor or financial identity conflict aborts the drill and invokes containment.
