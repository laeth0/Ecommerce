# Cross-Service Observability and Alerts

**Status:** required extension of Phase08/09. Diagnostics do not supply financial or authorization authority.

## Signals and correlation

Retain OpenTelemetry instrumentation→Collector; Prometheus metrics, Tempo traces, Loki structured searchable logs and Grafana correlation. Use service.name=commerce or payments, environment and bounded instance slot. Aggregate counters across instances; do not overwrite replicas into one series.

Trace local request/authority commit, command persistence/send/owner receipt, owner DB application, decision/hold resolution and broker delivery. Public X-Request-Id UUID is distinct from W3C hex trace/span IDs. Only trusted private service context may propagate; public context is validated/discarded according to Phase08, not blindly trusted.

Background retries begin a new root with≤2 links to trusted original spans; durable records retain original command/correlation identity. No baggage/tracestate or untrusted URLs/reasons/provider payload. Sampling10% retains bounded export; protected owner audit/evidence remains complete regardless of trace sampling. [OpenTelemetry context propagation](https://opentelemetry.io/docs/concepts/context-propagation/) explains transport context; the project's stricter trust policy is intentional.

Loki indexes service/environment only; UUIDs belong in protected structured metadata where needed. Never label metrics by payment/Order/customer/command/refund/event UUID, provider ID, arbitrary error/detail/reason/URL or certificate serial. Use bounded role/commandKind/state/outcome/errorCode/routeTemplate/instance slot.

## Required metrics and SLIs

| Signal | Required measurement |
| --- | --- |
| Public/private requests | Offered/completed/rejected/timeout, complete duration histogram, bounded route/kind/peer/outcome |
| Authority and command progress | Authorized intent count, Pending/Unknown/Applied/Rejected/ManualReview count and oldest age; authorization→known admission duration |
| Confirmation | Held/Finalizing age/count, decision-query outcome, deferred unapplied count/age, resolution/release lag, blocked fulfillment attempts |
| Financial operations | Original capture/refund/correction/coverage/integrity metrics, account-call rate/slots, safe-window remaining, retained scan coverage |
| Hint transport | Owner commit→publish→inbox→wake lag, original outbox counts/oldest age, dedup/conflict/quarantine/parking |
| Resources | CPU/RSS/GC, pool active/wait/deadline, server executing/RPC slots, connection totals, disk growth horizon |
| Security and lifecycle | Peer scope/cert/epoch rejection counts, certificate horizon, executor presence, readiness/capability and gate changes |
| Recovery/diagnostics | Both archive ages/skew/job duration/status, bundle usable age, telemetry drop/backlog/backend outage |

Maintain≤10,000 active application metric series total across both services. Retention and exporter queue caps remain Phase08's measured policy. Metrics are aggregates; protected owner queries give exact target identity without high-cardinality labels.

## Alerts and first response

| Condition | Detection/response |
| --- | --- |
| Any integrity hold, mapping conflict, unexplained provider effect, stale epoch or second executor | Detect≤60s; contain affected scope, inspect original owners/provider evidence; never clear based on logs |
| Held/Finalizing>30s or ManualReview observed | Detect≤60s; inspect original command/token/decision/barrier and peer availability; preserve block |
| Due command/action exceeds15s or healthy hint lag misses target | Persisted primary-clock age; inspect pool/RPC/worker/queue contention and incomplete samples |
| Parking/quarantine/replay Pending or review observed | Detect≤60s; inspect canonical owner bytes/protected receipts; no blind discard/replay |
| Retained scan projected>24h or completed coverage age≥24h | Block unsupported growth; inspect amplification/fair scheduling/account budget |
| Planned/actual ordinary pools exceed80 or account rate/slots exceed limits | Stop extra instances/claims and investigate the hidden pool/executor; preserve recovery reserve |
| Certificate≤7days, rejected current peer, revocation drift | Renew/rotate trust and recycle connections; no validation bypass |
| Either archive invalid, skew>60s or bundle job>30m | Bundle unusable; investigate job/secret/disk; retain prior usable point |
| Usable bundle age>12.5h/>18h/≥24h | Warning/urgent/objective failure; at24h contain new purchase/refund/fulfillment until recovery capacity restored |
| Disk70% or exhaustion<24h;85% or<6h | Warning then controlled admission containment; preserve resolution evidence |
| Diagnostic drops/outage/sampling gap | Alert diagnostic loss; missing telemetry is unknown evidence |

Use bounded alert evaluation/sample intervals so observable conditions reach an operator within60seconds. Do not invent paging recipients or send messages as part of this documentation task.

## Investigation walkthrough

For “Order Confirmed but cannot process”: inspect Commerce decision and mapped actual Consume; verify stored confirmation token; inspect Payments original hold/decision/barrier and integrity state; verify release UUID; then inspect Commerce handoff receipt. A screenshot/trace alone cannot open fulfillment.

For “refund POST timed out”: inspect Commerce authorized command/key identity, current public authority, Payments original command/actor-key receipt/allocation and provider mutation/window. Return only known original receipt; never retry with a new key.

For “missing notification”: inspect producer audit/fact→canonical outbox→confirm/route→inbox/delivery→local sink; keep financial hints separate. Financial completion does not imply notification delivery.

Dashboards must show success plus incomplete/review counts and ages, source-labeled simulator vs genuine probe results and denominator gaps. Preserve failed runs and annotate releases/gates/epochs without exposing secrets.
