# Integration Events and Broker Contracts

**Status:** required extension of Phase 09. Events accelerate discovery; they never authorize money, inventory or fulfillment.

## Ownership and immutable history

Retain Phase 09 OrderLifecycleChanged and verified RefundSucceeded/RefundReversed envelopes, URNs, schema versions, IDs, subject rules and exact stored canonical bytes. Move the Payments refund outbox with its owner. Commerce Notifications still consumes those two routes into its local durable sandbox sink. Do not bind it to the new financial-change route or reinterpret its notifications as work commands.

Introduce one hint per effective Payments financial-version transaction. It includes only mapping/version/change categories. Capture, no-capture, refund allocation/result/correction, compensation coverage, confirmation admission/resolution and effective recovery-status changes can produce hints. Lease-only bookkeeping, unchanged scan, duplicate receipt and publication replay produce none.

Existing refund facts and the financial hint commit in separate owner tables in the same financial transaction. Several refund facts may share a financial version; they retain individual fact IDs. Only the hint has unique (paymentId,financialVersion). Fact history must not be coalesced.

## Wire registry

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:microservices:events:v1",
  "$defs": {
    "FinancialData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "paymentId",
        "attemptId",
        "orderId",
        "financialVersion",
        "changeKinds"
      ],
      "properties": {
        "paymentId": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "attemptId": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "financialVersion": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Version"
        },
        "changeKinds": {
          "type": "array",
          "minItems": 1,
          "maxItems": 8,
          "uniqueItems": true,
          "items": {
            "enum": [
              "Initialized",
              "Capture",
              "NoCapture",
              "Refund",
              "Correction",
              "Compensation",
              "Recovery",
              "Confirmation"
            ]
          }
        }
      }
    },
    "FinancialEvent": {
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
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "source": {
          "const": "urn:ecommerce:payments"
        },
        "type": {
          "const": "com.ecommerce.payments.financial-changed.v1"
        },
        "time": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
        },
        "subject": {
          "type": "string",
          "pattern": "^payments/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        },
        "datacontenttype": {
          "const": "application/json"
        },
        "dataschema": {
          "const": "urn:ecommerce:microservices:events:v1#/$defs/FinancialData"
        },
        "data": {
          "$ref": "#/$defs/FinancialData"
        },
        "correlationid": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "causationid": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "traceparent": {
          "type": "string",
          "pattern": "^00-[0-9a-f]{32}-[0-9a-f]{16}-(00|01)$"
        }
      }
    }
  }
}
```

```json
{"specversion":"1.0","id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","source":"urn:ecommerce:payments","type":"com.ecommerce.payments.financial-changed.v1","time":"2026-10-01T10:00:02.000000Z","subject":"payments/22222222-2222-4222-8222-222222222222","datacontenttype":"application/json","dataschema":"urn:ecommerce:microservices:events:v1#/$defs/FinancialData","data":{"paymentId":"22222222-2222-4222-8222-222222222222","attemptId":"44444444-4444-4444-8444-444444444444","orderId":"55555555-5555-4555-8555-555555555555","financialVersion":3,"changeKinds":["Capture"]}}
```

Canonicalize using the original Phase 09 sorted compact UTF-8 protocol before storage/publication; the readable example is schema-valid but is not a canonical-byte fixture. New event ID is an immutable server UUID. Subject must equal data.paymentId; mapping comes from binding; time is financial transaction observation time. Categories are sorted lexicographically and truthful. Apply original 8,192-byte/depth-8 envelope, 4,096-byte/16-header/depth-4 metadata limits, future-time≤30 seconds, nonzero trace/span IDs and historical replay without age cutoff. No provider IDs, balances, human reason, email/address, source methods, secrets, raw payload, baggage or tracestate.

## Topology delta

| Exchange/routing key | Queue/consumer | Limits |
| --- | --- | --- |
| commerce.orders.v1 / orders.lifecycle-changed.v1 | Existing commerce.notifications.v1 / Commerce Notifications | Phase 09 unchanged |
| commerce.payments.v1 / payments.refund-fact.v1 | Existing commerce.notifications.v1 / Commerce Notifications | Phase 09 unchanged |
| commerce.payments.v1 / payments.financial-changed.v1 | **commerce.financial-changes.v1** / Commerce hint intake | Durable quorum, max-length 10,000, max-bytes 64 MiB, overflow reject-publish, delivery-limit 20 |
| commerce.parking.v1 / financial-changes.poison.v1 | **commerce.financial-changes.parking.v1** / protected bounded review only | Durable quorum, max-length 1,000, max-bytes 16 MiB, reject-publish, delivery-limit −1 |

New main queue uses explicit at-least-once dead lettering to commerce.parking.v1 with financial-changes.poison.v1. Verify required broker feature flags, quorum policy and overflow settings against the pinned supported version; never assume defaults establish reliable parking. The existing notification parking binding remains separate. One-member quorum queues are durable local transport and supply no broker HA.

Payments publisher can write only commerce.payments.v1; Commerce hint intake can read only its main queue and has no financial write credential. Provisioning role alone configures topology. Add 128 MiB disk reservation for new queue bodies plus measured quorum/WAL overhead within the declared broker volume; it is not a disk-usage ceiling. Budget all queues/outboxes and stop growth before disk pressure compromises durable commits.

## Relay and consumer protocol

Both Payments outboxes share the existing one-connection relay pool and one publisher-owned confirm channel. Alternate bounded classes so hints cannot starve refund facts. Shared maximum ten publication attempts/sec, 30-second claim, ≤2-second confirm wait, ten observations/cycle. Mandatory publish, persistent messages, durable exchange/queue, positive confirm and no return are needed before Published. Unknown confirm repeats original bytes/ID. Copy RabbitMQ .NET client 7 callback bodies before returning; no shared-channel concurrent publishing.

Hint consumer executes on the two-connection Commerce intake pool. One consumer channel per enabled replica, prefetch 20, at most two processing slots; additional process replicas are competing consumers. After bounded validation:

1. Validate immutable mapped payment/attempt/Order against local acceptance without taking parent write locks. Missing mapping commits minimal quarantine and raises reconciliation; never create an Order from the event or insert an inbox row with missing required FKs.
2. Insert inbox keyed (source,eventId) with canonical bytes/digest; same identity/different bytes goes to restricted quarantine.
3. In the same local transaction retain max(highest_hint_version,event version). A newly deduplicated hint above owner_observed_version sets pending and increments the local hint-row version; scheduling cannot rely solely on the raw highest hint.
4. Commit then ACK. Failure leaves delivery unacknowledged; redelivery deduplicates.
5. A separate pass releases inbox locks before acquiring the original Checkout work order. It verifies current owner version and applies original wake rules. It clears the pending marker only if the captured local hint-row version still matches, so a concurrent eligible hint is not lost.

An event's higher version is scheduling input, not an admitted owner observation. Out-of-order hints need not be contiguous; versions at or below owner_observed_version need no new wake. If an intact current primary is behind a claimed hint, quarantine SourceMismatch and alert; do not promote that version into owner evidence or reset work. A later legitimate lower hint still schedules if above the last actual owner observation. Unknown mapping/digest conflict/invalid schema is durably quarantined with hash/codes/safe IDs only, then ACKed if commit succeeds. No raw malformed body retention. Intake failure cannot ACK loss.

Periodic owner polling covers missing events and wake-transfer crashes. Newer owner evidence, not merely a claimed event version, can start a new bounded recovery cycle. Duplicate hints never reset exhausted work.

## Remote replay, quarantine and restore

Commerce records a protected immutable replay operation/authority and Pending local audit intent before I/O. Payments private replay validates original source bytes/digest/work version, blocks intervention during active lease, records its own schedule/receipt/audit atomically, and returns OperationReceipt. Commerce records that exact owner result and only then marks quarantine Replayed. Timeout leaves Pending; repeat the same operation ID. This replaces Phase 09's cross-owner replay transaction without pretending the two commits are atomic.

DiscardInvalid needs only local proof/audit. SkipValid still requires known canonical owner bytes and original mapping; it marks only the notification outcome and cannot waive unresolved financial integrity. A Payments service outage or 404 is not evidence that a parked event is invalid.

After restore keep publishers/consumers stopped until each retained broker identity is validated against the restored canonical owner outbox through private inspection/owner tooling. One-sided missing or conflicting source is quarantined. Original notification receipts/deduplication remain; intentional canonical replay uses the original event ID. See [integrated restore](../deployment-and-devops/backup-and-restore.md).

## Learning and acceptance

Explain business event vs scheduling hint, duplicate identity vs financial-version coalescing, ACK vs application outcome, private command receipt vs broker confirm, and why transport ordering cannot decide a refund race. Required scenarios include lost confirms/ACKs, duplicated/out-of-order hints, missing broker for five minutes, missing local mapping, same-ID digest conflict, parking full and remote replay response loss.
