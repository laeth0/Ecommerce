# Inventory Quality Targets

**Status:** proposed implementation acceptance targets. No load run, worker run, or PostgreSQL transaction has been executed by these documents.

## Measurement contract

Use the Phase 01/02 stack on PostgreSQL 18. Seed 10,000 Catalog products and their stock items, 100,000 historical reservation groups, and at least 200,000 movement rows. Include 1,000 Active groups with deadlines spread around the test window, including overdue groups for a separate backlog experiment. Give normal-load products sufficient available stock; final-unit contention is measured separately. Record the product popularity distribution, initial balances, indexes/statistics and reservation-line distribution so comparable runs use the same starting state.

Initial resource budget matches the project baseline: application processes 2 vCPU/2 GiB in aggregate; PostgreSQL 2 vCPU/4 GiB; generator outside both. Record storage, CPU, memory, connection budget, worker count, tracing overhead and PostgreSQL settings. Warm up two minutes, measure ten minutes and repeat three runs. Normal internal workload: 20 concurrent clients, at most one operation in flight per client, one second think time between cycles. Each cycle creates a unique intent and reserves one line 80% of the time or three distinct lines 20% of the time; after 100 ms, consume 90%, release 5%, and leave 5% for expiry. Admin adjustments run separately at two operations/second against products without concurrent reservation, with a mix of positive and safe negative deltas. Use real Identity Admin checks for that class. Keep normal business rejections low through sufficient stock and report them separately.

## Acceptance requirements

| ID | Requirement | Pass condition in each declared normal-load run |
| --- | --- | --- |
| STK-NFR-01 | New reservation latency | p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms; at least ten committed new reservations/second |
| STK-NFR-02 | Consume/release latency | p50 ≤100 ms, p95 ≤300 ms, p99 ≤750 ms across completed terminal commands; report Consume and Release samples separately |
| STK-NFR-03 | Admin adjustment latency | p95 ≤350 ms at two operations/second with full authorization, ledger write and durable receipt |
| STK-NFR-04 | Routine expiry progress | From database deadline to Expired commit: p95 ≤5 seconds and p99 ≤15 seconds for due groups under normal load; report queue age and count |
| STK-NFR-05 | Unexpected failures | <0.5% of valid normal-load attempts; include timeouts and 503s in the denominator, with expected stock/intent conflicts reported separately |
| STK-NFR-06 | Conservation | Zero negative available counts, oversold final units, partial reservation groups, double terminal movements, or materialized-balance/ledger discrepancies |
| STK-NFR-07 | Idempotency | Exactly one committed effect for a stable adjustment operation UUID or reservation intent; changed payload conflicts; terminal replay does not move stock |
| STK-NFR-08 | Recovery and authorization | Worker restart discovers due work; missing Identity/DB authority fails closed; Customer or disallowed-source Admin cannot adjust stock |
| STK-NFR-09 | Bounded work | No request takes more than 20 reservation lines; worker processes ≤100 groups per wake per replica and never holds locks during provider/network calls |
| STK-NFR-10 | Database command time | Under the normal workload, p95 ≤100 ms for single-item interactive database commands; record multi-line transaction time, lock wait and pool wait separately |

Every reported latency class requires at least 1,000 completed samples per run; extend runs when the 5% Release class or Admin adjustment class is undersampled. If a run has fewer samples, report its count and mark its percentile gate Not run. Measure client-observed latency separately from database and queue delay. Do not count a deliberate stock conflict as a successful reservation to reach throughput. Integrity gates have zero tolerated violations regardless of speed.

## Contention, availability and recovery

Run a separate 100-concurrent-attempt final-unit experiment against one available unit and a mixed-product atomicity experiment. Exactly one final-unit reservation may commit; every loser must have no stock effect. Under overload, bounded lock-wait rejection or 503 is acceptable only when reported, sanitized and reconciled; it is not counted in normal-load success. Compare one and two replicas within the same total resource budget.

The project's 99.9% availability goal is a later operating objective, not a Phase 03 claim. Database unavailability blocks stock truth, so no stale local counter can authorize reserve or consume. A recoverable sandbox needs an isolated backup/restore drill against the Phase 01 RPO ≤24 hours/RTO ≤2 hours target, including stock/ledger reconciliation and Identity session revocation. The broader 100-user mixed-workload and sustained-availability gates remain in later phases.

## System Design Prerequisites & Concepts to Learn

Study how hot-row contention changes tail latency, how worker lag differs from eligibility, and how sample size affects a percentile. Increase requests for one product while holding total resources fixed; record lock waits, timeouts, achieved reservations, and conservation. A high rejection rate cannot be hidden behind a low p95 of the few successful requests.
