# Phase 08 Verification Scenarios

**Status:** manual evidence and future coverage specification. No application, database, provider, benchmark, restore or automated test has been run by this documentation delivery. Do not create test files/projects, fixtures, mocks, frameworks or testing dependencies without the user's explicit request. Preserve/run existing relevant tests during later implementation where available.

## Evidence protocol

Each scenario records ID, artifact/config/schema/data fingerprint, source/topology, actor setup, time/resource window, exact action, observed status/owner facts, invariant result and evidence location. Use **Passed**, **Failed**, **Not run**, **Not applicable with reason**. Do not publish credentials, address-bearing dumps, raw keys/provider IDs or unrestricted audit in the repository. Protected inspection evidence stays outside diagnostic logs and source control.

PostgreSQL constraints, lock races, grants, migrations and pool behavior require real PostgreSQL. Actual Stripe account/signature/object/correction behavior requires small real sandbox probes; the deterministic simulator cannot verify it. Telemetry exporter/backend/retention behavior requires the selected deployed versions. Static documents/builds cannot substitute for those observations.

## MON-E1 — Baseline and capacity

### MON-V01 — Reference workload and reporting

**Given** the full [reference dataset/resources/mix](../performance-and-scalability/baseline-and-capacity.md#reference-benchmark), isolated Success/100ms source, safe token refresh and all Phase 08 quotas enabled, **when** three runs complete after warm-up and ≥1,000 samples/class, **then** every [latency/throughput/error target](../non-functional-requirements/quality-targets.md) is evaluated per run/class. Report all preview/cart/token-refresh/polling/observer traffic and source distinction. No deliberate quota bypass, slow-sample removal, read-only substitute or hidden setup traffic is permitted. No sustained required eligible-work backlog growth or invariant violation is allowed.

### MON-V02 — Plans, batching and write cost

**Given** representative shallow/deep/equal-time Catalog, Cart, Order and financial histories plus due-work states, **when** a measured slow path is tuned, **then** before/after normalized statistics/plans/buffers/lock/pool times identify the cause. Preserve current publication/privacy/ordering, compare adjacent mutation/worker cost and rerun the reference classes. Do not execute mutating plan analysis on ordinary retained financial data.

### MON-V03 — Actual pools and replica envelope

**Given** one and then two API replicas with recorded enabled workers, **when** all configured pools are exercised, **then** measured connections fit the 37/63 conservative planned maxima plus no undeclared clients, normal access stays ≤80 and reserved slots remain inaccessible to runtime. API module aliases do not create new 20-slot pools. Required-source calls retain one outbound executor. A third conservative replica is rejected by the declared budget rather than silently enabled.

### MON-V04 — Cache gate and scale claims

**Given** PostgreSQL-only current reads, **when** latency/resource evidence is reviewed, **then** each [cache gate](../performance-and-scalability/baseline-and-capacity.md#cache-admission-gate) is evaluated with a stated result. A failed baseline triggers tuning/analysis, not automatic Redis. Caches/replicas/search/partitioning are absent, and the report makes no 1,000+ concurrent-user or Stripe-load claim.

## MON-E2 — Diagnostics and privacy

### MON-V05 — Signal and cross-worker correlation

**Given** a request UUID, selected server trace and accepted diagnostic context, **when** a background worker restarts and resumes the original work, **then** logs map request UUID→trace ID and its new root links the stored context. Refund actions can link their accepted Admin context; maximum two links. Missing/unsampled/expired/invalid context does not affect receipt bytes, money/stock/version/lease or recovery. Original trusted context is not replaced by replay.

### MON-V06 — Collector/backend failure and retention

**Given** healthy business operations, **when** Collector, Prometheus, Tempo and Loki are stopped individually and queues/volumes pressured, **then** exports remain finite, asynchronous and observable; the primary flow/audit is unaffected. No backend outage becomes a retail readiness dependency. Verify 10% sampling, bounded 100% drill, metric-series cap, private ingestion, Loki label/metadata mapping, actual retention deletion and 70/80% storage behavior. Gaps/size-retention truncation are missing SLO evidence, not green zero.

### MON-V07 — Sensitive markers and access boundaries

**Given** synthetic markers in secrets, email/address/reason, query/body/header, SQL parameters and provider URL/response, **when** success/error/retry/export-failure paths run, **then** none of those markers occurs in SDK/Collector/edge/container/Prometheus/Tempo/Loki/Grafana output or committed artifacts. Server request/trace IDs are searchable metadata, never ID metric/index labels. Public access to health/metrics/OTLP/backends is denied; Grafana viewer credentials cannot edit dashboards or owner data.

## MON-E3 — Abuse, failures and invariant races

### MON-V08 — Two-replica quotas and errors

**Given** two replicas and one global/source/actor bucket, **when** simultaneous requests cross the allowance and minute boundary, **then** shared committed counters determine admission and new 429 bodies match all five Phase 08 Problem unions with correct Retry-After. Adjacent-window bursts still obey executing limits. Denials/no-ops/replays remain counted and a denied request causes no business effect. Missing/unavailable primary counters return 503 without local allowance. Verify counter locks are released before Identity/domain locks.

### MON-V09 — Authority, proxy and revocation races

**Given** Customer/Admin/private operator actors, **when** cross-owner/role, disabled/revoked/expired/restored sessions, forged forwarded IP and outside-network Admin requests run, **then** original denial/privacy semantics hold. Pause a human business write under a domain lock and race revocation; observed completion respects Identity shared authority locks and fresh post-wait checks. No trace/counter/dashboard credential grants business authority.

### MON-V10 — Primary/pool/slow-query outage

**Given** normal valid in-budget work, **when** primary loss, pool exhaustion, a slow query, lock timeout or deadlock occurs, **then** waits/request resources remain bounded, local failed transactions roll back and no unproved success appears. Readiness fails for primary while liveness remains responsive; no stale authority or invented financial source. Eligible infrastructure denial/timeouts count as availability failures. Original replay resolves any possibly committed receipt.

### MON-V11 — Crash around acceptance and claims

**Given** a fresh purchase/refund key, **when** the process exits before commit, after commit/before HTTP acknowledgement, after claim or before postcommit wake, **then** there is no partial accepted state, and committed intent/receipt/facts remain discoverable. Original replay returns the same body/Location; workers take over fenced leases, release claim transactions before ordered application and retain original source/key/window.

### MON-V12 — Worker fairness and bounded recovery

**Given** normal and outage-backlogged expiry/purchase/cancellation/compensation/cart-cleanup/financial-observation/wake/scan/cleanup work, **when** a class is slow or its worker restarts, **then** other required classes receive bounded fair turns. Measure eligibility/service rates/oldest age; stale workers cannot commit after fence/time/state changes. At ≤100 affected attempts, ≥99% legitimate terminal or explicitly alerted ManualReview within five minutes after dependencies recover. Old observations cannot continually reset retry budget.

### MON-V13 — Financial uncertainty and stock expiry

**Given** an original sandbox provider operation, **when** timeout/lost response/duplicate or delayed webhook occurs, **then** signed/account/object/currency/mode verification, deduplication and original 23-hour POST cutoff hold. Stock still expires at 15 minutes; any later success without eligible stock is recorded and compensated, never fulfilled. Provider outage does not restart/eject otherwise healthy reads. Actual calls obey the small probe/account budget.

### MON-V14 — Refund/cancellation/confirmation races

**Given** captured funds and active/consumed stock, **when** full/partial Admin refunds, cancellation, new confirmation and refund reversal compete, **then** fixed work/Order/Inventory/financial lock order and fresh finance guards decide the winner. A winning preconfirmation refund stops purchase and compensates remaining capture; after historical confirmation ordinary refunds leave lifecycle/stock unchanged. Net S/R and correction history remain valid; Unknown keeps its allocation, failed compensation stays held and only reviewed original-case repair resumes it.

### MON-V15 — Cart cleanup, callbacks and required audit

**Given** accepted purchases and valid/invalid callback traffic, **when** the cart changes before confirmation, raw signature/body work floods, or a mandatory audit insert fails, **then** newer cart edits are preserved, callbacks stay inside 20/shared-100 admission and parser budgets, and audit-dependent effects roll back. Duplicate hints cannot authorize money or fulfillment. Measure retained scan/wake service, including Idle/ManualReview records, rather than deleting them.

## MON-E4 — Release and database safety

### MON-V16 — Nullable schema/grants and old records

**Given** the previous schema/data and reviewed diagnostic additions, **when** migration SQL/grants and old/new binaries are exercised in real PostgreSQL, **then** all-null/valid complete context works, partial/zero/uppercase/short contexts fail, and old rows remain null without backfill. Runtime cannot DDL/overwrite immutable context. Existing FK/unique/financial CHECKs and owner guards remain intact; no trace-ID index or diagnostic FK is introduced.

### MON-V17 — Shutdown/executor handoff

**Given** committed accepted work and possibly sent provider calls, **when** shutdown/handoff begins, **then** no new claims/admission occur locally and bounded draining/cancellation completes within 15 seconds. Old executor cannot send before the new one is enabled. Uncertain financial outcomes retain original identity; termination is not no-capture proof. Normal startup/health cannot silently activate simulation or live money.

### MON-V18 — Migration interruption and rollback

**Given** an additive release/index/constraint change, **when** migration is interrupted or rollback attempted, **then** the protected plan records actual partial/invalid-index state and preserves keys/data/source versions. Review concurrent-index transaction constraints and lock duration. Strict 429 consumers precede quota activation. Incompatible binaries remain held; no data deletion/source conversion makes rollback succeed. Measure maintenance as downtime.

## MON-E5 — Backup and recovery

### MON-V19 — Backup completeness and manifest

**Given** all owner schemas and protected key/off-host material, **when** the 12-hour job completes, **then** one consistent whole-database archive, verified authenticated manifest/digest/table inventory and snapshot-consistent row counts exist off-host within 30 minutes. Credentials/plaintext are absent from argv/history/source/telemetry. Verify optional simulator schema, current role/grant/secret recovery and conservative snapshot time; job launch is not success.

### MON-V20 — Failed/old/corrupt recovery point

**Given** failed upload, corrupt archive/manifest, unavailable decryption key or stale point, **when** verification/restore selects it, **then** no usable-point claim is made; backup/age alert fires and ≥24-hour age fails the objective/holds affected new operations. Preserve the last genuinely usable backup. Time/size/digest/type/required-member and semantic manifest validation rejects invalid artifacts.

### MON-V21 — Integrated isolated restore

**Given** the declared full local dataset, bounded number of actual provider bindings and a complete backup, **when** loss is declared and isolated restore runs, **then** all owners/grants/keys/sources/invariants are checked, restored sessions revoked, primary statistics refreshed and public mutations/fulfillment held. Record actual RPO from conservative snapshot time and RTO through reconciled reopening. A database-only recovery fails this scenario.

### MON-V22 — Missing provider facts and older-object changes

**Given** capture/refund after the backup and a refund created earlier but reversed during the gap, **when** older local data is restored, **then** authenticated gap enumeration plus retained-mapping reconciliation finds both new effects and changed old objects. Missing binding/key/window stays quarantined; no Order fabricated from callback metadata, fresh POST window/key or search/404 no-capture shortcut. Preserve verified finance facts/holds and use original compensation rules. Small actual sandbox evidence is required.

### MON-V23 — Recovery reopening and time failure

**Given** a restored primary with unresolved orphan/incorrect mapping/unsupported adapter or unproved old-executor shutdown, **when** reopening is attempted, **then** affected purchase/financial mutation/fulfillment remains held with actionable evidence. ManualReview alone does not waive financial integrity. A safe restore >2 hours reports RTO Failed and keeps its hold; only reviewed consistent authority/source/grant/workflow/provider state permits reopening.

## Requirement coverage and completion

| Requirements | Evidence scenarios |
| --- | --- |
| FR-01/02, NFR-01–11,19–22,26 | V01–V04, V10, V12 |
| FR-03, NFR-23–25,28 | V05–V07 |
| FR-04/05, NFR-12/13/15–18/27/29 | V08–V15; sustained availability claim deferred to 13 |
| FR-06, NFR-20/21/29–32 | V16–V18 |
| FR-07, NFR-14/16/18/28/29 | V19–V23 |
| MON-I1–I7 and original stock/money/authority invariants | Cross-cutting zero-violation checks in every applicable scenario |

Implementation completion requires these applicable scenarios and the [global Definition of Done](../../00-project-overview/global-definition-of-done.md). Absence of runtime/database/provider/telemetry infrastructure is **Not run**, not permission to weaken correctness. The documentation increment may pass static links/schema/structure checks while all implementation evidence remains outstanding. Redis/broker/consumer/HA/PITR experiments are Not applicable in 08 with their later phase owner stated.
