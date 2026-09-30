# Identity Recovery and Concurrency

**Status:** required future behavior; no live failure experiment has been run. Public responses are defined in the [API contract](../functional-requirements/api-contracts.md).

## 1. System Design Prerequisites & Concepts to Learn

Study transaction atomicity, commit ambiguity, replay, request cancellation, and lock ordering. A request can commit while its response is lost. A client cannot infer rollback from a timeout.

This phase uses explicit database transactions and durable session state because process memory cannot resolve uncertainty after restart. There is no distributed transaction: all identity truth is in one PostgreSQL database. In-memory mutexes, blind request retries, and reconstructing a lost refresh secret from a password are rejected.

The trade-off is occasional forced login after a lost refresh response. That is simpler than adding encrypted successor-token recovery or a grace window. It must be visible in the client contract.

## 2. Failure matrix

| Scenario | Required state and response | Recovery/acceptance |
| --- | --- | --- |
| Concurrent registration with the same normalized email | One account; generic `202` after known commit/no-op | Existing verifier/status/role unchanged by the losing request |
| Login racing operator password reset | User lock and verifier/version recheck order issuance against reset | Old verification cannot produce usable credentials after reset |
| Login racing the active-session cap | Count and insert under user lock | At most five eligible sessions; losing login receives `409` |
| Two simultaneous refreshes | At most one successor; second consumption detects replay and revokes the session | After both settle, even the winning response is invalid; fresh login required |
| Refresh racing logout/disable/reset | User-first locks serialize operations | Revocation first prevents issuance; issuance first is invalidated by the later revocation |
| Process crashes before commit | Database rolls back token consumption, successor, and audit together | Original token remains usable unless expired/revoked by another operation |
| Process crashes after successful refresh commit, before response | Successor digest exists, raw successor is unavailable to client | Client logs in again; replay of the old token revokes its session |
| Login response lost after commit | A session may exist even though client received no credentials | Do not automatically retry as though login were idempotent; a deliberate new login creates another session and still obeys the cap |
| Logout response lost | Revocation may have committed | Repeat logout with the same secret; known/unknown/already revoked all return `204` when database is available |
| Replay revocation commits but denial response is lost | Session remains revoked | Retrying cannot reactivate it; do not roll back revocation merely because the HTTP result is an error |
| Database unavailable | No credential issuance, authoritative access, audit-required read, or confirmed logout | `503` within deadline; readiness false; never accept signature alone as a fallback |
| Signing key unavailable or signing fails | No new token pair is returned; precommit transaction rolls back | Fix key configuration; no ephemeral-key fallback |
| Required audit insert fails | Mutation rolls back, or Admin read returns no data | `503`; repair audit storage/permissions before retrying |
| Lock timeout/deadlock | Transaction is aborted and no partial effect survives | Apply bounded safe-retry policy below; persistent contention returns `503` |
| Hash-work slots exhausted | No credential verification or issuance is started | Immediate `503`, bounded memory; existing work completes and releases its slot |
| Rate-limit store unavailable | Admission cannot be established | `503`; no unlimited local fallback |
| Client disconnects/cancels | Cancel work before commit where possible; committed effects remain | Do not claim rollback after commit; follow the operation's replay behavior |
| Cleanup worker stops | Old rows remain; credential validity still checked at use | Alert lag and resume bounded batches; no expired token gains access |
| Cleanup meets live refresh | Retention prevents eligible-session deletion; user-first locks prevent inversion | Row disappearing after preliminary discovery becomes an invalid credential |
| Database restored from backup | Old sessions/keys may reappear | Keep ingress closed; revoke all restored sessions; validate keys, then reopen |
| App clock differs from database | JWT validation allows at most 30 seconds; state checks use database time | Alert clock drift; block issuance if measured drift exceeds 30 seconds |

## 3. Retry policy

Within one request, permit **one** transaction retry for PostgreSQL deadlock (`40P01`), serialization failure (`40001`), or lock timeout (`55P03`) only when rollback is known. Delay with random jitter of 25–75 ms, release all previous locks/connections, then reload authoritative state and restart the entire transaction within the original request deadline.

Do not retry a statement inside an aborted transaction. Do not reuse a stale verified password result without its locked verifier/version recheck. Discard uncommitted generated token material. The retry may now discover replay, expiry, session limit, or revocation and must return that actual result.

Do not automatically retry network errors during commit, unknown transaction outcome, statement/request timeout, credential denial, validation failure, or capacity rejection. PostgreSQL driver/EF execution strategies must not silently wrap credential issuance in additional retries that bypass this policy. A known rollback and an unknown commit require different handling.

Register and logout have safe client repetition semantics. Login creates a new session each time. Refresh consumes a single-use secret. Operator password reset is an explicit new security operation; inspect its request-ID audit record after uncertainty before repeating it.

## 4. In-flight authorization semantics

After a successful revocation commit, a new authoritative access check must fail on any replica. A read authorized before that commit may finish afterward. This contract does not promise retroactive cancellation of every running request.

Sensitive mutations requiring ordering against revocation must hold the shared user/session locks through their transaction and revalidate access there. Revocation then waits for that mutation or wins first. A later domain cannot claim the stronger ordering merely because its middleware checked a JWT earlier.

## 5. Required experiments

For each crash experiment, record the point of interruption, request ID, committed rows, audit outcome, client-visible result, and next permitted action. Use at least two database connections for races and two API replicas for revocation/admission checks. Repeat around both sides of commit.

All credentials and accounts are synthetic. No automated test infrastructure is created now; the [verification strategy](../testing-strategy/verification-scenarios.md) describes the future evidence and permitted manual execution.
