# Scalability Threat Model and Security Controls

## Boundaries and assets

Protect primary authority, stock, money/coverage, original IDs/windows/receipts/decisions/events, owner credentials, paired recovery evidence and process epochs. Existing private sandbox account/Admin/network model remains; more users do not authorize public identity expansion.

Additional proposed boundaries are generator→edge, optional cache→materialization consumer, physical standby→protected inspector and isolated partition copy→migration authority. None is active by default.

## Threats and required controls

| STRIDE category / threat | Control / failure behavior |
| --- | --- |
| Spoofing: generator forges effective source | Actual socket/trusted proxy rules, IPv6/64 normalization, protected proof of distinct sources; untrusted forwarded header ignored |
| Spoofing: cache entry mimics current version | Closed bounded shape plus key/namespace/producer MAC; primary publication/price/version guard; reject as miss |
| Spoofing: wrong standby presents high replay LSN | Source-cluster/timeline/current owner epoch identity plus authenticated fixed peer; no LSN-only permission |
| Tampering: prototype alters stock/money/proof | No raw state editor; owner-local authorization/locks/audit; fake provider facts forbidden |
| Tampering: time partition weakens uniqueness | Global identity/FK/receipt/source-ID checks and negative duplicate-ID cases before adoption |
| Tampering: stale cache survives restore | Disposable namespace rotates, integrity-key version reviewed; original owner data rebuild only |
| Repudiation: load/adoption lacks attribution | Protected plan/proposal bytes/digest, actual operator/reviewer/context/time, complete failed/aborted outcome |
| Repudiation: required business audit omitted for speed | Original mutation/access/repair audit remains transactional; failed audit aborts effect |
| Information disclosure: whole-page/private cache | Public descriptive-only candidate; no addresses/customer/token/provider/financial/Admin fields |
| Information disclosure: standby contains both databases | Protected storage/host/network/replication privilege; separate CONNECT/schema grants and no Commerce access to Payments data |
| Information disclosure: report dumps source/session identifiers | Source-group counts/fingerprints only; protected actual-address evidence separate; no tokens/raw IP/email in artifacts/metrics |
| Information disclosure: telemetry/query plans leak payload | Sanitized fixed operation/route/SQLSTATE, no raw SQL values/body/key/reason/addresses; protected plan evidence |
| Denial of service: quotas become per-replica | Shared primary counters, fail-closed errors, fixed total window/actor allowance |
| Denial of service: cache stampede/fallback | Bounded calls/fills/local map/primary admission; no unlimited distributed fill lock or retries |
| Denial of service: many search/cache keys | Original bounded search/page/cursor; no page/query cache candidate; maximum memory/entry/map enforced |
| Denial of service: standby slot/long query bloats primary | Bounded read/fence/slot horizon; optional path disabled before primary disk threat |
| Denial of service: partitions/consumers/pools unbounded | Fixed declared topology/budgets, complete parent/child/index/session inventory and gate review |
| Denial of service: generator/chaos escapes scope | Isolated environment/source/account proof, bounded rate/duration/stop plan and explicit targets |
| Elevation: run JSON claims authority | Approval/current operator capability outside JSON; plan does not provision resources or grant roles |
| Elevation: replication/runtime gets superuser | Narrow protected replication/inspection capabilities; no ordinary runtime superuser/cross-owner SQL |
| Elevation: cache/replica promotes financial permission | Primary-only Identity/stock/money/control; hints/read copies cannot grant confirmation/fulfillment |

## Existing application controls

JWT 300s, rotating refresh in JSON-Bearer, fresh primary session authority, mutually exclusive Customer/Admin roles, restricted Admin network, operator-assisted sandbox recovery and original hashing/abuse controls remain.

Original TLS/mTLS peer scopes/trust/rotation, webhook raw signature/size/freshness, exact account/object/USD/amount verification, one provider executor, durable gates, original command authority and deployment-epoch fencing remain binding.

No MFA/reset/email verification/live payment/customer card entry/new public operational endpoint is introduced. Existing CORS/headers/no-store/privacy/error precedence remain.

## Secrets and optional infrastructure

No credentials, keys, certificates, sensitive connection strings, raw provider/callback body or private data are committed. Existing named Options/secret references supply environment values. A future cache-integrity key is separate from JWT/cursor/quota/provider secrets and is created only for an approved implementation.

Cache ACL commands/namespace, fixed private endpoint/TLS and supported client/server patch/license review are required. Standby replication access is privileged cluster access even if runtime only reads Commerce; review the host threat model and encrypted backup/storage.

Prototype schemas are restricted to isolated clones/migration operators. Application/worker credentials cannot write/read a performance copy as authority. No arbitrary filter/table/SQL input in protected tooling.

## Security experiments and stop conditions

Verify cross-Customer denial under load, revoked role/session, trusted source boundaries, cache poisoning/MAC/namespace mismatch, standby identity/lag/grant denial, global dedup/PK violation and operator/audit failure.

Abort on actual live account, second executor, unexpected provider effect, negative stock, lost original authority/history, credential exposure, violated permission or unsafe disk. Contain original scope and preserve evidence; a large successful request count cannot offset one security/financial violation.

Capacity evidence contains no secrets and does not weaken current limits to make a graph attractive.
