# Phase 11 — Distributed System Reliability

**Status:** documentation complete; implementation and experiment results are not supplied by these specifications.
**Scope:** Commerce, extracted Payments, their two logical PostgreSQL databases, existing RabbitMQ routes and the approved private sandbox.

## Objective and entry gate

Make the existing distributed purchase workflow explainable, bounded and recoverable under partial failure. Protect stock, money, authority and historical receipts before improving recovery speed. The concrete problems are ambiguous remote commits, correlated retries, stalled holds, worker ownership loss, broker interruption and asymmetric restore.

Implementation starts only after the [Phase 10 exit evidence](../10-microservices/phase-11-handoff.md) is reviewed. Missing extraction, grant, hold, migration or restore evidence stays **Not run**; reliability middleware cannot supply it. Read [prerequisites](system-design-prerequisites.md) before selecting an HTTP library or injecting a fault.

Approved Phase 11 choices:

- Persist bounded jitter while retaining ten observations per cycle, a 30-second maximum backoff and original financial identities.
- Specify private HTTP breaker behavior; select its library during implementation after checking the supported .NET 10 version and available dependencies.

## Scope and compatibility

Continue Payments-only extraction. Commerce owns stock, Orders and the terminal confirmation decision; Payments owns provider evidence, allocation, holds and financial facts. The 15-minute stock deadline, five-minute quote, USD cents, US-only shipping, USD 5.00 shipping and simulated 0% tax remain binding.

Retain private sandbox accounts, durable Commerce refund authorization, full/partial Admin refunds, original provider keys and the nonexpiring confirmation hold. Public APIs, private v1 envelopes, financial hints and Phase 09 notification bytes remain unchanged.

This phase adds scheduling metadata, private transport isolation, protected original-work recovery and documented experiments. It does not introduce another service, workflow engine, distributed lock product, cache, read replica, broker, live payment flow, public recovery API or physical high availability. Multi-currency, public identity hardening and new business features retain their previous phase boundaries.

## Reading map

| Concern | Specification |
| --- | --- |
| Architecture and alternatives | [System design](system-design.md), [decisions](architecture-decisions.md), [concepts](system-design-prerequisites.md) |
| Actors, flows and recovery | [Reliability workflows](functional-requirements/reliability-workflows.md), [protected contracts](functional-requirements/recovery-and-operating-contracts.md) |
| Event compatibility and poison handling | [Message contracts](functional-requirements/event-and-compatibility-contracts.md) |
| Measurable targets | [Quality targets](non-functional-requirements/quality-targets.md) |
| Timeouts, retry classification and breakers | [Transport policy](reliability-and-failure-scenarios/retry-timeout-and-breaker-policy.md) |
| Saga reasoning and financial races | [Workflow analysis](reliability-and-failure-scenarios/workflow-and-compensation-analysis.md) |
| Outages and failure disposition | [Failure matrix](reliability-and-failure-scenarios/failure-matrix.md) |
| Scheduling, locks, leases and rollout | [Database design](database/leases-recovery-and-integrity.md) |
| Amplification, fairness and capacity | [Capacity](performance-and-scalability/retry-amplification-and-recovery-capacity.md) |
| Threats and authority | [Security](security/threat-model-and-controls.md) |
| Fault setup and expected evidence | [Experiment catalog](testing-strategy/fault-experiment-catalog.md), [verification scenarios](testing-strategy/verification-scenarios.md) |
| Configuration, traces, response and restore | [Operations](deployment-and-devops/configuration-and-operations.md), [observability](deployment-and-devops/observability-and-alerts.md), [runbooks](deployment-and-devops/incident-and-recovery-runbooks.md), [restore](deployment-and-devops/backup-and-restore.md) |
| Exit and next-phase boundary | [Phase 12 handoff](phase-12-handoff.md) |

The testing-strategy documents specify later verification. They create no automated tests, fixtures, test projects or fault tools.

## Scrum work packages

Use dependency order, not an assumed fixed sprint length. Split a package into implementation tasks during sprint planning, after its concepts and acceptance criteria are understood.

| Epic | User/technical story | Acceptance criteria | Depends on |
| --- | --- | --- | --- |
| REL-E01: Owner proof | As an engineer, I can reconstruct one purchase from original owner decisions, receipts and facts | Demonstrate REL-V01–05; explain each commit/knowledge boundary and forbidden inference | Phase 10 exit |
| REL-E02: Finite recovery | As an operator, I can see accepted work reach a known result or attributed review | Persist due time/jitter/cycle deadline; ten-claim cap; REL-V06–11/39; zero identity/window resets | E01 |
| REL-E03: Dependency isolation | As a customer, I can browse while Payments is unavailable | Bounded timeouts/bulkheads, measured breaker transitions, separate security containment; REL-V12–16 | E02 |
| REL-E04: Original-work recovery | As an authorized operator, I can resume eligible work without creating a second purchase/refund | Original-ID resume, stale version/active lease rejection, atomic audit, no permission bypass; REL-V17–21/41 | E01, E02 |
| REL-E05: Message recovery | As an engineer, I can lose confirms, reorder hints and recover parking without changing business authority | Frozen canonical bytes, transactional intake, source validation, finite transport cycles; REL-V22–26/40 | E02, Phase 09 |
| REL-E06: Measured recovery | As an operator, I can distinguish outages, overload, uncertainty and exhausted work | Correlated bounded telemetry, fair service, complete denominators; REL-V27–31/42 | E02–05 |
| REL-E07: Fault and restore drills | As an engineer, I can reproduce each crash boundary and restore safely | Isolated bounded experiments, one executor, paired restore/epoch proof; REL-V32–38 | E01–06 |
| REL-E08: Learning exit | As a learner, I can defend safety/availability trade-offs with evidence | Explain failure matrix and capacity arithmetic; reviewed evidence index, failures/Not run explicit | E01–07 |

## Definition of Done

- Every functional requirement and quality target maps to reviewed verification evidence, with missing infrastructure explicitly identified.
- Original work, authority, money, stock and immutable event invariants survive every applicable fault and restore scenario.
- Scheduling and breaker rollout/rollback preserve existing accepted records; no hidden connection pool or layered retry remains.
- Local read/write boundaries, private scopes, epoch fencing, telemetry privacy and resource budgets have implementation evidence.
- Recovery timing includes queue/lock/pool wait and failure disposition; ManualReview is reported separately from success.
- An operator can contain, inspect, resume, prove progress and reopen using the runbooks without arbitrary state edits.
- No phase exit is inferred from a build, a successful 202, a broker confirm, a screenshot or documentation completion.
