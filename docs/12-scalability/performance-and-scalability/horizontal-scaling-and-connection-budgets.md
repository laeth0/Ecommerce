# Horizontal Scaling and Connection Budgets

## What is being compared

Compare one/two Commerce replicas under the same aggregate application 2vCPU/2GiB allocation: Commerce 1.5CPU/1.5GiB divided across its replicas, Payments 0.5CPU/0.5GiB one process. Primary 2CPU/4GiB, broker 2CPU/2GiB/10GiB volume and observability 4CPU/4GiB remain separately declared.

More replicas can improve request distribution and process isolation, but do not create CPU, global quota, single-row parallelism or provider capacity. A shared host's disk/scheduling/noisy-neighbor effects must be recorded.

## Complete connection inventory

| Role | Planned maximum |
| --- | ---: |
| Commerce API incl internal decision endpoint |20r |
| Identity cleanup |2r |
| Inventory expiry |2r |
| Checkout/commands/hold/simulator/quote cleanup |2r |
| Orders relay |1r |
| Notifications intake/delivery |2r |
| Financial-hint intake |2r |
| Payments API incl callback/private reads/commands |3 total |
| Exclusive Payments executor/inbox/barrier/decision/scan |2 total |
| Payments both-outbox relay |1 total |
| Monitoring |2 total |
| Serial migration authority |1 total |
| Protected operators |4 total |
| Paired backup coordinators/dumps |4 total |

Total `31r+17` =48/79 for r=1/2. At r=3 the 110 plan exceeds ordinary 80 and is prohibited. max_connections 100 reserves 17 non-superuser plus 3 superuser; runtime/monitor/backup cannot consume those reserves.

Inspect actual Npgsql data sources, connection-string aliases, worker processes, probes and tooling. Pools do not become free because currently idle. Reuse one API data source/owner and existing dedicated bounded worker sources; no new pool per module/event/retry/circuit.

Optional replica/cache/partition prototypes have a separately reviewed envelope before activation. Count added ordinary SQL clients in the primary connection plan. PostgreSQL 18 WAL senders and replication slots have separate limits; budget their process, network and retained-WAL costs alongside server maintenance. See the [replica budget](../database/read-replicas-and-consistency.md#pools-and-wal-resource-plan). No undocumented “r=2 plus another monitoring/pool” variation.

## Execution and network

Retain Commerce ≤ 100 executing public requests/r and two command/two financial-read RPC slots/r, Payments ≤ 32 HTTP executions total with callback ≤ 8 within 32, two existing executor action slots and one account executor.

Retain pool 1s/lock 250ms/command 2s/transaction 3s/RPC 2s/public/action 10s/lease 30s/drain 15s. Network/backoff holds no DB connection. Long-lived bounded HTTP/broker connections are reused and recycled for certificate rotation.

Breakers remain three fixed process-local classes; another replica has another circuit memory but no new business allowance. Global quota counters/provider gate/epochs/holds remain durable at owners. All actual provider probes/reads share 5/sec/burst 2/concurrency 2, regardless of caller count.

## Stateless requests with durable ownership

No sticky session is required for JWT/refresh, cart/version, idempotency receipts or cursors; shared authoritative state and compatible signing/configuration keys apply. Session authority is checked on primary each protected use.

Workers claim existing rows with lease/token/version and fair continuation. Additional worker copies cannot both apply a stale result. Original first-send/key/window handles external uncertainty; lease expiry alone does not fence a provider process.

During a local deployment comparison, permit no excess overlapping worker/pool envelope. A temporary third full Commerce process would exceed 110 connections even if only two receive client traffic. Use protected stop/start under existing maintenance semantics; overlapping rolling infrastructure is Phase 13 unless a new valid overlap budget is approved.

## Bottleneck diagnosis

| Observation | Likely limit / next measurement |
| --- | --- |
| CPU/GC high, DB low | Serialization/hash/log overhead, per-route allocation/profile |
| Pool waits high, executing DB low | Held/long transactions, hidden pool alias, action/network ownership |
| Lock wait high on stock/counter | Serialized hot owner/counter; useful turn/transaction duration |
| DB disk/WAL high | Index writes, broad query, retention/vacuum/checkpoint interference |
| Broker confirms/alarms high | Queue/quorum storage/network and relay capacity |
| Provider executor backlog high | Account/concurrency/call amplification/scan budget |
| More replicas raise latency | Primary/CPU oversubscription or duplicated work/connection pressure |

Before increasing pools/resources, keep query/data/mix fixed and demonstrate which limit improves. Count valid timeout/rejection and incomplete work, not only CPU averages.

## Larger envelope gate

A concrete new profile must name additional CPU/RAM/storage/network, every primary/standby/tool connection, executor/broker/telemetry bounds, auxiliary work and restore/cost impact. Keep user-authorized infrastructure scope and actual available machine resources separate.

Admit only when the measured bottleneck requires it, no correctness/authority/resource violation occurs, healthy goals pass and recovery still fits. A changed envelope invalidates an apples-to-apples speedup claim; report normalized useful throughput per appCPU, primaryCPU and allocated GiB beside total throughput.

No PgBouncer is introduced. If actual connection churn later justifies it, evaluate transaction/session pooling restrictions, prepared statement/reset/temporary-table/advisory-lock behavior and Npgsql compatibility before a dependency decision. PgBouncer's [feature matrix](https://www.pgbouncer.org/features.html) documents pooling limitations; a proxy does not remove logical SQL work or stock serialization.
