# Backup and Integrated Messaging Restore

**Status:** required Phase 09 extension to the [Phase 08 complete recovery design](../../08-production-ready-monolith/deployment-and-devops/backup-and-restore.md). No backup, restore, broker or provider operation is executed by this documentation task.

## Complete recovery unit

Keep whole-database snapshot RPO ≤24h and integrated RTO ≤2h. Add both outboxes and all Notifications inbox/delivery/receipt/quarantine/operator-operation tables to the same exported snapshot, archive, table inventory and integrity checks. Include Published, Delivered, Skipped, ManualReview and unresolved rows; they carry identity/evidence.

Use the existing two-connection read-only REPEATABLE READ snapshot coordinator plus serial custom pg_dump --snapshot. Manifest counts/table inventory share that snapshot; conservative primary clock lower bound precedes snapshot acquisition. Keep the 12-hour schedule, 30-minute job deadline, encrypted/off-host verification, seven-day/≥14-complete-archive policy and protected credential recovery. Broker or consumer progress never substitutes for the full archive.

Retain protected topology definitions/fingerprint, supported broker/client/artifact versions, per-owner producer activation markers and current credential/certificate version references outside the application database. Scrub secret/password hashes from reviewed definitions; credentials are recovered through protected facilities. Broker disks are not the authoritative purchase backup. The baseline reconstruction source is original PostgreSQL outbox intent plus local sink evidence, not an uncoordinated broker snapshot.

## Manifest v2

Phase 09 recovery uses this new pinned registry; the Phase 08 v1 registry is unchanged. V2 preserves its fields and adds Notifications, messaging counts, topology fingerprint, version and activation times. A v1 manifest cannot certify a Phase 09 database. Require a usable complete v2 point before claiming the activated deployment's recovery gate.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:recovery:schemas:v2",
  "$defs": {
    "Instant": {
      "type": "string",
      "format": "date-time",
      "pattern": "Z$"
    },
    "Digest": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$"
    },
    "Reference": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/-]*$"
    },
    "BackupManifest": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "backupId",
        "snapshotLowerBound",
        "completedAt",
        "archiveFormat",
        "postgresMajor",
        "artifactDigest",
        "schemaFingerprint",
        "configurationFingerprint",
        "encryptedArchiveDigest",
        "encryptedArchiveBytes",
        "ownerSchemas",
        "secretVersionReferences",
        "financialAccountReferences",
        "providerApiVersions",
        "ownerRowCounts",
        "manifestVersion",
        "messagingTopologyFingerprint",
        "producerActivation",
        "messagingRowCounts"
      ],
      "properties": {
        "backupId": {
          "$ref": "urn:ecommerce:identity:schemas:v1#/$defs/Uuid"
        },
        "snapshotLowerBound": {
          "$ref": "#/$defs/Instant"
        },
        "completedAt": {
          "$ref": "#/$defs/Instant"
        },
        "archiveFormat": {
          "const": "PostgreSQLCustom"
        },
        "postgresMajor": {
          "const": 18
        },
        "artifactDigest": {
          "$ref": "#/$defs/Digest"
        },
        "schemaFingerprint": {
          "$ref": "#/$defs/Digest"
        },
        "configurationFingerprint": {
          "$ref": "#/$defs/Digest"
        },
        "encryptedArchiveDigest": {
          "$ref": "#/$defs/Digest"
        },
        "encryptedArchiveBytes": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9007199254740991
        },
        "ownerSchemas": {
          "type": "array",
          "minItems": 8,
          "maxItems": 9,
          "uniqueItems": true,
          "items": {
            "enum": [
              "identity",
              "catalog",
              "inventory",
              "cart",
              "orders",
              "checkout",
              "checkout_simulator",
              "payments",
              "notifications"
            ]
          },
          "allOf": [
            {
              "contains": {
                "const": "identity"
              }
            },
            {
              "contains": {
                "const": "catalog"
              }
            },
            {
              "contains": {
                "const": "inventory"
              }
            },
            {
              "contains": {
                "const": "cart"
              }
            },
            {
              "contains": {
                "const": "orders"
              }
            },
            {
              "contains": {
                "const": "checkout"
              }
            },
            {
              "contains": {
                "const": "payments"
              }
            },
            {
              "contains": {
                "const": "notifications"
              }
            }
          ]
        },
        "secretVersionReferences": {
          "type": "array",
          "minItems": 1,
          "maxItems": 32,
          "uniqueItems": true,
          "items": {
            "$ref": "#/$defs/Reference"
          }
        },
        "financialAccountReferences": {
          "type": "array",
          "maxItems": 8,
          "uniqueItems": true,
          "items": {
            "$ref": "#/$defs/Reference"
          }
        },
        "providerApiVersions": {
          "type": "array",
          "maxItems": 8,
          "uniqueItems": true,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "ownerRowCounts": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "users",
            "orders",
            "reservations",
            "attempts",
            "payments",
            "refunds"
          ],
          "properties": {
            "users": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "orders": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "reservations": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "attempts": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "payments": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "refunds": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            }
          }
        },
        "manifestVersion": {
          "const": 2
        },
        "messagingTopologyFingerprint": {
          "$ref": "#/$defs/Digest"
        },
        "producerActivation": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "orders",
            "payments"
          ],
          "properties": {
            "orders": {
              "$ref": "#/$defs/Instant"
            },
            "payments": {
              "$ref": "#/$defs/Instant"
            }
          }
        },
        "messagingRowCounts": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "ordersOutbox",
            "paymentsOutbox",
            "notificationInbox",
            "notificationDeliveries",
            "notificationReceipts",
            "notificationQuarantine",
            "notificationOperations"
          ],
          "properties": {
            "ordersOutbox": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "paymentsOutbox": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "notificationInbox": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "notificationDeliveries": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "notificationReceipts": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "notificationQuarantine": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            },
            "notificationOperations": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            }
          }
        }
      }
    }
  }
}
```

All eight non-simulator owner schemas are required; include checkout_simulator whenever present. Each new table count is exact for the exported snapshot. Verify the actual archive inventory, all previous counts, schema/configuration/topology fingerprints, manifest integrity and accessible current secret references. Count presence alone cannot prove event relationships.

Activation times must not exceed snapshotLowerBound and must match protected release records. The same backup may include newly produced events only after those recorded cutovers. providerApiVersions/financialAccountReferences still cover all retained original bindings. Missing owner/table/count/activation/topology proof invalidates the point.

## Broker loss with PostgreSQL intact

1. Stop relays/intake and prove old publisher processes are quiesced. Do not alter business state or delete PostgreSQL event evidence.
2. Recreate the approved private vhost/topology/policies with current protected credentials; verify durability, bindings, safe DLX, size and capacity limits.
3. Discover canonical owner outbox rows in ≤100-row keyset pages, including Published rows. Through a narrow protected Notifications projection, identify Delivered/Skipped receipt dispositions; do not infer completion from Published.
4. Schedule original undelivered rows for replay through individually version-checked audited operations. A Delivered/Skipped event need not be replayed; replaying it still has no second local effect. ManualReview remains visible until reviewed; no automatic cycle reset.
5. Start bounded transport/senders, reconcile original eligible counts against local dispositions and report actual delivery recovery time. No Stripe call or Order/stock mutation belongs to this procedure.

Retained envelopes make transport rebuilding possible after complete broker disk loss. A broker confirm cannot prove the local sink had completed, and one-node queues have no availability guarantee during node loss.

## Database restore with retained broker messages

1. Apply the entire Phase 08 containment and complete restore procedure. Stop old/new relays, normal intake and local senders as well as financial mutation senders. Prove quiescence; no ordinary notification delivery against a partially restored primary.
2. Verify v2 manifest/table inventory/counts, all business grants/invariants, producer cutovers and messaging immutability. Revoke all restored Identity sessions and use current protected credentials. Preserve original payment keys/windows and receipts.
3. In an explicitly protected **restored-source validation mode**, drain normal and parking queues in bounded individual deliveries before normal transport resumes. Compare source/event ID and exact body/digest with the restored owner's immutable outbox using its read-only inspection contract. Matching canonical events commit intake/deduplication before ack; absent/conflicting source or invalid input commits safe quarantine before ack. No new event is generated from the broker's body.
4. Discover undelivered canonical outbox rows across both owners in bounded keyset pages. Reset expired transport leases only through approved recovery metadata operations; preserve identities, owner versions, attempts/history and original envelope time. Schedule necessary replay with finite audited cycles.
5. Perform the full original provider-gap enumeration/reconciliation, including changes to old refund objects and orphan captures. Newly admitted financial facts append their own outbox rows through normal owner transactions while transport is contained. Missing accepted binding/key is never fabricated from message metadata.
6. Reconcile notifications: every eligible restored event has its canonical intent; inbox/delivery identity matches; Delivered has exactly one matching receipt; Skipped has none plus an operator operation; all quarantine/conflicts/review remain visible. Unknown broker messages do not prove missing local financial intent was valid.
7. Resume approved messaging workers under the resource budget. Existing financial/Checkout recovery resumes only under its original safe gates. Business reopening still requires complete provider-gap/integrity resolution and authority checks; notification quarantine is not a waiver.
8. Record actual RPO/RTO, lost interval, messaging/provider reconciliation counts, restored-source conflicts, credentials/topology versions, invariants and safe reopening. Missed objectives remain Failed, and unresolved financial holds stay.

Quiescence plus controlled queue draining prevents unvalidated messages from a newer timeline entering ordinary intake. Disable normal intake until validation finishes; a resumed old publisher or unproved source keeps the mode held. With intact PostgreSQL and no database loss, normal broker reconnect does not require a source-validation sweep.

## Scope of the guarantee

The local sink and its deduplication history restore together. Events/receipts after the snapshot may be lost within the finite local RPO. There is no external customer delivery to undo or repeat in this scope, and no claim of exactly-once external notification. Retained broker messages may be examined as evidence but cannot restore absent business authority.

A new financial fact rediscovered after restore follows original Payments admission; its old lost notification identity is not guessed. Unmatched old messages remain contained. No rollback of business terminal state, automated restock, replacement payment key or rewritten envelope is permitted.

A timed drill must include complete broker loss, duplicate retained messages, a post-snapshot source absent from the archive, conflicting bytes, a retained terminal receipt, ManualReview and a verified old-refund reversal. RTO ends at reviewed safe service, including the existing financial gate, not at database or broker startup.
