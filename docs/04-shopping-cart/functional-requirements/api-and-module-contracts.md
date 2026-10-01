# Cart API and Internal Contracts

**Status:** proposed v1 Customer API and in-process module contract. The [workflows](cart-workflows.md) define behavior; [transactions](../database/schema-and-transactions.md) define atomicity. USD uses integer cents with two display decimals.

## Protocol and routes

Reuse the [Phase 01 protocol](../../01-identity-and-auth/functional-requirements/api-contracts.md): HTTPS, one eligible Bearer access token, server-generated canonical UUID `X-Request-Id`, sanitized RFC 9457 problems and authoritative Identity checks. Every Cart route requires the current Customer role. Admin has no Cart privilege. Owner is the verified subject; no cart/customer ID is accepted in a route, body or query.

Every response has `Cache-Control: no-store`; success uses `application/json`, errors `application/problem+json`. No ETag/Last-Modified or `304` response is emitted. The body `version` is an intent version and current Catalog price changes do not advance it. The client MUST send `expectedVersion` for mutations; `If-Match` cannot substitute for it.

PUT/POST require an uncompressed `application/json` body of at most 16,384 decoded bytes. Missing/empty required body, invalid UTF-8, unknown/duplicate members and any query parameter are `400`; unsupported content format/compression is `415`, size excess `413`. GET takes no body. UUIDs are canonical lowercase `8-4-4-4-12` strings; timestamps are UTC RFC 3339 ending in `Z`. JSON integer input uses decimal integer syntax without fraction/exponent, and version input cannot use negative zero. Fields/enums are case-sensitive. Accept `application/json` or `*/*`; another explicit response media type yields `406`.

| Method/path | Request | Success | Domain errors |
| --- | --- | --- | --- |
| `GET /api/v1/cart` | None | `200 CartView` | Common authority/dependency errors |
| `PUT /api/v1/cart/items/{productId}` | `SetItemRequest` and path UUID | `200 MutationReceipt` | `409 Cart.VersionMismatch`, `Cart.ProductUnavailable`, `Cart.LineLimitExceeded` |
| `POST /api/v1/cart/items/{productId}/remove` | `VersionRequest` and path UUID | `200 MutationReceipt`, including no-op | `409 Cart.VersionMismatch` |
| `POST /api/v1/cart/clear` | `VersionRequest` | `200 MutationReceipt`, including no-op | `409 Cart.VersionMismatch` |

All four may return common errors below. Unsupported methods on known routes return `405` with `Allow` listing explicit supported methods; unknown routes return `404 Route.NotFound`. There are no guest, Admin, increment-quantity, DELETE-body, stock, bulk-replacement or Checkout endpoints here. Required version is part of JSON validation: omission is `400`, a valid stale value is `409`.

## JSON Schema registry

JSON Schema Draft 2020-12 defines structural shapes. Integer lexical rules, unique product IDs, sorted order, exact arithmetic, line-cap serialization and authorization are additional semantic requirements. An implementation must enable format assertions for UUID/date-time rather than treating them only as annotations.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:cart:schemas:v1",
  "$defs":{
    "Uuid":{"type":"string","format":"uuid","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Instant":{"type":"string","format":"date-time","pattern":"Z$"},
    "Version":{"type":"integer","minimum":0,"maximum":9007199254740991},
    "Quantity":{"type":"integer","minimum":1,"maximum":100},
    "UnitPrice":{
      "type":"object","additionalProperties":false,"required":["amountMinor","currency"],
      "properties":{"amountMinor":{"type":"integer","minimum":1,"maximum":99999999},"currency":{"const":"USD"}}
    },
    "LineSubtotal":{
      "type":"object","additionalProperties":false,"required":["amountMinor","currency"],
      "properties":{"amountMinor":{"type":"integer","minimum":1,"maximum":9999999900},"currency":{"const":"USD"}}
    },
    "Subtotal":{
      "type":"object","additionalProperties":false,"required":["amountMinor","currency"],
      "properties":{"amountMinor":{"type":"integer","minimum":0,"maximum":199999998000},"currency":{"const":"USD"}}
    },
    "SetItemRequest":{
      "type":"object","additionalProperties":false,"required":["expectedVersion","quantity"],
      "properties":{"expectedVersion":{"$ref":"#/$defs/Version"},"quantity":{"$ref":"#/$defs/Quantity"}}
    },
    "VersionRequest":{
      "type":"object","additionalProperties":false,"required":["expectedVersion"],
      "properties":{"expectedVersion":{"$ref":"#/$defs/Version"}}
    },
    "PublicCartProduct":{
      "type":"object","additionalProperties":false,"required":["sku","name","unitPrice"],
      "properties":{
        "sku":{"type":"string","minLength":3,"maxLength":32,"pattern":"^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$"},
        "name":{"type":"string","minLength":3,"maxLength":160},"unitPrice":{"$ref":"#/$defs/UnitPrice"}
      }
    },
    "ListedLine":{
      "type":"object","additionalProperties":false,"required":["productId","quantity","status","product","lineSubtotal"],
      "properties":{
        "productId":{"$ref":"#/$defs/Uuid"},"quantity":{"$ref":"#/$defs/Quantity"},"status":{"const":"Listed"},
        "product":{"$ref":"#/$defs/PublicCartProduct"},"lineSubtotal":{"$ref":"#/$defs/LineSubtotal"}
      }
    },
    "UnavailableLine":{
      "type":"object","additionalProperties":false,"required":["productId","quantity","status","product","lineSubtotal"],
      "properties":{
        "productId":{"$ref":"#/$defs/Uuid"},"quantity":{"$ref":"#/$defs/Quantity"},"status":{"const":"Unavailable"},
        "product":{"type":"null"},"lineSubtotal":{"type":"null"}
      }
    },
    "CartView":{
      "type":"object","additionalProperties":false,"required":["version","updatedAt","items","hasUnavailableItems","subtotal"],
      "properties":{
        "version":{"$ref":"#/$defs/Version"},"updatedAt":{"anyOf":[{"$ref":"#/$defs/Instant"},{"type":"null"}]},
        "items":{"type":"array","maxItems":20,"items":{"oneOf":[{"$ref":"#/$defs/ListedLine"},{"$ref":"#/$defs/UnavailableLine"}]}},
        "hasUnavailableItems":{"type":"boolean"},"subtotal":{"anyOf":[{"$ref":"#/$defs/Subtotal"},{"type":"null"}]}
      },
      "allOf":[
        {"if":{"properties":{"version":{"const":0}}},"then":{"properties":{"updatedAt":{"type":"null"},"items":{"maxItems":0}}},"else":{"properties":{"updatedAt":{"$ref":"#/$defs/Instant"}}}},
        {"if":{"properties":{"hasUnavailableItems":{"const":true}}},"then":{"properties":{"subtotal":{"type":"null"},"items":{"contains":{"$ref":"#/$defs/UnavailableLine"}}}},"else":{"properties":{"subtotal":{"$ref":"#/$defs/Subtotal"},"items":{"items":{"$ref":"#/$defs/ListedLine"}}}}},
        {"if":{"properties":{"items":{"maxItems":0}}},"then":{"properties":{"hasUnavailableItems":{"const":false},"subtotal":{"allOf":[{"$ref":"#/$defs/Subtotal"},{"properties":{"amountMinor":{"const":0}}}]}}}}
      ]
    },
    "MutationReceipt":{
      "type":"object","additionalProperties":false,"required":["version","updatedAt","changed"],
      "properties":{"version":{"$ref":"#/$defs/Version"},"updatedAt":{"anyOf":[{"$ref":"#/$defs/Instant"},{"type":"null"}]},"changed":{"type":"boolean"}},
      "allOf":[{"if":{"properties":{"version":{"const":0}}},"then":{"properties":{"updatedAt":{"type":"null"},"changed":{"const":false}}},"else":{"properties":{"updatedAt":{"$ref":"#/$defs/Instant"}}}}]
    },
    "FieldError":{
      "type":"object","additionalProperties":false,"required":["field","code"],
      "properties":{"field":{"enum":["body","productId","expectedVersion","quantity","query"]},"code":{"enum":["Required","InvalidFormat","OutOfRange","UnknownMember","DuplicateMember","InvalidValue"]}}
    },
    "Problem":{
      "type":"object","additionalProperties":false,"required":["type","title","status","detail","instance","code","traceId"],
      "properties":{
        "type":{"type":"string","format":"uri"},"title":{"type":"string","minLength":1,"maxLength":80},
        "status":{"enum":[400,401,403,404,405,406,409,413,415,500,503]},"detail":{"type":"string","minLength":1,"maxLength":200},
        "instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},
        "code":{"enum":["Validation.Failed","Auth.Unauthorized","Auth.Forbidden","Cart.VersionMismatch","Cart.ProductUnavailable","Cart.LineLimitExceeded","Route.NotFound","Method.NotAllowed","Request.NotAcceptable","Request.TooLarge","Request.UnsupportedMediaType","Service.Unavailable","Server.Error"]},
        "traceId":{"$ref":"#/$defs/Uuid"},"errors":{"type":"array","minItems":1,"maxItems":10,"items":{"$ref":"#/$defs/FieldError"}}
      }
    }
  }
}
```

`items` MUST contain distinct product IDs in ascending UUID order. `Listed` means Catalog visibility, with no stock promise. `lineSubtotal.amountMinor = quantity × product.unitPrice.amountMinor`; the maximum is 9,999,999,900. With no unavailable lines, `subtotal` equals the sum, at most 199,999,998,000 cents; otherwise it is null, rather than a partial or zero total. Schema validation alone cannot establish these equations. `updatedAt` is the last effective intent mutation time; GET, a price edit, visibility change and a no-op do not change it. The version-0 virtual cart is always empty with zero subtotal.

## Examples

First set: `PUT /api/v1/cart/items/12345678-1234-4234-8234-123456789abc` with `{"expectedVersion":0,"quantity":2}` returns `200 {"version":1,"updatedAt":"2026-10-01T10:00:00Z","changed":true}` after commit. GET is a separate current-price read:

```json
{
  "version":1,
  "updatedAt":"2026-10-01T10:00:00Z",
  "items":[{
    "productId":"12345678-1234-4234-8234-123456789abc",
    "quantity":2,"status":"Listed",
    "product":{"sku":"BOOK-01","name":"System Design Book","unitPrice":{"amountMinor":2499,"currency":"USD"}},
    "lineSubtotal":{"amountMinor":4998,"currency":"USD"}
  }],
  "hasUnavailableItems":false,
  "subtotal":{"amountMinor":4998,"currency":"USD"}
}
```

After a hide, the same version/time/quantity remains, the line is `Unavailable`, `product` and `lineSubtotal` are null, `hasUnavailableItems` is true and `subtotal` is null. To remove it, POST to its `/remove` route with `{"expectedVersion":1}`. A successful effective removal returns version 2; subsequent GET is empty with zero subtotal and the retained version/time.

## Error catalog and precedence

Follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457): `type=urn:ecommerce:problem:<code>`, `traceId=X-Request-Id`, and `instance` is the matched route template with braces, without actual product ID/query. Unknown-route instance reuses Identity's `/api/v1/unknown`. Only Validation.Failed has `errors`, sorted by field/code, deduplicated, capped at ten, without submitted values. Use the fixed titles/details below.

| Status/code | Title | Detail |
| --- | --- | --- |
| 400 `Validation.Failed` | Invalid request | The request does not match the cart contract. |
| 401 `Auth.Unauthorized` | Authentication required | A valid access credential is required. |
| 403 `Auth.Forbidden` | Access denied | This operation is not permitted. |
| 409 `Cart.VersionMismatch` | Cart changed | Read the current cart and decide whether to submit the edit again. |
| 409 `Cart.ProductUnavailable` | Product unavailable | This product cannot currently be added or updated in the cart. |
| 409 `Cart.LineLimitExceeded` | Cart line limit reached | Remove a product before adding another distinct product. |
| 404 `Route.NotFound` | Route not found | The requested route was not found. |
| 405 `Method.NotAllowed` | Method not allowed | The HTTP method is not supported for this route. |
| 406 `Request.NotAcceptable` | Response format unavailable | Request application/json. |
| 413 `Request.TooLarge` | Request too large | The request exceeds the allowed size. |
| 415 `Request.UnsupportedMediaType` | Unsupported request format | Use an uncompressed application/json request body. |
| 503 `Service.Unavailable` | Service unavailable | The operation could not be completed. Read the current cart before retrying an uncertain edit. |
| 500 `Server.Error` | Unexpected server error | The operation could not be completed. |

Bounded transport checks may reject oversized/unsupported input before application authorization. For a structurally acceptable known route, perform authentication/current-role checks before product lookup; syntax validation then occurs before transactional domain checks. Within a write, locked Identity eligibility precedes parent version; version precedes Catalog sellability; sellability precedes new-line count. Absent and nonvisible products produce the same ProductUnavailable outcome. Remove/clear do not read Catalog. Corrupt required relationships, arithmetic/version exhaustion and recognized database failures use sanitized `503` with an operator diagnostic; unexpected unclassified defects use `500`.

`401` includes `WWW-Authenticate: Bearer`. Recoverable dependency/capacity `503` includes `Retry-After: 1`; it is a delay hint, not permission to replay with a new version. Invalid credential details, current session fields, hidden state and another customer's data never appear in an error.

## Internal contracts and transaction ownership

| Operation | Input and transaction | Output and constraints |
| --- | --- | --- |
| `Cart.ReadOwnedView` | Verified Customer owner; short read-only snapshot transaction | CartView; no writes, commits only its own read transaction |
| `Cart.SetItem`, `RemoveItem`, `Clear` | Verified owner/session, expected version; write transaction after Identity locks | MutationReceipt or typed conflicts; no cross-module writes |
| `Cart.ReadOwnedIntentForCheckout` | Verified Customer owner, expected version, caller-owned write transaction after Identity locks | `Intent { version, lines[{productId, quantity}] }`, or `Empty`, `VersionMismatch`, `Unavailable`; parent FOR UPDATE remains held; no independent commit |
| `Catalog.GetCurrentCartProducts` | At most 20 distinct saved Cart product IDs; same connection/read transaction | Visible product map; omit nonvisible IDs; typed `MissingReference` for absent required product/category and `Unavailable` for dependency failure; an empty input needs no query |

The Catalog batch operation extends the existing current-product lookup within this monolith; Catalog owns its SQL/predicate and returns no nonpublic fields. A missing referenced product is an integrity failure under the relational schema, not normal unavailability. SetItem reuses the Phase 03 transactional Catalog sellability operation, locking product then category and rechecking state, on the caller's connection. Catalog operations neither commit a caller-owned transaction nor accept client prices.

The Checkout input contains 1–20 sorted distinct lines of 1–100 units and no display prices/total. The parent version must be positive for nonempty intent. Phase 06 defines its public contract, locks the Inventory intent before Catalog/stock, establishes price acceptance and determines safe post-purchase cleanup. This phase exposes no direct snapshot or purchase route to public callers.
