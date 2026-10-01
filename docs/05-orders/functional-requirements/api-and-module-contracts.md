# Orders API and Internal Contracts

**Status:** proposed v1 business API and trusted in-process integration contract. [Workflows](order-workflows.md) own lifecycle/snapshot behavior. Financial API/provider contracts belong to Phases 06–07.

## Protocol and routes

Reuse the [Identity protocol](../../01-identity-and-auth/functional-requirements/api-contracts.md): HTTPS, eligible Bearer access, authoritative account/session checks, restricted Admin sources, server-generated UUID `X-Request-Id` and sanitized RFC 9457 problems. Customer routes require Customer and scope by verified owner; Admin routes require Admin/allowed network. No owner input or impersonation is accepted.

Success uses `application/json`, errors `application/problem+json`, every response `Cache-Control: no-store`. No response validator is emitted; required JSON expectedVersion governs human mutations. IDs are lowercase canonical UUIDs. Response instants preserve PostgreSQL microseconds as UTC `YYYY-MM-DDTHH:MM:SS.ffffffZ`; this exact precision also governs cursor timestamps. JSON integer input uses decimal integer syntax, with no fraction/exponent/negative zero. Fields/enums are case-sensitive.

POST requires an uncompressed JSON body ≤16,384 decoded bytes. GET has no body. Reject duplicate/unknown members, invalid UTF-8, unknown/duplicate query keys and empty supplied query values with `400`; unsupported/compressed media format yields `415`, body excess `413`. Accept `application/json` or `*/*`; another explicit response media type yields `406`. All mutations require positive expectedVersion; omission/invalid format is `400`, stale value `409`.

| Method/path | Authority/request | Success | Domain errors |
| --- | --- | --- | --- |
| `GET /api/v1/orders` | Customer; limit/cursor | `200 OrderPage` | Validation/dependency errors |
| `GET /api/v1/orders/{orderId}` | Customer owner; UUID | `200 OrderDetail` | `404 Orders.NotFound` |
| `POST /api/v1/orders/{orderId}/cancel` | Customer owner; VersionRequest | `202 MutationReceipt` Requested; `200` already Completed | NotFound; VersionMismatch; CancellationNotAllowed |
| `GET /api/v1/admin/orders` | Restricted Admin; required status, limit/cursor | `200 OrderPage` | Validation/dependency errors |
| `GET /api/v1/admin/orders/{orderId}` | Restricted Admin; UUID | `200 OrderDetail`, with committed access audit | NotFound |
| `POST /api/v1/admin/orders/{orderId}/cancel` | Restricted Admin; AdminCommand | `202 MutationReceipt` Requested; `200` already Completed | NotFound; VersionMismatch; CancellationNotAllowed |
| `POST /api/v1/admin/orders/{orderId}/start-processing` | Restricted Admin; AdminCommand | `200 MutationReceipt` | NotFound; VersionMismatch; InvalidTransition |
| `POST /api/v1/admin/orders/{orderId}/ship` | Restricted Admin; AdminCommand | `200 MutationReceipt` | NotFound; VersionMismatch; InvalidTransition |
| `POST /api/v1/admin/orders/{orderId}/deliver` | Restricted Admin; AdminCommand | `200 MutationReceipt` | NotFound; VersionMismatch; InvalidTransition |

Common errors apply to every route. Known-route unsupported methods return `405` with explicit Allow; unknown routes `404 Route.NotFound`. There is no public order-create, status PATCH, mark-paid, failure, cancellation-completion, refund, partial shipment or address-edit route. Receipts contain only business outcome/version/time, not a postcommit financial or Catalog projection. A `202` acknowledges durable cancellation intent, not completed cancellation/refund.

## Pagination and cursor binding

`limit` defaults to 20; canonical decimal integers 1–50 are valid. Customer list accepts only limit/cursor. Admin list additionally requires exact status Confirmed, Processing or Shipped and returns only cancellation None. Ordering is `(created_at DESC,id DESC)`; query limit+1 qualifying rows, return ≤limit, nextCursor only when an extra row exists. No OFFSET/global count or lines/addresses appear in a summary.

Cursor is unpadded Base64url payload + `.` + unpadded Base64url HMAC-SHA256 of exact payload bytes, maximum 2,048 characters, with a dedicated shared ≥32-random-byte Orders key and constant-time comparison. The UTF-8 compact JSON payload has fields in this exact order: v(integer 1), kind(`customer`/`admin`), actorId(verified user UUID), limit(integer), status(null for Customer; required Admin status), lastCreatedAt(exact six-fraction UTC instant), lastId(UUID), expiresAt(integer Unix seconds). Issuance uses database time plus 900 seconds; expiry check uses fresh database time. Validate encoding/MAC before trusting fields, then exact shape/order, route, actor, limit/status and expiry. Every invalid/tampered/expired/binding mismatch is `400 Validation.Failed`, field cursor. The original resolved limit must be supplied consistently or match the default.

Cursor carries readable position/actor metadata; it is not encryption or permission. Recheck authority for every page and always apply the owner/status predicate independently. Key rotation either validates the prior key for a bounded 15-minute overlap or deliberately invalidates outstanding cursors; no unsigned fallback. Independent page snapshots can change Admin queue membership and omit rows that enter before the saved position; refresh the queue to see those. New Customer orders ahead of the cursor appear when refreshing page one.

## JSON Schema registry

Draft 2020-12 describes wire structure; enable format assertions. Distinct/sorted product IDs, exact monetary equations, NFC/scalar/byte rules, state/timestamp relationships, cursor verification and authority are additional semantic requirements. All address members are present, with null optional values.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:orders:schemas:v1",
  "$defs":{
    "Uuid":{"type":"string","format":"uuid","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Instant":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},
    "NullableInstant":{"anyOf":[{"$ref":"#/$defs/Instant"},{"type":"null"}]},
    "Version":{"type":"integer","minimum":1,"maximum":9007199254740991},
    "Status":{"enum":["PendingPayment","Confirmed","Processing","Shipped","Delivered","Cancelled","Failed"]},
    "Money":{
      "type":"object","additionalProperties":false,"required":["amountMinor","currency"],
      "properties":{"amountMinor":{"type":"integer","minimum":0,"maximum":9007199254740991},"currency":{"const":"USD"}}
    },
    "PositiveMoney":{"allOf":[{"$ref":"#/$defs/Money"},{"properties":{"amountMinor":{"minimum":1}}}]},
    "UnitPrice":{"allOf":[{"$ref":"#/$defs/PositiveMoney"},{"properties":{"amountMinor":{"maximum":99999999}}}]},
    "LineSubtotal":{"allOf":[{"$ref":"#/$defs/PositiveMoney"},{"properties":{"amountMinor":{"maximum":9999999900}}}]},
    "ItemsSubtotal":{"allOf":[{"$ref":"#/$defs/PositiveMoney"},{"properties":{"amountMinor":{"maximum":199999998000}}}]},
    "Address":{
      "type":"object","additionalProperties":false,"required":["recipientName","addressLine1","addressLine2","city","region","postalCode","countryCode"],
      "properties":{
        "recipientName":{"type":"string","minLength":1,"maxLength":100},"addressLine1":{"type":"string","minLength":1,"maxLength":200},
        "addressLine2":{"anyOf":[{"type":"string","minLength":1,"maxLength":200},{"type":"null"}]},
        "city":{"type":"string","minLength":1,"maxLength":100},"region":{"anyOf":[{"type":"string","minLength":1,"maxLength":100},{"type":"null"}]},
        "postalCode":{"anyOf":[{"type":"string","minLength":1,"maxLength":32},{"type":"null"}]},"countryCode":{"type":"string","pattern":"^[A-Z]{2}$"}
      }
    },
    "Line":{
      "type":"object","additionalProperties":false,"required":["productId","sku","name","quantity","unitPrice","lineSubtotal"],
      "properties":{
        "productId":{"$ref":"#/$defs/Uuid"},"sku":{"type":"string","minLength":3,"maxLength":32,"pattern":"^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$"},
        "name":{"type":"string","minLength":3,"maxLength":160},"quantity":{"type":"integer","minimum":1,"maximum":100},
        "unitPrice":{"$ref":"#/$defs/UnitPrice"},"lineSubtotal":{"$ref":"#/$defs/LineSubtotal"}
      }
    },
    "Totals":{
      "type":"object","additionalProperties":false,"required":["itemsSubtotal","shipping","tax","total"],
      "properties":{"itemsSubtotal":{"$ref":"#/$defs/ItemsSubtotal"},"shipping":{"$ref":"#/$defs/Money"},"tax":{"$ref":"#/$defs/Money"},"total":{"$ref":"#/$defs/PositiveMoney"}}
    },
    "Cancellation":{
      "type":"object","additionalProperties":false,"required":["status","requestedAt","completedAt"],
      "properties":{"status":{"enum":["None","Requested","Completed"]},"requestedAt":{"$ref":"#/$defs/NullableInstant"},"completedAt":{"$ref":"#/$defs/NullableInstant"}},
      "allOf":[
        {"if":{"properties":{"status":{"const":"None"}}},"then":{"properties":{"requestedAt":{"type":"null"},"completedAt":{"type":"null"}}}},
        {"if":{"properties":{"status":{"const":"Requested"}}},"then":{"properties":{"requestedAt":{"$ref":"#/$defs/Instant"},"completedAt":{"type":"null"}}}},
        {"if":{"properties":{"status":{"const":"Completed"}}},"then":{"properties":{"requestedAt":{"$ref":"#/$defs/Instant"},"completedAt":{"$ref":"#/$defs/Instant"}}}}
      ]
    },
    "Summary":{
      "type":"object","additionalProperties":false,"required":["id","status","version","createdAt","updatedAt","total","cancellation"],
      "properties":{"id":{"$ref":"#/$defs/Uuid"},"status":{"$ref":"#/$defs/Status"},"version":{"$ref":"#/$defs/Version"},"createdAt":{"$ref":"#/$defs/Instant"},"updatedAt":{"$ref":"#/$defs/Instant"},"total":{"$ref":"#/$defs/PositiveMoney"},"cancellation":{"$ref":"#/$defs/Cancellation"}}
    },
    "OrderPage":{
      "type":"object","additionalProperties":false,"required":["items","nextCursor"],
      "properties":{"items":{"type":"array","maxItems":50,"items":{"$ref":"#/$defs/Summary"}},"nextCursor":{"anyOf":[{"type":"string","minLength":1,"maxLength":2048},{"type":"null"}]}}
    },
    "OrderDetail":{
      "type":"object","additionalProperties":false,"required":["id","status","version","createdAt","updatedAt","lines","totals","shippingAddress","cancellation","confirmedAt","processingStartedAt","shippedAt","deliveredAt","endedAt","failureCode"],
      "properties":{
        "id":{"$ref":"#/$defs/Uuid"},"status":{"$ref":"#/$defs/Status"},"version":{"$ref":"#/$defs/Version"},
        "createdAt":{"$ref":"#/$defs/Instant"},"updatedAt":{"$ref":"#/$defs/Instant"},"lines":{"type":"array","minItems":1,"maxItems":20,"items":{"$ref":"#/$defs/Line"}},
        "totals":{"$ref":"#/$defs/Totals"},"shippingAddress":{"$ref":"#/$defs/Address"},"cancellation":{"$ref":"#/$defs/Cancellation"},
        "confirmedAt":{"$ref":"#/$defs/NullableInstant"},"processingStartedAt":{"$ref":"#/$defs/NullableInstant"},"shippedAt":{"$ref":"#/$defs/NullableInstant"},
        "deliveredAt":{"$ref":"#/$defs/NullableInstant"},"endedAt":{"$ref":"#/$defs/NullableInstant"},"failureCode":{"enum":[null,"PaymentRejected","ReservationExpired","Unfulfillable"]}
      }
    },
    "VersionRequest":{
      "type":"object","additionalProperties":false,"required":["expectedVersion"],"properties":{"expectedVersion":{"$ref":"#/$defs/Version"}}
    },
    "AdminCommand":{
      "type":"object","additionalProperties":false,"required":["expectedVersion","reason"],
      "properties":{"expectedVersion":{"$ref":"#/$defs/Version"},"reason":{"type":"string","minLength":1,"maxLength":256}}
    },
    "MutationReceipt":{
      "type":"object","additionalProperties":false,"required":["orderId","status","version","updatedAt","cancellationStatus","changed"],
      "properties":{"orderId":{"$ref":"#/$defs/Uuid"},"status":{"$ref":"#/$defs/Status"},"version":{"$ref":"#/$defs/Version"},"updatedAt":{"$ref":"#/$defs/Instant"},"cancellationStatus":{"enum":["None","Requested","Completed"]},"changed":{"type":"boolean"}}
    },
    "FieldError":{
      "type":"object","additionalProperties":false,"required":["field","code"],
      "properties":{"field":{"enum":["body","orderId","expectedVersion","reason","limit","cursor","status","query"]},"code":{"enum":["Required","InvalidFormat","OutOfRange","UnknownMember","DuplicateMember","InvalidValue"]}}
    },
    "Problem":{
      "type":"object","additionalProperties":false,"required":["type","title","status","detail","instance","code","traceId"],
      "properties":{
        "type":{"type":"string","format":"uri"},"title":{"type":"string","minLength":1,"maxLength":80},"status":{"enum":[400,401,403,404,405,406,409,413,415,500,503]},
        "detail":{"type":"string","minLength":1,"maxLength":200},"instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},
        "code":{"enum":["Validation.Failed","Auth.Unauthorized","Auth.Forbidden","Orders.NotFound","Orders.VersionMismatch","Orders.InvalidTransition","Orders.CancellationNotAllowed","Route.NotFound","Method.NotAllowed","Request.NotAcceptable","Request.TooLarge","Request.UnsupportedMediaType","Service.Unavailable","Server.Error"]},
        "traceId":{"$ref":"#/$defs/Uuid"},"errors":{"type":"array","minItems":1,"maxItems":10,"items":{"$ref":"#/$defs/FieldError"}}
      }
    }
  }
}
```

## Examples and semantic constraints

Customer cancellation: `POST /api/v1/orders/12345678-1234-4234-8234-123456789abc/cancel` with `{"expectedVersion":2}`. After a valid Confirmed request commits, return `202` with:

```json
{
  "orderId":"12345678-1234-4234-8234-123456789abc",
  "status":"Confirmed","version":3,"updatedAt":"2026-10-01T10:00:00.123456Z",
  "cancellationStatus":"Requested","changed":true
}
```

StartProcessing at version 3 now fails InvalidTransition because Requested blocks it. Admin fulfillment bodies have the same expectedVersion plus required normalized reason. Successful receipts contain no address/provider data, and no additional reads occur after commit to construct them.

Line subtotal and component equations MUST match the workflow bounds; all currency fields are USD. Detail lines have distinct IDs sorted ascending, independent of creation-time paging order. Timestamp ordering/source-state requirements and failure/cancellation combinations MUST match the database/lifecycle contract. Schema validation alone does not prove those cross-field relations. Reasons are NFC-normalized/Unicode-trimmed, reject controls/line breaks and are limited to 256 scalars/1,024 bytes. They are stored in restricted audit, never reflected into customer receipts/problems.

## Error catalog and precedence

Follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html): type is `urn:ecommerce:problem:<code>`, instance the matched template without raw ID/query (unknown route `/api/v1/unmatched`), traceId equals X-Request-Id. Only Validation.Failed includes deduplicated, field/code-sorted errors, capped at ten and without submitted values.

| Status/code | Title | Detail |
| --- | --- | --- |
| 400 `Validation.Failed` | Invalid request | The request does not match the orders contract. |
| 401 `Auth.Unauthorized` | Authentication required | A valid access credential is required. |
| 403 `Auth.Forbidden` | Access denied | This operation is not permitted. |
| 404 `Orders.NotFound` | Order not found | The requested order was not found. |
| 409 `Orders.VersionMismatch` | Order changed | Read the current order and decide whether to submit the command again. |
| 409 `Orders.InvalidTransition` | Order transition unavailable | This command is not permitted for the current order state. |
| 409 `Orders.CancellationNotAllowed` | Cancellation unavailable | Cancellation cannot be requested for this order state. |
| 404 `Route.NotFound` | Route not found | The requested route was not found. |
| 405 `Method.NotAllowed` | Method not allowed | The HTTP method is not supported for this route. |
| 406 `Request.NotAcceptable` | Response format unavailable | Request application/json. |
| 413 `Request.TooLarge` | Request too large | The request exceeds the allowed size. |
| 415 `Request.UnsupportedMediaType` | Unsupported request format | Use an uncompressed application/json request body. |
| 503 `Service.Unavailable` | Service unavailable | The operation could not be completed. Read the current order before retrying an uncertain command. |
| 500 `Server.Error` | Unexpected server error | The operation could not be completed. |

Bounded transport checks can reject size/media before application authority. Known structurally acceptable routes authorize before target lookup; validate syntax before transactional guards. For mutations: locked/rechecked Identity → scoped order existence → current expectedVersion → cutoff/source/cancellation guards → write/audit/commit. Recheck Identity time after waits before classifying a domain outcome. Missing/other-owner orders are identical NotFound. ExpectedVersion takes precedence over invalid transition/no-op. Recognized DB/pool/lock failure or integrity/version exhaustion is sanitized 503 with operator diagnostics; unclassified defects are 500. A valid Customer cannot infer Admin order state through denial differences.

401 includes `WWW-Authenticate: Bearer`; recoverable dependency/capacity 503 includes `Retry-After: 1`. Neither hint nor timeout permits automatic replacement of expectedVersion. Reload after an uncertain outcome and do not assume matching current status proves which historical request committed.

## Trusted internal operations

| Operation | Required input/owner contract | Output |
| --- | --- | --- |
| `Orders.CreateAcceptedOrder` | Verified Customer, stable intent/reservation, canonical accepted lines/address/required totals; caller transaction after reservation | Existing/new immutable creation receipt {orderId, createdAt}; or InvalidSnapshot, IntentConflict, ReservationMismatch, Unavailable |
| `Orders.LockForResolution` | Trusted coordinator and mapped order/intent; before Inventory group/stock | Locked aggregate; NotFound/IntentConflict/Unavailable; no commit |
| `Orders.ConfirmPurchase` | Locked order; new application requires PendingPayment with cancellation None, stable verified capture fact for exact order/amount/USD and mapped consumed reservation | Applied/AlreadyApplied or Blocked/InvalidEvidence/Unavailable |
| `Orders.FailPurchase` | Locked order; new application requires PendingPayment with cancellation None, stable definitive failure evidence/code, terminal stock and compensation-safe money | Applied/AlreadyApplied or Blocked/InvalidEvidence/Unavailable |
| `Orders.CompleteCancellation` | Locked order; new application requires Requested, stable resolution ID, terminal stock and known no-capture or durable full compensation intent | Applied/AlreadyApplied or Blocked/InvalidEvidence/Unavailable |
| `Orders.ListRequestedCancellations` | Trusted coordinator; bounded 1–100 rows and keyset position | Order/intent identifiers plus request time for later recovery; no claim/lock/provider work |

These operations are in-process, unavailable to public/Admin clients, and never independently commit a caller transaction. Trusted transition replay compares the stored proof and exact source facts before new-application state guards; an exact previously applied proof returns AlreadyApplied even after later progression, without Inventory effects or new audit/version. Checkout performs any required Inventory transition through its owner before a new Orders outcome; Orders writes only its own tables. Evidence is loaded/validated through Inventory/Payments owner operations on matching durable identities; an arbitrary DTO with “paid=true” is insufficient. Confirmation must validate exact accepted amount/currency, reservation intent and product quantities, and actual Consumed outcome. Cancellation/failure resolution must establish stock terminality and durable compensation coverage; unknown payment has no invented no-capture proof.

Phase 05 can verify these guards using isolated tagged simulations with stable synthetic evidence IDs. Simulator authority is disabled for normal deployments and cannot be activated by an HTTP field, human role or provider callback. Phase 06 defines the concrete coordinator/simulator and durable recovery records; Phase 07 replaces simulated financial evidence with verified owner records. No provider schema, timeout compensation completion or refund settlement is claimed by this contract.
