# Monolith Configuration and Operations

**Status:** operating specification for future implementation. No application configuration, Compose file, container, pipeline, operator executable or hosted deployment is created here. Inherit [Identity operations](../../01-identity-and-auth/deployment-and-devops/configuration-and-operations.md), [Checkout operations](../../06-checkout/deployment-and-devops/configuration-and-operations.md) and [Payments operations](../../07-payments-and-refunds/deployment-and-devops/configuration-and-operations.md).

## Topology and scope

Start with one modular-monolith process and one PostgreSQL primary, including the existing bounded workers. A two-API-replica verification increment divides the same aggregate application resource budget, preserves shared counters/authority and enables exactly one outbound Payments executor. No broker, Redis, replica, Kubernetes or automated HA provider failover is introduced.

Use .NET/ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18 with supported stable patches pinned during implementation. Pin compatible stable OpenTelemetry/Collector, Prometheus, Tempo, Loki and Grafana versions. Select monolithic local Tempo/Loki modes without a new broker dependency. Their storage topology demonstrates private sandbox operations; it does not establish HA diagnostics or sustained production availability.

Compose may later start this private environment reproducibly with declared ports, health checks, volumes, resource limits and protected secret injection. Only the HTTPS retail edge is available to sandbox clients. PostgreSQL, management, OTLP and telemetry ingestion/query backends have private ingress; Grafana has separate restricted operator authentication. Do not mount a Docker socket into application or diagnostic containers.

## Central validated configuration

Bind named Options once through the existing configuration boundary. Secret injection uses protected runtime facilities and nested environment separators, such as `Observability__Otlp__Endpoint`; no secret value example or effective-config dump is allowed. Module owners retain their existing sections; Phase 08 must not introduce a second currency/payment-source owner.

| Section/key or operating setting | Initial baseline / safe default | Required validation |
| --- | --- | --- |
| Existing Identity/Catalog/Inventory/Cart/Orders/Checkout/Payments options | Existing values and disabled financial defaults | Original authority, money, deadline, parser/source and body/response limits remain unchanged |
| `Monolith:Admission:MaximumExecuting` | 100/replica | Shared executing bound includes callbacks; no unbounded queue |
| Existing shared API pool maximum | 20/replica | One compatible API data source across module aliases; no separate 20-slot pool per module |
| Existing timeout/shutdown settings | Pool 1s, lock 250ms, command 2s, transaction 3s, request 10s, shutdown 15s | Nested work consumes the remaining outer deadline; no reset on retry |
| `Monolith:CommerceRateLimits:Enabled` | false until consumer/schema gates pass | Enable the exact [quota table](../functional-requirements/api-and-operating-contracts.md#shared-commerce-quotas) consistently on all replicas; enabled mode required for Phase 08 acceptance |
| `Monolith:CommerceRateLimits:WindowSeconds` | 60 | Exact fixed UTC windows; primary DB clock; original HMAC counter key/cleanup |
| `Observability:Enabled` | true for the Phase 08 operating environment | Required safe instrument/attribute policy; failure of export never authorizes a business fallback |
| `Observability:ServiceName` / `Environment` | ecommerce-monolith / private-sandbox | Bounded configured values; no user-provided service/environment labels |
| `Observability:Otlp:Endpoint` / `Protocol` | Protected internal endpoint / gRPC | Explicit trusted destination; loopback-only development exception for plaintext; otherwise verified TLS/transport identity |
| `Observability:Tracing:RootSamplingRatio` | 0.10 | Server-generated roots; user headers cannot override. A bounded reviewed drill may use 1.0 |
| `Observability:Tracing:QueueMaximum` / `BatchMaximum` | 2048 spans / 512 | Nonblocking bounded enqueue; observable drops |
| `Observability:Logs:QueueMaximum` / `RecordMaximumBytes` | 2048 records / 4096 bytes | Fixed events and allowlisted attributes; scrub before enqueue; observable drops |
| `Observability:Metrics:ExportIntervalSeconds` | 10 | Cumulative low-cardinality metrics to Collector; signals independent of trace sampling |
| `Observability:Exporter:DeadlineSeconds` / `RetryWindowSeconds` | 2 / 10 | Bounded asynchronous export; no business connection held; no infinite replay |
| Collector exporter queues | ≤100 batches per signal/backend; batch ≤512 records/spans or ≤1MiB serialized | Separate pipelines/exporters; no persistent unlimited disk spool |
| Collector retry/memory | Retry ≤30s per batch; memory limit 384MiB within 512MiB container | Memory limiter plus bounded queues; drop/rejection metrics required |
| Prometheus scrape/evaluation | 15s / 30s; scrape deadline 5s | Private targets; no retail auth credential in target labels or diagnostic output |
| Diagnostic retention and volumes | Metrics 35d/12GiB TSDB cap; traces 72h; logs 7d | Actual deletion, disk-cap protection and measurement gaps verified; see [observability](observability-and-alerts.md) |
| PostgreSQL `max_connections` / reserved slots | 100 / 17 non-superuser +3 superuser | Ordinary runtime cannot use reserved slots; planned normal maxima ≤80 |
| PostgreSQL diagnostics | Reviewed `pg_stat_statements`, maintained statistics/autovacuum | Controlled preload/restart/extension privilege; no raw SQL export or runtime DDL |
| Backup cadence/deadline/retention | Every 12h / completion ≤30min / 7d | One complete encrypted off-host database archive; valid manifest; age from conservative snapshot lower bound |

Telemetry endpoint credentials, Grafana credentials, private database credentials and backup encryption material are distinct protected secrets. Store secret version references in restricted release/backup manifests, never secret values. Startup rejects missing required keys, unsupported modes/versions, live payment credentials, untrusted proxy ranges, unsafe destinations, contradictory simulator flags and budgets that exceed the declared envelope.

Nonsecret configuration fingerprint includes artifact/schema/API/source versions, limits, proxy/CORS policy and instrument/retention policies. Compare fingerprints across replicas in deployment inspection; do not expose them through public health. Divergent contract or financial settings prevent reopening.

## Resource and storage envelope

Application aggregate remains 2 vCPU/2GiB; primary remains 2 vCPU/4GiB. Diagnostic components and edge/load-generator resources are **additional** and must be declared in every benchmark; they are not hidden inside a claimed small-system result.

| Diagnostic component | Initial process limit | Dedicated volume budget |
| --- | --- | --- |
| Collector | 0.5 vCPU /512MiB | No durable telemetry spool |
| Prometheus | 1 vCPU /1GiB | 16GiB volume; TSDB size-retention cap 12GiB, leaving WAL/headroom |
| Tempo | 1 vCPU /1GiB | 8GiB local diagnostic volume |
| Loki | 1 vCPU /1GiB | 8GiB local diagnostic volume |
| Grafana | 0.5 vCPU /512MiB | 1GiB settings/dashboard volume |

These proposed budgets total 4 vCPU/4GiB for diagnostic processes and require measurement; they are not proven minimums. Trace/log backend admission stops at 80% dedicated volume utilization until deletion/capacity restores it; alert at 70%. Hard container/filesystem limits prevent diagnostic growth from filling the primary data volume. Prometheus time retention can be shortened by its size cap; that is a missing 30-day evidence window, not successful SLO measurement. Backups use separate protected storage with capacity for at least 14 complete archives plus one in-progress archive; dataset growth requires recalculation.

## Health, source admission and shutdown

Reuse restricted `GET /health/live` and `/health/ready` with exact 200 `{"status":"ok"}` /503 `{"status":"unavailable"}` responses. Liveness is process responsiveness. Readiness requires valid configuration/schema, primary probe ≤1 second **including pool acquisition** and required local worker lifecycle. No probe charges, refunds, creates quotes or reveals dependency details.

Local required worker loops are supervised. A loop exception/stall is reported, stops affected local admission and is investigated; it must not disappear as a silently completed background task. Compare last successful loop progress against the existing poll/action budget; alert after 15 seconds of unhealthy required local loop progress. An API-only secondary validates its own roles and does not pretend to host the designated outbound executor. Deployment supervision verifies the single executor separately and closes new source admission when it is unavailable, using the existing owner gates/flags and maintenance containment.

Provider outage is a financial account hold/alert, not a reason to eject otherwise healthy read APIs or restart the entire monolith. Telemetry backend outage is a diagnostic health/gap condition, not a retail readiness dependency. Primary/application clock skew >30 seconds closes affected token issuance/purchase/dispatch according to the earlier contracts until corrected; database time remains authoritative for reservations/leases/windows.

Shutdown closes local admission and new claims, drains/cancels bounded calls and transactions within 15 seconds and preserves every committed key/fact/receipt/work row. Cancellation of a dispatched call means Unknown until verified; it never proves no capture. Planned executor handoff waits for completion/cancellation of old ≤2-second calls and confirms the old process cannot send before a replacement is enabled. Unproved shutdown keeps replacement dispatch disabled.

## Release and maintenance sequence

The operational lifecycle in [failure behavior](../reliability-and-failure-scenarios/failure-behavior.md#operational-lifecycle) is a protected procedure, not a new public endpoint or global row lock.

1. Record attributed release plan, artifact/config/schema fingerprints, reason, supported predecessor, rollback compatibility and evidence references. Review migration SQL/grants and actual affected consumers, including the Phase 08 429 error unions.
2. Close affected new Checkout/Payments admission using existing source flags/gates. For a full migration/restore, put the edge into maintenance and stop public routing. Return compatible 503/no-store/request UUID where the edge can serve the shared Problem contract; report unreachable-network failures separately. No sensitive path/query is reflected.
3. Drain and stop **all** affected API/worker processes. Confirm outbound executor quiescence; account for requests that may have committed or reached Stripe before the stop. No assumption of immediate global pause from a local config change.
4. Use one separately privileged deployment process to apply the reviewed migration. Enforce bounded lock acquisition, inspect partial/index/constraint state on failure and keep service held. Runtime never migrates on startup.
5. Start compatible binaries with new financial admission disabled and original adapters/retained sources available. Inspect actual grants, required nullable diagnostics, options, clocks and local worker lifecycle. After restore, complete the separate recovery gates before enabling mutation/fulfillment.
6. Enable bounded original recovery/callback handling as permitted by the owner/source rules; observe due work, facts, wake/scan and resource budgets. Do not silently convert old Simulator attempts or replace provider windows.
7. Enable reviewed admission and remove maintenance only after all gates pass. Record actual downtime and compatible exact replay. Activate commerce quotas only after schema consumers are ready and shared enforcement is verified.

Rollback closes affected admission, drains/stops, and starts only a binary able to interpret retained schemas, facts, sources and receipts. Retain additive diagnostic columns, accepted keys, original source descriptors and financial evidence. A Phase 06 binary cannot safely take over Stripe-backed work. An incompatible rollback leaves a held recovery owner rather than deleting records.

No zero-downtime guarantee or automated CD/HA failover is introduced. Maintenance counts against the 99.9% operating objective. The later infrastructure phase supplies full rolling/hosting evidence.

## Build and release verification requirements

During later implementation, run established build/format/type/static checks, secret/dependency/container scanning, schema/DDL review and available existing relevant tests. New automated tests, projects, fixtures, mocks and testing dependencies require the user's explicit request. Review migration/rollback plans and manual database/provider scenarios before financial admission; compilation alone is insufficient.

Use immutable build artifacts and pinned dependencies/images; separate build, deployment and runtime authority. Least-privilege containers run non-root with bounded writable paths/capabilities and protected volumes. Required restore/decryption/account access is rehearsed from off-host material. Record each evidence state explicitly; neither this document nor a local Compose start establishes production readiness.

## Acceptance assertions

The declared one/two-replica connection budgets match real enabled pools, no API alias creates an extra pool, and financial executor count remains one. Bad configuration fails closed without secret output. Backend failure cannot block a business commit; audit failure still aborts its owner operation. A stopped accepted request can replay its original receipt, and incompatible release/restore remains held until reviewed recovery succeeds.
