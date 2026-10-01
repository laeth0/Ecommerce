# Event and Notification Workflows

**Status:** required Phase 09 behavior. [Event schemas](event-contracts.md), [owner contracts](module-and-operating-contracts.md) and [database design](../database/schema-and-transactions.md) provide implementation details.

## Invariants

| ID | Required invariant |
| --- | --- |
| EVT-INV-01 | Eligible owner mutation and immutable publication intent commit together |
| EVT-INV-02 | Event source/ID, business payload, time and diagnostic origin never change on retry/replay |
| EVT-INV-03 | Confirmed publication, durable intake and local delivery are separate states |
| EVT-INV-04 | One source/ID produces at most one local sink receipt; conflicting bytes are quarantined |
| EVT-INV-05 | Events cannot authorize fulfillment, release/consume stock, change financial truth or reset financial retry windows |
| EVT-INV-06 | Order versions may have gaps; financial version does not identify an individual refund fact |
| EVT-INV-07 | Exhausted or invalid work remains visible; broker acknowledgement requires durable intake or quarantine |
| EVT-INV-08 | Replays are scoped/audited and never alter accepted API receipts or original provider identities |

## EVT-E1 / EVT-FR-01 — Commit eligible events

**Story:** as an operator, I need committed lifecycle/refund facts to remain discoverable after an application crash.

**Actor/preconditions:** Orders/Payments owner using its existing authorized or trusted command; producers activated through the maintenance release.

**Trigger/main flow:** after a genuine eligible mutation, build the canonical envelope from owner-held facts; insert one outbox row per transition/fact; commit with the owner audit/projection. Orders uses its transition-audit ID; Payments uses its fact ID. Strict payload validation happens before commit.

**Rules/validation:** publish all seven Order business statuses, excluding status-preserving cancellation requests. Publish only newly admitted RefundSucceeded/RefundReversed facts; recipient/order come from the immutable binding. Reversal references the admitted prior success. Admissible mapped facts still describe historical external truth when an integrity hold exists; they cannot advertise available money. No synthetic provider-refund event is created for simulator compensation.

**Result/errors/edges:** rollback leaves no transition or intent. If the external provider effect already happened, local failure preserves existing observation/reconciliation work; it cannot negate that effect. Exact command/fact replay creates no new event. Version exhaustion or schema/audit/outbox failure follows the existing owner failure contract, never partial success.

**Acceptance:** Given an eligible transition, when the transaction commits, then audit/fact and exactly one matching event exist. Given failure on outbox insertion, when the transaction rolls back, then no associated local mutation persists. Given an exact replay, then event count/identity are unchanged.

## EVT-E2 / EVT-FR-02 — Publish durable intent

**Story:** as an operator, I need broker outages to delay notification work without losing committed purchase facts.

**Actor/preconditions:** owner relay with narrow database and broker credentials, approved topology and a free action slot.

**Trigger/main flow:** poll due work, claim one row/lease and commit; publish original persistent bytes with mandatory routing; process return/confirmation; acknowledge progress by matching token and fresh primary time.

**Rules:** positive confirmation without return permits Published. Timeout/negative confirmation/channel loss/unroutable delivery schedules original work with the finite retry cycle. Ten attempts lead to ManualReview. A late result cannot write through an expired or replaced token. No transaction spans broker I/O.

**Result/errors/edges:** a confirmed message can be published again after a crash before local progress. Queue/disk pressure rejects or blocks publication; pending intent stays in PostgreSQL. A broker failure leaves business state intact.

**Acceptance:** Given a crash after broker confirmation and before progress commit, when work resumes, then the same source/ID/bytes may publish twice. Given a return followed by a positive confirm, then the row is not marked Published. Given broker outage, then oldest pending age grows visibly and no notification is falsely Delivered.

## EVT-E3 / EVT-FR-03 — Accept and deduplicate

**Story:** as a notification consumer, I need a repeated message to create one durable effect.

**Actor/preconditions:** private intake worker, manual acknowledgement, bounded body/metadata and supported route/type/source/schema.

**Trigger/main flow:** validate envelope and semantics; insert immutable inbox plus one delivery intent in one transaction; commit; acknowledge this delivery individually.

**Rules:** compare source/ID and exact frozen body/digest on conflict. Matching duplicates return Duplicate without changing retries. Wrong route, unknown version, structural invalidity or conflicting identity commits bounded quarantine before acknowledgement. Database outage permits neither intake success nor acknowledgement.

**Result/errors/edges:** acknowledgement loss causes redelivery and harmless deduplication. Untrusted payloads are not copied into logs/quarantine. Broker-level repeated connection failures can move the original message to parking for inspection.

**Acceptance:** Given ten copies of one event, when all are processed, then one inbox/intent exists. Given altered data under the same identity, then the original remains unchanged and a conflict is quarantined. Given database failure before commit, then no acknowledgement occurs.

## EVT-E3 / EVT-FR-04 — Complete the local sink

**Story:** as an operator, I need inspectable notification history without an external messaging provider.

**Actor/preconditions:** Notifications sender and an accepted intent with a free action slot.

**Trigger/main flow:** claim one due delivery; read its immutable validated event; verify claim in a short transaction; insert a typed receipt and mark Delivered together. No live customer/address/provider lookup is performed.

**Rules:** receipt key is source/event, channel LocalSandbox. Receipt identifies its historical status/fact, observation and receipt times, aggregate version and optional reversal link. No free-form marketing text, email/SMS, address, customer-facing route or delivery preference is added.

**Result/errors/edges:** crashes before sink commit leave no effect; after commit, replay observes the same receipt. Ten failed attempts/crashed claims require ManualReview; receipt is never marked Delivered merely because publication/intake succeeded.

**Acceptance:** Given a crash between receipt insert and progress update, then both roll back. Given sender replay after commit, then one receipt remains. Given reversal before success or version gaps, then all distinct facts remain visible and no owner state changes.

## EVT-E4 / EVT-FR-05 — Inspect and recover

**Story:** as a protected operator, I need scoped recovery with an attributable decision.

**Actor/preconditions:** authenticated private operator tooling, approved credentials, bounded target and required reason. Admin Bearer access alone is insufficient.

**Trigger/main flow:** inspect bounded pending/ManualReview/quarantine/parking records; identify the original canonical source; use a version-checked operation UUID to resume delivery, replay outbox or resolve quarantine. Commit operation receipt/audit with the local scheduling change.

**Rules:** no arbitrary payload editor, new event identity or bulk financial action. Resume starts a new finite delivery cycle only. Replaying a Delivered event is a no-op at the sink. Invalid input may be discarded after evidence; valid work can be explicitly skipped only by an attributed operator decision, never labeled Delivered. Missing restored source remains contained.

**Result/errors/edges:** stale expectedVersion conflicts; operation UUID/payload mismatch conflicts; authority/audit/database failure schedules nothing. Parking is acknowledged only after durable recovery intake/quarantine.

**Acceptance:** Given stale review data, then no replay is scheduled. Given a repeated identical operation, then its original result returns without another cycle. Given unresolved poison, then alerts persist and paid Orders remain valid.

## EVT-E4 / EVT-FR-06 — Recover across storage boundaries

**Story:** as an operator, I need a database restore to contain messages from a newer broker timeline.

**Actor/preconditions:** the [Phase 08 restore gate](../../08-production-ready-monolith/deployment-and-devops/backup-and-restore.md), quiesced old processes and a complete Phase 09 archive.

**Trigger/main flow:** restore every owner/new table together, validate manifest and authority, inspect retained broker messages against restored immutable outboxes, quarantine missing/conflicting sources, and rebuild undelivered canonical work using original identity.

**Rules:** financial/provider-gap reconciliation and original windows precede business reopening. No event reconstructs an absent accepted Order/key. Local sink restoration has the same finite RPO as the complete database; broker retention does not improve financial RPO.

**Acceptance:** Given newer retained broker messages after restoring an older archive, then they cannot create notifications until matched to restored canonical intent. Given complete broker loss with intact PostgreSQL, then original undelivered envelopes can be republished without another sink receipt.
