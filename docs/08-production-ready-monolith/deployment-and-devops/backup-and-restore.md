# Backup and Integrated Restore

**Status:** required sandbox recovery design and manual drill. No backup, credential, database restore or provider reconciliation is performed by this documentation task. Inherit the [global objectives](../../00-project-overview/global-definition-of-done.md#42-availability-and-recovery-targets) and [Payments recovery rules](../../07-payments-and-refunds/deployment-and-devops/configuration-and-operations.md#backups-and-integrated-restore).

## Recovery objective and proof

**RPO ≤24 hours:** bound the lost local-data interval conservatively using the latest usable complete archive's snapshot lower bound. **RTO ≤2 hours:** elapsed from declared service loss to compatible, authorized and reconciled safe service, including sessions, grants, invariants, original-work recovery and reopening. Record both; database startup alone does not end RTO.

Finite RPO can erase recent local payment keys while Stripe retains their effects. It is not zero financial loss. Tighter RPO ≤5 minutes/RTO ≤60 minutes and continuous-recovery topology remain Phase 13 work. A failed time target does not authorize bypassing financial safety.

## Complete backup policy

Back up the **whole monolith database in one consistent snapshot**, not independent owner dumps. Include Identity authority/audit/counters; Catalog products/categories; Inventory balances/reservations/movements; Cart versions; immutable Orders/address/audit; Checkout quotes/accepted keys/work/audit; simulator source assignments/proofs; Payments bindings/intents/refunds/allocations/provider keys/windows/facts/corrections/inbox/holds/quarantine/audit. Never omit inactive/ManualReview/terminal rows that carry retained identity or evidence.

Use PostgreSQL 18 `pg_dump` custom format for the database and compatible `pg_restore` for recovery, with credentials supplied through protected process facilities, not command history/argv or committed examples. A whole-database dump represents a consistent snapshot; cluster roles/tablespaces are separate from a database dump. See [PostgreSQL SQL-dump guidance](https://www.postgresql.org/docs/18/backup-dump.html). Maintain separately protected role/grant definitions and current secret recovery material; do not export passwords through an unreviewed globals dump.

Use the job's first connection as a read-only REPEATABLE READ snapshot coordinator: record primary clock immediately before starting that transaction, export its snapshot, and obtain the manifest row counts/table inventory within it. The second connection runs a serial custom-format dump with that exported snapshot using `pg_dump --snapshot`. Keep the coordinator alive through dump completion; abort and publish no usable point if snapshot import/export or a count fails. This gives counts and archive the same database view within the declared two-connection job budget. PostgreSQL documents [exported snapshots](https://www.postgresql.org/docs/18/functions-admin.html#FUNCTIONS-SNAPSHOT-SYNCHRONIZATION) and the [dump snapshot option](https://www.postgresql.org/docs/18/app-pgdump.html). Release the coordinator on completion/cancellation and never overlap incompatible DDL with the job. The privileged job's ≤30-minute whole-job deadline differs from short retail transaction/command limits; it does not relax runtime role limits.

| Control | Required baseline |
| --- | --- |
| Schedule | Every 12 hours, one job at a time; snapshot/export/encryption/off-host verification complete within 30 minutes |
| Snapshot time | Read primary UTC clock immediately before snapshot acquisition and record that conservative lower bound; completion time is not the recovery point |
| Storage | Authenticated encryption and protected off-host archive/manifest; dedicated storage, access separate from runtime |
| Verification | Archive completion, encrypted-byte size/SHA-256, manifest integrity, off-host read-back/check and authorized decryption accessibility |
| Retention | 7 days, at least 14 complete scheduled archives plus one in progress; delete only under protected policy and never remove the only usable point |
| Failure | Alert any job/archive/manifest/decryption failure; latest usable snapshot age warning >12.5h, urgent >18h, objective failure at ≥24h |
| Rehearsal | Timed isolated restore before phase implementation completion, then monthly and after material schema/provider/secret/recovery changes |
| Resource | Job uses its declared ≤2 connections; one serial custom-format dump; isolated restore concurrency ≤2; record I/O/snapshot/bloat impact |

Job launch, file creation or upload initiation is not success. Only a complete verified off-host archive becomes usable. A byte digest checks integrity, not semantic completeness or decryption; periodic restore remains required. At ≥24-hour age close new purchasing/financial mutation/fulfillment through existing controls and maintenance containment until a usable point and reviewed recovery capacity exist. Read-only operation may continue if normal primary authority remains safe. Do not delete payment data to make backup timing pass.

Current JWT/provider/webhook/cursor/counter/backup keys and approved account access are recovered from protected off-host secret facilities, not an older application database/config export. Record nonsecret version references. Backups contain sensitive address/account data; no dump or restore report is committed to the repository. Diagnostic stores are not required to reconstruct business state and are not part of the authoritative snapshot.

## Restricted backup manifest contract

The following schema describes a protected operating artifact, not an API response or new database table. Required artifact fields are explicit so a restore cannot guess its source/version/time. Verify format assertions and semantic timestamps/counts; do not load remote schemas at runtime.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:recovery:schemas:v1",
  "$defs":{
    "Instant":{"type":"string","format":"date-time","pattern":"Z$"},
    "Digest":{"type":"string","pattern":"^[0-9a-f]{64}$"},
    "Reference":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9][A-Za-z0-9._:/-]*$"},
    "BackupManifest":{
      "type":"object","additionalProperties":false,
      "required":["backupId","snapshotLowerBound","completedAt","archiveFormat","postgresMajor","artifactDigest","schemaFingerprint","configurationFingerprint","encryptedArchiveDigest","encryptedArchiveBytes","ownerSchemas","secretVersionReferences","financialAccountReferences","providerApiVersions","ownerRowCounts"],
      "properties":{
        "backupId":{"$ref":"urn:ecommerce:identity:schemas:v1#/$defs/Uuid"},
        "snapshotLowerBound":{"$ref":"#/$defs/Instant"},
        "completedAt":{"$ref":"#/$defs/Instant"},
        "archiveFormat":{"const":"PostgreSQLCustom"},
        "postgresMajor":{"const":18},
        "artifactDigest":{"$ref":"#/$defs/Digest"},
        "schemaFingerprint":{"$ref":"#/$defs/Digest"},
        "configurationFingerprint":{"$ref":"#/$defs/Digest"},
        "encryptedArchiveDigest":{"$ref":"#/$defs/Digest"},
        "encryptedArchiveBytes":{"type":"integer","minimum":1,"maximum":9007199254740991},
        "ownerSchemas":{"type":"array","minItems":7,"maxItems":8,"uniqueItems":true,"items":{"enum":["identity","catalog","inventory","cart","orders","checkout","checkout_simulator","payments"]}},
        "secretVersionReferences":{"type":"array","minItems":1,"maxItems":32,"uniqueItems":true,"items":{"$ref":"#/$defs/Reference"}},
        "financialAccountReferences":{"type":"array","maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/Reference"}},
        "providerApiVersions":{"type":"array","maxItems":8,"uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":64}},
        "ownerRowCounts":{
          "type":"object","additionalProperties":false,
          "required":["users","orders","reservations","attempts","payments","refunds"],
          "properties":{
            "users":{"type":"integer","minimum":0,"maximum":9007199254740991},
            "orders":{"type":"integer","minimum":0,"maximum":9007199254740991},
            "reservations":{"type":"integer","minimum":0,"maximum":9007199254740991},
            "attempts":{"type":"integer","minimum":0,"maximum":9007199254740991},
            "payments":{"type":"integer","minimum":0,"maximum":9007199254740991},
            "refunds":{"type":"integer","minimum":0,"maximum":9007199254740991}
          }
        }
      }
    }
  }
}
```

Semantic checks require all seven business schemas and the simulator schema whenever present; `completedAt ≥ snapshotLowerBound`, duration ≤30 minutes, a verified archive and consistent artifact/schema/config references. Manifest presence does not prove the archive contains each table. Row counts come from the coordinated exported snapshot, **not a separate concurrent live query**, and the later restore must match them. Do not publish a manifest as verified until its counts and table inventory are established; if this exceeds the deadline, the backup job fails the proposed completion gate.

Provider versions/account references must cover every retained original source, including earlier accepted versions. An empty account/version list is permitted only when no provider-backed retained binding exists. Secret references identify protected version records without secret values. Protect and authenticate the manifest independently of the restored database; reject a changed digest/schema/version even if the archive can be parsed.

## Integrated recovery sequence

1. **Declare loss and contain.** Start the RTO timer, record the incident/recovery identity/reason and the conservative last known good point. Hold new purchases, financial mutations and fulfillment; block public routing for full restore. Stop/drain all senders, prove the original outbound executor cannot send and preserve evidence of in-flight uncertainty. A new executor remains disabled if quiescence is unproved.
2. **Select a usable point.** Verify archive/manifest integrity, age, encryption access, PostgreSQL compatibility and original artifact/source versions. If only an older archive works, record the actual RPO miss; do not relabel its completion timestamp as its snapshot.
3. **Restore in isolation.** Use a clean protected target with current roles/grants and compatible extensions; restore all owner data together with stop-on-error semantics. No public routes or automatic provider/Checkout workers start against the incomplete restore. Treat partial restore as failed and discard/rebuild that isolated target under operator control.
4. **Validate local authority and integrity.** Check all PK/FK/unique/CHECKs, grants/immutability protections and schema/artifact compatibility. Revoke **all restored sessions** through the reviewed Identity procedure and force fresh login. Do not restore withdrawn/compromised signing credentials. Run ANALYZE and inspect representative read/due-work plans. Inspect expired leases/deadlines with fresh primary clock; retain original first-send timestamps and receipt bytes.
5. **Establish the provider gap.** Use original protected account access outside the archive. Gap begins at least five minutes before the manifest's conservative snapshot lower bound and ends after quiescence/recovery inspection. Persist protected continuation/evidence outside the lost database. Include all applicable original accounts/versions and external Dashboard actions; no new financial POST during discovery.
6. **Enumerate and verify complete effects.** Page authenticated provider PaymentIntents, Charges, refunds and available event history over the gap using the pinned adapter's supported filters, and retrieve canonical objects for relevant evidence. Additionally reconcile restored outstanding/uncertain financial work and retained refund/capture mappings whose objects were created earlier but could change during the gap, including a refund reversal. A created-time filter alone cannot discover later changes to an old object. If provider history is insufficient to establish complete coverage, keep the gate held and conduct protected manual account reconciliation. Search/404 alone is not no-capture proof.
7. **Match or quarantine.** Match immutable source/account/currency/mode/provider operation identities to restored bindings/Orders/attempts and current canonical financial facts. Record newly verified captures/refunds/reversals; apply original S/R/correction/hold rules. A missing binding/accepted key is an orphan, not permission to fabricate an Order from webhook metadata. Wrong/multiple mappings remain quarantined with attributed investigation. If original earliest-send information was lost, no automatic financial POST is allowed by guessing a new 23-hour window or key.
8. **Resume original recovery safely.** After approved local/source validation, enable bounded observation and original owner recovery with purchase/fulfillment admission still held. Expire unusable stock; late capture is compensated and never authorizes fulfillment. Original-case compensation/repair and preconfirmation refund guards remain mandatory. Facts commit before Checkout wake. Unknown or failed compensation is explicitly alerted/held; no blanket restock or terminal Order resurrection.
9. **Evaluate reopening.** Every gap object is matched with valid evidence or resolved through a reviewed safe financial procedure; remaining unexplained or potentially duplicated effects block affected purchasing/financial mutation/fulfillment. In the one-merchant baseline, an orphan without a proved local association keeps the original provider account's purchasing/financial mutation/fulfillment scope held; placing it in quarantine alone does not release the hold. Check fresh authority, required workers, grants/source versions, reservation/order/financial invariants, original receipts and recovery progress. Reopen only the reviewed consistent scope and record the RTO stop time; declaring ManualReview does not itself waive an orphan-integrity reopening hold.
10. **Close the drill report.** Record backup lower bound/age, loss/start/restore/reconciliation/reopening times, actual local records missing, provider effects found/quarantined/resolved, invariant/secret/grant results, resources/call rates and Passed/Failed/Not run evidence. Retain failed runs and recovery actions in protected evidence storage.

All Stripe calls share ≤5/sec, burst 2, concurrency 2, including protected probes/scan. Actual drill affects ≤100 sandbox objects; do not load-test Stripe. Use the full declared local dataset and record the number of actual retained Stripe bindings; 100,000 simulated historical Orders cannot establish restore capacity for 100,000 provider objects. If safe reconciliation exceeds two hours, RTO fails and admission remains held. Future design changes require measured capacity evidence, not a weaker safety gate.

## Local integrity checklist

- Identity status/version/session revocation and role separation; configured Admin networks and trusted proxies.
- Catalog publication/category/price rules and currency; historical snapshots remain unchanged.
- Inventory balances, available stock, group deadlines, at-most-one consume/release/expiry movement and matching consumed reservations.
- Cart whole-cart version/line/quantity limits and conditional postpurchase cleanup.
- Order/Checkout identity uniqueness, immutable quote/address/lines/totals, no committed Preparing attempt, four work rows and cancellation/fulfillment guards.
- Financial original source/account/version mapping, exact receipt/key/window, effective facts/reversals, net S/R/reservation conservation, compensation case coverage and intact quarantines.
- No overlapping provider executor, no unsafe schema/grant/secret downgrade, no old sessions or unexplained provider gap before reopening.

## Acceptance assertions

Given a corrupted archive/missing key, the job/point is unusable and the objective gate fails. Given a backup followed by a sandbox capture or old-refund reversal, restore finds the provider effect before reopening and retains its true financial consequence. Given a missing original key/send timestamp, recovery cannot create a new charge by restarting time. Given a measured safe restore over two hours, evidence says Failed and the hold remains. A successful isolated drill establishes only its declared sandbox dataset/topology.
