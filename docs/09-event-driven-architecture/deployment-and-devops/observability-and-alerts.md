# Observability and Alerts

**Status:** additional signal requirements, not deployed dashboards/exporters. Retain [OpenTelemetry, Prometheus, Tempo, Loki and Grafana](../../08-production-ready-monolith/deployment-and-devops/observability-and-alerts.md).

## Metrics and SLIs

| Signal | Definition | Alert/action |
| --- | --- | --- |
| Outbox state/count and oldest undelivered age | Per fixed owner/state; include Pending and ManualReview | Pending oldest >15s for 60s warns; >60s urgent; any review remains open |
| Publication attempts/results/confirm latency | Fixed outcome labels: Confirmed, Returned, Unknown, Negative, Unavailable | Any return or persistent unknown investigates topology/channel/resource state |
| Broker ready/unacknowledged/parking and bytes | Fixed configured queue identity, not user/event IDs | Parking >0 within 60s; queue ≥80% cap; unacknowledged work without progress |
| Inbox acceptance/duplicate/conflict | Counts per fixed source/type/result | Any conflict/quarantine within 60s; repeated malformed input investigates credentials |
| Delivery state/count and oldest pending age | Scheduled/ManualReview/Delivered/Skipped, distinctly counted | Healthy oldest >15s warns; >60s urgent; Skipped never improves success |
| Commit-to-receipt lag histogram | occurred_at to delivered_at for each distinct eligible event | Healthy p95 >5s or p99 >15s; reconcile pending denominator |
| Arrival/service rate and durable reconciliation | Owner eligible events versus receipt/explicit disposition | Sustained backlog growth over five minutes; discover missing rows |
| Claim expiries/cycle attempts | Fixed worker owner/outcome; expired tenth-claim count | Repeated expiries/exhaustion checks crash/deadline/fairness |
| Resource pressure | Pool wait/occupancy, DB storage/WAL, broker disk/memory/blocked publish | Connection/storage thresholds from capacity plan |
| Recovery operations and backup age | Fixed action/outcome; no target UUID labels | Audit failure; unusable archive; existing backup-age gates |

Use primary-backed bounded gauges/discovery and local counters/histograms. Deduplicate gauges from replicas: shared primary backlog has one designated bounded observer, or dashboards select one known observer; never sum the same DB backlog twice. Per-process counters/latency histograms retain bounded service/environment/instance-slot identity. Fixed owner/type/queue names are bounded; customer/order/payment/refund/event/request IDs and failure text are prohibited labels.

Eligible-event denominator comes from producer history, including undelivered/review/quarantined/skipped work. Histograms alone omit pending events. A notification success SLI counts distinct events Delivered within deadline divided by all eligible events in the cohort. Report duplicate publications/intakes separately. Do not infer useful delivery from broker throughput.

## Logs and trace correlation

Structured logs include bounded component, action, result, duration and trusted server request/trace/span context when available. Stable event source/UUID may be included only as restricted structured metadata for targeted investigation, never as Loki indexed labels or metrics labels. Omit recipient/amount/body/provider IDs/reasons/credentials; quarantine logs use fixed reason and diagnostic ID.

Loki indexed labels remain only configured service/environment. Other bounded fields and correlation IDs use structured metadata per Phase 08. Limit normal logs to one action outcome, rate-limit repeat dependency failures and emit counted suppression. Logs are not delivery evidence or authoritative purchase storage.

Trace owner append, relay claim/publish, intake and sink separately. Create new worker roots; link at most two trusted stored origins. Use immutable server-derived envelope traceparent as a link, not an inherited public parent or sampling decision. Broker headers/baggage cannot force sampling. Retry/replay keeps original envelope context while recording its current processing span; server root sampling remains 10%.

Keep the cumulative metrics SDK → Collector private Prometheus exporter → Prometheus route. Collector also sends traces to Tempo and structured logs to Loki; Grafana correlates them. No public /metrics/broker management or log body endpoint is added. Bound export queues/retention under Phase 08; telemetry loss has explicit dropped-export/health evidence.

## Investigation

1. Compare primary outbox intent, broker state, inbox and receipt progress for a scoped source/event using protected tooling.
2. Distinguish missing confirmation, missing intake, retry exhaustion, poison, parking and local sender backlog.
3. Check certificate/permission/topology fingerprint, resource alarms, pools, leases and versioned schema support.
4. Apply the original-identity [replay protocol](../functional-requirements/module-and-operating-contracts.md#replay-protocol); never diagnose by issuing a replacement payment.
5. Confirm receipt or explicitly unresolved disposition; retain actual alert/recovery times and failed evidence.

Alert evaluation ≤30s plus dispatch/detection ≤30s supports the ≤60s detection gate only while diagnostics are healthy. A telemetry outage is a separate urgent condition; it cannot be described as complete alert coverage.
