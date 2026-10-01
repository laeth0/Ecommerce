# Payments API Contracts

**Status:** proposed v1 financial-read/refund contract. [Workflows](payment-and-refund-workflows.md) own business rules; the [provider contract](stripe-provider-contract.md) separately specifies Stripe's callback envelope. No endpoint accepts a payment-method token, card field, proof, paid Boolean, destination, currency override or provider ID.

## Common protocol

Inherit [Identity protocol](../../01-identity-and-auth/functional-requirements/api-contracts.md) and Orders' canonical scalar rules. HTTPS; one eligible Bearer token; current owner/role/session authority; restricted Admin source network; server-generated canonical UUID X-Request-Id; `Cache-Control: no-store`. JSON success and sanitized RFC 9457 `application/problem+json` errors. No ETag/304/cookie. Instants are UTC with exactly six fractional digits. Enums/member names are case-sensitive; UUIDs are lowercase canonical 8-4-4-4-12.

Retail POST body maximum 4,096 decoded UTF-8 bytes, application/json, no compression; reject empty/invalid UTF-8, depth>16, duplicate/unknown keys and fraction/exponent/negative-zero integer syntax. GET has no body. Headers cannot contain duplicate Authorization/Idempotency-Key values; key is one UUID without whitespace/comma list. Accept application/json or */*; unsupported explicit media→406. Known-route unsupported method→405 with Allow; unknown route→404. Callback has its own bounded raw-byte protocol below.

| Method/path | Authority/request | Success | Specific failures |
| --- | --- | --- | --- |
| GET `/api/v1/orders/{orderId}/payment` | Customer owner; UUID; no query | 200 FinancialView | Orders.NotFound, PaymentNotAvailable |
| GET `/api/v1/admin/orders/{orderId}/payment` | Restricted Admin; UUID; no query; committed read audit | 200 FinancialView | Orders.NotFound, PaymentNotAvailable |
| GET `/api/v1/orders/{orderId}/refunds` | Customer owner; limit/cursor | 200 RefundPage | Orders.NotFound, PaymentNotAvailable |
| GET `/api/v1/admin/orders/{orderId}/refunds` | Restricted Admin; limit/cursor; committed read audit | 200 RefundPage | Orders.NotFound, PaymentNotAvailable |
| POST `/api/v1/admin/orders/{orderId}/refunds` | Restricted Admin; RefundRequest; Idempotency-Key | 202 RefundReceipt; Location Admin refund history route | IdempotencyConflict, VersionConflict, NotCaptured, AmountUnavailable, FinancialHold, SourceUnsupported |
| POST `/api/v1/payments/webhooks/stripe` | Provider signature; Stripe Event body | 200 WebhookReceipt after durable ingress | WebhookRejected; transport/capacity/dependency errors |

All operations include common authority/transport/dependency failures. Customer has no POST refund permission; valid route authorization gives403 before financial target lookup. No manual charge, refund-status PATCH, public reconciliation/resume, customer refund-request, callback replay console or payment cancellation endpoint is added. Order cancellation uses its existing route. GET never contacts the provider.

`FinancialView` is one primary snapshot of binding/intent/compensation/work. Missing intent for a freshly accepted binding returns NotPrepared/version 0 and zero balances; `recoveryStatus=Scheduled`. Missing binding for a retained earlier isolated Order is404 PaymentNotAvailable. Nonowned/absent Order gives identical404 Orders.NotFound. Missing expected owner records are integrity503. An original Simulator source uses the simulator owner and cannot accept new Admin refund mutations in this phase.

## Refund acceptance and replay

Scope keys to `(verified Admin UUID, operation IssueRefund, Idempotency-Key)` across all Orders. Exact canonical request identity includes route Order UUID, expectedVersion, amountMinor and normalized reason. Persist canonical UTF-8 JSON plus SHA-256; compare exact fields as well. Normalization uses NFC/Unicode trim, rejects control/newline, reason1..256 Unicode scalars/≤1,024 bytes. Reason is restricted audit data and absent from responses/telemetry/provider metadata.

After current authority, look up accepted key before new financial version/hold/amount guards. Matching replay returns the **original immutable** 202 receipt/Location even after source mode, financial version, refund result or Order lifecycle changes. `Idempotency-Replayed:false` on first commit, `true` on replay. Changed target/field under the accepted key gives409 IdempotencyConflict. Another actor's key is a different scope and never exposes the original actor's reason. New keys require exact current financial version; API does not silently replace it. Rejection/rollback binds no key. Unknown commit requires original key/body replay.

Receipt fields are materialized before commit, including the financial version after reservation. It acknowledges durable local intent/reservation and scheduled work, not provider refund success. Historical receipt version is not the current view. Financial version increments once per effective owner transaction changing exposed financial state/balances/coverage; lease/unchanged poll/read does not increment it. Version exhaustion is integrity503. Order version is unrelated.

For a genuinely new request, precedence is authority → syntactic validation → scoped Order/binding existence → accepted-key replay/conflict → new-refund admission gate → financial version → supported source → capture → hold/compensation → available amount → reserve/audit/commit. A closed admission gate gives503 without binding a key; exact accepted replay still precedes it. A conflicting key racing at another target is resolved by the unique actor/key receipt record and immutable comparison, without acquiring the other payment's lock.

## Refund history and cursor

Only limit/cursor are accepted; default limit 20, canonical decimal1..50. Order by `(created_at DESC,id DESC)` with limit+1, no OFFSET/global total. Return at mostlimit sanitized RefundViews; all Admin/compensation/imported/replacement allocations are included, with no reasons/provider references. A replacement is a distinct entry linked by nullable `replacesRefundId`. Order-scoped Customer ownership is independently enforced for each page.

Cursor≤2,048 characters is unpadded Base64url compact UTF-8 payload, a dot, then unpadded HMAC-SHA256 over exact bytes. Dedicated shared ≥32-random-byte Payments key. Payload field order: `v=1`, `kind=customer|admin`, `actorId`, `orderId`, `limit`, `lastCreatedAt` (six-fraction UTC), `lastId`, `expiresAt` (integer Unix seconds). Issue at primary DBtime+900seconds. Validate bounded canonical encoding/MAC/shape/field order/route/actor/Order/limit and fresh DBtime expiry before trusting fields. Any failure is400 Validation.Failed fieldcursor. Constant-time MAC comparison; prior key may validate only a configured15-minute rotation overlap. No unsigned fallback.

Pages have independent snapshots; new refunds ahead of the saved position require refreshing page one. Returned state may change between pages. The cursor is readable position metadata, not authority. Admin page/access audit identifies actor/Order/query type/result count, not full provider/customer data.

## JSON Schema registry

Draft2020-12 with format assertions. Register [Orders schemas](../../05-orders/functional-requirements/api-and-module-contracts.md#json-schema-registry) as `urn:ecommerce:orders:schemas:v1` and [Checkout schemas](../../06-checkout/functional-requirements/api-and-module-contracts.md#json-schema-registry) as `urn:ecommerce:checkout:schemas:v1`. Integer lexical rules, normalized scalar/byte limits, authority, equations, version/time relations and pagination MAC require semantic validation beyond JSON Schema.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:payments:schemas:v1",
  "$defs":{
    "Uuid":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Uuid"},
    "Instant":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Instant"},
    "Version":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Version"},
    "FinancialVersion":{"type":"integer","minimum":0,"maximum":9007199254740991},
    "Amount":{"type":"integer","minimum":0,"maximum":9007199254740991},
    "Money":{"type":"object","additionalProperties":false,"required":["amountMinor","currency"],"properties":{"amountMinor":{"$ref":"#/$defs/Amount"},"currency":{"const":"USD"}}},
    "RefundRequest":{"type":"object","additionalProperties":false,"required":["expectedVersion","amountMinor","reason"],"properties":{"expectedVersion":{"$ref":"#/$defs/Version"},"amountMinor":{"type":"integer","minimum":1,"maximum":99999999},"reason":{"type":"string","minLength":1,"maxLength":256}}},
    "RefundReceipt":{"type":"object","additionalProperties":false,"required":["refundId","orderId","acceptedAt","amount","financialVersion"],"properties":{"refundId":{"$ref":"#/$defs/Uuid"},"orderId":{"$ref":"#/$defs/Uuid"},"acceptedAt":{"$ref":"#/$defs/Instant"},"amount":{"allOf":[{"$ref":"#/$defs/Money"},{"properties":{"amountMinor":{"minimum":1,"maximum":99999999}}}]},"financialVersion":{"$ref":"#/$defs/Version"}}},
    "Source":{"enum":["Simulator","StripeSandbox"]},
    "Recovery":{"enum":["Scheduled","Idle","ManualReview"]},
    "FinancialView":{"type":"object","additionalProperties":false,"required":["orderId","source","paymentState","amount","captured","refunded","reserved","available","refundStatus","compensationStatus","recoveryStatus","version","updatedAt"],"properties":{
      "orderId":{"$ref":"#/$defs/Uuid"},"source":{"$ref":"#/$defs/Source"},"paymentState":{"enum":["NotPrepared","Prepared","Pending","Captured","Rejected","Aborted"]},
      "amount":{"allOf":[{"$ref":"#/$defs/Money"},{"properties":{"amountMinor":{"minimum":501,"maximum":199999998500}}}]},"captured":{"$ref":"#/$defs/Money"},"refunded":{"$ref":"#/$defs/Money"},"reserved":{"$ref":"#/$defs/Money"},"available":{"$ref":"#/$defs/Money"},
      "refundStatus":{"enum":["None","Partial","Full"]},"compensationStatus":{"enum":["None","Covered","Settled","ManualReview"]},"recoveryStatus":{"$ref":"#/$defs/Recovery"},"version":{"$ref":"#/$defs/FinancialVersion"},"updatedAt":{"$ref":"#/$defs/Instant"}
    }},
    "RefundView":{"type":"object","additionalProperties":false,"required":["refundId","orderId","origin","amount","state","recoveryStatus","createdAt","updatedAt","replacesRefundId"],"properties":{
      "refundId":{"$ref":"#/$defs/Uuid"},"orderId":{"$ref":"#/$defs/Uuid"},"origin":{"enum":["Admin","Compensation","Imported"]},"amount":{"allOf":[{"$ref":"#/$defs/Money"},{"properties":{"amountMinor":{"minimum":1}}}]},"state":{"enum":["Prepared","Pending","Succeeded","Failed","Voided"]},"recoveryStatus":{"$ref":"#/$defs/Recovery"},"createdAt":{"$ref":"#/$defs/Instant"},"updatedAt":{"$ref":"#/$defs/Instant"},"replacesRefundId":{"anyOf":[{"$ref":"#/$defs/Uuid"},{"type":"null"}]}
    }},
    "RefundPage":{"type":"object","additionalProperties":false,"required":["items","nextCursor"],"properties":{"items":{"type":"array","maxItems":50,"items":{"$ref":"#/$defs/RefundView"}},"nextCursor":{"anyOf":[{"type":"string","minLength":1,"maxLength":2048,"pattern":"^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$"},{"type":"null"}]}}},
    "WebhookReceipt":{"type":"object","additionalProperties":false,"required":["received"],"properties":{"received":{"const":true}}},
    "FieldError":{"type":"object","additionalProperties":false,"required":["field","code"],"properties":{"field":{"enum":["body","query","orderId","expectedVersion","amountMinor","reason","idempotencyKey","limit","cursor"]},"code":{"enum":["Required","InvalidFormat","OutOfRange","UnknownMember","DuplicateMember","InvalidValue"]}}},
    "CheckoutProblem":{"anyOf":[{"$ref":"urn:ecommerce:checkout:schemas:v1#/$defs/Problem"},{"allOf":[{"$ref":"#/$defs/Problem"},{"properties":{"code":{"const":"Payments.AmountUnsupported"},"status":{"const":409}}}]}]},
    "Problem":{"type":"object","additionalProperties":false,"required":["type","title","status","detail","instance","code","traceId"],"properties":{
      "type":{"type":"string","format":"uri"},"title":{"type":"string","minLength":1,"maxLength":80},"status":{"enum":[400,401,403,404,405,406,409,413,415,429,500,503]},"detail":{"type":"string","minLength":1,"maxLength":200},"instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},"traceId":{"$ref":"#/$defs/Uuid"},
      "code":{"enum":["Validation.Failed","Auth.Unauthorized","Auth.Forbidden","Orders.NotFound","Payments.PaymentNotAvailable","Payments.IdempotencyConflict","Payments.VersionConflict","Payments.NotCaptured","Payments.AmountUnavailable","Payments.FinancialHold","Payments.SourceUnsupported","Payments.AmountUnsupported","Payments.WebhookRejected","Route.NotFound","Method.NotAllowed","Request.NotAcceptable","Request.TooLarge","Request.UnsupportedMediaType","RateLimit.Exceeded","Service.Unavailable","Server.Error"]},"errors":{"type":"array","minItems":1,"maxItems":10,"items":{"$ref":"#/$defs/FieldError"}}
    }}
  }
}
```

## Examples and projection semantics

New restricted Admin request at financial version 3:

```json
{"expectedVersion":3,"amountMinor":1000,"reason":"Sandbox goodwill adjustment"}
```

With one canonical Idempotency-Key, the original202 receipt is:

```json
{"refundId":"77777777-7777-4777-8777-777777777777","orderId":"55555555-5555-4555-8555-555555555555","acceptedAt":"2026-10-01T10:00:00.000000Z","amount":{"amountMinor":1000,"currency":"USD"},"financialVersion":4}
```

Current view after the partial refund succeeds:

```json
{
  "orderId":"55555555-5555-4555-8555-555555555555","source":"StripeSandbox","paymentState":"Captured",
  "amount":{"amountMinor":5498,"currency":"USD"},"captured":{"amountMinor":5498,"currency":"USD"},"refunded":{"amountMinor":1000,"currency":"USD"},
  "reserved":{"amountMinor":0,"currency":"USD"},"available":{"amountMinor":4498,"currency":"USD"},"refundStatus":"Partial","compensationStatus":"None","recoveryStatus":"Idle","version":6,"updatedAt":"2026-10-01T10:00:02.000000Z"
}
```

FinancialView≤4,096 bytes, RefundReceipt≤1,024, RefundView≤1,024, RefundPage≤65,536. `available=max(0,C−S−R)` is additionally forced0 under integrity hold/full compensation; it never asserts discretionary access to anomalous money. Full means C>0 and S=C; no capture yields None. Compensation Covered means durable remaining obligation; Settled means S=C with no unresolved allocation; ManualReview takes precedence when case-related work is unresolved/failed. RecoveryStatus is ManualReview if held/exhausted/unsupported, Scheduled if actionable work remains, otherwise Idle. Bookkeeping does not advance public updatedAt; effective financial changes do.

Simulator mapping: Prepared/Pending/Captured/Rejected/Aborted retain original meaning, one synthetic refund maps Prepared/Pending/Succeeded/Failed with originCompensation, failed coverage remains reserved, and synthetic facts stay synthetic. Project its owner's durable state without writing Payments provider rows. Unavailable original owner returns503 rather than guessing.

## Error catalog

Problem `type=urn:ecommerce:problem:<code>`, traceId equals X-Request-Id; instance is the matched route template without actual IDs/query. Titles/details below are exact public wording. Field errors appear only with Validation.Failed; at most10, deterministic field order. Never include available balance/version/provider status/reason/body in error detail.

| Status/code | Title | Detail |
| --- | --- | --- |
| 400 Validation.Failed | Invalid request | One or more request fields are invalid. |
| 401 Auth.Unauthorized | Authentication required | A valid access credential is required. |
| 403 Auth.Forbidden | Access denied | This operation is not permitted. |
| 404 Orders.NotFound | Order not found | The requested order was not found. |
| 404 Payments.PaymentNotAvailable | Payment unavailable | Financial information is not available for this order. |
| 409 Payments.IdempotencyConflict | Idempotency conflict | The accepted key is bound to a different refund request. |
| 409 Payments.VersionConflict | Financial version conflict | Financial information changed. Reload before issuing a new refund. |
| 409 Payments.NotCaptured | Payment not captured | A captured payment is required for this refund. |
| 409 Payments.AmountUnavailable | Refund amount unavailable | The requested refund amount is not available. |
| 409 Payments.FinancialHold | Financial review required | This payment cannot accept another refund instruction. |
| 409 Payments.SourceUnsupported | Unsupported financial source | This source does not support this refund operation. |
| 409 Payments.AmountUnsupported | Unsupported payment amount | The purchase total is outside the sandbox provider amount range. |
| 400 Payments.WebhookRejected | Webhook rejected | The provider delivery could not be accepted. |
| 404 Route.NotFound | Route not found | The requested route was not found. |
| 405 Method.NotAllowed | Method not allowed | The method is not supported for this route. |
| 406 Request.NotAcceptable | Response type unsupported | The requested response media type is not supported. |
| 413 Request.TooLarge | Request too large | The request exceeds the permitted size. |
| 415 Request.UnsupportedMediaType | Request media type unsupported | The request media type or encoding is not supported. |
| 429 RateLimit.Exceeded | Request limit reached | Retry after the indicated delay. |
| 503 Service.Unavailable | Service unavailable | The operation cannot complete now. Retry safely with the original request. |
| 500 Server.Error | Unexpected error | An unexpected error occurred. |

401 includes WWW-Authenticate: Bearer. Recoverable503 includes Retry-After:1;429 includes the rate policy's next window integer seconds. GET financial/history has Retry-After:1 while exposed work is Scheduled; clients poll no faster than once/second. Known committed replay requires a healthy primary/current authority; no cache bypass is permitted. Payments.AmountUnsupported extends Phase06 preview/new-submit errors only for Sandbox; existing receipts and problem formats remain unchanged otherwise. Phase07 clients validate Checkout errors against CheckoutProblem above, which explicitly adds that code to the former strict registry. A client pinned to the Phase06 closed code enum must update before using Sandbox; no earlier receipt/success schema is changed.

## Callback protocol exception

Use the [provider envelope](stripe-provider-contract.md#webhook-envelope-and-signed-ingress), with no Bearer or client idempotency key required. Authentication is the signature/timestamp and configured account/destination context. Authorization headers/cookies do not grant callback privilege. Unknown provider fields are tolerated; known structural duplicate keys are rejected. A verified unsupported event can return200 only after durable Ignored/Quarantined receipt. Invalid signature/layout returns400 WebhookRejected; oversized/media/capacity/database failures use the catalog. A conflicting duplicate event identity is quarantined and acknowledged only after that record commits.

## Trusted owner operations

| Operation | Authority/transaction | Result/obligation |
| --- | --- | --- |
| `Payments.SelectAcceptedSource` | Trusted Checkout after Identity locks and before Cart/Inventory; no I/O | Frozen candidate from protected assignment/default, account/version/amount support; unavailable/conflict prevents new acceptance |
| `Payments.FreezeAcceptedBinding` | Caller acceptance transaction after new Order; accepted immutable mapping | Insert/compare exactly once; no provider work; no independent commit |
| `EnsurePaymentIntent` | Existing Checkout owner contract after Order/Inventory | Prepared/existing facts or IntentConflict/Unavailable; one payment/financial work row |
| `AbortUndispatchedOrInspect` | Same ordered caller transaction | Missing/Prepared→Aborted with proof; dispatched state inspected, never invented no-capture |
| `StartOrInspectPayment` | Financial-owned short transactions, external call≤2s | Original mutation/retrieval, verified fact or Unknown; independent evidence commits before wake |
| `ReadFinancialFacts` | Bounded owner read/caller transaction | Exact mapping/proof, current refund/hold/coverage guards and version; no provider call |
| `EnsureFullCompensation` | Captured proof and stable Checkout case UUID; caller transaction | Durable full remaining coverage, reuse existing coverage/cause; no double reservation |
| `StartOrInspectCompensation` | Financial-only execution | Original allocated refunds/case aggregate Succeeded/Failed/Pending/Unknown; per-action bounded I/O |
| `ObserveProviderObject` | Trusted classifier from authenticated retrieval | Append/compare facts, mapping, balances/audit and wake marker; quarantine mismatches |
| `ResumeFinancialWork` / `ReplaceFailedCompensation` | Protected local operator, reason/request UUID, current proof | Original-ID resume or one reviewed failed-allocation replacement; never Unknown replacement |

These names retain the Phase06 boundary semantics. Caller operations do not commit their own transaction. Internal evidence is not serialized as a public API or unsigned event. There are no external domain-event publications now; CloudEvents/outbox contracts belong to the separately requested messaging phase.
