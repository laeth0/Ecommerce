# Scalability Functional Requirements

All flows preserve existing customer/Admin APIs, primary authority, owner locks, idempotency and financial/stock state machines. New actors are authenticated measurement/recovery operators; they do not acquire business permission from a run plan.

## SCL-FR-01 — Declare a valid capacity plan

**Actor/trigger:** operator prepares an isolated benchmark.
**Preconditions:** Phase 11 dependent exit evidence reviewed; explicit environment/source/resources/data/quota fingerprint, original one-executor proof and recovery access.
**Flow:** choose reference/advanced/stress/data/conditional experiment; calculate core/auxiliary/source/actor/refresh rates; record complete plan and abort/reversal controls; validate available resource and operator authority outside JSON.
**Validation/errors:** unknown/unbounded plan, unsupported tier/source/route, unavailable host/resources or unsafe provider population → invalid/Not run; no implicit waiver.
**Consistency/result:** the plan is a protected evidence artifact, never a business mutation.
**Acceptance:** Given 1,000 sessions behind one effective source, When refresh arithmetic is evaluated, Then the plan cannot qualify as healthy; three verified groups and normal rotation are required.

## SCL-FR-02 — Execute controlled healthy user tiers

**Actor:** generator using ordinary anonymous/Customer contracts and current operator-approved environment.
**Preconditions:** original simulator source isolated, provider egress fenced, valid prepared accounts/carts/quotes/stock, compatible policy across replicas.
**Flow:** warm up, offer prescribed paced/closed workload, count all core/auxiliary work, run three declared windows, observe original owner results, stop/clean up safely.
**Rules:**≤ 1 in-flight/session, normal JWT/refresh, exact mix, unique canonical accepted key/quote, no skipped setup/version reads or invisible polling.
**Errors/edges:** generator saturation/drop/timeouts, missed mix, auth/quota failures and unfinished work retained; no capacity claim from successful subset.
**Acceptance:** Given an advanced tier, When its healthy goal is not met on declared hardware, Then report Failed/unreached with limiting resource rather than modifying quotas/resources mid-run.

## SCL-FR-03 — Measure data growth and tune queries

**Actor:** owner-authorized operator/engineer.
**Preconditions:** valid isolated D0/D1 data, protected source/grants, disk/backup/maintenance headroom.
**Flow:** capture existing plans/latency/write/WAL/maintenance cost, compare query/statistics/index changes one at a time and rerun full baseline.
**Rules:** primary visibility, ordering/keyset/page bounds, snapshots/audit and money/stock guards remain exact; no N+1/network under transaction.
**Errors/edges:** broad GIN sort, bad estimates, vacuum debt, heavy owner and inactive category cases included.
**Acceptance:** Given the 20,000-Order owner and deep cursor, When tuning is compared, Then report rows examined/buffers/query count and response equality, not index existence alone.

## SCL-FR-04 — Compare bounded horizontal scale

**Actor:** deployment/measurement operator.
**Preconditions:** one/two Commerce replicas, aggregate original resources and 48/79 pool inventory, compatible signing/epoch/configuration, one Payments process/executor.
**Flow:** compare same data/mix/resources, distribute requests without sticky session, observe durable work/quotas/claims and peak connections.
**Errors/edges:** duplicated pools/counters/worker ownership, overlap third process, stale epoch/lease/certificate fail gate.
**Acceptance:** Given two replicas, When the same public source exceeds its minute quota, Then total allowance remains shared; planned pools stay ≤ 80 and original idempotency works across replicas.

## SCL-FR-05 — Preserve stock under concentrated demand

**Actor:** ordinary Customers; operator sets authorized initial stock outside timing.
**Preconditions:** existing quotes/carts/keys, current visibility/prices, original sorted Inventory locks.
**Flow:** offer last-unit/small-batch/multi-product/duplicate/cart races; inspect original group/movement/order/receipt outcome.
**Rules:** whole units, no backorders/automatic restock/deadline extension; zero partial acceptance.
**Errors/edges:** lock/quote/version/stock/quota conflicts have original responses; uncertain commit uses original receipt.
**Acceptance:** Given stock 1 and 100 distinct eligible submissions, When they race, Then at most one active reservation is admitted and balance/movement history remains exact.

## SCL-FR-06 — Measure queue and recovery capacity

**Actor:** original relays/intake/local sink and authorized measurement operator.
**Preconditions:** frozen canonical event contracts, original pools/channels/limits/dedup, safe retained backlog.
**Flow:** measure mutation→event multiplicity, publication/intake/receipt rates, repeats/parking and net drain; compare existing one/two worker copies.
**Rules:** hints never grant money/Order permission; no ordering/route/source changes, extra provider executor or unbounded queue.
**Acceptance:** Given 125 useful coreRPS with 6.25 fresh submits/sec, When two lifecycle events/purchase are required, Then plan at least 12.5 distinct publication/sec and reject a claim of sustainability with one 10-attempt/sec relay.

## SCL-FR-07 — Review optional cache prototype

**Actor:** engineer/operator with narrow cache proposal authority.
**Preconditions:** existing cache gate evidenced, permitted data/race/security/resource/fallback/restore design and concrete experiment approved.
**Flow:** prototype versioned nonsecret materialization, current primary guard, trusted entry integrity and bounded miss fill; compare warm/cold/outage/restore behavior.
**Rules/errors:** no public stale visibility/price/authorization/money; malformed/old namespace entry misses; primary outage cannot use cache as permission; original 503 when bounded fallback unavailable.
**Acceptance:** Given category deactivation without product-version change, When a derived entry exists, Then the new primary statement hides the product. If no 2× primary-read projection survives guards, reject cache admission.

## SCL-FR-08 — Review optional standby reads

**Actor:** protected owner inspector; no new public route.
**Preconditions:** measured safe read volume, approved replication resources/security, current primary authority/mapping/fingerprint and known source/timeline/epoch.
**Flow:** capture conservative primary fence after observed commit; release primary resources; verify standby replay before fresh read snapshot; bounded immutable read plus fingerprint check.
**Rules/errors:** no Identity/current status/financial/stock/price/visibility routing, no promotion; lag/source mismatch/conflict → bounded primary fallback/unavailable.
**Acceptance:** Given a stale replica snapshot opened before replay, When later replay catches up, Then that old snapshot is not accepted; fence first and establish the permitted snapshot afterward.

## SCL-FR-09 — Review optional partition layout

**Actor:** owner migration/measurement operator.
**Preconditions:** demonstrated query/maintenance problem, isolated candidate with exact constraints/identity/grants and approved resource envelope.
**Flow:** compare actual unpartitioned and hash-line candidates, measure pruning/write/planning/backup; reject unsafe time-based identity change; if adoption justified, prepare one-writer compatible cutover.
**Rules/errors:** no new global-ID semantics, source-event duplication, evidence deletion, missing partition partial write or dual event producer.
**Acceptance:** Given an Orders id-only unique key, When a time partition proposal requires uniqueness only on(id, time), Then reject it pending explicit global-identity design; the original contract cannot silently change.

## SCL-FR-10 — Record supported capacity and recover safely

**Actor:** operator/reviewer.
**Preconditions:** complete accepted-work/source/provider inventory and required backup/restore access.
**Flow:** classify run Passed/Failed/Not run/Analytical, retain denominators/resources/cost/limits, contain unsafe change, recover original work and validate compatible rollback/paired restore.
**Rules:** no claim beyond measured workload; no restored proof from logs/cache/standby; original window/coverage/holds/epochs retained.
**Acceptance:** Given a fast HTTP tier whose retained scan or safe restore exceeds its objective, When capacity is reviewed, Then that data/topology growth is not admitted until the blocking evidence is resolved.
