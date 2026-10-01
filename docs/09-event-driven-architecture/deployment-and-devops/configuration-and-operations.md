# Configuration and Operations

**Status:** declarative operating requirements. No broker, Compose file, package, account, policy or executable configuration is created now.

## Version and secret policy

Retain the established runtime/database versions. Primary RabbitMQ documentation checked on 2026-10-01 lists stable 4.3.6 with community support through 2026-11-30; treat that as the reviewed baseline, recheck support before implementation and pin an approved supported stable patch. Pin a compatible official RabbitMQ.Client 7.x and Erlang/OTP pair; record exact artifact/configuration fingerprints and demonstrate all required policies. No preview release or implicit upgrade. [RabbitMQ release information](https://www.rabbitmq.com/release-information)

Use private AMQPS with hostname/certificate validation; separate owner publisher, notification consumer, protected recovery and topology-management credentials. Keep secrets and connection details in existing protected configuration/secret facilities, outside Git, command history, logs and operating reports. No guest/default account or shared financial credentials.

## Required topology

| Resource | Definition |
| --- | --- |
| Vhost | One private project/environment-specific vhost; no cross-environment binding |
| commerce.orders.v1 | Durable topic exchange; exact orders.lifecycle-changed.v1 binding |
| commerce.payments.v1 | Durable topic exchange; exact payments.refund-fact.v1 binding |
| commerce.notifications.v1 | Durable, nonexclusive, non-auto-delete quorum queue; both explicit bindings |
| commerce.parking.v1 | Durable direct dead-letter exchange |
| commerce.notifications.parking.v1 | Durable quorum queue bound with notifications.poison.v1 |

One member per quorum queue on the single-node baseline. Separate environments use separate vhosts/credentials/storage. No broad # binding, queue priority, event TTL or queue auto-expiry.

The normal queue policy MUST explicitly set delivery-limit=20, dead-letter-exchange=commerce.parking.v1, dead-letter-routing-key=notifications.poison.v1, dead-letter-strategy=at-least-once, overflow=reject-publish, max-length=10000 and max-length-bytes=67108864. Enable/verify required feature flags for the pinned version. The parking queue uses overflow=reject-publish, max-length=1000 and max-length-bytes=16777216; disable its delivery limit at declaration with x-delivery-limit=-1 because there is no further DLX. Parking has no automatic runtime consumer; protected single-message inspection pauses on failure and alerts rather than requeueing in a loop. This narrow exception keeps evidence while review is pending.

Quorum default delivery limits and counting behavior vary by version; do not use the count as the application's ten-attempt budget. Safe dead-letter transfer requires the selected policy and retains source work until target confirmation. [Quorum queues](https://www.rabbitmq.com/docs/quorum-queues)

Blocked parking must retain source messages; downgrading the strategy or changing overflow to drop-head is prohibited during unresolved work. Protect DLX topology and source-to-DLX permissions. Dead lettering is a transport fallback; malformed supported intake normally writes PostgreSQL quarantine and acknowledges. [RabbitMQ dead lettering](https://www.rabbitmq.com/docs/dlx)

Queue capacity can overshoot configured ready-message limits while publication is in flight; limits do not bound every disk/memory byte. Monitor whole-node disk/resource alarms, ready/unacknowledged/dead-lettered work and publisher rejection. [Queue length limits](https://www.rabbitmq.com/docs/maxlength)

## Application options boundary

Use one validated named options section per component, accessed through the existing configuration boundary. Names here are specification names, not additional environment-file conventions.

| Section | Nonsecret required settings |
| --- | --- |
| Messaging | Enabled, environment/vhost reference, topology/version fingerprint, broker certificate/secret references, normal/parking queue names |
| OrdersOutbox / PaymentsOutbox | Enabled, poll=1s, pool=1, action slots=1, publish cap=10/sec, lease=30s, max attempts=10, confirm=2s |
| Notifications | Intake/sender enabled, shared pool=2, intake concurrency=1, sender slots=1, prefetch=10, body=8192, depth=8, primary future tolerance=30s |
| MessagingRecovery | Protected tool reference, inspection/replay page≤100, operator pool reused, required reason/audit and restored-source mode |

Reject missing/mismatched topology/source/type/size/deadline/pool settings at startup. Disabled messaging workers may leave durable outbox pending, but after activation producers cannot disable required outbox writes. Broker unavailability degrades notification readiness, not existing API primary readiness while safe capacity remains. Component health uses its existing pool/connection and bounded deadline. Public health output discloses no broker credentials, private names, backlog identities or operator targets.

Configure broker max_message_size=8192 as well as independent consumer body/depth/metadata limits. Validate these effective settings during provisioning; an AMQP frame limit is a different protocol setting and cannot substitute for a body-size limit.

## Publisher and consumer operation

Each publisher owns its channel, confirms and mandatory-return tracking. Confirm/no-return proof is correlated to the exact in-flight event; returns and positive confirmations must both be considered. Close/rebuild a failed channel before another action; no lost pending map is treated as success. Persistent mode and mandatory routing follow [RabbitMQ publishing semantics](https://www.rabbitmq.com/docs/publishers).

Use async client APIs, no automatic acknowledgement and individual ack/nack scope. A delivery tag belongs to its channel; never acknowledge on another/new channel or use a multiple-ack that includes uncommitted messages. Copy/deserialise the bounded body before the delivery callback returns; the client body-memory lifetime and publisher channel ownership are explicit in the [official .NET guide](https://www.rabbitmq.com/client-libraries/dotnet-api-guide).

No hot requeue loop: on DB outage pause/cancel consumption, leave outstanding work unacknowledged and reconnect with bounded backoff. Broker parking protects repeated crash paths. Application retry is stored in PostgreSQL after intake; do not create a network of retry queues.

## Release and shutdown

Use the Phase 08 maintenance/drain/stop/migrate/start process. Stop API/owner transitions while adding producer hooks/tables, validate grants and topology, record activation, then reopen. Preserve the single Payments executor rule. Broker provisioning failure must be resolved before claiming phase deployment complete; compatible producers can retain intent during a subsequent outage.

Consumer support for a new schema must exist before producers emit it. Rollback artifacts must still understand retained envelopes and tables or remain held; never drop outboxes to make an older release start.

Shutdown ≤15s: stop new claims/intake, complete short active transactions, wait within action budget for confirms/acks, then close channels/connections. Unknown publication remains retryable; unacknowledged intake returns to the broker; sink receipt/progress commits together. Do not delete leases, clear counters or start overlapping old/new dispatchers as a shutdown shortcut.

Protected replay/parking investigation follows [operating contracts](../functional-requirements/module-and-operating-contracts.md). Use bounded pages and original identity; no mass unconditional republish or public maintenance API.
