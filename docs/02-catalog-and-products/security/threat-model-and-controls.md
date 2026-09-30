# Catalog Threat Model and Controls

**Status:** security requirements for Phase 02. The [Identity phase](../../01-identity-and-auth/security/threat-model-and-controls.md) owns credential validation and restricted Admin access; Catalog owns the product-publication boundary.

## Assets, actors and trust boundaries

| Asset or boundary | Threat | Required control |
| --- | --- | --- |
| Draft, Hidden, Archived products and Inactive categories | Public discovery through detail, search, counts, cursors, timing or errors | Apply both status predicates in the SQL statement; use the same 404 for absent and nonpublic product detail; return no total count or inactive-category distinction |
| Current price and publication state | Client-supplied price, stale cache or unauthorized edit changes checkout truth | Catalog stores current USD cents under DB constraints; Admin edits require current session and ETag; later checkout re-reads authoritative catalog state |
| Admin mutation routes | Stolen token, Customer token, revoked session, or spoofed proxy header | Phase 01 JWT and primary-DB session validation; restricted Admin source network; transaction-time shared user/session locks; trusted-proxy configuration only |
| Query and cursor input | SQL injection, expensive query, forged/tampered cursor | Parameterized SQL; bounded normalized filters; HMAC cursor verification before trusting fields; 50-item page cap and query deadline |
| Product text | Stored HTML/script or log injection | Treat text as plain data; encode in each downstream output context; restrict controls; use structured logs without raw description/query payloads |
| Audit and diagnostics | Leaked tokens, hidden product text, actor identity or database details | Whitelist audit fields, limit operators, avoid request/response body logs, use bounded event labels and sanitized errors |

Public product IDs and SKUs are not secrets; their visibility is. Do not fetch an unrestricted product then rely on a later application filter. Public detail, list and search must all evaluate Published product and Active category together in PostgreSQL. Category deactivation changes the result of new statements as soon as its transaction commits. An in-flight statement may legitimately return its earlier snapshot; the contract says so rather than promising instantaneous cancellation of a response already being produced.

## Authorization and privilege

Perform Phase 01 authentication, Admin role check, and source-network check before Admin target lookup, so a Customer cannot use Admin 404/409 differences to enumerate drafts. For writes, recheck the authoritative Admin user and session while holding their `FOR SHARE` locks inside the same transaction as the catalog mutation. Revocation/reset takes conflicting locks. Deny if identity is unavailable. API authorization is necessary even if the database credential can technically reach catalog tables.

The database API role has no catalog DDL or DELETE. Grant catalog SELECT, the required category/product INSERT/UPDATE columns, and audit INSERT only. Do not grant audit UPDATE/DELETE. A separate migration owner applies reviewed schema changes; an operator role inspects audit and restores. Review actual grants for the installed schema before release. Rely on database uniqueness/check constraints as a second boundary for slug, SKU, price, currency and category relationship.

## Input, output and secrets

Validate UTF-8, NFC, scalar/byte lengths, slug/SKU grammar, exact JSON fields, price integer/currency, UUIDs, ETags, and query/cursor size before using values. Reject duplicate JSON or query keys. Bind every filter as a parameter, including `q`; never build `tsquery` or SQL syntax with user text. An English search term can still match unexpectedly because of stemming and stop words; that is documented product behavior, not authority to return hidden rows.

The cursor MAC is an integrity check and expires after 15 minutes. Its payload includes filter and last name/ID in Base64url, so it is **readable** by the client; do not put secrets, audit data, or Admin-only fields inside it. Use a 32-byte or stronger random signing secret in a protected file shared by replicas, verify MACs in constant time, and compare endpoint/filter fields after verification. Rotation either accepts an explicitly bounded prior key during overlap or invalidates outstanding cursors; it cannot silently accept unsigned data.

Return `Cache-Control: no-store` on all catalog results and problems. Configure the edge to honor it and avoid response-body logging. Text displayed in HTML, email, CSV or other later contexts must be encoded/escaped for that context. Catalog does not accept media uploads or external URLs in this phase, so no remote fetch or file path is needed.

## Abuse and investigation

The 50-item page cap, 320-byte search cap, Phase 01 two-second database statement timeout and 100-concurrent-request-per-replica budget bound individual work. Monitor public search rate and query duration by route/status class; if abuse is observed, add a measured ingress/admission policy that works across replicas rather than an unsynchronized per-process counter. Do not weaken visibility predicates to reduce query time.

Record Admin catalog mutations with actor UUID, server request ID, operation, entity/version and whitelisted before/after catalog state in the transaction. Restrict audit access and backup exports. Log denied Admin calls with route template and outcome, without bearer token or hidden record details. Investigate a suspicious change by correlating the request ID to the audit row and Identity's session/audit records using operator access.

## System Design Prerequisites & Concepts to Learn

Study authorization at object and state boundaries, SQL parameterization, output encoding, signing versus encryption, and least-privilege database roles. Attempt to retrieve a hidden product through every public route and a forged cursor, then inspect response, SQL plan, access log and cache headers for disclosure.
