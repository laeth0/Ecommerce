# Infrastructure Failure Matrix

Retain [Phase 11 recovery rules](../../11-distributed-system-reliability/reliability-and-failure-scenarios/failure-matrix.md). Safety is binding even when release, availability or RTO fails.

| Failure | Required behavior | Verification |
| --- | --- | --- |
| Wrong/tampered image or release plan | Reject promotion; exact source/digest/target/current approval required | V01/18/45 |
| Untrusted PR gains publish/runtime secret | Stop promotion, revoke affected scope and inspect actual changes/effects | V02–04/44–45 |
| CI/private artifact entitlement unavailable | No spend/unsafe privilege fallback; explicit Not run and local protected review boundary | V04/45 |
| Host profile cannot fit platform/data/apps | Reject profile; do not call a smaller unreported envelope the original benchmark | V05/33–35 |
| CNI does not enforce policy | Dependent secure topology cannot qualify; no namespace-only isolation claim | V06/44 |
| Image pull/config/CRD fails | Affected gates stay closed; verify approved digest/version/target, no arbitrary tag | V01/17–19 |
| Wrong/empty PV mount | Refuse writer initialization; inspect retained root and original inventory | V07/26 |
| PostgreSQL unavailable | No new owner authority; readiness unavailable, responsive liveness remains; bounded original failures | V17/19/25 |
| Broker unavailable/full | Original outbox retention/backpressure and finite replay; no lost-source success | V22/28/41 |
| Provider unavailable/circuit open | Original durable gate/recovery/coverage/hold; no blanket unrelated Commerce restart | V22/29/32 |
| Telemetry/metrics unavailable | Explicit diagnostic gap; no business proof/zero-debt inference; optional scaling stopped | V35/37/46 |
| Unknown/inaccessible public route or private path | Original retail error or bounded nonrouting denial; never internal/management authority | V09/12/44 |
| Backend certificate wrong/expired/revoked | Fail closed; original CA/SAN/role/epoch and terminated affected connections | V11/16/43 |
| Source spoofing or NAT collapse | Original trusted-source policy; no fabricated groups/Admin access | V13/44/47 |
| Callback modified/oversized/duplicate | Original raw signature/parser/durable receipt rules, no capture inference | V10/14 |
| Gateway timeout/reset after forwarded mutation | Original Unknown/key/receipt recovery; no automatic POST retry | V12/14/29 |
| Duplicate/concurrent release/migration | Exact operating lock/migration history and inspected actual outcome | V18/23/28 |
| Incompatible reader/schema | Keep readiness/writer/admission closed; compatible rollback or reviewed roll-forward | V20/24–25 |
| Old Commerce termination stuck | Count all pools/processes; no third full process; suspend rollout/HPA | V19/21/30/36 |
| Old Payments/node death unproved | Close successor dispatch until actual process/egress fence; lease/API deletion insufficient | V08/29–32 |
| Force-kill after possible provider send | Retain original possible-send/window/R/hold; retrieve original evidence | V29–32 |
| HPA metric stale/missing or scheduling Pending | No unsafe scale-up; retain current accepted work and budget | V34–36 |
| HPA/release both write replicas | Suspend/remove scaling owner before rollout; inspected original plan only | V21/36 |
| Host/image/WAL/temp disk exhausted | Original stricter admission containment/reserve; no evidence deletion or reserve borrowing | V05/27–28/35 |
| Secret projection updated but client retains old session | Prove reload/restart and terminate revoked connections; no file-only trust | V16–17/31/43 |
| Backup job duplicate/skew/owner archive corrupt | Whole pair unusable; actual four-connection/serialization proof | V28/38/42 |
| Host loss with only host-local archives | Off-host recovery not established; disclose failed/Not run recovery, no HA claim | V07/38/42 |
| Asymmetric restore loses Consume/authority/earliest-send | Hold unsafe scope; no reconstructed permission from copied release/event/log/provider | V39–43/48 |
| Broker message ahead of restored canonical source | Original quarantine and source inspection; no financial/Order effect | V41/48 |
| Current secret/decryption material unavailable | Recovery blocked and contained; no insecure trust/key substitute | V38/42–43 |
| Reopen/rollback time objective missed | Record Failed time objective; safe current-store verification still required | V20/39/46/48 |

Vxx abbreviates INF-Vxx in [verification](../testing-strategy/verification-scenarios.md). All runtime branches remain Not run until executed against the declared isolated compatible target.
