# System Design Prerequisites & Concepts to Learn

Study [Phase 09 prerequisites](../09-event-driven-architecture/system-design-prerequisites.md), owner locks, immutable financial facts, refund reservations/corrections and the complete restore gate first.

## Learning sequence

| Before | Concepts | Exercise and understanding gate |
| --- | --- | --- |
| MS-E1 | Bounded contexts, ownership, process versus data versus physical isolation | Draw every Payments table/FK and producer/consumer. Identify which process and credential can access each datum after cutover |
| MS-E1 | Public API versus private service contract; user versus workload identity | Explain why a service certificate cannot prove a Customer/Admin role and why a UUID is not authority |
| MS-E2 | Local ACID, lost cross-owner atomicity, network ambiguity | Draw commit-before-response crashes in both services; identify the persistent identity that a retry uses |
| MS-E2 | Orchestration versus choreography; compensation versus rollback | Walk a late capture with expired stock. Show the fallible refund obligation without restoring consumed stock |
| MS-E2 | Business holds, fencing, terminal decisions, safety versus availability | Race refund/confirmation/cancellation; prove a timeout cannot release a hold or authorize fulfillment |
| MS-E2 | Authority linearization and accepted work | Race account revocation with Commerce authorization; distinguish a new denied request from previously authorized durable work |
| MS-E3 | Strangler migration, expand/contract, single writer, complete reconciliation | Plan exact copy, activation and credential revocation; define safe rollback before and after new writes |
| MS-E4 | Independent snapshots, recovery epochs, orphan effects | Restore one database further back than the other; explain why provider metadata cannot recreate accepted Order authority |
| MS-E4 | Deadline propagation, connection/RPC budgets, correlated signals | Allocate an action deadline across local commits and private I/O without holding locks |
| MS-E5 | Contract replay, partial failure and capacity evidence | Crash each step, retain counts and timing; distinguish successful admission, capture, confirmation and notification |

## Concepts in practical terms

**Service extraction:** moving a process is insufficient. Exclusive data writes, authenticated contracts and independent compatible deployment establish the boundary.

**Eventual consistency:** separate valid local commits can temporarily disagree. Every admitted intermediate state needs an owner, durable next step and visible unresolved outcome.

**Idempotency:** distinguish HTTP command ID, public actor/key, payment/refund/case UUID, provider mutation key and event source/ID. Each protects a different boundary; none makes all boundaries atomic.

**Compensation:** refunds are new external actions and can fail. Existing successful/outstanding refunds count toward the original obligation. [Compensating transactions](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction) explain why compensation cannot blindly restore earlier shared state.

**Confirmation hold:** a durable application rule blocks conflicting monetary application while Commerce decides. It is not an open SQL transaction, a worker lease or a stock reservation extension.

**Snapshot recovery:** per-database consistency does not prove a consistent multi-service point. Reconciliation and provider evidence are part of restoration.

## Primary references

- [Microsoft microservice data considerations](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations)
- [Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [ASP.NET Core certificate authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/certauth?view=aspnetcore-10.0)
- [PostgreSQL exported snapshots](https://www.postgresql.org/docs/18/functions-admin.html#FUNCTIONS-SNAPSHOT-SYNCHRONIZATION)
- [RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms)
- [OpenTelemetry context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)

Do not introduce a workflow framework, service mesh, broker command network or automated test framework just to demonstrate vocabulary. Implement the smallest explicit protocol that satisfies the documented races, then deepen failure experiments in Phase 11.
