# Payments Verification Scenarios

**Status:** manual acceptance plan and future coverage design. No application/provider/database/load/restore scenario has run. Do not create automated tests, test projects/files, fixtures, mocks or frameworks unless the user later explicitly requests them. Existing related tests are preserved and may be run when implementation exists.

## Evidence levels and prerequisites

Static review checks links, schema structure/examples, state/lock equations and documented bounds. Build/format/type/migration inspection becomes possible with production code. Real PostgreSQL verifies FKs/grants/row locks/races/atomicity. Actual sandbox APIs and signed ingress verify provider/version/scopes/delivery; local source/stub results are labeled separately. Load measures declared local resources, never Stripe load testing. Integrated restore includes external effects missing from the backup.

Prepare two Customers, at leasttwo restricted Admins for races, a protected operator, primary PostgreSQL and the exact .NET/SDK/API versions. Use synthetic Orders/addresses and approved provider test tokens. Never include secrets/raw-card/provider payload dumps in evidence. Record initial/final local identities, balances/versions, normalized facts, state/audit counts, mutation windows, stock movements, Order/Checkout outcome, response status/receipt, duration and unresolved work through restricted inspection.

## Given/When/Then acceptance matrix

| ID | Given / When | Required Then | Evidence boundary |
| --- | --- | --- | --- |
| PAY-V01 | Valid accepted Sandbox source; operator default changes after commit | Frozen account/version/method/amount/receipt unchanged | Primary and source inspection |
| PAY-V02 | Total501 or99,999,999 versus99,999,999+1; new preview/submit and existing replay | Supported Sandbox values admit; unsupported new total409; exact old receipt replays | API/semantic boundary |
| PAY-V03 | Acceptance transaction crashes at each insert/commit boundary | No partial binding/Order/reservation/work/receipt; no provider call before commit | Real PostgreSQL/process crash |
| PAY-V04 | Prepare versus abort in both lock orders; repeated dispatch | One identity; Aborted winner never sends | Real row-lock race and provider request inspection |
| PAY-V05 | Prepared crosses reservation expiry while waiting for payment lock | Fresh time aborts; no deadline extension/send | Database-time boundary |
| PAY-V06 | Supported Success fixture; actual create+confirm | Exact capture/Charge proof, correct stock consumption/confirmation/cart cleanup | Actual small sandbox + integrated owners |
| PAY-V07 | Decline or action-required fixture; cancellation retrieval | Pending until authoritative zero-capture canceled proof; failed purchase safely releases stock | Actual provider classifier |
| PAY-V08 | Provider accepted mutation; lose response before/after local mapping | Same key/object/fact; no second charge | Fault-controlled provider response path |
| PAY-V09 | Original create returns500 or concurrent idempotency conflict | Unknown/retry original within window; no fresh key/no false decline | Actual behavior if reproducible; otherwise controlled source labeled |
| PAY-V10 | Missing provider ID; beyond23h cutoff; resume old worker/key | No POST retry; only bounded correlation/manual review | Persisted-window/adaptor send inspection |
| PAY-V11 | Verified capture arrives after stock expiry/cancellation/terminal Order | Preserve evidence, no confirmation, full remaining compensation | Integrated stock/time/late evidence |
| PAY-V12 | Stock/Order/audit application fails after capture committed | Capture survives; original resolution safely retries or compensates | Cross-owner transaction rollback |
| PAY-V13 | Customer A reads B; Customer refunds; Admin source disallowed |404/403 by contract; no money or information disclosure | Real auth/route checks |
| PAY-V14 | Admin revoke/reset/disable competes with waiting refund | Correct Identity lock order and fresh authority; no unauthorized acceptance | Real primary/session race |
| PAY-V15 | One new Admin partial refund; same key/body replay after settlement | One reservation/effect/audit; original202 receipt/version retained | API and primary |
| PAY-V16 | Accepted key reused with changed Order/amount/version/reason |409IdempotencyConflict, no target effect/other-parent lock | Two-target concurrent key race |
| PAY-V17 | Two full refunds/current same version against one capture | At mostone accepts; other stale; normalS+R≤C | PostgreSQL two-session race |
| PAY-V18 | Many partial instructions across distinct/same payments | Amount/version correctness, bounded waits, no write skew | Primary stress without provider load |
| PAY-V19 | Partial succeeded/pending refunds overlap full cancellation | Only uncovered gap allocated; one stable case; Order resolves after durable coverage | Integrated real locks/counters |
| PAY-V20 | Admin refunds captured but unconfirmed purchase | Purchase latch blocks confirm; release eligible stock, compensate remaining total, Fail Unfulfillable | Coordinated race in both orders |
| PAY-V21 | Processing/Shipped/Delivered capture; valid partial/full Admin refund | Accept; immutable Order lifecycle/totals and stock unchanged | API + movement/snapshot comparison |
| PAY-V22 | Refund create response lost; concurrent second instruction | Original Unknown keeps reservation; no replacement/double refund | Financial/provider mutation boundary |
| PAY-V23 | Provider Pending refund or insufficient balance | Reserved Pending/ManualReview; no success claim, original object resumes | Actual pending-refund fixture |
| PAY-V24 | RefundFailure fixture; observe initial success then actual failure | One success and linked reversal; current net balance/debt corrected; old success cannot regress | Actual asynchronous Stripe refund |
| PAY-V25 | Failed Admin allocation counted in an open compensation case | One uncovered compensation allocation created atomically | Parent/case/refund transaction |
| PAY-V26 | Failed compensation hold; protected repair and exact repair replay | One replacement, held coverage conserved; Unknown replacement rejected | Operator privilege + primary race |
| PAY-V27 | Repeated cause/fully refunded payment; EnsureFullCompensation replay | Same valid case/coverage; zero new refund when already returned | Internal owner idempotency |
| PAY-V28 | Missing/tampered/stale/future/v0-only signature, mutated raw body |400WebhookRejected; no business work; redaction holds | Actual ingress/signature verifier |
| PAY-V29 | Valid delayed event with freshly signed delivery; secret rotation | Accepted durable hint under approved current/overlap secret; expired old secret rejected | Provider/CLI destination distinction |
| PAY-V30 | Same event repeated, different IDs for same object/effect, reordered events | Durable ingress/facts dedup; no repeated counters/audit/version | Actual resend plus controlled ordering |
| PAY-V31 | Callback before API response and commit/restart during inbox application | One mapping; facts/work retained; original response compares safely | Real callback/response race |
| PAY-V32 | Signed wrong-account/live/amount/currency/unrelated/unknown-version object | Durable quarantine/hold, no purchase proof or Order effect | Actual account objects + controlled invalid cases |
| PAY-V33 | DB/inbox commit unavailable during callback |503; no false200/in-memory durability; retry or scan recovers | Primary fault + provider resend |
| PAY-V34 | Lost callback and failed postcommit Checkout wake | Original known-object scan/fact wake repairs; latest wake version not cleared by older ack | Durable discovery and restart |
| PAY-V35 | Stale financial worker resumes after lease takeover | No stale work/projection regression; independently verified money preserved | Two workers plus delayed response |
| PAY-V36 | Provider transport/5xx/429/slow response or auth failure | Bounded calls/backoff/gates/manual review; no connection held or unsafe auto reopen | Small faults and resource inspection |
| PAY-V37 | Pool exhaustion/deadlock/lock timeout/audit failure | Sanitized503/bounded retry, no partial reservation or replaced key | Real DB/process resource faults |
| PAY-V38 | External Dashboard refund/dispute or duplicate/mismapped Charge | Import/quarantine real evidence, hold conflicting money, no fake balance repair | Reviewed actual sandbox operator action |
| PAY-V39 | Deep refund history/equal timestamps; cursor tamper/expiry/actor/order/key rotation | Stable keyset/bounds, no unauthorized page access, correct400 | API/primary cursor checks |
| PAY-V40 | Callback/body/header/depth/JSON lexical/unknown-member boundary | Exact400/413/415/429/503; no partial intent; provider unknown fields tolerated only on callback | Transport/parser/rate multi-replica |
| PAY-V41 | API/signing credentials rotate, secrets leak sentinel, restricted key insufficient | Same account old IDs readable or safely held; no secret in output/artifacts | Credential scopes/telemetry inspection |
| PAY-V42 | Switch Simulated→Sandbox/Disabled, rollback compatible binaries | Old synthetic source never dispatches at Stripe; exact old receipts available | Source compatibility/runtime rollout |
| PAY-V43 | Local50-client declared workload and hot-payment separate run | All relevant p50/p95/p99/throughput/error/resource gates; no provider load traffic | [Declared performance workload](../non-functional-requirements/quality-targets.md) |
| PAY-V44 | Actual small sandbox probe rate and≤100 affected objects fault drill | Report external and local convergence separately;≥99% outcome/ManualReview within 5min after recovery | Actual provider + integrated owners |
| PAY-V45 |100,000 local financial rows, scan/backlog grows; provider scan dataset separately | Indexed bounded plans/continuation; verified24h cycle at actual admitted external size | Query plans/vacuum/provider quota |
| PAY-V46 | Restore backup before an actual capture/refund and before its local receipt | Hold purchasing/fulfillment, find effect/orphan across gap, original keys/windows preserved | Actual provider + isolated integrated restore |

## Important boundary samples

- Refund amount0/fraction/exponent/negative-zero versus1cent and exactlyavailable; one cent aboveavailable fails. Version0/stale/exhausted is not a new mutation permission.
- Sandbox total501/99,999,999 valid;100,000,000 rejected before new acceptance. Historical generic Simulator receipts retain the original wider bound.
- Reservation time immediatelybefore/at/afterexpiry after final lockwait; safe POST cutoff similarly includes complete2s call envelope.
- New refund cause/key versus accepted exact replay after lifecycle/version/source/hold change; every replay still uses current authority/rate limits.
- Callback262,144/262,145bytes,signature4,096/4,097bytes,depth32/33; retail 4,096/4,097bytes/depth16/17; response escaped UTF-8 bounds.
- Cursor actor/Order/limit/mac/expiry mismatch and equal createdAt UUID tie-break; no public provider references/reasons.

## Future testability coverage when authorized

Pure deterministic validation/state arithmetic can be exercised without I/O; provider mapping/classification uses typed inputs and explicit clocks/IDs; owner transaction wrappers remain narrow. Future unit coverage targets monetary equations, state guards and canonicalization. Future PostgreSQL integration coverage targets locks/grants/constraints/facts/replay/compensation. Future contract coverage targets schemas/version/signature/adapter observations. Future end-to-end coverage targets auth→quote→reserve→capture→confirm/refund and restore. Do not infer provider or PostgreSQL safety from an in-memory model.

This is coverage design only; new tests/frameworks/mocks are deferred until explicit authorization. Manual evidence can satisfy an implementation scenario when sufficiently strong; if infrastructure is unavailable, mark the corresponding gate unverified.

## Completion report format

Record scenario ID,date/build/runtime/API/SDK/database version, source type, dataset/resources, offered/completed counts, fault boundary, initial/final states/balances/facts/stock/Order, exact receipts/errors, audit/secret inspection and unresolved limitation. Classify evidence as static/build/real-primary/actual-provider/controlled-source/load/restore. A passing static schema check is never reported as a provider refund, PostgreSQL race or production readiness result.
