# Phase 0 — Identity contract readiness

**Review date:** 2026-10-03. **Status:** contract review and owner decisions complete; artifact provisioning and live database verification remain setup gates. No Identity runtime, migration, package installation, secret generation, or deployment was performed.

This is the execution record for Tasks 0.1–0.2 in the [implementation plan](implementation%20plan.md). All twelve source documents in its source map were reviewed together with the actor model, global architecture, Definition of Done, five Identity projects, API composition root, and root build/container files. The owner explicitly accepted the documented Identity numerical/security policies and Phase 0 proposals in this session. Acceptance establishes the baseline, not implemented behavior or authorization to execute Phase 1 in this request.

## 1. Verified source baseline

- `Directory.Build.props` targets `net10.0`, enables nullable references and implicit usings. `dotnet.exe --version` returned `10.0.401` in this WSL workspace.
- Identity has five inward-dependent projects and a Presentation registration extension; no Identity business operations or database mappings exist. Only Presentation uses the ASP.NET Core shared framework among these libraries.
- The sole executable registers all seven module controller assemblies, uses Negotiate authentication and a default-deny fallback policy. Bearer authentication is future Phase 6 work.
- Compose currently runs the backend alone on loopback HTTP 8080. Its PostgreSQL service, persistent volume, secret mounts and HTTPS listener are future implementation work. A development HTTPS launch profile does not establish container TLS.
- Existing modified Docker, host configuration, launch profile, overview and `.wolf` files were identified before editing and are preserved. No unrelated dependency/version change is part of this review.
- The plan-referenced execution skill is absent from the available skill directories. Phase 0 was executed directly under repository instructions; no delegation or automated test infrastructure was introduced.

## 2. Request-to-commit traces

All security mutations use one primary connection, `READ COMMITTED`, user → sessions in ID order → refresh tokens in ID order. Time-sensitive decisions use `clock_timestamp()` **after** locks. Audit participates in the same transaction. Counter transactions finish before business locks. The [database contract](database/schema-and-transactions.md) and [recovery contract](reliability-and-failure-scenarios/recovery-and-concurrency.md) own these rules.

| Workflow | Input and admission | Authoritative state, locks and commit | Public outcome and safe recovery |
| --- | --- | --- | --- |
| Register, ID-FR-01 | Strict bounded JSON; normalized email; NFC new-password rules/blocklist; global → source → email limits; hash slot; hash outside transaction | Normalized-email uniqueness in `users`; insert Customer/Active with server defaults using conflict-do-nothing; insert `account.registered` only for a new row. Unique insertion arbitrates concurrent creation; there is no existing-user precheck/lock requirement | Known insert/no-op → fixed `202`, no credentials. Duplicate does not overwrite verifier/status/role. Validation `400`, admission `429`, capacity/dependency/audit failure `503`. Repeat the same valid registration safely after uncertainty |
| Login, ID-FR-02 | Bounded existing-password input; global → source → email; real or precomputed dummy verification outside transaction; Admin source check | Lock `users`, reread verified hash/version/status/network eligibility; count only matching-version, unrevoked, unexpired sessions at locked DB time. Below five, create `sessions`, `refresh_tokens`, `session.created`; optional rehash only against the checked verifier. Prepare/sign before commit; publish only after known commit | `200` pair after commit; unknown/wrong/Disabled/disallowed-network/stale verifier → identical `401`; cap → `409`. Lost response may leave a session: no automatic login retry; deliberate new login is another session |
| Refresh, ID-FR-03 | Bounded canonical secret; global → source; digest lookup discovers session; session bucket only when found | Discovery is not authority. Lock/reread user, session, token; check Active/version → session revocation/deadlines → Admin network → consumed replay → token expiry. Rotation consumes predecessor, inserts one successor, advances idle only, writes `session.refreshed`; sign before commit. Replay revokes only parent session and writes `session.replay_detected`, then **commits** denial | Rotation `200`; replay and other credential denials generic `401`. Old consumed token proves replay even past its own expiry while parent remains eligible. Uncertain response → new login; no replay grace or recovered successor secret |
| Logout, ID-FR-04 | Bounded canonical secret; global → source; no session limit/Bearer/Admin network requirement | Locate any retained token, including consumed; lock/reread user → session → token. Set revocation once and append `session.logged_out`; unknown or already revoked is a known no-op. Does not increment account version | Known commit/no-op → `204`. Malformed secret `400`; outage/unknown outcome `503`. Same secret can be submitted again safely; clearing client memory alone is not proof of server revocation |
| Current user, ID-FR-05 | Bounded transport/query checks; source admission; cryptographic Bearer validation; authoritative primary joined user/session check; Admin network if applicable; eligible-session bucket | User/session ID, role, version, status, revocation and both deadlines define the authorization snapshot. Minimal projection only; no idle extension or business audit required | `200` own record; invalid authority `401`, Admin network `403`, dependency `503`. Read authorized before later revocation may finish; a new check after commit must fail |
| Admin lookup, ID-FR-06 | Source admission; valid eligible Bearer; Admin/network permission before target UUID validation or lookup; eligible-session bucket | Primary requester state check; then canonical target and minimal `users` projection; write `admin.user_read` with requester/target and request ID; return data only after audit commit. No mutation of target account/session; ordinary read snapshot semantics | `200` after audit commit; Customer/network denial `403` regardless of target; authorized bad UUID `400`, missing target `404`; audit/dependency `503` with no data. Repeating is a new audited read |
| Operator reset, ID-FR-07 | Controlled local process and separate DB credential; known fixture UUID/reason; new-password validation/blocklist/hash outside transaction; print generated request ID first | Lock user → every unrevoked session in ID order; replace hash, checked version increment, revoke all sessions including expired retained ones; `operator.password_reset` with trusted process subject/reason. Disabled remains Disabled. Token rows need no mutation because parent revocation invalidates them | Exit 0 only after known commit; otherwise sanitized nonzero. Uncertain reset → request-ID audit inspection after proving original operation ended; absent audit while in flight never proves rollback. No automatic repeat |

Deadlock/serialization/lock timeout permits one retry only after known rollback, 25–75 ms jitter, within the original deadline, with fresh locked state. Never retry an unknown commit or statement/request timeout. No EF execution strategy may introduce extra issuance retries.

Deadlines: hash work has two slots and no waiters; API has 100 executing slots; pool wait ≤1 second; lock wait 250 ms; statement 2 seconds; transaction wall time 3 seconds; request 10 seconds. Private operator/maintenance batches retain the same transaction deadlines. Token signing and required audit failure cannot produce a successful issuance.

## 3. Version and advisory evidence

On 2026-10-03, all fourteen distinct NuGet package/tool pins in plan §4 were present and listed in NuGet's registration/catalog metadata. Their exact versions are retained; no packages were installed. The NuGet vulnerability base and update feeds were also queried (update timestamp `2026-10-03T05:43:50.9562962Z`). No published affected range matched these direct pins. This is a feed snapshot, not an assertion that the future restored transitive graph or container is vulnerability-free.

| Selection | Evidence and boundary |
| --- | --- |
| SDK 10.0.401 | Installed Windows SDK invoked from WSL; future `global.json` belongs to Phase 1 |
| Microsoft runtime/EF/Extensions packages and dotnet-ef 10.0.12 | Each selected package/tool exists in the [NuGet service](https://api.nuget.org/v3/index.json). Existing host references remain unchanged |
| Npgsql provider/driver 10.0.3 | Provider requires EF/Relational `[10.0.4,11.0.0)` and driver ≥10.0.3; proposed EF 10.0.12 fits. [Provider metadata](https://www.nuget.org/packages/Npgsql.EntityFrameworkCore.PostgreSQL/10.0.3) |
| JsonWebTokens/Tokens 8.23.0 | JsonWebTokens requires Tokens ≥8.23.0, rather than an exact-equality dependency. Selected direct pins match. JwtBearer 10.0.12 allows OpenIdConnect ≥8.19.2; inspect the complete resolved IdentityModel graph after restore. [Metadata](https://www.nuget.org/packages/Microsoft.IdentityModel.JsonWebTokens/8.23.0) |
| FluentValidation 12.1.1 | Listed stable core package; no dependency-scanning/MVC integration package selected |
| PostgreSQL image candidate | `postgres:18.6-bookworm`; [18.6 release notes](https://www.postgresql.org/docs/18/release-18-6.html) and [security fixes](https://www.postgresql.org/support/security/) reviewed; official registry manifest exists. Multi-platform index: `sha256:3725f4e2499eef5134592b3b4ab79a543ed7f8e533b05b5b637af926630f6650`; pin `postgres:18.6-bookworm@sha256:3725f4e2499eef5134592b3b4ab79a543ed7f8e533b05b5b637af926630f6650`. Observed Linux amd64 child manifest: `sha256:9e73daeb439141c2b11eea2463f5f1a3b269fd90d897b41cddb7cb440f21aa5d`. Record the selected platform when the engine runs. No image was pulled/run and no image vulnerability scan was performed |

NuGet vulnerability feed: [service index](https://api.nuget.org/v3/vulnerabilities/index.json). Restore, resolved transitive audit, compilation and container scanning remain consuming-phase gates. The owner accepted PostgreSQL 18.6-bookworm with the documented Phase 0 choices.

## 4. Concrete seams and owner decisions

The definitions below are recorded in their owning contracts. On 2026-10-03 the owner answered **“Accept the documented policies and proposals”** to the concrete review, including the column-grant trade-off:

| Decision | Accepted definition | State |
| --- | --- | --- |
| Execution environment | API and PostgreSQL in separate containers on a private Compose network, persistent DB volume; HTTPS credentials; file-mounted secrets outside repository | **Confirmed by owner in this session**; setup has not run |
| Fixed policy | Adopt overview lifetimes/cap, security/password/JWT rules, capacity/retry/retention rules and declared NFR workloads unchanged; retain plan libraries | **Accepted**; includes the pinned PostgreSQL 18.6-bookworm image baseline |
| Connection/configuration seam | Four named connection keys and mutually exclusive file-path companions, exact Database/Host/cleanup keys and mode-specific validation in [operations §2.1](deployment-and-devops/configuration-and-operations.md#21-phase-0-configuration-seams) | **Accepted**; no file-provider implementation exists |
| Database roles/locks | Minimal columns in [operations §3.1](deployment-and-devops/configuration-and-operations.md#31-phase-0-column-grant-proposal); PostgreSQL allows locks with one UPDATE column, which also permits writes to that column | **Accepted trade-off**; real generated-SQL/grant checks required in Phase 2 |
| Admission ordering | [Capacity §2.1](performance-and-scalability/capacity-and-rate-limiting.md#21-route-specific-ordering) resolves discovery/eligible-session dependencies without holding counter locks during security transactions | Clarification of existing routes/limits; no new public behavior |
| Operator subject/input | Container effective UID from OS, controlled Docker access and operator DB credential; hidden terminal or protected stdin; no identity from `USER`/arguments/role fields | **Accepted** concrete adapter for confirmed Docker environment; [operations §4.1](deployment-and-devops/configuration-and-operations.md#41-inspecting-an-uncertain-operation) |
| Restore | Close ingress/workers, revoke all unrevoked retained sessions for every user, including Disabled users; bounded transactions and existing operator audit/reason; zero-unrevoked check before reopening | [Operations §7.1](deployment-and-devops/configuration-and-operations.md#71-restored-session-maintenance); no public endpoint/schema/action added |

## 5. Setup prerequisite register

The owner requested locations and generation procedures when artifacts do not yet exist. No artifact was supplied/validated in this session. Paths below are the **intended contract**, not evidence that files exist; [operations §5.1](deployment-and-devops/configuration-and-operations.md#51-compose-secret-mounts-and-provisioning) owns provisioning.

| Prerequisite | Required evidence before use | State and owner |
| --- | --- | --- |
| Password blocklist | Approved source/license, source/update date, normalization/import procedure, nonempty digest count and SHA-256 artifact checksum; protected `password-blocklist.sha256` | Missing evidence; project owner selects source; engineer provisions/validates before Phase 1 security configuration becomes ready |
| RSA private/public keys | ≥3,072 bits, matching public key, configured kid, protected read-only private mount; record public fingerprint only | Not supplied; sandbox operator provisions before key startup validation |
| Shared HMAC key | ≥32 random bytes, same protected file on both replicas, controlled rotation | Not supplied; sandbox operator provisions before admission work |
| HTTPS certificate/private key | Trusted localhost SAN certificate, valid dates/key match; client trust and container readability | Not supplied; sandbox operator provisions before credential transport verification |
| Four database credentials | Separate role logins, no elevated inherited memberships, SCRAM provisioning and reviewed grants; mode-specific secret mounts | Not supplied; sandbox operator provisions before database startup/migration |
| Compose topology | API HTTPS loopback `8443` → container `8443`; PostgreSQL `postgres:5432` only on private network; restricted management `8082` without host publication; no trusted proxy/CORS origin by default | **Accepted** concrete ports/mounts; no Compose edits made |
| Docker engine | Reachable Linux engine; image architecture confirmed | `docker.exe version` found client 29.8.0 but Docker Desktop Linux engine pipe was absent. Native `docker` WSL integration is unavailable. Owner starts engine; live PostgreSQL checks remain Not run |

Do not substitute a tiny sample blocklist, ephemeral signing key, default DB password, broad Admin CIDR, or HTTP-only transport to close these prerequisites. Loopback Admin defaults do not automatically cover Docker bridge source addresses: verify the effective client address and approve narrow client CIDRs before Admin acceptance.

## 6. Evidence and exit gate

| Check | Result |
| --- | --- |
| Full scoped spec/scaffold review and six required request-to-commit traces | Passed; traces include current-user read as an additional necessary dependency |
| SDK and direct-pin metadata/advisory review | Passed within the feed-snapshot limits above; image manifest inspection passed |
| Documentation links, embedded JSON parse and focused diff whitespace | Passed: 14 Identity Markdown files, 81 local links including fragments, one embedded JSON block; focused `git diff --check` passed. JSON parsing is not full JSON Schema validation |
| PostgreSQL generated-SQL/grants, constraints/locks, API manual scenarios, runtime performance | Not run; no Identity runtime/migration exists and Docker engine unavailable |
| Owner policy/seam acceptance | Passed: explicit acceptance recorded in §4 |
| Artifacts/credential mount validation | Not run; no secret values requested or recorded |

**Decision exit gate:** resolved for the next phase. The owner instructed that missing artifacts be documented as setup prerequisites with locations/generation procedures; this review satisfies that deliverable. Artifact acquisition and the plan's real generated-SQL/grant verification remain unchecked: the former blocks readiness of its consuming mode, the latter must run in Phase 2 once mappings/migrations exist. Neither was silently waived. Phase 1 and later implementation are outside this request.
