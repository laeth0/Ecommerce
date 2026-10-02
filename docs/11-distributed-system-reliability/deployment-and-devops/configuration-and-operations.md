# Reliability Configuration and Operations

**Status:** design only; no executable config, dependency, deployment or credential is created.

## Existing environment

Continue ASP.NET Core/EF Core/Npgsql10, PostgreSQL18, supported pinned RabbitMQ, private end-to-end HTTPS/mTLS, Stripe sandbox and OpenTelemetry/Prometheus/Tempo/Loki/Grafana. Recheck supported patch/security status before implementation; do not silently upgrade runtime, provider API or schema versions.

The original Stripe API pin2026-09-30.endive and provider SDK policy remain under Phase07/10. Select any private HTTP breaker library only after reviewing its supported version, existing dependencies and actual configurable behavior. No mesh/Redis/workflow engine/chaos platform/Kubernetes is introduced.

## Named configuration boundary

Extend the existing [owner Options](../../10-microservices/deployment-and-devops/configuration-and-operations.md#named-options-and-fail-closed-validation). Keep nonsecret defaults in application configuration; endpoints/credentials/certificates/archive keys use established environment/deployment overrides and protected secret references.

| Owner/section | Required settings / validation |
| --- | --- |
| Both RetryScheduling | profile=rel11-equal-jitter-v1, max charged attempts10, max new backoff30s, min delay1s, cycle deadline300s, exact profile fingerprint; legacy reader enabled |
| Both Integration.PrivateTransport | Three fixed classes with caller/route mapping; RPC2s, retries0, hedging disabled, sampling30s/min10/ratio0.5/open30s/half-open1 |
| Commerce PaymentCoordination | Original slots2 command+2 read/r, ten observations, lease30s, original command/hold mapping and gates |
| Payments Confirmation/Provider | Existing finite barrier≤20/pass, no hold TTL, decision queries≤2, one executor/account5/sec/burst2/concurrency2/call2s/safe POST23h |
| Both Database | Existing own credentials/pools,1s/250ms/2s/3s budgets, active schema/epoch compatibility; no breaker pool |
| Both RecoveryTools | Narrow typed capabilities/target kinds, request≤2,048 bytes, page≤50, audited resume/replay/repair; operator pool total≤4 |
| Both Observability | Fixed instrument/class/state/reason allowlists,10% server sampling, bounded exporters and≤10k aggregate app series |
| Recovery | Original paired-v3 schedule/inventory/authentication/epoch fencing; include new scheduling/receipt fields |

Fail startup/readiness if required profile/schema/peer/identity/epoch values are incompatible, retries/hedging are active, pool budgets exceed the declared topology, provider is live/wrong account/currency or any hold TTL can grant permission. Breaker tuning is one reviewed profile; no runtime caller-provided thresholds or unversioned per-replica policies.

## Route/class assignment

- CommercePaymentCommands: initialization/closure/compensation/refund/hold commands, command receipt lookup and coordinator evidence/hold recovery.
- CommercePaymentReads: public financial/history reads and the existing advisory capabilities poll, within the existing read slots. Capabilities still uses its allowed coordinator principal; this class assignment does not broaden certificate scope.
- PaymentsCommerceDecisions: original confirmation-decision queries from the existing executor.

Protected outbox inspection/replay uses its existing recovery role/protocol and existing Checkout action slots. Assign its outbound RPC to CommercePaymentCommands; do not invent a fourth dynamic circuit.

The existing capabilities sample remains at most once/5s/r with jitter and2s bound; age>10s or known unsafe/unavailable closes derived sandbox admission. Breaker state can defer this check; it cannot keep stale positive capability alive. Operator containment takes precedence.

## Rollout and rollback

1. Review Phase10 entry evidence and exact deployed handler/schema/pool inventory.
2. Deploy compatible nullable metadata/receipt readers before activation; follow the [migration protocol](../database/leases-recovery-and-integrity.md#migration-and-scheduling-policy-activation).
3. Quiesce old scheduling writers, preserve claims/possible sends/due times and derive legacy cycle evidence. Unprovable start remains review.
4. Activate paired owner scheduling profile and record schema/config fingerprints. Verify original byte/receipt/window/count equality.
5. Enable finite private breaker profile under a declared isolated comparison; check error classification, actual outbound counts and no automatic retry/hedging.
6. Validate healthy public/private targets and bounded fault behavior before releasing the maintenance gate.

Compatible rollback can disable breaker admission, retain due/receipt metadata and resume the original durable work under guarded policy. It cannot run an incompatible old writer, reactivate the sealed monolith financial copy, reset attempt budgets or remove accepted receipts.

## Lifecycle and health

Startup verifies artifact/schema/owner credentials/epoch, supported protocol, original provider source/account and fixed peer identity while affected admission is closed. Workers start with original claims; no startup “clear pending” operation.

Liveness checks responsive process. Readiness checks local required primary/schema/epoch/configuration. Remote broker/provider/telemetry/circuit outages are separately exposed degraded capabilities and alerts; do not restart all Commerce replicas because Payments is down.

Graceful stop: stop new admission/claims/deliveries, cancel bounded I/O and drain≤15s, finish safe local commits, preserve unknown original work, close channels/pools. Forced termination still requires original lease/possible-send recovery. Provider executor replacement needs old process/egress fencing and one-account-executor proof.

## Routine operating checks

Daily: review expired cycles/oldest due, held/finalizing/review causes, command outcome ambiguity, deferred watermark progress, quarantine/parking, original scan≤24h, rate/slots/pools/disk, backup age/skew and certificate horizon. Compare actual runtime policy to its fingerprint; do not infer policy from a source default.

Before an operator resume, use [typed guards](../functional-requirements/recovery-and-operating-contracts.md); after it, inspect actual progress. Follow [runbooks](incident-and-recovery-runbooks.md) for uncertainty and [restore](backup-and-restore.md) for a disaster. No ordinary operation calls arbitrary SQL, resets provider windows or clears all holds.
