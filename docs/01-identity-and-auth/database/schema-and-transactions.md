# Identity Schema and Transactions

**Status:** proposed PostgreSQL 18 contract. SQL below specifies the target schema; no migration or database has been created. EF Core mappings and generated migrations must match it before acceptance.

## 1. Ownership and representation

Identity owns the `identity` schema. IDs are application-generated UUIDs; timestamps are PostgreSQL `timestamptz` and application UTC values. Credential digests are 32-byte SHA-256 outputs. Account roles/statuses use constrained text to keep this small model explicit without PostgreSQL enum migration coupling.

One user has many sessions; one session has a chain of refresh credentials. Parent session state always takes precedence over a token's standalone expiry. A database uniqueness constraint protects both normalized account identity and the single unconsumed credential per session.

```sql
CREATE SCHEMA identity;

CREATE TABLE identity.users (
    id uuid PRIMARY KEY,
    email_normalized varchar(254) COLLATE "C" NOT NULL,
    password_hash text NOT NULL,
    role varchar(16) NOT NULL CHECK (role IN ('Customer', 'Admin')),
    status varchar(16) NOT NULL CHECK (status IN ('Active', 'Disabled')),
    security_version integer NOT NULL DEFAULT 1 CHECK (security_version > 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT users_email_normalized_unique UNIQUE (email_normalized),
    CHECK (char_length(email_normalized) BETWEEN 3 AND 254),
    CHECK (email_normalized = lower(email_normalized)),
    CHECK (email_normalized = btrim(email_normalized)),
    CHECK (octet_length(password_hash) BETWEEN 1 AND 1024),
    CHECK (updated_at >= created_at)
);

CREATE TABLE identity.sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    issued_security_version integer NOT NULL CHECK (issued_security_version > 0),
    created_at timestamptz NOT NULL,
    absolute_expires_at timestamptz NOT NULL,
    idle_expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revocation_reason varchar(32),
    CHECK (absolute_expires_at > created_at),
    CHECK (idle_expires_at > created_at AND idle_expires_at <= absolute_expires_at),
    CHECK ((revoked_at IS NULL) = (revocation_reason IS NULL)),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at),
    CHECK (revocation_reason IS NULL OR revocation_reason IN
        ('logout', 'refresh_replay', 'password_reset', 'disabled', 'operator_revoke'))
);
CREATE INDEX sessions_user_active_idx
    ON identity.sessions (user_id, absolute_expires_at, idle_expires_at)
    WHERE revoked_at IS NULL;
CREATE INDEX sessions_cleanup_idx ON identity.sessions (absolute_expires_at, id);

CREATE TABLE identity.refresh_tokens (
    id uuid PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES identity.sessions(id) ON DELETE CASCADE,
    token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    CHECK (expires_at > created_at),
    CHECK (consumed_at IS NULL OR consumed_at >= created_at)
);
CREATE UNIQUE INDEX refresh_tokens_one_unused_idx
    ON identity.refresh_tokens (session_id) WHERE consumed_at IS NULL;
CREATE INDEX refresh_tokens_session_idx ON identity.refresh_tokens (session_id, id);

CREATE TABLE identity.audit_events (
    id uuid PRIMARY KEY,
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    actor_user_id uuid REFERENCES identity.users(id) ON DELETE RESTRICT,
    target_user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    session_id uuid,
    operator_subject varchar(128),
    action varchar(40) NOT NULL CHECK (action IN
        ('account.registered', 'session.created', 'session.refreshed',
         'session.logged_out', 'session.replay_detected', 'admin.user_read',
         'operator.admin_created', 'operator.password_reset',
         'operator.user_disabled', 'operator.user_enabled', 'operator.sessions_revoked')),
    reason varchar(256),
    request_id uuid NOT NULL,
    CHECK (operator_subject IS NULL OR char_length(operator_subject) BETWEEN 1 AND 128),
    CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 256),
    CHECK ((action LIKE 'operator.%') = (operator_subject IS NOT NULL)),
    CHECK (action NOT LIKE 'operator.%' OR reason IS NOT NULL)
);
CREATE INDEX audit_target_time_idx ON identity.audit_events (target_user_id, occurred_at DESC, id);
CREATE INDEX audit_cleanup_idx ON identity.audit_events (occurred_at, id);

CREATE TABLE identity.rate_limit_windows (
    scope varchar(40) NOT NULL,
    bucket_hash bytea NOT NULL CHECK (octet_length(bucket_hash) = 32),
    window_start timestamptz NOT NULL,
    window_end timestamptz NOT NULL,
    attempts integer NOT NULL CHECK (attempts > 0),
    PRIMARY KEY (scope, bucket_hash, window_start),
    CHECK (window_end > window_start)
);
CREATE INDEX rate_limit_cleanup_idx ON identity.rate_limit_windows (window_end);
```

Email syntax and ASCII normalization are validated at the application boundary before insertion; database uniqueness is the final race arbiter. No raw refresh credential is stored. `audit_events.session_id` is deliberately a historical identifier without a foreign key so session cleanup cannot erase or block audit retention. There is no generic JSON audit payload that could accidentally contain credentials.

The schema does not use an `is_active` flag that cleanup must maintain. Eligibility is derived from current user status/version, revocation, and expiry. Index predicates deliberately omit volatile clock expressions. GIN/GiST/partitioning provide no demonstrated value for these access paths.

## 2. Transaction protocol

All security mutations use `READ COMMITTED`, explicit row locks, and one connection/transaction per operation. Lock order is:

1. `identity.users` target row `FOR UPDATE`.
2. Required `identity.sessions` rows in ascending ID order `FOR UPDATE`.
3. Required `identity.refresh_tokens` rows in ascending ID order `FOR UPDATE`.
4. Append audit, then commit.

The initial refresh digest lookup is discovery only; every authorization/state condition is rechecked after locks. A cleanup race may remove a discovered row, which becomes an invalid credential, not an internal success. Read database `clock_timestamp()` after lock acquisition; transaction-start timestamps are insufficient after waiting. [PostgreSQL documents row-lock behavior and deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html).

Rate-limit counter transactions complete before any user lock is acquired. Cleanup uses the same user-first order for session deletion; never lock a session and then try to acquire its user.

### Registration

Compute the candidate hash outside the transaction. Insert the account using the normalized-email unique constraint with conflict-do-nothing behavior; append audit only if insertion occurred. Do not catch a uniqueness error and continue issuing commands inside an aborted transaction. The generic `202` follows a known commit/no-op result. No application pre-check replaces uniqueness.

### Login and password rehash

Read the stored verifier and security version, verify outside a transaction, then lock the user and re-read its verifier/version/status. If any verified credential value changed, deny the request. Under that lock, count sessions satisfying version, not-revoked, and both expiry predicates. Insert the new session/token and audit only below the cap.

An opportunistic parameter rehash can update only the verifier that was successfully checked; it does not change the user's password or security version. A real operator password reset changes both verifier and version, and revokes all sessions. This distinction prevents rehash from overwriting a concurrent reset.

### Refresh

After locking user/session/token, evaluate in order: Active user and matching versions; unrevoked session with both deadlines in the future; Admin source allowlist; consumed-token replay; token expiration; valid rotation.

On rotation, capture database time, set old `consumed_at`, insert the one unconsumed successor with `expires_at = min(now + role idle lifetime, absolute_expires_at)`, update session inactivity, and append audit. The partial unique index enforces at most one unused token. Generate token material/signature before commit; discard it if the transaction fails. Retain the consumed row.

On replay, set session revocation and audit, **commit the denial's state change**, then return `401`. Expired/revoked sessions do not need a fresh replay mutation. No account-wide security-version increment occurs for one-session replay.

### Logout and operator commands

Logout can use any retained token belonging to the session; it revokes once under locks and is otherwise a no-op. Operator reset/disable/revoke locks the user, increments its security version, updates affected sessions in ID order, and appends audit. Enable never clears session revocation. Integer version overflow fails closed and requires migration/recovery; it must not wrap.

### Protected reads and sensitive future mutations

After JWT cryptographic validation, use one bounded primary-database query joining the JWT's user and session. Require matching subject, session owner, role, security version, Active status, no revocation, and valid absolute/inactivity deadlines. This is the read's authorization snapshot; a request already authorized may finish after later revocation.

For security-sensitive mutations and later administrative business mutations requiring strict ordering against logout/reset, revalidate under `FOR SHARE` user and session locks within the mutation transaction. They conflict with revocation's `FOR UPDATE` locks. Always acquire user before session; never upgrade a shared user lock after taking a session lock. Identity mutations already take user `FOR UPDATE` from the start. Later domains must adopt this contract explicitly.

Admin user lookup checks the requesting Admin's authoritative session, loads the target, and commits the read-audit before returning. Its record visibility is a normal read snapshot; a later target disable does not retroactively erase that observation.

## 3. Constraints that span rows

The application transaction MUST enforce: token expiry ≤ session absolute expiry; session-issued version equals the locked user's version; no more than five active sessions; role-specific lifetimes; actor permission and Admin source network. These are not mislabeled as guarantees of the SQL CHECK constraints, which cannot enforce arbitrary cross-row state.

## 4. Cleanup, retention, and recovery

- **Sessions and all their refresh tokens:** retain until `absolute_expires_at + 24 hours`, even if revoked or idle-expired earlier. Then delete the session and cascade its tokens. Never delete a consumed token merely because its own expiry passed: it is needed to detect replay during the remaining session lifetime.
- **Audit:** retain 30 days, then delete through the privileged cleanup identity in bounded batches. This is a sandbox retention policy, not a legal compliance claim.
- **Rate counters:** retain until `window_end + 1 hour`, then delete. Counters are admission records, not durable identity facts.
- **Users:** no automated account deletion in this phase. Disable when necessary; a reset preserves the user ID for future domain references.

Run cleanup every 15 minutes, at most 100 session parents or 500 audit/counter rows per transaction, at most ten batches per run. Discover eligible users without locking child rows; acquire one user with `FOR UPDATE SKIP LOCKED`, then at most 100 eligible sessions for that user. Other replicas may skip it and handle another user. Audit/counter cleanup locks rows in stable primary-key order with `SKIP LOCKED`. The next run resumes remaining work. Large refresh chains make cascades costly: enforce refresh admission, measure deleted child counts and duration, and keep the transaction deadline. Do not claim a bounded parent count also bounds all child-row work.

Cleanup failure never grants access. An interrupted delete rolls back its batch. A restored database may contain previously revoked credentials; before reopening a restored sandbox, revoke all restored sessions through the operator recovery procedure and rotate compromised keys if applicable.

## 5. Migration and database verification

The initial EF migration creates this schema in an empty database; it does not authorize re-baselining an existing database. Review generated SQL for keys, indexes, cascade behavior, UTC mappings, and missing constraints. Use a separate migration role; API credentials cannot apply DDL.

Verify normalized-email uniqueness, single-unused-token uniqueness, active-session counting under concurrency, password reset versus login, and replay versus refresh on real PostgreSQL. Inspect query plans with realistic consumed-token history. Do not use an EF in-memory provider as evidence for this protocol.
