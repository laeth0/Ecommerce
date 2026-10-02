# Retry, Timeout and Circuit Breaker Policy

**Status:** normative Phase 11 scheduling overlay. Immutable commands, provider mutations, receipts, business deadlines and Phase 09 event bytes keep their original contracts.

## One retry owner per boundary

| Boundary | Owner and counting unit | Limit / recovery |
| --- | --- | --- |
| Commerce → Payments command/query recovery | Existing Checkout work/command coordinator; one charged network observation | Ten per cycle; original command and receipt lookup |
| Payments → Commerce terminal-decision recovery | Existing Payments executor/hold recovery; one charged network observation | Ten per cycle; original confirmation identity |
| Stripe mutation/retrieval recovery | Original financial work and durable account gate | Original Phase 07 ten-observation policy, first-send/window, quota and repair guards |
| RabbitMQ publication | Original owner's outbox relay; claimed publication attempt | Ten per cycle; same source/ID/bytes |
| Notification local completion | Existing delivery work; claimed sink attempt | Ten per cycle; original dedup/sink intent |
| Broker redelivery | Broker channel/queue delivery count | Existing delivery limit 20; parking and guarded intake |
| Local PostgreSQL transient rollback | Caller of the entire local transaction | At most one retry on 40P01/40001 after known rollback, within remaining deadline |

These are separate counters. A broker redelivery does not reset an outbox or financial cycle. A new HTTP request ID, process restart, duplicate callback/hint, unchanged owner poll or public replay cannot reset any budget.

Disable private HTTP automatic retries and hedging for GET and POST. Durable work decides whether and when to issue another observation; even read retries consume scarce slots. Stripe SDK automatic retries remain zero. Do not wrap a workflow, provider call and local transaction in one retry delegate.

## Time budget

Retain pool wait ≤1s, row-lock wait ≤250ms, DB command ≤2s, local transaction ≤3s, private RPC ≤2s, provider call ≤2s, broker confirm ≤2s, action/public request ≤10s, lease 30s and graceful drain ≤15s.

Each actual call is bounded by the smaller of its own ceiling and the remaining outer budget. Include admission, DNS, connection establishment, TLS, request/response buffering and cancellation handling in RPC measurement. Reused connections must still obey certificate rotation/peer validation.

Use a monotonic process timer for elapsed call/action timing; owner primary time for persisted due times, leases, cycles, stock decisions and financial window comparisons. A process clock cannot release stock or a hold. Detect material clock anomalies operationally; never rewrite historical first-send or decision times to make work eligible.

Request cancellation stops waiting. It does not reverse already committed owner work. Once public acceptance is committed, recovery belongs to durable work independently of the HTTP connection. Do not keep a transaction or pooled connection open during network I/O/backoff.

## Persisted bounded jitter

Profile identity is `rel11-equal-jitter-v1`. After unsuccessful charged attempts n=1..9:

```text
baseSeconds(n) = min(2^(n-1), 30)
lowerMilliseconds(n) = max(1000, baseSeconds(n) * 1000 / 2)
delayMilliseconds = uniform integer in [lowerMilliseconds, baseSeconds(n) * 1000]
dueAt = primaryTimeAtScheduling + delayMilliseconds
```

| Failed attempt n | Base seconds | Delay range in milliseconds |
| --- | ---: | ---: |
| 1 | 1 | 1000–1000 |
| 2 | 2 | 1000–2000 |
| 3 | 4 | 2000–4000 |
| 4 | 8 | 4000–8000 |
| 5 | 16 | 8000–16000 |
| 6–9 | 30 | 15000–30000 |

Sample once when the failure/due-time transaction commits. Persist profile, attempt, selected delay and due time. On transaction rollback there is no committed schedule; on retry/restart/restore a committed schedule is never resampled. Draws must not use a shared identical replica seed. This is load dispersion, not a cryptographic proof or a guarantee that due times differ.

The fixed base schedule has 151 seconds of retry waits before attempt ten. This profile's waits range from 76 to 151 seconds, with expected total 113.5 seconds. Action/queue/lease delays are additional. Shorter mean waits may raise offered load; account limits and [amplification checks](../performance-and-scalability/retry-amplification-and-recovery-capacity.md) remain mandatory. AWS explains why correlated retries need [backoff and jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/); the numeric profile above is this project's policy.

### Explicit Phase 09 compatibility

Phase 09 already permits **nonnegative jitter ≤20%** on its transport delays. Its stored due times may reflect up to 36 seconds for a 30-second base. Preserve those existing schedules. After the controlled Phase 11 activation, newly committed transport retry schedules use this profile with maximum 30 seconds. This is a scheduling overlay, not an event/schema change. No old writer may continue producing the legacy policy after activation.

Never modify a provider earliest-send/safe-until, reservation expiry, quote expiry, event occurrence time or original request bytes to fit jitter.

## Finite recovery even without network dispatch

Each activated asynchronous recovery cycle stores `cycleStartedAt` and `cycleDeadlineAt = cycleStartedAt + 300 seconds`. This implements finite visible exhaustion even when a breaker, quota, local slot or unavailable peer prevents ten observations. It is a work deadline, not a payment/hold deadline.

Start at the first scheduled cycle activation; preserve through deferral, restart and restore. Do not apply it to intentionally Idle/terminal work or invent a retry cycle for every retained scan. A proved new eligible owner fact or attributed allowed resume can start a new cycle; duplicate/hint-only/unchanged evidence cannot.

- Preflight an open circuit or missing local slot **before claiming** where possible; record bounded deferral and retain the cycle deadline. Such a deferral does not consume a network observation.
- Once a claim/count transaction committed, do not erase its attempt because no send occurred. A crashed claim consumed its budget; recover through lease rules.
- Every network observation must be charged before I/O, including a continuation inside an action. Known local steps can continue without a new network charge. No uncounted loop of receipt/evidence queries.
- Schedule no further send after ten charged observations or the deadline. Set ManualReview with bounded reason and retain original proof/coverage/hold. A known definitive result can still be applied safely; never discard committed owner truth just to satisfy a timer.
- The ordinary owner sweep uses existing pools and at most 20 candidates/pass. It marks expired unleased work for review. An active claim is fenced/cancelled under existing token rules; if its process is lost, expiry at 30 seconds bounds reclamation. No forced lease reset can imply that a provider call did not execute.
- Primary outage delays the sweep and alert delivery; report this delay as unavailable evidence. After recovery, overdue cycles are reviewed before new dispatch.

Persist finite scheduling/review reasons: BreakerOpen, LocalCapacity, PeerRateLimit, ProviderGate, DependencyUnavailable, DeadlineExhausted, AttemptExhausted, IntegrityBlocked. Work state transitions and a receipt result use the existing owner-specific enums; these reason codes are protected diagnostics.

Before-claim deferral stores a next eligibility check without changing the unsuccessful-attempt counter: open circuit uses its remaining cooldown clamped to1..30s; full local slots use the next bounded scheduler turn with at least1s delay; authenticated peer guidance follows the Retry-After rule below. Persist that due time, retain the original cycle deadline and do not repeatedly rewrite it on duplicate wake. Provider gate/retained scan timing continues to follow its original owner policy. These eligibility checks are not a new retry layer.

## Response and retry classification

| Observation | Classification | Action |
| --- | --- | --- |
| Exact authenticated known command receipt | Definitive owner result | Apply original result under local guards; do not resubmit changed intent |
| Domain Rejected result / known validation failure | Definitive business outcome | Follow original rejection policy; no transient retry |
| Definitive never-admitted VersionConflict on hold acquisition | New evidence needed | Original confirmation identity; successor immutable acquisition only after previous admission is known absent |
| Timeout, reset, cancellation after possible send, 5xx, invalid/truncated response | Unknown | Preserve IDs/coverage; original receipt query/recovery |
| Ordinary 429 | Transient rate/admission refusal; receipt knowledge still unresolved | Persist bounded backoff; no synchronous handler retry |
| Missing receipt/binding after restore | Integrity uncertainty | Paired-history review; 404 cannot prove no effect |
| Auth, mTLS, role, account, mode, epoch or canonical identity conflict | Security/integrity containment | Stop affected capability; alert and repair; no timer-based authorization |
| Broker publish timeout/return/negative confirm | Unpublished or unknown transport result | Same canonical event; dedup handles possible prior delivery |

Accept a private peer's `Retry-After` only if it is a single integer delta-seconds 1..30 on an authenticated 429/503. Persist next due no earlier than max(jitter delay, valid Retry-After); cap at 30 seconds and honor cycle/provider deadlines. A value outside that range is diagnostic invalid guidance, not an instruction to wait indefinitely or shorten identity safety. This phase generates no new public header/error contract.

## Private circuit breaker behavior

Three fixed classes: `CommercePaymentCommands`, `CommercePaymentReads` and `PaymentsCommerceDecisions`. The first includes coordinator command/receipt/evidence/hold recovery calls; the second includes public financial reads/history; the third contains Payments decision queries. Assign every supported route/caller explicitly at startup; no dynamic UUID/URL dictionary.

Initial profile:

| Setting | Required behavior |
| --- | --- |
| Closed sampling | Rolling 30-second window, at least ten actually dispatched completed calls |
| Open threshold | At least 50% counted failures |
| Counted failures | Connection/reset/timeout, ordinary 429, 5xx; malformed expected success response |
| Excluded outcomes | Valid 2xx/known domain rejection, normal domain conflict or missing record; local preflight rejection; caller cancellation before send |
| Security outcomes | TLS/identity/403/epoch/canonical conflict triggers separate containment; not ordinary breaker recovery |
| Open duration | 30 seconds using monotonic time; no call dispatch for that class |
| HalfOpen | Exactly one eligible actual operation, within normal slot/deadline/authority; others deferred/rejected |
| HalfOpen success | Valid response including known domain rejection closes circuit and clears sample window |
| HalfOpen transient failure | Reopen for 30 seconds |
| No eligible operation | Stay HalfOpen awaiting ordinary eligible work; do not fabricate a purchase or repeatedly health-probe |
| Storage | Process-local finite state only; restart begins Closed, existing durable budgets still apply |

A half-open command is the **already committed original command** or its original receipt/evidence query. Decision probes use an existing mapped decision ID. Do not dispatch synthetic POSTs, new provider objects or arbitrary GETs to make the circuit look healthy. A capabilities response does not prove every mutation path healthy; measure the actual affected class.

Open circuits return the established unavailable behavior for synchronous financial routes and persist deferral for durable work. They do not mark business work Rejected or return cached/zero money. A selected library must support these semantics without default retries/hedging; review its supported version and defaults at implementation time. Microsoft's [.NET HTTP resilience documentation](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience) is the primary reference for that review.

This breaker is distinct from the existing **durable Stripe account gate**: five transport/5xx failures in 60 seconds, 30-second cooldown, one permitted read-only probe, manual repair for auth/mode/account/integrity. Preserve that gate and its global quota. Do not add another provider circuit or multiply probe rate across replicas.

## Bulkheads and graceful shutdown

Retain two command/recovery RPC slots and two public financial-read slots per Commerce replica; Payments decision queries use two slots within its existing executor. No unbounded waiting queue. A full read class cannot take command slots.

Private breaker failures must not mark unrelated Commerce liveness unhealthy. Readiness uses local required primary/schema/epoch/identity configuration; report degraded remote capabilities separately. Shutdown stops new claims, cancels bounded I/O, lets safe local result commits finish within 15 seconds and leaves unknown in-flight work recoverable under the original lease.

REL-V06–16 and REL-V27–31 verify this policy. A successful breaker transition alone does not demonstrate payment correctness.
