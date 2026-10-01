# Cart Threat Model and Controls

**Status:** proposed Phase 04 controls. The existing [Identity threat model](../../01-identity-and-auth/security/threat-model-and-controls.md) supplies credential validation, session rules, transport and trusted-proxy configuration. No new authentication scheme is introduced.

## Assets and threats

| Asset/boundary | Threat | Required control |
| --- | --- | --- |
| Customer intent | Cross-account read/edit, owner injection or Admin support impersonation | Derive owner from validated Customer subject; scope every parent/line query to it; no owner/cart selectors or Admin route |
| Mutation authority | Disabled/revoked session accepted after a wait | Primary Identity checks and user/session shared locks before parent; recheck expiry after all waits |
| Cart version/count | Stale clear, duplicate increments, concurrent cap bypass | Required expectedVersion, absolute setters, retained parent, parent lock and guarded atomic version increment |
| Catalog payload | Hidden product fields inferred from old cart or errors | Catalog-owned visibility projection; generic blocked lines with null payload; identical absent/nonpublic SetItem error |
| Money and stock | Forged client price/subtotal, cart-based stock allocation | Reject unknown monetary/stock fields; Catalog prices only, checked USD sums, no Inventory call |
| Input/database | Injection, duplicate JSON keys or resource amplification | Parameterized queries, canonical IDs, bounded body/quantities/lines, no arbitrary URLs/files or unbounded list APIs |
| Diagnostics/backups | Shopping history, credentials or internal errors leaked | No body dumps, sanitized problems, bounded telemetry labels, operator-only data access and protected backups |

## Authorization and transaction authority

All four public routes require Active Customer role and eligible session through the Phase 01 Bearer contract. Reject anonymous/invalid/revoked credentials with `401`; valid Admin role with `403`. Admin network restrictions still apply when validating an Admin token, but an approved source never grants Cart access. A Customer's identity cannot be chosen by request body/query/header, a raw cart key or an arbitrary Checkout caller parameter.

Public application flows pass the verified owner to Cart. Internal operations must receive trusted actor context established by the application coordinator; do not let a public wrapper replace it. Every SQL path, including delete, count, parent arbitration and version update, includes `customer_id=@verified_customer_id`. Composite child keys make owner-scoped access explicit. Database grants restrict module write capability but a shared API credential alone cannot distinguish which Customer is using it; application authorization is required on every operation.

For writes, Identity user/session `FOR SHARE` locks precede Cart parent and Catalog locks. Revocation/reset uses conflicting locks, giving a clear commit order. Recheck database-time expiry after waits. If Identity or required schema/database is unavailable, fail closed. Protected GET follows its authorization snapshot; a later revocation may occur after that read was authorized. A future Checkout flow must adopt the same authority/order rules and must not hold these locks while calling a provider.

## Visibility, validation and output

Stored cart lines have no product name or price snapshot to reveal later. Only current public Catalog projections supply SKU/name/unit price; nonpublic products retain an opaque ID/quantity and generic `Unavailable`. Category deactivation is visibility loss even if product version did not change. A new read may show later reactivation; an already-running snapshot may finish with earlier public fields. A missing required relationship is an integrity/dependency failure, not a reason to disclose hidden state.

Reject client-supplied price, currency, subtotal, status, customer ID, role, reservation or product text as unknown members. Parse integers losslessly before range checking; reject fractions/exponents, invalid version syntax, out-of-range values, duplicate keys and unexpected queries. Quantity zero is invalid; removal is explicit. UUID canonical syntax is validated without interpolating it into SQL. All database values are parameters; do not concatenate identifiers or clauses from input.

Catalog text is plain data. JSON serialization must escape it correctly; a later client must encode it for its HTML/display context. Cart accepts no HTML, uploads, remote URL fetch or file path. Bearer credentials are not cookies, so ambient-cookie CSRF is outside this selected contract; retain Phase 01 explicit CORS allowlists and token-storage controls. Do not use broad credentialed origins or browser-accessible logs to simplify development.

## Abuse, grants and privacy

Reuse the host's 100-executing-request limit per replica, shared pool and deadlines. The 20-line/100-unit caps and 16,384-byte mutation body bound work and amplification. Monitor sustained per-route request rate, conflicts and pool/lock waiting without introducing a new rate-limit store in this phase. A future abuse policy needs measurements and a cross-replica design; a process-local counter cannot claim a global limit.

The API role needs Cart SELECT/INSERT, required parent version/time and item quantity UPDATE, and item DELETE; it needs no Cart parent DELETE or DDL. Existing owner operations retain their narrow Identity/Catalog rights. Inspect actual grants and FK/locking permissions against real SQL. A migration role owns schema changes; an operator role has restricted read access for integrity/restore. No public cart-inspection, history export, operator-impersonation or repair route is introduced.

Routine Customer edits do not require a privileged-action audit ledger. Record bounded operational events with request ID, route template, command/outcome, before/after intent versions, changed flag, item count and duration. Do not log owner/session/product IDs, names, SKU, line quantities, full request/response, raw path/query, Authorization header or tokens in ordinary telemetry. Restricted operational inspection can view synthetic carts when needed; real shopping history requires an explicit privacy/access/retention policy before real-user operation. Metric labels exclude request/customer/product IDs and other unbounded values.

No-expiry persistence is the confirmed product policy, not a legal retention conclusion. Protect database/backups and limit their operators. Account disable denies access but retains intent. A future account-erasure policy must coordinate Identity/Cart/Orders and foreign keys under its own authorized scope.

## System Design Prerequisites & Concepts to Learn

Study object-level authorization, stale authority during lock waits, least privilege and visibility-based projections. Use the [verification plan](../testing-strategy/verification-scenarios.md) with two Customers and one Admin to reproduce owner injection, revoked-token writes, hidden-field probes and forged monetary input. Review [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) before implementation.
