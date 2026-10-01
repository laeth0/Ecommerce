# Checkout Configuration and Operations

**Status:** target operating contract for future implementation. Reuse the monolith/primary PostgreSQL topology; no Compose/CI/migration/application/operator executable is created by this increment.

## Runtime and validated Options

Use .NET/ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18; pin supported stable patches/packages/images during implementation. Bind named Options centrally and fail startup for unsupported combinations. Contract values must agree across replicas; the fixed sandbox pricing baseline is not silently environment-tunable.

| Section/key | Phase 06 baseline | Validation/meaning |
| --- | --- | --- |
| `Checkout:Quote:LifetimeSeconds` | 300 | Exact five-minute validity; database clock |
| `Checkout:Pricing:PolicyId` / `AllowedCountries` | sandbox-us-v1 / [US] | Exact supported baseline; reviewed policy version needed for change |
| `Checkout:Pricing:ShippingMinor` / `TaxMode` / `TaxBasisPoints` | 500 / Simulated / 0 | USD flat once per order and explicitly simulated zero tax |
| Existing `Catalog:Currency:Code` / `MinorUnits` | USD / 2 | Reuse one monetary configuration, not a second currency owner |
| Existing Inventory reservation lifetime | 900 seconds | Never extended by Checkout or unknown payment |
| `Checkout:RequestBodyMaximumBytes` / `QuoteResponseMaximumBytes` | 16384 / 65536 | Decoded UTF-8 limits; same schema/semantic validation across replicas |
| `Checkout:ReceiptMaximumBytes` / `AttemptResponseMaximumBytes` | 1024 / 4096 | Bounded snapshot/receipt projection |
| `Checkout:PaymentMode` | Disabled | Disabled admits no new purchase; Simulated needs explicit isolated Development; Sandbox reserved for verified Phase 07 |
| `Checkout:Simulator:Enabled` / `IsolatedDevelopment` | false / false | Both explicitly true only in permitted isolated Development; reject enabled normal deployment |
| Existing `Orders:Verification:AllowSimulatedEvidence` | false | Explicitly true only for the same isolated verification mode |
| `Checkout:Simulator:DefaultScenario` / `ResponseDelayMilliseconds` | Success / 100 | Freeze accepted scenario and source timing; fault overrides through protected operator assignment |
| `Checkout:Worker:PollSeconds` / `MaximumConcurrency` / `PoolMaximum` | 1 / 2 / 2 | One Checkout pool shared with source observation/quote cleanup |
| `Checkout:Worker:LeaseSeconds` / `ActionDeadlineSeconds` | 30 / 10 | Lease exceeds action deadline; fencing remains mandatory |
| `Checkout:Worker:MaximumObservations` / `MaximumBackoffSeconds` | 10 / 30 | Backoff 1,2,4,8,16,30; unknown does not reset it |
| `Checkout:Worker:DiscoveryMaximum` / `ClaimPassMaximum` | 100 / 100 | Bound cancellation/source discovery and claims per pass |
| `Checkout:FinancialCallDeadlineSeconds` | 2 | No connection/local lock across financial response wait |
| `Checkout:QuoteCleanup:UnusedRetentionHours` / `IntervalMinutes` | 24 / 15 | Eligible only after quote expiry plus retention; accepted quotes retained |
| `Checkout:QuoteCleanup:BatchMaximum` / `MaximumTransactions` | 100 / 10 | Independent cleanup budget/run |

Normal baseline defaults leave payment admission/simulation disabled. Disabled mode permits preview, historical GET and exact acceptance replay after authority; new acceptance fails Service.Unavailable before quote business checks. A Phase 06 demonstration selects Simulated and explicitly enables isolated Development/Orders permissions; startup rejects inconsistent flags or normal-deployment simulation. Sandbox admission is unavailable until Phase 07 exists. Existing historical records retain their source; no client/Admin toggle activates simulation. Disabled mode does not erase Scheduled work: source-dependent recovery is held visibly until its admissible source returns. The sandbox tax policy remains explicit independently of later provider mode.

No new financial secret, cursor key, cache/broker connection or carrier/tax credential exists in Phase 06. Use existing protected database/runtime/operator configuration and HTTPS/proxy/CORS/Identity settings. For an explicitly allowed browser origin, add `Idempotency-Key` to the shared request-header allowlist and expose `Location`, `Retry-After` and `X-Request-Id`; the default origin list stays empty. Phase 07 refund routes reuse that header policy. Do not commit example credentials or synthetic address-bearing dumps. API pool maximum 20/replica, admission 100, pool wait one second, lock wait 250 ms, statement two seconds, transaction three seconds, request ten seconds and shutdown 15 seconds remain inherited. Count every worker/replica and operator/migration/monitoring/recovery reserve against PostgreSQL capacity.

## Operator plans and work resume

Future protected local operator operations assign an immutable `(Customer, Idempotency-Key, scenario)` before acceptance, inspect bounded work/source/audit and resume original work after correction with a normalized reason/request ID. Use existing restricted operator execution/credentials; ordinary Admin HTTP has no such privilege. Assignment follows the [database serialization rule](../database/schema-and-transactions.md#simulator-owned-persistence): target Customer Identity user FOR UPDATE, ordinary accepted-key lookup, then immutable assignment insert only when the key is unaccepted. Acceptance holds that user's FOR SHARE lock before selecting the plan. An assignment waiting behind committed acceptance is rejected, including when acceptance used default Success. A duplicate assignment with different scenario conflicts. No operator operation sets paid, rewrites snapshot, substitutes a financial key or changes a terminal proof.

Resume uses the same fixed work-lock set/attempt order, appends Resume audit and clears the permitted retry/lease metadata for the inspected original work. No public resume endpoint or general SQL repair instruction is introduced. Correcting a real financial anomaly remains the financial owner's Phase 07 procedure, not a Checkout override.

## Migration, rollout and rollback

Review an additive EF migration for Checkout tables/indexes/grants and the explicitly isolated simulator schema. Existing Identity/Catalog/Inventory/Cart/Orders data needs no rewrite/backfill. Never migrate old PendingPayment Orders into fabricated Checkout/payment evidence; they remain explicitly earlier isolated verification records or require an operator-reviewed mapping plan. Validate null CHECK, JSON bounds, uniqueness, four-row completeness, FK lock interactions and actual narrow grants in PostgreSQL before admission.

Local startup reuses application/PostgreSQL Compose and existing expiry/Identity workers. The Checkout driver has bounded claims/action slots and shares its worker pool with source settlement, cancellation discovery and quote cleanup. All accepted work lives in PostgreSQL, not an in-memory channel. Source settlements commit before wake; provider work is absent. No new broker or scheduler framework is justified.

Enable purchase routes only after compatible schema, policy, worker and admissible source mode are ready. Overlapping replicas must agree on fingerprint/quote/receipt/lock/fence/retry semantics; changes require a compatible rollout. Rollback stops affected purchase/claims and deploys a compatible prior binary while retaining accepted rows, source evidence and keys. Do not drop Orders/attempts, clear identities or reinterpret simulated attempts as provider operations. Phase 07 introduction requires explicit source coexistence/quarantine and verified adapter admission.

## Health and shutdown

Reuse restricted `/health/live` and `/health/ready`, healthy 200 {"status":"ok"}, unhealthy 503 {"status":"unavailable"}; no secrets/versions/queue payload appear. Liveness is process responsiveness. Readiness validates required contract/mode/schema, one-second primary probe and required Checkout/Inventory worker lifecycle. When new purchase admission is enabled, its admissible source/Checkout worker is required; an explicitly Disabled admission mode does not pretend source-dependent work is running. No probe creates quotes, purchases, source proof or refunds. Database/config/source/worker failure closes affected purchase admission; backlog/manual review is a business alert rather than automatic liveness restart.

Shutdown stops admission/claims, allows bounded in-flight work within 15 seconds, cancels/rolls back uncommitted transactions and releases connections. Committed acceptance/source/work survives lost response. Do not delete a dispatched operation or falsely mark rollback to release a lease. A stopped worker's lease expires and another replica resumes with the original identity. Runtime/source clock drift uses the existing Identity readiness policy; database time remains authoritative for decisions.

## Operating signals

| Signal | Safe dimensions | Initial action |
| --- | --- | --- |
| Preview/acceptance/read latency/errors | Route template, method, bounded outcome/status | Unexpected errors >1% for five minutes/≥100 attempts: inspect admission/primary/schema |
| Accepted purchase convergence | Payment mode, bounded outcome; age distribution | p95 >5 seconds for five minutes/≥100 acceptances: inspect work slots/source/pools |
| Due work/oldest age/expired leases | Work kind, state, counts/durations | Healthy due age >15 seconds for one minute: inspect worker, claims and resource order |
| Unknown payment/cancellation | Aggregate count/age only | Any age >five minutes: inspect original source and stock; do not invent failure |
| ManualReview/compensation failure | Work kind, fixed error | Any new occurrence: operator investigation; retain source/key and fulfillment block |
| Duplicate/conflict/lease-fence rejection | Fixed operation/result | Distinguish safe business conflict from unexpected accepted-work failure |
| Integrity/audit failure | Fixed invariant/audit kind | Any occurrence: hold affected admission/work until inspected; no automatic repair |
| Quote cleanup/source observation lag | Class, eligible count/oldest age | Cleanup age >25 hours or healthy source due age >15 seconds: inspect independent pass budgets |
| Pool/lock/statement/transaction pressure | Module/operation/result/duration | Sustained saturation >two minutes: inspect plans, total connections and waits |

Structured logs/traces use server request correlation, route template, bounded action/outcome/state, retry count and duration; omit raw keys/IDs/URLs, lease tokens, bodies/addresses/names/SKU, reasons, credentials and financial payload. Metrics omit UUIDs/raw versions/unbounded labels. Restricted audit/source inspection provides attributable identifiers. Phase 08 develops full telemetry collection/dashboards/alert routing; these initial thresholds are proposed, not observed SLO evidence.

## Backups and restore

Back up all owner schemas together, including accepted keys, used quotes, work/audit and simulator proofs/plans. Protect address data and restrict export/migration/operator credentials. Isolated sandbox drill targets existing RPO ≤24 hours/RTO ≤two hours. Hold purchase/fulfillment admission, restore compatible schema/application/source mode, revoke restored sessions, inspect canonical/mapping/audit/stock/source/work invariants, identify recent missing identities, resume bounded work and force clients to reload/replay original keys.

Phase 07 adds provider reconciliation/quarantine before integrated purchase/fulfillment reopens; finite local RPO cannot prove zero financial loss. A restored simulated record remains synthetic. Successful database startup or a resumed worker cannot establish capture/refund safety without its owner's evidence.

## System Design Prerequisites & Concepts to Learn

Study source-mode validation, durable scheduling, additive rollout, least privilege and acknowledgement loss during shutdown/restore. Exercise the [verification plan](../testing-strategy/verification-scenarios.md) when infrastructure exists; Markdown and reviewed DDL cannot establish runtime recovery.
