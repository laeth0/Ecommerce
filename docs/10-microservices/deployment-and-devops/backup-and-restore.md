# Paired Backup and Integrated Restore

**Status:** required Phase 10 recovery design. No archive, credential, restore or provider operation is created by this documentation task. Earlier whole-monolith manifests describe the pre-extraction topology.

## Recovery unit and objectives

The recovery unit is both complete owner databases plus authenticated version/grant/topology/secret references and external provider reconciliation access. Include every retained command/authority/receipt/decision/hold/tombstone/deferred effect and both Payments outboxes, as well as all earlier Orders, stock, Identity and Notifications evidence. Terminal/ManualReview records are required.

RPO≤24h uses the **older conservative snapshot lower bound of a usable paired bundle**. RTO≤2h runs from declared service loss through both restores, authority/session/grant checks, original coordination/provider/event reconciliation and safe reopening. A database startup or completed dump is insufficient. Finite RPO permits missing local history and cannot promise zero financial loss.

## Backup policy and independent snapshots

Every12h start one paired job. For each database use its own read-only REPEATABLE READ snapshot coordinator and one serial custom-format pg_dump importing that exported snapshot. Primary UTC is recorded immediately before snapshot acquisition; inventory/counts use the same snapshot as that database's dump. Start both snapshot coordinators within60seconds; keep them alive through their respective dumps.

This consumes four connections: two coordinators plus two serial dumps running concurrently. No shared cross-database snapshot or global atomic point is claimed. Transactions spanning the two snapshots can be one-sided even when both databases are on the same server. [PostgreSQL pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) describes single-database consistent export and snapshot import; the paired reconciliation protocol is this project's design.

Both archives, encryption, signed/authenticated manifest, protected inventory and off-host read-back/decryption checks must finish≤30minutes. Either failure, schema/version mismatch, skew>60seconds or incomplete inventory makes the **whole bundle unusable**. Never combine arbitrary archives from different jobs and call them a verified pair.

Retain7days/≥14 complete paired bundles plus one in progress; each bundle contains two archives. Current roles/grants, certificate/JWT/provider/webhook/cursor/backup key versions are protected separately without secret values in the manifest. No credentials in argv/history/repository. No incompatible DDL, writer transfer or epoch rotation overlaps a job.

Bundle age warning>12.5h, urgent>18h, objective failure≥24h; then contain new purchase/refund/fulfillment until recovery capacity is restored. Rehearse isolated timed restore before Phase 10 implementation exit, monthly, and after material protocol/schema/source/secret changes. Record snapshot bloat/I/O impact and separately bounded isolated restore resources.

## Restricted manifest v3

The following operating schema replaces neither v1 nor v2. A v2 whole-monolith manifest cannot certify the extracted deployment. Validate locally with Draft2020-12 and format assertions; maximum manifest128KiB/depth12. It contains nonsecret references and row counts, not production payloads.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:recovery:schemas:v3",
  "$defs": {
    "Reference": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128,
      "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/-]*$"
    },
    "Snapshot": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "owner",
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
        "inventoryDigest",
        "rowCounts"
      ],
      "properties": {
        "owner": {
          "enum": [
            "Commerce",
            "Payments"
          ]
        },
        "snapshotLowerBound": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
        },
        "completedAt": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
        },
        "archiveFormat": {
          "const": "PostgreSQLCustom"
        },
        "postgresMajor": {
          "const": 18
        },
        "artifactDigest": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "schemaFingerprint": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "configurationFingerprint": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "encryptedArchiveDigest": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "encryptedArchiveBytes": {
          "type": "integer",
          "minimum": 1,
          "maximum": 9007199254740991
        },
        "ownerSchemas": {
          "type": "array",
          "minItems": 1,
          "maxItems": 8,
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
              "notifications",
              "payments"
            ]
          }
        },
        "inventoryDigest": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "rowCounts": {
          "type": "object",
          "minProperties": 1,
          "maxProperties": 256,
          "propertyNames": {
            "pattern": "^[a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*$"
          },
          "additionalProperties": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "owner": {
                "const": "Payments"
              }
            }
          },
          "then": {
            "properties": {
              "ownerSchemas": {
                "const": [
                  "payments"
                ]
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "owner": {
                "const": "Commerce"
              }
            }
          },
          "then": {
            "properties": {
              "ownerSchemas": {
                "minItems": 7,
                "items": {
                  "enum": [
                    "identity",
                    "catalog",
                    "inventory",
                    "cart",
                    "orders",
                    "checkout",
                    "checkout_simulator",
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
                      "const": "notifications"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    },
    "BackupBundle": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "manifestVersion",
        "bundleId",
        "runtimeEpoch",
        "completedAt",
        "snapshots",
        "messagingTopologyFingerprint",
        "grantDefinitionFingerprint",
        "producerActivation",
        "secretVersionReferences",
        "financialAccountReferences",
        "providerApiVersions"
      ],
      "properties": {
        "manifestVersion": {
          "const": 3
        },
        "bundleId": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "runtimeEpoch": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Uuid"
        },
        "completedAt": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
        },
        "snapshots": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {
            "$ref": "#/$defs/Snapshot"
          },
          "allOf": [
            {
              "contains": {
                "properties": {
                  "owner": {
                    "const": "Commerce"
                  }
                }
              },
              "minContains": 1,
              "maxContains": 1
            },
            {
              "contains": {
                "properties": {
                  "owner": {
                    "const": "Payments"
                  }
                }
              },
              "minContains": 1,
              "maxContains": 1
            }
          ]
        },
        "messagingTopologyFingerprint": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "grantDefinitionFingerprint": {
          "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Digest"
        },
        "producerActivation": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "orders",
            "refundFacts",
            "financialHints"
          ],
          "properties": {
            "orders": {
              "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
            },
            "refundFacts": {
              "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
            },
            "financialHints": {
              "$ref": "urn:ecommerce:microservices:schemas:v1#/$defs/Instant"
            }
          }
        },
        "secretVersionReferences": {
          "type": "array",
          "minItems": 1,
          "maxItems": 64,
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
        }
      }
    }
  }
}
```

Semantic checks: exactly one archive per owner; each required actual schema/table appears in protected inventory/rowCounts; no cross-owner table; optional simulator schema iff present; counts/archive share exported snapshot; completeAt≥own snapshot and bundle completion≥both completion; all work≤30minutes; snapshot-bound skew≤60seconds; artifact/config/schema/grant/topology/activation/epoch correspond to deployed pair. Provider references cover every retained accepted source; empty arrays are valid only with no provider bindings. Inventory digest authenticates the complete protected inventory; bundle authentication and encrypted archive digests/read-back are verified independently of either database.

## Integrated recovery sequence

1. **Contain and fence:** start RTO timer; close purchase/refund/fulfillment and protected financial mutation; stop public routing, both runtimes' writers/consumers/relays/executor; fence old provider process/egress/secret/lease. Unproved quiescence keeps new executor disabled.
2. **Select:** verify complete paired bundle, authentication/digests/decryption, oldest bound/actual RPO, compatible artifacts/schema/source/cursor/cert/grants. Record objective misses without weakening gates.
3. **Restore both in isolation:** clean protected targets, compatible PostgreSQL18, stop-on-error; no startup worker/provider egress. Restore failure means unusable partial target. Match every table/count/inventory and local constraints; ANALYZE; verify exclusive CONNECT/grants and original immutable receipts/bytes.
4. **Restore authority safely:** recover current protected secrets, revoke all restored sessions through existing Identity procedure and force fresh login. Retain earlier durable command authority as historical accepted work only where original evidence is intact.
5. **Rotate recovery fence:** set a new paired runtime epoch under maintenance. Old original acceptance epochs/commands/keys stay immutable; old missing history cannot initialize as fresh. Allow protected read/observation/reconciliation, keep new financial dispatch/admission blocked.
6. **Reconcile both histories:** inspect every accepted mapping, command receipt, actor/key, Pending decision, hold/terminal decision/release, stock outcome, case/refund allocation and replay operation. Use owner API/tool queries; no routine cross-database SQL. Follow the asymmetry table below.
7. **Establish external gap:** begin at least5minutes before the older snapshot bound through proven quiescence/current inspection. Use every original account/API and protected continuation outside the lost stores. Enumerate/retrieve genuine PI/Charge/refund/event evidence; include old objects changed during the gap and old-refund reversals. Creation-time-only search is insufficient; missing provider history holds gates for manual account reconciliation.
8. **Apply owner evidence and safe original recovery:** source/account/amount/mode/identity must match. Missing accepted binding/key/authority is an orphan, never permission to construct an Order from webhook metadata. Retain original first-send/windows; lost send identity prohibits guessed POST/newkey/window. Apply verified corrections, expire unusable stock, create original-case full compensation where required. Resolve holds from proved original terminal decisions only.
9. **Reconcile messaging timeline:** keep broker intake/relays stopped while validating retained messages against each restored canonical owner outbox. Missing/conflicting source quarantines; restore original notification receipts/dedup. Resume only canonical original-ID replay and finite hint recovery; events cannot reconstruct money or Order authority.
10. **Reopen reviewed consistent scope:** all unexplained effects/one-sided authority/decision integrity resolved; correct current sessions/grants/certificates/epochs, actual stock/financial invariants, compatible workers and one executor verified. In the one-merchant baseline an unmapped provider orphan keeps account purchasing/refund/fulfillment held. Quarantine/ManualReview alone does not waive that gate.
11. **Record evidence:** stop RTO only at safe service; retain actual lost interval, both snapshot bounds/skew, invariant/decision/provider/event findings and resources/call rates. A safe result>2h is Failed RTO and remains contained until safe; no timeout opens gates.

Every actual provider discovery/action shares5/sec/burst2/concurrency2; genuine drill≤100 affected objects. The full local dataset may contain simulator/sanitized retained data, but cannot certify recovery capacity for100,000 real provider objects.

## Snapshot asymmetry decisions

| Restored state | Required disposition |
| --- | --- |
| Commerce command present; Payments receipt absent | Inspect binding/mutation/provider/root; fresh current-epoch history may admit original command, older epoch requires attributed reconciliation;404 alone is no proof |
| Payments refund admitted; Commerce authority/key correlation absent | Preserve financial receipt/allocation; recover original authorization/accepted mapping from authenticated retained evidence; no new instruction or fabricated authority |
| Commerce Committed/Consumed; Payments Held or missing resolution | Exact original token/capture/mapping plus actual local history permits Resolve original decision; no second Consume |
| Payments resolved Committed; Commerce decision/Consume absent or conflicting | Block fulfillment/account scope; remote copied decision is investigation evidence, not permission to fabricate lost local stock/Order commit; require complete authenticated original owner history or reviewed safe financial resolution |
| Commerce guard closed; Payments original release present | Validate original matching decision/Consumed stock and record the same release UUID once |
| Commerce Aborted; Payments Held | Resolve only exact token/mapping and safe terminal stock; tokenless unknown abort conflicts with actual hold |
| Old refund reversal absent locally | Retrieve canonical original adjustment/link, apply correction once and compensation coverage as required |
| Broker event newer than restored owner source | Quarantine minimal evidence; do not declare a paid/confirmed Order or delivered notification from it |

Recovering missing owner history, when possible, is an attributed maintenance procedure using complete authenticated original records, not inferred mutable state or screenshots/log lines. If original authority/stock/decision proof cannot be recovered, the scope stays held and time objectives may fail. This limit is deliberate and must be exposed in the drill.

## Learning and acceptance

Explain individual ACID snapshot versus a causally consistent service recovery point; why skew≤60seconds still permits one-sided commits; why current secret recovery and session revocation are independent of archive restore; why original provider side effects constrain rollback; and why RTO includes safe reopening.

Required drill covers every asymmetry row, lost earliest-send history, invalid archive/manifest/secret, stale runtime traffic, old-refund reversal, missing canonical outbox and unproved old executor quiescence. Collect Passed/Failed/Not run per case. Phase13 may tighten recovery objectives through measured infrastructure; this phase may not defer financial containment.
