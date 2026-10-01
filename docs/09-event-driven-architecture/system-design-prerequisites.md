# System Design Prerequisites & Concepts to Learn

Complete the [Phase 08 prerequisites](../08-production-ready-monolith/system-design-prerequisites.md), owner lock protocols and financial correction model first. For each epic identify the local commit, uncertain boundary, durable progress, retry identity and authority.

| Before | Concepts | Required design exercise |
| --- | --- | --- |
| EVT-E1 | Domain events versus integration events; dual writes; immutable historical facts | Draw crashes before/after owner commit and explain why publication intent shares that commit |
| EVT-E2 | Persistent messages, durable/quorum queues, mandatory routing, publisher confirms, leases | Explain why a lost confirm repeats the same event and why a confirm is not notification completion |
| EVT-E3 | Inbox deduplication, manual acknowledgement, idempotent local effects, eventual consistency | Deliver one event ten times; draw the uniqueness key and the receipt/completion transaction |
| EVT-E3 | Aggregate versions, gaps, out-of-order history, corrections | Deliver reversal before success and show truthful history without changing refunded money |
| EVT-E4 | Retry budgets, parking versus quarantine, replay, retention, RPO | Explain what survives database restore and how a newer retained broker message is contained |
| EVT-E5 | Queue arrival/service rates, resource isolation, lag SLIs, trace links | Calculate backlog growth at 10 events/sec during a two-minute outage and measure actual catch-up |

## Reading

- [Transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html): local intent and the remaining duplicate boundary.
- [CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md) and [JSON format](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md): envelope identity and structured encoding.
- [RabbitMQ confirms](https://www.rabbitmq.com/docs/confirms): distinguish publisher confirmation from consumer acknowledgement.
- [Quorum queues](https://www.rabbitmq.com/docs/quorum-queues), [dead lettering](https://www.rabbitmq.com/docs/dlx) and [queue bounds](https://www.rabbitmq.com/docs/maxlength): evaluate persistence, poison handling and blocked delivery.
- [Official .NET client guide](https://www.rabbitmq.com/client-libraries/dotnet-api-guide): channel ownership, async delivery and body-memory lifetime.
- [PostgreSQL locking](https://www.postgresql.org/docs/18/explicit-locking.html): prove claim and owner lock paths stay acyclic.

## Understanding gate

Before building, demonstrate on paper: owner rollback creates no event; lost broker confirmation can duplicate publication; lost consumer acknowledgement does not duplicate the local receipt; unknown financial outcome is not a success event; replay cannot change authority; and a one-node quorum queue cannot provide node-failure availability.

Keep experiments isolated and bounded. These are future manual/evidence scenarios, not instructions to add automated tests or dependencies now.
