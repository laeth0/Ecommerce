# Public Compatibility and Protected Capacity Records

## Unchanged contracts

No public endpoint, private service route, query parameter, DTO, event type, cursor, ETag, error/status or financial receipt is added. Refer to phases 01–07 original registries, [Phase 10 mTLS contracts](../../10-microservices/functional-requirements/service-api-contracts.md) and [Phase 11 recovery tooling](../../11-distributed-system-reliability/functional-requirements/recovery-and-operating-contracts.md).

Keep original 429 RateLimit.Exceeded and bounded Retry-After behavior,503 Service.Unavailable, current authorization/privacy/error precedence and no-store headers. Cache/replica/prototype activation cannot appear as new customer-visible implementation switches.

## Operator operations

| Operation | Required input / effect |
| --- | --- |
| DeclarePlan | Closed plan below, data/resource/policy fingerprints, outside-JSON current authority and scope |
| Start/StopMeasurement | Original plan/run UUID, approved isolated environment, bounded offered schedule, stop reason; no generic public generator route |
| InspectEvidence | Owner-approved bounded queries/metadata; existing operator pool 4 total, no raw SQL supplied through tool JSON |
| ReviewProposal | Bottleneck/gate/evidence/resource/security/compatibility/restore record; reviewer identity from protected context |
| Activate/DisableCandidate | Concrete approved compatible operating change; Disabled remains default; no action in this task |
| Contain/Resume/Restore | Existing owner protected operations/receipts/epochs/guards; no new arbitrary state editor |

Capacity artifacts do not provision resources or grant permission. A supplied operator UUID/“approved” boolean cannot authorize an experiment. Protected operating evidence stores current reviewer, original plan bytes/digest and actual resource/capability decision.

## Candidate lifecycle

| Transition | Guard |
| --- | --- |
| Disabled→Proposed | Measured bottleneck, unchanged baseline/source and explicit candidate scope |
| Proposed→ApprovedPrototype | Gate evidence, bounded resources, current owner/security authority and reversible experiment plan |
| ApprovedPrototype→Validated | Actual full prototype/healthy/failure/security/restore evidence passes |
| Proposed/ApprovedPrototype/Validated→Rejected | Benefit/authority/cost/compatibility/recovery criterion fails |
| Validated→Active | Separate concrete authorized compatible activation with final implementation evidence |
| Active→Disabled | Safe bounded primary route/one writer retained, original accepted state preserved |

Validated never means automatically Active. A later proposal after rejection uses a new reviewed proposal identity/evidence; it cannot reset financial work IDs or pretend a previous run succeeded.

## Closed protected record schema

Registry `urn:ecommerce:scalability:schemas:v1` supplies a local **evidence format**, not HTTP API/schema migration. Root validates RunPlan; other definitions validate Summary. Numbers/cross-field policies require semantic validation beyond JSON shape.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:scalability:schemas:v1",
  "$ref":"#/$defs/RunPlan",
  "$defs":{
    "Uuid":{"type":"string","format":"uuid","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Digest":{"type":"string","pattern":"^[0-9a-f]{64}$"},
    "Instant":{"type":"string","format":"date-time","pattern":"Z$"},
    "Count":{"type":"integer","minimum":0,"maximum":9007199254740991},
    "Resources":{
      "type":"object","additionalProperties":false,
      "required":["commerceReplicas","paymentsProcesses","appCpu","appMemoryMiB","primaryCpu","primaryMemoryMiB","ordinaryConnectionPlan"],
      "properties":{
        "commerceReplicas":{"type":"integer","minimum":1,"maximum":2},
        "paymentsProcesses":{"const":1},
        "appCpu":{"type":"number","exclusiveMinimum":0,"maximum":128},
        "appMemoryMiB":{"type":"integer","minimum":64,"maximum":131072},
        "primaryCpu":{"type":"number","exclusiveMinimum":0,"maximum":128},
        "primaryMemoryMiB":{"type":"integer","minimum":64,"maximum":262144},
        "ordinaryConnectionPlan":{"type":"integer","minimum":1,"maximum":80}
      }
    },
    "Dataset":{
      "type":"object","additionalProperties":false,
      "required":["code","products","categories","customers","orders","fingerprint"],
      "properties":{
        "code":{"enum":["D0","D1","D2"]},
        "products":{"$ref":"#/$defs/Count"},
        "categories":{"$ref":"#/$defs/Count"},
        "customers":{"$ref":"#/$defs/Count"},
        "orders":{"$ref":"#/$defs/Count"},
        "fingerprint":{"$ref":"#/$defs/Digest"}
      }
    },
    "RunPlan":{
      "type":"object","additionalProperties":false,
      "required":["runId","mode","tier","model","users","effectiveSourceGroups","offeredCoreRps","warmupSeconds","measurementSeconds","source","dataset","resources","policyFingerprint","stopPlanReference"],
      "properties":{
        "runId":{"$ref":"#/$defs/Uuid"},
        "mode":{"enum":["EligibleLoad","OfferedStress","Analytical"]},
        "tier":{"enum":["Reference100","Users250","Users500","Users1000","Users10000","Users100000","DataGrowth","FlashSale","QueueGrowth","OptionalCache","OptionalReplica","OptionalPartition"]},
        "model":{"enum":["ClosedReference","PacedArrival","BoundedBurst","Analytical"]},
        "users":{"type":"integer","minimum":1,"maximum":100000},
        "effectiveSourceGroups":{"type":"integer","minimum":1,"maximum":100000},
        "offeredCoreRps":{"type":["number","null"],"exclusiveMinimum":0,"maximum":1000000},
        "warmupSeconds":{"type":"integer","minimum":0,"maximum":3600},
        "measurementSeconds":{"type":"integer","minimum":1,"maximum":86400},
        "source":{"enum":["SimulatorDevelopment","TransportIsolated","GenuineSandbox","Analytical"]},
        "dataset":{"$ref":"#/$defs/Dataset"},
        "resources":{"$ref":"#/$defs/Resources"},
        "policyFingerprint":{"$ref":"#/$defs/Digest"},
        "stopPlanReference":{"$ref":"#/$defs/Uuid"}
      }
    },
    "Summary":{
      "type":"object","additionalProperties":false,
      "required":["runId","status","recordedAt","planDigest","offered","admitted","useful","quotaRejected","capacityRejected","timedOut","droppedIterations","unfinished","limitingResource","evidenceReferences"],
      "properties":{
        "runId":{"$ref":"#/$defs/Uuid"},
        "status":{"enum":["Passed","Failed","NotRun","Analytical"]},
        "recordedAt":{"$ref":"#/$defs/Instant"},
        "planDigest":{"$ref":"#/$defs/Digest"},
        "offered":{"$ref":"#/$defs/Count"},
        "admitted":{"$ref":"#/$defs/Count"},
        "useful":{"$ref":"#/$defs/Count"},
        "quotaRejected":{"$ref":"#/$defs/Count"},
        "capacityRejected":{"$ref":"#/$defs/Count"},
        "timedOut":{"$ref":"#/$defs/Count"},
        "droppedIterations":{"$ref":"#/$defs/Count"},
        "unfinished":{"$ref":"#/$defs/Count"},
        "limitingResource":{"enum":["Unmeasured","NoneAtDeclaredLoad","Generator","Quota","AppCpu","PrimaryCpu","Pool","Locks","WalDisk","Broker","Worker","Provider","Recovery","Multiple"]},
        "evidenceReferences":{"type":"array","maxItems":50,"uniqueItems":true,"items":{"$ref":"#/$defs/Uuid"}}
      }
    }
  }
}
```

Semantic rules: Reference100 uses 100 users/ClosedReference, null prospective offered rate, warmup ≥ 120s and measurement ≥ 600s. Users250/500/1000 use corresponding roster counts/PacedArrival and offer ≤ 90/120/150RPS, normal auth with ≥ 1/2/3 verified sources. Users10000/100000 require mode/model/source Analytical; they cannot start a run through this record.

Baseline resources are appCPU 2/memory 2048MiB, primaryCPU 2/memory 4096MiB, Payments 1 and ordinary plan 48/79 matching replica count. Other numeric values only describe a separately reviewed resource proposal; the schema cannot authorize it. GenuineSandbox obeys original provider object/rate limits and is not a large-user HTTP capacity run.

Dataset code must match declared row counts and valid owner fingerprint, with measured later-run growth disclosed. Eligible core plan has original 65/10/10/5/5/5 mix outside this compact identity record, plus complete protected per-class latency/resources/auxiliary evidence referenced by Summary.

Summary.useful ≤ admitted ≤ offered; timedOut may overlap admitted/unknown outcome, while droppedIterations never count as actually offered HTTP requests. Do not sum overlapping categories to fabricate equality. NotRun/Analytical record no actual executed counts; Passed requires executed evidence and all relevant criteria. Evidence references are protected locators, not raw paths/URLs/credentials.

### Illustrative plan and summary

These are synthetic shape examples, not executed results.

```json
{"runId":"11111111-1111-4111-8111-111111111111","mode":"EligibleLoad","tier":"Users1000","model":"PacedArrival","users":1000,"effectiveSourceGroups":3,"offeredCoreRps":150,"warmupSeconds":120,"measurementSeconds":600,"source":"SimulatorDevelopment","dataset":{"code":"D0","products":10000,"categories":100,"customers":10000,"orders":100000,"fingerprint":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"resources":{"commerceReplicas":2,"paymentsProcesses":1,"appCpu":2,"appMemoryMiB":2048,"primaryCpu":2,"primaryMemoryMiB":4096,"ordinaryConnectionPlan":79},"policyFingerprint":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","stopPlanReference":"22222222-2222-4222-8222-222222222222"}
```

```json
{"runId":"11111111-1111-4111-8111-111111111111","status":"NotRun","recordedAt":"2026-10-02T10:00:00Z","planDigest":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc","offered":0,"admitted":0,"useful":0,"quotaRejected":0,"capacityRejected":0,"timedOut":0,"droppedIterations":0,"unfinished":0,"limitingResource":"Unmeasured","evidenceReferences":[]}
```

Keep exact canonical plan/summary bytes with SHA- 256 and outside-record authenticated reviewer/time, protected per-run evidence and failed/aborted outcomes. This adds no application capacity table or business-state editor.
