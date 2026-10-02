# Conditional Read Replica and Consistency Design

**Activation:** Disabled. No standby, replication slot, client pool, promotion or public route split is created.

## Gate and eligible use

Propose a standby only when tuned primary reads still miss their target in ≥ 2/3 identical runs, sustained primary read CPU/I/O ≥ 70% for 5m and eligible read-only history accounts for ≥ 40% measured primary query cost. A prototype must reduce that cost ≥ 30% while preserving exact guards and healthy full-baseline targets.

Initial candidate use is **protected bounded inspection of already immutable owner records** in an isolated clone, such as accepted Order-line snapshot/hash analysis. This adds no customer/Admin reporting API and no new public stale-read behavior.

Identity/quotas, publication/current price/page membership, Cart/quotes/Inventory, Order lifecycle/cancellation/decisions/release and all financial facts/evidence remain on their current primary. Public Order detail/history stays primary under its existing contract; replica eligibility here is not an automatic runtime route change.

## Physical replication boundary

Candidate uses PostgreSQL 18 physical streaming replication from the current cluster, asynchronous, read-only standby. It replicates the entire cluster including both owner databases; do not claim only Commerce data exists on standby disk. Separate network/CONNECT/schema grants and protected host/storage access remain mandatory.

Read scaling does not imply write scaling, zero lag, automatic failover or physical HA. The prototype has no promotion permission and its replica is not the paired-v3 backup/recovery source. Synchronous replication/promotion would change availability/recovery and needs another decision.

PostgreSQL documents [streaming standby](https://www.postgresql.org/docs/18/warm-standby.html) and [read-only hot standby/conflicts](https://www.postgresql.org/docs/18/hot-standby.html). The routing and fences below are project-specific.

## Primary guard and replay fence

1. Current protected operator/owner authorization and target membership come from primary under existing audit rules; a replica cannot authorize a human or infer target existence.
2. Read the exact immutable primary record identity/fingerprint. After that committed data is visible, capture a conservative primary WAL position using reviewed read-only metadata. Record source-cluster identity, timeline and active owner deployment epoch.
3. Release primary connections before standby work. Authenticate the fixed approved standby/source identity and current epoch; a matching numerical LSN on a different timeline/source is not proof.
4. On one bounded standby connection, **outside the forthcoming read snapshot**, check replay position. Require it to be at or beyond the primary fence. Do not establish Repeatable Read then wait for replay: that older snapshot might remain stale after replay advances.
5. Only after fence success establish a fresh read-only bounded snapshot on that same approved standby and query the allowed immutable rows. Match row count, ID and immutable fingerprint/amount/line checks to primary proof; do not return mutable fields from standby.
6. Missing/mismatched/lagged/conflicted read uses bounded primary inspection fallback if capacity permits, or original unavailable result. No indefinite synchronous wait for replay.

Metadata inspection uses protected reviewed capabilities; do not grant ordinary runtime roles superuser/raw cross-owner access. Deployment/control inventory establishes cluster/timeline identity; its approved implementation is part of gate review.

Prototype fence check/action ≤ 2s, no handler retry, no transaction/network crossover. No use of volatile lag milliseconds alone as freshness permission. An idle source can make last-replayed transaction timestamp appear old; position, actual receive/replay state and source identity must be measured.

## Pools and WAL resource plan

Initial prototype proposal at most one fixed standby-read pool ≤ 4 connections, separately declared standby monitoring/restore clients; no pool per query. Startup validates own owner access and total standby budget.

Budget ordinary SQL clients, WAL senders and replication slots separately. PostgreSQL 18 limits streaming/base-backup connections through `max_wal_senders`; they do not consume ordinary `max_connections` slots. This separation dates from [PostgreSQL 12](https://www.postgresql.org/docs/12/release-12.html); current [replication settings](https://www.postgresql.org/docs/18/runtime-config-replication.html) define sender/slot controls. Senders still consume CPU, memory, network and WAL/storage resources.

At r=2, the 79 ordinary SQL-client plan leaves only one ordinary slot under 80. Additional SQL monitoring/metadata clients beyond that require an approved replacement envelope; a WAL sender is not counted as one of those SQL clients. The candidate proposal must inventory standby streaming, temporary base-backup senders and bounded reconnect overlap, plus slots and standby SQL/monitoring pools. No extra sender/slot capacity is provisioned here.

Replication slot retention is bounded by a reviewed disk/WAL horizon, not “retain forever.” On slot/lag/resource breach stop optional read routing, preserve primary safety and rebuild the disposable standby through the approved replication procedure if needed. Do not disable original primary disk/backup gates to keep the replica online.

## Conflict and failure policy

Long reads can conflict with primary replay/maintenance. Keep bounded queries/cursors, no long-lived export snapshots. Do not automatically enable hot_standby_feedback or extend replay conflict waits indefinitely: retaining dead tuples on primary has a capacity cost.

Test stopped replay, network loss, restart/rebuild, mismatched source/timeline/epoch, primary unavailable, stale authorization, row not yet replayed and read cancellation. Optional standby outage must not flood primary with fallback; existing operator pool/admission remains finite.

After owner restore, discard/rebuild stale standby and revalidate source/timeline/epoch before inspection resumes. A replica ahead of the restored primary cannot fill missing accepted history or permit money/fulfillment unless the original authenticated recovery procedure explicitly establishes valid owner history.

## Exit and decision

Record reduction in eligible primary CPU/buffers/I/O, complete latency, WAL retained bytes/replay speed, added resources/pools, canceled reads/fallback, authority proof and restore/rebuild time. Reject if current policies leave too little safe read volume or if resource/recovery cost exceeds benefit.

Validated prototype is not production activation, public read split, failover or a changed RPO. Keep baseline routing until a concrete compatible activation is authorized.
