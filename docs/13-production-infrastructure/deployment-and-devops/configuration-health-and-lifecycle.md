# Configuration, Health and Process Lifecycle

## Configuration boundary

Retain existing named validated owner Options from [Phase 10](../../10-microservices/deployment-and-devops/configuration-and-operations.md) and [Phase 11](../../11-distributed-system-reliability/deployment-and-devops/configuration-and-operations.md). Bind through one explicit boundary; no scattered environment reads or shared secret owner.

Nonsecret defaults remain in application configuration; exact environment overrides and read-only secret references supply endpoints/certificates/keys. Protected ConfigMap/Secret references are versioned in the release inventory. Never print effective configuration.

| Concern | Startup/admission validation |
| --- | --- |
| Artifact/schema/protocol | Exact approved digest, supported original versions and current owner/grant identity |
| Financial source | Original StripeSandbox account/API/method descriptors; simulator rejected outside isolated Development; live/raw-card flow prohibited |
| Epoch | Process freezes configured active deployment epoch; stale process cannot adopt a newly read epoch |
| Database | Own CONNECT/schema, bounded data sources/pools and original wait/deadline profile |
| Private transport | Exact HTTPS peers/CA/SAN/EKU/scopes, original three breaker classes, retries0/hedging disabled |
| Owner work | Original ten observations/300s cycles/jitter/due/lease and hold/barrier/release rules |
| Gateway/source | Original route/header/body/error/source/CORS/Admin contract |
| Messaging | Original routes/TLS/grants/confirm/manual ack/prefetch10 Notifications versus20 hints |
| Telemetry/recovery | Bounded privacy/series/export/retention and original paired-v3 inventory |
| Resources | Actual process/pool/request/limit/platform profile; optional accelerations disabled |

Missing/unsafe configuration denies readiness/affected capabilities with sanitized fixed diagnostics. Divergent replica quotas/source/trust/scheduling policy blocks reopening.

## Existing health contract

Keep restricted `GET /health/live` and `GET /health/ready` with only 200 `{"status":"ok"}` or503 `{"status":"unavailable"}`. No public health route, schema/epoch/queue/account detail or additional health DTO is added.

Startup proof establishes loaded valid local configuration/process management responsiveness. Readiness verifies current own primary/schema/epoch and required local lifecycle; primary query≤1s using original bounded API resources. Liveness checks responsive process only.

Do not make broker/provider/peer/Gateway/telemetry reachability a liveness dependency. Their failure is separately exposed capability/owner admission/alert state. Primary outage makes local readiness unavailable without forcing a restart storm of responsive processes.

## Probe profile

| Probe | Candidate timing / rule |
| --- | --- |
| Startup |5s cadence, at most24 failed observations/120s startup allowance, each action≤2s |
| Readiness |5s cadence, failure threshold2, success threshold1, action≤2s, primary part≤1s |
| Liveness |10s cadence, failure threshold3, success threshold1, action≤2s; after startup |
| Termination grace |30s total, includes hook and original≤15s application drain |

Actual controller/endpoint propagation delays must be measured; these settings do not promise instantaneous traffic withdrawal.

Probes use an image-contained reviewed HTTPS client over the original restricted local management listener, validating CA/SAN and returning only bounded exit status. Choose/prove its actual image implementation before deployment. Kubernetes built-in HTTPS probe behavior must not be described as server-certificate validation; a trust-skip client does not meet this project policy. See [Kubernetes probe semantics](https://kubernetes.io/docs/concepts/workloads/pods/probes/).

No probe holds a connection over network or creates a new uncounted pool. Management endpoints do not consume retail quotas. Privileged public/private financial listeners are never used as unauthenticated health targets.

## Startup and capability admission

Start management responsiveness while affected business admission/dispatch remains closed. Check current store/source/epoch/identity/grants and local worker lifecycle before readiness. Workers use original claims; startup never clears pending work.

Commerce retains its existing advisory Payments-capability check≤once/5s/r, jittered2s through original read slots. Age>10s or known unsafe/unavailable closes derived sandbox admission; operator hold takes precedence. Positive health cannot replace actual payment/hold/stock proof.

Payments starts replacement dispatch disabled until [executor handoff](rollout-rollback-and-executor-handoff.md) establishes old-egress fencing. Pod readiness alone cannot release financial dispatch.

## Graceful shutdown

1. Enter attributed affected admission containment; mark local readiness unavailable.
2. Stop new claims, action scheduling and consumer deliveries; do not accept a new provider send.
3. Cancel/drain bounded in-flight work≤15s. Finish safe local commits; dispatched timeout/cancellation stays original Unknown.
4. Close owned channels/connections/pools and terminate the process. Record actual runtime state.
5. Verify old possible egress and process death before enabling a financial successor.

preStop must not call a public state-changing endpoint or sleep indefinitely. A minimal hook may signal local drain; its time counts inside30s grace. SIGTERM must reach the owner process; force-kill still needs original lease/possible-send recovery.

## Configuration and secret changes

Treat materially changed configuration/secret/trust as a reviewed release, not an unversioned mutable file edit. Verify reload versus restart semantics; preserve exact supported reader overlap and revoke affected existing connections.

Automatic secret-volume propagation does not establish application reload or provider/executor fencing. Keep prior compatible configuration references for rollback and current external keys for restore.
