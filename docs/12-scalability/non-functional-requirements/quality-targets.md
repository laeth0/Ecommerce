# Scalability Quality Targets

**Status:** proposed measurable gates, not achieved capacity. Failed/unreached tiers remain explicit; original source-specific financial/security/recovery targets stay binding.

| ID | Requirement / target | Evidence |
| --- | --- | --- |
| SCL-NFR-01 | Zero oversell, negative balance, partial accepted stock group, duplicate original movement/Order or unbacked confirmation | Hot-row/duplicate/deadline/crash owner inventories |
| SCL-NFR-02 | Zero stale publication/current-price/accepted-total or authority/ownership/revocation violation | Concurrent hide/category/price/session/cross-owner cases |
| SCL-NFR-03 | Original financial identities/coverage/23h windows/nonexpiring holds and ten-observation/300s cycles preserved | Original receipt/fact/case/decision/lease/epoch evidence |
| SCL-NFR-04 | Public/private/event v1 schemas/cursors/headers/errors/bytes unchanged; no unapproved stale route/extra service | Contract/digest/route/principal compatibility review |
| SCL-NFR-05 | Healthy Catalog/history 100/300/750ms p50/p95/p99; search/Cart/preview 150/500/1000ms; acceptance 250/750/1500ms | Complete client classes, ≥ 1,000/class/run, three runs |
| SCL-NFR-06 | Reference100 ≥ 50 useful coreRPS; unexpected eligible failures < 0.5%; interactive DB command p95 ≤ 100ms; no required sustained backlog | Exact inherited workload/resources/auxiliary traffic |
| SCL-NFR-07 | Users250 paced ≤ 90 offered coreRPS, ≥ 75 useful, original latency/failure/convergence bounds |250 current sessions/source/quotas; all outcomes counted |
| SCL-NFR-08 | Users500 paced ≤ 120 offered, ≥ 100 useful; same original quality bounds |500 sessions/≥ 2 verified source groups |
| SCL-NFR-09 | Users1000 paced ≤ 150 offered, ≥ 125 useful; same quality bounds; ≥ 3 source groups |1,000 sessions, normal auth/refresh, no 1,000-inflight claim |
| SCL-NFR-10 | D1 qualified only if Reference100 and original owner invariants/backup/scan/storage gates pass | D0/D1 identical-rate plans/data/maintenance comparison |
| SCL-NFR-11 | Retained growth horizon declared; original 70%/ < 24h warning and 85%/ < 6h containment plus stricter inherited gates | Byte/object/WAL/queue/backup projection and safe reserve |
| SCL-NFR-12 | New tuned index/query change preserves response equality and ≤ 10% write-p95/WAL regression unless explicit approved trade-off | Before/after plans, write workload, statistics/artifact fingerprint |
| SCL-NFR-13 | Ordinary SQL-client pool ≤ 80; current 48/79, max 100/reserve 20; no hidden data source/worker/monitoring client; optional WAL senders/slots separately budgeted | Effective pool/session/sender/slot inventory with paired backup |
| SCL-NFR-14 | Original 1s pool/250ms lock/2s DB-RPC-provider-confirm/3s tx/10s request-action/30s lease/15s drain bounds | Complete waits/cancellation/stale apply |
| SCL-NFR-15 | Shared minute quota/actor/source allowance never multiplies by replicas; full-mix 300/150RPS ceilings accurately reported | Two-replica quota/boundary/counter lock evidence |
| SCL-NFR-16 | JWT 300s/normal single-flight 240–270s refresh; global/source/session limits respected, setup/cleanup counted |1,000-session refresh/login/logout arithmetic and observed outcomes |
| SCL-NFR-17 | Healthy eligible work p95 ≤ 5s/p99 ≤ 15s; recovery eligible classes get a turn ≤ 30s; ≤ 100 affected attempts ≥ 99% safe terminal/alerted review within 5m after recovery | Original cycle/hold/disposition denominator, review separate |
| SCL-NFR-18 | Original 10 distinct events/sec healthy and ≥ 20 local receipts/sec; claimed tier has no sustained required transport/sink backlog | Mutation multiplicity, repeats, confirm/intake/sink/fair drain |
| SCL-NFR-19 | One provider executor, all calls ≤ 5/sec/burst 2/concurrency 2; actual sandbox ≤ 0.5 new pay/sec/0.1 refund/sec/100 affected objects; full scan ≤ 24h | Complete account calls/possible sends/pagination/probe/scan |
| SCL-NFR-20 | Cache remains disabled without full Phase 08 gate; ≥ 2× primary-read projection/verification includes guards | Named read class/cost/distribution/benefit and approval |
| SCL-NFR-21 | Optional cache: zero public stale visibility/price/authority; exact permitted snapshot; valid trusted derived bytes/namespace | Hide/category/price/old fill/poison/restore collisions |
| SCL-NFR-22 | Optional cache: call ≤ 20ms/no retries, TTL 60..90s, entry ≤ 16KiB; bounded clients/fills/memory/fallback | Cold/outage/stampede/eviction/resource evidence |
| SCL-NFR-23 | Standby only after measured ≥ 40% eligible read cost/≥ 70% primary pressure 5m/2-of 3 miss; prototype ≥ 30% named cost reduction | Protected immutable read-volume/resource decision |
| SCL-NFR-24 | Optional replica never supplies current control authority; correct source/timeline/epoch/replay fence before fresh snapshot, action ≤ 2s | Lag/conflict/restore/primary outage/fallback scenarios |
| SCL-NFR-25 | Optional partition ≥ 30% named cost benefit and unchanged global identity/FK/grant/pruning/write/retention guarantees | Candidate/negative uniqueness/missing-partition/planning/backup proof |
| SCL-NFR-26 | One designated writer during adoption; no dual financial/event producer; compatible rollback keeps postwrite authoritative history | Quiesce/copy/count/digest/grant/lock/cutover/rollback matrix |
| SCL-NFR-27 | Original observable incident alert ≤ 60s, ≤ 10k active app series total, no forbidden telemetry; overhead latency/appCPU ≤ 10% | Instrument cardinality/privacy/export failure review |
| SCL-NFR-28 | Paired-v3 every 12h/≤ 30m job/≤ 60s skew; RPO ≤ 24h/RTO ≤ 2h through safe restore/provider/decision/source reconciliation | Actual timed isolated integrated restore at claimed data volume |
| SCL-NFR-29 | Retain 99.9% rolling 30d critical API objective; stress/short sandbox run is not hosted SLA proof | Actual ledger; hosted 30d evidence remains Not run when absent |
| SCL-NFR-30 | Every claim includes complete rates/samples/auxiliary work/cost/resource limits, Failed/Not run/Analytical and limiting bottleneck | Closed plan/summary plus protected full evidence/reviewer |

## Interpretation

SCL-NFR-07–10 are learning goals. Failure does not imply permission to change quotas/pools/hardware; it limits the supported tier. A healthy tier must satisfy latency, useful completion, invariants and required backlog together.

Warm/cold/failed runs are separate. Do not average percentile classes/runs; extend underfilled classes rather than report unstable p99. Report actual sample count and histogram resolution; complete client distributions determine benchmark gates.

Unexpected 429 within a declared valid quota plan, eligible 503/timeouts and dropped intended iterations cannot disappear. Deliberate stress above policy is a separately labeled outcome. A normal stock/version/domain conflict is reported as a business outcome, not useful successful purchase.

Original private financial read/transport/callback/refund targets remain binding. Existing isolated private commands ≤ 10/sec and genuine-provider probes are separate from large simulator workload. No synthetic result proves high-volume Stripe or capture→release capacity.

NoneAtDeclaredLoad in a report means no observed limit at that exact workload, not unlimited capacity. Hosted availability, physical failure-domain isolation and automatic failover remain later evidence/infrastructure.
