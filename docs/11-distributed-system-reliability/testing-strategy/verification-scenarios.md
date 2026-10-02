# Verification Scenarios and Evidence Index

**Status:** specification of future verification; every runtime scenario is **Not run** in this documentation task. No automated test implementation is requested or created.

| ID | Scenario and required assertion | Functional / quality mapping | Experiment |
| --- | --- | --- | --- |
| REL-V01 | Acceptance before/after commit response loss: all-or-none and original replay | FR01; NFR01/03 | F01 |
| REL-V02 | Remote command/refund admission before/after commit response loss: original receipt/allocation only | FR01/05; NFR01–03 | F02 |
| REL-V03 | Lost hold acquisition: original confirmation/token, no timeout release/successor | FR04; NFR04 | F07 |
| REL-V04 | Crash before/after Consume/Confirmed/decision commit: one atomic terminal decision | FR04; NFR01/04 | F07 |
| REL-V05 | Cancellation/refund/stock expiry versus hold: correct safe branch, finite barrier | FR04/05; NFR01/04/13 | F07/F08 |
| REL-V06 | RPC/action timeout and every continuation observation charged before I/O | FR02/03; NFR05/08 | F03 |
| REL-V07 | Jitter boundary/first-send/stock/window checks; safe window never restarts | FR02/05; NFR05/18 | F03/F08 |
| REL-V08 | Open circuit/no-slot/429 deferral cannot keep work pending indefinitely | FR02/03; NFR06/07 | F04/F05 |
| REL-V09 | Primary outage preserves original cycles; overdue sweep after recovery | FR02/09; NFR06/07 | F12 |
| REL-V10 | Whole-local known rollback retry≤1; no network wrapped in retry transaction | FR01/02; NFR01/08 | F12 |
| REL-V11 | Crashed tenth claim, expired lease/stale apply/restart keep count/due | FR02/08; NFR05/06/08 | F06 |
| REL-V12 | Exact breaker threshold/window/open/half-open, valid error classification, no default balance | FR03; NFR09/14/15 | F03/F04 |
| REL-V13 | Provider gate/quota/one executor and SDK retry0 unchanged; all probes counted | FR03/05; NFR14/18 | F08 |
| REL-V14 | Process breaker restart and independent classes do not reset durable budgets | FR02/03; NFR05/14 | F04/F06 |
| REL-V15 | Saturated reads leave command slots; no unbounded task/queue growth | FR03/08; NFR16/19/20 | F05 |
| REL-V16 | Invalid certificate/role/epoch/redirect guidance fails closed, no timer auth recovery | FR03; NFR02/14 | F14 |
| REL-V17 | Resume same ID/actor/body replays; changed target/actor/body conflicts | FR06; NFR02/23 | F06 |
| REL-V18 | Resume stale version/active lease/audit failure rolls back; parent/child scheduling agrees | FR06; NFR23 | F06/F12 |
| REL-V19 | Current authority versus already durable Admin intent; service cert cannot forge role | FR01/05/06; NFR02 | F02/F14 |
| REL-V20 | Unknown outcome/integrity hold cannot be force-cleared/replaced/released | FR04–06; NFR01/04/23 | F07/F08 |
| REL-V21 | Definitive failed compensation only: unique original repair mapping and retained coverage | FR05/06; NFR01/23 | F08 |
| REL-V22 | Required outbox insertion failure rolls back producer mutation; confirm/no-return guard | FR07; NFR01/03 | F09/F12 |
| REL-V23 | Lost confirm/ack yields original byte replay and one logical sink receipt | FR07; NFR03/24 | F09 |
| REL-V24 | Body/depth/key/time/schema/source/identity poison cases quarantined without sensitive logs | FR07; NFR21/22 | F10 |
| REL-V25 | Main/parking pressure/DLX failure, finite counters and canonical protected replay | FR07; NFR05/21/26 | F10 |
| REL-V26 | Hint ordering, guarded transfer, invalid high version, missing event and actual owner authority | FR07; NFR01/24 | F11 |
| REL-V27 | Same workload comparison: jitter dispersion and breaker failing-call reduction≥80% | FR02/03/08; NFR05/14/15 | F03/F04/F13 |
| REL-V28 | Original public/private workload targets, unrelated outage regression≤10% | FR03/08; NFR09–13/20 | F03–05 |
| REL-V29 | Fair turns≤30s, account scan≤24h, recovery≤5m disposition with full denominator | FR08; NFR07/17/18 | F05/F13 |
| REL-V30 | Correlated traces/logs/metrics, sampling gaps, cardinality/privacy and diagnostic outage | FR08; NFR20–22 | F14 |
| REL-V31 | Pool48/79, disk growth/reserve gates and no original evidence deletion | FR08; NFR19/26 | F13 |
| REL-V32 | One-owner/shared-primary outage, lock/pool deadlines and callback durability | FR01/08; NFR03/08/19 | F12 |
| REL-V33 | Graceful/forced shutdown and stale external executor safety | FR02/09; NFR01/08/18 | F06 |
| REL-V34 | Deferred observation time/barrier race/integrity release suppression | FR04; NFR01/04 | F07/F11 |
| REL-V35 | Genuine late capture, Unknown refund, failed coverage/repair and correction branches | FR05; NFR01/18/27 | F08 |
| REL-V36 | Authenticated paired-v3 archive, skew/gap inventory and timed safe RPO/RTO | FR09; NFR25 | F15 |
| REL-V37 | Paired restore rotates process epochs, revokes sessions/old egress, one executor | FR09; NFR02/18/25 | F15 |
| REL-V38 | Missing/asymmetric accepted history/source remains contained, no fabricated proof | FR07/09; NFR01/24/25 | F15/F16 |
| REL-V39 | Legacy scheduling activation preserves stored due/count/bytes; unprovable start remains review; compatible rollback cannot rewind budget | FR02; NFR05/06/24 | Isolated migration/release review |
| REL-V40 | Independent compatible reader/writer releases preserve closed v1 contracts/cursors/receipts; incompatible combinations fail readiness | FR01/07; NFR24 | Isolated deployment matrix |
| REL-V41 | Tool schema/semantic boundaries, owner target mapping, resume receipts/audit/grants and page cursor scope | FR06; NFR02/23 | Owner-local contract/permission review |
| REL-V42 | Rolling30-day availability ledger includes eligible failures, missing intervals and maintenance without a short-drill SLA claim | FR08; NFR28 | Existing operational SLI ledger; hosted evidence later |

FRxx means REL-FR-xx in [functional workflows](../functional-requirements/reliability-workflows.md); NFRxx means REL-NFR-xx in [quality targets](../non-functional-requirements/quality-targets.md); Fxx means REL-Fxx in the [catalog](fault-experiment-catalog.md).

## Contract and persistence review

Before runtime injection, perform the strongest available non-test review:

- Closed original public/private/event schemas and example bytes; tool schema positive/boundary/negative examples; semantic owner guards remain separate from JSON shape.
- Original route/principal/caller mapping and effective HTTP handler defaults; exact supported runtime/library/provider API versions.
- Actual migration SQL/checks/FKs/grants, operation race rollback and work indexes/plans; no destructive or cross-owner change.
- Complete pools/processes, handler/executor/queue caps, account rate/scan inventory and runtime configuration fingerprint.
- Existing application build/static/format checks if application exists. A build alone cannot pass the runtime scenarios.

This phase intentionally supplies no new test framework, files, fixtures or mocks. Existing relevant automated checks may be run during implementation; new automated tests require the user's explicit request.

## Evidence entry format

For each ID record status/branch, build/schema/profile/environment fingerprints, fault facility/duration, expected invariant, observed owner evidence references, complete counts/timings, security/privacy review, cleanup/reopen result, reviewer and limitation. Keep sensitive records protected; never paste credentials/raw provider payloads.

Mark Passed only for actually executed successful assertions. Failed criteria remain blockers for that capability; Not run remains a gap. Genuine-provider capacity/sample restrictions are disclosed rather than replaced by invented facts.

REL-V42 has two evidence levels: review the existing SLI/denominator implementation now; retain hosted30-day objective evidence as Not run until an actual hosted window exists. That later evidence limitation does not waive current timeout, correctness, security or recovery gates.

## Learning review

Present five reconstructed original-object timelines: healthy purchase, lost remote admission response, partitioned confirmation, late capture with compensation failure and asymmetric restore. Explain counter identity, finite-cycle disposition, authority, lock/commit boundaries, source proof and any unresolved state. Demonstrate that telemetry helps find the authoritative records without becoming the authority.
