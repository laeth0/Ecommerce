# Payments Threat Model and Security Controls

**Status:** required design/verification controls for sandbox implementation. Apply the existing [Identity threat model](../../01-identity-and-auth/security/threat-model-and-controls.md) and [actor matrix](../../00-project-overview/system-actors-and-roles.md). No PCI assessment, penetration test or runtime control is claimed.

## Assets, actors and trust boundaries

Protect provider API/signing secrets, immutable purchase/source mappings, captured/refunded/reserved balances, provider operation keys, restricted audit/reasons, session authority and fulfillment permission. Customer, Admin, operator, callback sender and worker have different authority. Untrusted JSON, route IDs, callback metadata, return statuses and provider response bodies cross explicit validation boundaries.

| Capability | Customer | Restricted Admin | Protected local operator | Provider/worker |
| --- | --- | --- | --- | --- |
| Read financial summary/history | Own Orders only | Permitted Orders with access audit | Restricted incident procedure | Narrow recovery reads |
| Issue discretionary refund | Denied | Captured Sandbox funds/current version/key/reason/domain guards | No ordinary business impersonation | Denied |
| Request Order cancellation | Existing owned route | Existing restricted route | No status override | Checkout resolves existing request |
| Assign test fixture | Denied | Denied through HTTP | Before acceptance, approved allowlist and attribution | Reads frozen binding |
| Submit capture/refund proof | Denied | Denied | Cannot invent financial state | Authenticated provider observation; Payments validates |
| Resume/replace failed compensation | Denied | Denied through HTTP | Audited original work/repair protocol | Only proven permitted steps |
| Read secrets/raw card data | Denied | Denied | Minimum credential administration | Runtime secret access only; raw cards prohibited |

Human refund writes take Identity user SHARE→session SHARE before payment and recheck role/account/session/expiry with fresh database time after waits. Revocation/reset/disable takes existing exclusive Identity locks; it cannot race through an already-waiting refund without the documented authoritative recheck. Public reads may finish an authorized snapshot under the existing rule. Admin source networks remain restricted; no MFA/email verification/recovery expansion is introduced here.

Object-level authorization always constrains Order ownership using the verified subject; client customer/role/owner fields are rejected. A valid callback signature does not authorize arbitrary Order mutation. Defaults deny capabilities not listed. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

## STRIDE and financial abuse cases

| Threat | Concrete attack/failure | Required control and rationale | Acceptance evidence |
| --- | --- | --- | --- |
| Spoofing | Fake success callback or Admin request | Bearer/current role for humans; exact raw-body v1 signature/timestamp for callbacks | Missing/tampered/stale/future signature and revoked Admin cannot change money/work |
| Tampering | Alter amount/source/method/metadata or accepted mapping | Server totals, immutable binding/parameters, primary proof and exact account/mode/object correlation | Changed amount/currency/source/client paid flag is rejected/quarantined |
| Repudiation | Refund without attributable instruction or correction history | Append audit with acceptance/fact/repair in the same local transaction | Audit write failure prevents local mutation; immutable facts preserve original and correction |
| Information disclosure | Leaked key/client secret/address/card/provider payload in trace | Response/telemetry allowlists, no raw object retention, protected audit/backups | Capture logs/traces/artifacts across every success/failure path and inspect |
| Denial of service | Large callback, duplicate storms, uncontrolled polling or all-object scan | Body/depth/header limits, executing admission, shared rate counters, bounded durable work and external permits | No unbounded memory/DB/provider fan-out or acknowledgement before persistence |
| Elevation of privilege | Customer refund, unrestricted Admin recovery, worker writes Order | Separate contracts/rights; domain guards; narrow owner writes | BOLA/BFLA and direct invocation fail; financial-only paths never bypass Checkout |
| Replay | Repeated refund or forged old delivery after signature tolerance | Actor-scoped immutable receipt, provider key window, inbox/fact dedup and timestamp | One instruction/effect; expired POST retry never sends |
| Double spending | Concurrent partial refunds/cancellation over-reserve | Parent payment lock, transactional S/R counters, Unknown reservation | `S+R≤C` for normal operations in PostgreSQL races |
| Confused deputy | Signed event from wrong account/live mode or unrelated object | Fixed sandbox credential/destination, false livemode and immutable local mapping | Valid unrelated event cannot confirm/refund another purchase |
| SSRF/credential theft | Body-controlled provider URL or next_action callback URL | Fixed HTTPS host/path, no redirects/URL fetching, validated opaque IDs | Arbitrary URLs/private-address targets never contacted |
| Financial omission | Discard late capture/reversal due to stale lease or terminal Order | Append actual evidence, hold, wake/compensation and restore reconciliation | Money remains visible after local rollback/escalation/restore |

The patterns address actual monetary/authority boundaries: parent locking prevents write skew; signature plus mapping prevents spoofing/confused-deputy effects; immutable facts/audit make correction review possible. Costs are serialized refund writes, credential lifecycle, additional provider retrieval and restricted investigation storage. [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)

## Callback authenticity and anti-replay

Use the official Stripe signature verifier on **unaltered** UTF-8 raw bytes and the correct endpoint-specific secret, with 300-second tolerance and explicit future timestamp rejection. Verify v1 only; accept any valid v1 among multiple signatures during a reviewed secret overlap. Do not deserialize/reserialize, normalize whitespace, trust an unsigned event ID or use the API key as a signing secret. [Stripe raw-body signature guidance](https://docs.stripe.com/webhooks/signature)

Signature verification occurs before trusted extraction or any business scheduling. Ingress permits one bounded signature header, body/depth limits, configured endpoint account and `livemode=false`. Add provider IP allowlisting at trusted ingress where supported; local CLI forwarding uses a separate loopback/protected destination and its own secret. Network allowlisting supplements the cryptographic check and must not trust arbitrary X-Forwarded-For. Every duplicate still passes signature verification before reading the durable receipt.

Valid historical events delivered with a fresh signature are allowed. Replays inside tolerance are safe because `(account,eventId)` receipt and normalized effect identity deduplicate. Separate event IDs can describe one effect; an inbox key alone does not protect balance. Conflicting parsed identity under the same event ID quarantines the delivery; raw formatting digest difference alone does not invent a conflict. Full payload/signature/token is discarded after processing and absent from all telemetry.

## Card/PCI and privacy boundary

The application MUST NOT accept/store/log PAN, CVC, expiry, cardholder billing details or complete PaymentMethod objects, even for testing. The protected fixture contains only an approved provider test-method token. Raw-card fields are unknown input and rejected. No public client secret or provider SDK frontend exists. Use provider tokenized/hosted customer collection only under a later reviewed client/security scope. Outsourcing card collection can reduce exposure; actual PCI obligations depend on the complete integration and cannot be certified by this design. [Stripe payment-security guide](https://docs.stripe.com/security/guide)

Store minimal provider references/account IDs and normalized financial facts in restricted persistence. Omit address/customer email/name/SKU/reason from provider metadata; local UUID correlation is sufficient. Reasons are NFC/length/byte validated and stored only in restricted receipt/audit. No provider receipt email is sent by this adapter. Encrypt transport and persisted volumes/backups according to existing environment controls, restrict exports and apply least privilege to investigation queries.

Structured logs/traces allow route template, server request ID, fixed operation/outcome/source, status class, retry count, durations, bytes and bounded error classification. Exclude JWT/refresh/API/signing/cursor secrets, idempotency keys, raw provider IDs, method tokens, payloads, addresses/customer identity/reasons and lease tokens. Metric labels are fixed enums, never identifiers/free text. Correlation to actual payment/refund is through protected audit. [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

## Secrets, dependencies and egress

Provider API credentials and endpoint signing secrets come from protected environment/secret storage; never commit them in appsettings, examples, schema, CI logs, artifacts or shell commands. Test/restricted-test credentials only; validate account context and reject live credential prefixes/true livemode. Prefix validation alone is insufficient. Use a restricted key with only account-read validation, PaymentIntent create/read/cancel, Charge read and Refund create/read permissions; deny customer exports, transfers, payouts, credential administration and unrelated resources. Demonstrate actual scoped-key operations before admission. [Stripe secret-key guidance](https://docs.stripe.com/keys-best-practices)

Rotate API credentials within the same immutable sandbox account; old operation account/key/parameters/version remain. A new credential must read old objects before replacing the old credential. Rotate callback secrets through a bounded reviewed overlap and distinguish Dashboard versus CLI destinations. Cursor signing key is separate. Compromised keys close affected dispatch/admission, rotate, inspect external account activity and reconcile; no financial evidence/key purge is a repair.

TLS certificate/hostname verification and existing proxy trust rules are mandatory. Outbound host fixed to api.stripe.com; redirects disabled; response/depth/deadline bounds apply even to authenticated provider bodies. No remote next_action URL is executed. EF Core/Npgsql parameters bind all values; route/object IDs never become SQL/path templates through unchecked concatenation. JSON is data, not polymorphic type activation. Dependency/version/SDK parsing/security review belongs to implementation; no dependency is installed now.

## Rate and admission controls

Reuse [Identity's primary-backed fixed-window counter/HMAC identity algorithm](../../01-identity-and-auth/performance-and-scalability/capacity-and-rate-limiting.md) with separate Payments scopes and the existing central Options boundary. For authenticated retail operations, apply the lowest remaining applicable counter after authority and before business mutation. Exact replay consumes quota but cannot cause another financial effect.

Initial authority is a bounded read. Counter transactions commit before acquiring the user/session locks for the business mutation; revalidate authority under those locks afterward. Never hold rate-counter locks while acquiring Identity/payment locks, or retain business locks while committing a separate counter transaction.

| Policy | Initial shared limit | Result |
| --- | --- | --- |
| Customer/Admin financial reads |120/min per actor;3,000/min aggregate |429 with rounded next applicable window Retry-After |
| Admin refund instructions |10/min per Admin;60/min aggregate |429, no new instruction/key binding |
| Verified callback ingress |600/min per configured destination |429 before durable acceptance when exhausted; original sender may retry |
| Raw callback execution |≤20executing/replica within existing global100 |503 with Retry-After1; bounded buffers; no in-memory fallback |
| Provider calls |Account-wide5/sec,burst2,concurrency2 |Persist due wait; no retail 429 generated from asynchronous provider work |

Apply existing trusted-ingress source controls before expensive parsing/signature CPU; unsigned Internet traffic cannot claim provider identity or consume the verified-destination counter. Validating a signature is required before that counter. Dependency/counter failure returns503 without business acceptance; no process-local permissive fallback. Quotas are protective proposed defaults and must be verified across API replicas; do not raise them silently to pass a benchmark. External quota is managed by the single-executor contract.

## Security exit checklist and learning experiment

Manually attempt cross-owner reads/cursors, Customer refund, Admin from disallowed network, revoked session after lockwait, duplicate/changed accepted key, arbitrary fixture/provider ID, forged signature, valid wrong-account event, live mode, request smuggling/duplicate keys, source downgrade and log/backup leakage. All denied inputs leave money/stock/Order unchanged; authenticated mismatches retain bounded quarantine without creating purchase proof.

Then race refund/compensation while revoking the Admin; inspect Identity→payment lock order and atomic audit. Practice secret rotation, credential loss and callback retry without printing secrets. Document operational privileges and remaining live-payment/PCI/MFA scope honestly. The [verification plan](../testing-strategy/verification-scenarios.md) records the actual evidence.
