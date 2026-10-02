# Failure Behavior Matrix

**Rule:** uncertainty retains original identity, money coverage and confirmation guards. Review is an explicit disposition, not a successful purchase/refund. Every row needs observed owner evidence in later implementation.

| Failure point | Expected API / workflow behavior | Durable recovery and invariant | Evidence / experiment |
| --- | --- | --- | --- |
| Commerce before acceptance commit | Existing bounded failure; no committed acceptance | Transaction rolls back Order/reservation/receipt/intents together | REL-V01; F01 |
| Commerce acceptance commit, response lost | Public result Unknown; same key/body recovers original 202 | One accepted mapping/Order/reservation, no duplicate side effect | REL-V01; F01 |
| Payments command before admission commit | Unknown/transient result | No partial allocation/receipt; original command retries | REL-V02; F02 |
| Payments admission commit, response lost | Public refund stays uncertain until known admission | Original allocation/key/receipt remains; no replacement | REL-V02; F02 |
| Private one-way partition | Local routes continue if local dependencies healthy; financial routes fail boundedly | Class isolation, original intent/due/finite review; reverse decision query may fail separately | REL-V12–16; F04 |
| Peer slow beyond 2s | Bounded RPC timeout; possible committed outcome remains Unknown | Release slot/connection, preserve original request and charge; no handler retry | REL-V06/12; F03 |
| Circuit open / local RPC slots full | Financial read unavailable; durable work deferred | Five-minute cycle still ages; no zero-balance fallback/no network counter refund | REL-V08/12/15; F04/F05 |
| Commerce required primary unavailable | Readiness fails; durable acknowledgement cannot be promised | No in-memory replacement work; overdue sweep after recovery | REL-V09/32; F12 |
| Payments primary unavailable | Financial reads/commands/callback durable intake unavailable | Callback non-200 permits provider retry; Commerce retains accepted work | REL-V09/32; F12 |
| Shared PostgreSQL server fails | Both owners unavailable | Physical coupling declared; no HA claim or financial default | REL-V32/36; F12/F15 |
| Local deadlock/serialization abort | One whole-local retry after known rollback within deadline | No network under transaction; no duplicate outbox/audit/effect | REL-V10/32; F12 |
| Worker crash before/after original send | Lease recovery; external outcome may remain Unknown | New token fences local apply; original provider identity protects external uncertainty | REL-V11/33; F06/F08 |
| Stale lease result | Reject local apply under old token/version | Retain possible remote truth; current worker queries it | REL-V11; F06 |
| Acquire hold response lost | Pending acquisition Unknown | Original confirmation ID; no successor/release by timeout | REL-V03; F07 |
| Commerce crashes before decision commit | No partial Consume/Confirmed/decision | Recheck original stock/cancellation/deadline before deciding | REL-V04; F07 |
| Commerce crashes after decision commit | Historical confirmation/abort retained | Retry exact terminal decision; no second Consume/reversal | REL-V04; F07 |
| Stock expires while held | No fresh Consume; purchase stops safely | Original deadline unchanged; hold resolved from terminal decision, late capture compensated | REL-V05; F07 |
| Deferred effects arrive continuously | Held stays blocked, later Finalizing uses fixed barrier | One application/fact per normalized effect; no unbounded barrier extension | REL-V05/34; F07/F11 |
| ResolvedCommitted has integrity anomaly | No usable current release | Proof-based original repair; no clear-all hold/forced fulfillment | REL-V20/34; F07 |
| Admin refund wins before confirmation | New confirmation blocked | Stop unconfirmed purchase, release active stock, original full remaining compensation | REL-V05/35; F08 |
| Admin revocation after durable authorization | Original accepted immutable intent may complete | Fresh public request/replay still checks current authority | REL-V19; F02 |
| Late verified capture | No fulfillment on unusable stock | Original case covers captured money; no reservation extension | REL-V35; F08 |
| Unknown refund / safe POST window ends | Keep R and original identity; retrieval/review | No fresh POST window/key or replacement unknown refund | REL-V07/35; F08 |
| Definitively failed compensation | FailedHold retained, protected repair eligible | One exact replacement chain only after original proof | REL-V21/35; F08 |
| Refund reversal | Owner admits linked correction; coverage may reopen | Same original compensation case; Order/stock history unchanged | REL-V35; F08 |
| Stripe transport/5xx outage | Existing provider gate closes; unrelated Commerce routes continue | One account executor/quota/read-only probe; no layered circuit/SDK retry | REL-V13/29; F08 |
| Provider wrong account/mode/amount | Integrity/security containment | Retain evidence; no default capture/no auto repair by timer | REL-V20/35; F08 |
| Broker unavailable / publish confirm lost | Outbox retained; business commit unchanged | Original source/ID/bytes retry; possible duplicate delivery deduped | REL-V22/23; F09 |
| Consumer commit then ack lost | Redelivery expected | Same source/ID byte comparison; one logical local sink effect | REL-V23; F09 |
| Poison envelope / future time / source conflict | Quarantine/parking and bounded alert | No business state advance or silent valid-source substitution | REL-V24; F10 |
| Main/parking queue full or DLX unavailable | Bounded overflow/backpressure; never drop authoritative original outbox | Retained durable evidence and admission gate; protected canonical recovery | REL-V25; F10 |
| Financial hints duplicate/out of order/missing | No direct money or Order mutation | Actual owner evidence plus dedup/local version guarded wake; retained polling covers lost hints | REL-V26; F11 |
| Operator resume races active worker / audit fails | Conflict or rollback; no partial scheduling | Same operation ID/actor/request; active lease cannot be stolen | REL-V17/18; F06 |
| Certificate/role/epoch invalid | Deny and alert; no insecure retry/fallback | Repair identity/trust/correct process epoch under protected procedure | REL-V16/37; F14/F15 |
| Shutdown exceeds drain | Stop/kill process, retain uncertainty | Fenced original lease and provider identity; never mark complete to ease shutdown | REL-V33; F06 |
| Authoritative disk approaches full | Existing 70% warning, 85% containment/horizon gates | Preserve resolution reserve; no auto deletion of receipts/tombstones | REL-V31; F13 |
| Telemetry unavailable | Business owner proofs remain durable; diagnostic loss alert | Bounded exporter queues/drop counts; logs are not business storage | REL-V30; F14 |
| Asymmetric restore | Capability containment until original history/gap reconciled | Fenced old executor, rotated epochs, no invented Consume/order/source | REL-V36–38; F15/F16 |

Fxx refers to REL-Fxx in the [catalog](../testing-strategy/fault-experiment-catalog.md). No fault in this table authorizes broader product scope or a second provider executor.
