# Infrastructure Quality Targets

**Status:** implementation/release gates; none are achieved by documentation. Inherited domain/private/provider/latency/recovery targets remain binding.

| ID | Measurable requirement | Evidence |
| --- | --- | --- |
| INF-NFR-01 | Zero oversell, duplicate original movement/financial effect, unbacked Confirmed or lost accepted receipt/decision | Owner invariants under release/fault/restore |
| INF-NFR-02 | Zero current authorization/publication/price or ownership violations; no new public/private wire shape | Original contract/negative access proof |
| INF-NFR-03 | Original 23h first-send window, ten-observation/300s cycles, stored jitter/due/count and nonexpiring hold preserved | Original identities/bytes/guard inventories |
| INF-NFR-04 | One active provider executor/process; all calls ≤5/sec, burst2, concurrency2, call≤2s; genuine drill≤100 objects | Old-egress fencing and account call inventory |
| INF-NFR-05 | Inherited healthy per-class p50/p95/p99, Reference100≥50 useful RPS and unexpected eligible failures<0.5% | Three complete declared runs, ≥1,000 samples/class |
| INF-NFR-06 | Phase 12 reached tier/resources remain measured; 1,000-user target and 10k/100k analytical status not upgraded by Kubernetes | Complete workload/source/auth/quota report |
| INF-NFR-07 | Original work p95≤5s/p99≤15s, fair eligible turn≤30s, full retained financial scan≤24h | Original work/debt/scan denominator |
| INF-NFR-08 | Ordinary SQL plan≤80, baseline48/79; max100/reserve20; actual full Commerce processes≤2 including terminating | Effective pool/process inventory |
| INF-NFR-09 | Original app2CPU/2GiB, primary2CPU/4GiB, broker2CPU/2GiB and diagnostics4CPU/4GiB declared separately from new platform overhead | Host allocatable/admitted request/limit budget |
| INF-NFR-10 | No unbounded Pod/task/pool/body/queue/telemetry/generator growth; all additional resources explicitly admitted | ResourceQuota/limits and actual high-water marks |
| INF-NFR-11 | Zero public exposure of private mTLS/health/metrics/database/broker/cluster/diagnostic APIs | Socket/route/negative-source checks |
| INF-NFR-12 | TLS backend CA/SAN verified, original direct private role/EKU/epoch validation; no trust-skip or forwarded-cert authority | Wrong peer/expiry/revocation cases |
| INF-NFR-13 | Exact callback raw body≤262,144 bytes, signature header≤4,096 bytes, no compression/rewrite/retry; original verification/receipt rules | Signed original byte comparison |
| INF-NFR-14 | Edge total retail budget≤10s, no whole-request retry/hedging/mirroring; private RPC2s unchanged | Actual outbound attempt/time count |
| INF-NFR-15 | Effective source and shared quota policy preserved; no forged header or replica multiplication | Trusted-hop/source/actor/boundary evidence |
| INF-NFR-16 | Immutable digest-pinned images/toolchains/actions and exact source provenance; zero secret in build/artifacts | Artifact/SBOM/provenance/scanning |
| INF-NFR-17 | Reachable unresolved high/critical vulnerability blocks release unless explicit bounded mitigated risk acceptance | Advisory/exposure/review record |
| INF-NFR-18 | Untrusted PR/build has zero runtime/cluster/provider/backup secret authority; protected approval binds exact target/plan | Permission and trigger-negative checks |
| INF-NFR-19 | One serialized release/migration operating lock; owner migration one connection, bounded existing DB waits | Concurrent release/job interruption |
| INF-NFR-20 | Graceful application drain≤15s; termination grace30s includes hook/drain; startup allowance120s and primary readiness probe≤1s | Actual lifecycle/probe timings |
| INF-NFR-21 | Readiness checked every5s, 2 failures withdraw readiness; liveness10s/3 failures checks responsive process only | Probe/dependency/traffic timeline |
| INF-NFR-22 | Compatible code release goal maintenance≤600s including rollback verification; overrun remains contained | Actual outage/start/reopen timestamps |
| INF-NFR-23 | Rolling exercise has zero excess actual process/pool/CPU allocation and original mixed-version compatibility | Stuck termination and protocol cases |
| INF-NFR-24 | HPA disabled by default; optional Commerce min1/max2, no Payments HPA, actual-process/termination interlock | Missing metric/churn/start/scale evidence |
| INF-NFR-25 | Current secret access outside Git/CI runtime dump; least-privilege owner/RBAC and at-rest encryption verified | Secret/Pod creation/role/host negative checks |
| INF-NFR-26 | Original certificate renew≤30d remaining/alert≤7d/expiry fail closed; revocation terminates affected sessions/connections | Trust/key rotation and retained source retrieval |
| INF-NFR-27 | Zero automatic deletion of retained stock/money/audit/receipt/event/tombstone history; every PV/path/grant inventoried | Node/cluster recreation and disk pressure |
| INF-NFR-28 | Paired-v3 every12h, full job≤30m, snapshot skew≤60s, four connections; ≥14 complete pairs/7d off-host | Authenticated archive/decryption/read-back |
| INF-NFR-29 | RPO≤24h from older usable bound; RTO≤2h through safe integrated reopening, not volume/database startup | Actual timed asymmetric restore |
| INF-NFR-30 | Observable incident detected≤60s; ≤10k application series; original privacy/sampling/retention and bounded platform signals | Telemetry cardinality/drop/alert drill |
| INF-NFR-31 | Retain99.9% rolling30d critical API objective; planned maintenance/valid failures count; local single-host run is no HA/SLA proof | Actual ledger/window and gaps |
| INF-NFR-32 | Every claim includes actual versions/resources/limits/outcomes and Passed/Failed/Not run/Analytical; no paid/cloud resource activation | Protected evidence/approval and final exit |

## Interpretation

Targets constrain supported operation. A failed release/HPA/restore experiment can remain safely contained and still fail its time objective. Faster progress never overrides safety.

Probe intervals are configured goals; actual withdrawal/restart includes kubelet/controller/endpoint/data-plane delays and must be measured. Keep financial dispatch gating independent from generic Pod readiness.

Original pool1s/lock250ms/DB2s/transaction3s/request-action10s/lease30s remain. Quotas are primary shared counters. Diagnostic/resource pressure cannot authorize stale reads or drop original evidence.

No new cloud availability, automatic failover or zero downtime is promised. A later physical hosting or resource-envelope proposal requires explicit reviewed scope and evidence.
