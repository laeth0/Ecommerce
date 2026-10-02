# Infrastructure Observability and Alerts

## Preserved signal ownership

Keep OpenTelemetry/Collector/Prometheus/Tempo/Loki/Grafana and [Phase 12 signal rules](../../12-scalability/deployment-and-devops/observability-and-alerts.md). Owner databases hold authoritative business/audit evidence; Kubernetes events, CI logs, Loki and Tempo cannot reconstruct accepted money/stock/authority.

Retain ≤10,000 active application metric series across both owners, server-root10% sampling, new bounded worker roots with at most2 trusted links and original producer/export scrubbing. UUIDs remain restricted structured metadata, not metric/Loki index labels.

Prometheus35d/12GiB cap/16GiB volume, Tempo72h/8GiB, Loki7d/8GiB and original bounded exporter queues/retries remain. New platform collectors require a separate admitted request/limit/storage/cardinality envelope; they are not hidden inside the previous4CPU/4GiB diagnostic allocation.

## Platform evidence

| Signal | Required interpretation / bounded scope |
| --- | --- |
| Desired/ready/actual/terminating application processes | Separate counts per fixed owner/instance slot; runtime proof supplements API state |
| Scheduled/Pending/OOM/restarted state | Fixed workload/reason; image/policy/scheduling failure and eviction timeline |
| Resource requests/limits/usage | Host/VM/Pod CPU/RSS/ephemeral/PV and actual profile comparison |
| Gateway route/data-plane health | Expected accepted backend/TLS status plus actual edge traffic/error origin |
| CNI/DNS/network deny | Reviewed fixed flow/denial counters, no raw IP/header label |
| Secret/certificate horizon | Nonsecret key role/version category and remaining lifetime; no material dump |
| Release/migration/backup state | Protected release/evidence annotation and bounded fixed outcome counts |
| HPA desired/current/metrics-known | Controller delay, admission block and actual pool/process cost |
| PostgreSQL/broker | Original connections/locks/WAL/disk/queues/parking/account-work/scan |
| Diagnostics | Scrape/export drops, missing windows, cardinality and retention capacity |

Use an allowlisted bounded collector configuration with at most5,000 additional active platform series in the admitted prototype. Alert at80% of that cap and reject unreviewed instruments/label expansion before export. This is separate from the original10,000 application-series cap; both require actual storage/CPU/cardinality measurement.

Do not indiscriminately export all Pod UIDs, release IDs, image digests, Secret names/values, label keys or per-object Kubernetes events as metric dimensions. Protected release annotations hold detailed fingerprints separately.

## SLIs and release outcomes

Observed availability includes valid request failures at the edge, application and planned maintenance, with deduplicated origin. TLS/transport failures and missing metrics are disclosed. A Gateway503 after forwarding may coexist with an owner commit; latency/error accounting cannot overwrite the original receipt.

Complete client per-class distributions determine benchmark p50/p95/p99. Retain source/session/auxiliary traffic, useful completion, business denials, quota/capacity errors, dropped iterations and unfinished accepted work.

Measure release approval→apply→actual quiescence→startup→ready→safe capability reopen. Maintenance≤600s is a goal, not a timed permission to open gates. Restore RTO includes integrated reconciliation/reopening; image/PVC/database startup alone is insufficient.

The original rolling30d99.9% objective corresponds to43.2m unavailable time in a full30-day window, if the ledger uses that time-based denominator. Record the actual established SLI definition and missing intervals; a local short run cannot demonstrate the window or promise an SLA.

## Alerts and response

| Observable condition | Detection / action |
| --- | --- |
| Integrity/authority/identity conflict or possible second executor |≤60s; abort/contain affected scope and verify old egress |
| Actual full Commerce process count>2 or SQL plan>80 |Block release/scale; inspect terminating/orphaned processes and hidden pools |
| Readiness/route/TLS mismatch or stuck release |≤60s; keep affected gate closed, inspect exact target/digest/generation |
| Image/secret/CRD/CNI incompatibility |Before release when detectable; otherwise≤60s, no unsafe fallback |
| Certificate≤7d/expired/revoked |Original warning/denial; renewal/revocation with bounded overlap |
| Primary/broker/host/ephemeral disk pressure |Original stricter warning/containment; preserve resolution and retained evidence |
| Required backlog/turn/scan breach |Original debt/≤30s fairness/≤24h scan gates; no extra provider executor |
| Usable paired bundle>12.5h/>18h/≥24h or job>30m/skew>60s |Original warning/urgent/objective failure and affected admission containment |
| HPA metric gap/process interlock breach |Stop optional scaling, keep accepted-work recovery and actual budget |
| Diagnostic scrape/export/cardinality gap |≤60s when observable; unknown values not reported as zero debt |
| Clock skew>30s between primary and application |Original affected issuance/purchase/dispatch containment until corrected |

Default aggregate scrape/owner inspection cadence15s, scrape deadline5s and original monitoring2/operator4 SQL budgets. New platform metrics-server uses its own approved profile and no application-database credentials.

## Access and runbooks

Grafana/backend queries and platform events are restricted management, with viewer/admin separation and sanitized bounded output. Release/backup/operator IDs appear only in protected evidence metadata.

Alert channel/recipient setup is later approved operating configuration. This documentation does not send email/chat messages or install integrations. An alert needs an operator acknowledgement/owner runbook; an alert firing alone is not resolution.

Use [runbooks](incident-and-recovery-runbooks.md) and original owner proof to reopen. Missing diagnostic evidence makes the related acceptance Not run; it does not authorize a business-state repair.
