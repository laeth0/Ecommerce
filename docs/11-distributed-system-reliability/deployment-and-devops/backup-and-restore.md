# Reliability Backup and Restore Requirements

## Preserve the recovery unit

The [Phase 10 paired-v3 manifest and backup protocol](../../10-microservices/deployment-and-devops/backup-and-restore.md) remain authoritative. Phase 11 adds no manifest wire field/version and no claim of a globally atomic snapshot.

Include all original owner tables/constraints/grants/version evidence and new scheduling fields, resume receipts/audits, inactive/ManualReview work, original operation identities and profile fingerprints in the existing inventory. Omission of terminal/held/review evidence makes the pair unusable.

| Policy | Binding requirement |
| --- | --- |
| Schedule / completeness | Every12h; both owner archives, protected inventory, encryption/authenticated manifest and off-host read-back/decryption≤30m |
| Per-owner consistency | Separate read-only Repeatable Read exported snapshot/coordinator and one serial dump/database |
| Snapshot skew | Coordinators start within60s; independently consistent, no global atomic point |
| Backup connections | Two coordinators + two concurrent serial dumps =4, already counted in31r+17 |
| Retention | ≥14 complete paired bundles/7d plus one in progress; never combine arbitrary jobs |
| RPO | ≤24h from older conservative snapshot lower bound of a usable pair |
| RTO | ≤2h from declared service loss to safe integrated capability reopening |
| Drill frequency | Before exit, monthly and after material protocol/schema/source/secret change |

Secrets remain protected references/versions, not manifest values or shell arguments. Retain off-host archives independently of primary disk/host loss. No schema activation/epoch rotation/owner transfer overlaps a backup job.

## New metadata restore semantics

- Restore exact due time, count, cycle start/deadline, profile, work version and receipt bytes. Do not resample a committed delay or open a fresh cycle because the process restarted.
- Overdue active cycles enter ManualReview under guarded sweep. Their hold, R, original commands and provider windows remain effective.
- Restore owner-local operator receipt/audit atomically with original schedules. A repeated operation ID returns its original receipt after current operator authorization.
- Private breaker memory is non-authoritative and not in the business recovery unit. New processes begin Closed; old work deadlines and gates still protect dispatch.
- Runtime process epoch rotates only through the paired protected recovery procedure. Original acceptance epoch/command bytes remain immutable; a stale process cannot adopt the new active epoch by reading it.
- Retained v1 readers and active scheduling policy are part of compatibility validation; no rollback to a writer that discards new work metadata.

## Integrated restore sequence

1. **Contain/fence:** close new purchase/refund/fulfillment and provider dispatch; stop/fence old owner workers and provider egress, revoke obsolete runtime/session access. Preserve accessible external evidence. An expired executor lease is not proof of no send.
2. **Select/authenticate:** verify complete same-job pair, conservative bounds/skew, archive/manifest integrity, owner inventory, supported release/schema/profile/key/grant versions and decryption access.
3. **Isolated restore:** restore both owner DBs using protected credentials with separately declared resource/connection bounds. Do not add restore pools to the active primary budget.
4. **Authority/security:** validate role/CONNECT/schema ownership, no cross-owner runtime grants, JWT/session revocation, Admin restriction, private cert trust/scopes and original source/account/mode.
5. **Epoch/claims:** rotate active paired deployment epochs; start compatible fresh processes with admission closed. Preserve possible-send records/counts/windows; reject old processes before claim/mutation/dispatch.
6. **Owner integrity inventory:** compare original accepted mappings, receipts/authority, Order/stock decision, hold/terminal decision/barrier/release, cases/refunds/R/facts/corrections, original outboxes/inboxes/sink/operator evidence.
7. **Coordination reconciliation:** use authenticated private owner queries and original history, never cross-database runtime SQL or log reconstruction. Apply only the original protocol's safe next step.
8. **Provider gap:** retrieve/reconcile relevant genuine original objects from at least5m before the older conservative bound through current recovery. Include old objects changed later, old refunds reversed and unknown first sends; created-time-only search is incomplete. Apply original owner hold/mapping/equation rules under account limits.
9. **Message/source reconciliation:** validate retained broker messages against original restored canonical owner records before intake. Missing/conflicting source remains review/containment; restore cannot invent event IDs/bodies.
10. **Resume/reopen:** prove one account executor and fenced old egress, safe original keys/windows, current identity/schema/profile, complete accounted gap and no blocking history/integrity scope. Open each capability only with its required evidence; record time through safe reopen.

## Asymmetric histories

| Restored knowledge | Safe next step | Blocking condition |
| --- | --- | --- |
| Commerce terminal decision, Payments Held | Authenticate exact original decision/token/mapping; finalize finite barrier | Missing/conflicting token/owner proof |
| Payments Held, Commerce Pending | Original coordinator rechecks actual stock/cancellation/deadline | No timeout-based abort/release |
| Payments ResolvedCommitted, Commerce has matching Committed/Consume | Recover original owner release and local guard metadata | Current integrity conflict |
| Payments ResolvedCommitted, Commerce missing decision/Consume | Recover complete authenticated original Commerce history, or reviewed safe financial resolution | No fabricated Consume/confirmation; missing history keeps scope contained |
| Commerce accepted work, Payments missing receipt/binding | Reconcile exact original initialized/provider/authority history | 404 is not never-dispatched proof or fresh initialization permission |
| Provider effect with no restored accepted mapping | Quarantine original external evidence and hold one-merchant affected admission/fulfillment scope | Cannot create an accepted Order from provider metadata/logs |
| Broker message absent from restored canonical source | Source/history review through protected owner tooling | Cannot replay invented source row |
| Resumed work present, operation receipt missing | Treat pair/inventory inconsistency as integrity failure | Cannot recreate authority from a reason/log line |

Quarantine/ManualReview is a safe disposition, not waiver of a reopening blocker. Financial resolution cannot claim a lost accepted business record was recovered. Some disaster gaps require original authenticated history or external/provider review; this topology does not promise zero financial loss.

## Recovery evidence and timing

Record service loss, containment/fencing, archive bounds/authentication, both restore completion times, security/grant/session proof, epoch changes, inventory mismatch count, complete provider-gap coverage, original-object reconciliation, source/decision/hold outcomes and safe reopen. Report RPO from older bound and total RTO, including manual proof work.

Reconcile≤100 affected objects in the declared bounded drill; do not extrapolate to a larger lost-history population. At provider quota/concurrency limits, compute minimum gap retrieval time before asserting2h RTO. If volume or missing evidence prevents safe reopening within2h, record Failed RTO and keep containment. A faster unsafe reopen is not recovery.
