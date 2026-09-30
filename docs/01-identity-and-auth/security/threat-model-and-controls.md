# Identity Threat Model and Controls

**Status:** proposed sandbox security contract. This phase does not provide verified email, MFA, self-service recovery, or a public-production identity service.

## 1. Assets and trust boundaries

Protect password verifiers, signing keys, refresh credentials, session authority, role/status records, and audit integrity. Trust boundaries are client → API, proxy → effective client address, API → PostgreSQL, operator → privileged commands, and runtime → secret storage.

Attackers may choose every request field/header, replay captured credentials, send concurrent requests to different replicas, and trigger dependency/resource failures. A compromised host or database administrator has powers beyond ordinary application controls; backups, host access, and secret handling still need protection.

| Threat | Scenario | Required control and acceptance evidence |
| --- | --- | --- |
| Spoofing | Forged JWT, stolen refresh token, or fabricated forwarded address | Validate JWT and authoritative state; rotate refresh; trust only configured proxies; scenarios V-04, V-06, V-10 |
| Tampering | Client supplies Admin role, another subject, or altered token claims | Reject privilege fields; verify signature/claims and user/session binding; V-01, V-04 |
| Repudiation | Operator reset or Admin lookup has no attributable record | Commit required audit with the security operation; operator subject/reason required; V-08, V-11 |
| Information disclosure | Credentials in logs/errors or unauthorized user lookup | Output allowlists, redaction, generic failures, authorization before lookup; V-04, V-10, V-11 |
| Denial of service | Expensive hashing, counter cardinality, token-history growth | Shared admission plus local hash slots, size limits, bounded pools/cleanup; V-12, V-13 |
| Privilege escalation | Public registration becomes Admin or recovery grants unauthorized control | Customer-only insert, explicit operator provisioning, network restriction, no public reset; V-01, V-08, V-10 |

## 2. Password controls

Use the normalized password policy in [workflows](../functional-requirements/identity-workflows.md). Use the platform `PasswordHasher<TUser>`, IdentityV3 format, configured for **220,000 or more PBKDF2-HMAC-SHA512 iterations**, random per-password salts, and framework verification. Do not hand-roll the format or call a general hash in place of the verifier. Review the pinned implementation when scaffolding. [ASP.NET Core exposes password-hasher options](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0); [OWASP describes applicable work factors](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

New-password checks use a local, versioned list of SHA-256 digests of normalized common/compromised passwords. No password is sent to an external service. Missing, empty, or malformed configured blocklist fails startup. The data source, update date, and artifact checksum must be recorded when implementation selects the list; this specification does not claim a list has been supplied. Updating the list affects new passwords and operator resets, not verification of an existing verifier.

Password login failures for unknown, wrong-password, Disabled, and disallowed-network Admin accounts use the same public error. Missing accounts perform dummy verification at the selected cost after admission. Use a precomputed dummy verifier; do not compute an extra new hash on every missing-account request. There is no permanent account lockout triggered by anonymous failures. Numerical throttles are separate from account lifecycle.

Authentication events never include password text, hashes, blocklist match values, or response tokens. Hashing outside the transaction must be followed by the credential recheck described in the database contract.

## 3. JWT and refresh-credential contract

| Element | Exact policy |
| --- | --- |
| Signing | RS256 with an RSA key of at least 3,072 bits; private key outside source control and database; explicit allowed algorithms |
| JOSE header | `alg=RS256`, `typ=at+jwt`, required configured `kid`; no remote `jku`/`x5u` key fetching |
| Issuer/audience | Exact configured strings, default sandbox values `ecommerce.identity` and `ecommerce.api`; reject other values |
| Required claims | `sub` user UUID; `sid` session UUID; `ver` integer security version; `role` Customer/Admin; `jti` UUID; integer `iat`, `nbf`, `exp` |
| Claim lifetime | `nbf=iat`; `exp` no later than `iat+300` and the floored absolute/inactivity session deadlines; reject missing/malformed claims and lifetime >300 seconds |
| Clock handling | Validator tolerance at most 30 seconds; reject `iat` more than 30 seconds in the future; database session deadlines have zero skew allowance |
| Principal mapping | Disable implicit claim-name remapping; explicitly read the declared claims; no role/subject from request payloads |
| Database binding | Session belongs to `sub`; token `ver`, session-issued version, and current user version match; token role matches current role; Active account and eligible session |
| Refresh secret | 32 cryptographically random bytes, unpadded canonical Base64url; SHA-256 digest stored; unique digest constraint |
| Secret transport | Token pairs in HTTPS JSON only; access in Bearer header; refresh/logout in JSON body; no cookies, URL tokens, or Basic authentication |

For each issuance, derive integer claim times from the captured authoritative time and current session deadlines; sign before commit and publish credentials only after commit. A near-expiry session with no whole second remaining is denied.

Validate signature, algorithm, issuer, audience, type, temporal claims, required claim formats, and database binding. Reject `alg=none`, unexpected algorithms, unknown keys, and a refresh secret presented as access. These controls use [JWT best-current-practice guidance](https://www.rfc-editor.org/rfc/rfc8725) and [ASP.NET Core Bearer validation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0).

A missing signing key prevents startup/issuance; it never falls back to an ephemeral or hardcoded key. For routine rotation, distribute the new public key to all replicas before issuing with it; keep the previous verification key for at least 330 seconds after its last issuance. Key compromise requires immediate withdrawal, affected-session revocation, and new login; do not apply the routine overlap rule to a compromised key.

## 4. Authorization and administrator restriction

Protected endpoints deny by default. Use Customer/Admin roles for operation permission and server-derived IDs for ownership. A valid signature alone is insufficient. The [actor model](../../00-project-overview/system-actors-and-roles.md) continues to govern later business resources; this phase does not add generic impersonation or unrestricted support access.

Admin login, refresh, and every protected use of an Admin session must pass the allowed-network check. Default allowed networks are loopback only. Explicit private/VPN client CIDRs may be configured for a shared sandbox; reject universal IPv4/IPv6 ranges and empty configuration when Admin access is enabled. Network restrictions supplement the password and session checks; they do not replace them.

Only forwarded headers from explicitly configured proxy addresses may influence the effective client IP, with an explicit hop limit. Otherwise use the socket peer address. At a proxy, the edge must overwrite incoming forwarding headers. Normalize IPv4-mapped IPv6 addresses before comparison. Do not trust `X-Forwarded-For` or a similar client header merely because it exists. Logout is the sole Admin credential operation allowed from any source because its only effect is revocation.

The local operator command authenticates through controlled OS/process access and its own database credential. Application Admin access cannot call that command remotely. Recovery of real people is outside the sandbox fixture-authority model.

## 5. Web, input, and data protection

- Bind only the defined JSON members, reject duplicates and unknown fields, and parameterize all SQL, including token lookups and lock commands.
- Allow exact configured CORS origins only; default to none. Permit only required methods and `Authorization`/`Content-Type` headers. Do not enable credentialed cookie CORS.
- This API accepts no ambient authentication cookies, so its chosen Bearer/body-secret contract does not require a cookie anti-forgery token. A later cookie or browser persistence design requires a new CSRF review. CORS is not authorization; nonbrowser callers still undergo every check. See [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- Sandbox API clients keep credentials in process memory or an OS-protected secret facility. No browser localStorage/sessionStorage strategy is approved here. Do not put credentials in checked-in API collections or terminal history.
- Send `X-Content-Type-Options: nosniff`; use TLS and HSTS at the shared sandbox HTTPS edge. Interactive API documentation, if later implemented, must be limited to the private environment and must not persist entered credentials.
- Log route templates, stable event codes, duration, and request ID. Never log Authorization headers, refresh bodies, raw emails, password input/hash, signing material, or complete identity responses. User/session IDs may appear only in access-controlled audit/investigation records, not metric labels.
- Encrypt persistent disks/backups using environment facilities; restrict database/backup access. API permissions are append-only for audit; privileged cleanup may delete only under the declared retention procedure. Do not claim tamper-proof audit against a database administrator.

## 6. Security acceptance and deferred work

The phase passes security review only with evidence for forged/misbound tokens, cross-role denial, replay, concurrent revocation, restricted Admin source enforcement, safe operator recovery, secret redaction, and dependency failure. Scenario IDs are defined in the [verification matrix](../testing-strategy/verification-scenarios.md).

Email verification, self-service reset, MFA, recovery codes, and public role management are explicitly absent. Before changing the private sandbox operating envelope, phase 08 must define the missing controls and revisit the threat model; a successful local demonstration does not waive that work.
