# Infrastructure Incident and Recovery Runbooks

All actions require current protected authority, exact target/release/source and bounded attributed evidence. Follow [Phase 11 owner runbooks](../../11-distributed-system-reliability/deployment-and-devops/incident-and-recovery-runbooks.md) for financial uncertainty. Do not introduce generic state editing or automatic hold clearing.

## INF-RB01 — Failed release, image or readiness

**Trigger:** rejected image/configuration, failed probe/route or maintenance budget overrun.

1. Keep affected admission contained; retain exact release digest/target/generation and actual old/new process/pool state.
2. Inspect fixed sanitized image/config/schema/source/epoch/trust/resource failure. Distinguish responsive/unready from dead process.
3. If apply was ambiguous, inspect actual resources; do not switch to an arbitrary mutable tag.
4. Use the reviewed compatible current-store rollback or contained roll-forward. Payments replacement requires RB02.
5. Verify original receipts/work/constraints/grants/probes/negative paths before reopening.

**Stop/reopen:** unknown accepted history or incompatible reader blocks reopen. Record real maintenance/valid-request outage, including failed rollback.

## INF-RB02 — Old executor or node death unproved

**Trigger:** partitioned node, forced Pod deletion, possible second Payments process or provider timeout during replacement.

1. Close new affected financial admission/dispatch/fulfillment through original owner gates.
2. Preserve original possible-send/key/params/earliest-send/window/R/hold evidence.
3. Verify old host/runtime/process and terminate its provider egress/active access through protected host/network/physical fence.
4. Pod API deletion, lease expiry or NetworkPolicy alone is insufficient. If the fence cannot be proved, leave successor dispatch disabled.
5. Start only one successor, reconcile original Unknown through original account/rate/receipt rules.

**Stop/reopen:** actual single-executor/account/invariant proof and resolved integrity/source gate required. No new provider key, restarted23h window or blind refund/hold release.

## INF-RB03 — Gateway, source or certificate failure

**Trigger:** route/TLS mismatch, callback signature fails only through edge, public internal path, spoofed effective source or expired certificate.

1. Contain the affected listener/capability; do not disable verification or open private ports.
2. Inspect exact pinned route/backend references, original raw bytes/headers and approved CA/SAN/role/epoch/source hop inventory.
3. Revoke/rotate exposed key or fix compatible config under reviewed release; terminate affected active connections.
4. Verify original callback/Problem/method/no-store contract and negative-source/private paths.

**Stop/reopen:** trusted route/source/identity and required owner proof restored. Failed webhook transport never implies payment failure or permits fabricated capture.

## INF-RB04 — Resource, disk or scaling pressure

**Trigger:** pool/process>budget, Pending/OOM/ephemeral disk pressure, sustained backlog or HPA churn.

1. Stop optional offered load/HPA and new unsupported affected admission; preserve recovery/observation/compensation reserve.
2. Count actual old/new/terminating/orphaned processes, all enabled pools, requests/limits and host/VM/disk consumers.
3. Inspect primary/hot locks/WAL/provider/queue/scan before adding execution capacity.
4. Apply only an admitted compatible profile; no third Commerce process, reserve borrowing or second provider executor.

**Stop/reopen:** original disk/process/resource/latency/work bounds and exact owner state. Never delete retained history or empty parking to make a chart green.

## INF-RB05 — Migration, wrong mount or persistent dependency

**Trigger:** interrupted/duplicate DDL, missing/grant-invalid store, empty mount, PostgreSQL/broker data failure.

1. Contain affected writers; fence financial dispatch as necessary. Do not initialize a new store at an unknown mount.
2. Inspect exact data-root/migration/schema/grant/history and old process state through protected original roles.
3. Resolve actual DDL outcome before retry; use current-store compatible rollback or safe roll-forward.
4. If accepted history is lost/corrupt, use RB06 integrated recovery.

**Stop/reopen:** complete owner inventory/constraint/grant/protocol proof; a valid PVC or ready database alone is insufficient.

## INF-RB06 — Host/cluster loss and paired restore

**Trigger:** unrecoverable host/data loss or invalid owner history.

1. Start recovery clock; fence old host/provider egress and contain all unsafe scopes.
2. Authenticate actual off-host paired-v3/current keys and exact compatible platform/artifact inventory.
3. Rebuild/restore isolated targets; follow every [integrated restore step](backup-and-restore.md).
4. Revoke restored sessions, rotate active epoch and reconcile original provider/decision/stock/broker source asymmetry.
5. Record actual RPO/RTO and missing history; do not reopen on elapsed time.

**Stop/reopen:** original authenticated authority/possible effects/account/process/grant invariants satisfied. Missing Consume or unmapped provider orphan keeps affected one-merchant scope closed.

## INF-RB07 — CI, secret or deployment compromise

**Trigger:** untrusted job had credentials, artifact/provenance mismatch, unsafe target or secret exposure.

1. Stop promotion and affected unsafe dispatch/access. Preserve protected plan/source/digest/audit evidence.
2. Revoke compromised publication/cluster/runtime credentials according to actual scope; inspect unauthorized workload/role/secret changes.
3. Verify original source/account/history; unexpected provider effects follow owner incident recovery.
4. Rebuild from a reviewed trusted input, rotate trust/current material and prove active-connection revocation.

**Stop/reopen:** attributed exact artifact/target/permission and financial/history integrity established; a rerun green build is not enough.

## Evidence discipline

Every runbook records current actor/time/target/release identity, original before/after owner or process proof, measured timings, remaining unknowns and explicit reopening guard. Diagnostics remain sanitized; no credentials/raw provider/customer data are copied into incident summaries.

No alerts/messages, operational commands, delete/prune, financial repair or release are executed by this documentation task.
