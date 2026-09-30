# Inventory Threat Model and Controls

**Status:** Phase 03 security requirements. [Identity](../../01-identity-and-auth/security/threat-model-and-controls.md) owns credential and Admin-network controls; Inventory owns authority over stock mutations and reservation identity.

## Assets and trust boundaries

| Asset/boundary | Threat | Control |
| --- | --- | --- |
| On-hand and reserved counters | Unauthorized or unguarded write creates/sells stock | Inventory-only mutation methods, database checks, least-privilege grants and movement in the same transaction |
| Admin adjustment | Stolen/revoked Admin token, spoofed source, repeated request | Phase 01 Bearer/session/network checks; transaction-time user/session share locks; stable operation UUID and unique movement |
| Reservation group and intent IDs | Customer guesses another purchase ID or reuses an intent with different lines | No public reservation route; trusted Checkout validates customer ownership; compare expected intent, fingerprint and group state |
| Expiry worker | Worker releases a consumed group or scans arbitrary records | Worker selects due Active rows, locks and rechecks database time/state, writes only permitted terminal movement |
| Reason, diagnostic and ledger data | Secret/PII injection, log forging or unauthorized inspection | Bounded plain-text reason, control-character rejection, structured logs, restricted audit access, no raw request body logging |
| Database availability | Stale local count is used to approve purchase | Fail closed on primary PostgreSQL failure; no Inventory cache or local fallback authorizes stock |

The Admin HTTP endpoints authenticate/authorize and check the allowed source network before product or stock lookup. A Customer receives the same `403` for all Admin stock IDs. For an adjustment, revalidate the current Admin role/session under Phase 01 `FOR SHARE` user then session locks in the same transaction as the balance and movement write. An Admin logout/reset that commits first prevents the adjustment; if the adjustment commits first, its actor and operation are durable before revocation. Do not treat a JWT's signed role alone as live authority.

Checkout is a trusted internal caller, not a direct pass-through for client-supplied reservation IDs or quantities. Future Checkout must validate Customer ownership of cart/attempt and Catalog price/eligibility before calling Reserve, and must match the expected intent when consuming or releasing. Inventory checks sellability inside its own reserve transaction. A reservation UUID or intent UUID is a correlation key, never authorization. The worker has its own internal execution identity and cannot be invoked through a customer endpoint.

## Input and database boundary

Reject noncanonical UUIDs, duplicate fields, unexpected query/body content, noninteger/fractional/exponent quantities, zero or over-limit deltas, too many lines, duplicate products, malformed reason text, and oversized requests before expensive work. Normalize reason to NFC and trim; reject controls/newlines and cap at 256 scalars/1,024 UTF-8 bytes. Parameterize SQL and keep enum/reason strings separate from SQL syntax. Use checked arithmetic before every balance/version update; the database checks `0 <= reserved <= on_hand <= 1,000,000,000` as a second boundary. A valid negative adjustment that would invade reserved units is rejected, never silently clamped.

Grant API Inventory read/required writes and movement INSERT, without movement UPDATE/DELETE or table DDL. Grant the worker only the table/column access it needs for expiry and movement append; grant the reconciliation operator read-only access. The migration identity alone owns schema changes. Database grants reduce accidental or compromised paths, but code-level state checks still matter because a role allowed to update a counter can issue a logically wrong update. Review actual grants and attempts to bypass them on real PostgreSQL.

Stock movement reason and actor UUID are operational records, not public fields. Retain them with controlled access; do not log Bearer tokens, customer IDs, request bodies, raw intent IDs as metric labels, or free-text reasons. Log server request ID, route/operation class, outcome and safe entity/operation UUID where needed for investigation. Reconciliation reports should be access-controlled and omit customer data.

## Abuse and failure posture

The Admin body limit, 20-line reservation cap, two-second database statement timeout, 250 ms lock wait and bounded worker wake constrain one operation. A forged or repeated internal command cannot create a second movement for one committed source. If the database or Identity state cannot be checked, deny mutation; a cache, UI quantity or stale Catalog listing cannot substitute. Do not return private stock quantities through public errors, search, or Catalog responses.

## System Design Prerequisites & Concepts to Learn

Study least privilege, indirect object references, cross-module authority and state-machine validation. Try a Customer token on both Admin routes, a revoked Admin token during an adjustment, and a forged intent against another checkout context. Inspect database rows and logs as well as HTTP status to verify denial left stock unchanged.
