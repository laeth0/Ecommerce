# Identity Configuration and Operations

**Status:** deployment and operating specification. No executable, settings file, container, pipeline, key, or database credential is created here.

## 1. Application foundation

Use the platform generation selected in [ADR-ID-01](../architecture-decisions.md): .NET/ASP.NET Core 10, EF Core/Npgsql provider 10, PostgreSQL 18. At implementation, pin supported stable patches, SDK, package versions, and container versions; record the selections. Do not introduce previews or floating `latest` production images.

Keep one deployable monolith with a clear Identity module. REST adapters perform parsing/response mapping, application operations coordinate policy and transactions, and persistence implements the declared PostgreSQL protocol. Use platform DI, Options validation, logging, JWT validation, and password hashing. Avoid adding a generic repository, message bus, or mediator solely to create layers.

Identity's interfaces to later modules are an authenticated actor context (`userId`, `sessionId`, `role`, `securityVersion`) and the documented current-state/transaction authorization rules. Other modules must not read password hashes or rotate sessions directly.

## 2. Configuration contract

Bind named, nested Options once at startup. Business code does not read environment variables directly. Non-secret policy defaults may be committed in a future appsettings file; secrets and host-specific paths/addresses are supplied through environment configuration or protected secret files. Environment overrides use ASP.NET Core's `__` nesting convention.

| Section/key | Default or required value | Startup validation |
| --- | --- | --- |
| `ConnectionStrings:Identity` | Required secret connection string for API role | Nonblank; PostgreSQL endpoint and pool limit configured; never logged |
| `ConnectionStrings:IdentityCleanup` | Required only when cleanup enabled | Separate cleanup role; pool ≤2 |
| `Identity:Jwt:Issuer` | `ecommerce.identity` | Nonblank exact value shared by replicas |
| `Identity:Jwt:Audience` | `ecommerce.api` | Nonblank exact value shared by replicas |
| `Identity:Jwt:SigningKeyId` | Required deployment value | Matches configured private key and distributed verification key |
| `Identity:Jwt:PrivateKeyFile` | Required protected file path | Readable RSA private key, ≥3,072 bits; no generated fallback |
| `Identity:Jwt:VerificationKeysDirectory` | Required protected directory | Known public keys indexed by bounded key IDs; no remote discovery |
| `Identity:Jwt:AccessLifetimeSeconds` | 300 | Positive and ≤300; specification default must be used for its benchmark |
| `Identity:Jwt:ClockSkewSeconds` | 30 | Between 0 and 30 |
| `Identity:Sessions:CustomerAbsoluteSeconds` | 1,209,600 | Positive; matches approved policy |
| `Identity:Sessions:CustomerIdleSeconds` | 604,800 | Positive and ≤CustomerAbsoluteSeconds |
| `Identity:Sessions:AdminAbsoluteSeconds` | 28,800 | Positive; no greater than CustomerAbsoluteSeconds |
| `Identity:Sessions:AdminIdleSeconds` | 1,800 | Positive and ≤AdminAbsoluteSeconds |
| `Identity:Sessions:MaximumActivePerUser` | 5 | Positive; changes require policy/capacity review |
| `Identity:PasswordHashing:IterationCount` | 220,000 | At least 220,000; IdentityV3/PBKDF2-SHA512 mode |
| `Identity:Passwords:BlocklistPath` | Required local artifact path | Nonempty readable SHA-256 digest list; artifact metadata/checksum recorded |
| `Identity:AdminAccess:AllowedNetworks` | `127.0.0.1/32`, `::1/128` | Valid explicit CIDRs; reject empty/universal ranges; shared sandbox uses approved narrow VPN/private networks |
| `Identity:RateLimiting:BucketKeyFile` | Required protected secret file | At least 32 random bytes; shared by replicas |
| `Identity:RateLimiting:Policies` | Exact scope/window/limit table in the capacity document | Every route class present; positive limits; no disabled/unlimited policy |
| `Identity:Capacity:PasswordOperations` | 2 | Positive; increases require measured budget review |
| `Identity:Capacity:ConcurrentRequests` | 100 | Positive bounded limit; no unbounded queue |
| `Identity:Cleanup:Enabled` | true | Cleanup credential required when true; disabled mode is visible as an operational exception |
| `Identity:Cleanup:IntervalSeconds` | 900 | Positive; benchmark policy unchanged without review |
| `Identity:Cleanup:SessionRetentionSeconds` | 86,400 | At least 24 hours beyond original absolute expiry |
| `Identity:Cleanup:AuditRetentionDays` | 30 | Positive; changes reviewed for investigation needs |
| `Cors:AllowedOrigins` | Empty | Exact HTTPS origins only when needed; no wildcard or cookie credentials |
| `ReverseProxy:KnownProxies` | Empty | Explicit proxy addresses only; default is no forwarded-header trust |
| `ReverseProxy:ForwardLimit` | 1 | Positive and matches the actual trusted path |

The API validates consumed configuration at startup. Operator-only commands validate their database, password, and audit settings without requiring unrelated HTTP/JWT settings. A missing password blocklist or key artifact is a real setup failure; this specification does not supply dummy artifacts or embedded credentials to bypass it.

Timeouts, pool budgets, body limits, and cleanup batch limits follow the [capacity](../performance-and-scalability/capacity-and-rate-limiting.md) and [database](../database/schema-and-transactions.md) contracts. They must be exposed through their owning Options when implementation needs environment overrides; changing them cannot silently weaken a stated invariant.

## 3. Roles and secrets

| Database identity | Needed access | Prohibited capability |
| --- | --- | --- |
| Migration owner | Create/update schema through reviewed migration process | Used as the regular API credential |
| API role | Select required identity rows; insert Customer account records; update verifier for rehash; manage sessions/refreshes/counters; append audit | DDL, user-role/status/version administration, audit update/delete |
| Cleanup role | Read retention candidates, acquire required locks, delete eligible sessions/tokens/audit/counters | Credential issuance, role/password changes, schema changes |
| Operator role | Explicit provisioning, reset, status change, session revocation, audit/operation inspection | Exposed through the public API |

Column-level grants/defaults must preserve these boundaries. API insertion of users relies on Customer/Active defaults and cannot explicitly write `role`, `status`, or `security_version`; only the operator may supply privileged values. Give cleanup only the UPDATE privilege needed for its row locks, not permission to change role, verifier, or security version. Verify grants against actual SQL and PostgreSQL behavior before release.

Keep signing keys, database credentials, and rate-limit HMAC key outside the repository. Restrict filesystem access to the intended process identity. Deploy only public verification keys to validators that do not issue tokens. Version key IDs and rotate deliberately; protect backups with access controls and encryption.

## 4. Explicit operator commands

The executable's operator mode is a separate local invocation and starts neither the HTTP server nor background workers. Required command interfaces are:

| Command | Non-secret arguments | Secret input and authority |
| --- | --- | --- |
| `identity create-admin` | `--email`, `--reason` | New password via hidden prompt/protected stream; controlled operator execution |
| `identity reset-password` | `--user-id`, `--reason` | New password via hidden prompt/protected stream; known synthetic fixture ownership |
| `identity disable-user` | `--user-id`, `--reason` | Operator authority |
| `identity enable-user` | `--user-id`, `--reason` | Operator authority |
| `identity revoke-sessions` | `--user-id`, `--reason` | Operator authority |

Reason is 1–256 characters, without credentials or other secret payloads; validate and sanitize control characters. The process records its operator OS/service subject (1–128 characters) from the trusted execution environment and generates a request ID. It prints that request ID before the mutation and a sanitized success/failure after commit. It does not accept a caller-selected application role as evidence of authority.

Exit status is 0 only after a known commit or documented no-op; use nonzero for validation, missing target, conflict, dependency failure, or uncertain result. After an uncertain reset, inspect `audit_events` by request ID with the operator credential before repeating. An audit match proves the recorded transaction committed; if there is no match, establish database reachability and whether the original operation has finished before retrying. Never interpret a read during an in-flight transaction as proof of rollback.

No automatic administrator creation/reset runs at API startup. A second `create-admin` for the same normalized email fails, regardless of role, and leaves credentials unchanged. Use a separate fixture/account when creating another administrator deliberately.

## 5. Local deployment, health, and migration

The first implementation environment contains the API and PostgreSQL with persistent development storage. Docker Compose is appropriate for repeatable PostgreSQL startup; the API may initially run through the .NET development host. Bind administrative/database access to loopback or explicitly controlled private networks. Use synthetic accounts only.

Apply reviewed EF migrations with a separate one-shot migration step before starting API replicas. Do not race schema migration from every replica. Check schema compatibility during readiness. Review SQL and rollback/restore implications; a generated migration is not automatically safe. [EF Core migration guidance](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying) describes deployment approaches.

Operational endpoints are `/health/live` and `/health/ready` on a restricted management listener, not part of `/api/v1`. They return `200 {"status":"ok"}` when healthy and `503 {"status":"unavailable"}` otherwise. Liveness checks process responsiveness without PostgreSQL. Readiness checks required configuration/key availability, compatible schema, and a database probe with a one-second deadline. Responses expose no connection strings, versions, or exception text.

On shutdown, stop admitting new requests/work; allow up to 15 seconds for in-flight work; then cancel remaining operations. Committed security state survives cancellation. Cleanup does not prevent a process from exiting indefinitely. Check system/database clock drift at readiness and periodically; measured absolute difference above 30 seconds makes issuance readiness false and raises an alert.

## 6. Observability and alerting

Record structured event codes, operation/route template, result class, duration, and server request ID. Central handling logs an unexpected error once with safe context. Never enable request/response body logging on credential routes.

| Signal | Labels | Initial action threshold |
| --- | --- | --- |
| Request duration/count and errors | Route template, method, status class | Unexpected 5xx ≥5% for five minutes with ≥100 requests: inspect database/hash capacity |
| Hash duration and active slots | Operation only | Slots saturated and hash-capacity 503s for two minutes: inspect offered load |
| Refresh replay count | Outcome only | Any replay: diagnostic security event; ≥5 in five minutes: operator alert |
| Database pool/lock waits and failures | Operation class, bounded reason code | Dependency readiness false for 30 seconds: alert |
| Oldest cleanup-eligible record and last successful run | Record type | Last success >30 minutes or eligible age >30 minutes: inspect worker/backlog |
| Signing/clock failures | Bounded reason code | Any signing failure or >30-second clock drift: stop issuance/readiness and alert |

Do not label metrics with email, user ID, session ID, source address, or token digest. Audit storage is separate from diagnostic logs. Full observability infrastructure evolves in phase 08; essential signals and an inspectable local output exist with the first identity increment.

## 7. CI and recovery evidence

When application code exists, CI restores pinned dependencies, builds, checks formatting/static analysis, reviews migration artifacts, scans for secrets/dependency vulnerabilities, and validates container/Compose configuration if supplied. Run existing related tests. New test suites remain outside this request unless explicitly authorized.

For restore: close ingress; restore into an isolated database; verify schema/data; revoke every restored session under controlled maintenance authority; reconcile audit/key configuration; verify new login and rejection of old credentials; reopen the private sandbox. Record elapsed recovery time and the data-loss window. Do not reopen access before clearing restored session authority.

## 8. System Design Prerequisites & Concepts to Learn

Study least privilege, configuration boundaries, readiness versus liveness, schema/application compatibility, graceful shutdown, and backup recovery. A healthy process may be unable to authenticate because its database is down. A restored snapshot can contain obsolete authority even when the restore command succeeds.

The design uses explicit migration/provisioning steps to avoid repeated startup mutations. Its cost is a small operating procedure; the benefit is observable, auditable change. Demonstrate startup with invalid keys/settings, database interruption, a rollout with active sessions, and a restore that invalidates old access before accepting this phase operationally.
