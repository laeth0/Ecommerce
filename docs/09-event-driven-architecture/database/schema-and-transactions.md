# Schema and Transactions

**Status:** PostgreSQL 18 target design for a later reviewed EF Core/Npgsql migration. DDL is specification material, not an executed migration. Retain existing owner schemas, locks and runtime limits.

## Owner-local outboxes

Each owner gets the same transport columns, separate privileges and owner-specific identity checks. Store exact canonical UTF-8 bytes, not a reserialized JSONB approximation. No extension, cross-owner foreign key, partition, event-store replacement or generic domain repository is introduced.

```sql
CREATE TABLE orders.outbox (
    event_id uuid PRIMARY KEY,
    source varchar(32) COLLATE "C" NOT NULL
        CHECK (source IN ('urn:ecommerce:orders','urn:ecommerce:payments')),
    event_type varchar(80) COLLATE "C" NOT NULL,
    aggregate_id uuid NOT NULL,
    aggregate_version bigint NOT NULL CHECK (aggregate_version BETWEEN 1 AND 9007199254740991),
    body bytea NOT NULL CHECK (octet_length(body) BETWEEN 1 AND 8192),
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    occurred_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL,
    state text NOT NULL CHECK (state IN ('Pending','Published','ManualReview')),
    work_version bigint NOT NULL CHECK (work_version BETWEEN 1 AND 9007199254740991),
    cycle bigint NOT NULL CHECK (cycle BETWEEN 1 AND 9007199254740991),
    attempts smallint NOT NULL CHECK (attempts BETWEEN 0 AND 10),
    next_action_at timestamptz,
    lease_token uuid,
    lease_expires_at timestamptz,
    first_published_at timestamptz,
    failure_code text CHECK (failure_code IS NULL OR failure_code IN
        ('Unavailable','Returned','NegativeConfirm','ConfirmUnknown','InvalidSource','Exhausted','IdentityConflict')),
    CHECK ((state = 'Pending' AND next_action_at IS NOT NULL) OR
           (state <> 'Pending' AND next_action_at IS NULL)),
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (state = 'Pending' AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)),
    CHECK (state <> 'Published' OR first_published_at IS NOT NULL),
    CHECK (state <> 'ManualReview' OR failure_code IS NOT NULL),
    CHECK (created_at >= occurred_at),
    CHECK (first_published_at IS NULL OR first_published_at >= occurred_at)
);

CREATE TABLE payments.outbox
    (LIKE orders.outbox INCLUDING CONSTRAINTS);
ALTER TABLE payments.outbox ADD PRIMARY KEY (event_id);

ALTER TABLE orders.outbox ADD CONSTRAINT orders_outbox_source
    CHECK (source = 'urn:ecommerce:orders'
       AND event_type = 'com.ecommerce.orders.lifecycle-changed.v1');
ALTER TABLE orders.outbox ADD CONSTRAINT orders_outbox_transition
    UNIQUE (aggregate_id, aggregate_version);
ALTER TABLE payments.outbox ADD CONSTRAINT payments_outbox_source
    CHECK (source = 'urn:ecommerce:payments'
       AND event_type = 'com.ecommerce.payments.refund-fact.v1');

CREATE INDEX orders_outbox_due ON orders.outbox (next_action_at, event_id)
    WHERE state = 'Pending';
CREATE INDEX payments_outbox_due ON payments.outbox (next_action_at, event_id)
    WHERE state = 'Pending';
CREATE INDEX orders_outbox_expired ON orders.outbox (lease_expires_at, event_id)
    WHERE lease_token IS NOT NULL;
CREATE INDEX payments_outbox_expired ON payments.outbox (lease_expires_at, event_id)
    WHERE lease_token IS NOT NULL;
CREATE INDEX orders_outbox_review ON orders.outbox (created_at, event_id)
    WHERE state = 'ManualReview';
CREATE INDEX payments_outbox_review ON payments.outbox (created_at, event_id)
    WHERE state = 'ManualReview';
```

LIKE copies NOT NULL and CHECK constraints here, not the primary/unique keys or indexes. Owner constraints are added after copying so the Payments table does not inherit an Orders-only source check. See [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/18/sql-createtable.html).

Orders aggregate_id is order ID; unique order/version covers one eligible status transition. Payments aggregate_id is payment ID; event_id is admitted fact ID and is the uniqueness guard. Several refund facts can share a payment/version. Do not add a payments aggregate/version uniqueness constraint.

Producer verifies source/type/subject/data/time/digest against locked owner facts. It sets Pending, work_version=1, cycle=1, attempts=0 and immediate primary-clock due time. New outbox insertion occurs after existing owner locks, in the same transaction. No-op/replay paths bypass event creation.

## Notifications-owned persistence

```sql
CREATE SCHEMA notifications;

CREATE TABLE notifications.inbox (
    source varchar(32) COLLATE "C" NOT NULL
        CHECK (source IN ('urn:ecommerce:orders','urn:ecommerce:payments')),
    event_id uuid NOT NULL,
    body bytea NOT NULL CHECK (octet_length(body) BETWEEN 1 AND 8192),
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    occurred_at timestamptz NOT NULL,
    received_at timestamptz NOT NULL,
    PRIMARY KEY (source, event_id),
    UNIQUE (source, event_id, body_digest),
    CHECK (occurred_at <= received_at + interval '30 seconds')
);

CREATE TABLE notifications.deliveries (
    source varchar(32) COLLATE "C" NOT NULL,
    event_id uuid NOT NULL,
    state text NOT NULL CHECK (state IN ('Scheduled','Delivered','ManualReview','Skipped')),
    work_version bigint NOT NULL CHECK (work_version BETWEEN 1 AND 9007199254740991),
    cycle bigint NOT NULL CHECK (cycle BETWEEN 1 AND 9007199254740991),
    attempts smallint NOT NULL CHECK (attempts BETWEEN 0 AND 10),
    created_at timestamptz NOT NULL,
    next_action_at timestamptz,
    lease_token uuid,
    lease_expires_at timestamptz,
    terminal_at timestamptz,
    failure_code text CHECK (failure_code IS NULL OR failure_code IN
        ('Unavailable','InvalidEnvelope','IdentityConflict','Exhausted')),
    PRIMARY KEY (source, event_id),
    FOREIGN KEY (source, event_id) REFERENCES notifications.inbox(source, event_id) ON DELETE RESTRICT,
    CHECK ((state = 'Scheduled' AND next_action_at IS NOT NULL) OR
           (state <> 'Scheduled' AND next_action_at IS NULL)),
    CHECK ((lease_token IS NULL AND lease_expires_at IS NULL) OR
           (state = 'Scheduled' AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)),
    CHECK ((state IN ('Delivered','Skipped') AND terminal_at IS NOT NULL) OR
           (state IN ('Scheduled','ManualReview') AND terminal_at IS NULL)),
    CHECK (state <> 'ManualReview' OR failure_code IS NOT NULL),
    CHECK (terminal_at IS NULL OR terminal_at >= created_at)
);

CREATE TABLE notifications.receipts (
    source varchar(32) COLLATE "C" NOT NULL,
    event_id uuid NOT NULL,
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    channel text NOT NULL CHECK (channel = 'LocalSandbox'),
    event_type varchar(80) COLLATE "C" NOT NULL,
    customer_id uuid NOT NULL,
    order_id uuid NOT NULL,
    aggregate_id uuid NOT NULL,
    aggregate_version bigint NOT NULL CHECK (aggregate_version BETWEEN 1 AND 9007199254740991),
    occurred_at timestamptz NOT NULL,
    delivered_at timestamptz NOT NULL,
    data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND octet_length(data::text) <= 4096),
    PRIMARY KEY (source, event_id),
    FOREIGN KEY (source, event_id, body_digest)
        REFERENCES notifications.inbox(source, event_id, body_digest) ON DELETE RESTRICT,
    FOREIGN KEY (source, event_id)
        REFERENCES notifications.deliveries(source, event_id) ON DELETE RESTRICT,
    CHECK (occurred_at <= delivered_at + interval '30 seconds')
);

CREATE TABLE notifications.quarantine (
    id uuid PRIMARY KEY,
    route_code text NOT NULL CHECK (route_code IN ('OrderRoute','RefundRoute','Parking','Unknown')),
    reason_code text NOT NULL CHECK (reason_code IN
        ('Malformed','UnsupportedSchema','SourceMismatch','IdentityConflict','FutureTime',
         'MissingRestoredSource','ConflictingRestoredSource','ParkingReview')),
    body_digest bytea NOT NULL CHECK (octet_length(body_digest) = 32),
    reported_source varchar(32) COLLATE "C"
        CHECK (reported_source IS NULL OR reported_source IN ('urn:ecommerce:orders','urn:ecommerce:payments')),
    reported_event_id uuid,
    created_at timestamptz NOT NULL,
    work_version bigint NOT NULL CHECK (work_version BETWEEN 1 AND 9007199254740991),
    resolution text CHECK (resolution IS NULL OR resolution IN ('Replayed','DiscardInvalid','SkipValid')),
    resolved_at timestamptz,
    UNIQUE (route_code, reason_code, body_digest),
    CHECK ((resolution IS NULL AND resolved_at IS NULL) OR
           (resolution IS NOT NULL AND resolved_at IS NOT NULL AND resolved_at >= created_at))
);

CREATE TABLE notifications.operator_operations (
    operation_id uuid PRIMARY KEY,
    operator_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('ReplayOutbox','ResumeDelivery','ResolveQuarantine')),
    target_id uuid NOT NULL,
    request_canonical bytea NOT NULL CHECK (octet_length(request_canonical) BETWEEN 1 AND 2048),
    request_digest bytea NOT NULL CHECK (octet_length(request_digest) = 32),
    reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 256 AND octet_length(reason) <= 1024),
    before_version bigint NOT NULL CHECK (before_version BETWEEN 1 AND 9007199254740991),
    after_version bigint NOT NULL CHECK (after_version BETWEEN 1 AND 9007199254740991),
    secondary_before_version bigint,
    secondary_after_version bigint,
    result_code text NOT NULL CHECK (result_code IN
        ('Scheduled','AlreadyScheduled','AlreadyTerminal','Discarded','Skipped')),
    occurred_at timestamptz NOT NULL,
    CHECK (after_version >= before_version),
    CHECK ((secondary_before_version IS NULL AND secondary_after_version IS NULL) OR
           (secondary_before_version IS NOT NULL AND secondary_after_version IS NOT NULL
            AND secondary_before_version BETWEEN 0 AND 9007199254740991
            AND secondary_after_version BETWEEN 1 AND 9007199254740991
            AND secondary_after_version >= secondary_before_version))
);

CREATE INDEX notifications_due ON notifications.deliveries (next_action_at, source, event_id)
    WHERE state = 'Scheduled';
CREATE INDEX notifications_expired ON notifications.deliveries (lease_expires_at, source, event_id)
    WHERE lease_token IS NOT NULL;
CREATE INDEX notifications_review ON notifications.deliveries (created_at, source, event_id)
    WHERE state = 'ManualReview';
CREATE INDEX notifications_history ON notifications.receipts (occurred_at, source, event_id);
CREATE INDEX notifications_quarantine_open ON notifications.quarantine (created_at, id)
    WHERE resolution IS NULL;
```

Customer/order/payment/refund IDs in notifications are logical references without business-schema FKs. There is no Identity or Order lock acquired by intake/sending. Inbox is immutable and has no update/delete runtime path, so its internal FK key locks cannot form a reverse parent-lock cycle. Receipts contain exactly validated typed data; no raw invalid body is retained in quarantine.

## Transactions, races and state machines

READ COMMITTED, primary clock_timestamp() after relevant waits. Existing DB pool/lock/statement/transaction limits apply. Every mutable work change advances its private work_version once with guarded overflow; these are not Order/financial public versions.

| Machine | Valid transitions | Forbidden behavior |
| --- | --- | --- |
| Outbox | Pending → Published; Pending → Pending retry; Pending → ManualReview; free/expired Published or ManualReview → Pending by audited replay | No rewritten envelope, silent delete or permanent success from unknown confirm |
| Delivery | Scheduled → Delivered; Scheduled → Scheduled retry; Scheduled → ManualReview; ManualReview → Scheduled by audited resume; Scheduled/ManualReview → Skipped by attributed review | Delivered/Skipped never reopen or become each other |
| Quarantine | Open → Replayed, DiscardInvalid or SkipValid through guarded audited review | No automatic resolution or mutated evidence |

Claim one due row with attempts<10 and absent/expired lease, in due-time/identity order using FOR UPDATE SKIP LOCKED. Increment attempts/work_version, store random token and fresh time+30s, commit. Read only a bounded row/body. No message or connection is held in a database transaction during publication.

On result, reacquire only that work row; recheck token, lease and state using fresh primary time. Success clears lease/due/failure, records the first confirmation once, and marks Published. Failure clears lease, stores the next delay or ManualReview. Expired claims with attempts<10 are reclaimable; an indexed ≤100-row sweep moves expired tenth claims to ManualReview without issuing an eleventh attempt. Claims/actions/resumes must reject private version/cycle overflow rather than wrap.

Intake uses INSERT inbox ON CONFLICT DO NOTHING, then reads the immutable winner and compares bytes/hash. A fresh insert creates one Scheduled delivery in the same transaction. An identical existing inbox leaves its delivery untouched. A conflict commits quarantine without replacing anything. If a uniqueness race is unresolved within limits, roll back and do not acknowledge; no catch-and-continue inside an aborted transaction.

Sender claim locks only delivery and commits. Effect transaction reads immutable inbox, locks delivery, validates unexpired matching token and inserts receipt plus Delivered progress atomically. If a receipt already exists, compare exact event identity/digest/data and finish only the same effect; contradiction becomes ManualReview, not an overwritten receipt. A delivered receipt is required iff state Delivered; Skipped has none. These cross-table invariants require owner transaction validation, not CHECK alone.

## Operator atomicity and permissions

For a new operation, read an existing immutable operation receipt first. If absent, lock a quarantine target first when applicable, then **one** outbox or delivery target. Compare expectedVersion and fresh lease state; apply owner-scoped metadata and insert immutable operation receipt/audit in the same PostgreSQL transaction. Never lock business rows or multiple owner targets.

Concurrent reuse of operationId on different targets may conflict at final unique receipt insertion. Roll back tentative target changes, then read/compare the winning immutable request/result outside that failed transaction. Do not acquire the winner's target while holding another target. No rejected operation binds an operationId; diagnostics record a safe error separately.

ResolveQuarantine/Replayed schedules the original canonical owner row in that transaction. SkipValid requires a currently supported, validated canonical envelope: insert/compare its inbox, create or guard the delivery and mark Skipped without a receipt. Existing Delivered is an unchanged terminal result. DiscardInvalid resolves only invalid evidence. Missing/conflicting restored source cannot qualify for SkipValid. Audit failure rolls all changes back.

Before replay/skip, compare quarantine digest and safe identity hints to the original canonical source; never redirect a quarantine operation to an unrelated envelope. Use immutable source inspection without business-parent locks. A conflicting/noncanonical message is resolved as invalid evidence rather than replacing the stored original.

Quarantine replay/skip checks both expectedVersion and expectedTargetVersion; 0 is allowed only for an absent SkipValid delivery. Lock/recheck a newly discovered delivery before acting and reject a concurrent creation under expected 0. The immutable operation audit records both version pairs; secondary fields are null for single-target actions and nonnull for quarantine actions with a work target. No intermediate Preparing operation receipt can commit.

Runtime grants/immutability guards are REQUIRED: producer INSERT only into its outbox; relay SELECT and UPDATE only transport columns; intake SELECT/INSERT inbox, INSERT delivery/quarantine; sender SELECT inbox/receipts and narrow delivery updates/receipt INSERT. Protected operator has scoped transport metadata/audit rights; migration authority alone has DDL. No runtime deletion, body rewrite, broad business access, superuser or reserve-slot grant.

Database guards preserve envelope/identity/time, inbox, receipts and operation audit. Do not rely solely on application conventions. SHA-256 and semantic schema consistency are owner validation obligations; the DDL length checks do not prove them.

## Migration, plans and retention

Add both outboxes and Notifications tables/grants through one reviewed maintenance release. No owner snapshot/key/version/money migration or historical backfill is included. Record protected per-owner activation time/artifact in release evidence outside runtime rows. Before reopening, check every mutation entry point uses the producer hook, including existing Checkout, manual fulfillment, cancellation and financial observation.

Inspect EXPLAIN (ANALYZE, BUFFERS) for due/expired claims, bounded review/history, producer insert and restore discovery on the declared dataset. Use B-tree partial indexes; no GIN, partitioning or event-sourcing redesign. A pass visits ≤100 candidates per class with persisted continuation for recovery/history enumeration.

Retain all new envelopes, identities, work, receipts, quarantine and operation audit with existing purchase evidence. No automatic deletion job is defined in Phase 09. Broker acknowledgement removes transport copies, not PostgreSQL history. Measure storage/index/WAL/backup growth; the [capacity gate](../performance-and-scalability/delivery-and-capacity.md) bounds supported growth. Later retention changes must coordinate producer evidence, sink deduplication, broker delay, replay and restore.
