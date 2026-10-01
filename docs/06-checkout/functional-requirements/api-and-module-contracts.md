# Checkout API and Module Contracts

**Status:** proposed v1 Customer API and in-process coordination contract. [Workflows](checkout-workflows.md) define semantics; [financial boundary](payment-boundary-and-simulator.md) defines synthetic financial ownership. There is no public provider/callback/refund interface in Phase 06.

## Protocol and routes

Reuse the [Identity protocol](../../01-identity-and-auth/functional-requirements/api-contracts.md): HTTPS, eligible Bearer Customer, authoritative account/session checks, server-generated canonical lowercase UUID X-Request-Id and sanitized RFC 9457 errors. Admin/guest has no Checkout privilege. Owner always comes from verified subject; no customer/session/financial-proof selector is accepted.

Success is application/json; errors application/problem+json; every response has Cache-Control: no-store. No ETag/304 is emitted. POST requires one uncompressed application/json body ≤16,384 decoded bytes. Missing/empty body, unknown/duplicate JSON members, duplicate required headers, invalid UTF-8 or any query parameter is 400; unsupported/compressed media is 415; excess body is 413. GET has no body. Accept application/json or */*; another explicit response media type is 406. Integer syntax has no fraction/exponent or negative zero. UUIDs are lowercase 8-4-4-4-12; timestamps preserve six fractional UTC digits. Header names follow HTTP case rules; values/enums/member names are case-sensitive.

| Method/path | Request/authority | Success | Domain errors |
| --- | --- | --- | --- |
| POST `/api/v1/checkout/quotes` | Customer; PreviewRequest | 200 QuoteView | CartChanged, EmptyCart, ProductUnavailable |
| POST `/api/v1/checkout/attempts` | Customer; SubmitRequest and one Idempotency-Key UUID | 202 AcceptanceReceipt; Location attempt route | IdempotencyConflict, QuoteNotFound, QuoteAlreadyAccepted, QuoteExpired, PolicyChanged, CartChanged, PriceChanged, ProductUnavailable, InsufficientStock |
| GET `/api/v1/checkout/attempts/{attemptId}` | Customer owner; UUID | 200 AttemptView | AttemptNotFound |

All routes have common authority/transport/dependency errors. Known-route unsupported method →405 with explicit Allow; unknown route →404 Route.NotFound. There is no quote-edit/GET/history, public resume, Checkout cancel, Admin submission, payment-method, provider-status or scenario-selection route. Cancellation uses the existing [Orders API](../../05-orders/functional-requirements/api-and-module-contracts.md).

## Idempotency and acknowledgement

Idempotency-Key is REQUIRED only on submit: exactly one canonical UUID value, no comma list/whitespace, server request ID or supplied owner scope. It binds `(verified Customer, route operation AcceptQuote, canonical quoteId)` for every retained accepted attempt. The server-generated attempt UUID is a separate globally unique Inventory/Orders intent. Header absence/invalid format is Validation.Failed, field idempotencyKey.

Exact accepted replay returns the same immutable 202 receipt body and Location, before current quote expiry/policy/Cart/Catalog/stock checks. `Idempotency-Replayed: false` on original acceptance and `true` on known replay; each request still gets its own X-Request-Id. Changed quoteId under the accepted key is 409 IdempotencyConflict. One accepted quote cannot produce a second attempt under another key. Rejections roll back the binding. A response loss/503/timeout requires original key/body replay; a fresh key cannot prove the first request failed.

202 acknowledges durable local acceptance and scheduled work, not paid/confirmed/refunded state. No payment dispatch or postcommit Catalog/financial read is required to form that receipt. Location points to the current owned AttemptView. GET is observational, with `Retry-After: 1` while recovery is Scheduled; clients poll no faster than once per second. ManualReview is visible operator work, not permission to submit a replacement purchase automatically.

## JSON Schema registry

Draft 2020-12, with format assertions enabled. Register the linked [Orders registry](../../05-orders/functional-requirements/api-and-module-contracts.md#json-schema-registry) as `urn:ecommerce:orders:schemas:v1`; inherited money/line/address bounds are normative. This registry adds the exact Phase 06 policy. Arithmetic, sorted/distinct lines, NFC/scalar/byte rules, ownership, state combinations and integer lexical rules require semantic validation too.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:checkout:schemas:v1",
  "$defs":{
    "Uuid":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Uuid"},
    "Instant":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Instant"},
    "Version":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Version"},
    "CartVersion":{"type":"integer","minimum":0,"maximum":9007199254740991},
    "Money":{"allOf":[{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/PositiveMoney"},{"properties":{"amountMinor":{"minimum":501,"maximum":199999998500}}}]},
    "Address":{"allOf":[{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Address"},{"properties":{"countryCode":{"const":"US"}}}]},
    "Totals":{
      "allOf":[{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Totals"},{"properties":{
        "shipping":{"properties":{"amountMinor":{"const":500}}},"tax":{"properties":{"amountMinor":{"const":0}}},
        "total":{"properties":{"amountMinor":{"maximum":199999998500}}}
      }}]
    },
    "PaymentMode":{"enum":["Simulated","Sandbox"]},
    "PreviewRequest":{
      "type":"object","additionalProperties":false,"required":["expectedCartVersion","shippingAddress"],
      "properties":{"expectedCartVersion":{"$ref":"#/$defs/CartVersion"},"shippingAddress":{"$ref":"#/$defs/Address"}}
    },
    "SubmitRequest":{
      "type":"object","additionalProperties":false,"required":["quoteId"],"properties":{"quoteId":{"$ref":"#/$defs/Uuid"}}
    },
    "QuoteView":{
      "type":"object","additionalProperties":false,"required":["quoteId","cartVersion","createdAt","expiresAt","lines","shippingAddress","totals","taxMode"],
      "properties":{
        "quoteId":{"$ref":"#/$defs/Uuid"},"cartVersion":{"$ref":"#/$defs/Version"},"createdAt":{"$ref":"#/$defs/Instant"},"expiresAt":{"$ref":"#/$defs/Instant"},
        "lines":{"type":"array","minItems":1,"maxItems":20,"items":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Line"}},
        "shippingAddress":{"$ref":"#/$defs/Address"},"totals":{"$ref":"#/$defs/Totals"},"taxMode":{"const":"Simulated"}
      }
    },
    "AcceptanceReceipt":{
      "type":"object","additionalProperties":false,"required":["attemptId","quoteId","orderId","acceptedAt","reservationExpiresAt","total","paymentMode"],
      "properties":{
        "attemptId":{"$ref":"#/$defs/Uuid"},"quoteId":{"$ref":"#/$defs/Uuid"},"orderId":{"$ref":"#/$defs/Uuid"},
        "acceptedAt":{"$ref":"#/$defs/Instant"},"reservationExpiresAt":{"$ref":"#/$defs/Instant"},"total":{"$ref":"#/$defs/Money"},"paymentMode":{"$ref":"#/$defs/PaymentMode"}
      }
    },
    "OrderProgress":{
      "type":"object","additionalProperties":false,"required":["id","status","version","cancellationStatus"],
      "properties":{
        "id":{"$ref":"#/$defs/Uuid"},"status":{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Status"},
        "version":{"$ref":"#/$defs/Version"},"cancellationStatus":{"enum":["None","Requested","Completed"]}
      }
    },
    "StockLoss":{
      "type":"object","additionalProperties":false,"required":["reason","observedAt"],
      "properties":{"reason":{"enum":["Expired","Released"]},"observedAt":{"$ref":"#/$defs/Instant"}}
    },
    "AttemptView":{
      "type":"object","additionalProperties":false,"required":["attemptId","quoteId","acceptedAt","updatedAt","reservationExpiresAt","total","paymentMode","purchaseOutcome","order","recoveryStatus","cartCleanupStatus","stockLoss"],
      "properties":{
        "attemptId":{"$ref":"#/$defs/Uuid"},"quoteId":{"$ref":"#/$defs/Uuid"},"acceptedAt":{"$ref":"#/$defs/Instant"},"updatedAt":{"$ref":"#/$defs/Instant"},
        "reservationExpiresAt":{"$ref":"#/$defs/Instant"},"total":{"$ref":"#/$defs/Money"},"paymentMode":{"$ref":"#/$defs/PaymentMode"},
        "purchaseOutcome":{"enum":["Pending","Confirmed","Failed","Cancelled"]},"order":{"$ref":"#/$defs/OrderProgress"},
        "recoveryStatus":{"enum":["Scheduled","Idle","ManualReview"]},"cartCleanupStatus":{"enum":["NotEligible","Pending","Cleared","Skipped"]},
        "stockLoss":{"anyOf":[{"$ref":"#/$defs/StockLoss"},{"type":"null"}]}
      }
    },
    "FieldError":{
      "type":"object","additionalProperties":false,"required":["field","code"],
      "properties":{
        "field":{"enum":["body","query","expectedCartVersion","shippingAddress","shippingAddress.countryCode","quoteId","attemptId","idempotencyKey"]},
        "code":{"enum":["Required","InvalidFormat","OutOfRange","UnknownMember","DuplicateMember","InvalidValue"]}
      }
    },
    "Problem":{
      "type":"object","additionalProperties":false,"required":["type","title","status","detail","instance","code","traceId"],
      "properties":{
        "type":{"type":"string","format":"uri"},"title":{"type":"string","minLength":1,"maxLength":80},"status":{"enum":[400,401,403,404,405,406,409,413,415,500,503]},
        "detail":{"type":"string","minLength":1,"maxLength":200},"instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},
        "code":{"enum":["Validation.Failed","Auth.Unauthorized","Auth.Forbidden","Checkout.CartChanged","Checkout.EmptyCart","Checkout.ProductUnavailable","Checkout.QuoteNotFound","Checkout.QuoteAlreadyAccepted","Checkout.QuoteExpired","Checkout.PolicyChanged","Checkout.PriceChanged","Checkout.InsufficientStock","Checkout.IdempotencyConflict","Checkout.AttemptNotFound","Route.NotFound","Method.NotAllowed","Request.NotAcceptable","Request.TooLarge","Request.UnsupportedMediaType","Service.Unavailable","Server.Error"]},
        "traceId":{"$ref":"#/$defs/Uuid"},"errors":{"type":"array","minItems":1,"maxItems":10,"items":{"$ref":"#/$defs/FieldError"}}
      }
    }
  }
}
```

PaymentMode Sandbox is reserved for the later verified adapter and cannot be emitted by Phase 06 acceptance. Original receipts retain their recorded mode forever. TaxMode remains explicitly simulated under the current pricing policy even if a later provider mode exists. No mode is accepted from a client.

## Examples and semantics

Quote request uses the full normalized address shape:

```json
{
  "expectedCartVersion":4,
  "shippingAddress":{
    "recipientName":"Sandbox Customer","addressLine1":"100 Example Street","addressLine2":null,
    "city":"Example City","region":null,"postalCode":null,"countryCode":"US"
  }
}
```

Two units at 2,499 cents give items 4,998, shipping 500, simulated tax 0 and total 5,498. All component objects carry currency USD. Optional region/postalCode remain nullable under Orders' sandbox structural rules; acceptance does not prove a deliverable US address.

Submit body is `{"quoteId":"12345678-1234-4234-8234-123456789abc"}` with `Idempotency-Key: 22222222-2222-4222-8222-222222222222`. Example 202:

```json
{
  "attemptId":"33333333-3333-4333-8333-333333333333",
  "quoteId":"12345678-1234-4234-8234-123456789abc",
  "orderId":"44444444-4444-4444-8444-444444444444",
  "acceptedAt":"2026-10-01T10:00:00.123456Z",
  "reservationExpiresAt":"2026-10-01T10:15:00.100000Z",
  "total":{"amountMinor":5498,"currency":"USD"},"paymentMode":"Simulated"
}
```

Location is `/api/v1/checkout/attempts/33333333-3333-4333-8333-333333333333`. Reservation creation can precede acceptance by a short transaction interval; deadline is Inventory createdAt +900 seconds, not acceptance +900. Replay retains those exact original timestamps. Quote expiry is createdAt +300 seconds, and submission decides validity after its final waits. Schema alone does not establish arithmetic, timing or state consistency.

AttemptView uses one statement snapshot. Confirmed purchaseOutcome can accompany current Order Cancelled after a later cancellation; it records historical confirmation. Failed/Cancelled outcomes never accompany a newly confirmed Order. StockLoss is a durable observation of actual terminal stock, not a second stock balance. No payment/refund enum or amount is inferred from Order status. Integrity mismatches fail safely instead of returning a fabricated projection.

## Error catalog and precedence

Follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html). Type is `urn:ecommerce:problem:<code>`; instance is matched route template without raw IDs/query (unknown `/api/v1/unmatched`); traceId equals X-Request-Id. Only Validation.Failed has deduplicated field/code-sorted errors, maximum ten and no submitted values.

| Status/code | Title | Detail |
| --- | --- | --- |
| 400 `Validation.Failed` | Invalid request | The request does not match the checkout contract. |
| 401 `Auth.Unauthorized` | Authentication required | A valid access credential is required. |
| 403 `Auth.Forbidden` | Access denied | This operation is not permitted. |
| 409 `Checkout.CartChanged` | Cart changed | Read the cart and request a new checkout preview. |
| 409 `Checkout.EmptyCart` | Cart is empty | Add an eligible product before requesting a checkout preview. |
| 409 `Checkout.ProductUnavailable` | Product unavailable | The purchase contains a product that cannot currently be sold. |
| 404 `Checkout.QuoteNotFound` | Quote not found | The requested quote was not found. |
| 409 `Checkout.QuoteAlreadyAccepted` | Quote already accepted | Recover the original submission before starting another purchase. |
| 409 `Checkout.QuoteExpired` | Quote expired | Request a new preview before accepting this purchase. |
| 409 `Checkout.PolicyChanged` | Checkout policy changed | Request a new preview before accepting this purchase. |
| 409 `Checkout.PriceChanged` | Purchase amount changed | Request a new preview and explicitly accept its amounts. |
| 409 `Checkout.InsufficientStock` | Insufficient stock | The requested quantities are not currently available. |
| 409 `Checkout.IdempotencyConflict` | Submission identity conflict | This submission identity is already bound to another accepted quote. |
| 404 `Checkout.AttemptNotFound` | Attempt not found | The requested checkout attempt was not found. |
| 404 `Route.NotFound` | Route not found | The requested route was not found. |
| 405 `Method.NotAllowed` | Method not allowed | The HTTP method is not supported for this route. |
| 406 `Request.NotAcceptable` | Response format unavailable | Request application/json. |
| 413 `Request.TooLarge` | Request too large | The request exceeds the allowed size. |
| 415 `Request.UnsupportedMediaType` | Unsupported request format | Use an uncompressed application/json request body. |
| 503 `Service.Unavailable` | Service unavailable | The operation could not be completed. Recover an uncertain submission with its original key and body. |
| 500 `Server.Error` | Unexpected server error | The operation could not be completed. |

Bounded transport checks may precede authority. For acceptable known routes: authorize, validate syntax, then locked Identity eligibility → Customer/key replay comparison → admissible mode for new acceptance → owner-scoped quote existence → already accepted → quote expiry → policy → Cart version/empty → Inventory sellability/stock → current price/total → fresh expiry/authority → write/commit. Actual Inventory ordering can reveal insufficient stock before price change; reject safely with the corresponding first owner outcome. Price mismatch rolls back reservation work. Replay precedes all current business/source-mode checks, but always requires current eligible authority. Missing/other-owner quote/attempt has identical 404 behavior.

Recognized DB/pool/lock/integrity/version exhaustion is sanitized 503; unclassified defects are 500. Unique quote races reconcile after whole-transaction rollback, never inside an aborted PostgreSQL transaction. 401 includes WWW-Authenticate: Bearer; recoverable 503 includes Retry-After: 1. A successful 202 is returned only after known acceptance commit. Client disconnect during commit remains uncertain.

## Owner extensions and trusted Checkout operations

| Operation | Input/transaction | Result |
| --- | --- | --- |
| Existing `Cart.ReadOwnedIntentForCheckout` | Verified Customer/version; caller transaction after Identity | Locked sorted product quantities, Empty/VersionMismatch/Unavailable |
| Existing `Catalog.GetCurrentCartProducts` | ≤20 IDs, caller connection; ordinary batch for preview or rows already locked by Reserve | Current visible SKU/name/price facts; required missing reference is integrity/unavailable |
| Existing `Inventory.Reserve/Consume/Release` | Stable attempt intent and exact lines/mapping; caller transaction | Owner state/expiry and terminal transitions under Phase 03 rules |
| Existing `Orders.CreateAcceptedOrder/LockForResolution/ConfirmPurchase/FailPurchase/CompleteCancellation` | Canonical snapshot or durable evidence; caller transaction | Owner creation/guarded outcome; exact proof replay before new application |
| New `Cart.ClearPurchasedIntent` | Trusted accepted owner, cart version and sorted purchased lines; caller transaction holding only work/attempt/Cart | Cleared with new version, or Preserved for changed version; equal-version line mismatch/overflow → integrity failure; no independent commit |
| `Checkout.WakeFromFinancialFact` | Trusted committed source mapping/evidence ID; financial owner holds no locks | Schedule affected existing work once for a new proof; keep original operation IDs |
| `Checkout.DiscoverRequestedCancellations` | Trusted driver, ≤100 Orders identifiers using owner keyset | Wake the existing Cancellation row after discovery; no Order lock held during Checkout mutation |
| `Checkout.ResumeWork` | Restricted local operator, exact work identity and normalized reason | Audited reschedule of original identities after inspection; no business/proof override |

Cart cleanup is the Phase 06 owner extension anticipated by Phase 04. Cart alone writes its parent/lines, retains the empty parent and increments once on effective clear. It does not reprice/reserve. Clear result and Checkout work/audit commit together. Confirmation and cleanup use separate transactions; no Cart lock follows an existing Order/Inventory lock.

Wake deduplicates separate last payment-proof, refund-proof and cancellation-time markers under the work lock. A new trusted fact can schedule ManualReview work; replayed old input cannot continually reset retry limits or defeat fencing. Operator resume supplies 1–256 normalized scalars/≤1,024 bytes without controls/newlines, uses existing protected operator execution/credentials and records request/cause; it is unavailable to ordinary Admin HTTP.
