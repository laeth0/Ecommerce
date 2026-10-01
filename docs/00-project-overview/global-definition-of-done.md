# Global Definition of Done

| Field | Value |
| --- | --- |
| Document | DOD-001 |
| Status | Draft quality baseline; targets are proposed, not measured results |
| Scope | Specification readiness, implementation evidence, operational readiness, and phase 00 completion |
| Related documents | [Scope](overview-and-learning-objectives.md), [Architecture and invariants](global-architecture-and-evolution.md), [Roadmap](phase-roadmap-and-scrum-plan.md) |

## 1. Meaning of completion

A document can be complete for its scope while the application remains unimplemented. An implementation can satisfy a local scenario while deployment, load, or recovery evidence remains unavailable. Each completion claim MUST state which kind of evidence supports it.

The Definition of Done applies to the increment being delivered and all affected existing behavior. In Scrum it describes the quality state required for an increment; it is not replaced by a document count or a successful demonstration of only the happy path. See the [Scrum Guide](https://scrumguides.org/scrum-guide.html#commitment-definition-of-done).

Use these evidence states consistently: **Passed**, **Failed**, **Not run**, and **Not applicable with reason**. A simulated dependency MUST be identified. A failed or unavailable required check leaves that completion gate open.

The current phase deliveries create documentation only. Testing expectations below define future evidence; they do not authorize creating test projects, fixtures, dependencies, or automated test files. Existing repository tests must be preserved and run where relevant. New tests require the project owner's explicit request under the repository instructions.

## 2. Specification readiness

Before a later domain specification is described as implementation-ready, all applicable items below MUST be satisfied.

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| SPEC-01 | Scope and actors are explicit | Every candidate capability is included, minimized, excluded, or deferred with a reason; no accidental auxiliary feature is introduced |
| SPEC-02 | Functional behavior is implementable without guessing | Each requirement has an ID, actor, preconditions, trigger, flow, business/validation rules, expected result, errors, edge cases, authorization, and consistency requirement |
| SPEC-03 | Every story and technical requirement has acceptance criteria | Given/When/Then scenarios or concrete assertions cover success, denial, invalid input, and relevant failure/concurrency paths |
| SPEC-04 | Public and internal contracts are complete | Exact API methods/paths, headers, schemas, status codes, errors, pagination, compatibility, and idempotency semantics are defined where applicable |
| SPEC-05 | Persistence matches behavior | Types, nullability, keys, constraints, indexes, ownership, isolation, concurrency protocol, migration, and retention are explicit |
| SPEC-06 | Lifecycles cannot conceal missing decisions | Each state/transition names its trigger, permitted actor, guard, effect, repeated-call behavior, and forbidden alternatives |
| SPEC-07 | Financial and inventory rules agree across documents | Refund bounds, stock conservation, cancellation, reservation expiry, unknown payment outcomes, and late success have consistent ownership and behavior |
| SPEC-08 | Non-functional requirements are measurable | Each target identifies operation, workload, dataset, resource budget, metric, window, success condition, and failure/degradation behavior |
| SPEC-09 | Major design decisions are reviewable | An ADR states problem/evidence, alternatives, choice, rationale, costs, failure modes, and verification experiment |
| SPEC-10 | Learning precedes implementation | The System Design Prerequisites & Concepts to Learn section explains each mechanism, its steps, study references, and hands-on failure experiment |
| SPEC-11 | Dependencies and unresolved decisions are controlled | No unresolved product, security, stack, or contract decision blocks the work being marked ready; later decisions have owners and deadlines |
| SPEC-12 | The document set remains consistent | Local links resolve, ownership is unique, examples match schemas, terms are defined, and no placeholder replaces an implementation decision |

The brief asks for RFC 7807 Problem Details. [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) supersedes RFC 7807. The [Phase 01 API contract](../01-identity-and-auth/functional-requirements/api-contracts.md) adopts RFC 9457 and defines its members/extensions; later domain contracts extend its error catalog explicitly.

For integration events, the owning phase must define the [CloudEvents envelope](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md), payload schema/version, producer/consumer ownership, ordering scope, deduplication identity, retry policy, retention, and replay procedure. Envelope conformance alone does not establish reliable processing.

## 3. Implementation completion

| ID | Required condition | Evidence |
| --- | --- | --- |
| IMPL-01 | Accepted behavior and affected earlier behavior are preserved | Requirement-to-scenario mapping with observed outcomes |
| IMPL-02 | Code follows selected repository conventions and domain boundaries | Focused diff review; no unrelated refactor, dependency change, or cross-owner table mutation |
| IMPL-03 | Supported tooling accepts the change | Actual build/compile, lint, formatting, type-check, and static-analysis results, as available for the selected stack |
| IMPL-04 | Real database behavior is exercised when persistence changes | PostgreSQL evidence for constraints, transactions, races, migration safety, and query behavior; an in-memory substitute is insufficient |
| IMPL-05 | Failure handling preserves invariants | Relevant timeout, cancellation, crash, duplicate, and dependency-outage scenarios leave valid durable state |
| IMPL-06 | Authorization and data handling match the threat model | Cross-customer denial, privileged operation checks, secret redaction, and input-boundary verification |
| IMPL-07 | External work is recoverable | Stable intent, duplicate protection, bounded retry, reconciliation, and visible escalation are exercised |
| IMPL-08 | Resource use is bounded | Reviewed limits for requests, pagination, database pools, queues, retries, worker concurrency, and shutdown |
| IMPL-09 | Diagnostics support the introduced behavior | Actionable logs/metrics and correlation, without sensitive payloads or unbounded metric labels |
| IMPL-10 | Documentation reflects delivered behavior | Contracts, ADRs, configuration, operating procedures, and known limitations agree with the implementation |

Where automation has not been authorized, record reproducible manual scenarios and the strongest available non-test checks. Do not call a scenario automated, repeatable under CI, or covered by regression tests unless that evidence exists. If a required reliability scenario cannot be adequately exercised, the gate remains open rather than being silently weakened.

## 4. Initial measurable quality targets

These are proposed learning acceptance targets, not industry guarantees or measured product capabilities. The owner may revise them before a benchmark starts, with a reason. Revising a target after a failed run does not turn that run into a pass.

### 4.1 Reference workload for phase 08

- **Dataset:** 10,000 published products, 100 categories, 10,000 synthetic customer accounts, and 100,000 historical orders. Use sufficient stock for the normal-load run; final-unit contention is a separate scenario.
- **Resources:** proposed starting envelope of 2 vCPU/2 GiB for application processes in aggregate and 2 vCPU/4 GiB for PostgreSQL. Record host details, storage, database settings, worker limits, observability overhead, and any additional component resources. Run the load generator outside these budgets.
- **Clients:** 100 concurrent virtual users, at most one in-flight request per user, with one second of think time between requests. Authenticate before measurement; measure login separately during identity verification.
- **Request mix:** 65% catalog detail/list reads, 10% catalog search, 10% cart operations, 5% order-history reads, 5% checkout previews and 5% checkout submissions. Each new submission explicitly accepts its own fresh preview quote and uses a unique purchase key; do not omit preview or cart-preparation traffic from reporting. Prepare sufficient eligible carts and replenish them within the declared cart-operation class. Complete/reconcile attempts through background processing.
- **Provider:** deterministic sandbox simulator with a configured 100 ms response delay and successful outcomes for the baseline. Real-provider latency and sandbox behavior are measured separately in phase 07; they are not represented by this simulator result.
- **Window:** two-minute warm-up followed by ten minutes of steady measurement, repeated three times. Report every run and include at least 1,000 observations per reported operation class; extend the run when necessary.
- **Reporting:** measure client-observed latency, achieved requests/second, unexpected errors/timeouts, response sizes, resource saturation, database waits/connections, and worker lag. Report cold-start behavior separately; do not silently remove slow requests.

| Operation or metric | Proposed target | Interpretation |
| --- | --- | --- |
| Catalog detail/list and order-history reads | p50 ≤ 100 ms; p95 ≤ 300 ms; p99 ≤ 750 ms | API response latency for bounded queries under the reference mix |
| Catalog search | p50 ≤ 150 ms; p95 ≤ 500 ms; p99 ≤ 1,000 ms | Basic catalog search; no frontend rendering time |
| Cart operations | p50 ≤ 150 ms; p95 ≤ 500 ms; p99 ≤ 1,000 ms | Includes persistence and authorization for valid requests |
| Checkout acceptance | p50 ≤ 250 ms; p95 ≤ 750 ms; p99 ≤ 1,500 ms | Time to durable accepted attempt/order reference; payment settlement is a separate metric |
| Completed request throughput | At least 50 requests/second | Together with the declared mix, latency, and error targets; not a pure read-only benchmark |
| Unexpected request failures/timeouts | Less than 0.5% | Deliberate business rejections are measured separately; expected success paths must actually succeed |
| Interactive database commands | p95 ≤ 100 ms per measured command | Includes database execution/lock wait; record pool wait and aggregate per-request database time separately |
| Internal purchase convergence with healthy simulator | p95 ≤ 5 seconds; p99 ≤ 15 seconds | From durable checkout acceptance to the expected confirmed or policy-defined terminal outcome |
| Routine background work once eligible | p95 ≤ 5 seconds; p99 ≤ 15 seconds | Applies to reservation cleanup and, from 09, notification processing under normal load |

All operation-class targets must hold in each reported reference run to claim a pass. Stock/money/authorization invariants have zero tolerated violations even if the latency and error targets pass. Expected business conflicts must be counted separately so an implementation cannot improve throughput by rejecting valid work.

### 4.2 Availability and recovery targets

| Target | Definition and measurement | First required evidence |
| --- | --- | --- |
| Critical API availability | Proposed 99.9% over a rolling 30-day observation window: successful or correctly handled eligible catalog, cart, order, and checkout requests divided by all eligible requests. Unexpected server failures, timeouts, and infrastructure rejection of valid in-budget requests count as unavailable. Invalid/unauthorized traffic is excluded and reported separately. | Operational objective in 08; sustained observation for an availability claim in 13 |
| Purchase outcome visibility | Every durably accepted attempt has an observable status; unresolved payment and compensation work is counted and alerted | 07, then repeated after architecture changes |
| Recoverable workflow progress | Proposed 99% of affected attempts reach a terminal or explicit alerted manual-review state within five minutes after dependencies recover, for a fault run of at most 100 affected attempts | 07 for payment recovery; 11 for distributed workflows |
| Development recovery | Proposed recovery point objective (RPO) ≤ 24 hours; recovery time objective (RTO) ≤ 2 hours | Isolated backup/restore drill in 08 |
| Later operating recovery | Proposed RPO ≤ 5 minutes; RTO ≤ 60 minutes for the declared failure scenario and topology | Backup/continuous-recovery and full service restore drills in 13 |

RPO is the maximum data-loss window; RTO is elapsed time to restore usable service. For the drill, measure RTO from declared service loss until required services pass health, invariant, and reconciliation checks. Restoring a database process alone does not end the timer. PostgreSQL's [continuous archiving and point-in-time recovery](https://www.postgresql.org/docs/current/continuous-archiving.html) is the study reference for tighter recovery objectives.

These finite RPO proposals allow some recent local records to be absent after a disaster restore. They MUST NOT be described as zero financial data loss. Recovery must reconcile sandbox provider operations against restored payment/order records and quarantine mismatches before normal processing resumes. A real-money rollout would require a separately accepted financial durability and recovery design.

An availability ratio alone does not prove customers can complete purchases: payment success, accepted-attempt age, and convergence are separate SLIs. Requests that return “pending” indefinitely cannot satisfy the workflow recovery gate.

## 5. Failure and concurrency evidence

Later specifications MUST translate these project-wide scenarios into exact expected states, errors, bounds, and recovery procedures.

| Scenario | Required invariant or observable outcome | Owning phases |
| --- | --- | --- |
| Two buyers contend for the last unit | At most one valid reservation; no negative availability | 03, 06, 12 |
| Concurrent cart/order updates | Explicit conflict policy; no silent lost update or forbidden transition | 04–06 |
| Duplicate checkout/payment/refund request | Stable logical outcome or documented conflict; no repeated business effect | 06–07 |
| Payment succeeds after timeout or reservation expiry | Record financial truth; fulfill only with committed stock; otherwise apply durable compensation policy | 06–07, 11 |
| PostgreSQL unavailable or transaction aborted | No claimed commit without durable evidence; no partial local transaction; bounded request failure | 01 onward |
| Deadlock or connection-pool exhaustion | Bounded wait/retry policy, visible diagnostics, preserved invariants | 03, 08, 12 |
| Worker or service crashes between steps | Durable work can be discovered and resumed; no reliance on process memory | 03, 07, 09–11 |
| Cache unavailable or stampeding misses | Authoritative truth is preserved; fallback/load shedding obeys a capacity budget | 08 and 12 when a cache exists |
| Provider unavailable or inconsistent callback | No invented financial outcome; safe retry/reconciliation and explicit escalation | 07, 11 |
| Broker unavailable or event publication interrupted | Committed publication intent remains discoverable; backlog and age are visible | 09 onward |
| Duplicate, delayed, or out-of-order event | No duplicate local effect or illegal state regression; stale-message behavior is explicit | 09–11 |
| Poison message or exhausted retry | Bounded retries; inspectable quarantine with a safe replay procedure | 09–11 |
| Search unavailable | Declared search failure/degradation; purchase validation cannot trust stale search data | 02; revisit in 12 if search is separated |
| Partial outage or queue backlog | Failure isolation, bounded admission, explicit recovery capacity and oldest-work alerts | 10–13 |
| Deployment during active work | Compatible versions, safe migrations, graceful shutdown, resumable work | Baseline deployment onward; full drill in 13 |

These are required evidence categories, not authorization to create an automated test suite now. The current task does not execute any of these application scenarios.

## 6. Operational completion

Before describing a selected topology as operationally demonstrated, it MUST have evidence for:

1. Reproducible startup, validated configuration, and documented resource limits.
2. Least-privilege runtime/deployment credentials; secret rotation and sensitive-data redaction.
3. Readiness, liveness, dependency deadlines, graceful shutdown, and admission/backpressure behavior appropriate to that topology.
4. Migration from the previous supported schema, compatibility during rollout, and recovery from migration failure.
5. Alerts with an owner, threshold, observation window, and actionable recovery procedure. Outbox age, payment uncertainty, and compensation failures require business-level signals.
6. Restoration into an isolated environment, followed by invariant checks, provider reconciliation, and safe worker/event replay.
7. Deployment and rollback drills that preserve persisted data and show what happens to in-flight requests.
8. Capacity reports that distinguish measured ceilings from goals and identify operating costs.

The absence of an actual hosting environment limits the claim to local or sandbox evidence. Local verification cannot establish a 30-day availability target, production network behavior, or real-money readiness.

## 7. Completion criteria for phase 00

Phase 00 documentation is ready for review when:

- The five files named in the project brief exist inside `docs/00-project-overview/` and have distinct responsibilities.
- The operating baseline reflects the confirmed one-merchant, one-location, one-currency, sandbox-payment scope.
- Every candidate domain is explicitly included, minimized, or excluded with a learning-based reason.
- Actors, data owners, trust boundaries, stock/money invariants, and architecture progression agree across files.
- All seven architecture stages map to the existing numbered folders; checkout/payment sequencing is explicit.
- The overview contains prerequisites, decision rationale, meaningful diagrams, measurable proposed targets, and acceptance evidence.
- Decisions that belong to later phases have named decision points and are not represented as accepted implementation contracts.
- Relative links and document structure have been checked; diagrams have been inspected, with rendering verification reported separately if performed.
- The original phase 00 delivery created no application code, test files, dependencies, deployment resources or later-phase content. Subsequent authorized specifications in phases 01–07 are separate deliveries; phase 00 review may update shared decisions and references as those specifications settle them.

Project-owner acceptance of the drafts and future implementation completion are separate from these documentation checks.
