# Extraction Workflows and Scrum Acceptance

**Status:** required stories for MS-E1–MS-E5. [Private contracts](service-api-contracts.md), [coordination](../reliability-and-failure-scenarios/workflow-coordination.md) and owner schemas supply exact implementation rules. All amounts use USD integer cents.

## MS-01 — Exclusive Payments ownership

**Actor:** engineer/operator. **Preconditions:** phases 01–09 implemented; inventories and cutover rehearsal available. **Trigger:** extract Payments to a separately released ASP.NET Core service.

Move provider code, credentials, bindings, facts, refund allocations/receipts, mutations, webhook inbox, financial work and both Payments outboxes to its database/process. Commerce retains every other module and the isolated Development simulator. Replace Payments SQL and direct module calls with the documented private adapter. Revoke cross-database CONNECT/schema/table privileges; remove obsolete runtime code and credentials only during the controlled cutover.

**Rules/validation:** no shared EF context, entity assembly, cross-service repository, provider SDK in Commerce, remote SQL, distributed SQL transaction or common migration lifecycle. A small versioned wire-contract package is acceptable only if consumers can upgrade independently; never distribute owner persistence classes. Private service validation remains mandatory.

**Expected result:** each runtime can access only its database; stopping Payments leaves Catalog/Cart/history/local expiry functional. Shared PostgreSQL/broker/edge outages remain shared failures.

**Errors/edges:** incompatible contract fails readiness or bounded request validation; no fallback to old provider code. Authority is workload mTLS plus operation-specific scope. Consistency is owner-local ACID and durable remote coordination.

**Acceptance:** Given both runtimes, when Commerce attempts a Payments SQL connection or Payments attempts a Commerce connection, then access is denied; when Payments stops, then unrelated Commerce endpoints meet their documented degraded behavior.

## MS-02 — Accept and initialize an original purchase

**Actor:** eligible Customer and Checkout coordinator. **Preconditions:** current quote/cart/source reference and original local admission rules. **Trigger:** original Checkout submit.

Commit the accepted receipt, immutable Order, stock reservation, four work rows, stable payment/case identities and InitializePayment command in Commerce. Return the original 202. Outside all transactions send that immutable command to Payments; owner deduplicates and creates binding/intent/work/receipt before provider dispatch.

**Validation:** exact amount, USD, source fingerprint, account compatibility, all mapped IDs, original acceptedAt and 15-minute reservation deadline. Mismatched reuse is an integrity conflict. Payment method/account values are resolved only from the immutable Payments descriptor.

**Errors/edges:** timeout keeps the original command Unknown; source mismatch remains visible for repair; remote outage never extends stock. If closure wins first, the same original root remains stopped and initialization cannot dispatch. Restore-era missing remote state requires reconciliation, not fresh charging.

**Acceptance:** Given lost initialization response, when the command is retried, then one binding, one intent and one original provider mutation exist; given expired stock, late capture starts compensation and never confirms.

## MS-03 — Confirm with financial and stock proof

**Actor:** Checkout coordinator. **Preconditions:** admitted exact capture, eligible Order, original active stock and no admitted refund/closure/hold. **Trigger:** captured owner observation.

Persist Pending decision locally; acquire the durable owner hold; reacquire original Commerce locks; commit mapped Consume, Order Confirmed, terminal Committed decision and original lifecycle outbox atomically. If local guards fail, commit Aborted with safe stock disposition instead. Communicate/query the original terminal decision until Payments drains its finite barrier and resolves. Record fulfillment release locally before StartProcessing.

**Rules:** public capture hints never authorize Consume. The hold never expires. Cancellation winning the Order lock forces Aborted; historical Committed never becomes Aborted. Deferred facts remain durable and visible as blocked availability. Processing is blocked while release is unknown.

**Errors/edges:** crash before/after each commit reuses confirmation identity/token; database/network failure retains Pending/Held; conflict or exhausted reconciliation enters ManualReview with the hold effective.

**Acceptance:** Given Admin refund racing with acquisition, exactly one admission wins; an admitted preconfirmation refund prevents purchase confirmation and requires full remaining compensation. Given Confirmed but lost resolution, then stock is consumed once, one lifecycle event exists and fulfillment remains blocked until proved release.

## MS-04 — Cancellation and full compensation across services

**Actor:** owner Customer/restricted Admin and coordinators. **Preconditions:** cancellation cutoff and authority from Phase 05. **Trigger:** original cancellation request or unsafe purchase outcome.

Commit the local request first. Persist RequestClosure; obtain definitive no-capture evidence or EnsureCompensation with the original case UUID and full captured target. Finish Order Failed/Cancelled only after terminal mapped stock and known durable safe financial resolution. A compensation coverage receipt acknowledges the obligation, not refund settlement.

**Rules:** existing S and R count toward C. Unknown refund retains R. Failed compensation retains coverage until protected proof-based repair. Cancellation after historical confirmation leaves consumed stock unchanged; later refund events cannot restock.

**Errors/edges:** closure before initialization creates a tombstone; missing restored intent is not no-dispatch proof; holds resolve through the immutable Commerce decision; late capture uses the original case.

**Acceptance:** Given a late verified capture with expired stock, then the original full case covers C−S−R and the Order never authorizes fulfillment; repeated cancellation cannot allocate a second case.

## MS-05 — Authorized Admin refund with uncertain remote admission

**Actor:** restricted Admin. **Preconditions:** current Identity authority, original request syntax/Order source and Idempotency-Key. **Trigger:** original public POST.

Commit immutable authority and command intent under Identity serialization. Release the connection; send IssueRefund. Payments applies its original financial guards and creates allocation/mutation/audit/public receipt atomically. Commerce returns the exact 202 only on known admission. On timeout return existing 503 and retain the active original command.

**Rules:** original actor/key scope spans all Orders. Successful receipt replay precedes current financial admission guards. A definitive business rejection closes the command but binds no successful public key. Unknown remains active and conflicts with changed input. Each new public attempt requires current authority; system retry uses the approved prior authorization.

**Errors/edges:** revocation before authorization prevents work; revocation afterward may precede admitted completion. Concurrent tabs serialize the local actor/key slot and remote receipt uniqueness. A confirmation hold rejects a new refund. A refund admitted first blocks confirmation even before provider dispatch.

**Acceptance:** Given remote admission committed but response lost, original retry returns the same refundId/version/acceptedAt and creates no second allocation; given revocation, no newly unauthorized intent is persisted.

## MS-06 — Financial reads and event-assisted recovery

**Actor:** authorized Customer/Admin, intake and workers. **Trigger:** original read or financial-change event.

Commerce scopes local Order before one bounded owner query. Payments returns its current primary snapshot without provider I/O, applying original cursor/audit rules. The financial-change consumer persists deduplication and a scheduling hint; existing Checkout recovery obtains authoritative evidence independently.

**Rules:** forged/out-of-order/duplicate hints grant no money/stock authority; unchanged hints do not reset retry cycles. GET outage gives existing 503. NotPrepared/version 0 is permitted only after current-epoch proof of genuinely pending remote initialization; it is never inferred from a remote 404. Known legacy simulator data stays local.

**Acceptance:** Given missing broker traffic, owner polling still recovers accepted work within its bounded healthy-work targets; given stale hint, the current financial read wins.

## MS-07 — Owner-scoped operator repair and independent releases

**Actor:** protected attributed operator. **Trigger:** finite exhausted work, quarantine or release.

Inspect original evidence and choose only existing proof-based actions. Remote replay uses one durable operation identity and separate local/remote receipts. Deploy compatible service versions independently; breaking protocol change requires a separately reviewed v2 transition. No generic “set paid”, “clear hold” or replacement-key command exists.

**Acceptance:** Given lost remote replay response, the same operation replays one receipt; given unresolved decision, operator resume schedules original work without opening financial/fulfillment permission.

## MS-08 — Migration and integrated disaster recovery

**Actor:** operator. **Preconditions:** complete inventories, supported compatible releases and backups. **Trigger:** first cutover or restore.

Use the [single-writer transfer](../database/migration-and-cutover.md) and [two-database restore](../deployment-and-devops/backup-and-restore.md). Reconcile commands, decisions, source mappings, provider gaps, notification history and financial holds before reopening gates.

**Acceptance:** migration preserves every original receipt/key/fact/event byte; a post-cutover rollback never starts the obsolete financial database; a restore with one-sided confirmation/authorization evidence remains contained until attributed reconciliation proves the original result.

## Scrum exit review

For each story record actor/precondition, owner commits, uncertainty boundary, negative scenarios and evidence. Complete E1 before E2; rehearse E3 before first writer transfer; complete E4/E5 before calling extraction operational. Carry unresolved defects as explicit blockers rather than moving safety requirements to Phase 11.
