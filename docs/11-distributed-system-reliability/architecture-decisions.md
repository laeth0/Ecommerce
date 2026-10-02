# Reliability Architecture Decisions

**Status:** accepted specification decisions. Policy constants are initial measurable settings, not observed capacity. The user approved persisted bounded jitter and deferred HTTP library selection.

## REL-ADR-01 — Deepen the existing coordinator

**Problem:** asynchronous financial work and multiple local commits expose unknown-result and compensation gaps.
**Current limit:** a single call/response view hides committed owner state and cannot explain recovery.
**Decision:** document and strengthen the Phase 10 coordinator, immutable commands, hold, terminal decision and original compensation case. Add narrow scheduling/inspection metadata.
**Alternatives:** a generic workflow engine adds persistence, deployment and migration obligations without a second workflow needing it; choreography would distribute the confirmation/refund race across consumers; 2PC cannot include Stripe and conflicts with independent ownership.
**Cost/failure modes:** conservative holds reduce availability; compensation can fail; the coordinator can be unavailable. Persisted owner proof and review keep these failures visible.
**Evidence:** REL-V01–05, 17–21, 32–38.

## REL-ADR-02 — Persist bounded jitter and finite cycles

**Problem:** identical retry timing creates correlated bursts; resampling after restart shifts accepted work indefinitely.
**Current limit:** Phase 10 financial retries use fixed delays; Phase 09 transport retries allow separate nonnegative jitter.
**Decision:** a versioned profile uses one persisted equal-jitter draw with a one-second floor and a 30-second backoff cap for newly scheduled retries. Keep ten claimed attempts/observations and a five-minute active recovery-cycle deadline. Existing stored due times remain intact.
**Alternatives:** no jitter leaves synchronized retry waves; unrestricted full jitter permits immediate repeated attempts; in-memory timers lose scheduling identity on restart.
**Cost/failure modes:** shorter average delays can raise request load. Account limits, existing slots, fair scheduling and measured amplification remain binding; jitter never extends stock/provider deadlines.
**Evidence:** REL-V06–11, 27–31. Exact formula and rollout are in [retry policy](reliability-and-failure-scenarios/retry-timeout-and-breaker-policy.md) and [database design](database/leases-recovery-and-integrity.md).

## REL-ADR-03 — Isolate private HTTP classes with finite process-local breakers

**Problem:** a failing peer consumes scarce slots while accepted work waits.
**Current limit:** deadlines and bulkheads bound individual calls but still allow repeated failing dispatch.
**Decision:** three fixed breaker classes; no dynamic payment/customer key. Define transitions, error classification and one half-open actual operation. Library choice stays open until implementation review. Durable command retries remain above the handler; automatic HTTP retries and hedging are disabled for all private methods.
**Alternatives:** a database/Redis breaker couples admission to another durable lock/dependency; a mesh changes infrastructure/scope; one global breaker mixes public reads with purchase recovery.
**Cost/failure modes:** process restart loses circuit history, sparse failures may not open it, and one class may fail while another is healthy. Existing durable deadlines, slots and review remain effective. A breaker cannot suppress identity/epoch/TLS incidents as ordinary transient faults.
**Evidence:** REL-V12–16, 27. Activation uses a declared profile and before/after measurements; counters are never a business gate.

## REL-ADR-04 — Keep the existing provider gate

**Problem:** an extra Stripe resilience layer can multiply SDK/worker retries and evade the single account budget.
**Decision:** retain the Phase 07 durable account gate, one executor, 5 calls/second, burst 2, concurrency 2, two-second calls and SDK automatic retries disabled. Private HTTP breakers do not wrap Stripe.
**Alternative/cost:** a new provider circuit would need shared state and could conflict with original first-send/window rules. Existing conservative containment requires operator repair for authentication/account/mode/integrity errors.
**Evidence:** REL-V13, 29, 32, 35.

## REL-ADR-05 — Resume original work through owner-local protected tools

**Problem:** blind operator reruns can allocate new refund keys, erase coverage or release a hold.
**Decision:** typed Inspect and ResumeOriginalWork operations, current operator authority, optimistic work version, immutable receipt/audit and owner lock rules. Reuse existing canonical event replay and proof-based failed-compensation repair contracts.
**Alternatives:** arbitrary SQL/state editors lack invariant validation; a public recovery endpoint adds an attack surface; a universal resume command would obscure owner-specific proof.
**Cost/failure modes:** correct repair may be slow; missing proof remains held. Audit failure rolls back scheduling; a resume receipt proves scheduling only.
**Evidence:** REL-V17–26.

## REL-ADR-06 — Use bounded controlled experiments

**Problem:** fault claims are weak without exact injection/commit boundaries and can damage sandbox financial history.
**Decision:** documented isolated manual process/network/broker/storage/debugger experiments with explicit reversal, stops and evidence. No new chaos platform, test adapter, executable fault scripts or fake verified facts are introduced.
**Alternatives:** uncontrolled live disruption or load-testing Stripe violates current budgets; unit-only simulation cannot prove actual transaction/transport behavior.
**Cost/failure modes:** environment-dependent fault facilities and genuine-provider samples limit statistical claims. Mark unexecuted experiments Not run.
**Evidence:** [catalog](testing-strategy/fault-experiment-catalog.md) and REL-V01–38; rollout/contract evidence additionally uses REL-V39–42.

## REL-ADR-07 — Preserve paired restore and conservative fencing

**Problem:** independently consistent snapshots can retain different decision/hold/provider knowledge.
**Decision:** preserve Phase 10 paired-v3 format and process epoch rules, include new scheduling/operation evidence and reconcile before reopening. Local circuit memory is discarded; it cannot supply restore permission.
**Alternatives:** restarting an old database copy, deleting unknown commands or assuming a timeout implies no capture can duplicate money or fulfillment. A global snapshot/HA product is outside this phase.
**Cost/failure modes:** RTO includes financial and authority reconciliation; missing accepted mappings can keep the merchant scope closed.
**Evidence:** REL-V36–38 and [restore](deployment-and-devops/backup-and-restore.md).
