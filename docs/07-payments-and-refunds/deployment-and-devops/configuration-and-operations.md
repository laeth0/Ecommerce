# Payments Configuration and Operations

**Status:** target operating contract. No application, account, credentials, migration, Compose, CI, deployment, dashboard or operator executable is created here.

## Topology and centrally validated Options

Reuse the modular monolith, primary PostgreSQL, existing HTTPS/proxy/Identity controls and .NET10/EF Core/Npgsql/PostgreSQL 18 baseline. Pin stable patches/images/SDK during implementation. The initial topology admits one outbound Payments executor withtwo action slots and a DB poolmaximumtwo. API replicas persist/read instructions; they do not call Stripe inline. Quiesce the old executor before enabling a replacement. Multiple outbound executors require the shared account permit design described in [capacity](../performance-and-scalability/capacity-and-provider-budgets.md).

| Options section/key | Safe default / phase value | Validation |
| --- | --- | --- |
| Existing `Checkout:PaymentMode` | Disabled / explicitly Sandbox after gates | Old accepted attempts retain their original mode/source |
| Existing `Checkout:Simulator:*` and `Orders:Verification:AllowSimulatedEvidence` | Existing false defaults | Explicit isolated Development only; never provider source conversion |
| `Payments:Admission:NewPurchaseEnabled` / `NewRefundEnabled` / `DispatchEnabled` | false / false / false | New instructions/dispatch require reviewed compatible flags and healthy durable account gates; exact receipts/reads unaffected |
| `Orders:Verification:AllowSandboxEvidence` | false | Enable only with reviewed Payments proof owner; no client control |
| `Payments:Stripe:AccountId` | Unset | Required approved sandbox account when source/admission/executor enabled; verify using protected read-only account probe |
| `Payments:Stripe:ApiVersion` |2026-09-30.endive | Exact pinned adapter version; immutable accepted binding |
| `Payments:Stripe:ApiKey` | Unset secret | Protected test/restricted-test credential; true livemode/live prefixes forbidden; account/scopes validated |
| `Payments:Stripe:DefaultFixture` | Success | Fixed approved code/token mapping; frozen at acceptance |
| `Payments:Stripe:HttpDeadlineSeconds` / `ResponseMaximumBytes` |2 /1048576 | Full DNS/connect/TLS/body/parse deadline; no redirect; no connection held |
| `Payments:Stripe:SafeRetryHours` / `AutomaticNetworkRetries` |23 /0 | Exact original window; SDK cannot bypass it |
| `Payments:Stripe:RequestsPerSecond` / `Burst` / `MaximumConcurrency` |5 /2 /2 | Shared account budget, includes probes/scan/operator calls |
| `Payments:Webhook:Enabled` |false | Enable for verified destination/secret/parser; disabled route returns503 when a valid configured delivery cannot be accepted |
| `Payments:Webhook:SigningSecrets` |Unset protected secret(s) | Destination-specific current plus reviewed previous overlap; no committed values |
| `Payments:Webhook:SignatureToleranceSeconds` / `MaximumBodyBytes` / `MaximumSignatureBytes` |300 /262144 /4096 | Exact raw-body protocol, explicit future tolerance |
| `Payments:Webhook:MaximumExecuting` / `MaximumDepth` |20 /32 | Inside shared API admission100; no unbounded buffering |
| `Payments:Worker:OutboundExecutorEnabled` |false | Exactlyone enabled instance in initial deployment; stop/start handoff |
| `Payments:Worker:MaximumConcurrency` / `PoolMaximum` / `PollSeconds` |2 /2 /1 | Financial/inbox/scan/wake tasks share fair bounded turns |
| `Payments:Worker:LeaseSeconds` / `ActionDeadlineSeconds` |30 /10 | Fence after final waits; I/O bounded independently |
| `Payments:Worker:MaximumObservations` / `BackoffMaximumSeconds` |10 /30 | Schedule1,2,4,8,16,30; Unknown never resets budget |
| `Payments:Worker:DiscoveryMaximum` / `ClaimPassMaximum` |100 /100 | One short claim per available action slot |
| `Payments:Reconciliation:CycleMaximumHours` / `PageMaximum` |24 /100 | Persisted scan position; dataset capacity must support full cycle |
| `Payments:ProviderHold:FailureThreshold` / `WindowSeconds` / `CooldownSeconds` |5 /60 /30 | Transport/5xx gate; auth/mode/integrity hold requires manual correction |
| `Payments:Api:BodyMaximumBytes` / `ViewMaximumBytes` / `ReceiptMaximumBytes` / `PageMaximumBytes` |4096 /4096 /1024 /65536 | Strict schemas/semantic limits |
| `Payments:Cursor:SigningKey` / `LifetimeSeconds` |Unset protected key /900 | Separate ≥32random bytes/shared across replicas; rotation≤15min overlap |
| `Payments:RateLimits:*` |Read120/actor/min,3000global/min;refund10/Admin/min,60global/min;verified callback 600/destination/min | Reuse primary-backed counter owner; counter secret separate from provider/cursor credentials |
| Existing monetary/checkout policies |USD/2,US,shipping500,taxSimulated0,quote300s,reservation900s | No separate monetary owner or silent policy change |

Defaults keep provider admission/dispatch/callback disabled. Historical financial reads and exact accepted replay use local primary evidence even when new admission is disabled. New refund acceptance follows its explicit gate; closing it does not discard accepted refunds. Existing pending operations require the original compatible adapter and credential account; unavailable recovery stays visible. Startup rejects contradictory flags, simulated evidence in normal mode, unsupported API/account/fixture/deadline/pool values and credential leakage.

Store nonsecret defaults in named appsettings sections. Protected runtime environment/secret injection overrides sensitive values; ASP.NET environment keys use section separators, for example `Payments__Stripe__ApiKey`, without a sample secret. No scattered environment reads. An operator runbook references secret names/version IDs rather than printing values. Freeze accepted account/version/fixture, not a credential value; same-account rotation does not rewrite financial identity.

## Admission, health and shutdown

Durable `payments.account_gates` plus validated Options determine new purchase/refund/dispatch admission. Source selection reads the gate; acceptance rechecks it with fresh database time before commit. Gate updates use separate short account-only transactions, never financial→Checkout locks. Provider 5xx/transport failure threshold opens a30s hold; one read-only probe after cooldown may reopen it. Auth/mode/account/integrity holds require operator correction. Retained callback evidence can still be ingested; held data is not discarded.

Reuse restricted `/health/live` and `/health/ready`,200 `{"status":"ok"}`,503 `{"status":"unavailable"}`. Liveness is responsiveness. Readiness validates primary probe≤1s, compatible schema/options and required local worker lifecycle; it never creates a charge/refund. Provider availability/admission is reported through internal metrics/gates; a transient provider outage does not eject all retail-read instances or cause restart loops. When purchase admission is configured on but required financial executor is absent, close purchase admission and expose the worker failure. Do not report financial readiness from only a healthy API process.

Existing primary/application clock drift>30s closes new issuance/purchase/dispatch until corrected. Signature freshness uses a synchronized runtime clock; reservation/lease/window decisions use primary DBtime. Stop new admission/claims, drain/cancel bounded calls/transactions within 15s, preserve committed keys/work and allow lease takeover. Planned executor handoff waits for completed/canceled≤2s calls before enabling the new executor. Never delete a Pending operation to accelerate shutdown.

## Operator fixture and recovery operations

The following exact approved fixture mapping is the initial allowlist; verify against the pinned account/API during implementation: Success→`pm_card_visa`,Decline→`pm_card_visa_chargeDeclined`,ActionRequired→`pm_card_authenticationRequired`,PendingRefund→`pm_card_pendingRefund`,RefundFailure→`pm_card_refundFail`. These are nonsecret provider test tokens from [Stripe testing documentation](https://docs.stripe.com/testing). Custom token/raw-card/real-customer assignment is prohibited.

Protected local operator tooling reuses existing environment privilege/attribution. Assignment is before acceptance and immutable; it does not use an ordinary Admin HTTP endpoint. Resume needs reason/requestUUID and original operation inspection, retains the original key/window/case. Failed compensation replacement additionally needs fresh current provider failure proof, held old allocation, no pending effect and unique repair UUID. Exact repair replay returns its original replacement; no direct SQL paid/status override is allowed.

Restricted incident inspection reports original local/provider IDs, mutation window, fact/correction history, balances/allocations and work state. Those identifiers are audit-only and are not copied into public logs or this documentation. Fix account balance while a refund is still Pending by continuing its original object; do not create another refund. A missing provider object ID after cutoff requires authenticated correlation/manual investigation, never an empty search or 404 no-capture shortcut.

## Secrets and rotation

Prove restricted test-key scopes/account identity with read-only setup and the small sandbox scenarios. API and signing credentials have different purposes. New API credential must retrieve retained original objects in the same account before activation. Rolling callback secrets permits a reviewed finite overlap; old secret expires no later than the provider destination's configured overlap. CLI/local forwarding gets its own secret/destination. Cursor key rotation uses its own15-minute policy. No secret appears in committed artifacts or diagnostic output.

On exposure, close affected admission/dispatch, revoke/rotate the compromised credential, inspect provider audit/activity, preserve all local identities/evidence and reconcile unexpected effects. Compromise of a callback secret cannot bypass account/object retrieval and Order/stock guards, but it is still an incident. Restore secret access from protected storage, not from restored application database/config dumps.

## Rollout, compatibility and CI requirements

1. Review additive Payments migration/immutable guards/unique indexes/grants and exact earlier integration changes: source binding at acceptance, Sandbox amount guard, evidence owner, preconfirmation-refund failure and wake.
2. Deploy schema with admission/dispatch disabled; keep old Simulator sources available through their original owner or explicitly quarantined. Validate FK/lock ordering in PostgreSQL.
3. Pin SDK/API/parser, configure sandbox credential/destination, run actual small provider/ingress/account/race scenarios and record unresolved gates. No auto-generated test fixtures/framework are required by this documentation increment.
4. Enable one executor/callback path and bounded recovery while new purchase/refund admission remains closed. Observe queue/fact/wake/scan accounting and strict source separation.
5. Enable approved new admission only when evidence gates pass. Compatible overlapping API replicas agree on schemas/source/fingerprints/version/lock/effect policies; outward executor handoff is stop/start initially.

Rollback closes affected new admission, drains the executor and deploys only a binary able to read/recover retained source/version/fact/receipt state. Preserve tables/keys/windows/proofs; no simulator backfill, dropping financial data or deleting ambiguous work. An older Phase06 binary cannot safely dispatch provider-backed attempts and therefore cannot reopen purchase/fulfillment without a compatible recovery owner.

Future CI performs established build/format/static/schema/secret/dependency/container checks and reviewed migration/rollback analysis. Execute existing relevant tests if present; new automated tests/projects/fixtures/mocks/frameworks require explicit user authorization. Secure container images run with least privilege and no diagnostic secret dumps. Actual deployment/CD/Kubernetes/broker manifests remain later scope.

## Observability and initial alerts

| Signal/SLI | Safe dimensions | Proposed threshold/action |
| --- | --- | --- |
| API ingress/financial read/refund acceptance latency and errors |Route template,method,status/outcome |Unexpected failures>1% for 5min/≥100requests: inspect primary/admission/schema |
| Provider call latency/timeout/429/5xx and call amplification |Operation,source,fixed status class |Five consecutive transport/5xx in60s: hold; sustained429>1min: inspect quota/scan/recovery demand |
| Due work/inbox oldest age and queue counts |Class,state,age/count |Healthy due age>15s for 1min: inspect executor slots/budget/DB waits |
| Acceptance→capture/refund and financial commit→Checkout convergence |Source,fixed outcome,distribution |p95 propagation>5s for 5min/≥100facts: inspect wake/Checkout and its locks |
| Unknown dispatch/window expiry |Mutation kind,count/age |Any Unknown>5min or remaining safe window<1h: investigate original object/key |
| Compensation failed hold/refund reversal |Origin,fixed outcome |Any new failed hold/reversal: inspect debt; no Order or automatic stock override |
| Integrity/quarantine/auth/mode/audit failure |Fixed code/kind |Any occurrence: hold affected admission, preserve facts and investigate |
| Wake_pending age |Source,count/age |Age>15s healthy: inspect postcommit wake/ack/version handling |
| Retained scan coverage/lag |Class,pages/objects/age |Cycle>24h: inspect quota/continuation/admitted dataset; reduce admission if needed |
| Resource pressure |Pool/operation,CPU/memory/count/duration |Saturation>2min: inspect plans and total connections before raising pools |

Record completed/offered rates, p50/p95/p99, DB/lock/pool duration, network body bytes, signature CPU, retry/lease/fence counts, imported external effects and ManualReview totals. No UUID/object/key/reason/customer label. Traces use server request correlation and bounded action spans without raw provider HTTP bodies/URLs/headers. Phase08 supplies complete telemetry exporters/dashboards/routing; thresholds here are proposed operating policy.

## Backups and integrated restore

Back up all owner schemas together: Identity revocation state, Orders snapshot/audit, Inventory balances/movements, Cart versions, Checkout keys/work, original simulator evidence and Payments bindings/mutations/facts/receipts/allocations/inbox/quarantine/audit. Encrypt/restrict backups. Preserve separate secure provider account/reconciliation access and operational backup timestamps so provider effects in the lost interval remain discoverable.

1. Hold **new purchasing, financial mutations and fulfillment**; restore a compatible schema/binary with original sources/windows intact. Revoke restored sessions per Identity procedure and require clients to reload/replay original keys.
2. Establish backup-to-recovery gap from recorded times plus clock margin. Authenticate the original sandbox account and enumerate PaymentIntents/Charges/refunds/events covering that complete interval, with paginated persisted continuation. Search alone does not prove absence.
3. Match immutable operation/attempt/Order metadata and keys to restored records. Record newly verified effects, keep unknown/unmatched objects quarantined and detect duplicated/missing mappings. Never recreate a missing accepted purchase or source from untrusted callback metadata alone.
4. Validate S/R/fact/correction/coverage, stock/Order/Checkout/Identity invariants and stale leases. Reconcile external Dashboard effects and prior refund reversals; preserve original safe windows, no reset.
5. Resume bounded original recovery and verify terminal/ManualReview outcomes. Reopen only the reviewed consistent scope; unresolved orphan or possible financial gap keeps affected purchasing/fulfillment held.

Sandbox targets RPO≤24h/RTO≤2h include reconciliation/authority/grants/source checks, not just DB recovery. Finite local RPO can lose provider-linked keys/evidence: zero financial loss is not claimed. An actual provider missing-local-record drill is required; simulated restore cannot establish that behavior. Later Phase13 strengthens backup/restore objectives separately.

## System Design Prerequisites & Concepts to Learn

Study secret/source lifecycle, financial admission versus API availability, durable account holds, safe executor handoff and external-ledger restore. Run the [verification scenarios](../testing-strategy/verification-scenarios.md) before enabling Sandbox; a configuration table or source build is insufficient evidence.
