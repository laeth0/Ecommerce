# Checkout Threat Model and Controls

**Status:** proposed Phase 06 controls. Inherit the [Identity](../../01-identity-and-auth/security/threat-model-and-controls.md) and [Orders](../../05-orders/security/threat-model-and-controls.md) boundaries; no new public financial authority is introduced.

## Assets, threats and rationale

| Asset/boundary | Threat and concrete control | Cost/concept practiced |
| --- | --- | --- |
| Quote/address | Cross-customer access or changed accepted destination | Verified owner predicates, canonical immutable preview and restricted backups; sensitive snapshot retention |
| Submitted amounts | Forged total/currency, stale accepted price or hidden product | Body contains quoteId only; locked authoritative revalidation and exact arithmetic; explicit acceptance |
| Intent identity | Another actor's key interferes, replay becomes new purchase | Customer-scoped unique key plus canonical input; retained storage and replay semantics |
| Financial evidence | Public paid flag/scenario or unrelated capture permits fulfillment | Internal owner proof matches source/order/intent/USD/amount; separate dispatch gate; trust boundaries |
| Worker authority | Stale lease or duplicate external execution changes local state/money twice | Fixed lock order, token/time fence and stable financial idempotency; at-least-once recovery |
| Cancellation | Dispatch after definitive no-capture cancellation, fulfillment after request | Financial Prepared/Pending/Aborted gate and Orders cancellation guard; competing effects |
| Diagnostics | Address/key/proof/payload data leaked or unbounded labels | Allowlisted telemetry and restricted audit; observability without privacy loss |
| Operator simulator | Customer/Admin enables synthetic success or production consumes fake proof | Explicit isolated Development mode, no HTTP controls, immutable source labels; environment/source separation |

## Human and system authority

Every public Checkout route requires current Customer; owner is verified subject and Admin cannot impersonate. Missing/other-owner quote/attempt returns the same sanitized 404. An accepted key is not a credential. Quote/attempt IDs and Location do not grant permission. Replays require current eligible Identity even though their receipt is immutable.

Preview/acceptance take Identity user FOR SHARE then session FOR SHARE before domain locks, and recheck current account/role/security/session binding and fresh expiry after waits. Never upgrade the user lock after session. Revocation/reset/disable takes conflicting locks, preserving the earlier Phase 01 ordering. A write ordered after lost authority cannot accept a purchase. Protected reads may finish their already-authorized snapshot.

Once accepted, the worker acts on durable authorized purchase intent with explicit system authority. Logout/session expiry/disable does not erase money/stock work or silently cancel the purchase. New public actions still require current authority; cancellation uses the owning eligible Customer or restricted Admin Orders route. Recovery is not an impersonated Customer API call and never loads passwords/tokens. It may resolve/compensate a disabled account's accepted purchase without granting that account new access.

## Input and financial source

Reject unknown/duplicate fields/queries, noncanonical UUIDs, invalid integer syntax, malformed address, non-US destination and oversized media. Apply Orders NFC/trim/scalar/byte/control rules before persistence. Use parameterized SQL for all values; server-defined clauses/identifiers. User text is plain data and encoded by any later output client; it is never used as a URL/file/command. There is no remote address/carrier fetch or raw card/payment token input here.

Quote total is server-calculated and accepted only if current locked quantities/prices/policy still match. Hash comparison supplements exact canonical content, never substitutes for it. No customer-supplied amount, owner, source, refund, captured Boolean or scenario field is admissible. Financial state/proof comes from the verified owner mapping. A late capture for terminal/unfulfillable Orders cannot become shipment permission.

Simulator mode needs explicit isolated Development plus Orders simulation permission; reject enabled normal deployments at startup. Only the existing protected local operator path may assign/resume scenarios, with attribution. Freeze scenario at acceptance; a key alone cannot select an unassigned plan. Public/Admin callers cannot invoke financial-proof factories, wake/resume or direct database dispatch. Reserved Sandbox response mode remains disabled until Phase 07 integration passes; synthetic evidence is never promoted into provider execution.

## Data, telemetry and least privilege

QuoteView contains its owner's accepted address/lines; AttemptView and receipts omit them. Unused quotes expire after five minutes and are eligible for deletion after a further 24 hours; used quotes/Orders/accepted keys remain protected historical records. Protect address-bearing database/backup exports, restrict operators, and coordinate real-user retention/erasure before real data. Quote deletion cannot erase accepted idempotency/source protection independently.

Audit contains attempt/work/actor or source/request IDs, controlled kind/outcome, version, normalized operator reason and database time. No full address, quote, provider payload, credentials or arbitrary error text is stored. Operator reasons are restricted, bounded and never reflected to a Customer. Required audit failure rolls back the local mutation.

Normal logs/traces allow server request correlation, route template, bounded action/outcome/state, retry count, durations and queue age. Omit raw URLs/query, address/name/SKU, bodies, Customer/order/product/attempt/key/source IDs, lease tokens, operator reasons, credentials and provider data. Metrics omit all UUIDs/raw versions/unbounded values. Restricted audit supplies attributable IDs for investigation.

Apply narrow API/worker/cleanup/operator/migration grants and owner boundaries; verify actual row-lock/FK permissions. Ordinary public paths cannot execute simulator/operator operations merely because the monolith contains their code. Host admission, bounded payloads/pools/work slots and private synthetic accounts constrain the learning environment; quote growth/poll abuse is measured. Phase 08 adds measured cross-replica rate policy rather than an unreviewed Redis dependency. Readiness fails if required source-mode/schema/worker is invalid; no fail-open financial fallback exists.

Review [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). HTTPS, explicit CORS, trusted proxies and the selected Bearer transport remain unchanged. No PCI compliance or actual tax/payment safety is established by synthetic capture/refund.

## System Design Prerequisites & Concepts to Learn

Study object scope, accepted asynchronous authority, hostile input and verified facts versus client claims. Use two Customers, revoked sessions, restricted Admins and forged scenario/proof bodies in the [verification plan](../testing-strategy/verification-scenarios.md); inspect saved owner state and telemetry, not only denial codes.
