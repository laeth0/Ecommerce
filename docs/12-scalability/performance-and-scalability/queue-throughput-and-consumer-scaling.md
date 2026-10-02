# Queue Throughput, Consumers and Recovery Debt

## Original messaging scope

Retain lifecycle/refund notifications and private financial hints. Exact CloudEvents/source/ID/canonical bytes/route/schema/body limits and original outbox/inbox/receipt/parking semantics remain those of [Phase 09](../../09-event-driven-architecture/functional-requirements/event-contracts.md) and [Phase 10](../../10-microservices/functional-requirements/integration-events.md).

No Kafka, new event domain, external notification sink, stream/consumer-group product or broker partition layout is introduced. RabbitMQ competing consumers are the applicable model; do not import Kafka offset/partition guarantees into this topology.

## Rates and existing concurrency

Orders relay ≤ 10 publication attempts/sec/Commerce instance, one action/channel. Payments both-outbox relay shares ≤ 10/sec total, one pool/channel. Notifications uses its existing 2-connection intake/delivery budget, prefetch 10, one intake callback and one sender action. Financial-hint intake keeps its existing 2/r pool, prefetch 20 and at most two processing slots per replica. Preserve copied bounded bodies, exclusive channel/ack ownership and one DbContext per active operation.

At useful 125 coreRPS, the 5% submit fraction is 6.25 new submissions/sec if all are fresh eligible purchases. If simulator creation and confirmation each emit a lifecycle event, this alone can require 12.5 events/sec before processing/delivery/cancellation/replay. One 10-attempt/sec Orders relay cannot sustain that indefinitely, and a second replica also costs its full pool/resource envelope.

Compute actual event multiplicity by outcome and count publication repeats. Do not silently reduce the mix, disable required outbox hooks, omit lifecycle events or classify all 202s as useful sustainable throughput to reach a tier.

## Queue stability

```text
requiredPublicationRate = accepted mutation rate * mean events/mutation * observed publication amplification
netDrainRate = useful receipt completion rate - ongoing distinct eligible arrival rate
idealDrainSeconds = eligible backlog / netDrainRate, only when positive
```

Example:1,000 queued originals,20 useful receipts/sec and 10 new distinct events/sec imply 100s ideal drain. Confirm/lease/backoff/DB delay and attributed review add time. A larger queue/extra prefetch does not increase useful service.

Report outbox/inbox/delivery/parking count and oldest primary-clock age separately. Financial hint receipt is not financial convergence; duplicates are not new useful notifications. ManualReview/quarantine disposition is not sink success.

## Safe two-replica experiment

Under 79 planned connections, compare one/two existing Commerce worker copies and the same aggregate resources. Leases/source-ID uniqueness/sink atomicity prevent duplicate logical effects. Delivery order is not guaranteed across consumers; original notification semantics permit historical facts/corrections independently.

RabbitMQ [consumer behavior](https://www.rabbitmq.com/docs/consumers) describes competing consumption. Retain exact channel ownership, manual ack and bounded prefetch; never process parallel callbacks using a shared non-thread-safe DbContext/channel.

Payments remains one service/executor/relay. Do not add a second financial executor or another provider quota. Increased wake/hint traffic cannot reset its ten-observation/five-minute cycle.

## Backpressure and storage

Main queues retain 10,000 ready messages/64MiB, delivery limit 20, reject-publish and reliable at-least-once DLX; parking 1,000/16MiB, delivery−1. These are not exact whole-node/quorum-log/inflight-memory bounds.

Queue/parking 80% alerts. Broker free disk < 2GiB warns; < 1GiB or resource alarm blocks publication. PostgreSQL event-data/index budget remains the declared 8GiB additional measurement budget from Phase 09, with WAL/temp/archive overhead separate.

Apply the stricter inherited author-store gates:70% utilization or < 24h projected horizon warns; 85% or < 6h contains new affected admission. Original event-budget ≥ 90%/primary free disk < 5GiB containment also remains binding. Never delete original outbox/inbox/receipt/dedup/correction/decision history.

Preserve required financial observation/compensation/recovery capacity when optional replay/load is stopped. A broker outage is tolerable only while primary retention/backup remains safe.

## Queue-layout gate

A new layout is only a proposal if one named existing queue remains saturated after owner query/consumer/relay tuning, useful arrival/service/confirm/disk evidence identifies the queue as bottleneck and added consumer service on the current queue cannot solve it.

Proposal must prove: stable original identity/bytes/dedup namespace, revised route authorization, per-aggregate ordering needs, no simultaneous independent sink completion, destination/main/parking bounds, total connections/channels/pools, migration/backfill/cutover/rollback and preserved replay. It cannot silently change frozen v1 event routing or introduce exactly-once delivery.

No such production layout is chosen here. Analytical comparison of queue-by-domain, hash-by-aggregate and competing consumers states their hot-key/ordering/operating costs. A single hot aggregate stays hot even across many partitions.

## Required measurements

Repeat original 10 events/sec healthy workload and ≥ 20 local receipts/sec target with actual eligible original lifecycle events. Larger queued-history shape samples are isolated transport-only input and never admitted as verified financial facts. Genuine refund notifications remain small original-provider probes.

Then test ≤ 1,000 distinct original backlog, two-minute broker/consumer interruption, duplicates, reordering and parking pressure. Require complete five-minute disposition with reviewed resume where needed, separate actual delivery success, fair recovery turns and no sustained required-work growth at a claimed healthy tier.
