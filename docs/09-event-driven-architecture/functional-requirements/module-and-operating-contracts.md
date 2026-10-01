# Module and Operating Contracts

**Status:** private implementation interfaces and protected operating procedures. These are not public HTTP endpoints.

## Public compatibility

All phases 01–08 routes, authorization, headers, request/response schemas, Problem Details and idempotency receipts remain binding. Notification lag creates no new business response field/status code. A successful business commit includes its required outbox insertion; broker failure is not a reason to reject a committed Order. Failure before a business commit uses the existing Service.Unavailable/Server.Error behavior and unknown-commit replay rules.

No customer notification API, broker publish API, generic state editor, replay endpoint or unauthenticated management route is added.

## Owner interfaces

| Interface | Caller and transaction | Input/result and obligations |
| --- | --- | --- |
| Orders.AppendLifecycleEvent | Orders inside existing mutation transaction | Locked row plus new audit; validate status change/Create; insert exact envelope; no own commit |
| Payments.AppendRefundFactEvent | Payments inside financial observation transaction | Newly admitted fact, refund, immutable binding and committed-to-be parent version; emit each fact independently; no Orders query |
| OwnerOutbox.ClaimDue | Its relay, one short transaction | Owner, free slot, primary time; returns one lease/token/body or no work; count attempt before I/O |
| OwnerOutbox.RecordPublishResult | Its relay, later short transaction | Event ID/token/result; Published only on valid positive confirm/no return; stale result ignored and diagnosed |
| Notifications.Accept | Intake, short transaction | Trusted route plus copied bounded bytes; Accepted, Duplicate or Quarantined after durable commit; no business owner call |
| Notifications.CompleteLocal | Sender, short transaction after claim | Source/ID/token; insert receipt and complete work atomically or return stale/completed/conflict |
| OwnerOutbox.ReadCanonical | Protected recovery/inspection only | Source/ID; immutable bytes/digest and existing metadata, or Missing; no owner mutation/lock |

Typed error outcomes are InvalidEnvelope, InvalidState, IdentityConflict, SourceMismatch, VersionConflict, IdempotencyConflict, StaleLease, Unavailable and AuditFailure. Unavailable is never an empty successful result. Strict source/type mappings and envelope schemas are in [event contracts](event-contracts.md).

Owner methods share their caller's transaction where stated. They do not call RabbitMQ or acquire earlier domain locks. Notifications stores logical customer/order/refund references without cross-owner foreign keys or live data hydration. Invalid input cannot grant operator authority.

## Protected operator requests

Implement through reviewed local tooling with authenticated operator identity, private network/process access and narrow database/broker credentials. No new application provisioning is included. Use the existing protected operator pattern and ≤4 total operator database connections.

| Operation | Required typed input | Effect/result |
| --- | --- | --- |
| Inspect | owner/state filter, optional source/event UUID, cursor, limit 1–50 | Bounded metadata/typed history; a new snapshot per page; never return secrets/raw invalid payloads |
| ReplayOutbox | operationId UUID, source enum, eventId UUID, expectedVersion 1–2^53−1, reason | Published/ManualReview canonical row to Pending with a new finite cycle; already Pending returns unchanged AlreadyScheduled |
| ResumeDelivery | same fields as ReplayOutbox | Existing ManualReview delivery to Scheduled with original intent; Delivered/Skipped returns unchanged terminal result |
| ResolveQuarantine | operationId, quarantineId UUID, expectedVersion, resolution enum, reason; source/eventId and expectedTargetVersion for Replayed/SkipValid | Replayed through canonical outbox operation, DiscardInvalid, or explicitly SkipValid; required evidence and audit |

Sources are exactly urn:ecommerce:orders or urn:ecommerce:payments. Reasons are NFC-normalized/trimmed, 1–256 Unicode scalars and ≤1,024 UTF-8 bytes, no controls/newlines. Reject unknown fields, duplicate keys, noncanonical UUIDs/integers and oversized input (>2,048 UTF-8 bytes). Cursor is a protected local continuation scoped to operator/filter; tooling cannot accept raw SQL or user-selected table names. Page order uses immutable (created_at, id) for work/quarantine and (occurred_at, source, event_id) for history.

ResolveQuarantine resolutions are exactly Replayed, DiscardInvalid and SkipValid. Replayed requires expectedTargetVersion≥1 for the source outbox. SkipValid uses the delivery version, with 0 meaning no delivery exists; an unexpected concurrent creation conflicts. DiscardInvalid has no secondary target. Record before/after versions of both quarantine and any secondary work row; a missing delivery is created directly as Skipped at version 1. Pending outbox replay does not reset a cycle. Active leases reject intervention; delivered/skipped sink work is terminal.

Replayed/SkipValid must bind the quarantine evidence to the original canonical envelope: digest matches, and any safely parsed source/event hints match its identity. The supplied target cannot substitute an unrelated notification. Conflicting or noncanonical bytes qualify for DiscardInvalid, not replay as if they were valid original work. A digest is an evidence locator; trusted owner bytes and identity are still required.

Authority is established outside the request; operatorId cannot be supplied to impersonate another operator. The caller supplies a UUID operation identity once, retained with authenticated actor, normalized request fingerprint and original result. Same identity/actor/canonical request replays its original result; changed actor/request conflicts. Include actor, reason, target, before/after work version, primary time and outcome in protected append-only operation receipt/audit. If audit cannot commit, no scheduling/resolution commits.

## Replay protocol

1. Inspect original immutable outbox bytes, active consumer compatibility, current work version, receipt and absence of an active lease.
2. Read an existing immutable operation receipt first. For a new operation, lock quarantine first when applicable, then one target outbox/delivery row; never lock business rows or two owner targets.
3. Recheck expectedVersion and permissible state. An unexpired lease rejects review; do not cancel an in-flight publisher by changing its token.
4. Persist audit and scheduling outcome. Relay uses the original source/ID/time/body and ordinary budgets.
5. Observe the sink receipt or explicit quarantine/ManualReview. Acceptance of replay is not delivery.

Quarantine recovery uses one caller-owned PostgreSQL transaction for guarded quarantine resolution, the original owner's transport-metadata scheduling and the immutable operation receipt/audit. This is permitted inside the existing monolith; no business mutation or network call is involved. All operator paths follow quarantine → one target work row, with no reverse runtime path. A crash rolls back all stages. Concurrent operationId reuse that conflicts at receipt insertion rolls back tentative changes and compares the immutable winner after rollback.

Broker parking recovery uses manual individual acknowledgements. Validate each parked message, read its canonical source only through protected inspection, then commit normal intake or quarantine before acknowledging. A missing original source cannot be invented. Resolve invalid records without copying their body into an operating artifact.

## Retry cycle

Relays and local senders each allow **10 claimed attempts per cycle**, persisted before work. Failure delays are 1, 2, 4, 8, 16, 30, 30, 30 and 30 seconds after attempts 1–9. Add only nonnegative jitter ≤20%; store the resulting due time. After attempt 10, clear the lease and enter ManualReview with a bounded reason.

Use primary time, lease 30 seconds, action ≤10 seconds, broker confirm ≤2 seconds, one-second due polls, DB pool wait ≤1 second/lock wait ≤250 ms/command ≤2 seconds/transaction ≤3 seconds and shutdown ≤15 seconds. A crashed tenth claim enters ManualReview after lease expiry under a guarded sweep. Reconnect uses the same bounded delay progression capped at 30 seconds; it does not count as a new event attempt until a row is actually claimed.

Matching duplicate intake, redelivery flags, scans, process startup and broker recovery cannot reset a work cycle. Only a recorded operator resume/replay opens a new cycle; receipt/deduplication keys never change. These counters are transport/sink counters and cannot alter Checkout/Payments retry/observation budgets.
