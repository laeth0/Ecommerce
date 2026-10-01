# Microservices Quality Targets

**Status:** implementation gates, not observed results. Preserve Phase 08/09 and Phase 07 source-specific targets. Measurement methodology/resources are in [capacity](../performance-and-scalability/capacity-and-service-budgets.md).

| ID | Requirement | Required target/evidence |
| --- | --- | --- |
| MS-NFR-01 | Exclusive ownership | Zero routine cross-database access or provider material in Commerce; negative grant/network inspection |
| MS-NFR-02 | Financial correctness | Zero duplicate ordinary external effects, oversell, unbacked confirmation, lost admitted refund allocation or event-driven authorization |
| MS-NFR-03 | Durable acknowledgement | Every 202 maps to owner committed intent; private unknown outcomes retain original identity and lookup recovery |
| MS-NFR-04 | Confirmation safety | One terminal local decision, at most one consume and release proof; unknown holds never expire into permission |
| MS-NFR-05 | Authority | Zero newly unauthorized commands; approved pre-revocation immutable intent may complete afterward |
| MS-NFR-06 | Public reference latency/throughput | All MON-NFR-01–10 targets at original mix/resources; relevant p95 regression≤10% from Phase 09 comparison |
| MS-NFR-07 | Private command without provider I/O | p50≤100 ms, p95≤300 ms, p99≤750 ms at ten original commands/sec, ≥1,000 observations/run, three declared isolated runs |
| MS-NFR-08 | Remote financial GET/history | Preserve PAY-NFR-01/02: complete public response p50≤100 ms, p95≤300 ms, p99≤750 ms; declared sanitized retained data workload, ≥1,000/class/run |
| MS-NFR-09 | Healthy integration scheduling | Owner commit→hint inbox p95≤2s/p99≤5s; acceptance→remote binding p95≤5s/p99≤15s when gates/source/dependencies eligible |
| MS-NFR-10 | Confirmation handoff | Verified eligible capture→local decision→owner resolution/release p95≤5s/p99≤15s in genuine small sandbox probes; disclose sample count, no extrapolated load claim |
| MS-NFR-11 | Fault disposition | At ≤100 affected attempts, ≥99% legitimate terminal or explicitly alerted ManualReview within five minutes after dependency recovery; report review separately from success |
| MS-NFR-12 | Bounds | RPC≤2s, action/request≤10s, lease30s, shutdown≤15s, ten observations/cycle, strict payload/admission limits; no unbounded queues |
| MS-NFR-13 | Primary capacity | All planned ordinary pools≤80; one/two Commerce replicas plan48/79; reserve20/100 retained; measured combined peaks and no hidden pools |
| MS-NFR-14 | Provider capacity | Existing account-wide one-executor 5/sec, burst2, concurrency2; no Stripe load experiment; retained full scan≤24h at supported volume |
| MS-NFR-15 | Degradation | Payments outage preserves unrelated Commerce availability; valid affected requests fail boundedly and accepted purchases remain recoverable |
| MS-NFR-16 | Observability | Actionable unresolved hold/command/parking alert≤60s; trace/metric/log correlation without PII; ≤10,000 active app metric series total |
| MS-NFR-17 | Security | mTLS authentication and operation allowlists; wrong/expired/revoked/untrusted identity fails; no public internal routes or management |
| MS-NFR-18 | Release compatibility | Consumer/producer independent compatible deploy/rollback preserves every retained command/receipt/event and cursor |
| MS-NFR-19 | Migration | Full owner inventory, original identity/byte/equation reconciliation and zero overlapping provider executors |
| MS-NFR-20 | Integrated disaster recovery | Both-database authenticated bundle every12h, complete≤30m, skew≤60s, RPO≤24h/RTO≤2h including provider/decision/event reconciliation |
| MS-NFR-21 | Retention/privacy | No automatic deletion of original financial/coordination evidence; zero forbidden sensitive fields in telemetry/events; measured retained growth |
| MS-NFR-22 | Availability objective | Retain99.9% rolling30-day critical API objective; workflow convergence tracked separately; actual hosted evidence remains Phase13 |

## Measurement and consistency

Measure from complete client-observed response and primary owner commit-intent timestamps. Include queue/connection/mTLS/pool/lock wait, failures/timeouts and all offered traffic. Do not average percentile classes/runs or count ManualReview/quarantine as healthy completion. Report unfinished count/oldest age and eligible count by deadline. Public acceptance is not settlement or notification completion.

Each database has strong local commit rules. Monetary projections/facts/allocations and Inventory/Order decision remain authoritative locally; coordination/hints/notifications are explicitly eventual. A financial hold is conservative unavailable permission, never stale positive authority. Physical server failure can stop both services; this phase provides no cross-zone HA or globally atomic snapshots.

Private sandbox and controlled load results cannot establish a public production SLA. Failed targets block the relevant exit gate; missing infrastructure means Not run. Minimum safe recovery and security must be implemented in this phase before Phase 11 experiments.

PAY-NFR-03–05 acceptance/replay/callback/throughput targets remain binding. The read/transport experiments here do not establish high-volume new-refund acceptance or complete Stripe capacity. Where genuine probes cannot supply the required sample count and no separately approved adapter is available, mark that capacity evidence Not run; never substitute simulated verified financial facts or silently weaken the inherited target.
