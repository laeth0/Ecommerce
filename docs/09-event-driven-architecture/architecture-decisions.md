# Architecture Decisions

**Status:** selected design for Phase 09; runtime evidence is pending. Existing business and security decisions remain binding.

## EVT-ADR-01 — Outbox and RabbitMQ

**Context/problem:** separate domain and broker writes can lose committed notification work. The approved learning objective includes independent message delivery, routing and broker failure.

**Options:** synchronous notification; PostgreSQL-only durable dispatch; PostgreSQL outbox with RabbitMQ; Kafka.

**Decision:** PostgreSQL owner-local outboxes and RabbitMQ with confirmed publication and durable intake.

**Rationale:** PostgreSQL-only dispatch could satisfy this small local sink with fewer components. RabbitMQ is selected because the user explicitly chose an independently operated delivery boundary and the phase demonstrates its routing, acknowledgement and outage behavior. Kafka's retained log and partition model are unnecessary for this bounded notification workload. No measured throughput need is claimed.

**Consequences:** extra credentials, disk, policy/version management, duplicate publication and broker recovery. Database durability remains necessary; the broker cannot repair missing publication intent.

## EVT-ADR-02 — Historical events and minimal payloads

**Context/problem:** arrival order can differ from business order, and a refund can later reverse. Treating a notification as current state risks false payment/fulfillment claims.

**Options:** ordered aggregate dispatch; latest-state projection; independent historical facts.

**Decision:** historical facts with CloudEvents identity, producer version, observation time and a linked reversal fact. Include only internal customer/order/refund/fact IDs, bounded enums and USD refund cents.

**Rationale:** the local sink needs a truthful history, not a second purchase read model. Aggregate ordering infrastructure and a new per-refund version are unnecessary.

**Consequences:** inspection must show observation time and correction links. Gaps, delayed events and a missing pre-cutover referenced event are valid.

## EVT-ADR-03 — Inbox and transactional local sink

**Context/problem:** consumer acknowledgement can be lost and a process can stop between intake and notification completion.

**Options:** automatic acknowledgement; in-memory deduplication; durable inbox/intent and local receipts.

**Decision:** commit inbox plus delivery intent before manual acknowledgement; commit the local receipt plus delivery completion together.

**Rationale:** unique source/event identity suppresses duplicate local effects. Durable work separates transport acceptance from completion and permits bounded independent recovery.

**Consequences:** additional tables and work claims. This guarantee is limited to the local database sink; future external channels need a separate reviewed delivery contract.

## EVT-ADR-04 — Quarantine and finite recovery cycles

**Context/problem:** rapid requeue loops consume resources; malformed events and repeated crashes need visible durable disposition.

**Options:** unlimited retry; drop poison messages; bounded database retries and safe broker parking.

**Decision:** ten attempts per relay/sender cycle, explicit ManualReview, permanent-invalid quarantine, and a quorum parking queue for broker-level repeated delivery failures.

**Rationale:** durable intent survives exhaustion. Operator replay is scoped, attributed, version-checked and preserves identity; no silent success is invented.

**Consequences:** operators must inspect open work. Broker parking and PostgreSQL quarantine are different stages and both need alerts. A broker delivery counter is not an application retry budget.

## EVT-ADR-05 — Retention and reconstruction

**Context/problem:** deleting deduplication evidence independently of broker/replay history permits repeated local effects. Partial database restore can leave newer messages in the broker.

**Options:** TTL deletion; broker-only recovery; retained original envelopes and complete database recovery.

**Decision:** no automatic Phase 09 deletion of outbox, inbox, receipts, quarantine or audit. Broker messages have no expiry. Complete backups include all new tables; broker reconstruction uses original rows. Restored-source validation precedes replay.

**Rationale:** this matches the existing purchase/evidence retention baseline and keeps replay identity provable. Capacity and growth are measured; a later retention change must coordinate all boundaries.

**Consequences:** storage grows and must be budgeted. There is no indefinite-capacity claim. Financial RPO and provider-gap holds remain unchanged.

## EVT-ADR-06 — One deployment boundary

**Context/problem:** messaging exposes useful failure boundaries without requiring immediate service extraction.

**Options:** deploy new services/databases; use bounded monolith workers and one notification schema.

**Decision:** keep the modular monolith and PostgreSQL primary.

**Rationale:** ownership and wire contracts prepare extraction without introducing distributed financial coordination in this phase.

**Consequences:** shared primary/process capacity persists. Local foreign keys inside Notifications and recovery inspections need explicit reconsideration during Phase 10 extraction.
