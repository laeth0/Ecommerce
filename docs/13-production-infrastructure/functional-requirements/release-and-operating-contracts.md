# Release and Protected Operating Contracts

## Public/private compatibility

No new retail resource, DTO, query field, event type or private service role is added. Preserve [Phase 08 protocol/health](../../08-production-ready-monolith/functional-requirements/api-and-operating-contracts.md), [Phase 10 service contracts](../../10-microservices/functional-requirements/service-api-contracts.md) and [Phase 11 typed recovery](../../11-distributed-system-reliability/functional-requirements/recovery-and-operating-contracts.md).

Known exact receipts retain their original replay rules after admission gates close. New human requests/replays still require current authority. HTTP timeout, edge 503, Pod failure or failed release does not establish that an owner mutation failed to commit.

## Operating capability matrix

| Action | Required authority / bound | Result |
| --- | --- | --- |
| Build/Verify | Unprivileged CI source/build scope; no cluster/runtime secrets | Exact image/SBOM/provenance/check locators |
| ApproveRelease | Protected reviewer identity and exact plan digest/commit/target | Attributed approval outside plan JSON |
| Apply/InspectRelease | Scoped local namespace release authority; current cluster proof | Actual generation/process/config/evidence state |
| Migrate | Separate owner DDL credential; one serial connection/job | Exact schema/count/grant/compatibility proof |
| Scale/Contain | Reviewed envelope; original owner admission/dispatch gates | Bounded actual processes and attributed gate result |
| RotateSecret/Trust | Separate narrow secret/security authority | Version/overlap/revocation evidence, no value output |
| Backup/Restore | Separate protected data/archive/key authority; original four backup connections | Existing paired-v3 manifest and integrated result |
| Resume/Replay/Repair | Original typed owner guards, authority, expectedVersion/lease and immutable receipt | Original operation outcome; no generic state editor |

Local Kubernetes apply may return an ambiguous result. Inspect original release ID/digest, exact target identity and actual resource generation before continuing. Retrying a declarative apply does not authorize a second financial instruction, duplicate migration, different image or secret rewrite.

## Release state machine

| Transition | Required guard |
| --- | --- |
| Proposed→Approved | Exact immutable plan reviewed with current permission and required evidence |
| Approved→Applying | Approval still matches; target verified; one release lock; scaling disabled; preconditions pass |
| Applying→Verifying | Desired resources submitted and actual old-process/ownership state established |
| Verifying→Active | Required probes, protocol/grants/process/receipt/invariant checks and safe reopen pass |
| Proposed/Approved→Rejected | Invalid scope, missing evidence, changed target or denied approval |
| Applying/Verifying/Active→Contained | Integrity/security/resource uncertainty or failed required check |
| Contained→Verifying | Attributed original-release investigation/repair with unchanged accepted identities |
| Contained→RolledBack | Compatible reviewed previous artifact uses current store; quiescence and verification complete |

There is no timeout transition to Active. A failed/unknown apply remains contained. Rejected plans are not executed; replacing a plan uses a new release identity. Receipt records preserve each transition's authenticated actor/time/exact bytes outside this compact evidence format.

## Closed local evidence schema

Registry `urn:ecommerce:infrastructure:schemas:v1` is a protected artifact format, not an HTTP API or application table. Validate Draft 2020-12 shape and format assertions, then the semantic guards below. Artifact bytes are UTF-8 canonical compact JSON, bounded to 16KiB/depth 8; duplicates and unknown members are rejected. SHA-256 identifies exact bytes; authenticated approval supplies authority.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:infrastructure:schemas:v1",
  "$ref":"#/$defs/ReleasePlan",
  "$defs":{
    "Uuid":{"type":"string","format":"uuid","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Digest":{"type":"string","pattern":"^[0-9a-f]{64}$"},
    "Instant":{"type":"string","format":"date-time","pattern":"Z$"},
    "Images":{
      "type":"object","additionalProperties":false,
      "required":["commerce","payments"],
      "properties":{"commerce":{"$ref":"#/$defs/Digest"},"payments":{"$ref":"#/$defs/Digest"}}
    },
    "ReleasePlan":{
      "type":"object","additionalProperties":false,
      "required":["releaseId","environment","clusterFingerprint","sourceCommit","images","configurationFingerprint","schemaFingerprint","topologyFingerprint","resourceProfileReference","backupBundleId","rollbackPlanReference","kind","strategy","commerceReplicas","plannedPeakCommerceProcesses","maximumActualCommerceProcesses","paymentsProcesses","ordinaryConnectionPlan","maintenanceBudgetSeconds"],
      "properties":{
        "releaseId":{"$ref":"#/$defs/Uuid"},
        "environment":{"const":"LocalKind"},
        "clusterFingerprint":{"$ref":"#/$defs/Digest"},
        "sourceCommit":{"type":"string","pattern":"^[0-9a-f]{40}$"},
        "images":{"$ref":"#/$defs/Images"},
        "configurationFingerprint":{"$ref":"#/$defs/Digest"},
        "schemaFingerprint":{"$ref":"#/$defs/Digest"},
        "topologyFingerprint":{"$ref":"#/$defs/Digest"},
        "resourceProfileReference":{"$ref":"#/$defs/Uuid"},
        "backupBundleId":{"$ref":"#/$defs/Uuid"},
        "rollbackPlanReference":{"anyOf":[{"$ref":"#/$defs/Uuid"},{"type":"null"}]},
        "kind":{"enum":["CompatibleCode","OwnerMigration","Recovery"]},
        "strategy":{"enum":["Recreate","SerializedCommerceRolling","IsolatedRestore"]},
        "commerceReplicas":{"type":"integer","minimum":1,"maximum":2},
        "plannedPeakCommerceProcesses":{"type":"integer","minimum":1,"maximum":2},
        "maximumActualCommerceProcesses":{"const":2},
        "paymentsProcesses":{"const":1},
        "ordinaryConnectionPlan":{"type":"integer","minimum":1,"maximum":80},
        "maintenanceBudgetSeconds":{"type":"integer","minimum":1,"maximum":7200}
      }
    },
    "ReleaseOutcome":{
      "type":"object","additionalProperties":false,
      "required":["releaseId","planDigest","recordedAt","state","verification","evidenceReferences"],
      "properties":{
        "releaseId":{"$ref":"#/$defs/Uuid"},
        "planDigest":{"$ref":"#/$defs/Digest"},
        "recordedAt":{"$ref":"#/$defs/Instant"},
        "state":{"enum":["Proposed","Approved","Applying","Verifying","Active","Rejected","Contained","RolledBack"]},
        "verification":{"enum":["Passed","Failed","NotRun"]},
        "evidenceReferences":{"type":"array","maxItems":64,"uniqueItems":true,"items":{"$ref":"#/$defs/Uuid"}}
      }
    }
  }
}
```

Semantic validation MUST bind the cluster fingerprint to the actual API identity/CA and protected cluster inventory, not a human-readable context name. Images are exact OCI manifest digest bytes resolved through the approved private artifact locator; a digest does not authorize a caller-provided arbitrary URL.

The two owner schema/configuration fingerprints cover the exact reviewed pair in protected evidence; they do not imply atomic paired deployment. Resource profile declares all existing/new overhead, maximum live/terminating process count and any HPA/rolling experiment.

The planned peak counts old/new/terminating enabled processes and MUST be at least the steady commerceReplicas value. Original ordinary connection plan is `31 × plannedPeakCommerceProcesses + 17`:48/79. A one-replica Recreate release can plan48; a one-replica rolling overlap of two processes MUST plan79. Extra SQL clients or alternate resource profiles require the already approved measured replacement envelope. A smaller number in JSON cannot hide enabled pools.

rollbackPlanReference identifies a protected immutable prior-artifact/current-store compatibility plan with its exact config/schema/resource/target digests bound by the reviewed evidence. A null value means no approved rollback target; failure remains contained for reviewed roll-forward. Before executing rollback, revalidate current authority and compatibility against all postrelease writes. A reference never permits database rewind or application of an unreviewed changed artifact.

SerializedCommerceRolling requires CompatibleCode, planned peak2, Commerce-only replacement, unchanged Payments artifact/executor, full mixed-reader compatibility and proved overlap interlock. OwnerMigration uses Recreate. Recovery uses IsolatedRestore with old-process fencing, current key recovery and paired-v3; ordinary code release cannot use restore to rewind data.

Compatible code release aims for maintenance ≤600s; exceeding the declared budget is Failed/Contained, never automatic reopen. Recovery retains original safe RTO ≤7200s. Rollback time and verification are part of measured maintenance, not excluded downtime.

Active/RolledBack require Passed and nonempty complete evidence; approval identity and actual permission are outside JSON. NotRun means no operational proof. Illustrative synthetic records:

```json
{"releaseId":"11111111-1111-4111-8111-111111111111","environment":"LocalKind","clusterFingerprint":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sourceCommit":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","images":{"commerce":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","payments":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"},"configurationFingerprint":"dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd","schemaFingerprint":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","topologyFingerprint":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","resourceProfileReference":"22222222-2222-4222-8222-222222222222","backupBundleId":"33333333-3333-4333-8333-333333333333","rollbackPlanReference":null,"kind":"CompatibleCode","strategy":"Recreate","commerceReplicas":1,"plannedPeakCommerceProcesses":1,"maximumActualCommerceProcesses":2,"paymentsProcesses":1,"ordinaryConnectionPlan":48,"maintenanceBudgetSeconds":600}
```

```json
{"releaseId":"11111111-1111-4111-8111-111111111111","planDigest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","recordedAt":"2026-10-02T10:00:00Z","state":"Proposed","verification":"NotRun","evidenceReferences":[]}
```

No record contains secret values, personal kubeconfig, runtime URL, arbitrary SQL, approval boolean, provider key or instruction to clear holds. Retain exact protected plan/outcome/approval/audit evidence independently of short-lived CI logs.
