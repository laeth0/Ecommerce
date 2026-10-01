# Identity Verification Strategy

**Status:** scenario specification only. No test files, fixtures, testing dependencies, or application runtime are created in Phase 01 documentation. New automated tests still require an explicit request under the repository instructions.

## 1. Verification layers

| Layer | Evidence to collect when implementation exists |
| --- | --- |
| Contract/static | Build, formatting, nullable/type checks, JSON schema validation, API metadata, migration SQL review, secret/configuration scans |
| Domain behavior | Input normalization, lifetime calculations, state guards, permission decisions; deterministic examples |
| PostgreSQL integration | Real constraints, transactions, locks, expiry time, replay retention, race outcomes |
| API/integration | Headers, schemas, exact errors, authentication, Admin network boundary, redaction |
| Concurrency and failure | Two connections/replicas, crash boundaries, cancellation, unknown commit, bounded retry |
| Performance and operations | Hash-cost measurement, rate-limit coordination, query plans, cleanup lag, backup restore, key rotation |

This is the future layering for unit, integration, database, API/contract, end-to-end, concurrency, load, stress, and failure checks. Where automation is not requested, perform reproducible manual scenarios and record their limits. An in-memory database cannot establish PostgreSQL locking correctness.

## 2. Scenario matrix

| ID | Covers | Given / When / Then |
| --- | --- | --- |
| V-01 | ID-FR-01; account uniqueness and privilege boundary | Given equivalent normalized emails and differing passwords, when two registrations overlap, then one Customer exists, both valid requests receive generic 202, and the loser cannot overwrite the verifier. A supplied role is rejected. |
| V-02 | Password contract | Given boundary-length, Unicode-combining, whitespace, NUL, invalid encoding, weak-list, and oversized inputs, when register/login/operator reset validates them, then the documented normalization and policy apply without truncation or secret reflection. |
| V-03 | ID-FR-02; session cap | Given four eligible sessions, when two correct logins overlap, then one additional session at most is issued; unknown email/wrong password/Disabled/disallowed Admin logins share the same public failure. |
| V-04 | ID-FR-05/06; JWT | Given forged, expired, wrong-issuer/audience/type/key/algorithm, missing-claim, mismatched subject/session/version/role credentials, when a protected route is called, then each is denied without disclosing verifier details. Test `alg=none` and refresh-as-access. |
| V-05 | ID-FR-03; lifetime | Given a valid refresh secret, when it is rotated, then one predecessor is consumed, one successor is usable, and absolute expiry is unchanged. At exact idle/absolute expiry the request fails even if cleanup has not run. |
| V-06 | ID-FR-03; replay isolation | Given two sessions for the same user, when one consumed token is replayed concurrently with its successor, then only that session is revoked. Repeat after the consumed token's own expiry but before the session's eligible deadline. |
| V-07 | ID-FR-04; multi-replica revocation | Given two replicas and two sessions, when session A logs out on replica 1, then its next access/refresh on replica 2 fails and session B works. Repeated logout returns 204; database outage returns 503. |
| V-08 | ID-FR-07; recovery races | Given login paused after password verification, when the operator resets/disables the account and login resumes, then old authority cannot be issued. Re-enable does not revive old sessions. Existing-email Admin provisioning fails without changes. |
| V-09 | Crash/commit behavior | Given each issuance/revocation transaction, when the process dies immediately before versus after commit, then rows/audit show the documented atomic effect and the client follows that operation's safe recovery path. |
| V-10 | Admin/source and authorization | Given Customer/Admin tokens inside/outside allowed networks, when the support lookup/current-user routes are called, then role/network checks hold. Forged forwarding headers from an untrusted peer cannot bypass them. With default-empty or explicitly allowed CORS origins, verify denied negotiation grants no cross-origin access and allowed preflight exposes only the phase's declared methods/headers; the actual request still requires authority. |
| V-11 | Audit and redaction | Given a successful security mutation, when audit storage fails, then no success is returned and no partial mutation remains. Capture runtime/edge logs and inspect that secrets/raw email are absent; authorized response fields remain correct. |
| V-12 | Shared admission | Given one then two replicas, when limits are exceeded across them, then total allowance does not multiply. Verify UTC window boundaries, IPv6 /64 grouping, HMAC bucket separation, Retry-After, and database-outage denial. |
| V-13 | Resource/performance | Given the declared dataset and hash parameters, when normal load and then overload run, then latency/error targets are measured honestly and queues/pools stay bounded. Do not disable protection to reach throughput. |
| V-14 | Cleanup/retention | Given consumed tokens whose own expiry passed while the session may still be eligible, when cleanup runs, then those tokens remain. After absolute expiry plus 24 hours, parent/token cleanup is safe and audit remains until its own retention boundary. |
| V-15 | Configuration/migration/key rotation | Given a fresh database, an incompatible schema, malformed keys, weak parameters, missing blocklist, or broad Admin network, when startup/release runs, then only the valid setup becomes ready. Rotate keys across two replicas without issuing unverifiable access. |
| V-16 | Restore and restricted scope | Given a restored sandbox snapshot, when recovery finishes, then old sessions are revoked before ingress opens. Public reset/email/MFA/role mutation routes remain absent. |
| V-17 | In-flight authorization | Given a protected read or sensitive mutation paused around authorization, when revocation runs, then read snapshot semantics and shared-lock mutation ordering match the database contract. |

## 3. Evidence requirements

For every scenario record the specification ID, application revision, command or request sequence, environment/resource limits, sanitized inputs, expected result, actual result, database/audit observations, and status: Passed, Failed, Not run, or Not applicable with reason.

Keep raw credentials out of committed evidence. A request ID and synthetic user/session ID are sufficient for correlation. Race evidence must include both request outcomes and final persisted state; a single successful response cannot establish the absence of duplicate effects.

A runtime check is not claimed until executed against implementation. A static schema parse is not a database constraint/race result. A Mermaid source check is not a rendered-diagram check.

## 4. System Design Prerequisites & Concepts to Learn

Study controlled experiments, fault injection, linearization points, and observability of persisted state. The key question is where an operation becomes authoritative. Pause at that boundary and compare before/after failure behavior.

Use actual PostgreSQL and replica coordination because a mocked transaction would reproduce assumptions rather than verify database behavior. The cost is environment setup; the benefit is catching lock-order, commit, and expiry errors that compilation cannot detect.

## 5. Exit gate

Implementation is eligible for phase review only when all applicable scenarios and non-functional gates have evidence, unresolved failures are visible, and the global Definition of Done is satisfied. Unavailable infrastructure leaves related gates Not run. Document completion alone does not satisfy this implementation gate.
