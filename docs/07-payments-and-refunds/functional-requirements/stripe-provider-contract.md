# Stripe Sandbox Provider Contract

**Status:** reviewed against primary Stripe documentation on 2026-10-01; proposed adapter contract, with no account/API calls executed. Local design rules below are intentionally stricter than provider capabilities. Source references describe provider behavior; local deadlines/budgets are project policy.

## Adapter scope and version

Use one approved Stripe sandbox account, direct PaymentIntents/card payments, server-only confirmation, one automatic full capture and USD. Freeze account ID and **API version `2026-09-30.endive`** in each accepted source binding; pin every API request and configured webhook destination to that version. A supported stable official Stripe .NET SDK release must be pinned and demonstrated to parse this version before implementation admission. Do not inherit an account/SDK default or auto-upgrade existing operations. [Stripe API versioning](https://docs.stripe.com/api/versioning)

The default approved fixture is `pm_card_visa`; protected operator assignments may select reviewed decline, action-required, pending-refund and refund-failure fixtures. The selected exact token is frozen at acceptance. Raw PAN/CVC, arbitrary method IDs, client secret, Customer object, receipt email, billing/shipping data, return URL, setup_future_usage, Connect account, automatic tax and wallet methods are absent from dispatch parameters. Provider test methods do not move real funds. [Stripe test payment methods](https://docs.stripe.com/testing)

### Sandbox amount admission extension

Stripe's USD amount supports at most eight digits, with a 50-cent minimum. The existing Checkout minimum is 501, so Sandbox purchases MUST be **501..99,999,999 cents inclusive**. Preview and new submission in Sandbox mode return `409 Payments.AmountUnsupported` if the exact total exceeds that bound. Recheck before acceptance commit. Existing exact acceptance replay precedes this check. [PaymentIntent amount constraints](https://docs.stripe.com/api/payment_intents/create)

The existing generic Order/Checkout money schema and Simulated receipts retain their wider bound. Sandbox admission is an additional semantic constraint, documented here as the Phase 07 integration change. No accepted amount is truncated, split, capped or repriced.

## Frozen provider mutations

All requests use HTTPS `https://api.stripe.com`, authenticated through the configured sandbox secret in the request header. User/provider payload cannot set hostname, API path, proxy, credential, `Stripe-Account` or version. Request parameters are canonicalized, stored as a bounded allowlisted JSON descriptor and compared exactly plus SHA-256 fingerprint on replay. Credentials are referenced by protected version/account identity and are never in the descriptor.

| Mutation | Exact operation/key | Frozen form parameters |
| --- | --- | --- |
| Create + confirm payment | POST `/v1/payment_intents`; `ecom:v1:pay:<paymentOperationUuid>` | `amount=<accepted cents>`, `currency=usd`, `payment_method=<frozen test token>`, `payment_method_types[0]=card`, `capture_method=automatic`, `confirmation_method=manual`, `confirm=true`, `error_on_requires_action=true`; metadata `ecommerce_payment_operation`, `ecommerce_attempt`, `ecommerce_order`, `ecommerce_source=Sandbox` |
| Close dispatched noncapture intent | POST `/v1/payment_intents/<original id>/cancel`; `ecom:v1:cancel:<paymentOperationUuid>` | `cancellation_reason=abandoned`; no amount/method update |
| Refund allocated amount | POST `/v1/refunds`; `ecom:v1:refund:<refundOperationUuid>` | `charge=<verified original captured charge>`, `amount=<allocated exact cents>`; metadata `ecommerce_refund_operation`, `ecommerce_payment_operation`, `ecommerce_source=Sandbox`; no provider reason/destination/email field |

Each is a distinct logical mutation with its own first-send time/safe window and immutable descriptor. Admin free text remains in restricted local audit and is never provider metadata. Refund amount is always explicit, including full remaining compensation. Provider-generated Charge/PaymentIntent/refund IDs are opaque, case-sensitive strings retained only in restricted financial storage.

Create-and-confirm and manual-confirmation behavior follow the [creation API](https://docs.stripe.com/api/payment_intents/create) and [confirmation API](https://docs.stripe.com/api/payment_intents/confirm). Explicit `automatic` avoids relying on the default asynchronous capture setting. No second confirmation with another method is offered in Phase 07.

## Idempotency and retry boundary

Stripe retains an idempotent result, including a 500 result, and may prune a key after at least 24 hours; reuse after pruning can become a new request. Parameter changes conflict. [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)

For each mutation, persist `first_send_at` using primary DB time **before its earliest possible network send**; persist `safe_retry_until=first_send_at+23 hours`. Do not reset either on crash, resume or observed validation error. Immediately before every POST, recheck current database time, source permission, original descriptor and deadline, allowing a two-second call only if it can finish inside the safe window. If that check cannot run, do not send. Payment create-and-confirm has the additional fifteen-minute reservation deadline and closure_requested=false guard at send/retry admission; after expiry or a trusted close instruction, retrieve/correlate the original effect without reissuing create-and-confirm.

- Within the window, retry only the original key/parameters through the bounded work policy. A network timeout/5xx is Unknown. Cached 500 can require callback/retrieval reconciliation rather than useful POST retries.
- After the window, prohibit any retry of that logical mutation, even with the original key. Retrieve a known ID. If ID is missing, correlate through authenticated callbacks or paginated list reconciliation; escalate when unresolved.
- A resumed lease or client replay never authorizes a replacement key. A fresh compensation repair is allowed only after authoritative failure/no remaining effect, under its separately reviewed repair contract.
- Disable SDK automatic mutation retries unless they share this exact outer deadline/key policy; initial implementation uses zero automatic SDK network retries. 429 and concurrent idempotency conflict do not create another identity.

A provider 500 is indeterminate and may later produce an object/effect. This contract never treats it as proof that a mutation did not execute. [Stripe low-level error handling](https://docs.stripe.com/error-low-level)

## Payment observation classifier

Validate the authenticated account context and `livemode=false` on PaymentIntent/Charge and the Event envelope. Refund objects do not expose their own livemode field; derive their sandbox mode from the authenticated account and validated original Charge/PaymentIntent, plus the signed Event when present. Bind by the immutable local operation metadata and provider mapping; metadata alone cannot create an accepted local intent. On first mapping, compare exact accepted fields and enforce unique `(account, provider PaymentIntent ID)` and charge identity. A response or event that conflicts with an existing mapping is quarantined.

| Provider observation | Local action |
| --- | --- |
| `succeeded`, exact amount/currency and matching Charge `paid=true`, `captured=true`, `amount_captured=accepted total` | Persist one Captured fact; expose admissible proof only after all mapping checks |
| `processing` | Pending/Unknown; inspect original object; no no-capture proof |
| `requires_payment_method`, `requires_confirmation` or `requires_action` | No replacement method or reconfirmation; schedule cancel original intent, then retrieve it; Pending until definitive closure |
| `canceled`, zero amount_received, no captured Charge for that intent | Persist Rejected no-capture proof after validated closure; historical proof records its verified source |
| `requires_capture` | Unexpected under automatic full capture; hold, cancel if legally possible, reconcile charge; never interpret authorization as capture |
| timeout/connection loss/5xx/429/unknown ID/404/unrecognized response | Unknown; preserve dispatch identity; scheduled inspection or ManualReview |
| wrong total/currency, live mode, multiple provider objects/captures, disputed Charge or altered mapping | Persist bounded quarantine/evidence, integrity hold, no purchase confirmation |

Query `GET /v1/payment_intents/<id>` and its original Charge as required; use bounded expansions only when the measured two-second envelope allows them. Where closure needs completeness, enumerate all Charges for the intent with pagination and verify no capture, rather than examining only a nullable latest_charge. Stripe cancellation prevents further charging by that canceled intent, but the adapter must still verify its already-existing capture evidence. [PaymentIntent cancellation](https://docs.stripe.com/api/payment_intents/cancel), [Charge fields](https://docs.stripe.com/api/charges/object)

After an admitted dispatch, `AbortUndispatchedOrInspect` only returns knowledge; external closure is financial work. A missing provider ID cannot be aborted retroactively. At reservation expiry or cancellation, request closure if the original ID is known; a processing intent that cannot be canceled remains Unknown. New verified capture after local no-capture classification is preserved and held for compensation; old evidence is not overwritten.

## Refund observation classifier

Every refund maps to the original captured Charge, account, false livemode, exact allocation amount/USD and unique local/provider IDs. Refunds return money to the original payment method; this project accepts no destination input. [Stripe refund API](https://docs.stripe.com/api/refunds/create)

| Observation | Current projection and accounting |
| --- | --- |
| `pending` | Pending; keep full allocation reserved |
| `requires_action` | Pending plus ManualReview; unsupported interactive flow; keep reservation |
| `succeeded` | Append unique RefundSucceeded fact; R decreases/S increases once |
| `failed`/`canceled` with no prior success | Append RefundFailed fact; release Admin reservation or retain compensation FailedHold |
| `failed` after reported success | Require fresh retrieved refund and reversal evidence, including failure_balance_transaction when supplied; append RefundReversed linked to its success; reduce S once and recover coverage |
| response loss/5xx/404/unknown ID | Unknown; keep reservation and original request/key |
| changed amount/Charge/currency/mapping or contradictory later success after verified failure | Quarantine and hold; no automatic regression/replacement |

Provider success can later change to failure. Preserve both observations and apply one reversal; an event's timestamp/arrival order cannot decide which fact wins. Known failed/reversed state is not regressed by an older success callback. Use current authenticated retrieval; missing required reversal evidence is ManualReview, with funds unavailable for new discretionary refunds. [Asynchronous refund behavior](https://docs.stripe.com/testing#refunds), [refund failure adjustment](https://docs.stripe.com/api/refunds/object)

Known refund IDs remain retrievable after idempotency expiry. Missing-ID refund reconciliation enumerates `GET /v1/refunds` scoped to its known Charge; partial page/search miss is not failure. An external Dashboard refund is imported under a unique provider-derived identity after verified retrieval, counted once and marked for review. Reconcile held local reservations; do not automatically release a dispatched Unknown reservation to fit an external refund.

## Webhook envelope and signed ingress

POST `/api/v1/payments/webhooks/stripe` accepts Stripe's snapshot Event envelope, **not** the retail strict request schema or CloudEvents. Configure only `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, `refund.created`, `refund.updated`, `refund.failed` and `charge.dispute.created` for this phase. Charge/dispute events schedule financial inspection/hold; no disputes domain workflow is introduced.

Before trust, enforce raw-body ≤262,144 bytes, valid UTF-8/depth≤32, uncompressed application/json, one Stripe-Signature header ≤4,096 bytes, and reject duplicate structural keys. Preserve original bytes through verification; allow unknown provider fields for forward-compatible parsing. The official SDK verifies v1 signatures with a 300-second timestamp tolerance, including rejecting timestamps more than 300 seconds in the future. Signature time is delivery time; delayed historical events remain admissible when delivered with a fresh valid signature. Different configured destinations/CLI forwarding need their own secret. [Signature verification](https://docs.stripe.com/webhooks/signature)

Extract event `id` ≤255 ASCII safe reference characters, `type` ≤128, `api_version`, `livemode`, object type/ID and optional local operation references, plus SHA-256 body digest. The endpoint configuration establishes account context; Connect/account overrides are rejected. Verify expected event/object shapes; persist Ignored/Quarantined for unsupported type/version rather than trusting unknown layouts. Never retain complete provider objects or card details.

200 acknowledges a committed hint or matching durable duplicate, with fixed `{"received":true}`. It does not acknowledge capture/refund application. Fresh signatures authenticate repeated deliveries; event ID and financial fact identity deduplicate their effects. Delivery ordering is not guaranteed, so retrieving the original object and applying guarded facts is required. [Webhook delivery and duplicates](https://docs.stripe.com/webhooks)

## Reconciliation and bounded scans

One Payments executor initially owns outbound account calls. Known-ID operations use one retrieval decision at a time; paginate any needed charge/refund lists with limit 100 and durable cursor, one page per bounded action. Unknown-create recovery lists PaymentIntents in a recorded first-send interval (five-minute overlap on either side), comparing operation metadata and account. Concurrent/older empty results never authorize another create. Multiple matches produce a hold. Persist scan bounds/continuation and periodically restart a completed empty scan while within bounded recovery policy.

Scan retained succeeded refunds for later reversal and provider Charge refund totals: one complete retained-financial reconciliation cycle per 24 hours, persisted keyset and lag alert. Pending/Unknown work receives due priority. The scan does not claim to discover all external mutations instantly. Restrict Dashboard financial edits to reviewed operator action; an identified unreviewed edit immediately closes affected admission. Restores expand the reconciliation interval to cover the full possible lost time and clock margin.

Provider calls have a two-second complete deadline, response≤1 MiB, parsed depth≤32 and maximum 100 objects per page. Oversized/truncated/timeout retrieval is Unknown; never classify an incomplete list as absence. Shared account rate is initially ≤5 requests/second, burst2, concurrency2, with fair priority for compensation/closure/unknown capture. These are project budgets below documented limits. No provider sandbox load test is permitted; use isolated internal source/stub measurements and small actual provider probes. [Stripe limits and load testing](https://docs.stripe.com/rate-limits)

## Evidence contract

An admissible proof has source `StripeSandbox`, stable local payment operation/attempt/Order IDs, accepted exact amount/USD, effect kind, stable financial fact UUID and database observed time. Payments loads its immutable source binding and fact; arbitrary caller DTO/UUID is invalid. Captured proof is historical gross capture and is insufficient by itself after known refund/hold for a new confirmation; `ReadFinancialFacts` also returns current hold/refund/compensation guards. New confirmation MUST require refund_started=false, no compensation case and no integrity hold. An already-applied historical proof replays before these new-source guards. No public endpoint returns an internal proof or accepts a financial status selector.

Full-compensation proof binds the stable case UUID, capture fact, target amount and currently durable reserved obligation. Its historical acceptance remains, while its current settlement/recovery is separately queryable. A verified later failure reopens coverage under that same case, even after Checkout/Order resolution is terminal.
