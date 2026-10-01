# Observability, SLIs and Alert Response

**Status:** target operating design. The user selected **OpenTelemetry, Prometheus, Tempo, Loki and Grafana**. No exporter, dashboard or alert is deployed by this documentation increment.

## Signal flow and failure isolation

Application/worker .NET instrumentation uses explicit safe meters, activity sources and structured logging. Send metrics/logs/traces asynchronously over private OTLP to the bounded Collector. Prometheus scrapes the Collector's Prometheus exporter and restricted component/primary/edge aggregates; Tempo stores trace spans; Loki stores structured searchable logs; Grafana queries all three backends. See [OpenTelemetry Collector pipelines](https://opentelemetry.io/docs/collector/architecture/) and [Loki's OTLP HTTP ingestion](https://grafana.com/docs/loki/latest/send-data/otel/).

Use separate bounded signal/export queues and memory limiting; export calls hold no database connection or business transaction. Retry telemetry for a finite window, then drop with counters. No unlimited persistent spool or replay of old diagnostics. A unavailable Collector creates an explicit telemetry gap; cumulative metric export may catch up after reconnect while a process remains alive, but lost-process data is missing evidence. External Prometheus scrape/up signals and safe edge counters detect loss independently of the failed application export path.

Mandatory domain audit is stored transactionally by the owner and remains required. Loki is never audit, payment evidence, work scheduling or an Order source. Missing trace/log data cannot change capture, stock or authorization.

## Instrument and dimension inventory

Names below are the Phase 08 logical instrument contract; bind to appropriate SDK units/types and exporter naming during implementation. Document the mapping so dashboards do not rely on accidental package names. SDK/client/DB standard attributes must pass the same allowlist before export.

| Logical instrument | Type/unit and measurement | Allowed metric dimensions |
| --- | --- | --- |
| `retail.requests` | Counter; one completed/rejected observed request | Route template, method, status class, fixed outcome, origin edge/app |
| `retail.duration` | Histogram seconds; complete host operation | Route template, method, fixed outcome |
| `retail.admission` | Counter and executing gauge | Component, accepted/denied, fixed cause |
| `database.pool.wait` / `database.command.duration` | Histograms seconds; acquisition separate from command including lock wait | Pool role, owner, fixed operation/result |
| `database.pool.connections` | Active/idle/waiting gauges | Pool role and bounded configured instance slot |
| `database.transaction.duration` / `database.lock.failures` | Histogram seconds /counter | Owner, fixed operation, safe SQLSTATE class |
| `runtime.cpu` / `runtime.memory` / `runtime.gc` | Utilization, bytes and bounded runtime measurements | Process role and bounded configured instance slot |
| `workflow.due.count` / `workflow.oldest_due.age` | Gauges count/seconds, by existing owner projection | Owner, work kind, state |
| `workflow.scheduling.duration` / `workflow.convergence.duration` | Histograms seconds; eligible→action /acceptance→legitimate outcome | Owner, source, fixed work kind/outcome |
| `workflow.claims` / `workflow.fences` / `workflow.retries` | Counters | Owner, fixed kind/result |
| `inventory.reservation.transitions` | Counter; verified terminal transitions | Consumed/Released/Expired |
| `orders.created` / `checkout.outcomes` | Counters from committed owner outcomes | Source, fixed lifecycle/outcome |
| `payments.provider.calls` / `payments.provider.duration` | Counter/histogram seconds including complete call | Source, fixed API operation/status class |
| `payments.uncertain.count` / `payments.compensation.holds` | Count/oldest-age gauges | Payment/refund class, fixed state |
| `payments.scan.age` / `payments.wake.age` | Gauges seconds with covered/total counts | Fixed scan/work class/source |
| `security.rate.denials` / `security.authority.denials` | Counters | Quota class or fixed denial reason; no actor/source value |
| `telemetry.dropped` / `telemetry.queue` / `telemetry.export.failures` | Counter/gauge | Signal, bounded exporter/result |
| `backup.last_usable_snapshot.age` / `backup.jobs` | Gauge seconds /counter from protected manifest monitor | Job class, success/failure |
| `storage.utilization` / `component.health` | Fraction/up gauge | Fixed component/volume role |

No Customer/Order/payment/provider/request UUID, raw IP/email/SKU, free text, raw version/key/URL/query or exception message is a metric label. Index label count and combinations are reviewed, not merely label-name count. Target ≤10,000 active application series for the deployment, excluding declared backend/primary metrics; report total backend series too. Route values come from registered templates; unmatched routes use one fixed label. A process identity is a small configured deployment slot, never an arbitrary UUID/pod name label.

Every application metric stream additionally has bounded configured service, environment and instance-slot identity. Preserve those identities through Collector→Prometheus translation so two replicas' cumulative counters cannot overwrite one indistinguishable series; aggregate the separate streams in queries. Remove other resource attributes before any resource-to-label conversion. Record exporter translation and restart/reset handling explicitly. Retail latency uses only three fixed outcome classes (success, business denial, infrastructure failure) to limit histogram multiplication; detailed fixed outcomes belong to request counters.

Initial latency histogram boundaries in seconds: 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.25, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10 and +Inf. Use a separately bounded worker/convergence histogram including 15, 30, 60, 300 and 900 seconds. Quantile estimates have bucket error; exact client distributions determine benchmark acceptance. Aggregate histogram buckets across replicas, not averages of per-replica percentiles. [Prometheus histogram guidance](https://prometheus.io/docs/practices/histograms/) is the reference.

Owner projections for due count/oldest age run at most every 15 seconds with a bounded query/2-connection monitoring pool. Use aggregate/indexed access; never fetch each queued record into application memory. If collection fails, report stale/unknown rather than zero debt. Committed business counters must be derived/checked against owner facts where a process crash could lose an emitted increment; trace counts are never completion denominators.

## Structured logs and trace context

Allowlisted log fields: timestamp, fixed event code, severity, service/environment/module, configured instance slot, server `request_id`, generated `trace_id`/`span_id`, optional `origin_request_id`, operation/outcome/state, bounded retry count and duration. Use fixed messages or structured event bodies; no arbitrary exception `Message`/`ToString()`, SQL statement, header, body, reason or provider URL. Export fixed exception class/code and scrubbed stack locations when useful. Each record ≤4,096 encoded bytes.

Loki index labels are only the configured service and environment resource attributes. Module/severity/request/trace/span/instance fields remain structured metadata searchable within a bounded label/time range. This uses native OTLP resource indexing without converting per-record fields into artificial resource labels. Override default resource-label promotion; enable structured metadata for the selected storage schema. Grafana's log-to-trace link uses the generated `trace_id`. A Problem's UUID `traceId` is first located through `request_id`; it is not sent directly as a W3C trace lookup.

Private gateway/root instrumentation creates server-controlled context. Public `traceparent`, `tracestate` and baggage cannot force sampling or be persisted/exported; ignore them for the private sandbox baseline. Within a process, normal activity nesting connects owner operations. Outbound financial spans use fixed operation names and sanitized attributes, with raw provider HTTP instrumentation disabled unless its filters are proved.

At acceptance, freeze optional context as specified by the [diagnostic schema](../database/query-plans-migrations-and-integrity.md#diagnostic-schema-extension). Worker actions start new roots, link the trusted original context and, for a selected Admin refund, its request context; maximum two links. They generate an action request UUID and retain the accepted origin UUID only as diagnostic metadata. Stored context survives restart without keeping the original HTTP span open. Missing/unsampled/expired backend context is normal and never blocks work; restricted owner audit supplies the business investigation path.

Head sample server roots at 10%; metrics and business audit remain complete independently. A bounded isolated drill may record 100% with duration/resource/privacy gates. Head sampling cannot guarantee retention of every error trace, so fixed error logs and counters are required. No per-Customer tracing override or high-cardinality baggage is introduced.

## Retention and storage behavior

| Signal | Time policy | Capacity/failure policy |
| --- | --- | --- |
| Prometheus metrics | 35 days for the 30-day availability objective | 12GiB TSDB size cap within 16GiB volume; if size cap evicts earlier, report incomplete objective window |
| Tempo traces | 72 hours | 8GiB isolated volume; alert 70%, stop ingestion at 80% until safe capacity/deletion recovery |
| Loki logs | 7 days | 8GiB isolated volume; same capacity thresholds; Compactor retention/deletion explicitly enabled and verified |
| Temporary local process logs | Bounded rotation ≤50MiB/process, no diagnostic archive guarantee | Sanitized output only, drop/rotation observable; no unlimited second copy of OTLP logs |
| Business audit/facts/receipts | Existing owner retention | Unchanged; not governed by diagnostic backend deletion |

Backend retention is configured and observed, not assumed from a default. Prometheus time/size policies can limit different parts of available history; see [storage documentation](https://prometheus.io/docs/prometheus/latest/storage/). Loki requires an explicit working retention mechanism; see [Loki retention](https://grafana.com/docs/loki/latest/operations/storage/retention/). Hard isolated volume/process limits prevent diagnostic pressure from filling the primary disk. Reaching capacity may lose telemetry even before time expiry; that is a visible diagnostic limitation, not financial data deletion.

## SLI definitions and dashboards

1. **Retail availability:** correctly handled eligible Catalog/Cart/Order/Checkout requests divided by all eligible requests over rolling 30 days. Normal domain conflict is counted and shown separately; valid in-budget infrastructure denial, 5xx, timeout and maintenance count bad. Invalid/unauthorized/intentional over-quota traffic is a separate series. Edge requests that never reached the app are reconciled with app counts without double-counting. Missing eligibility/counter intervals remain unknown evidence.
2. **Latency:** class histograms over 5-minute operational windows, with counts shown. Reference acceptance uses full client distributions in three prescribed runs. Authentication/financial-specific distributions are separate.
3. **Workflow:** acceptance→legitimate terminal, eligible→action, current unresolved count/oldest age, ManualReview alert status, financial wake/scan coverage. A fast 202 does not meet settlement/convergence.
4. **Resource capacity:** CPU/RSS/GC, executing slots, pool wait/connections, primary utilization/disk/locks, rejected work and arrival/service rate by owner class.
5. **Financial safety:** account holds, Unknown/window age, compensation FailedHold, verified reversal/quarantine and retained scan age. No dashboards claim live banking settlement or show provider/customer IDs.
6. **Recovery/diagnostics:** backup usable-age/job status, telemetry drops/backend up/volume, configuration/deployment evidence and restore gate outcome.

Create these six dashboards during later implementation with read-only viewers and separate edit/deployment privilege. Missing collector metrics is shown as no data/gap, never a green zero. Cache-hit/miss, broker/outbox age and consumer lag are Not applicable in 08; add them when their owners introduce those capabilities.

## Alerts and first response

The **sandbox operator/project owner** receives alerts through a private configured channel; no channel message is sent by this documentation task. Alerts name only safe fixed context, dashboard/runbook, threshold and time. Group by component/fixed cause, deduplicate and preserve unresolved status; acknowledgment does not fix the business state.

| Alert | Threshold/window | Required first action |
| --- | --- | --- |
| Retail error/availability pressure | Bad eligible fraction >1% for 5min with ≥100 requests | Inspect edge/primary/admission/schema; maintain truthful denominator |
| Latency regression | Class p95 above its target for 5min with ≥100 class requests | Separate pool/lock/command/serialization and source effects |
| Required work lag | Healthy oldest eligible age >15s for 1min | Check worker lifecycle, action budget, fencing and fair class service |
| Purchase/financial propagation | p95 >5s for 5min with ≥100 applicable events | Inspect accepted work, financial wake and fixed lock order |
| Financial uncertainty | Any unresolved age >5min or safe POST window remaining <1h | Inspect original object/key/window; do not invent no-capture or create a new key |
| Financial integrity/FailedHold/reversal | Any new verified integrity hold/quarantine or FailedHold/reversal | Close affected financial admission where required; inspect debt/current facts through owner procedure |
| Scan coverage | Retained financial cycle age >24h | Compare admitted volume and calls/service rate; hold unsupported growth |
| Pool pressure | API active connections ≥18/20 or worker pool saturated continuously 2min, or acquisition p95 >500ms/5min | Inspect query/lock/pool count; preserve reserved slots |
| Primary disk/reserve | Data volume ≥80% for 5min, or normal connections >80 | Contain admission/growth and protect recovery access; do not erase unresolved facts |
| Required local loop | No healthy progress for 15s while enabled | Stop affected new admission, inspect supervised worker; no silent completion |
| Backup failure/age | Any failed/invalid archive; usable snapshot age >12.5h warning, >18h urgent | Repair job/off-host/decryption path; if age reaches 24h, recovery-objective gate fails and new purchase/fulfillment is held |
| Diagnostic outage/drops | Backend/scrape down >1min or any queue drops sustained 1min | Check bounded pipeline/capacity and label policy; preserve business operation |
| Diagnostic volume | ≥70% for 5min; ≥80% immediately | Investigate retention; stop affected trace/log ingress at 80%, keep drops/gap visible |
| Forbidden export marker | Any detected secret/PII marker | Stop affected exporter, rotate exposed secrets, remove diagnostic exposure under incident authority; retain business evidence |

Numerical thresholds are initial policy, not measured alert precision. Correlate page-worthy symptoms, avoid duplicate per-request noise and distinguish ordinary business rejection from infrastructure failure. Existing Payments account circuit gates retain their five-failure/60-second/30-second policy; an alert never resets a lease, mutation window or money state.

## Acceptance assertions

All signals map to defined units/allowed attributes, and dashboards distinguish acceptance from completion and zero from missing data. Searchable logs correlate a request UUID with its trace and a restarted worker link. Forbidden markers and ID-label explosions fail privacy/cardinality gates. Collector/backend/volume failure leaves exports finite and the primary business flow intact; domain audit failure still rolls back its required effect. Retention and 30-day gaps are recorded honestly.
