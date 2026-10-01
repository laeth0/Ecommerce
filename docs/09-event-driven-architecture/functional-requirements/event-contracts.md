# Event Contracts

**Status:** strict integration contracts for the approved local sandbox scope. These events are private messages, not public API bodies or provider webhooks.

## Registry and routing

| Event | Producer source | Exchange / exact routing key | Event identity and subject |
| --- | --- | --- | --- |
| com.ecommerce.orders.lifecycle-changed.v1 | urn:ecommerce:orders | commerce.orders.v1 / orders.lifecycle-changed.v1 | transition-audit UUID; orders/{orderId} |
| com.ecommerce.payments.refund-fact.v1 | urn:ecommerce:payments | commerce.payments.v1 / payments.refund-fact.v1 | financial-fact UUID; refunds/{refundId} |

Use the [CloudEvents 1.0.2 specification](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md), specversion 1.0 and [structured JSON encoding](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md). Source plus ID is the stable event identity. Local delivery, ordering and deduplication guarantees are defined by this project, not the envelope standard.

AMQP 0-9-1 message properties: content_type=application/cloudevents+json, delivery_mode=2, message_id=envelope.id and type=envelope.type. Use mandatory publication. No compression, arbitrary application headers, alternate exchange or per-message expiry. Broker-generated dead-letter/redelivery headers are bounded diagnostic metadata, not authority. Source/type/schema/route must match the table exactly.

## Structural schemas

JSON Schema Draft 2020-12; resolve only pinned local registries, including the existing Identity UUID definition. Unknown members and duplicate keys are rejected; consumers do not fetch dataschema URIs. The Event union is the intake schema. Semantic/byte/cross-field rules below are REQUIRED beyond schema validation.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:events:v1",
  "$defs": {
    "OrderData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "orderId",
        "customerId",
        "orderVersion",
        "status"
      ],
      "properties": {
        "orderId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "customerId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "orderVersion": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9007199254740991
        },
        "status": {
          "enum": [
            "PendingPayment",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Failed"
          ]
        }
      }
    },
    "RefundData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "orderId",
        "customerId",
        "paymentId",
        "refundId",
        "factId",
        "financialVersion",
        "kind",
        "origin",
        "amountMinor",
        "currency",
        "reversesFactId"
      ],
      "properties": {
        "orderId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "customerId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "paymentId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "refundId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "factId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "financialVersion": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9007199254740991
        },
        "kind": {
          "enum": [
            "RefundSucceeded",
            "RefundReversed"
          ]
        },
        "origin": {
          "enum": [
            "Admin",
            "Compensation",
            "Imported"
          ]
        },
        "amountMinor": {
          "type": "integer",
          "minimum": 1,
          "maximum": 99999999
        },
        "currency": {
          "const": "USD"
        },
        "reversesFactId": {
          "anyOf": [
            {
              "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "kind": {
                "const": "RefundSucceeded"
              }
            }
          },
          "then": {
            "properties": {
              "reversesFactId": {
                "type": "null"
              }
            }
          },
          "else": {
            "properties": {
              "reversesFactId": {
                "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
              }
            }
          }
        }
      ]
    },
    "OrderEvent": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "specversion",
        "id",
        "source",
        "type",
        "time",
        "subject",
        "datacontenttype",
        "dataschema",
        "data"
      ],
      "properties": {
        "specversion": {
          "const": "1.0"
        },
        "id": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "source": {
          "const": "urn:ecommerce:orders"
        },
        "type": {
          "const": "com.ecommerce.orders.lifecycle-changed.v1"
        },
        "time": {
          "type": "string",
          "format": "date-time",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{6}Z$"
        },
        "subject": {
          "type": "string",
          "pattern": "^orders/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        },
        "datacontenttype": {
          "const": "application/json"
        },
        "dataschema": {
          "const": "urn:ecommerce:events:v1#/$defs/OrderData"
        },
        "data": {
          "$ref": "#/$defs/OrderData"
        },
        "correlationid": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "causationid": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "traceparent": {
          "type": "string",
          "pattern": "^00-[0-9a-f]{32}-[0-9a-f]{16}-(00|01)$"
        }
      }
    },
    "RefundEvent": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "specversion",
        "id",
        "source",
        "type",
        "time",
        "subject",
        "datacontenttype",
        "dataschema",
        "data"
      ],
      "properties": {
        "specversion": {
          "const": "1.0"
        },
        "id": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "source": {
          "const": "urn:ecommerce:payments"
        },
        "type": {
          "const": "com.ecommerce.payments.refund-fact.v1"
        },
        "time": {
          "type": "string",
          "format": "date-time",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{6}Z$"
        },
        "subject": {
          "type": "string",
          "pattern": "^refunds/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        },
        "datacontenttype": {
          "const": "application/json"
        },
        "dataschema": {
          "const": "urn:ecommerce:events:v1#/$defs/RefundData"
        },
        "data": {
          "$ref": "#/$defs/RefundData"
        },
        "correlationid": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "causationid": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "traceparent": {
          "type": "string",
          "pattern": "^00-[0-9a-f]{32}-[0-9a-f]{16}-(00|01)$"
        }
      }
    },
    "Event": {
      "oneOf": [
        {
          "$ref": "#/$defs/OrderEvent"
        },
        {
          "$ref": "#/$defs/RefundEvent"
        }
      ]
    }
  }
}
```

## Canonical bytes and semantic validation

- Producer builds the envelope once: UTF-8, compact JSON, lexicographically sorted member names at every object level, direct Unicode, JSON-required escapes, canonical decimal integers and no whitespace/BOM. Persist those exact bytes and SHA-256. Relays/replay publish them unchanged. Consumers compare bytes as well as digest for an existing identity.
- Body maximum 8,192 bytes, depth maximum 8, strict UTF-8 and no duplicate structural keys. Enforce the byte limit before copying/parsing and require the canonical encoding above. UUIDs are lowercase canonical. Timestamps have six fractional digits and Z. Format assertions must actually be enabled.
- Transport properties/headers have a combined 4,096-byte budget, ≤16 header names, ≤64 UTF-8 bytes per name and nesting depth≤4. Count string/binary value bytes and encoded primitive sizes before further traversal. Accept only declared message properties and bounded broker redelivery/death annotations; reject unexpected application headers. Broker annotations remain diagnostic input.
- Event time is primary-clock audit time for Orders and primary-clock observation time for financial facts. It is not claimed to be the provider's original occurrence time. Reject time >30 seconds ahead of primary intake time; accept historical time without an age cutoff. Clock faults create quarantine, not a rewritten timestamp.
- Order subject must equal orders/ plus data.orderId. Refund subject must equal refunds/ plus data.refundId; refund factId equals envelope.id. RefundSucceeded has null reversesFactId. RefundReversed has a distinct nonnull admitted prior success fact ID for the same payment/refund and exact amount. Producer validates that relationship; consumer validates structural linkage and records history without querying money.
- Order version is the exact new owner version. Financial version is the exact parent version of the observation transaction; multiple facts can share it. Neither version is a deduplication key or a required contiguous sequence.
- Required customer/order references come from owner data; clients and raw webhook metadata cannot set recipients. Refund amounts use exact positive USD cents, ≤99,999,999. No float, exchange rate, address, email, product list, reason, provider ID/key or raw provider payload is included.
- Optional correlationid is the retained server-generated request UUID when available. Optional causationid is an existing trusted command/work/fact UUID, including the prior fact for a reversal. Omit unavailable attributes rather than use null. They do not grant authority.
- Optional traceparent uses the immutable first trusted server span (version 00). Trace/span IDs must be nonzero; flags are 00 or 01. It is separate from correlationid. No baggage/tracestate or unvalidated public context is persisted; replays preserve the original attribute.
- All local receipts use sandbox labeling. Order events can arise from the isolated existing simulator; they describe business transitions, not proof of a real payment. Only actual newly admitted Payments facts emit refund events.

## Examples

The following identifiers are synthetic specification examples. Each body validates against its named schema; producers additionally apply canonical byte serialization.

### OrderEvent

```json
{
  "specversion": "1.0",
  "id": "88888888-8888-4888-8888-888888888888",
  "source": "urn:ecommerce:orders",
  "type": "com.ecommerce.orders.lifecycle-changed.v1",
  "time": "2026-10-01T10:00:02.000000Z",
  "subject": "orders/55555555-5555-4555-8555-555555555555",
  "datacontenttype": "application/json",
  "dataschema": "urn:ecommerce:events:v1#/$defs/OrderData",
  "data": {
    "orderId": "55555555-5555-4555-8555-555555555555",
    "customerId": "11111111-1111-4111-8111-111111111111",
    "orderVersion": 2,
    "status": "Confirmed"
  }
}
```

### RefundEvent

```json
{
  "specversion": "1.0",
  "id": "99999999-9999-4999-8999-999999999999",
  "source": "urn:ecommerce:payments",
  "type": "com.ecommerce.payments.refund-fact.v1",
  "time": "2026-10-01T10:01:00.000000Z",
  "subject": "refunds/77777777-7777-4777-8777-777777777777",
  "datacontenttype": "application/json",
  "dataschema": "urn:ecommerce:events:v1#/$defs/RefundData",
  "data": {
    "orderId": "55555555-5555-4555-8555-555555555555",
    "customerId": "11111111-1111-4111-8111-111111111111",
    "paymentId": "66666666-6666-4666-8666-666666666666",
    "refundId": "77777777-7777-4777-8777-777777777777",
    "factId": "99999999-9999-4999-8999-999999999999",
    "financialVersion": 6,
    "kind": "RefundReversed",
    "origin": "Admin",
    "amountMinor": 1000,
    "currency": "USD",
    "reversesFactId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
  }
}
```

## Versioning and ordering contract

Version 1 is closed: adding a member or enum is a schema change. Introduce a new event type/dataschema and reviewed explicit binding/consumer support before enabling a v2 producer. Existing frozen v1 rows keep their schema forever. Do not publish both versions for one business fact to this sink without an explicit logical-effect migration/deduplication plan.

Unknown schema/type is quarantined, not guessed. Schema evolution requires producer/consumer compatibility evidence, old retained-envelope replay and a maintenance rollout/rollback plan. CloudEvents specversion remains 1.0 unless the envelope standard itself changes.

No FIFO guarantee is supplied. The local sink stores all distinct historical facts, including delayed success/reversal and status/version gaps. Read owner APIs for current business/financial state; arrival order cannot determine it.
