# Scalability Failure Matrix

All failures preserve [Phase 11 recovery rules](../../11-distributed-system-reliability/reliability-and-failure-scenarios/failure-matrix.md). Capacity pressure never authorizes stale money/stock/visibility, a new provider key, a hold expiry or evidence deletion.

| Failure / pressure | Required behavior | Verification |
| --- | --- | --- |
| Generator cannot achieve schedule | Count dropped iterations/actual offered rate; no server capacity claim from reduced demand | V01–03 |
| Auth login/refresh/source limit | Original 429/rotation/privacy; setup and source-group plan corrected, not token/authority bypass | V04–06 |
| Shared quota exhaustion/boundary burst | Original allowance/Retry-After, finite execution, same total across replicas | V05/13 |
| App/DB pool/execution saturation | Original bounded 503; no task/semaphore wait queue or extra pool | V13–15/31 |
| Single stock/counter hot row | Preserve locks/balances/counter stages; conflict/timeout/replay classified separately | V11–12 |
| Same-key/cart/quote/publication race | Original canonical/version/current-price/visibility rules; no partial acceptance | V10–12 |
| Search broad term/sort spill/bad estimate | Original bounds/deadline; measure plan/statistics/resource limit | V07–09 |
| Maintenance/WAL/disk pressure | Stop optional load, preserve original warning/containment/resolution reserve and history | V08/31–33 |
| Third overlapping Commerce instance | Budget gate fails before deployment; no ordinary reserve borrowing | V13/34 |
| Duplicate worker/stale lease or epoch | Existing token/version/process-epoch rejection; original remote possible effect retained | V14–16/34–36 |
| Relay arrival exceeds 10 attempts/sec | Required outbox debt visible; fail sustainable tier, tune/compare approved workers | V16/29 |
| Broker unavailable/queue full/DLX blocked | Retain canonical outbox, reliable parking/backpressure, finite retry/review | V29–30 |
| Consumer ack/confirm lost or duplicate/out-of-order hint | Original identity/bytes/sink receipt and actual owner evidence; no financial authority | V15/29–30 |
| Optional cache unavailable/cold/evicted | Bounded primary fallback or original 503; no stale/negative authority | V17–19 |
| Optional cache key/MAC/schema/namespace mismatch | Treat as untrusted miss/integrity alert; no body leakage | V18/20 |
| Old cache fill after hide/price/category edit | Exact current primary guard/version; old key cannot replace new version | V18/20 |
| Cache fallback overload | Existing pool/admission/fill limit, no retries/unbounded miss queue | V19/21 |
| Primary unavailable while cache has data | No fresh publication/price/authority permission; unavailable | V19/21 |
| Optional standby lag/stopped replay/read conflict | Fence/fresh snapshot requirement; bounded fallback/unavailable, no stale control | V22–24 |
| Standby wrong source/timeline/epoch | Contain optional reads; no LSN-only proof or promotion | V24–25 |
| WAL slot retention threatens primary | Disable optional path, reviewed slot/rebuild procedure; protect primary history/capacity | V23/25/31 |
| Primary unavailable but standby responds | No new positive business permission/automatic failover; original restore procedure | V24/35 |
| Candidate partition absent/wrong mapping | No partial business/audit/outbox commit; contain, inspect complete destination/constraints | V26–28 |
| Time partition loses global UUID uniqueness | Reject proposal/cutover; cannot change ID/cursor/event semantics | V27/34 |
| Partition copy/rename dependencies wrong | One writer remains contained; exact FK/view/grant/ORM inventory before reopen | V28/34 |
| Restore reuses old cache/standby namespace | Rotate derived namespace/rebuild standby; original owner history only | V20/25/35–36 |
| Provider scan/window/calls cannot support retained volume | Stop growth, preserve original quota/keys/R/holds; no fabricated success | V16/33/36 |
| Diagnostics fail/cardinality explodes | Bounded export, missing evidence alert; business audit remains mandatory | V37–38 |
| Backup/restore cannot meet data-tier objective | Reject unsupported growth; report Failed RPO/RTO and retain containment | V35–36 |

Vxx means SCL-Vxx in [verification](../testing-strategy/verification-scenarios.md). Optional failures become runtime obligations only after approved prototype/adoption; before that their evidence is Not run.
