# Monolith Operational Workflows

**Status:** implementation requirements. All stories inherit the existing owner contracts, identity checks, database clock, lock order and immutable receipt rules. Existing business behavior takes precedence over a diagnostic convenience.

## Actors and invariant ledger

Anonymous callers read eligible Catalog records. Customers operate their own carts, purchases and Orders. Restricted Admins use existing Catalog/Inventory/Order/refund permissions. An **operator** is an attributed local deployment/recovery actor with separate OS/database privilege; Admin HTTP does not confer operator authority. A performance analyst uses synthetic data and read-only diagnostics. No new public operator route exists.

| Invariant | Required behavior |
| --- | --- |
| MON-I1 | A failed request cannot claim an unproved commit. An acknowledged acceptance/refund receipt has durable owner state before response |
| MON-I2 | New Order confirmation requires actual eligible consumed stock, verified full capture and current financial guards; preconfirmation refunds stop that purchase |
| MON-I3 | Unknown money retains original identity, mutation window and refund reservation. Late success without stock creates compensation, never fulfillment |
| MON-I4 | Refund/correction truth is preserved; ordinary net successful refunds plus reservations cannot exceed capture. A refund does not restock or change a historically confirmed Order lifecycle |
| MON-I5 | Quotas, tracing, shutdown and tuning cannot bypass identity, optimistic versions, row locks, immutable snapshots or expiry |
| MON-I6 | Primary outage never permits a stale/replica/cache authorization or synthetic capture fallback |
| MON-I7 | Telemetry loss cannot lose durable business work. Audit failure still prevents operations whose owner contract requires audit |

## MON-E1 — Baseline and resources

### MON-FR-01 — Measure the complete purchase workload

- **Actor/preconditions:** analyst; phases 01–07 implemented, isolated Development, synthetic dataset, approved simulator flags, no Stripe load traffic.
- **Trigger:** candidate release needs capacity evidence.
- **Flow:** record patches/resources/settings; prepare the [reference dataset and mix](../performance-and-scalability/baseline-and-capacity.md#reference-benchmark); authenticate before timing; warm, measure three runs; preserve failed runs and all auxiliary traffic; collect class percentiles, useful throughput, pool/lock time and work convergence.
- **Rules/result:** report client acceptance separately from source settlement; the published count is 10,000, not a count containing hidden products. Each new submission has its own accepted quote/key. A result states its exact source and tested ceiling.
- **Errors/edges:** missing samples extends the run; unexpected rejection remains a failure; a stranded accepted attempt fails convergence. Conflicts and final-unit races run separately.
- **Authority/consistency:** no actual accounts/addresses; all priced/stock decisions retain owner transactions.
- **Acceptance:** Given the prescribed mix/resources, when each run reaches at least 1,000 observations per class, then every target passes independently or the report identifies the failed gate. Given simulator evidence, then the report makes no claim about Stripe capacity.

### MON-FR-02 — Tune a demonstrated database bottleneck

- **Actor/preconditions:** database engineer; bounded query inventory and baseline evidence.
- **Trigger:** a route misses its target or pool/lock pressure persists.
- **Flow:** separate pool wait, lock wait, execution and serialization; inspect normalized statistics and representative plans in an isolated dataset; fix batching/predicate/index/statistics issues; repeat the affected workload and shared reference run.
- **Rules/result:** preserve primary authority, visibility predicates, ordering/cursors, version checks and lock order. An index has measured benefit and recorded write/storage/backup cost. No cache or larger pool is a default fix.
- **Errors/edges:** `EXPLAIN ANALYZE` executes statements; mutating plans are restricted to isolated disposable data. An invalid concurrent index is inspected and safely cleaned before retry.
- **Authority/consistency:** migration identity performs DDL; runtime never does. Plans/SQL values are restricted diagnostic data.
- **Acceptance:** Given a slow query, when the change is proposed, then before/after evidence identifies the exact cause and checks adjacent write/worker paths; absent evidence leaves the change unaccepted.

## MON-E2 — Operational visibility

### MON-FR-03 — Explain slow or unfinished work

- **Actor/preconditions:** operator; telemetry endpoints restricted; required privacy filters and retention configured.
- **Trigger:** latency, pool or due-work alert.
- **Flow:** inspect route/outcome SLIs; compare pool/DB/lock timing; use server request UUID to find a trace; inspect linked worker traces or restricted owner audit; identify due time, lease, source hold and compensation state; apply the original owner's recovery procedure.
- **Rules/result:** metrics contain bounded labels; no Customer/Order/provider ID, raw URL, reason, secret or payload is exported. Trace context is diagnostic and never becomes a key or authorization claim.
- **Errors/edges:** unavailable exporter drops bounded diagnostics with a visible drop signal; primary evidence remains authoritative. Unsampled traces have a log/audit investigation path.
- **Authority/consistency:** read-only dashboards; restricted owner inspection for attributable facts; no dashboard button sets paid or changes state.
- **Acceptance:** Given a slowed database call, then operator evidence distinguishes connection wait from command time. Given a worker restart, then valid stored context supports a link and missing context creates a fresh trace without changing work outcome.

## MON-E3 — Failure and abuse protection

### MON-FR-04 — Enforce shared commerce limits

- **Actor/preconditions:** any retail caller; active Phase 08 error contracts and HMAC-backed primary counters.
- **Trigger:** a request reaches an enabled route class.
- **Flow:** apply transport/shape/resource admission and existing authority precedence; complete global, source and actor counter transactions in that order before owner locks; enforce the [quota table](api-and-operating-contracts.md#shared-commerce-quotas); perform normal owner flow only if admitted.
- **Rules/result:** limit exhaustion returns compatible 429/Retry-After; unavailable counters return 503. Source comes from trusted proxy normalization. Payments/Identity classes are not charged twice. Exact receipts remain subject to authority and quotas.
- **Errors/edges:** two API replicas share counters; NAT callers share a source bucket; malformed/unauthorized traffic remains bounded without revealing target existence. A quota rejection performs no business mutation.
- **Authority/consistency:** bearer validation derives actor; HMAC obscures counter identifiers; counter transactions never run under domain locks.
- **Acceptance:** Given two replicas at a bucket boundary, then accepted traffic cannot exceed the committed shared allowance. Given primary loss, then an in-memory allowance cannot admit a write. Given a full bucket, then retry uses the original key/version rather than creating a new purchase identity.

### MON-FR-05 — Bound worker failure and overload

- **Actor/preconditions:** owner workers/operator; original pools, leases and fair pass budgets.
- **Trigger:** backlog, source outage, process exit or overload.
- **Flow:** cap executing actions; claim and commit before ordered application; preserve original identities; return due work to persisted scheduling after bounded observation; alert old/ManualReview work; stop claims and drain on shutdown.
- **Rules/result:** 15-minute stock deadlines and 23-hour provider mutation windows are unchanged. Exactly one outbound Payments executor holds the account budget. All accepted work survives lost HTTP responses. Inventory expiry, financial observation/wake and cleanup receive independent fair turns.
- **Errors/edges:** telemetry/provider outage cannot block the API with remote I/O; expired leases fence late workers; terminal outcomes cannot regress; failed compensation stays held and visible.
- **Authority/consistency:** original owner transactions and post-wait time/lease checks; no operator direct-SQL repair.
- **Acceptance:** Given 100 affected attempts and dependency recovery, then at least 99 reach a legitimate terminal or alerted ManualReview outcome within five minutes. Given overload, then queues/connections remain bounded and acknowledged receipts still map to durable state.

## MON-E4 — Database and release safety

### MON-FR-06 — Release and roll back without losing accepted work

- **Actor/preconditions:** operator; reviewed compatible artifact/schema, protected configuration and original source adapters.
- **Trigger:** release, migration or configuration change.
- **Flow:** perform build/static/security review; inspect migration SQL and grants; use the [controlled maintenance sequence](../deployment-and-devops/configuration-and-operations.md#release-and-maintenance-sequence); migrate once under deployment authority; validate required schema/options; reopen only compatible processes.
- **Rules/result:** no promise of zero downtime in this phase. Rollback retains facts, counters, keys, source versions and original deadlines; a prior binary that cannot interpret them stays blocked.
- **Errors/edges:** migration lock timeout fails the release; partial restore/release is not ready; different configurations or overlapping payment executors stop admission.
- **Authority/consistency:** runtime has no DDL privilege; every operator action records protected release evidence and existing owner audit where applicable.
- **Acceptance:** Given accepted work at shutdown, then restart discovers it with original keys. Given an incompatible rollback binary, then purchase/fulfillment cannot reopen. Given failure midway through migration, then recorded state determines safe completion or compatible rollback before service resumes.

## MON-E5 — Recovery and evidence

### MON-FR-07 — Restore the monolith and reconcile external money

- **Actor/preconditions:** recovery operator; protected complete backup, manifest, current secrets and original Stripe account access outside the restored database.
- **Trigger:** isolated recovery drill or declared service loss.
- **Flow:** close public admission, stop/quiesce all provider senders; restore all owner schemas together in an isolated environment; validate grants/state; revoke restored sessions; enumerate the provider gap; reconcile or quarantine missing/mismatched operations; resume only safe original work; check health/invariants and timed objectives before reopening.
- **Rules/result:** RPO ≤24 hours, RTO ≤2 hours includes financial reconciliation, not just PostgreSQL startup. Never reset an unknown first-send time, recreate a missing purchase from webhook metadata or claim zero financial loss.
- **Errors/edges:** unknown orphan, incomplete provider enumeration, absent decryption secret, unsupported adapter or unproved executor shutdown prevents reopening affected purchase/fulfillment. Retain evidence rather than replacing money truth.
- **Authority/consistency:** separate recovery identity, encrypted off-host backup; no application Admin restore privilege.
- **Acceptance:** Given capture after the restored snapshot with a missing local binding, then it is found and held for reviewed resolution before admission. Given an unresolved gap at two hours, then RTO is Failed and the hold remains in place.

## Acceptance traceability

FR-01/02 → V01–V04; FR-03 → V05–V07; FR-04 → V08–V10; FR-05 → V11–V15; FR-06 → V16–V18; FR-07 → V19–V23 in the [verification plan](../testing-strategy/verification-scenarios.md). Numerical targets and security controls also have assertion-based acceptance there. Creating automated tests remains a separately authorized activity.
