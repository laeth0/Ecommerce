# Configuration, Deployment and Operations

**Status:** operating specification only. No Compose, executable configuration, secret, container, migration or application is created here.

## Local topology and versions

Run Commerce, Payments, two logical PostgreSQL18 databases on one server, existing supported pinned RabbitMQ, HTTPS edge and Phase08 OpenTelemetry Collector/Prometheus/Tempo/Loki/Grafana. Docker Compose is the existing local learning topology; Kubernetes/mesh/discovery/CD/HA remain later evidence-driven work.

Keep ASP.NET Core/EF Core/Npgsql10 and reviewed supported stable patches, pinned artifact digests, StripeSandbox account/API2026-09-30.endive and reviewed Stripe.NET version. Phase09 reviewed RabbitMQ4.3.6; recheck its support/vulnerabilities before implementation rather than assuming an earlier date guarantees current support. No silent runtime/dependency upgrades.

## Named Options and fail-closed validation

Use one named validated Options boundary per owner, injected into relevant infrastructure. Defaults in source are nonsecret; environment/deployment overrides supply endpoints/certificates/secrets. No scattered Environment reads.

| Owner/section | Required values/validation |
| --- | --- |
| Both Integration | Current paired runtime epoch UUID, supported protocol versions, recovery mode, explicit HTTPS peer addresses,2s total RPC; loopback/public arbitrary URLs rejected outside declared Development topology |
| Both ServiceCertificates | Trusted CA/issuer, allowed SAN identities/scopes, client/server secret references, EKUs/rotation/revocation/connection recycling |
| Both Database | Own database/least-privilege role, declared pool maxima and existing1s/250ms/2s/3s budgets; startup verifies target identity/schema |
| Commerce PaymentCoordination | Admission policy, registered descriptor UUID/fingerprint defaults, opaque assignments, command/hold/recovery ten observations and30s leases |
| Payments Provider | Original sandbox account/API/method descriptors, protected secret references, webhook signature rules, one-executor account limits and23-hour windows |
| Payments Confirmation | Durable hold enabled, finite barrier/pass≤20, no hold TTL, exact owner decision route |
| Both Messaging | Existing exchanges/routes plus new hint/parking queues, publisher confirms, TLS/grants, strict body/metadata limits |
| Both Observability | Stable service.name/environment/instance slot, bounded exporters, sensitive-field filters and original retention |
| Recovery | Paired backup schedule/manifest/authentication/deadline, owner credentials, current secret versions, maintenance gates |

Reject missing/invalid source/epoch/CA/peer, live provider mode, wrong currency/account/API, enlarged stock/retry horizon, unlimited queues/pools, unprotected Admin access and obsolete cross-database credentials. Production-style process startup cannot use the simulator or benchmark source flags.

Dispatch gate is independent from binding initialization: a closed dispatch gate permits recorded initialization/closure and receipt inspection while preventing external financial POST. Explicit refund/new-purchase admission gates still reject genuinely new instructions where configured. Known exact receipts remain replayable after gates close.

## Routing and health

Commerce owns all original public routes except exact POST /api/v1/payments/webhooks/stripe, routed to Payments' signed callback listener. Edge preserves exact raw bytes/header without transformation, applies original callback size/time limits and does not attach private-workload authority to public input. Unknown path/method uses original common protocol.

Private command/read/recovery paths use separate inaccessible mTLS listeners. Liveness reports process responsiveness; readiness verifies compatible artifact/config/epoch, own primary access and necessary lifecycle. Provider/broker/telemetry outage is a capability/admission/alert condition, not blanket process restart.

Commerce samples Payments capability at most once/5seconds per replica through its existing read RPC slots, with jitter and2-second bound. Known unsafe/unavailable or health age>10seconds closes derived StripeSandbox admission until a successful current check; an operator hold always takes precedence. Positive health is advisory and cannot replace remote admission/financial proof. Expose detailed capabilities only to protected operators; public health stays minimal.

## Independent releases

Each service owns its artifact, migration authority and release record. Compatible owner-internal changes can deploy independently. Validate supported route/schema versions before rollout; readiness fails incompatible combinations. Use protected maintenance/stop/migrate/start for database changes; one serial migration at a time across the shared server.

Contract changes follow consumer-before-producer rollout and retained version readers. No two services must import a shared mutable persistence assembly or migrate the other's tables. Artifact rollback continues using the authoritative postcutover Payments store and compatible protocol; never enable the sealed old financial database.

Payments executor singleton is account-scoped, separately fenced from API/relay availability. A failed/replaced process cannot overlap an old possibly active executor; use original persisted lease plus protected stop/egress evidence. Service independence does not imply independent external-account quotas.

## Startup/shutdown and daily checks

Startup order: protected database migrations/roles → broker topology → compatible services with gates closed → mTLS/schema/epoch/receipt checks → one executor and bounded workers → reviewed gates. A health endpoint alone cannot prove financial integrity.

Stop new claims and consumer delivery, stop admission, drain/cancel within15seconds, preserve work/key/window/holds and close channels/data sources. Worker I/O never holds database connections. Resume uses original claims/receipts; there is no “clear all pending” startup step.

Daily protected checks: backup age/decryption access, certificate horizon, unresolved commands/holds/review, outbox/parking age, financial scan coverage, C/S/R/case invariants, executor identity, disk/pools/replica budget and cross-database grant drift. Follow [alerts](observability-and-alerts.md), [failure behavior](../reliability-and-failure-scenarios/failure-behavior.md) and [restore](backup-and-restore.md).

## Protected operation contract

Require operator UUID, original target identity, expected work version, unique operation/request/authority IDs and normalized reason. Allowed actions are owner inspection, original resume/replay, reviewed descriptor setup/assignment, proof-based existing compensation repair and controlled gates/epochs. Keep immutable before/after/result/time audit. Active lease intervention conflicts.

Cross-owner operations have durable intent/result receipts at each owner. Unknown network result stays Pending; repeat original operation. No arbitrary balance update, rewrite receipt/source/fact, unconditional hold release, drop quarantine to open gates, new provider key for Unknown or automatic account repair.
