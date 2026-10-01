# Orders Threat Model and Controls

**Status:** proposed Phase 05 controls. Reuse the [Identity threat model](../../01-identity-and-auth/security/threat-model-and-controls.md); Orders introduces no new credential transport or public financial authority.

## Assets and threats

| Asset/boundary | Threat | Required control |
| --- | --- | --- |
| Purchase/address snapshot | Another customer's history/destination disclosed or accepted facts rewritten | Owner-scoped reads/commands, narrow Admin detail, immutable columns/lines and protected backups |
| Lifecycle | Stale status edit, shipment before purchase confirmation, cancellation bypass | Explicit commands, expectedVersion, order lock, trusted proof and cancellation block |
| Payment/stock evidence | Forged paid flag, unrelated capture/reservation or simulator authority abused | No public mark-paid/proof fields, exact owner mapping, durable verified owner records and restricted simulation |
| Admin access | Stolen/revoked Admin token or source spoofing | Phase 01 network/JWT/session rules, transaction recheck and access/transition audit |
| Cursor/input | Cross-owner paging, tampering, injection or expensive queries | Actor/route/filter-bound HMAC, independent predicates, parameterized SQL and bounded bodies/pages |
| Diagnostics/audit | Address, names, tokens/provider secrets or unrestricted reason text leaked | Allowlisted audit, no payload telemetry, bounded labels and operator-only access |

## Authority and evidence

Customer access derives owner from verified subject; absent/other-owner detail/mutations return identical NotFound after authority. IDs and cursor signatures do not grant ownership. Admin authority permits only the declared fulfillment/cancellation/read actions on an allowed source network, not Customer impersonation or payment override. No owner selector, price/address edits, generic status PATCH or public creation/confirmation/completion endpoint exists.

Human writes acquire Identity user/session shared locks before Order, compare current role/source/session binding/version and fresh expiry after waits, then apply scoped guards. Revocation/reset takes conflicting locks. A request authorized before later revocation can finish its read snapshot; a write ordered after revocation cannot mutate. API error/audit paths must preserve owner isolation even when a lock fails.

Trusted coordinator operations load financial evidence through Payments and stock evidence through Inventory; a raw UUID/Boolean from an HTTP body is never proof. Match intent, order, owner, exact captured amount/USD and product quantities, and require actual Consumed stock for confirmation. A late capture for Cancelled/Failed cannot become a fulfillment authorization. Unknown payment cannot be relabeled failed/no-capture simply to finish cancellation. Capture/refund provider references and instruments never enter Orders public payloads.

Tagged simulated evidence is confined to an explicitly enabled isolated Development verification path, disabled by default and inaccessible to every HTTP caller/ordinary Admin. Startup must reject simulation enabled outside the permitted isolated mode. The later simulator/owner factories belong to Phase 06; actual provider proof belongs to Phase 07. A simulation-only pass cannot establish production purchase eligibility or provider integration.

## Input, snapshots and privacy

Reject unknown body/query fields, duplicate JSON/query keys, forged owner/price/status/evidence values, invalid UTF-8/UUIDs and out-of-range versions. Admin reasons use NFC/trim/scalar/byte/control checks before audit insertion. Bind all SQL values, including cursor positions/status; clauses and identifiers come from server policy. Signed cursor payloads are readable and must contain no address/name/price/provider payload. Revalidate authority and owner/status constraints independently of their signature.

Address and product text are plain data, not HTML or executable markup. Validate snapshot bounds/canonical form before persistence; encode in the output context used by a later client. countryCode grammar does not prove a supported/valid shipping destination; Checkout applies that later policy. Orders has no URL/file upload/remote fetch or carrier callback, so no network/file operation is needed from these strings. HTTPS, explicit CORS and the selected Bearer API security continue to apply.

Detail exposes only the snapshot needed for the owning Customer or restricted fulfillment/refund Admin. Summary lists omit address, lines and customer identifiers. Admin detail access commits a restricted access audit before responding; queue access logs one safe outcome without result lists. Routine Customer reads do not generate per-order read audit. Protect address-bearing database/backup exports and restrict operators. There is no public export/audit/history endpoint or automatic retention purge; a real-user retention/erasure policy must coordinate legal/history requirements before real data.

Transition audit contains actor kind/UUID for human actions or stable internal source ID, order ID, request ID, command, before/after status/cancellation/version, normalized Admin reason and time. It contains no full purchase/address snapshot, credentials or provider payload. Access audit contains actor/order/request/time only. Normal logs/traces use server request ID, route template, command/outcome, versions and duration; omit raw URL/query/cursor, Customer/product IDs, addresses, names, SKU, reasons and tokens. Metrics omit request/order/customer/source IDs and all unbounded values.

## Grants and abuse

API grants permit snapshot insertion and only mutable lifecycle/evidence/version/time UPDATE, with immutable line INSERT and audit INSERT. Deny parent/line/audit DELETE, snapshot/line UPDATE and DDL. Restrict migration/inspection identities; verify actual grants and FOR UPDATE/FK permissions against generated SQL. A database credential can reach owner tables inside the monolith but does not replace module-level authority.

Reuse bounded host admission/pools/deadlines, 50-item page cap and required Admin source restrictions. Monitor queue/history rate, conflicts, audit failures and lock/pool waiting; no new rate-limit datastore is introduced without observed abuse and a cross-replica policy. Required audit failure rolls back state rather than weakening accountability. Review [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## System Design Prerequisites & Concepts to Learn

Study object-level scope, trusted evidence versus client claims, immutable sensitive records and privileged read attribution. Use two Customers, restricted/unrestricted-source Admins and forged evidence/cursors in the [verification plan](../testing-strategy/verification-scenarios.md). Verify responses and persisted state together; a generic denial alone does not prove an address stayed private.
