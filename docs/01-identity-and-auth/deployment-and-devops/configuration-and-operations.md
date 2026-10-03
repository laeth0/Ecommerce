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

### 2.1 Phase 0 configuration seams

**Accepted Phase 0 contract, 2026-10-03:** exact keys below make the implementation plan concrete. The owner accepted these seams and existing numerical/security policies; acceptance is recorded in [Phase 0 readiness](../phase-0-readiness.md). These are future Options/file-loading contracts, not installed configuration.

| Key | Default / requirement | Validation and owner |
| --- | --- | --- |
| `ConnectionStrings:IdentityMigration` | Required secret only in migration mode | Separate migration login; never required/mounted in API mode |
| `ConnectionStrings:IdentityOperator` | Required secret only in operator/maintenance mode | Separate operator login; never required/mounted in API mode |
| `ConnectionStrings:IdentityFile` | `/run/secrets/identity-api-connection` in Compose API mode | Non-secret path companion to `Identity`; same pattern for all four connections |
| `ConnectionStrings:IdentityCleanupFile` | `/run/secrets/identity-cleanup-connection` when cleanup enabled | Readable protected UTF-8 file containing the complete cleanup connection string |
| `ConnectionStrings:IdentityMigrationFile` | `/run/secrets/identity-migration-connection` in migration mode | Readable only by one-shot migration process |
| `ConnectionStrings:IdentityOperatorFile` | `/run/secrets/identity-operator-connection` in operator mode | Readable only by one-shot operator process |
| `Identity:Database:ApiMaximumPoolSize` | 20 | Positive, ≤20 for recorded baseline |
| `Identity:Database:CleanupMaximumPoolSize` | 2 | Positive, ≤2 |
| `Identity:Database:PoolWaitSeconds` | 1 | Positive, ≤1; bound open/pool acquisition with cancellation |
| `Identity:Database:LockTimeoutMilliseconds` | 250 | Positive, ≤250; transaction-local PostgreSQL lock timeout |
| `Identity:Database:StatementTimeoutSeconds` | 2 | Positive, ≤2; transaction-local PostgreSQL statement timeout |
| `Identity:Database:TransactionTimeoutSeconds` | 3 | Positive, ≤3; whole-operation cancellation covers commit as well as commands |
| `Identity:Host:RequestTimeoutSeconds` | 10 | Positive, ≤10; includes the one permitted retry |
| `Identity:Host:ManagementPort` | 8082 in Compose | Valid distinct port, no host publication; accessible only to controlled management callers |
| `Identity:Host:ReadinessProbeTimeoutSeconds` | 1 | Positive, ≤1; includes database probe |
| `Identity:Host:ShutdownTimeoutSeconds` | 15 | Positive, ≤15; stop admission first |
| `Identity:Host:ClockDriftCheckIntervalSeconds` | 30 (accepted scheduling default) | Positive, ≤30; check at readiness too; failure to obtain time cannot establish issuance readiness |
| `Identity:Cleanup:CounterRetentionSeconds` | 3,600 | At least 3,600 beyond window end |
| `Identity:Cleanup:MaximumTransactionsPerClass` | 10 | Positive, ≤10 per run independently for sessions/audit/counters |
| `Identity:Cleanup:MaximumSessionsPerTransaction` | 100 | Positive, ≤100; same upper bound on empty parents deleted |
| `Identity:Cleanup:MaximumTokensPerTransaction` | 500 | Positive, ≤500; never let cascading deletes hide unbounded work |
| `Identity:Cleanup:MaximumAuditRowsPerTransaction` | 500 | Positive, ≤500 |
| `Identity:Cleanup:MaximumCounterRowsPerTransaction` | 500 | Positive, ≤500 |

For each consumed connection, configure exactly one of its direct secret value or `File` companion; reject both/missing/unreadable/empty values. A focused startup adapter loads the file once and supplies the existing connection Options; ASP.NET Core does not automatically dereference these custom file keys. Strip only the terminal file newline, reject embedded line breaks, never log contents or parsing exceptions containing credentials. Environment configuration may supply direct secret values from a protected launcher, but committed Compose/appsettings use only file paths. Freeze the resulting values per process.

Validate role identity and schema privileges when the database is reachable; syntax validation alone cannot prove least privilege. API validates API/cleanup, JWT/blocklist/HMAC and HTTP settings; operator validates only operator, audit and the password dependencies consumed by its command; migration validates only migration/schema/tool requirements. Do not start HTTP or workers in one-shot modes. Pool/deadline Options must agree with driver settings; reject conflicting unbounded connection strings. Request/body/JWT caps remain fixed protocol rules rather than independently adjustable configuration.

## 3. Roles and secrets

| Database identity | Needed access | Prohibited capability |
| --- | --- | --- |
| Migration owner | Create/update schema through reviewed migration process | Used as the regular API credential |
| API role | Select required identity rows; insert Customer account records; update verifier for rehash; manage sessions/refreshes/counters; append audit | DDL, user-role/status/version administration, audit update/delete |
| Cleanup role | Read retention candidates, acquire required locks, delete eligible sessions/tokens/audit/counters | Credential issuance, role/password changes, schema changes |
| Operator role | Explicit provisioning, reset, status change, session revocation, audit/operation inspection | Exposed through the public API |

Column-level grants/defaults must preserve these boundaries. API insertion of users relies on Customer/Active defaults and cannot explicitly write `role`, `status`, or `security_version`; only the operator may supply privileged values. Give cleanup only the UPDATE privilege needed for its row locks, not permission to change role, verifier, or security version. Verify grants against actual SQL and PostgreSQL behavior before release.

### 3.1 Phase 0 column-grant proposal

[PostgreSQL 18 SELECT](https://www.postgresql.org/docs/18/sql-select.html) requires SELECT on read columns and UPDATE on at least one column for explicit row locks. A column grant also allows **writing that column**; PostgreSQL has no separate lock-only grant. The owner accepted the least-privilege column proposal and its trade-off on 2026-10-03. Real Phase 2 verification remains required; no role or grants have been created.

| Table | API grants | Cleanup grants | Operator grants |
| --- | --- | --- | --- |
| `users` | SELECT needed fields; INSERT `id,email_normalized,password_hash,created_at,updated_at`; UPDATE `password_hash,updated_at` only (rehash and user lock) | SELECT `id` and retention discovery fields; UPDATE `updated_at` only for user-first locking; no DELETE | SELECT needed fields; INSERT provisioning fields; UPDATE `password_hash,status,security_version,updated_at`; no role change after provisioning |
| `sessions` | SELECT; INSERT session fields; UPDATE `idle_expires_at,revoked_at,revocation_reason` | SELECT; DELETE eligible parents; UPDATE `revocation_reason` for explicit locks only | SELECT; UPDATE `revoked_at,revocation_reason` |
| `refresh_tokens` | SELECT; INSERT token fields; UPDATE `consumed_at` | SELECT and bounded DELETE; no UPDATE, explicit token locks unnecessary when deleting under already-locked user/session | SELECT only if needed for inspection; no token issuance |
| `audit_events` | INSERT permitted audit fields; no UPDATE/DELETE; SELECT only if a concrete returned field needs it | SELECT retention/ID fields; DELETE; UPDATE `reason` solely to permit `FOR UPDATE SKIP LOCKED` batch selection | SELECT sanitized operation-inspection fields; INSERT permitted operator audit fields; no UPDATE/DELETE |
| `rate_limit_windows` | SELECT; INSERT counter fields; UPDATE `attempts` | SELECT; DELETE; UPDATE `attempts` for `FOR UPDATE SKIP LOCKED` batch selection | No access required |

Cleanup's `updated_at`, `revocation_reason`, audit `reason`, and counter `attempts` are the accepted lock-enabling write surface; its future implementation must issue no UPDATE statements. This is a real privilege trade-off: grants alone do not enforce retention or prevent alteration of those fields. API remains prohibited from role/status/version administration, cleanup from verifier/authority changes, and API/operator from audit modification. The owner accepted this trade-off. A future requirement for database-enforced lock-only/retention restrictions needs a separate architecture decision rather than silently adding privileged functions or broader grants.

Use distinct login roles `identity_api`, `identity_cleanup`, `identity_migration`, `identity_operator`, with a migration-owned schema/tables. Runtime logins have no superuser, database/role creation, replication, BYPASSRLS, ownership or elevated membership; grant schema USAGE, not CREATE. Review PUBLIC/default grants and migration history separately: readiness may SELECT required `identity.__EFMigrationsHistory` metadata; only migration writes it. Bootstrap authority provisions roles separately and is never a runtime credential.

Phase 2 must inspect actual EF INSERT/UPDATE/RETURNING columns, then exercise each role on real PostgreSQL: API Customer defaults and rehash/locks succeed; explicit role/status/version writes and DDL fail; cleanup can take required locks and perform bounded retention deletes but verifier/version changes fail; operator can reset/audit but cannot change an existing role; rollback removes coupled changes/audit. ORM-generated writes to protected default columns must be corrected, not permitted through broader grants.

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

### 4.1 Inspecting an uncertain operation

For the approved Docker environment, derive `operator_subject` as `uid:<effective-uid>` from the kernel process identity, never `USER`, an application role, caller argument or arbitrary environment string. Controlled access to the Docker daemon/one-shot invocation and the operator-only credential establishes authority; a container UID is a service subject, not proof of an individual human identity. Use a hidden TTY prompt when attached, otherwise read from a protected stdin pipe with bounded length; never accept password arguments. Password-consuming commands validate the same blocklist/new-password policy; inspection/status-only commands do not unnecessarily require JWT/private keys.

Inspection is a local maintenance procedure using the operator connection, not a new HTTP route or idempotent-reset promise. Retain the printed request ID outside the credential log. Query `audit_events` with a bound canonical UUID parameter, projecting only `request_id,action,occurred_at,target_user_id,operator_subject`; avoid verifiers, token material and raw reasons. Confirm the action/target matches the intended invocation. A matching atomic mutation audit proves commit. If absent, confirm primary reachability and that the original process/backend transaction has terminated (database maintenance authority may be needed to establish this); requery afterward. If termination/commit remains unknown, stop and reconcile. After 30-day audit expiry, absence is not evidence of rollback. Only a deliberate new operation may proceed after uncertainty is resolved.

## 5. Local deployment, health, and migration

The first implementation environment contains the API and PostgreSQL with persistent development storage. Docker Compose is appropriate for repeatable PostgreSQL startup; the API may initially run through the .NET development host. Bind administrative/database access to loopback or explicitly controlled private networks. Use synthetic accounts only.

For this checkout, the owner selected **both API and PostgreSQL in Docker Compose** on 2026-10-03. The intended sandbox publishes only API HTTPS `127.0.0.1:8443` → container `8443`; PostgreSQL `postgres:5432` has no host port. Use a private Compose network and a persistent named volume mounted at `/var/lib/postgresql` for the selected PostgreSQL 18 official image. Management port 8082 is separate and not published. Keep CORS origins and trusted proxies empty unless an explicit topology change is approved. Verify the Docker-visible source address before approving narrow Admin client CIDRs; Docker bridge addresses do not equal loopback. Existing Compose remains unchanged during Phase 0.

### 5.1 Compose secret mounts and provisioning

Use an operator-controlled host directory **outside the checkout and build context**, referenced by non-secret `IDENTITY_SANDBOX_SECRET_DIR`. Grant only owner/process read access with Windows ACLs or Unix permissions as appropriate; confirm mount permissions under the container's non-root UID. Mount individual files read-only, not the whole credential directory. [Compose file-based secrets](https://docs.docker.com/compose/how-tos/use-secrets/) are protected file mounts, not an encrypted secret manager; verify host and container access rather than relying on YAML mode declarations alone. Never commit generated artifacts or print their values.

| Host filename under that directory | Intended container path | Consumers |
| --- | --- | --- |
| `password-blocklist.sha256` | `/run/identity/password-blocklist.sha256` | API; password-consuming operator commands |
| `password-blocklist.metadata.json` | `/run/identity/password-blocklist.metadata.json` | Setup validation/inspection; records source/date/count/checksum |
| `identity-signing-private.pem` | `/run/secrets/identity-signing-private.pem` | Issuing API only |
| `verification/<kid>.pem` | `/run/identity/verification/<kid>.pem` | All API validators; public material only |
| `identity-rate-limit.key` | `/run/secrets/identity-rate-limit.key` | API replicas, same key |
| `identity-https.crt` | `/run/identity/tls/identity-https.crt` | API Kestrel HTTPS |
| `identity-https.key` | `/run/secrets/identity-https.key` | API Kestrel HTTPS |
| `identity-api-connection` | `/run/secrets/identity-api-connection` | API |
| `identity-cleanup-connection` | `/run/secrets/identity-cleanup-connection` | Enabled cleanup worker |
| `identity-migration-connection` | `/run/secrets/identity-migration-connection` | One-shot migration only |
| `identity-operator-connection` | `/run/secrets/identity-operator-connection` | One-shot operator/restore maintenance only |
| `postgres-bootstrap-password` | `/run/secrets/postgres-bootstrap-password` | PostgreSQL initialization/controlled provisioning only |

Map existing blocklist/JWT/HMAC Options to these paths. Accepted HTTPS configuration uses [Kestrel endpoint configuration](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/endpoints?view=aspnetcore-10.0) keys `Kestrel:Endpoints:Https:Url=https://+:8443`, `Kestrel:Endpoints:Https:Certificate:Path=/run/identity/tls/identity-https.crt`, and `Kestrel:Endpoints:Https:Certificate:KeyPath=/run/secrets/identity-https.key`. Disable the public HTTP binding when this HTTPS listener is implemented. The management listener must reject business routes, and the HTTPS listener must not expose management routes. Compose exposes paths/names only; use the [official PostgreSQL image](https://hub.docker.com/_/postgres)'s `POSTGRES_PASSWORD_FILE` reference for bootstrap, never a password literal.

Provisioning procedure, to be performed before consuming startup checks:

1. Prepare the protected external directory and audit its ACLs. Select and record an approved common/compromised-password source/license and update date. Normalize source passwords with the documented NFC policy, encode UTF-8, SHA-256 hash, then sort/deduplicate lowercase 64-character hexadecimal digests, one per line. No header or plaintext passwords in the runtime artifact. Record digest count, source/update date and SHA-256 of the exact file in metadata. Do not substitute a small demonstration list for the approved artifact; source selection remains a prerequisite.
2. Generate RSA with a vetted local tool (for example `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out <protected-private-path>`); derive the public PEM with `openssl pkey -in <protected-private-path> -pubout -out <public-path>`. Choose a bounded stable non-secret kid matching the public filename. Validate key size/pair and record only public fingerprints. Use restrictive file creation permissions before generation.
3. Generate the shared HMAC file with `openssl rand -out <protected-hmac-path> 32`. Validate length/read permissions without logging bytes; distribute the same file to replicas. Do not reuse it as signing or database material.
4. Generate an HTTPS key and localhost SAN certificate through a trusted development CA. Protect the CA/private keys outside the checkout, trust only its public certificate in the intended client store, and verify certificate dates/SAN/key match. Mount leaf PEM certificate/key at the paths above. Do not disable client certificate validation to make the scenario pass. The trusted CA/tool and resulting artifacts remain setup prerequisites.
5. Generate separate strong random passwords into protected files using local tooling that writes directly to disk. Initialize PostgreSQL through its bootstrap secret-file reference; controlled provisioning creates separate logins with SCRAM password storage. Set role passwords through hidden interactive `psql \password` or an equivalent protected provisioning input, never shell arguments, checked-in SQL or console output. Grant the reviewed role matrix, then create each protected connection-string file with `Host=postgres`, the correct database/login and bounded pool/deadline settings. Use a proper connection-string builder/serializer so secret characters are encoded correctly. Never use bootstrap/migration credentials for API traffic.
6. Provide migration/operator profiles using the **same API executable/image** with mode-specific entry arguments and secret mounts. Apply reviewed migrations once, then start API/cleanup. Validate HTTPS client trust, source/network restrictions, pool/grants and secret redaction before credential scenarios. Record artifact existence/metadata/results in Phase 0 readiness without committing secret values.

These are procedures and intended locations, not evidence of provisioned secrets. Missing artifacts prevent their consuming mode from becoming ready; no automatic fallback is permitted.

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

### 7.1 Restored-session maintenance

Stop every API replica, cleanup worker and other database writer; firewall/Compose isolation must keep ingress closed throughout maintenance. Verify schema and keys after restoring into isolation. Use the operator credential through the same executable's controlled maintenance mode, not an Admin HTTP endpoint.

Enumerate **every user with any `sessions.revoked_at IS NULL`**, without filtering account status/version or idle/absolute expiry. For each user, lock it `FOR UPDATE`, take a bounded batch (at most 100) of unrevoked sessions in ascending ID order, capture DB wall time, set `revoked_at` and existing reason `operator_revoke`, increment security version with overflow check, append existing `operator.sessions_revoked` audit with trusted subject/request ID and a restore reason, then commit within three seconds. Repeat until that user's unrevoked rows are exhausted; each deliberate batch is a recorded security action. Do not delete token history or enable Disabled accounts. On any audit/version/deadline/commit uncertainty, keep ingress closed and follow request-ID reconciliation; discover remaining work again only after resolving the original transaction.

Check directly on the primary that **zero sessions have `revoked_at IS NULL`** before reopening, including Disabled-user and retained expired-session rows. Old restored JWTs/refresh credentials must fail across replicas; verify a fresh eligible login independently. Use the existing operator audit/revocation vocabulary; no extra business table or public operation is implied. Key compromise requires separate rotation/withdrawal. Record elapsed recovery/data-loss window and sanitized batch evidence; maintenance completion alone does not prove V-16 passed.

## 8. System Design Prerequisites & Concepts to Learn

Study least privilege, configuration boundaries, readiness versus liveness, schema/application compatibility, graceful shutdown, and backup recovery. A healthy process may be unable to authenticate because its database is down. A restored snapshot can contain obsolete authority even when the restore command succeeds.

The design uses explicit migration/provisioning steps to avoid repeated startup mutations. Its cost is a small operating procedure; the benefit is observable, auditable change. Demonstrate startup with invalid keys/settings, database interruption, a rollout with active sessions, and a restore that invalidates old access before accepting this phase operationally.
