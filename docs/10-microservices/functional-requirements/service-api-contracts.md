# Private Service API Contracts

**Status:** v1 extraction wire contract; no new public API. [Compatibility](compatibility-and-authority.md) preserves all existing public routes, schemas and error wording.

## Transport and common rules

Private HTTPS with direct end-to-end mTLS and explicit workload allowlists; no redirects/proxy discovery from input. Commerce owns public authentication. Payments accepts committed authority from its authorized workload, never a forwarded client JWT.

Request headers: server UUID `X-Request-Id`, current paired runtime UUID `X-Integration-Epoch` and application/json for POST. Use six-fraction UTC instants, canonical lowercase UUIDs, safe integer syntax, strict unknown/duplicate-member rejection, depth≤12 and decoded request≤8,192 bytes. Persist/send compact sorted canonical UTF-8 command bytes and SHA-256 under Phase09 canonical scalar rules. No compression, URL secrets or GET bodies. Read-response budgets: FinancialView/capabilities 4,096, RefundPage 65,536, command/evidence/hold/decision 8,192, canonical-event 16,384 bytes. No-store everywhere. Responses exceeding their schema/budget are Unknown/integrity errors.

Every call has a 2-second total deadline including connection, certificate negotiation, request and response. No SDK automatic POST retry, hedging or automatic redirects. Persist the claim before I/O, classify its result afterward. Timing out a call does not undo its receiver commit. See [capacity](../performance-and-scalability/capacity-and-service-budgets.md).

Require exactly one value for each identity/provenance header; no comma lists or duplicate values. Private decoded headers total≤8,192 bytes/≤32 names; UUID headers use their canonical36-character form. GET accepts only listed limit/cursor parameters; other routes accept no query. JSON Accept and original common method/media rules apply. CommandId in the body is the idempotency identity; no caller-controlled retry-key header can replace it.

| Owner/method/path | Allowed principal and semantics | Result |
| --- | --- | --- |
| Payments POST `/internal/v1/commands` | Commerce command writer; exact Command below | 200 CommandResult for known Applied/Rejected |
| Payments GET `/internal/v1/commands/{commandId}` | Same writer; original immutable receipt | 200 CommandResult; 404 means receipt absent, not financial rollback |
| Payments GET `/internal/v1/payments/{paymentId}/financial` | Commerce financial reader; validated actor/order provenance | 200 original FinancialView |
| Payments GET `/internal/v1/payments/{paymentId}/evidence` | Commerce coordinator; original mapped accepted purchase | 200 PaymentEvidence from one owner snapshot |
| Payments GET `/internal/v1/payments/{paymentId}/refunds` | Same reader; original limit/cursor protocol | 200 original RefundPage |
| Payments GET `/internal/v1/payments/{paymentId}/confirmation` | Commerce coordinator; original mapping | 200 HoldView; 404 is unknown/missing, never Aborted |
| Payments GET `/internal/v1/capabilities` | Commerce coordinator; advisory bounded health | 200 Capabilities; no money or dispatch proof |
| Commerce GET `/internal/v1/confirmation-decisions/{confirmationId}` | Payments decision reconciler | 200 DecisionView; 404 never authorizes hold release |
| Payments GET `/internal/v1/outbox/{eventId}` | Commerce recovery inspector, protected use | 200 CanonicalRecord; original refund or financial-hint outbox |
| Payments POST `/internal/v1/recovery/outbox-replays` | Commerce recovery writer carrying committed operator authority | 200 OperationReceipt after owner receipt/audit/schedule |

No arbitrary SQL/filter/event-payload or financial-state overwrite endpoint exists. Protected source setup and proof-based compensation repair remain owner-local tools under maintenance/restricted operator access, using original Phase 07 repair guards. They cannot bypass the hold protocol.

For financial GET, headers `X-Actor-Id`, `X-Actor-Kind` (Customer/Admin) and `X-Order-Id` are mandatory, bounded, validated and accepted only from the financial-reader principal. Payments compares Order/customer mapping for Customer, commits required Admin owner audit and returns its primary snapshot. Commerce commits its local Admin access audit before sending. If either audit fails, fail the read. No service can assert a browser-supplied actor without Commerce authorization.

## Command semantics and receipts

`commandId` identifies exact canonical UTF-8 instruction bytes and SHA-256, independent of HTTP request ID/trace. Sender writes identity/bytes before sending. Owner locks the integration root, checks any original receipt, validates same-ID canonical equality and applies effects plus immutable receipt atomically. A changed command conflicts. Business rejection is a durable private Rejected result; it does not create a successful public refund-key binding. A transient dependency/closed gate failure is 503 with no definitive business result. Exact known receipt replay precedes current financial/gate guards, but follows workload/epoch validation.

| Kind | Preconditions and owner commit | Applied result requirement |
| --- | --- | --- |
| InitializePayment | Existing immutable descriptor/fingerprint; exact original mapping/source/amount/deadline; current fresh acceptance epoch or reconciled legacy receipt | initialized=true and known mapping; stopped root creates non-dispatchable intent |
| RequestClosure | Original binding or provably fresh original root; original closure ID/reason | closureRecorded=true; noCaptureFactId only with admitted definitive proof |
| EnsureCompensation | Exact admitted capture/case/target and original cause; defer under Held | compensationRecorded=true; coverageComplete=true only after durable full case/coverage |
| AcquireConfirmation | All financial guards in [coordination](../reliability-and-failure-scenarios/workflow-coordination.md) | exact HoldView with Held proof/token |
| ResolveConfirmation | Exact stored hold token, same mapping and terminal Commerce DecisionView | decisionRecorded=true; final HoldView may still be Finalizing |
| IssueRefund | Authenticated immutable Commerce authorization plus original financial guards | original Phase 07 RefundReceipt and replay flag |

RequestClosure and EnsureCompensation may acknowledge durable deferred control while Held. Such acknowledgement cannot be interpreted as no-capture/full coverage. Coverage completion requires subsequent current owner evidence; public/Order terminal decisions never rely on a deferred-only receipt. If closure preceded binding, stopped initialization still records the original binding and definitive never-dispatched fact before a fact-based terminal outcome is available.

Each command binds original acceptance epoch. Runtime epoch is the current transport fence and may change after restore; it does not rewrite immutable original instructions. An old-epoch command with missing owner history is held for recovery. Original known receipts/bindings can be inspected/replayed under the new transport epoch after mapping reconciliation; no fresh charge is inferred from absence.

## Structural registry

Register these schemas locally at build/startup; never fetch a supplied URN over the network. Draft 2020-12 plus UUID/date-time validation; semantic rules below are mandatory beyond schema validity.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:microservices:schemas:v1",
  "$defs": {
    "Uuid": {
      "type": "string",
      "format": "uuid",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "Instant": {
      "type": "string",
      "format": "date-time",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{6}Z$"
    },
    "Version": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "Digest": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$"
    },
    "Reason": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256
    },
    "InitializeData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "attemptId",
        "orderId",
        "customerId",
        "reservationId",
        "compensationId",
        "sourceDescriptorId",
        "sourceFingerprint",
        "amountMinor",
        "currency",
        "acceptedAt",
        "reservationExpiresAt"
      ],
      "properties": {
        "attemptId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "customerId": {
          "$ref": "#/$defs/Uuid"
        },
        "reservationId": {
          "$ref": "#/$defs/Uuid"
        },
        "compensationId": {
          "$ref": "#/$defs/Uuid"
        },
        "sourceDescriptorId": {
          "$ref": "#/$defs/Uuid"
        },
        "sourceFingerprint": {
          "$ref": "#/$defs/Digest"
        },
        "amountMinor": {
          "type": "integer",
          "minimum": 501,
          "maximum": 99999999
        },
        "currency": {
          "const": "USD"
        },
        "acceptedAt": {
          "$ref": "#/$defs/Instant"
        },
        "reservationExpiresAt": {
          "$ref": "#/$defs/Instant"
        }
      }
    },
    "ClosureData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "closureId",
        "orderId",
        "reason"
      ],
      "properties": {
        "closureId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "reason": {
          "enum": [
            "Cancellation",
            "StockLost",
            "LateCapture",
            "RefundBeforeConfirmation"
          ]
        }
      }
    },
    "CompensationData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "caseId",
        "orderId",
        "captureFactId",
        "targetMinor",
        "reason"
      ],
      "properties": {
        "caseId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "captureFactId": {
          "$ref": "#/$defs/Uuid"
        },
        "targetMinor": {
          "type": "integer",
          "minimum": 501,
          "maximum": 99999999
        },
        "reason": {
          "enum": [
            "Cancellation",
            "StockLost",
            "LateCapture",
            "RefundBeforeConfirmation"
          ]
        }
      }
    },
    "AcquireData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "confirmationId",
        "orderId",
        "reservationId",
        "captureFactId",
        "expectedFinancialVersion"
      ],
      "properties": {
        "confirmationId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "reservationId": {
          "$ref": "#/$defs/Uuid"
        },
        "captureFactId": {
          "$ref": "#/$defs/Uuid"
        },
        "expectedFinancialVersion": {
          "$ref": "#/$defs/Version"
        }
      }
    },
    "TerminalDecision": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "confirmationId",
        "decisionId",
        "paymentId",
        "orderId",
        "reservationId",
        "token",
        "decision",
        "decidedAt",
        "confirmedOrderVersion",
        "stockDisposition"
      ],
      "properties": {
        "confirmationId": {
          "$ref": "#/$defs/Uuid"
        },
        "decisionId": {
          "$ref": "#/$defs/Uuid"
        },
        "paymentId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "reservationId": {
          "$ref": "#/$defs/Uuid"
        },
        "token": {
          "anyOf": [
            {
              "$ref": "#/$defs/Uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "decision": {
          "enum": [
            "Committed",
            "Aborted"
          ]
        },
        "decidedAt": {
          "$ref": "#/$defs/Instant"
        },
        "confirmedOrderVersion": {
          "anyOf": [
            {
              "$ref": "#/$defs/Version"
            },
            {
              "type": "null"
            }
          ]
        },
        "stockDisposition": {
          "enum": [
            "Consumed",
            "Released",
            "Expired"
          ]
        }
      },
      "oneOf": [
        {
          "properties": {
            "decision": {
              "const": "Committed"
            },
            "token": {
              "$ref": "#/$defs/Uuid"
            },
            "confirmedOrderVersion": {
              "$ref": "#/$defs/Version"
            },
            "stockDisposition": {
              "const": "Consumed"
            }
          }
        },
        {
          "properties": {
            "decision": {
              "const": "Aborted"
            },
            "confirmedOrderVersion": {
              "type": "null"
            },
            "stockDisposition": {
              "enum": [
                "Released",
                "Expired"
              ]
            }
          }
        }
      ]
    },
    "RefundData": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "refundId",
        "orderId",
        "adminId",
        "idempotencyKey",
        "authorizationReceiptId",
        "authorizedAt",
        "requestId",
        "expectedVersion",
        "amountMinor",
        "reason"
      ],
      "properties": {
        "refundId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "adminId": {
          "$ref": "#/$defs/Uuid"
        },
        "idempotencyKey": {
          "$ref": "#/$defs/Uuid"
        },
        "authorizationReceiptId": {
          "$ref": "#/$defs/Uuid"
        },
        "authorizedAt": {
          "$ref": "#/$defs/Instant"
        },
        "requestId": {
          "$ref": "#/$defs/Uuid"
        },
        "expectedVersion": {
          "$ref": "#/$defs/Version"
        },
        "amountMinor": {
          "type": "integer",
          "minimum": 1,
          "maximum": 99999999
        },
        "reason": {
          "$ref": "#/$defs/Reason"
        }
      }
    },
    "Command": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "commandId",
        "kind",
        "paymentId",
        "acceptanceEpoch",
        "data"
      ],
      "properties": {
        "commandId": {
          "$ref": "#/$defs/Uuid"
        },
        "kind": {
          "enum": [
            "InitializePayment",
            "RequestClosure",
            "EnsureCompensation",
            "AcquireConfirmation",
            "ResolveConfirmation",
            "IssueRefund"
          ]
        },
        "paymentId": {
          "$ref": "#/$defs/Uuid"
        },
        "acceptanceEpoch": {
          "$ref": "#/$defs/Uuid"
        },
        "data": {
          "type": "object"
        }
      },
      "oneOf": [
        {
          "properties": {
            "kind": {
              "const": "InitializePayment"
            },
            "data": {
              "$ref": "#/$defs/InitializeData"
            }
          }
        },
        {
          "properties": {
            "kind": {
              "const": "RequestClosure"
            },
            "data": {
              "$ref": "#/$defs/ClosureData"
            }
          }
        },
        {
          "properties": {
            "kind": {
              "const": "EnsureCompensation"
            },
            "data": {
              "$ref": "#/$defs/CompensationData"
            }
          }
        },
        {
          "properties": {
            "kind": {
              "const": "AcquireConfirmation"
            },
            "data": {
              "$ref": "#/$defs/AcquireData"
            }
          }
        },
        {
          "properties": {
            "kind": {
              "const": "ResolveConfirmation"
            },
            "data": {
              "allOf": [
                {
                  "$ref": "#/$defs/TerminalDecision"
                },
                {
                  "properties": {
                    "token": {
                      "$ref": "#/$defs/Uuid"
                    }
                  }
                }
              ]
            }
          }
        },
        {
          "properties": {
            "kind": {
              "const": "IssueRefund"
            },
            "data": {
              "$ref": "#/$defs/RefundData"
            }
          }
        }
      ]
    },
    "HoldView": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "confirmationId",
        "paymentId",
        "orderId",
        "reservationId",
        "token",
        "captureFactId",
        "heldVersion",
        "state",
        "decisionId",
        "releaseId",
        "integrityHold"
      ],
      "properties": {
        "confirmationId": {
          "$ref": "#/$defs/Uuid"
        },
        "paymentId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "reservationId": {
          "$ref": "#/$defs/Uuid"
        },
        "token": {
          "$ref": "#/$defs/Uuid"
        },
        "captureFactId": {
          "$ref": "#/$defs/Uuid"
        },
        "heldVersion": {
          "$ref": "#/$defs/Version"
        },
        "state": {
          "enum": [
            "Held",
            "Finalizing",
            "ResolvedCommitted",
            "ResolvedAborted"
          ]
        },
        "decisionId": {
          "anyOf": [
            {
              "$ref": "#/$defs/Uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "releaseId": {
          "anyOf": [
            {
              "$ref": "#/$defs/Uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "integrityHold": {
          "type": "boolean"
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "state": {
                "const": "Held"
              }
            }
          },
          "then": {
            "properties": {
              "decisionId": {
                "type": "null"
              },
              "releaseId": {
                "type": "null"
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "state": {
                "enum": [
                  "Finalizing",
                  "ResolvedCommitted",
                  "ResolvedAborted"
                ]
              }
            }
          },
          "then": {
            "properties": {
              "decisionId": {
                "$ref": "#/$defs/Uuid"
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "state": {
                "enum": [
                  "Held",
                  "Finalizing",
                  "ResolvedAborted"
                ]
              }
            }
          },
          "then": {
            "properties": {
              "releaseId": {
                "type": "null"
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "integrityHold": {
                "const": true
              }
            }
          },
          "then": {
            "properties": {
              "releaseId": {
                "type": "null"
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "state": {
                "const": "ResolvedCommitted"
              },
              "integrityHold": {
                "const": false
              }
            }
          },
          "then": {
            "properties": {
              "releaseId": {
                "$ref": "#/$defs/Uuid"
              }
            }
          }
        }
      ]
    },
    "DecisionView": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "confirmationId",
            "paymentId",
            "orderId",
            "reservationId",
            "decision"
          ],
          "properties": {
            "confirmationId": {
              "$ref": "#/$defs/Uuid"
            },
            "paymentId": {
              "$ref": "#/$defs/Uuid"
            },
            "orderId": {
              "$ref": "#/$defs/Uuid"
            },
            "reservationId": {
              "$ref": "#/$defs/Uuid"
            },
            "decision": {
              "const": "Pending"
            }
          }
        },
        {
          "$ref": "#/$defs/TerminalDecision"
        }
      ]
    },
    "PaymentEvidence": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "paymentId",
        "attemptId",
        "orderId",
        "customerId",
        "reservationId",
        "compensationId",
        "acceptanceEpoch",
        "sourceFingerprint",
        "amountMinor",
        "currency",
        "acceptedAt",
        "reservationExpiresAt",
        "financialVersion",
        "captureFactId",
        "noCaptureFactId",
        "refundStarted",
        "closureRequested",
        "fullCompensationCovered",
        "integrityHold"
      ],
      "properties": {
        "paymentId": {
          "$ref": "#/$defs/Uuid"
        },
        "attemptId": {
          "$ref": "#/$defs/Uuid"
        },
        "orderId": {
          "$ref": "#/$defs/Uuid"
        },
        "customerId": {
          "$ref": "#/$defs/Uuid"
        },
        "reservationId": {
          "$ref": "#/$defs/Uuid"
        },
        "compensationId": {
          "$ref": "#/$defs/Uuid"
        },
        "acceptanceEpoch": {
          "$ref": "#/$defs/Uuid"
        },
        "sourceFingerprint": {
          "$ref": "#/$defs/Digest"
        },
        "amountMinor": {
          "type": "integer",
          "minimum": 501,
          "maximum": 99999999
        },
        "currency": {
          "const": "USD"
        },
        "acceptedAt": {
          "$ref": "#/$defs/Instant"
        },
        "reservationExpiresAt": {
          "$ref": "#/$defs/Instant"
        },
        "financialVersion": {
          "$ref": "#/$defs/Version"
        },
        "captureFactId": {
          "anyOf": [
            {
              "$ref": "#/$defs/Uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "noCaptureFactId": {
          "anyOf": [
            {
              "$ref": "#/$defs/Uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "refundStarted": {
          "type": "boolean"
        },
        "closureRequested": {
          "type": "boolean"
        },
        "fullCompensationCovered": {
          "type": "boolean"
        },
        "integrityHold": {
          "type": "boolean"
        }
      }
    },
    "Capabilities": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "service",
        "runtimeEpoch",
        "protocolVersions",
        "acceptingInitialization",
        "allowingNewPayments",
        "allowingNewRefunds",
        "observedAt"
      ],
      "properties": {
        "service": {
          "const": "Payments"
        },
        "runtimeEpoch": {
          "$ref": "#/$defs/Uuid"
        },
        "protocolVersions": {
          "const": [
            1
          ]
        },
        "acceptingInitialization": {
          "type": "boolean"
        },
        "allowingNewPayments": {
          "type": "boolean"
        },
        "allowingNewRefunds": {
          "type": "boolean"
        },
        "observedAt": {
          "$ref": "#/$defs/Instant"
        }
      }
    },
    "AppliedData": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "initialized": {
          "const": true
        },
        "closureRecorded": {
          "const": true
        },
        "noCaptureFactId": {
          "$ref": "#/$defs/Uuid"
        },
        "compensationRecorded": {
          "const": true
        },
        "coverageComplete": {
          "type": "boolean"
        },
        "decisionRecorded": {
          "const": true
        },
        "hold": {
          "$ref": "#/$defs/HoldView"
        },
        "refundReceipt": {
          "$ref": "urn:ecommerce:payments:schemas:v1#/$defs/RefundReceipt"
        },
        "idempotencyReplayed": {
          "type": "boolean"
        }
      },
      "minProperties": 1
    },
    "CommandResult": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "commandId",
        "paymentId",
        "kind",
        "outcome",
        "code",
        "financialVersion",
        "recordedAt",
        "data"
      ],
      "properties": {
        "commandId": {
          "$ref": "#/$defs/Uuid"
        },
        "paymentId": {
          "$ref": "#/$defs/Uuid"
        },
        "kind": {
          "enum": [
            "InitializePayment",
            "RequestClosure",
            "EnsureCompensation",
            "AcquireConfirmation",
            "ResolveConfirmation",
            "IssueRefund"
          ]
        },
        "outcome": {
          "enum": [
            "Applied",
            "Rejected"
          ]
        },
        "code": {
          "enum": [
            "Applied",
            "Payments.VersionConflict",
            "Payments.NotCaptured",
            "Payments.AmountUnavailable",
            "Payments.FinancialHold",
            "Payments.SourceUnsupported",
            "Payments.IdempotencyConflict",
            "MappingConflict",
            "SourceMismatch",
            "RecoveryRequired"
          ]
        },
        "financialVersion": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "recordedAt": {
          "$ref": "#/$defs/Instant"
        },
        "data": {
          "anyOf": [
            {
              "$ref": "#/$defs/AppliedData"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "oneOf": [
        {
          "properties": {
            "outcome": {
              "const": "Applied"
            },
            "code": {
              "const": "Applied"
            },
            "data": {
              "$ref": "#/$defs/AppliedData"
            }
          }
        },
        {
          "properties": {
            "outcome": {
              "const": "Rejected"
            },
            "code": {
              "enum": [
                "Payments.VersionConflict",
                "Payments.NotCaptured",
                "Payments.AmountUnavailable",
                "Payments.FinancialHold",
                "Payments.SourceUnsupported",
                "Payments.IdempotencyConflict",
                "MappingConflict",
                "SourceMismatch",
                "RecoveryRequired"
              ]
            },
            "data": {
              "type": "null"
            }
          }
        }
      ],
      "allOf": [
        {
          "if": {
            "properties": {
              "outcome": {
                "const": "Applied"
              },
              "kind": {
                "const": "InitializePayment"
              }
            }
          },
          "then": {
            "properties": {
              "data": {
                "required": [
                  "initialized"
                ],
                "propertyNames": {
                  "enum": [
                    "initialized"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "outcome": {
                "const": "Applied"
              },
              "kind": {
                "const": "RequestClosure"
              }
            }
          },
          "then": {
            "properties": {
              "data": {
                "required": [
                  "closureRecorded"
                ],
                "propertyNames": {
                  "enum": [
                    "closureRecorded",
                    "noCaptureFactId"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "outcome": {
                "const": "Applied"
              },
              "kind": {
                "const": "EnsureCompensation"
              }
            }
          },
          "then": {
            "properties": {
              "data": {
                "required": [
                  "compensationRecorded",
                  "coverageComplete"
                ],
                "propertyNames": {
                  "enum": [
                    "compensationRecorded",
                    "coverageComplete"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "outcome": {
                "const": "Applied"
              },
              "kind": {
                "const": "AcquireConfirmation"
              }
            }
          },
          "then": {
            "properties": {
              "data": {
                "required": [
                  "hold"
                ],
                "propertyNames": {
                  "enum": [
                    "hold"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "outcome": {
                "const": "Applied"
              },
              "kind": {
                "const": "ResolveConfirmation"
              }
            }
          },
          "then": {
            "properties": {
              "data": {
                "required": [
                  "decisionRecorded",
                  "hold"
                ],
                "propertyNames": {
                  "enum": [
                    "decisionRecorded",
                    "hold"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "outcome": {
                "const": "Applied"
              },
              "kind": {
                "const": "IssueRefund"
              }
            }
          },
          "then": {
            "properties": {
              "data": {
                "required": [
                  "refundReceipt",
                  "idempotencyReplayed"
                ],
                "propertyNames": {
                  "enum": [
                    "refundReceipt",
                    "idempotencyReplayed"
                  ]
                }
              }
            }
          }
        }
      ]
    },
    "ReplayRequest": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "operationId",
        "operatorId",
        "requestId",
        "eventId",
        "bodyDigest",
        "expectedWorkVersion",
        "reason"
      ],
      "properties": {
        "operationId": {
          "$ref": "#/$defs/Uuid"
        },
        "operatorId": {
          "$ref": "#/$defs/Uuid"
        },
        "requestId": {
          "$ref": "#/$defs/Uuid"
        },
        "eventId": {
          "$ref": "#/$defs/Uuid"
        },
        "bodyDigest": {
          "$ref": "#/$defs/Digest"
        },
        "expectedWorkVersion": {
          "$ref": "#/$defs/Version"
        },
        "reason": {
          "$ref": "#/$defs/Reason"
        }
      }
    },
    "OperationReceipt": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "operationId",
        "eventId",
        "bodyDigest",
        "result",
        "beforeVersion",
        "afterVersion",
        "recordedAt"
      ],
      "properties": {
        "operationId": {
          "$ref": "#/$defs/Uuid"
        },
        "eventId": {
          "$ref": "#/$defs/Uuid"
        },
        "bodyDigest": {
          "$ref": "#/$defs/Digest"
        },
        "result": {
          "enum": [
            "Scheduled",
            "AlreadyScheduled",
            "AlreadyTerminal"
          ]
        },
        "beforeVersion": {
          "$ref": "#/$defs/Version"
        },
        "afterVersion": {
          "$ref": "#/$defs/Version"
        },
        "recordedAt": {
          "$ref": "#/$defs/Instant"
        }
      }
    },
    "CanonicalRecord": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "eventId",
        "source",
        "bodyDigest",
        "bodyBase64",
        "workVersion",
        "state"
      ],
      "properties": {
        "eventId": {
          "$ref": "#/$defs/Uuid"
        },
        "source": {
          "const": "urn:ecommerce:payments"
        },
        "bodyDigest": {
          "$ref": "#/$defs/Digest"
        },
        "bodyBase64": {
          "type": "string",
          "minLength": 4,
          "maxLength": 10924,
          "pattern": "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$"
        },
        "workVersion": {
          "$ref": "#/$defs/Version"
        },
        "state": {
          "enum": [
            "Pending",
            "Published",
            "ManualReview"
          ]
        }
      }
    },
    "PrivateFieldError": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "field",
        "code"
      ],
      "properties": {
        "field": {
          "enum": [
            "body",
            "query",
            "commandId",
            "paymentId",
            "confirmationId",
            "eventId",
            "limit",
            "cursor",
            "epoch"
          ]
        },
        "code": {
          "enum": [
            "Required",
            "InvalidFormat",
            "OutOfRange",
            "UnknownMember",
            "DuplicateMember",
            "InvalidValue"
          ]
        }
      }
    },
    "PrivateProblem": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "title",
        "status",
        "detail",
        "instance",
        "code",
        "traceId"
      ],
      "properties": {
        "type": {
          "type": "string",
          "format": "uri"
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "maxLength": 80
        },
        "status": {
          "enum": [
            400,
            401,
            403,
            404,
            405,
            406,
            409,
            413,
            415,
            429,
            500,
            503
          ]
        },
        "detail": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "instance": {
          "type": "string",
          "pattern": "^/internal/v1/",
          "maxLength": 256
        },
        "code": {
          "enum": [
            "Validation.Failed",
            "Auth.Unauthorized",
            "Auth.Forbidden",
            "Route.NotFound",
            "Method.NotAllowed",
            "Request.NotAcceptable",
            "Request.TooLarge",
            "Request.UnsupportedMediaType",
            "RateLimit.Exceeded",
            "Service.Unavailable",
            "Server.Error",
            "MappingConflict",
            "SourceMismatch",
            "RecoveryRequired"
          ]
        },
        "traceId": {
          "$ref": "#/$defs/Uuid"
        },
        "errors": {
          "type": "array",
          "minItems": 1,
          "maxItems": 10,
          "items": {
            "$ref": "#/$defs/PrivateFieldError"
          }
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "code": {
                "const": "Validation.Failed"
              }
            }
          },
          "then": {
            "required": [
              "errors"
            ]
          },
          "else": {
            "properties": {
              "errors": false
            }
          }
        }
      ]
    }
  }
}
```

CommandResult enforces the kind-specific result members. PaymentEvidence is a current owner observation, not a lock across RPC. Only held proof permits confirmation. Its fullCompensationCovered/noCapture predicates follow Phase 07, and integrityHold prevents treating them as permission. Capabilities reflects current primary-backed gates/epoch without provider I/O or account detail; unavailable primary returns503.

HoldView releaseId is required nonnull for ResolvedCommitted with integrityHold=false; all other current views require null. The owner retains the original release UUID immutably even if a later integrity hold suppresses it from the current view. A release already recorded at Commerce remains historical handoff evidence; later anomalies use explicit integrity containment. A tokenless Aborted DecisionView describes a proved never-admitted acquisition only; it is incompatible with a real hold and cannot be sent as ResolveConfirmation.

## Example: initialization and held proof

An illustrative command contains no provider credential/method:

```json
{"commandId":"11111111-1111-4111-8111-111111111111","kind":"InitializePayment","paymentId":"22222222-2222-4222-8222-222222222222","acceptanceEpoch":"33333333-3333-4333-8333-333333333333","data":{"attemptId":"44444444-4444-4444-8444-444444444444","orderId":"55555555-5555-4555-8555-555555555555","customerId":"66666666-6666-4666-8666-666666666666","reservationId":"77777777-7777-4777-8777-777777777777","compensationId":"88888888-8888-4888-8888-888888888888","sourceDescriptorId":"99999999-9999-4999-8999-999999999999","sourceFingerprint":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","amountMinor":5498,"currency":"USD","acceptedAt":"2026-10-01T10:00:00.000000Z","reservationExpiresAt":"2026-10-01T10:15:00.000000Z"}}
```

```json
{"confirmationId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","paymentId":"22222222-2222-4222-8222-222222222222","orderId":"55555555-5555-4555-8555-555555555555","reservationId":"77777777-7777-4777-8777-777777777777","token":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","captureFactId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","heldVersion":4,"state":"Held","decisionId":null,"releaseId":null,"integrityHold":false}
```

These values are examples, not stored fixtures or credentials.

## Semantic validation, errors and evolution

Require deadline>acceptedAt; amount exactly accepted Order total; unique attempt/Order/payment/case mappings; descriptor digest exact; root epoch known; terminal paymentId agrees with envelope; captureFactId names an admitted exact capture. NFC trim/control/UTF-8 reason limits remain Phase 07 rules. Results match original command/mapping; versions do not decrease; receipt amount/Order/refund match the admitted original receipt. A successful actor/key replay can return a historical refundId instead of a newly proposed UUID, and idempotencyReplayed must then be true; compare the original canonical public request. Decode canonical-event Base64 strictly, recompute SHA-256 over exact bytes and validate Phase 09/new schema; never reserialize to compare digests.

Private transport failures use the PrivateProblem schema below: sanitized RFC 9457 responses with existing common errors plus private MappingConflict/SourceMismatch/RecoveryRequired. 401/403 authentication/scope, 400 malformed, 404 missing, 409 same-ID/mapping/source conflict, 413/415 size/media and 503 transient/unavailable/recovery hold. A rejected TLS handshake may produce no HTTP response at all. An HTTP error is never an Applied receipt. Commerce exposes only the existing public catalog; private integrity errors map to Service.Unavailable, not new public codes or sensitive detail.

For PrivateProblem use type=urn:ecommerce:problem:<code>, traceId=X-Request-Id, instance=matched internal route template without IDs/query, and safe title/detail bounded by the schema. Common status/code wording matches Phase07; private conflict title/detail are “Inconsistent service state” / “The original service records require review.” RecoveryRequired uses503 and “Service unavailable” / “The original service records require review.” Validation.Failed alone carries errors. No provider/reason/body/mapping values appear in detail.

Known financial business rejection maps its original code/status; 503 and malformed/lost responses remain Unknown. Check receipt lookup/repeat original command for unknown commits. A 404 followed by a new command ID is prohibited.

Commerce builds the original public Problem Details using its public route template/server X-Request-Id and existing exact wording. It never forwards an internal instance, private code/detail, certificate diagnostic or raw peer response to the client.

v1 objects are closed. Additive field or enum changes require a compatible optional reader policy explicitly agreed first or a v2 route/schema; do not silently mutate v1. Use consumer-before-producer rollout for a reviewed new version; retain old adapters through all durable commands/receipts and maintenance rollback. No forced shared release is a prerequisite for ordinary compatible owner changes.
