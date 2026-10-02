# Workload Model, Quotas and Capacity Tiers

## Definitions and baseline

Registered Customers describe stored data. Active virtual users describe client sessions. Executing requests describe current resource occupancy. Offered RPS, admitted RPS and useful completed RPS are different counters.

Retain the [Phase 08 reference](../../08-production-ready-monolith/performance-and-scalability/baseline-and-capacity.md):10,000 published products/100 categories/10,000 Customers/100,000 historical Orders; 100 VUs, ≤ 1 in-flight/user, one-second think time; 65% Catalog detail/list,10% search,10% Cart,5% Order history,5% preview,5% submit. Simulator Success/100ms stays isolated Development and does not prove Payments capacity.

Use two-minute warm-up, ten-minute measurement, three runs; extend to ≥ 1,000 observations/class/run. Record generator saturation/dropped iterations, failures/timeouts, complete per-class p50/p95/p99, bytes, resource maxima, lock/pool/WAL work, scheduling/convergence and original invariant outcomes.

The original 100-VU reference remains a closed workload. Advanced tiers use a separately declared paced arrival schedule and live session roster. Do not change reference think time or silently compare an advanced arrival model to it.

## Quota arithmetic before load

Keep the [shared primary quotas](../../08-production-ready-monolith/functional-requirements/api-and-operating-contracts.md#shared-commerce-quotas), original Identity/financial limits and cross-replica policy agreement.

| Core class | Mix fraction | Global/sec ceiling | Single effective source/sec | Full-mix ceiling global /source |
| --- | ---: | ---: | ---: | ---: |
| catalog.read |0.65|200|100|307.69 /153.85 |
| catalog.search |0.10|30|15|300 /150 |
| cart.http |0.10|100|50|1,000 /500 |
| orders.http |0.05|50|30|1,000 /600 |
| checkout.preview |0.05|20|10|400 /200 |
| checkout.submit |0.05|20|10|400 /200 |

Full-mix arithmetic ceiling is therefore **300RPS global,150RPS from one source**, before actor limits, auxiliary traffic, window bursts, CPU or primary contention. These are policy ceilings, not supported performance. More replicas cannot raise them.

Count replay/no-op/failure attempts. Global→source→actor counters commit independently before authority/domain locks; earlier consumed allowance is not refunded. Fixed windows permit boundary bursts, so average pacing is not sufficient proof of instantaneous safety.

### Authentication at 1,000 sessions

Access tokens expire after 300s. Refresh one at a time per session on a staggered 240–270s schedule; use 240s for conservative capacity arithmetic:

- 1,000 sessions require about 250 refreshes/minute; original global 600/minute permits this mathematically.
- Per-source 120/minute would fail for one source. Use at least **three independently verified effective source groups**, each with≈333/334 sessions and ≤ 96 refreshes/minute planned headroom.
- IPv6 addresses in one/64 count as the same group. Never forge forwarded headers or vary an untrusted source field to evade limits.
- Login is 30/source/minute and 300 global/minute. Across three sources,1,000 sessions require at least 11.12 minutes of paced setup before warm-up; earlier sessions refresh normally while setup continues.
- Logout cleanup is paced under 600 global/120 per-source per minute. Include this cleanup and normal refresh/setup resource cost in the report.

The roster uses distinct eligible Customers with one session each; no altered token lifetime, cached authority or benchmark-only credentials. The synthetic data is prepared through reviewed isolated owner setup before measurement; no fixture/seeding code is created here and public registration quotas are not bypassed during a timed run.

## Executable learning tiers

Goals are to attempt with evidence, not promises that current hardware supports them. Retain original resources initially. A failed tier identifies the limiting factor; a larger approved envelope is a separate comparison.

| Tier | Active roster /arrival model | Core offered schedule | Useful target | Verified source groups |
| --- | --- | --- | --- | --- |
| Reference100 |100; original closed loop/1s think | Actual achieved offered rate, unmodified reference |≥ 50RPS plus all inherited targets |≥ 1 |
| Users250 |250; paced arrivals, ≤ 1 in-flight/session |90RPS upper offer |≥ 75RPS |≥ 1 with auth headroom |
| Users500 |500; same paced model |120RPS upper offer |≥ 100RPS |≥ 2 |
| Users1000 |1,000; same paced model |150RPS upper offer |≥ 125RPS |≥ 3 |

The advanced scheduler selects eligible sessions fairly, retains at least one-second per-session think floor and drops/counts an iteration that cannot start at its declared time; it cannot queue an unlimited hidden workload. At 150RPS across 1,000 sessions, mean core request gap is about 6.67s/session. This is 1,000 active sessions, not 1,000 simultaneous server requests.

Use the same six-class mix at each healthy tier. Preview/submit must pair each original stored quote/key; Cart preparation/version reads/changes count in its 10% budget. Healthy background work and simulator convergence stay within original targets. If the complete workflow cannot be generated within this mix, report invalid run or altered workload separately.

For a stable system, mean executing requests≈arrival rate×mean response time. At 150RPS and 0.2s mean, approximately 30 requests execute on average. This estimate does not bound tail concurrency or prove that the 200 two-replica execution slots/79 DB connections are sufficient.

Eligible traffic within quotas should have < 0.5% unexpected failures. Dropped generator iterations, client timeouts, valid 503 and unexpected 429 stay in the denominator. Deliberately offered over-quota stress is reported separately.

## Data growth tiers

| Dataset | Size and distribution | Purpose / qualification |
| --- | --- | --- |
| D0 | Original 10k products/100 categories/10k Customers/100k Orders | Repeatable reference |
| D1 |100k products/1k categories/100k Customers/1m Orders | Separate data-growth target with declared storage/backup headroom |
| D2 | Up to 1m products/10m Orders | Conditional isolated plan/maintenance experiment; no assumed admission |

Keep known heavy-owner 20,000 Orders, tied names/timestamps, broad/rare/empty searches, realistic descriptions,20-line Order boundary and unpublished/inactive categories. Declare skew: uniform comparison, then 80% of browsing on 1% of visible products, then a separate single-SKU purchase contention scenario.

Do not manufacture verified Stripe financial rows or payment/confirmation proof. Historical synthetic Orders use the approved isolated Development source/setup and valid owner invariants; genuine provider object population remains small and separately reported. Catalog/Order row counts do not imply equally large sandbox provider scan populations.

D1/D2 support plans/retention analysis independently of a user tier. Initially compare D0/D1 at Reference100 before attributing a latency difference to more clients. Disk/backup/scan gates can reject data growth even if an HTTP run passes.

## Stress and larger analytical scenarios

Run offered stress separately: declared 200/400RPS bursts ≤ 30s or a bounded 1,000-client simultaneous contention wave, with no genuine Stripe load. Above global/source ceilings,429 is an expected policy result; valid in-budget 503 still measures capacity loss. Preserve original state and no unbounded queues.

10,000/100,000 sessions are analytical until explicit capacity/resource/policy review:

- At 240s refresh,10k sessions need 2,500/minute and 100k need 25,000/minute, beyond global 600. Even source spreading cannot solve the global limit.
- At 100ms mean and 10kRPS, Little's Law suggests 1,000 average executing requests, far above the present one/two-replica envelope.
- Retained history, hot owner distribution, counter row service, session rotations, WAL, worker recovery and provider scan need separate estimates.
- Any future quota, topology, public identity or infrastructure change requires a concrete reviewed proposal; this phase does not silently authorize it.

## Required report

Record tier/model, core/auxiliary actual schedule, roster/source distribution, quotas, all data/resource/config fingerprints, class sample counts/complete latency, offered/admitted/useful/rejected/timeout/dropped counts, accepted work dispositions, scan/backup/cost and limiting resource. Use Passed/Failed/Not run/Analytical accurately.
