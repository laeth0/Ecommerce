# Delivery and Capacity

**Status:** reference workload and resource gates, unmeasured. Inherit the [Phase 08 baseline](../../08-production-ready-monolith/performance-and-scalability/baseline-and-capacity.md) and caching gate.

## Resource envelope

Keep aggregate monolith application budget 2 CPU/2 GiB and primary 2 CPU/4 GiB; messaging work shares that application budget. Keep the declared observability budget. Add one broker allocation of 2 CPU/2 GiB and 10 GiB persistent disk; report it separately. A developer machine without this envelope may use a smaller declared experiment but cannot claim the reference result.

| Added role | PostgreSQL pool maximum | Runtime bound per enabled instance |
| --- | ---: | --- |
| Orders relay | 1 | One claim/publish action at a time, ≤10 publications/sec |
| Payments relay | 1 | One claim/publish action at a time, ≤10 publications/sec |
| Notifications intake/sender | 2 shared | One intake callback and one sender action; prefetch 10 |

Add **4r** pools to Phase 08's conservative **26r+11** total: new total **30r+11 = 41 at r=1, 71 at r=2**. This counts monitoring, migration, operator and backup pools already budgeted; protected replay reuses operator capacity. A third replica plans 101 and is prohibited in this envelope. Normal maximum remains 80 with 17 reserved_connections plus three superuser slots. Do not instantiate a pool per event type, schema or retry.

One long-lived AMQP connection per owner relay plus one per Notifications instance: three per instance, six at two instances. Each publisher has one exclusively owned publishing channel; Notifications has one consumption channel. One additional protected recovery connection/channel is permitted, so planned active total ≤7. No connection/channel per message.

Due-work passes visit ≤100 candidates per owner/class with no unbounded materialized result. Body copies are ≤8 KiB. Prefetch 10 bounds outstanding normal deliveries per consumer; an intake callback processes one at a time. Broker/DB health and reconnect do not allocate new hidden pools or duplicate workers.

## Reference experiments

1. Repeat Phase 08's 100-user, one-inflight/one-second-think workload: original 10,000 products, 100 categories, 10,000 Customers and 100,000 historical Orders; identical endpoint mix, two-minute warm-up, ten-minute measurement, three runs and ≥1,000 samples/class. Retain normal 300-second access-token refresh and auxiliary auth/quota reporting.
2. Enable producer hooks and notification workers. Simulator Success remains isolated Development and 100ms; actual Stripe calls retain the original small probe/account limits. Compare write latency, DB/WAL cost and healthy notification lag. Original APIs must still meet all Phase 08 targets.
3. Create a declared event-history fixture conceptually equivalent to 200,000 Order events and 10,000 verified refund-event shapes, with realistic byte distribution plus maximum-size boundaries. This is a future load dataset specification, not a request to create fixtures now. Synthetic financial messages are confined to an isolated broker/database benchmark and cannot enter live financial owners or be represented as actual provider facts.
4. Run sustained 10 new events/sec for ten minutes, ≥1,000 samples, then measure service rate against a bounded eligible backlog. Require ≥20 local receipts/sec on one enabled instance. Offer duplicate, delayed and reversal-before-success deliveries separately and retain distinct-event/duplicate counts.
5. Pause broker or consumer for two minutes, affecting ≤1,000 actual distinct events in the fault run. Restore, perform any required scoped review/resume, then measure five-minute disposition and catch-up. A separate 1,000-event queued backlog run at service 20/sec and continuing arrival 10/sec has an ideal drain time of 100 seconds; measured confirmation, retry and review delays still count.
6. Repeat with two worker instances under the 71-connection budget. Demonstrate uniqueness/fairness and controlled saturation; no automatic claim that throughput doubles.

All event-rate generators respect owner/version locks and cannot bypass invariants merely to hit a rate. Do not load-test Stripe or simulate successful provider refunds in the actual sandbox financial schema.

## Backpressure and storage gates

Normal queue limit 10,000 ready messages/64 MiB ready body bytes; parking limit 1,000/16 MiB. Reject publication on overflow; never drop-head, expire work or silently discard it. These are broker queue bounds, not exact whole-node disk or in-flight-memory limits; record overshoot, unacknowledged bytes and quorum log overhead. Outboxes remain the durable source.

Allocate an additional **8 GiB measured PostgreSQL event-data/index budget** and record WAL, temporary I/O and backup impact separately. Estimate from actual body distributions; 8 KiB is a maximum, not an average. At 70% warn/review growth; at 85% urgently reduce optional replay/load and investigate. At ≥90% or primary free disk <5 GiB, contain new purchases/optional fulfillment through existing maintenance controls before exhaustion. Preserve capacity for required observation, compensation and recovery; never delete financial/event evidence or disable producer atomicity.

Broker free disk <2 GiB warns; <1 GiB or resource alarm blocks relay publication until recovered. Queue/parking ≥80% capacity alerts. PostgreSQL outbox/inbox unresolved data is never deleted to clear a broker alarm. An outage can be tolerated only while primary capacity remains safe; unlimited duration is not promised.

At actual storage >85%, oldest unresolved work >15 minutes, or inability to meet backup/recovery timing, do not approve dataset/replica growth. Measure plans, write amplification, relay throughput, consumer service and operator capacity; propose a reviewed retention/topology change in the appropriate later phase.

## Tuning order

Measure arrival versus completion, then DB locks/pool wait/WAL/index cost, broker confirm latency/blocked alarms, consumer/sender service and oldest age. Resolve slow queries and fairness before raising concurrency. Do not remove parent guards, use stale cache authority or lengthen stock/payment windows for throughput. No partition, Redis, Kafka, extra broker, cache or service extraction is introduced here.
