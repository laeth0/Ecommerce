# Identity Quality Targets

**Status:** proposed acceptance targets. No application performance, security, or concurrency result has been measured.

## 1. Measurement contract

Use PostgreSQL 18 with 10,000 synthetic users, 20,000 sessions, and 100,000 consumed refresh-token rows. Include active, revoked, idle-expired, and absolute-expired sessions. Keep scenario users below the five-session limit unless testing that limit. Reset to a recorded starting dataset between comparable runs.

Initial budget: application 2 vCPU/2 GiB; PostgreSQL 2 vCPU/4 GiB; generator outside both budgets. Record hardware/storage, platform versions, hasher parameters, connection settings, and observability overhead. For two replicas, keep the total application CPU/memory budget fixed when comparing efficiency; report increased total resources as a separate experiment.

Warm up for two minutes, measure ten minutes, repeat three times. Protected-read workload: 50 concurrent clients, one request in flight each and one second think time; include 90% `/users/me` and 10% allowed Admin user lookup, with enough distinct source networks and sessions to stay inside normal limits. Renew credentials through the real refresh flow before expiry. Report refresh work separately.

Password workload is separate: three login attempts per second, spread across at least 1,000 valid synthetic identities and sufficient known generator source addresses; mix 80% correct password, 10% wrong password, 10% nonexistent account. Revoke completed scenario sessions through their logout flow so session caps do not distort results. Register is measured in a separate low-rate run inside its limit. Rate-limit and overload experiments intentionally exceed the limits and are never folded into normal success statistics.

## 2. Requirements and acceptance evidence

| ID | Requirement | Pass condition |
| --- | --- | --- |
| ID-NFR-01 | Protected identity read latency | p50 ≤ 50 ms, p95 ≤ 150 ms, p99 ≤ 350 ms; at least 30 completed requests/second under the declared protected-read workload |
| ID-NFR-02 | Login latency with configured hashing | p50 ≤ 400 ms, p95 ≤ 800 ms, p99 ≤ 1,500 ms at three attempts/second; report actual hashing duration separately |
| ID-NFR-03 | Refresh/logout latency | p50 ≤ 75 ms, p95 ≤ 200 ms, p99 ≤ 500 ms at two operations/second spread across eligible sessions/sources |
| ID-NFR-04 | Registration latency | p95 ≤ 1,000 ms at a separately recorded admitted rate; identical contract for new and duplicate addresses |
| ID-NFR-05 | Unexpected normal-load failures | Less than 0.5%; no hidden exclusion of unexpected 429/503 responses or timeouts |
| ID-NFR-06 | Correctness and access control | Zero duplicate normalized accounts, double refresh success after settling, stale credential issuance after reset, unauthorized access, or cross-session revocation errors |
| ID-NFR-07 | Revocation visibility | A protected check beginning after revocation commit fails on every replica, with no cache delay; previously authorized in-flight reads follow the documented snapshot rule |
| ID-NFR-08 | Database/dependency failure | Protected operations and issuance fail closed within the ten-second deadline; no valid-looking success from an unknown commit |
| ID-NFR-09 | Cleanup progress | Eligible records are selected within 30 minutes under the documented bounded sandbox workload; failure/lag is visible; validity never depends on cleanup |
| ID-NFR-10 | Privacy | Captured application/edge logs, traces, metrics, audit, and errors contain no raw credentials, password verifiers, signing material, or raw email except the explicitly permitted API response fields |
| ID-NFR-11 | Configuration and compatibility | Invalid required settings prevent readiness; pinned versions build; API examples/schemas and generated SQL match this specification |
| ID-NFR-12 | Enumeration timing investigation | Under identical load, compare wrong-password and nonexistent-account p50/p95 across at least 1,000 attempts per class; investigate a relative difference above 20% before acceptance; this bound does not prove timing indistinguishability |

Each normal-load latency target must pass in every run with at least 1,000 samples for the reported class; extend measurement as needed. Registration's strict limit may require multiple hours for 1,000 samples: do not claim a percentile confidence based on a tiny sample or disable limits silently. Report its sample count and treat insufficient sampling as Not run for the percentile gate.

Exact status, role, expiry, replay, and password-reset rules are hard correctness requirements regardless of latency. Do not lower hashing cost, skip audit, cache stale authorization, or remove checks to meet targets.

## 3. Availability, recovery, and maintainability

The overall project's 99.9% availability objective is a future operating target. This phase has no 30-day observation period and makes no availability claim. Database unavailability intentionally prevents authentication/authorization; process liveness may remain healthy while dependency readiness is false.

Before declaring a recoverable sandbox increment, demonstrate a backup restore with RPO ≤24 hours and RTO ≤2 hours for the stated environment. Revoke all restored sessions before reopening access; a backup may reintroduce earlier credential state. The more complete restore/deployment exercises remain in phases 08 and 13.

Keep identity operations deterministic except for explicit clock, randomness, hashing, signing, and persistence boundaries. Use platform capabilities and small domain operations; no test-only abstractions or generic framework are required. SQL migrations and API/schema changes must be reviewed for compatibility rather than inferred from successful compilation.

## 4. System Design Prerequisites & Concepts to Learn

Study latency distributions, throughput versus concurrency, sample size, workload isolation, and resource contention. A fast average can hide slow tail requests and a high rejection rate. Measure completed authorized work and rejected work separately.

The design uses separate password and protected-read workloads because hashing and database-backed access checks have different bottlenecks. A single mixed average would hide one class behind the other. The cost is more than one benchmark; the benefit is evidence that can explain a change.

Experiment by increasing offered login load while holding hashing parameters/resources fixed. Record where rejection starts and whether read latency stays within bounds. No load tool, test fixture, or automated suite is created in this documentation phase.
