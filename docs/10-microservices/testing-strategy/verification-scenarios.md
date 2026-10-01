# Implementation Verification Scenarios

**Status:** planned manual/implementation evidence, not executed results. No automated tests/projects/files/fixtures/mocks/framework are authorized by this phase. Existing relevant checks are preserved; production logic remains separable from external I/O where practical.

## Evidence protocol

Record scenario ID, artifact/config/schema/data fingerprints, source (Simulator/genuine sandbox/isolated transport), actor/preconditions, original IDs in protected evidence, fault timing, expected/observed commits, invariant queries, latency/resource counts and Passed/Failed/Not run with reason. Never commit real credentials/address/provider payload or raw financial exports.

Run isolated destructive/restore experiments with egress fenced and approved small genuine provider probes only. No runtime result can be inferred from Markdown/schema validation. Capture failures and unanswered samples, not only successful reruns.

## Boundary and contract evidence

| ID | Given / When | Then |
| --- | --- | --- |
| MS-V01 | Separate runtimes attempt cross-database access or provider use from Commerce | Denied; no shared EF/persistence/code/secret path |
| MS-V02 | Wrong/absent/expired/revoked CA/SAN/EKU/scope certificate or forged proxy headers | Bounded rejection before authority/receipt lookup; no sensitive output |
| MS-V03 | Public user sends private path/proof/actor headers, or Customer uses Admin route | Original authority/route error; no new financial intent/disclosure |
| MS-V04 | Malformed UTF-8/duplicate/unknown JSON key, integer exponent/negative zero, depth/size limit | Strict400/413; no command commit; callback limits remain separate |
| MS-V05 | Unrelated/absent Order and actor-bound cursor reuse/deep/equal-time pages | Original ownership404, cursor validation/keyset semantics and no duplicate page item |
| MS-V06 | Independent compatible releases and consumer-before-producer v2 rehearsal | Old durable commands/receipts/events/cursors replay; incompatible pair fails closed |

## Purchase and financial race evidence

| ID | Given / When | Then |
| --- | --- | --- |
| MS-V07 | Kill Commerce before/after acceptance commit/202; retry original key | Exactly one Order/reservation/receipt/initialization intent |
| MS-V08 | Kill Payments before/after initialization/receipt commit; lose response | Same command yields one binding/intent/provider mutation and exact result |
| MS-V09 | Closure arrives before Initialize; duplicate/reordered commands | Original root stops future dispatch; intact no-dispatch proof only |
| MS-V10 | Payments down after acceptance until stock expires | Original receipt/deadline retained; no deadline extension; late capture compensated |
| MS-V11 | Provider call lost response/process dies at earliest-send/window boundary | Original key/window, Unknown retained; no guessed resend after23h or replacement identity |
| MS-V12 | Capture committed, hint lost/duplicate/out of order or broker down | Owner polling discovers exact evidence; hint never authorizes Consume |
| MS-V13 | Admin refund races hold acquisition, repeat both orderings | Exactly one admission; preconfirmation refund_started forbids confirmation and requires full compensation |
| MS-V14 | Cancellation races local Confirmed commit, repeat both orderings | Original cutoff/Order serialization; Committed immutable if it won; requested cancellation wins before confirmation otherwise |
| MS-V15 | Crash after Pending/acquisition/Held/before local decision | Original token/decision recovery; unknown hold never expires or permits refund/fulfillment |
| MS-V16 | Crash after local Consume/Confirmed before resolution | Exactly one Consume/lifecycle event; handoff closed; original Committed resolves |
| MS-V17 | Verified Dashboard effect/correction arrives Held and during Finalizing | Durable deferred normalized evidence; finite barrier; true correction once; mapping anomaly suppresses release |
| MS-V18 | Crash after finalization/release before Commerce result commit | Same release UUID; no Order-version/event increment; Processing blocked until local proof |
| MS-V19 | Timed-out refund admission or same-key changed body/target/two devices | Known original receipt replay; Unknown keeps active slot; no duplicate R/refund/provider operation |
| MS-V20 | Revocation before/after durable Admin authority; public retry after revocation | Before=nointent; afterward original accepted intent may finish; new public request denied |
| MS-V21 | Definite business rejection then reuse key; temporary503 then changed body | Rejected has no successful key; new authorized submission allowed; Unknown retains conflict |
| MS-V22 | Full/partial refund on Confirmed/Shipped/Delivered or correction after confirmation | Order/stock unchanged; exact balances/receipt/correction link and historical outcome |
| MS-V23 | Compensation with prior success/outstanding/failed/Unknown allocations | C−S−R coverage, original case, FailedHold/repair policy; no premature terminal decision |

## Messaging, concurrency and operating evidence

| ID | Given / When | Then |
| --- | --- | --- |
| MS-V24 | Two workers claim same command; lease expires; stale result arrives | One current local application; remote original receipt may still exist; stale token cannot overwrite |
| MS-V25 | Same event ID/different bytes, poisoned schema/route/time/mapping | Durable minimal quarantine; no financial/Order authority or raw malformed body |
| MS-V26 | Publish return/negative/unknown confirm, lost ACK, parking full | No false Published; reliable configured DLX/backpressure; exact original replay/dedup |
| MS-V27 | New hint arrives during pending-marker transfer; duplicate exhausted hint | New version remains pending; unchanged event does not reset recovery |
| MS-V28 | Remote operator replay commit/response lost; active lease conflict | Same operation receipt; local quarantine resolved only after proof; no unsafe lease intervention |
| MS-V29 | Ten unsuccessful network observations, restart/poll/duplicate event | Alerted ManualReview; hold/keys/R/evidence retained; no unlimited retry cycle |
| MS-V30 | Payments/Commerce/broker/telemetry/server individually unavailable | Documented safe degradation and bounded resources; shared server failure accurately reported |
| MS-V31 | Saturated pools/RPC slots/callbacks/queues/disk and shutdown during I/O | Bounded503/429 with correct durability;≤15s drain; no hidden pool/unbounded queue or released hold |
| MS-V32 | Cert/CA/secret/epoch rotation and reused connections | Current allowed peers remain compatible; withdrawn/stale identities rejected; old business IDs unchanged |
| MS-V33 | Instrumented reference and private workloads | All declared per-class counts/targets and48/79 budget; no simulator claim for real financial coordination |
| MS-V34 | Genuine capture/refund/correction probes and retained scan | Small sample limits and account-call budgets; exact convergence; full retained scan≤24h at supported volume |

## Migration and disaster recovery evidence

| ID | Given / When | Then |
| --- | --- | --- |
| MS-V35 | Full isolated migration with Pending/ManualReview/terminal/source/cursor/event history | Complete inventory/digests/keys/windows/receipts preserved; no notification/event regeneration |
| MS-V36 | Cutover old/new processes or in-flight old provider request | Exactly one eligible executor; original external uncertainty retained; no concurrent writers |
| MS-V37 | Rollback before/after target admission/provider write | Before proved safe old topology; afterward compatible app using new authoritative database only |
| MS-V38 | Either archive fails/corrupts, manifest tampered, skew>60s or missing secret | Entire bundle unusable; prior usable point retained; no false recovery completion |
| MS-V39 | Restore every [asymmetry](../deployment-and-devops/backup-and-restore.md#snapshot-asymmetry-decisions) | Both-owner original reconciliation; missing decision/authority/stock cannot fabricate permission |
| MS-V40 | Lost local key/send history, orphan provider effect, old refund reversal | No new financial POST/window guess; actual correction/original-case resolution; scope held until safe |
| MS-V41 | Restored sessions/old runtime traffic/old broker messages | Sessions revoked, epoch fenced, canonical outbox validation/quarantine; no resurrection or stale authority |
| MS-V42 | Timed full restore/reconciliation/reopening | Actual oldest-bound RPO≤24h and safe RTO≤2h; time miss recorded Failed without weakening containment |

## Coverage and completion

V01–06 cover E1 boundary/contracts; V07–29 cover E2 durable coordination; V35–37 cover E3 migration; V30–34/V38–42 cover E4 operations; E5 requires all applicable rows plus NFR evidence. Review every owner write path against root/hold locks and every distributed commit boundary against durable replay identity.

Source/build/static/schema checks are separate evidence from PostgreSQL concurrency, mTLS ingress, broker delivery, Stripe mapping, multi-process fault/load and timed restore. Existing related automated checks may be run; adding new automation/framework remains a later explicit user decision.
