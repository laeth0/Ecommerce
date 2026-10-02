# Capacity Observability, SLIs and Alerts

## Existing signal contract

Retain OpenTelemetry/Collector/Prometheus/Tempo/Loki/Grafana, original trust/sampling/retention/export bounds, restricted UUID metadata and ≤ 10,000 active application metric series across both services.

Metric storage 35d with 12GiB cap/16GiB volume, Tempo 72h/8GiB and Loki 7d/8GiB remain diagnostic policies. Capacity can reduce history; report missing windows. Business proof/audit remains owner data with no new deletion.

Run/tier/proposal/resource/schema/epoch fingerprints belong to protected evidence and bounded dashboard annotations, not high-cardinality metric labels. Metric streams keep existing fixed service/environment/instance identities; optional components add only reviewed bounded dimensions.

## Logical measurements

| Signal | Meaning / allowed dimensions |
| --- | --- |
| Request offered/admitted/completed/useful | Fixed route/class/status/outcome; generator offered/drop separately from edge/app |
| Complete duration | Original class histograms/client distributions, failed/timeout included |
| Quota rejection/counter wait | Fixed quota class/scope-stage/result; never IP/actor/bucket hash |
| Active sessions/refresh outcomes | Aggregate cohort count, fixed route/outcome; no token/session/user label |
| Execution/pool/lock | Existing role/operation/state/instance; hidden source inventory checked |
| Query/maintenance/WAL | Fixed owner/query code, rows/buffers/sort/dead-tuple/WAL/disk age aggregates |
| Worker/queue debt | Original kind/state/due age, publication/intake/sink/repeat/parking counts |
| Provider | Original call/scan/window/coverage/circuit/one-executor metrics |
| Optional cache | Hit/miss/invalid/timeout/fallback/fill active/map/memory/eviction/entry-byte aggregates |
| Optional standby | Receive/replay/lag-known state, retained WAL/slot bytes/read cancel/fence/fallback counts |
| Optional partition | Parent/child count, fixed candidate query planning/pruned partitions/write/maintenance; no table-name explosion |
| Backup/recovery/economics | Original usable age/skew/job/reopen time; resource/byte/object/call amplification reports |

No per-product/order/customer/key/event/provider ID/raw URL/error/operator reason in labels. Histograms multiply by bucket count; add no tier/run label to every latency series. Existing ≤ 10k budget includes new optional application instrumentation.

## Denominator and percentile rules

Report actual core/auxiliary offered, quota-admitted, useful, business-conflict, quota-rejected, capacity-rejected, timeout, dropped generator and unfinished work. Categories can overlap; e.g. timeout after commit is admitted and Unknown until reconciled. Keep original record-level accounting rather than forcing counters to sum arbitrarily.

Complete client distributions determine benchmark p50/p95/p99 per class/run. Do not average percentiles, omit slow samples or treat closed-loop reduced demand as capacity. Clock/sampling/missing edge/app evidence is a disclosed gap.

Useful HTTP, simulator convergence, genuine capture/handoff, compensation coverage/settlement and notification receipts are separate outcomes. One 202 does not prove eventual completion or stable required backlog.

## Capacity report

Every run includes tier/model/data/skew/source/resource/config fingerprint, source/session pacing, three windows/all samples, useful RPS/error/latency, CPU/RSS/GC, primary/standby/cache resources, pools/locks/WAL/maintenance and queue/provider/backup evidence.

Calculate useful core requests/appCPU-second, primary query work/useful request, database bytes/accepted record, publication/provider calls/original operation and net drain under declared ongoing arrivals. Optional resource cost is additional and visible; no invented currency price or production bill.

10k/100k scenarios record formula/assumptions/headroom and quota/refresh/resource limits as Analytical. NoneAtDeclaredLoad means only that exact measured envelope.

## Alerts

| Observable condition | Required detection / action |
| --- | --- |
| Original stock/money/authority/identity integrity conflict or second executor |≤ 60s; abort/contain affected scope, preserve original evidence |
| Active work/review/hold/parking/deadline alert | Original Phase 11 ≤ 60s; original owner/proof/runbook |
| Ordinary sessions/pool plan > 80 or third full Commerce overlap | Block configuration/deployment; inspect hidden role/process |
| Unexpected in-budget 429 or refresh denial |≤ 60s; inspect source/actor pacing and policy drift; no bypass |
| Required backlog grows three consecutive 1m windows or turn wait > 30s |≤ 60s; stop approving offered/data growth, inspect actual service/amplification |
| Authoritative disk 70%/ < 24h; 85%/ < 6h or stricter inherited gate | Warning then attributed admission containment; retain resolution reserve |
| Broker queue/parking ≥ 80%, free disk < 2GiB/ < 1GiB | Alert then original publication block/backpressure |
| Optional cache invalid/failed/fill/fallback/memory bound |≤ 60s; disable candidate as needed, bounded primary fallback only |
| Optional replica unknown lag/source/fence or WAL horizon exceeded |≤ 60s; disable optional reads; protect primary/rebuild through reviewed procedure |
| Missing partition/invalid index/dependency or migration mismatch | Contain writer/optional adoption; preserve existing owner history |
| Usable bundle > 12.5h/ > 18h/≥ 24h, job > 30m/skew > 60s | Original warning/urgent/objective failure; invalid pair unusable |
| Scan coverage ≥ 24h or growth cannot meet provider budget |≤ 60s; block unsupported retained volume/admission growth |
| Export drop/cardinality/diagnostic outage |≤ 60s when observable; unknown/stale metrics never reported as zero debt |

Owner/diagnostic collection uses original monitoring/operator budgets, at most 15s ordinary aggregate cadence and bounded indexed queries. Optional standby monitoring is explicitly counted in its proposal. Alert routing/recipients are later operating configuration; this documentation sends no messages.

## Dashboards

Use five views: eligible versus offered load/latency; shared quotas/auth sessions; primary/resource/maintenance; accepted-work/provider/message debt; optional mechanism/cost/recovery gates.

Show useful outcomes beside rejected/incomplete/review and sample count. Link safe trace/request metadata to protected owner inspection, preserving 10% sampling/new worker roots/≤ 2 trusted links. Loki/Tempo/cache/replica telemetry never becomes restored business authority.
