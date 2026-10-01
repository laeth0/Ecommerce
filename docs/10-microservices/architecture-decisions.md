# Architecture Decisions

**Status:** Phase 10 target decisions. Deployment admission requires the associated evidence. Architectural alternatives are assessed against the existing monolith, not assumed to be improvements.

## MS-ADR-01 — Extract Payments only

**Problem:** provider credentials, callbacks, outbound limits and recovery have different release/failure needs from Catalog/Cart/Order APIs. Phase 07 bulkheads limit latency but share the application process and secret access.

**Options:** retain the bounded monolith worker; extract Notifications; extract Payments; split every module.

**Decision:** the user selected Payments. Keep Identity, Catalog, Inventory, Cart, Orders, Checkout, simulator and Notifications together in Commerce.

**Rationale:** the extraction teaches a financially meaningful boundary and permits provider-secret/process isolation. Notifications is simpler but would not exercise purchase coordination. Inventory extraction would add stock uncertainty without removing hot-row contention. Splitting CRUD modules adds no demonstrated benefit.

**Consequences:** additional process, network, database ownership, migration and recovery costs. Benchmark release/process isolation and reference capacity; do not claim a measured scaling need.

## MS-ADR-02 — Independent databases and private APIs

**Problem:** a new process with shared tables is not exclusive data ownership; it permits hidden joins and coordinated releases.

**Options:** shared schema access; separate schemas with shared runtime credentials; separate logical databases; separate physical servers.

**Decision:** Commerce and Payments use separate logical PostgreSQL databases on one development server, independent credentials and private HTTPS/mTLS commands/queries. RabbitMQ carries durable financial-change and existing notification events.

**Rationale:** this demonstrates ownership and partial commits with modest local infrastructure. Same-server databases retain shared CPU/disk/availability; physical failure isolation is not claimed.

**Consequences:** cross-database FKs and caller-owned transactions disappear. No runtime dblink, FDW, cross-service SQL, distributed database transaction or synchronous RPC inside a local transaction is allowed.

## MS-ADR-03 — Durable commands and explicit orchestration

**Problem:** an HTTP timeout can follow a committed remote command. Blind retry/new identity can repeat a financial instruction.

**Options:** synchronous calls without receipts; broker choreography for every step; durable Commerce coordination with idempotent private commands.

**Decision:** Commerce persists each command before I/O; Payments commits command result with its local effects. Repeat the same command ID/canonical body. HTTP is the command/query transport; broker events are hints and historical delivery.

**Rationale:** explicit steps make ownership, failures and compensation visible. Existing Checkout work is extended, not replaced by a generic workflow engine. [Saga coordination](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) supplies conceptual background; the exact protocol is project-specific.

**Consequences:** more persistent states and potential manual review. An event or HTTP 200 cannot substitute for financial evidence or actual stock consumption.

## MS-ADR-04 — Authorization commits at Commerce

**Problem:** Identity locks cannot cover a remote Payments transaction without holding a transaction across network I/O.

**Options:** remote shared Identity SQL; distributed revocation leases; keep financial admission local; Commerce durably authorizes immutable requests.

**Decision:** the user approved the fourth option. New Admin refund intent commits under fresh Identity user/session authority and local owner/source checks. Payments then independently admits or rejects financial reservation.

**Rationale:** a committed authorized command is durable accepted work, analogous to accepted Checkout recovery. New public requests/replays still require current authority.

**Consequences:** authorized intent may complete after later account/session revocation. This explicitly changes the authority timing from Phase 07; it does not extend JWT lifetime or allow a revoked token to create/replay a new HTTP request. Public 202 still requires known Payments admission.

## MS-ADR-05 — Conservative confirmation hold

**Problem:** a current financial read followed by a Commerce commit leaves a race with refund admission. Version hints and events cannot recreate the former parent lock.

**Options:** cached financial flag; compensate after unsafe confirmation; a durable business hold with explicit terminal Commerce decision.

**Decision:** the user approved a Payments-owned confirmation hold, serialized financial application and a durable Commerce Committed/Aborted decision. See [coordination](reliability-and-failure-scenarios/workflow-coordination.md).

**Rationale:** the hold preserves the logical ordering formerly provided by the payment parent lock without retaining SQL locks across RPC. It blocks financial admission while uncertainty exists. Existing external provider effects remain observable and durably queued for owner application.

**Consequences:** service failure can hold refunds/financial progress. The hold never expires into permission; timeout means unknown and triggers reconciliation. This is a correctness trade-off, not a distributed ACID guarantee.

## MS-ADR-06 — Preserve financial and event identity

**Problem:** migration or replay can turn an old operation into a new provider request, duplicate refund or notification.

**Options:** new payment IDs/provider keys; regenerate events; transfer retained data exactly.

**Decision:** copy all original mappings, earliest-send times, windows, provider keys/parameters, receipts, facts/reversals, allocations/cases, cursor keys, outboxes and audit. Legacy notification envelopes are immutable.

**Consequences:** migration must reconcile inactive and uncertain history. No automatic simulator conversion, new 23-hour window, duplicate refund allocation or event backfill is allowed.

## MS-ADR-07 — Single-writer maintenance cutover

**Problem:** old and new provider executors can overlap; independent databases can diverge during data transfer.

**Options:** unproved dual-write/CDC; immediate route switch; planned maintenance and verified exclusive ownership.

**Decision:** freeze/drain, prove all source writers and provider senders stopped, transfer/reconcile, revoke old rights, then route/start the designated new owner.

**Rationale:** a maintenance migration fits the learning baseline and makes the boundary provable. No zero-downtime promise.

**Consequences:** downtime is recorded. Rollback after new financial effects requires a reverse transfer/reconciliation under quiescence, not pointing Commerce at a stale old database.

## MS-ADR-08 — Separate snapshots with integrated restore

**Problem:** separate databases do not have one ordinary exported snapshot; provider effects continue outside local archives.

**Decision:** authenticated backup bundles hold complete independently consistent Commerce/Payments archives, snapshot bounds and version references. Recovery reconciles both histories, message timelines and the provider gap before reopening.

**Consequences:** no global atomic snapshot or zero-loss claim. Old commands with missing restored authority cannot initialize a new payment. Integration epochs fence stale runtime traffic while business/provider identities remain original.
