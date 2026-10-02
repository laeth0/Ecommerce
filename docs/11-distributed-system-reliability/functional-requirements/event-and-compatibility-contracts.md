# Message Handling and Compatibility Contracts

## Frozen contracts

Retain [Phase 09 envelopes/registries](../../09-event-driven-architecture/functional-requirements/event-contracts.md) and [Phase 10 financial hint contract](../../10-microservices/functional-requirements/integration-events.md). Phase 11 adds no event type, source, route, schema field or public notification API.

Keep CloudEvents 1.0.2 structured JSON, lexically sorted compact UTF-8 canonical bytes/SHA-256, exact source+event ID dedup, original event occurrence times and original fact/audit identities. Refund facts remain individually emitted; financial-change hints may describe a version but never replace those historical fact notifications.

Private command/result/receipt/capabilities schemas remain closed v1 objects. New optional fields/enums are not silently compatible with closed readers. Any later wire change needs reviewed reader policy or v2 and consumer-before-producer deployment. Scheduling metadata and owner-local tooling schema do not appear in existing v1 payloads.

## Transport boundaries

| Stage | Commit/ack rule | Lost response / crash rule |
| --- | --- | --- |
| Business producer | Required outbox with original mutation/fact/audit | Rollback all if outbox cannot commit |
| Relay claim | Persist lease/token/count before broker I/O | Expired token reclaimed; original body unchanged |
| Publish | Persistent mandatory message, positive confirm and no return before Published | Unknown confirmation repeats original bytes |
| Intake | Validate bounded envelope/source/mapping; commit inbox/work or quarantine before manual ack | Duplicate redelivery compares bytes; no in-memory-only acceptance |
| Local sink | Original dedup receipt and completion atomically | Crash rolls back or retains both |
| Protected replay | Original operation authority/receipt/audit, canonical owner bytes | Retry original operation, never rewrite source envelope |

Publisher confirms and consumer acknowledgements certify different boundaries; neither proves a business effect at another owner. See RabbitMQ [confirms and acknowledgements](https://www.rabbitmq.com/docs/confirms).

## Existing broker configuration

| Main queue → parking queue | Required limits |
| --- | --- |
| commerce.notifications.v1 → commerce.notifications.parking.v1 | Main 10,000 messages /64 MiB, delivery limit20; parking1,000/16 MiB, delivery limit−1 |
| commerce.financial-changes.v1 → commerce.financial-changes.parking.v1 | Same limits; routing key payments.financial-changed.v1 |

Both main queues retain quorum, durable persistence, reject-publish overflow and explicitly configured reliable at-least-once dead-lettering with the pinned release's required feature flags. Parking queues are durable quorum with reject-publish; no TTL/drop-head/automatic parking-drain loop. Check effective broker policy/arguments, not only a proposed configuration file. RabbitMQ documents the [at-least-once DLX prerequisites and costs](https://www.rabbitmq.com/docs/quorum-queues).

Retain existing channel/prefetch bounds. Payments' original refund and financial-hint relays share one pool/channel and at most ten publication attempts/second. Broker reconnect uses bounded delay and does not consume an event attempt until claim. No application delivery/reconnect layer multiplies publication.

## Input validation and poison behavior

Envelope body ≤8,192 bytes, JSON depth≤8; metadata≤4,096 bytes, ≤16 names, each≤64 characters and depth≤4. Reject duplicate keys/noncanonical IDs/unsafe integers/unsupported schemas and unknown source/type/route pairs. Event time more than 30 seconds ahead of primary time is invalid; a valid historical event has no age cutoff.

Persist only bounded quarantine metadata/digest/safe parsed locators. Do not copy malformed bodies into logs or incidents. Valid canonical owner bytes are retained at the source. A poison delivery is not requeued forever; durable quarantine or safe broker parking comes before its acknowledgement. If the durable sink cannot commit, leave the delivery recoverable through bounded redelivery/backpressure.

Parking intake is an individual protected operation with source inspection and original owner comparison. Invalid records may be attributed DiscardInvalid; valid records require original replay/SkipValid policy. “Empty queue” alone is not an exit criterion; account for each message with canonical sink/quarantine/operation evidence.

## Financial hint processing

1. Validate event mapping against immutable Commerce accepted mapping before inserting local FK-linked work.
2. Deduplicate source/ID and bytes. Record highest hinted version as diagnostic information.
3. A genuinely new deduped hint above the last actual owner-observed version schedules existing owner work and advances the local hint row version.
4. Transfer/wake clears Pending only under the matching local version. A concurrent newer hint remains pending.
5. Query Payments evidence; update actual owner-observed version from authenticated evidence only.
6. If a hinted version is ahead of the actual owner, quarantine SourceMismatch; do not promote authoritative evidence to the hint. A later legitimate lower hint can still wake work when above actual observed version.

Missing/delayed events are covered by existing bounded owner polling and retained financial scan. Duplicate hints/unchanged facts never reset recovery budgets. Event-induced work obeys the same cycle deadlines and account quota as polls.

## Restore, replay and rollout

Before postrestore intake, compare retained broker messages to restored canonical source via protected owner queries. Missing/conflicting source is unresolved restore evidence, not permission to create outbox rows. Keep original inbox, dedup, operator receipt, sink and tombstone history; no automatic deletion.

Activate new scheduling profile only after compatible readers/writers are deployed and quiesced metadata backfill is reviewed. It changes retry due-time selection, not frozen bytes. Rolling compatible services support the original v1 contracts; breaking reader deployment is an experiment failure, not a reason to bypass schema validation.
