# Protected Recovery and Operating Contracts

## Contract boundary

No public or private HTTP route is added. Use authenticated owner-local protected tooling and the existing [Phase 10 mTLS APIs](../../10-microservices/functional-requirements/service-api-contracts.md). Inspect/resume does not share database credentials between services.

Workload certificates cannot assert an operator role. Operator identity, current permission and restricted network/process access are established by the protected tooling outside request JSON. Audit actor/request ID comes from that context. Reasons contain no credentials, provider payloads, addresses or card data.

## Operations

| Operation | Input / result | Required effect |
| --- | --- | --- |
| InspectWork | Exact typed target, or state filter + protected cursor + limit 1..50 | Bounded owner metadata/history; current snapshot, no lease token, secret, raw provider body or hold token |
| ResumeOriginalWork | Closed ResumeRequest below → ResumeReceipt | Eligible ManualReview only; original mapping/intent, new finite scheduling cycle and audit atomically |
| ReplayCanonicalEvent | Original Phase 09/10 typed request/receipt | Original source/ID/body/time/digest; existing cross-owner replay handshake |
| RepairFailedCompensation | Original Phase 07 proof-based repair request | Definitively failed original refund only, exact case/amount and unique replacement/repair mapping |
| Contain/ReopenCapability | Existing owner operating gate procedure | Attributed cause, scope, expected version and evidence; no generic clear-all command |

ResumeOriginalWork does not encompass event replay or replacement refunds. A succeeded resume leaves actual fulfillment/financial actions to ordinary guarded workers.

## Target mapping

| targetKind | targetId means | Owner record |
| --- | --- | --- |
| CommerceCommand | Original command UUID | checkout.integration_commands |
| CommercePurchase | Original attempt UUID | checkout.work kind=Purchase |
| CommerceCancellation | Original attempt UUID | checkout.work kind=Cancellation |
| CommerceCompensation | Original attempt UUID | checkout.work kind=Compensation |
| CommerceCartCleanup | Original attempt UUID | checkout.work kind=CartCleanup |
| CommerceRemoteReplay | Original operation UUID | checkout.remote_recovery_operations |
| PaymentsFinancialWork | Original payment UUID | payments.financial_work, including its hold/decision recovery |

There is no separate hold-resume target that can bypass the financial work root. Refund UUIDs are inspected through their original payment; unknown refunds cannot be replaced through this operation. Tool adapters use this fixed mapping, never caller-provided table/column names.

## Resume guards and receipt semantics

1. Authenticate current operator capability for the selected owner. Parse ≤2,048 UTF-8 bytes, reject duplicate keys/unknown fields, normalize reason to trimmed NFC, reject control/newline characters.
2. Compare any existing receipt using operation ID, authenticated actor and exact canonical request bytes/digest. Same operation replays its original result; changed actor/request conflicts.
3. Lock the existing owner hierarchy, then target work, then recovery receipt/audit. Recheck active epoch, mapping/integrity gates and supplied work version.
4. Unexpired lease rejects intervention. Scheduled/Pending work returns AlreadyScheduled without changing count, cycle or due time. Idle/Applied/Rejected/Completed work returns Terminal without rescheduling. A stale expected version conflicts even if the desired state seems convenient.
5. For ManualReview, validate the cause/evidence and safe next action. OriginalOutcomeLookup permits original receipt/provider retrieval under normal source/account/window rules; it never permits a fresh blind POST. CauseCorrected requires proof that the recorded blocker changed.
6. Commit new cycle, scheduling profile/deadline/due, changed work version, immutable operation receipt and append-only audit together. Parent projection and associated command work must agree; no “Scheduled” parent with an exhausted required child.
7. Return receipt. The worker may still fail or reach ManualReview. Read current work separately rather than altering this historical receipt.

Before step 3, a reviewed read-only peer/provider observation may be gathered using ordinary limits. Release its connection before local mutation; its age and owner identity are part of guard evaluation. Evidence references are locators to already retained owner facts/receipts/decisions/audits; they do not become financial proof simply because an operator supplied an ID.

Typed outcomes outside a successful receipt: InvalidInput, NotAuthorized, MissingTarget, VersionConflict, ActiveLease, IdentityConflict, IntegrityBlocked, AuditFailure, Unavailable. Existing public Problem Details and private command-result schemas are untouched.

## Closed tooling schema

Registry `urn:ecommerce:reliability:schemas:v1` is for **local protected tooling only**. Root validates ResumeRequest. Use its other definitions for receipt/inspection output. Formats require real UUID/RFC3339 validation; all integers are exact safe integers. Cross-field/database guards above are additional requirements.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:reliability:schemas:v1",
  "$ref": "#/$defs/ResumeRequest",
  "$defs": {
    "Uuid": {"type": "string", "format": "uuid", "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Version": {"type": "integer", "minimum": 1, "maximum": 9007199254740991},
    "Timestamp": {"type": "string", "format": "date-time"},
    "TargetKind": {"enum": ["CommerceCommand", "CommercePurchase", "CommerceCancellation", "CommerceCompensation", "CommerceCartCleanup", "CommerceRemoteReplay", "PaymentsFinancialWork"]},
    "EvidenceReference": {
      "type": "object", "additionalProperties": false,
      "required": ["kind", "id"],
      "properties": {
        "kind": {"enum": ["OwnerFact", "CommandReceipt", "ConfirmationDecision", "OwnerAudit"]},
        "id": {"$ref": "#/$defs/Uuid"}
      }
    },
    "ResumeRequest": {
      "type": "object", "additionalProperties": false,
      "required": ["operationId", "targetKind", "targetId", "expectedVersion", "cause", "reason", "evidence"],
      "properties": {
        "operationId": {"$ref": "#/$defs/Uuid"},
        "targetKind": {"$ref": "#/$defs/TargetKind"},
        "targetId": {"$ref": "#/$defs/Uuid"},
        "expectedVersion": {"$ref": "#/$defs/Version"},
        "cause": {"enum": ["CauseCorrected", "OriginalOutcomeLookup"]},
        "reason": {"type": "string", "minLength": 1, "maxLength": 256, "pattern": "^[^\\u0000-\\u001f\\u007f-\\u009f]+$"},
        "evidence": {"type": "array", "minItems": 1, "maxItems": 8, "uniqueItems": true, "items": {"$ref": "#/$defs/EvidenceReference"}}
      }
    },
    "ResumeReceipt": {
      "type": "object", "additionalProperties": false,
      "required": ["operationId", "targetKind", "targetId", "outcome", "beforeVersion", "afterVersion", "cycle", "recordedAt"],
      "properties": {
        "operationId": {"$ref": "#/$defs/Uuid"},
        "targetKind": {"$ref": "#/$defs/TargetKind"},
        "targetId": {"$ref": "#/$defs/Uuid"},
        "outcome": {"enum": ["Scheduled", "AlreadyScheduled", "Terminal"]},
        "beforeVersion": {"$ref": "#/$defs/Version"},
        "afterVersion": {"$ref": "#/$defs/Version"},
        "cycle": {"$ref": "#/$defs/Version"},
        "recordedAt": {"$ref": "#/$defs/Timestamp"}
      }
    },
    "WorkInspection": {
      "type": "object", "additionalProperties": false,
      "required": ["targetKind", "targetId", "workVersion", "state", "cycle", "chargedAttempts", "profile", "cycleStartedAt", "cycleDeadlineAt", "dueAt", "leaseExpiresAt", "lastReason", "observedAt"],
      "properties": {
        "targetKind": {"$ref": "#/$defs/TargetKind"},
        "targetId": {"$ref": "#/$defs/Uuid"},
        "workVersion": {"$ref": "#/$defs/Version"},
        "state": {"enum": ["Pending", "Scheduled", "Idle", "Applied", "Rejected", "Completed", "ManualReview"]},
        "cycle": {"$ref": "#/$defs/Version"},
        "chargedAttempts": {"type": "integer", "minimum": 0, "maximum": 10},
        "profile": {"enum": ["Legacy", "rel11-equal-jitter-v1"]},
        "cycleStartedAt": {"anyOf": [{"$ref": "#/$defs/Timestamp"}, {"type": "null"}]},
        "cycleDeadlineAt": {"anyOf": [{"$ref": "#/$defs/Timestamp"}, {"type": "null"}]},
        "dueAt": {"anyOf": [{"$ref": "#/$defs/Timestamp"}, {"type": "null"}]},
        "leaseExpiresAt": {"anyOf": [{"$ref": "#/$defs/Timestamp"}, {"type": "null"}]},
        "lastReason": {"enum": [null, "BreakerOpen", "LocalCapacity", "PeerRateLimit", "ProviderGate", "DependencyUnavailable", "DeadlineExhausted", "AttemptExhausted", "IntegrityBlocked"]},
        "observedAt": {"$ref": "#/$defs/Timestamp"}
      }
    }
  }
}
```

### Synthetic examples

Example IDs are illustrative, not real records or credentials.

ResumeRequest:

```json
{"operationId":"11111111-1111-4111-8111-111111111111","targetKind":"CommerceCommand","targetId":"22222222-2222-4222-8222-222222222222","expectedVersion":7,"cause":"OriginalOutcomeLookup","reason":"Peer restored; inspect the original receipt before dispatch.","evidence":[{"kind":"OwnerAudit","id":"33333333-3333-4333-8333-333333333333"}]}
```

ResumeReceipt:

```json
{"operationId":"11111111-1111-4111-8111-111111111111","targetKind":"CommerceCommand","targetId":"22222222-2222-4222-8222-222222222222","outcome":"Scheduled","beforeVersion":7,"afterVersion":8,"cycle":2,"recordedAt":"2026-10-02T10:00:00Z"}
```

WorkInspection:

```json
{"targetKind":"CommerceCommand","targetId":"22222222-2222-4222-8222-222222222222","workVersion":8,"state":"Pending","cycle":2,"chargedAttempts":0,"profile":"rel11-equal-jitter-v1","cycleStartedAt":"2026-10-02T10:00:00Z","cycleDeadlineAt":"2026-10-02T10:05:00Z","dueAt":"2026-10-02T10:00:00Z","leaseExpiresAt":null,"lastReason":null,"observedAt":"2026-10-02T10:00:01Z"}
```

Semantic validation requires Scheduled receipt afterVersion=beforeVersion+1 and cycle advancing exactly once; AlreadyScheduled/Terminal preserve versions/cycle. An activated pending cycle has paired start/deadline values exactly 300 seconds apart. State-specific due/lease fields reflect the actual owner's schema; Payments Idle may retain its historical nonnull next_action_at internally, while tooling dueAt reports null when no action is scheduled.

## Inspection, pagination and retention

Inspect uses one owner-primary snapshot per page and deterministic (created_at, qualified target identity) keysets. Cursor binds owner, operator, filter and maximum page size using the existing protected signing mechanism. Page continuation is not a globally frozen snapshot; disclose that rows may change between pages.

Retain original operation bytes/digest, actor, request ID, reason/evidence locators, before/after versions, cycle and immutable outcome. Existing four total operator DB connections apply across both owners. No telemetry export of receipt bodies/evidence IDs to metric labels; protected UUID metadata follows earlier privacy rules. No automatic cleanup/tombstone policy is introduced.
