# Verification Scenarios

**Status:** future implementation evidence plan. No automated test, fixture or test dependency is created. Use manual/static/infrastructure scenarios as available; record Passed, Failed, Not run or Not applicable with reason. Documentation validation alone leaves runtime gates open.

## Contract and producer evidence

| ID | Given / When | Then / evidence |
| --- | --- | --- |
| EVT-V01 | Given each eligible Order status and a cancellation-only request, when owner commits | One event per Create/status change; none for request/no-op/rejection |
| EVT-V02 | Given multiple admitted refund facts in one observation, when financial version advances once | Each fact has its own event ID; shared version is accepted |
| EVT-V03 | Given Pending/Unknown/inadmissible webhook or simulator compensation, when observed | No verified provider refund event |
| EVT-V04 | Given audit/fact/outbox last-write failure, when transaction aborts | Associated local owner mutation/event both absent; provider truth remains recoverable |
| EVT-V05 | Given canonical events and boundaries, when schemas/semantics run | Correct source/type/subject/fact/time/UUID/USD accepted; unknown/duplicate keys, wrong linkage, overflow, depth/bytes rejected |
| EVT-V06 | Given replay after mutable owner state changes, when relay runs | Original event ID/source/time/bytes/context unchanged |
| EVT-V07 | Given activation with historical purchases, when hooks enable | Only new eligible mutations emit; no current-state backfill |

## Delivery and crash evidence

| ID | Given / When | Then / evidence |
| --- | --- | --- |
| EVT-V08 | Crash before/after owner commit and before relay | No phantom event; committed work discovered |
| EVT-V09 | Confirm lost or crash before relay progress | Same event republishes; one receipt |
| EVT-V10 | Mandatory return then positive confirm | No false Published; scoped retry/review |
| EVT-V11 | Crash before intake commit and after commit/before ack | Unacknowledged redelivery or durable deduplication |
| EVT-V12 | Ten identical and one conflicting envelope under one identity | One inbox/intent/receipt; immutable original, conflict quarantine |
| EVT-V13 | Sender killed after claim, during effect and after commit | Counted lease recovery; atomic receipt/completion; one local effect |
| EVT-V14 | Two relays/intakes/senders and competing operator requests | No duplicate effects/deadlocks/lease overwrite; stale version rejected |
| EVT-V15 | Ten failures and killed tenth attempt | ManualReview via guarded sweep; no eleventh automatic attempt |
| EVT-V16 | Reversal first, delayed success, unrelated refund sharing version, Order version gap | All distinct history visible; no business/financial state change |
| EVT-V17 | Paid purchase with notifications unavailable | Existing confirmation/stock/financial result valid; lag visible |
| EVT-V18 | Pending payment exceeds stock deadline or preconfirmation refund races confirmation | Original expiry/compensation/fulfillment safeguards still win; events cannot override |

## Security, failure and operations evidence

| ID | Given / When | Then / evidence |
| --- | --- | --- |
| EVT-V19 | Wrong credential/certificate/vhost/exchange, public Admin token or cross-environment event | Access/source mapping denied; no operator/public broker route |
| EVT-V20 | Secret-looking malformed/oversized body or arbitrary schema URI/header | Body rejected/quarantined safely; no raw payload/logging/network fetch |
| EVT-V21 | Consumer attempts owner write/DDL; relay attempts body edit | Actual grants deny forbidden effects; module boundary review recorded |
| EVT-V22 | Broker/DB outage, resource alarm, normal queue full or parking unavailable | Bounded reconnect/intent retention/safe DLX; no hot loop/drop/false success |
| EVT-V23 | Repeated connection crashes hit delivery limit | Original moves safely to parking; protected intake/quarantine precedes parking ack |
| EVT-V24 | Stale/changed-identity replay, active lease, audit failure or competing same operation UUID | No unauthorized schedule; exact result replay; conflicting tentative changes roll back |
| EVT-V25 | Valid SkipValid, invalid discard and replay of delivered work | Attributed distinct disposition; no false Delivered or reopened terminal receipt |
| EVT-V26 | Shutdown during publish/intake/effect | ≤15s stop and original recoverable identity |
| EVT-V27 | Collector/Loki/Tempo unavailable or duplicate observers | Business work proceeds; export bounded/gap visible; no double-counted backlog/high-cardinality leakage |
| EVT-V28 | Unsupported future schema and compatible upgrade/rollback | Quarantine until supported; unchanged old v1 remains replayable |

## Capacity and restore evidence

| ID | Given / When | Then / evidence |
| --- | --- | --- |
| EVT-V29 | Three reference purchase/event runs, one/two instances | All Phase 08 targets plus EVT healthy lag/service/regression and 41/71 connection budgets |
| EVT-V30 | ≤1,000-event outage/backlog with declared arrival/recovery/operator timing | ≥99% disposition within five minutes; useful receipt rate/oldest age reported |
| EVT-V31 | Storage/queue pressure and ten-minute overload | Controlled admission and bounded workers; required financial recovery/evidence retained |
| EVT-V32 | Broker disk loss with intact complete PostgreSQL | Approved topology recreated; original undelivered events rebuilt; no extra receipt |
| EVT-V33 | Complete archive restored while broker has newer/duplicate messages | Restored-source drain contains unknown/conflicting messages; retained receipts deduplicate |
| EVT-V34 | Corrupt/missing messaging manifest/table/credential and incomplete provider-gap coverage | Restore/reopening fails safely; financial holds stay |
| EVT-V35 | Full timed isolated restore including old refund reversal and unknown external effect | Complete owner/messaging evidence, revoked sessions, no unsafe financial retry; actual RPO/RTO recorded |

## Evidence report and exit gate

Store reports outside the source repository in protected evidence storage. Include scenario ID, artifact/schema/topology/configuration fingerprints, dataset/body distribution, replica/resource/pool/call rates, fault/crash location, primary-clock times, invariants/counts/percentiles, operator actions and outcome. Synthetic provider-shaped load data is labeled and isolated from actual financial owners.

Static checks cover links, schemas, examples, table definitions and compatibility reasoning. Actual PostgreSQL locking/grants, RabbitMQ persistence/DLX/client behavior, Stripe truth, load targets, shutdown, trace plumbing and restore require the corresponding infrastructure. A passing build or schema check does not establish those behaviors.

Phase 09 implementation completes only when every required gate has evidence or an explicitly accepted documented exception. Notifications must remain separate from financial authority; no unproved result is labeled production ready.
