# Catalog API Contracts

**Status:** proposed first-party REST contract. Base path `/api/v1`; USD cents are the only accepted monetary representation. [Business workflows](catalog-workflows.md) own the state guards.

## Protocol

- HTTPS and the Phase 01 request-ID, JWT validation, Admin network restriction and current-session database check apply. Public GET routes need no access token. Admin routes require `Authorization: Bearer <access JWT>` from an allowed Admin source.
- JSON requests use `Content-Type: application/json`, have no duplicate/unknown members, and are at most 16,384 decoded bytes. An empty body is invalid where a JSON body is required. Transition POST routes have no request body or Content-Type.
- JSON success responses use `application/json`; errors use `application/problem+json` following [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). Every response has `X-Request-Id` and `Cache-Control: no-store`. No cookies or credential material are issued here.
- Request JSON fields, enum values and USD code are case-sensitive. IDs are canonical lowercase UUID strings. Timestamps are UTC RFC 3339 ending in `Z`.
- Accept `application/json` or `*/*`; another explicit media type yields `406 Request.NotAcceptable`. Unknown query parameters and unexpected bodies yield `400 Validation.Failed`. Compressed request bodies are rejected with `415 Request.UnsupportedMediaType`.
- A successful Admin create has `Location` set to its Admin detail URL. Admin create, detail and mutation responses include a strong `ETag: "vN"` header matching their body `version`. Public responses carry no ETag in this phase.
- Every Admin PATCH or transition POST requires one exact `If-Match: "vN"` header, where `N` is a canonical positive decimal integer without leading zeroes fitting signed `bigint`; weak tags, lists and `*` are invalid (`400`). Missing header is `428 Catalog.PreconditionRequired`. An outdated version is `412 Catalog.VersionMismatch`. Authorization and existence checks precede the version check; an authorized Admin sees `404` for an absent record. If the target exists, a stale ETag wins over lifecycle checks.

## Endpoint matrix

| Method/path | Authorization | Request | Success | Domain failures |
| --- | --- | --- | --- | --- |
| `GET /api/v1/catalog/categories` | Public | `limit`, `cursor` | `200 CategoryPage` | `400` invalid cursor/filter |
| `GET /api/v1/catalog/products` | Public | `category`, `q`, `limit`, `cursor` | `200 ProductPage` | `400` invalid cursor/filter |
| `GET /api/v1/catalog/products/{id}` | Public | UUID path | `200 PublicProduct` | `404 Catalog.ProductNotFound` |
| `POST /api/v1/admin/catalog/categories` | Admin | `CreateCategory` | `201 AdminCategory` | `409 Catalog.SlugInUse` |
| `GET /api/v1/admin/catalog/categories/{id}` | Admin | UUID path | `200 AdminCategory` | `404 Catalog.CategoryNotFound` |
| `PATCH /api/v1/admin/catalog/categories/{id}` | Admin; If-Match | `PatchCategory` | `200 AdminCategory` | `404`, `412`, `428` |
| `POST /api/v1/admin/catalog/categories/{id}/activate` | Admin; If-Match | No body | `200 AdminCategory` | `404`, `409`, `412`, `428` |
| `POST /api/v1/admin/catalog/categories/{id}/deactivate` | Admin; If-Match | No body | `200 AdminCategory` | `404`, `409`, `412`, `428` |
| `POST /api/v1/admin/catalog/products` | Admin | `CreateProduct` | `201 AdminProduct` | `404 Catalog.CategoryNotFound`; `409 Catalog.SkuInUse` |
| `GET /api/v1/admin/catalog/products/{id}` | Admin | UUID path | `200 AdminProduct` | `404 Catalog.ProductNotFound` |
| `PATCH /api/v1/admin/catalog/products/{id}` | Admin; If-Match | `PatchProduct` | `200 AdminProduct` | `404`, `409`, `412`, `428` |
| `POST /api/v1/admin/catalog/products/{id}/publish` | Admin; If-Match | No body | `200 AdminProduct` | `404`, `409`, `412`, `428` |
| `POST /api/v1/admin/catalog/products/{id}/hide` | Admin; If-Match | No body | `200 AdminProduct` | `404`, `409`, `412`, `428` |
| `POST /api/v1/admin/catalog/products/{id}/archive` | Admin; If-Match | No body | `200 AdminProduct` | `404`, `409`, `412`, `428` |

All routes can produce the common validation, identity denial, body/media size, dependency and server errors in the error catalog. No delete, inventory, image, bulk-edit or price-lock endpoint is part of this contract.

## Filters and cursor

`limit` defaults to 20 and permits canonical decimal integers 1–50. `category` is the exact lowercase category slug. `q` is NFC-normalized and Unicode-trimmed on input, then checked against 2–80 Unicode scalar values and 320 UTF-8 bytes; Unicode control characters and line breaks are invalid. A syntactically valid but unknown/inactive category yields an empty product page. A term set that PostgreSQL reduces to an empty `tsquery` yields an empty page. Other query keys, duplicate query keys, empty supplied values, and invalid encodings are `400`.

Pages use the stable `(name COLLATE "C" ASC, id ASC)` order. The next cursor is supplied only when another matching row exists. Build pages by reading at most `limit + 1` qualifying rows in one statement. Public category and product cursors are distinct. A cursor token is an unpadded Base64url payload, a `.`, then unpadded Base64url HMAC-SHA256 over those exact payload bytes. Both a 32-byte shared signing secret and constant-time MAC comparison are required. Maximum cursor length is 2,048 characters, which accommodates the permitted UTF-8 name and query bounds.

The UTF-8 payload is compact JSON with fields in this exact order: `v` (integer 1), `kind` (`categories` or `products`), `limit` (integer), `category` (slug or null), `q` (normalized query or null), `lastName` (name string), `lastId` (UUID), `expiresAt` (integer Unix seconds). Use no insignificant whitespace; write Unicode directly as UTF-8, escaping only JSON-required quote/backslash/control characters; write integers as canonical decimal without leading zeroes. Categories require null `category` and `q`; products use the normalized filter values. `expiresAt` is server issuance time plus 900 seconds. The server validates exact fields/order and encoding, MAC, time, endpoint kind, limits and equality to current filters. It does not trust decoded cursor fields before verifying the MAC. Any invalid/expired/mismatched cursor yields `400 Validation.Failed` with `field=cursor`.

Cursor pagination is a sequence of independent statement snapshots. A row whose name/filter/status changes between pages can be missed or seen again; no snapshot guarantee crosses requests. The cursor conveys no authorization and no stock/price guarantee. The secret must match across replicas; rotation needs an explicit overlap or invalidates outstanding cursors with `400`.

## JSON Schema registry

JSON Schema Draft 2020-12 validates structural shape. Semantic normalization, Unicode/control-character rules, cursor integrity and lifecycle rules in the workflow document also apply. Each definition below is addressable as `#/$defs/<name>`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:catalog:schemas:v1",
  "$defs": {
    "Uuid": {"type":"string","format":"uuid","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
    "Instant": {"type":"string","format":"date-time","pattern":"Z$"},
    "CategorySlug": {"type":"string","minLength":3,"maxLength":48,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
    "Sku": {"type":"string","minLength":3,"maxLength":32,"pattern":"^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$"},
    "Price": {
      "type":"object","additionalProperties":false,"required":["amountMinor","currency"],
      "properties":{"amountMinor":{"type":"integer","minimum":1,"maximum":99999999},"currency":{"const":"USD"}}
    },
    "CreateCategory": {
      "type":"object","additionalProperties":false,"required":["slug","name"],
      "properties":{"slug":{"$ref":"#/$defs/CategorySlug"},"name":{"type":"string","minLength":2,"maxLength":80}}
    },
    "PatchCategory": {
      "type":"object","additionalProperties":false,"required":["name"],
      "properties":{"name":{"type":"string","minLength":2,"maxLength":80}}
    },
    "CreateProduct": {
      "type":"object","additionalProperties":false,"required":["sku","categoryId","name","description","price"],
      "properties":{"sku":{"$ref":"#/$defs/Sku"},"categoryId":{"$ref":"#/$defs/Uuid"},"name":{"type":"string","minLength":3,"maxLength":160},"description":{"type":"string","maxLength":2000},"price":{"$ref":"#/$defs/Price"}}
    },
    "PatchProduct": {
      "type":"object","additionalProperties":false,"minProperties":1,
      "properties":{"categoryId":{"$ref":"#/$defs/Uuid"},"name":{"type":"string","minLength":3,"maxLength":160},"description":{"type":"string","maxLength":2000},"price":{"$ref":"#/$defs/Price"}}
    },
    "PublicCategory": {
      "type":"object","additionalProperties":false,"required":["id","slug","name"],
      "properties":{"id":{"$ref":"#/$defs/Uuid"},"slug":{"$ref":"#/$defs/CategorySlug"},"name":{"type":"string","minLength":2,"maxLength":80}}
    },
    "AdminCategory": {
      "type":"object","additionalProperties":false,"required":["id","slug","name","status","version","createdAt","updatedAt"],
      "properties":{"id":{"$ref":"#/$defs/Uuid"},"slug":{"$ref":"#/$defs/CategorySlug"},"name":{"type":"string","minLength":2,"maxLength":80},"status":{"enum":["Active","Inactive"]},"version":{"type":"integer","minimum":1},"createdAt":{"$ref":"#/$defs/Instant"},"updatedAt":{"$ref":"#/$defs/Instant"}}
    },
    "PublicProduct": {
      "type":"object","additionalProperties":false,"required":["id","sku","name","description","category","price","version","updatedAt"],
      "properties":{"id":{"$ref":"#/$defs/Uuid"},"sku":{"$ref":"#/$defs/Sku"},"name":{"type":"string","minLength":3,"maxLength":160},"description":{"type":"string","maxLength":2000},"category":{"$ref":"#/$defs/PublicCategory"},"price":{"$ref":"#/$defs/Price"},"version":{"type":"integer","minimum":1},"updatedAt":{"$ref":"#/$defs/Instant"}}
    },
    "AdminProduct": {
      "type":"object","additionalProperties":false,"required":["id","sku","categoryId","name","description","price","status","version","createdAt","updatedAt"],
      "properties":{"id":{"$ref":"#/$defs/Uuid"},"sku":{"$ref":"#/$defs/Sku"},"categoryId":{"$ref":"#/$defs/Uuid"},"name":{"type":"string","minLength":3,"maxLength":160},"description":{"type":"string","maxLength":2000},"price":{"$ref":"#/$defs/Price"},"status":{"enum":["Draft","Published","Hidden","Archived"]},"version":{"type":"integer","minimum":1},"createdAt":{"$ref":"#/$defs/Instant"},"updatedAt":{"$ref":"#/$defs/Instant"}}
    },
    "CategoryPage": {
      "type":"object","additionalProperties":false,"required":["items","nextCursor"],
      "properties":{"items":{"type":"array","maxItems":50,"items":{"$ref":"#/$defs/PublicCategory"}},"nextCursor":{"type":["string","null"],"maxLength":2048}}
    },
    "ProductPage": {
      "type":"object","additionalProperties":false,"required":["items","nextCursor"],
      "properties":{"items":{"type":"array","maxItems":50,"items":{"$ref":"#/$defs/PublicProduct"}},"nextCursor":{"type":["string","null"],"maxLength":2048}}
    },
    "FieldError": {
      "type":"object","additionalProperties":false,"required":["field","code"],
      "properties":{"field":{"enum":["body","id","sku","slug","categoryId","category","name","description","price","q","limit","cursor","query","If-Match"]},"code":{"enum":["Required","InvalidFormat","OutOfRange","UnknownMember","DuplicateMember","InvalidValue"]}}
    },
    "Problem": {
      "type":"object","additionalProperties":false,"required":["type","title","status","detail","instance","code","traceId"],
      "properties":{
        "type":{"type":"string","format":"uri"},"title":{"type":"string","minLength":1,"maxLength":80},"status":{"enum":[400,401,403,404,405,406,409,412,413,415,428,500,503]},
        "detail":{"type":"string","minLength":1,"maxLength":200},"instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},"code":{"enum":["Validation.Failed","Auth.Unauthorized","Auth.Forbidden","Catalog.CategoryNotFound","Catalog.ProductNotFound","Catalog.SlugInUse","Catalog.SkuInUse","Catalog.CategoryInactive","Catalog.InvalidTransition","Catalog.VersionMismatch","Catalog.PreconditionRequired","Route.NotFound","Method.NotAllowed","Request.NotAcceptable","Request.TooLarge","Request.UnsupportedMediaType","Service.Unavailable","Server.Error"]},"traceId":{"$ref":"#/$defs/Uuid"},
        "errors":{"type":"array","minItems":1,"maxItems":10,"items":{"$ref":"#/$defs/FieldError"}}
      }
    }
  }
}
```

JSON integer means no fractional or exponent notation on the wire for `amountMinor` or `limit`. Category/page response examples are derivable from these schemas; `amountMinor:1999` means USD 19.99. The server never accepts `$19.99`, `19.99`, or a caller-supplied exchange rate as price input.

## Error catalog and precedence

`Problem.type` is `urn:ecommerce:problem:` plus the exact code. `instance` is the matched route template without query values; for an unmatched route use `/api/v1/unknown`. `traceId` equals the server's `X-Request-Id`. Only `Validation.Failed` includes `errors`, sorted by field then code and without submitted values. Authentication errors reuse Phase 01 wording and `WWW-Authenticate: Bearer` for `401`.

| Status and code | Title | Detail |
| --- | --- | --- |
| 400 `Validation.Failed` | Invalid request | The request does not match the catalog contract. |
| 401 `Auth.Unauthorized` | Authentication required | A valid access credential is required. |
| 403 `Auth.Forbidden` | Access denied | This operation is not permitted. |
| 404 `Catalog.CategoryNotFound` | Category not found | The requested category was not found. |
| 404 `Catalog.ProductNotFound` | Product not found | The requested product was not found. |
| 409 `Catalog.SlugInUse` | Category slug unavailable | The category slug is already in use. |
| 409 `Catalog.SkuInUse` | Product SKU unavailable | The product SKU is already in use. |
| 409 `Catalog.CategoryInactive` | Category inactive | Publish the product only after activating its category. |
| 409 `Catalog.InvalidTransition` | Invalid catalog transition | The requested state change is not permitted. |
| 412 `Catalog.VersionMismatch` | Catalog version changed | Read the current record and submit its version. |
| 428 `Catalog.PreconditionRequired` | Catalog version required | Supply the current strong ETag in If-Match. |
| 405 `Method.NotAllowed` | Method not allowed | The HTTP method is not supported for this route. |
| 406 `Request.NotAcceptable` | Response format unavailable | Request application/json. |
| 413 `Request.TooLarge` | Request too large | The request exceeds the allowed size. |
| 415 `Request.UnsupportedMediaType` | Unsupported request format | Use an uncompressed application/json request body. |
| 503 `Service.Unavailable` | Service unavailable | The operation could not be completed. Follow the documented recovery procedure. |
| 500 `Server.Error` | Unexpected server error | The operation could not be completed. |

Unknown routes use the Phase 01 `404 Route.NotFound` error. `405` adds the `Allow` header. A database/required-audit outage is `503`; unexpected failures are sanitized `500`. Body/transport validation occurs before domain lookup. For Admin routes: authenticate and authorize before target lookup, then evaluate target existence, `If-Match`, lifecycle guard, and mutation. For public product detail, the same 404 is returned for absent and nonpublic records. `Retry-After: 1` accompanies `503` when the dependency is expected to recover; it does not imply automatic retry of an uncertain write.
