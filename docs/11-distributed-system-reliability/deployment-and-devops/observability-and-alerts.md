# Reliability Observability, SLIs and Alerts

## Existing signal and storage contract

OpenTelemetry→Collector→Prometheus metrics, Tempo traces and Loki structured logs; Grafana correlates them. Retain [Phase08 bounds/retention](../../08-production-ready-monolith/deployment-and-devops/observability-and-alerts.md) and [Phase10 owner signals](../../10-microservices/deployment-and-devops/observability-and-alerts.md).

Metrics35d with12GiB TSDB cap/16GiB volume, traces72h/8GiB, logs7d/8GiB remain diagnostic limits. Capacity may reduce retained history; alert missing evidence. Business audit/facts/receipts remain in owner databases and have no new deletion policy.

## Distributed action traces

Trace each bounded HTTP/action span. At a synchronous trusted private call use normal validated parent propagation; background retries start a new root with at most two trusted links to original acceptance/selected Admin context. Keep original durable identity as restricted structured metadata, not an open multi-minute HTTP span.

Suggested fixed spans: checkout.command.observe, checkout.confirmation.decide, payments.command.admit, payments.hold.finalize, payments.provider.observe, messaging.publish, messaging.intake, recovery.resume. Include bounded outcome/work kind/reason, actual call elapsed time, claim count and profile code; never raw body/URL/provider parameters/token/reason.

Server-generated request UUID is distinct from W3C trace/span hex. Public traceparent/tracestate/baggage are ignored under the current sandbox trust policy; they cannot force sampling. Internal trusted context is validated. Ten-percent head sampling is default; an isolated bounded drill may temporarily use100% only with declared duration/resource/privacy limits. Missing trace is normal and cannot block or prove work.

OpenTelemetry describes span relationships and [links between traces](https://opentelemetry.io/docs/concepts/signals/traces/). Actual exporter attribute filters must preserve the project's narrower privacy boundary.

## Logical instruments

Reuse existing instruments where suitable; these names specify logical meaning and require explicit SDK/exporter mapping during implementation.

| Signal | Type and measurement | Finite dimensions |
| --- | --- | --- |
| reliability.rpc.dispatch / duration | Counter / seconds histogram; actual sends and complete call time | owner, three class codes, outcome |
| reliability.circuit.state / transitions | Gauge / counter; Closed/Open/HalfOpen and state changes | fixed class, bounded instance slot |
| reliability.work.deferrals | Counter; preflight deferral versus charged failure | owner, fixed work kind/reason |
| reliability.retry.delay | Millisecond histogram; persisted draw | owner, profile code, bounded attempt bucket |
| reliability.cycle.exhaustions | Counter; attempts/deadline exhausted | owner, work kind, reason |
| reliability.work.count / oldest_age | Owner-derived gauges by pending/review/due state | owner, work kind/state |
| reliability.recovery.turn_wait | Seconds histogram; eligible→scheduler turn | owner, fixed scheduler class |
| reliability.remote.unknown | Count/oldest-age gauges | owner, fixed command kind |
| reliability.handoff.stage_age | Count/age gauge: Held, Finalizing, awaiting local release | owner, fixed stage |
| reliability.resume.operations | Counter from retained receipts/audit | owner, outcome |
| reliability.worker.fences | Counter; stale token/version/epoch rejection | owner, fixed rejection code |
| reliability.provider.coverage | Original financial gauges/counters; reserved/failed/successful and scan progress | original bounded source/state, no target ID |

Never label a metric by UUID, amount, financial version, epoch/profile hash, provider ID, certificate serial, arbitrary route/reason/error text. Configuration profile is one finite code, not its changing digest. Total active application series across both services≤10,000; histogram bucket multiplication and instance/resource labels count.

Keep ≤4,096-byte structured log records; fixed event codes/messages, scrubbed stack locations and allowlisted fields. Loki indexes service/environment only; request/trace/action/target IDs remain restricted metadata. Do not log hold token, provider key, JWT/refresh token, payment method, address, email, raw SQL/header/body or operator reason.

## SLIs and denominators

| SLI | Calculation / caveat |
| --- | --- |
| Public availability | Existing rolling30d eligible correct responses/all eligible; edge+app reconciliation, timeouts/5xx/valid capacity failures count |
| RPC amplification | Actual calls/distinct original operations, including queries/recovery; breaker deferrals shown separately |
| Retry exhaustion | Cycles reaching review/all activated cycles, split deadline/attempt/integrity |
| Workflow progress | Accepted records legitimate terminal, confirmed-awaiting-release, pending, review and quarantine; no deletion from denominator |
| Handoff lag | Verified eligible capture→local decision→resolution→locally recorded release; clock uncertainty/sample count explicit |
| Recovery success | Legitimate terminal within objective/affected eligible originals; separate disposition including ManualReview |
| Fairness | Eligible nonblocked per-class turn wait; blocked count/age separately |
| Scan completeness | Objects covered/retained relevant objects and full-cycle age; changed old objects included |
| Diagnostic quality | Dropped exports, stale owner gauges, missing source intervals and trace sampling rate |

Owner aggregate queries run at most every15s in existing bounded monitoring capacity, using indexes. Failed collection is unknown/stale, never zero debt. Committed fact counters reconcile against owner evidence because a crash can lose emitted telemetry. Histograms aggregate buckets across instances; benchmark percentiles use complete client distributions.

## Alerts and safe first action

| Condition | Detection target / first action |
| --- | --- |
| Integrity conflict, unexplained effect, stale epoch or second executor | ≤60s; contain relevant capability/process/egress; inspect original owner/provider proof |
| Held/Finalizing/awaiting release>30s, or ManualReview | ≤60s; inspect original decision/token/barrier/cause; never force release |
| Active cycle deadline passed / ten claims exhausted with no disposition | ≤60s after condition observable; inspect sweep/lease/primary availability |
| Private circuit open>60s or repeated half-open failure | ≤60s; inspect dependency and isolated class; check deadline debt, not just circuit metric |
| Due work>15s / eligible class turn>30s | ≤60s; inspect pool/slot/hot row/fairness and blocking cause |
| Parking/quarantine observed | ≤60s; canonical source/operation review; no blind deletion |
| Provider quota/scan/pool plan violation | Immediate bounded alert≤60s; stop added claims/processes and inspect account/pool inventory |
| Usable paired bundle age>12.5h/>18h/≥24h | Warning/urgent/objective failure; at24h contain new purchase/refund/fulfillment |
| Disk70% or horizon<24h;85% or<6h | Warning then attributed admission containment; retain resolution reserve |
| Export drops/stale gauges/backend unavailable | ≤60s when separately observable; declare missing diagnosis/SLI intervals |
| Certificate≤7d or invalid current peer | Renewal/repair; never disable validation |

Alert evaluation≤15s plus bounded notification/evidence collection must meet≤60s for observable conditions. Monitor failure itself is a gap, not evidence that no alertable incident occurred. Actual escalation recipients/channels belong to later operating deployment; this task sends no messages.

## Dashboards and incident walkthrough

Use four views: public/private latency and availability; accepted workflow debt and handoff stages; provider coverage/scan/account gate; transport/backlog/resources/recovery operations. Display useful success next to incomplete/review and sample counts.

For “Confirmed but Processing blocked,” locate Commerce decision/Consume, Payments hold/barrier/integrity/release and local handoff receipt. For “refund timed out,” locate durable Commerce authority/command, original Payments receipt/R/provider mutation and earliest-send window. For “event delayed,” locate original outbox→confirm→inbox→sink separately from financial state. Logs/traces find these records; owner proof decides the next action.
