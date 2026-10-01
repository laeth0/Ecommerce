# Migration, Cutover and Rollback

**Status:** required operator-reviewed first extraction. No transfer or migration was performed by this documentation task. Use maintenance single-writer transfer; no dual write, CDC, online cross-owner FK or automatic startup migration.

## Preconditions and complete inventory

Record original release/config/schema/provider-account/API fingerprints, all roles/grants, accepted-source mappings, current provider gate, persisted executor lease, next scan cursors and all outstanding mutations. Inventory every table/index/FK/function/sequence/grant and cursor signing key referenced by Payments. A list of only intents/refunds is insufficient.

Transfer bindings, intents, cases, refunds, refund receipts, provider mutations, facts, financial work, webhook inbox, quarantine, audits, account gates and the Phase 09 refund outbox. Preserve IDs, exact canonical bytes/digests, original receipt fields, actor/key scopes, provider parameters/keys, first-send and safe-until, scan continuation, attempts/cycles, financial versions, facts/corrections and external account association. Source assignments require the explicit transformation below.

Commerce keeps Checkout acceptance/commands/work, Orders/audits/outbox, actual stock groups/movements and Notifications inbox/receipt/quarantine. Inventory simulator Orders separately; do not manufacture Stripe bindings/facts for them.

Required preflight evidence: exact table counts and sorted PK/content digests from a consistent snapshot, mapped cardinality, C/S/R reconciliation, provider-object/key uniqueness, refund replacement/correction linkage, complete receipt/outbox hash comparison and no unmapped stock/Order. Inspect the generated migrations for unrelated drops/cascades/snapshot drift. Fail on mismatch rather than guess a mapping.

## Rehearsal

In an isolated restored copy with outbound provider egress disabled, rehearse migration/grants/reconciliation/startup/rollback. Measure transfer and gate-closed time. Restoration permits inspecting copied records; it never permits dispatching copied provider operations as new work. Verify canonical envelopes/cursors/receipts against old consumers and original IDs.

Source descriptors derive from original approved account/API/method/fixture choices. Register immutably at Payments; backfill Commerce assignment/default references and original accepted bindings by exact fingerprint. Retain operator attribution/time. A missing original method/fingerprint blocks cutover; new defaults cannot repair history.

Historical confirmed Orders need a historical Committed decision and resolved handoff proof tied to the exact original capture, actual mapped Consumed stock and original confirmation audit/version/time. Backfill through protected migration with deterministic recorded new metadata IDs; do not publish new lifecycle/refund events or increment business versions. Later valid refunds/cancellations do not invalidate historical confirmation proof. Conflicting capture/stock history remains held.

Migrate accepted refund receipt correlations to local Applied Commerce key entries using original admission audit evidence and original receipt/refund ID. They are imported historical admissions, not invented fresh human authorization, and must never be scheduled for dispatch. If a correlation is absent, remote successful-key replay can still return the original receipt after exact public request comparison.

## Controlled production-style transfer

1. **Contain:** close new purchase/refund/fulfillment gates and protected repair mutation; advertise maintenance through existing bounded errors. Keep read-only behavior only where safe. Record gate changes/audits.
2. **Quiesce:** stop Commerce Checkout/simulator/expiry mutations where required for the consistent transfer, Payments executor/inbox application/scan/relays and notification/hint consumers. Stop/revoke the old executor lease and remove its network/secret ability to dispatch. Wait bounded shutdown; forced shutdown leaves original work uncertain, not completed.
3. **Ingress:** route callback temporarily to maintenance 503 so Stripe can retry; do not acknowledge into a financial store that will be discarded. Retain the original webhook path/signing secret and later retry/dedup semantics.
4. **Snapshot:** take authenticated off-host original whole-database backup plus consistent transfer manifest/counts/digests. Reconcile in-flight first-send records/provider uncertainty; do not reset windows/leases by copying.
5. **Build target:** use one protected migration authority at a time. Create Payments database/schema, migrate the full owner data, add roots/descriptors/mapped epochs and new protocol tables, remove only obsolete external FKs, validate all remaining constraints.
6. **Prepare Commerce:** apply compatible local additions and mappings; backfill historical handoffs/refund correlations. Replace runtime adapters and remove provider code/SQL references. Source assignments now belong to Commerce.
7. **Privilege transfer:** revoke old runtime Payments grants/credentials and revoke CONNECT to the other database for each runtime. PostgreSQL grants are not negative denies: revoke PUBLIC CONNECT and review inherited memberships/owner/superuser privileges. Neither runtime is owner or privileged backup/migration role.
8. **Start dark:** set the same new paired runtime epoch; deploy Payments with dispatch disabled and Commerce in maintenance. Exercise mTLS/read/receipt/decision/descriptor validation and original cursor compatibility. Reconcile every manifest row/hash/count/equation.
9. **Route:** switch only exact signed callback to Payments; enable durable ingress/owner application. Enable Commerce financial hint intake and original notification routes after canonical source checks. Resume original uncertain mutations under the unchanged provider window.
10. **Activate one writer:** prove no old process/container/network credential can execute Stripe, acquire exactly one new account executor lease, then enable new provider executor. Record old/new lease and secret disposition. No overlapped “health check charge”.
11. **Reconcile and reopen:** verify accepted work, cancellations, holds and provider gap; reopen gates only with integrity inventory clear and compatible deployment proven. Observe alert/resource/workflow SLIs. Retain original database backup sealed read-only, never as an active financial fallback.

A stopped lease may be removed only under protected single-writer proof after old executor process/egress is fenced. An expired lease alone cannot prove that an old network request never reached Stripe. Original mutation identity/windows resolve external uncertainty.

## Rollback boundaries

**Before any target owner financial write/provider dispatch:** stop target processes/ingress, prove no external effect and no admitted new intent, restore the original compatible application/data under the same maintenance controls, reconcile callbacks and reopen.

**After target writes or dispatch:** application rollback is allowed only to a compatible release that continues using the new Payments database/protocol. Never restart the old financial copy, dual-write, discard new receipts/facts or replay charges from the old snapshot.

A reverse extraction, if genuinely necessary, is a separately reviewed maintenance migration that transfers all new owner/coordination/event history back and reconciles provider gaps. It is not an automatic fallback or a command in this phase.

Database migrations are forward-compatible where possible; destructive schema rollback cannot be inferred from application rollback. Retain reader support for every existing command/event/receipt version. Breaking changes require explicit v2 transition approval.

## Exit record

Record complete inventories/digests, failures and resolution evidence, measured downtime, gate/role/route/epoch fingerprints, exact one-executor proof, original receipt/cursor replay, unaffected Commerce checks, rollback exercise and integrated restore outcome. All mismatches or missing provider/stock/decision evidence block writer transfer/reopening.
