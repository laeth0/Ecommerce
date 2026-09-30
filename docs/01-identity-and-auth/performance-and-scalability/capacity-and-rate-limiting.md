# Identity Capacity and Rate Limiting

**Status:** proposed bounded baseline. Limits are project policies that must be measured; no throughput result has been obtained.

## 1. System Design Prerequisites & Concepts to Learn

Study fixed-window admission, hash-work saturation, database connection pools, hot counter rows, and B-tree access paths. A request can spend most of its time waiting for a resource even when its individual query is fast.

The concrete problem is expensive password work and unbounded credential/history growth. Shared PostgreSQL counters enforce the same limits across replicas; a local semaphore bounds the CPU work inside each process. A local-only request limit would multiply effective allowance when replicas are added. Redis is deferred because PostgreSQL already exists and this phase's scale does not justify another dependency.

The costs are extra writes and contention on shared counters. Fixed windows permit a burst on either side of a boundary; the hash-work cap remains in force. Compare observed waits against the simple design before choosing a more complex distributed limiter.

## 2. Admission policy

Evaluate limits after bounded input validation and before expensive work. Every applicable limit must allow the request. “Per email” uses the normalized input even when no account exists. “Source” means the validated effective client address. IPv4 uses its full address; IPv6 uses its /64 prefix to constrain trivial address rotation.

| Route class | Global limit | Per source | Per identifier/session |
| --- | --- | --- | --- |
| Register | 60/hour | 5/hour | 3/hour per normalized email |
| Login | 300/minute | 30/minute | 5/minute per normalized email |
| Refresh | 600/minute | 120/minute | 2/minute per discovered session |
| Logout | 600/minute | 120/minute | No session-specific limit beyond these; revocation remains cheap |
| Protected identity reads | No application-wide counter | 600/minute | 120/minute per eligible session |

Count admitted attempts, including incorrect credentials. Unknown refresh credentials still consume global/source allowance. Session-specific counters are accessed only after resolving a credential/session; rejection remains generic. The per-session refresh limit also bounds retained history: at most 40,320 admitted rotations during a 14-day session, plus a boundary allowance. Actual clients normally refresh near access expiry. Capacity planning must account for retained history rather than only the five active session rows.

Use HMAC-SHA256 over `scope + canonical bucket identity` with a dedicated shared secret to generate `bucket_hash`. Do not store raw email/IP in counters or expose bucket hashes as metric labels. Global buckets use a fixed scope-specific identity. All replicas must share this secret; rotating it resets rate history and requires a controlled operational decision.

### Atomic fixed-window algorithm

1. Obtain database wall-clock time. Calculate the UTC minute/hour boundary for that policy and its end.
2. For the global bucket, then source bucket, then identifier/session bucket, atomically insert or increment the row with `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING attempts`. Clamp stored attempts at `limit + 1` to avoid overflow.
3. Each stage commits its admission counter before proceeding. If a stage exceeds its limit, commit that counter and return `429`; do not undo consumed allowance in earlier stages. Never acquire user/session locks while holding these counter transactions.
4. Return `Retry-After` to the rejecting window end. If multiple rejecting windows are evaluated, return the longest remaining delay. No waiting queue is created for rejected requests.

SQL arguments must be bound parameters and scope names must come from server policy. Database failure returns `503`; there is no unlimited local fallback. The global/source stages run first to bound creation of attacker-controlled identifier rows. Failed authentication does not create user or session rows.

## 3. Resource budgets

| Resource | Initial limit | Behavior at limit |
| --- | --- | --- |
| Password hash/verification per replica | 2 concurrent operations, zero queued waiters | Immediate `503 Service.Unavailable`, `Retry-After: 1` |
| API requests executing per replica | 100, bounded by server middleware | Excess work receives `503`; no unbounded application queue |
| API database pool | Maximum 20 connections per replica | Pool wait at most 1 second, then `503` |
| Cleanup database pool | Maximum 2 connections per worker process | Skip failed run and alert persistent failures |
| Database lock wait | 250 ms | Known aborted attempt follows bounded transaction retry policy |
| Database statement time | 2 seconds | Cancel statement and roll back the owning transaction |
| Identity transaction wall time | 3 seconds | Cancel/rollback, report known versus uncertain commit outcome |
| API request deadline | 10 seconds | Stop remaining work; do not undo an already committed operation |

The host's connection budget must cover all replicas plus migration, operator, cleanup, monitoring, and a recovery reserve. Increasing replicas without changing the budget can overload PostgreSQL. Configure cancellation through the HTTP, hashing admission, and database paths; cryptographic work already executing may finish, but its slot remains occupied until it actually stops.

## 4. Queries and scaling decisions

Normalized-email and token-digest uniqueness indexes support credential lookup. Session user/expiry indexes support active-session counting. Protected reads use the session and user primary keys. Do not load all token history to decide whether one token is valid.

Use `EXPLAIN (ANALYZE, BUFFERS)` with synthetic data for protected-state lookup, login lookup, active-session count, token lookup, and cleanup selection. Record rows examined, time, buffers, and lock/pool waits. [PostgreSQL EXPLAIN guidance](https://www.postgresql.org/docs/current/using-explain.html) explains how to inspect plans; avoid executing modifying ANALYZE statements against valuable data.

No session cache, replica read, or last-seen write is used on every request. The primary-state read preserves the revocation contract. Add caching or read replicas only after a new ADR defines how stale authorization is prevented or bounded.

## 5. Learning experiments and acceptance

Run the same credential burst against one and two replicas: database admission totals must not double. Run wrong-password requests while measuring protected reads: hash admission must contain the impact. Grow consumed refresh history and inspect lookup/cleanup plans. Record the limiting resource before proposing Redis, more replicas, or a different hash implementation.

The [quality targets](../non-functional-requirements/quality-targets.md) define the measurement workload; [verification scenarios](../testing-strategy/verification-scenarios.md) define pass/fail evidence. Limits must not be raised silently to make a benchmark pass.
