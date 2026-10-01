# Monolith Threat Model and Controls

**Status:** implementation security requirements for the private sandbox. This phase is not a public account, live-payment or compliance-certification design. Inherit [Identity controls](../../01-identity-and-auth/security/threat-model-and-controls.md) and [financial controls](../../07-payments-and-refunds/security/threat-model-and-controls.md).

## Assets, attackers and boundaries

Protect passwords/hashes, signing/refresh/provider/webhook/cursor/counter secrets; current identity authority; customer purchase/address snapshots; stock and financial invariants; immutable audits/receipts; backup plaintext; diagnostic storage and operator privileges. Potential attackers include unauthenticated flooders, another Customer, a stolen restricted Admin token, forged callback/proxy headers and a compromised diagnostic/deployment account.

Boundaries are client→HTTPS edge, edge→host, host→primary, operator→deployment/recovery, financial executor→Stripe, callback→verified inbox and application→telemetry backends. An internal network is not equivalent to authorization. Diagnostic access cannot authorize domain writes.

## STRIDE controls and acceptance

| Threat | Concrete risk | Required control and learning rationale | Acceptance evidence |
| --- | --- | --- | --- |
| Spoofing | Forged/stale JWT, restored sessions, forged forwarded IP | Original explicit issuer/audience/algorithm/key checks plus current primary authority; trusted KnownProxies/hop limit and network-restricted Admin | Expired/revoked/disabled/restored sessions and forged IP fail; no primary-outage fallback |
| Tampering | Caller prices/versions, replaced trace/key, financial repair from dashboard | Existing strict schemas, expected versions, owner locks/constraints, immutable keys/facts; diagnostic context has no authority | Reject extra fields, mismatched replay/version and attempted telemetry-driven paid/stock writes |
| Repudiation | Admin/refund/recovery action lacks attribution | Existing transactional owner audit with required reason/request UUID; separate protected release/restore evidence | Missing required audit aborts effect; operator identity/reason and original repair/replay remain attributable |
| Information disclosure | SQL/header/body/address/reason/provider URL in Loki/Tempo; public metrics/backup | Producer allowlists, bounded metadata, private management/auth, protected encryption/backup roles | Search all exported signals/artifacts for synthetic secret/PII markers; management is unreachable publicly |
| Denial of service | Repeated search, signature/body work, pool flooding, high cardinality | Executing/body/pool limits, shared quotas, fair worker budgets and bounded telemetry queues | Overload stays bounded; accepted work remains discoverable; quota errors preserve contract/privacy |
| Elevation of privilege | Customer uses Admin/operator routes; compromised telemetry account edits finance | Mutually exclusive roles, owner checks, explicit grants; separate operator/runtime/backup/monitor identities | Cross-role/resource/DB privilege inspection shows no generic state writer or public recovery path |

Zero violations are tolerated; a fast benchmark cannot offset an authorization, secret or financial failure. Scope-changing identity features require later owner approval, not an implied “production” label.

## Authentication and administrative access

Keep Bearer access JWT plus JSON rotating refresh, secure password hashing/blocklist, fresh primary revocation/session checks and original absolute/idle lifetimes. No cookie authentication, browser credential persistence or impersonation is introduced. Never cache authority or use a replica to accept a session.

Customer/Admin roles remain mutually exclusive. Default Admin networks are loopback; reviewed private/VPN CIDRs are explicit and cannot be universal ranges. Trust only configured proxy addresses and one declared hop; edge overwrites incoming forwarding. Logout remains permitted from any source because it revokes. Revocation/reset/disable retain the original user-before-session write locks; business writes retain shared authority locks and fresh post-wait checks.

Operator-assisted recovery uses private sandbox fixture authority and existing attributed local commands. Its secret inputs do not appear in argv, history, logs or generated examples. A restricted Admin HTTP session is not an operator credential. Public email verification, reset and MFA remain outside this phase.

## Transport and untrusted input

- HTTPS at the edge, TLS to non-loopback database/telemetry links, verified certificates/hostnames. Exact trusted-host/proxy settings; no bypass validation. HSTS and `X-Content-Type-Options: nosniff` remain inherited. Do not expose debugging endpoints publicly.
- Exact CORS origins default none; preserve If-Match/Idempotency-Key and exposed response headers. No wildcard credentials. Allowed preflight has no resource or mutation; actual requests retain authority. CORS is not access control.
- Cookie CSRF tokens are unnecessary for the selected no-ambient-cookie API contract. If a later browser/cookie flow is selected, perform a new CSRF review. See [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- Retain per-route body/depth/member/string/page limits, no decompression expansion, duplicate/unknown member rejection and checked integer cents. Parameterize all SQL; use reviewed fixed templates for diagnostics and migrations.
- No user-supplied fetch URL, upload pipeline or arbitrary redirect is added. Provider/OTLP destinations are operator configuration; allowlist expected scheme/host, disallow redirects and metadata/private destinations outside the declared internal endpoint policy. Outbound egress is limited to required provider/telemetry/backup destinations.
- Render log content as escaped structured data; never interpolate untrusted text into HTML, LogQL, SQL or dashboard expressions. Free-text reasons stay restricted audit data rather than exported logs.

## Rate limits and failure handling

Use the [shared commerce quota contract](../functional-requirements/api-and-operating-contracts.md#shared-commerce-quotas) alongside existing Identity/Payments limits. HMAC subjects obscure source/actor values; the counter secret is separate from provider/cursor keys. Counters finish before business locks and are cleaned by the original owner. No in-memory fail-open counter path.

Bound raw webhook signature work inside the existing 20 callback/100 shared executing slots; only valid signatures consume the verified-destination quota. Preserve raw-body signature/clock checks, account/object/currency/mode verification and minimal durable inbox hints. Neither signed metadata nor a synthetic event alone proves capture/refund eligibility. Livemode/live credential configuration remains prohibited.

Denial responses disclose no target existence, bucket ID, primary error, credential/parser detail or sensitive schema data. Keep generic fixed Problem text and route-template instances. Diagnostic failure is isolated; a mandatory owner audit write is business durability and cannot be treated as expendable telemetry.

## Telemetry privacy and access

Filter at instrumentation before export and again in Collector/backend policy. Allow fixed event/outcome/state/operation, timings/counts, server request UUID and generated trace/span context. Business/customer/provider IDs, raw URL/path/query, headers, bodies, SQL statements/values, names/emails/addresses/SKU, idempotency/lease tokens, operator reasons and secrets are excluded. Exception messages can contain SQL/PII: export a fixed exception class/code and bounded scrubbed stack locations, never arbitrary `Message`/`ToString()`.

Loki's index labels are only configured service/environment; module/severity/request/trace/span/instance fields are searchable structured metadata. Override backend defaults that promote instance IDs/unbounded resource attributes. Metrics have bounded approved dimensions and no business/caller identifiers; configured replica slots distinguish cumulative streams. Tempo sampling is controlled by trusted configuration; clients cannot force recorded traces with `traceparent`/baggage.

Grafana viewers can investigate safe metrics/logs/traces; datasource credentials cannot mutate owner schemas or run arbitrary SQL. Dashboard editing/admin is separate from viewer access. Collector/Loki/Tempo/Prometheus have private ingress and appropriate network/proxy authentication; do not assume their ingestion APIs authenticate by default. Recovery audit/backup inspection remains a separate restricted privilege.

Privacy acceptance covers SDK, Collector, backends, edge, container logs, failed exports, metrics labels and evidence bundles. A forbidden marker causes hold on the affected diagnostic exporter, controlled removal/rotation and investigation; do not erase authoritative audit/payment facts.

## Secrets, storage and software supply chain

Use named validated Options and protected runtime secret injection. Never commit appsettings secrets, telemetry credentials, DSNs, keys, address-bearing dumps or provider payloads. Do not print effective configuration. Routine rotation retains only the owner's finite required overlap; compromise uses immediate revocation/hold/investigation. Restored database data is not the source of current provider/JWT/backup credentials.

Encrypt database, diagnostic and backup storage using environment facilities, with separate decryption access and off-host recovery material. Limit backup readers; a dump includes all customer and financial data. Protected release/backup manifests store secret **version references**, not values. Diagnostic retention is shorter than business retention and Loki is never immutable audit storage.

Pin supported stable runtime/packages/images at implementation. Use established build/dependency/container/secret scanning; examine applicable advisory severity and reachable exposure. Unresolved reachable critical/high findings block release unless a specific mitigated risk is accepted by the owner. Produce an artifact/dependency inventory. Runtime containers use non-root identity, least capabilities, protected writable data paths and no Docker socket; no arbitrary shell/debug ports in the public environment. Actual pipelines/images remain future implementation work.

## Incident acceptance

Given credential exposure, close affected source admission/dispatch, rotate/revoke, preserve original work/facts and reconcile unexpected effects. Given restored older identity state, revoke all restored sessions through owner procedures before reopening. Given exporter compromise, disable diagnostic egress without disabling primary authority or losing durable work. Record actual evidence and residual limitations; no PCI, public-identity or live-money readiness claim follows.
