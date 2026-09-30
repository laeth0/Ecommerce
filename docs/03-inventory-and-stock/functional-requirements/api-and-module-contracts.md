# Inventory API and Internal Contracts

**Status:** proposed v1 contracts. The only external Inventory routes are restricted Admin stock inspection and adjustment. Checkout reservation methods are in-process module operations, not HTTP routes in Phase 03. All quantities are whole units; there are no prices or currency fields here.

## Protocol and endpoint matrix

The [Phase 01 protocol](../../01-identity-and-auth/functional-requirements/api-contracts.md) supplies HTTPS, server-generated `X-Request-Id`, Bearer validation, Admin network restriction, JSON/problem media types and sanitized errors. Catalog's 16,384-byte JSON body limit is reused. Every response has `Cache-Control: no-store`. POST requires `Content-Type: application/json`; an unsupported or compressed body gets `415`. Accept `application/json` or `*/*`; another explicit response media type gets `406`. Unknown/duplicate JSON fields and query keys are `400`; GET takes no body or query parameters. IDs are canonical lowercase UUID strings, timestamps UTC RFC 3339 ending in `Z`, and numeric JSON integers must use decimal integer syntax without fraction or exponent.

| Method/path | Authority | Request | Success | Domain errors |
| --- | --- | --- | --- | --- |
| `GET /api/v1/admin/inventory/items/{productId}` | Eligible Admin and allowed network | Canonical product UUID | `200 StockItem` | `404 Inventory.ItemNotFound` |
| `POST /api/v1/admin/inventory/adjustments` | Eligible Admin and allowed network | `AdjustStock` | `200 AdjustmentReceipt`, including same-operation replay | `404 Inventory.ItemNotFound`; `409 Inventory.InsufficientUnreservedStock`; `409 Inventory.CapacityExceeded`; `409 Inventory.OperationConflict` |

An existing Catalog product without its required stock row is an invariant failure and returns `503`, not a false zero or `404`. Authorization precedes target lookup. Unsupported methods use `405` with `Allow`; unknown routes use `404 Route.NotFound`. There is no public stock API, Admin reservation API, absolute-set-stock endpoint, or refund-restock endpoint.

## JSON Schema registry

JSON Schema Draft 2020-12 describes wire structure. Semantic NFC/trim/control rules for `reason`, integer lexical form, Admin authority, stock checks and idempotency are additional requirements.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:inventory:schemas:v1",
  "$defs":{
    "Uuid":{"type":"string","format":"uuid","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Instant":{"type":"string","format":"date-time","pattern":"Z$"},
    "AdjustStock":{
      "type":"object","additionalProperties":false,"required":["operationId","productId","delta","reason"],
      "properties":{
        "operationId":{"$ref":"#/$defs/Uuid"},"productId":{"$ref":"#/$defs/Uuid"},
        "delta":{"type":"integer","anyOf":[{"minimum":-1000000,"maximum":-1},{"minimum":1,"maximum":1000000}]},
        "reason":{"type":"string","minLength":1,"maxLength":256}
      }
    },
    "StockItem":{
      "type":"object","additionalProperties":false,"required":["productId","onHand","reserved","available","version","updatedAt"],
      "properties":{
        "productId":{"$ref":"#/$defs/Uuid"},"onHand":{"type":"integer","minimum":0,"maximum":1000000000},
        "reserved":{"type":"integer","minimum":0,"maximum":1000000000},
        "available":{"type":"integer","minimum":0,"maximum":1000000000},
        "version":{"type":"integer","minimum":1},"updatedAt":{"$ref":"#/$defs/Instant"}
      }
    },
    "AdjustmentReceipt":{
      "type":"object","additionalProperties":false,"required":["operationId","productId","delta","reason","onHandAfter","reservedAfter","availableAfter","versionAfter","occurredAt"],
      "properties":{
        "operationId":{"$ref":"#/$defs/Uuid"},"productId":{"$ref":"#/$defs/Uuid"},
        "delta":{"type":"integer"},"reason":{"type":"string"},
        "onHandAfter":{"type":"integer","minimum":0,"maximum":1000000000},
        "reservedAfter":{"type":"integer","minimum":0,"maximum":1000000000},
        "availableAfter":{"type":"integer","minimum":0,"maximum":1000000000},
        "versionAfter":{"type":"integer","minimum":2},"occurredAt":{"$ref":"#/$defs/Instant"}
      }
    },
    "FieldError":{
      "type":"object","additionalProperties":false,"required":["field","code"],
      "properties":{
        "field":{"enum":["body","productId","operationId","delta","reason","query"]},
        "code":{"enum":["Required","InvalidFormat","OutOfRange","UnknownMember","DuplicateMember","InvalidValue"]}
      }
    },
    "Problem":{
      "type":"object","additionalProperties":false,"required":["type","title","status","detail","instance","code","traceId"],
      "properties":{
        "type":{"type":"string","format":"uri"},"title":{"type":"string","minLength":1,"maxLength":80},
        "status":{"enum":[400,401,403,404,405,406,409,413,415,500,503]},
        "detail":{"type":"string","minLength":1,"maxLength":200},
        "instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},
        "code":{"enum":["Validation.Failed","Auth.Unauthorized","Auth.Forbidden","Inventory.ItemNotFound","Inventory.InsufficientUnreservedStock","Inventory.CapacityExceeded","Inventory.OperationConflict","Route.NotFound","Method.NotAllowed","Request.NotAcceptable","Request.TooLarge","Request.UnsupportedMediaType","Service.Unavailable","Server.Error"]},
        "traceId":{"$ref":"#/$defs/Uuid"},
        "errors":{"type":"array","minItems":1,"maxItems":10,"items":{"$ref":"#/$defs/FieldError"}}
      }
    }
  }
}
```

`reason` is NFC-normalized and Unicode-trimmed before checking 1–256 Unicode scalars and at most 1,024 UTF-8 bytes. Reject control characters and line breaks; do not log the raw input. Store the normalized reason in the movement. `delta` is a nonzero signed integer between −1,000,000 and 1,000,000 inclusive; `onHand + delta` must remain in the stock range and not fall below reserved. A receipt is the immutable result at the original commit, so a replay may report older counters than a fresh `GET StockItem`. The operation UUID is global to Inventory adjustments; same ID with changed actor, product, delta or normalized reason is `409`.

## Error catalog and precedence

Problems follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). `type` is `urn:ecommerce:problem:` plus exact code, `instance` is the matched route template without values, and `traceId` equals `X-Request-Id`. Only `Validation.Failed` includes at most ten field errors sorted by field/code without submitted values. Authentication/authorization and request structure are checked before target lookup. A committed adjustment replay is looked up before evaluating current stock, so it can return its original receipt after later stock changes.

| Status/code | Title | Detail |
| --- | --- | --- |
| 400 `Validation.Failed` | Invalid request | The request does not match the inventory contract. |
| 401 `Auth.Unauthorized` | Authentication required | A valid access credential is required. |
| 403 `Auth.Forbidden` | Access denied | This operation is not permitted. |
| 404 `Inventory.ItemNotFound` | Stock item not found | The requested stock item was not found. |
| 409 `Inventory.InsufficientUnreservedStock` | Stock adjustment conflicts | The adjustment would reduce stock below reserved units. |
| 409 `Inventory.CapacityExceeded` | Stock capacity exceeded | The adjustment would exceed the allowed stock capacity. |
| 409 `Inventory.OperationConflict` | Operation identity conflict | This operation ID was used for a different adjustment. |
| 405 `Method.NotAllowed` | Method not allowed | The HTTP method is not supported for this route. |
| 406 `Request.NotAcceptable` | Response format unavailable | Request application/json. |
| 413 `Request.TooLarge` | Request too large | The request exceeds the allowed size. |
| 415 `Request.UnsupportedMediaType` | Unsupported request format | Use an uncompressed application/json request body. |
| 503 `Service.Unavailable` | Service unavailable | The operation could not be completed. Follow the documented recovery procedure. |
| 500 `Server.Error` | Unexpected server error | The operation could not be completed. |

`401` includes `WWW-Authenticate: Bearer`. A recoverable dependency `503` includes `Retry-After: 1`, but the client must reuse its operation UUID after an uncertain write. A wrong product UUID can be reported as `404` only after Admin authority passes; an existing product with a missing Inventory row is `503`. An out-of-range result caused by a valid delta uses `409 Inventory.InsufficientUnreservedStock` if it falls below reserved, or `409 Inventory.CapacityExceeded` if it exceeds 1,000,000,000.

## Internal Inventory module contract

The module exposes operations on a caller-owned PostgreSQL transaction; it does not commit when the caller owns that transaction. A standalone internal invocation begins and commits its own transaction. The caller must never hold these locks while calling a payment provider.

| Operation | Required input | Outcome |
| --- | --- | --- |
| `EnsureItem` | Catalog product UUID in the same transaction as creation | Existing or created zero stock item; never resets balances |
| `Reserve` | Globally unique trusted Checkout intent UUID; 1–20 distinct product/quantity lines | Reservation UUID, state, 15-minute `expiresAt`, stored lines; or typed `IntentConflict`, `ProductNotFound`, `ProductNotSellable`, `InsufficientStock`, `Unavailable` |
| `GetReservation` | Reservation UUID and expected intent UUID | Current stored state, lines/deadline; or `NotFound`/`IntentConflict` |
| `Consume` | Reservation UUID and expected intent UUID | `Consumed` (including exact replay) or incompatible `Expired`, `Released`, `NotFound`, `IntentConflict` |
| `Release` | Reservation UUID, expected intent UUID, controlled reason code | `Released` (including exact replay) or incompatible `Expired`, `Consumed`, `NotFound`, `IntentConflict` |
| `ExpireDue` | Worker-controlled bounded selection | Number of groups terminally Expired; errors remain retryable and visible |

The canonical reservation fingerprint is specified in [STK-FR-04](inventory-workflows.md#stk-fr-04--reserve-a-bounded-product-set). The server sets the deadline; callers cannot request extension. At exact `clock_timestamp() >= expires_at`, Consume fails and the group is made Expired in the same transaction. A replay of Reserve for an overdue Active group also materializes expiry before returning the current outcome. A terminal outcome is never converted to another terminal outcome. `GetReservation` may return an overdue stored Active state with `expiresAt` in the past; it is a read, not permission to consume. Only the locked transition determines eligibility.

The future Checkout boundary is responsible for customer ownership, order policy, and mapping these typed outcomes to its public API. There is no direct external route for an arbitrary client to present an intent or reservation UUID.
