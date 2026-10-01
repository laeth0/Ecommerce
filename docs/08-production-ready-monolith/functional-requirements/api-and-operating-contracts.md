# API and Operating Contracts

**Status:** Phase 08 integration contract. No public resource route or success representation is added. Earlier phase contracts remain the source for methods, payloads, ownership, idempotency and version semantics.

## Shared protocol and compatibility

Retain HTTPS `/api/v1`, Bearer JSON authentication, `application/json` success, RFC 9457 `application/problem+json`, `Cache-Control: no-store` and server UUID `X-Request-Id`. A Problem's `traceId` is that UUID. The OpenTelemetry `trace_id` is a distinct 32-hex diagnostic identifier. `instance` is the matched route template, or `/api/v1/unknown` when unmatched; never echo raw paths/query strings.

Catalog retains `If-Match`/ETag; Cart/Orders retain their expected-version rules; Checkout/Payments retain original `Idempotency-Key` receipts and conflict semantics. A timeout/503 after a possible commit is ambiguous: reload/replay the same identity according to the owner contract. No whole-handler automatic retry follows a timeout. An exact committed replay never becomes a new provider intent.

Configured browser origins remain exact and default to none. Preserve allowed `Authorization`, `Content-Type`, `If-Match`, `Idempotency-Key`; expose `X-Request-Id`, `Retry-After`, `Location`, `ETag` where applicable. Allowed OPTIONS preflight is bodyless 204 before Bearer/business routing and has no business effect. It is not counted as a retail operation class. Transport admission still bounds it.

### Commerce problem schemas

Catalog, Inventory, Cart, Orders and Checkout currently use strict error status/code enums. Phase 08 explicitly extends those contracts with the existing host `429 RateLimit.Exceeded`; it cannot be silently emitted against their old schemas. Identity/Payments already accept it. Deploy strict client/schema updates before enabling new commerce limits. Existing success and older error definitions are preserved, including Phase 07's Checkout amount error.

Register this Draft 2020-12 schema with the seven earlier registries; validate the appropriate named definition. No remote schema fetch is needed during requests.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:ecommerce:monolith:schemas:v1",
  "$defs":{
    "RateLimitProblem":{
      "type":"object","additionalProperties":false,
      "required":["type","title","status","detail","instance","code","traceId"],
      "properties":{
        "type":{"const":"urn:ecommerce:problem:RateLimit.Exceeded"},
        "title":{"const":"Request limit reached"},
        "status":{"const":429},
        "detail":{"const":"Retry after the indicated delay."},
        "instance":{"type":"string","pattern":"^/api/v1/","maxLength":256},
        "code":{"const":"RateLimit.Exceeded"},
        "traceId":{"$ref":"urn:ecommerce:identity:schemas:v1#/$defs/Uuid"}
      }
    },
    "CatalogProblem":{"anyOf":[{"$ref":"urn:ecommerce:catalog:schemas:v1#/$defs/Problem"},{"$ref":"#/$defs/RateLimitProblem"}]},
    "InventoryProblem":{"anyOf":[{"$ref":"urn:ecommerce:inventory:schemas:v1#/$defs/Problem"},{"$ref":"#/$defs/RateLimitProblem"}]},
    "CartProblem":{"anyOf":[{"$ref":"urn:ecommerce:cart:schemas:v1#/$defs/Problem"},{"$ref":"#/$defs/RateLimitProblem"}]},
    "OrdersProblem":{"anyOf":[{"$ref":"urn:ecommerce:orders:schemas:v1#/$defs/Problem"},{"$ref":"#/$defs/RateLimitProblem"}]},
    "CheckoutProblem":{"anyOf":[{"$ref":"urn:ecommerce:payments:schemas:v1#/$defs/CheckoutProblem"},{"$ref":"#/$defs/RateLimitProblem"}]},
    "Health":{
      "type":"object","additionalProperties":false,"required":["status"],
      "properties":{"status":{"enum":["ok","unavailable"]}}
    }
  }
}
```

Example body for a quota rejection; `Retry-After: 12` is an example header, not a fixed delay:

```json
{
  "type":"urn:ecommerce:problem:RateLimit.Exceeded",
  "title":"Request limit reached",
  "status":429,
  "detail":"Retry after the indicated delay.",
  "instance":"/api/v1/checkout/attempts",
  "code":"RateLimit.Exceeded",
  "traceId":"11111111-1111-4111-8111-111111111111"
}
```

`instance` must actually match the enabled route template; the example is not a new route. On 429 send integer `Retry-After = max(1, ceil(bucket_end − fresh_database_time))`, at most 60 seconds for the new minute windows. Do not disclose bucket subject, quota state or actor existence. Counter failure/capacity shedding uses existing 503 `Service.Unavailable`, title `Service unavailable`, detail `The operation could not be completed. Follow the documented recovery procedure.` A temporary local capacity rejection includes `Retry-After: 1`; a recovery outage may omit it when no safe retry time is known.

### Shared commerce quotas

Initial limits are explicit learning controls, not demonstrated optimum settings. All are fixed UTC minute windows using the [existing primary counter mechanism](../../01-identity-and-auth/database/schema-and-transactions.md). Each request belongs to exactly one class. Identity routes and Payments financial/refund/webhook routes retain their original classes/limits and are excluded below.

| Class | Global/minute | Effective source/minute | Authenticated actor/minute | Classification |
| --- | ---: | ---: | ---: | --- |
| `catalog.read` | 12000 | 6000 | — | Public list/detail/category reads |
| `catalog.search` | 1800 | 900 | — | Public search execution |
| `catalog.write` | 300 | 60 | 30 | Existing Admin Catalog mutations |
| `inventory.http` | 1200 | 600 | 120 | Existing Admin Inventory HTTP operations |
| `cart.http` | 6000 | 3000 | 120 | All Customer Cart HTTP operations |
| `orders.http` | 3000 | 1800 | 120 | Existing Customer/Admin Order HTTP operations |
| `checkout.preview` | 1200 | 600 | 30 | Creating a stored preview |
| `checkout.submit` | 1200 | 600 | 10 | Submission, including exact replay |
| `checkout.read` | 3000 | 1800 | 120 | Existing attempt/status reads |

Use scope names `mon.<class>.g`, `.s`, `.a` in the existing 40-character scope field. Bucket hashes are HMAC-SHA256 over the canonical class/subject with the existing protected counter key. Actor UUIDs come from validated Bearer identity, not body/path claims. Source normalization and trusted proxy handling are inherited from Identity. This scope expansion adds no counter table or new key owner.

Processing retains the host's transport/shape/admission/authentication/role precedence and protected-target privacy. Cheap validated Bearer parsing supplies a counter subject; it never replaces fresh primary authority. Global → source → actor counter transactions commit independently, stop at the first denial and finish before Identity/domain transaction locks. Earlier committed counter increments are not refunded on later denial; they count attempts. Do not acquire a counter lock from a business transaction. Limits apply to replay/no-op traffic too, but only admitted requests reach its original receipt logic. Workers/management probes do not consume retail counters.

No queued waiting for a quota reset. PostgreSQL counter errors fail closed with 503. Two replicas share allowance; a minute boundary can admit up to two adjacent windows' allowances in a short burst, so executing/pool/body limits are still required. Bound unauthenticated ingress at the edge and executing gate; do not allocate durable actor buckets from arbitrary unsigned token strings. Record quota outcomes without raw IP/identifier labels. A quota policy change requires a reviewed benchmark and cross-replica configuration agreement.

## Management and operator contracts

| Interface | Authority, request and result |
| --- | --- |
| `GET /health/live` | Existing restricted management listener; no business effects. 200 `{"status":"ok"}` if responsive, otherwise 503 `{"status":"unavailable"}` |
| `GET /health/ready` | Same restricted listener. Required config/schema/primary/local-worker checks; 200/503 with the same bounded Health body. Primary probe ≤1 second |
| `GET /metrics` | New management-only Prometheus exposition; no retail JSON contract. Management network/proxy authentication; no cookies or anonymous public access; scrape deadline 5 seconds |
| OTLP receiver | Collector-internal endpoint; authorized application/collector network only, transport identity/TLS outside loopback development; no retail route |
| Grafana/query backends | Private operator access with separate credentials and viewer/admin separation; never retail bearer/admin authorization reuse |
| Release/backup/restore/owner recovery operations | Attributed protected local execution, reviewed artifact/configuration and normalized reason; outputs contain bounded status/evidence references. Existing owner recovery operations retain their own idempotency/audit rules |

`/metrics` serves the process's safe cumulative instruments directly so Collector failure does not remove metric visibility. Collector handles trace/log export; Prometheus scrapes application/Collector/backend metrics and restricted PostgreSQL aggregates. Request SLIs include edge failures/maintenance separately and deduplicate by origin; do not double-count the same request from edge and application counters. Health exposes no schema version, credentials, debt, account or queue details.

Operator plans are protected release/recovery artifacts, not a general public command API. No new endpoint creates a backup, changes paid state, resumes work, reveals raw audit or adjusts quotas. A maintenance response is an outage response, not proof of a cancelled business effect.

## Diagnostic owner interface

Optional `DiagnosticContext` contains server request UUID, generated W3C trace ID/span ID and recorded flag. Owners normalize missing/invalid context to absent before persistence. Context is frozen when the relevant accepted work/refund is first inserted; replay does not replace it. Checkout passes it to Payments with existing scheduling operations; no API request body includes it. Workers start their own action trace and link stored context, then keep original lock/lease/source rules. Public incoming baggage/tracestate never enters owner records.

## Acceptance assertions

The five new Problem unions accept existing owner errors and this exact 429 body; they reject 429 with a different code, extra secret field or non-UUID `traceId`. Strict Checkout still accepts `Payments.AmountUnsupported`. A 503 does not invent success or guaranteed noncommit. All quota scopes fit 40 characters and two replicas cannot exceed one committed bucket. Private management access cannot be reached through the retail proxy. Health status/body pairs are exactly defined above.
