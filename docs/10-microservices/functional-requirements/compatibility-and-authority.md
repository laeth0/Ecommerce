# Compatibility and Authority

**Status:** explicit Phase 10 overlay. Earlier specifications describe the monolith before extraction; this document identifies every affected producer/consumer contract.

## Public routes and schemas

| Interface | Route owner after cutover | Contract |
| --- | --- | --- |
| Identity/Catalog/Inventory/Cart/Orders/Checkout | Commerce | Existing paths, bodies, headers, quotas, versions and error schemas |
| Customer/Admin financial read and refund history | Commerce gateway → private Payments query | Original Payments FinancialView/RefundPage and cursor semantics |
| Admin POST refund | Commerce authorization → Payments admission | Original RefundRequest/RefundReceipt, Idempotency-Key and replay headers |
| Stripe signed callback | Edge → Payments | Exact existing public path; original raw-byte/signature/inbox protocol |
| Operator recovery | Private owner-scoped tools/APIs | No new public state/resume/replay endpoint |

Keep JSON successes/RFC 9457 errors, no-store, server X-Request-Id UUID and distinct OTel trace IDs. Preserve original receipt fields, amounts, timestamps and Location. Return 202 for Checkout only after the Commerce acceptance commit; return 202 for Admin refund only after Payments financial reservation/audit is known committed.

Financial read still returns current owner evidence. Absent/nonowned local Order remains identical Orders.NotFound. A known source mapping with remote outage/integrity failure returns 503, not fabricated NotPrepared/zero balances. Original Simulator sources stay Commerce-owned and cannot receive new Admin refunds. Public GET never calls a provider.

The conservative hold reuses existing 409 Payments.FinancialHold and current recovery enums. Internal fulfillment release uses existing 503 Service.Unavailable while the handoff is unresolved; no new public business state or problem code is invented. A current expectedVersion is still required; server never substitutes a newer one.

## Authority linearization

Before extraction an Admin refund held Identity user/session SHARE locks through its financial write. Across databases that exact transaction no longer exists.

Approved replacement:

1. At Commerce, validate current Bearer signature/claims, current user/session/role/source, canonical request, local Order and source mapping.
2. Acquire existing Identity user/session locks, then local authorized-command key serialization. Recheck primary time/eligibility after waits.
3. Persist the immutable authorized command, actor/request identity and required audit. This commit is its authorization point.
4. Release all locks/connections before private service I/O.
5. Payments applies original financial admission under its own parent locks, treating the authenticated committed command as accepted authority.

If revocation wins before step 3, authorization fails and no command exists. If authorization wins, later expiry/logout/account disable cannot undo that accepted work. Only its original business/financial guards can admit/reject it. No JWT lifetime is extended and no client token is stored in the command or sent to Payments.

A new public request or replay still requires current eligible authority before any accepted-key lookup. Accepted financial command receipt can be replayed by a currently authorized same actor with the original key/body. Protected system retries use the already committed command and never reauthorize as a different actor.

## Refund key and rejection rules

Commerce stores each authorized submission under a server command UUID and proposed refund UUID. At most one unresolved/admitted command occupies (Admin,key). Pending exact input resumes the same command; different input conflicts until the original outcome is known.

Payments retains original successful actor/key receipt uniqueness. Genuine business rejection binds no successful public refund key. Commerce marks a definitive rejected command inactive, preserving its audit/receipt; a new currently authorized submission may reuse that key with a new command UUID. The prior rejected command ID always replays its recorded rejection.

503/timeout/cancellation during remote admission is Unknown, never a definitive rejection. Keep the original active command and require original key/body. SDK/HTTP automatic POST retry is disabled. A known admitted original receipt is immutable even after refund state, source mode or Order lifecycle changes.

## Source and gate changes

Opaque descriptors freeze the provider account/API/method choice at acceptance without transferring secret method material to Commerce. They are immutable and must already exist; a mutable alias/default cannot stand in for a frozen descriptor.

Commerce admission uses its local reviewed mode/gate. Remote Payments gates are rechecked at remote initialization/dispatch. Their outage/change may delay an accepted purchase; it does not rewrite accepted price/source/receipt or extend stock time.

Closure may arrive before initialization. Payments persists an original-ID stop control that prevents first dispatch; absence/404 alone is never no-capture proof. Recovery epochs distinguish a genuinely fresh command from an old command whose remote evidence was lost in restore.

## Superseded local composition

After cutover, Payments.SelectAcceptedSource becomes descriptor selection at Commerce; FreezeAcceptedBinding/Ensure/Abort/Compensation become durable private operations. ReadFinancialFacts is a remote snapshot or a held confirmation receipt, never a caller-owned cross-database read.

Direct Payments-to-Checkout wake becomes committed financial-change event intake plus periodic owner reconciliation. Cross-owner Identity/Order/Checkout FKs in migrated Payments data become immutable logical references. Phase 09 cross-owner quarantine scheduling becomes a resumable owner API operation with separate commits.

Original money equations, refund corrections, provider keys/windows, cancellation cutoff, stock deadlines, exact Cart cleanup and historical Order outcomes remain. The new hold deliberately delays financial application while serializing a pending confirmation; retained deferred evidence and visible blocked availability make that change explicit.
