# Payments Architecture Decisions

**Status:** proposed decisions under the owner's confirmed Phase 07 scope. Each requires the linked implementation evidence before admission.

## PAY-ADR-01 — One Payments owner in the modular monolith

**Context/problem:** Checkout must recover purchases, but a local rollback cannot reverse a provider capture. Allowing Orders or callbacks to set a paid Boolean creates competing financial truth.

**Options:** share payment flags across modules; extract a payment service immediately; keep a Payments owner with short local transactions and an external boundary.

**Decision:** Payments alone writes its intent, facts, balances, refunds, inbox and financial work. Checkout consumes typed verified evidence through owner operations. Keep one primary PostgreSQL database and the established monolith.

**Mechanism/rationale:** persist intent, commit, call provider without locks, then persist verified results. Commit financial truth before waking Checkout. Local outcomes compose through existing owner transactions; external outcomes converge through durable work.

**Trade-offs/failures:** polling and unresolved states are operational work. The shared process/database is still a failure domain. A service extraction later needs messages/outbox and revised transaction boundaries.

**Rejected alternatives:** a premature service adds network/database coordination without measured isolation need; shared flags cannot express evidence or ownership.

**Experiment/acceptance:** kill the process after provider capture but before local result application. Reconciliation must preserve one original financial operation and resolve or compensate the original purchase.

## PAY-ADR-02 — Stripe sandbox PaymentIntents with protected test methods

**Context/problem:** the owner selected backend-only learning. The project already owns accepted totals, addresses and deadlines; it needs a concrete authenticated external API without collecting cards.

**Options:** provider-hosted checkout; PaymentIntents with a customer SDK; PaymentIntents confirmed by the server using an operator-assigned test method.

**Decision:** use the third option, one automatic full capture, card type only, manual confirmation authority and `error_on_requires_action=true`. Create and confirm in one stable-key request. No client secret is exposed, stored or used.

**Rationale:** provider-tokenized test fixtures fit the selected backend scope. Authentication-required methods are deliberately unsupported and are canceled/reconciled safely. Hosted checkout remains a later product/client choice. Stripe recommends Checkout for most customer-facing integrations; this phase's choice follows its backend learning constraints. See the [provider contract](functional-requirements/stripe-provider-contract.md).

**Trade-offs/failures:** this cannot serve real customer card entry or SCA flows. Operator fixture assignment must be frozen at acceptance. New purchases exceeding the provider amount limit are rejected before durable acceptance.

**Experiment/acceptance:** change an operator default after acceptance and race dispatch with cancellation. The accepted fixture remains unchanged; the dispatch/abort winner determines admissibility, with no real funds or second charge.

## PAY-ADR-03 — Permanent local identity and finite provider retry safety

**Context/problem:** local idempotency keys survive for the purchase lifetime, whereas external deduplication has finite retention. A lost creation response can leave the object ID unknown.

**Options:** retry indefinitely; generate a fresh key; retain original key/request and stop unsafe mutations after a conservative deadline.

**Decision:** persist every provider mutation's exact canonical parameters, version, key and earliest possible send time before I/O. Automatic POST retries are permitted only within the recorded 23-hour safe window. Known object IDs remain retrievable after that window. Unknown mapping requires reconciliation/manual review; an empty search is not no-capture proof.

**Mechanism/rationale:** a local unique identity prevents duplicate acceptance, a provider key prevents duplicate effects within its retention window, and the deadline prevents replay from becoming a fresh external mutation. Three separate boundaries are necessary.

**Trade-offs/failures:** some unavailable purchases remain unresolved; an old worker could outlive a lease. Recheck database time immediately before sending and fence local application; do not assume a lease cancels an external request.

**Experiment/acceptance:** lose an original response, advance beyond the safe window, resume an old job and replay the API. Original receipt remains; no new charge/refund POST is sent.

## PAY-ADR-04 — Signed callback inbox plus authoritative retrieval

**Context/problem:** delivery can duplicate, reorder or disappear. A callback can carry historical state and arrives without human authentication.

**Options:** mutate Order synchronously; rely solely on polling; verify and durably record a narrow event hint, then retrieve through Payments.

**Decision:** verify exact raw bytes, timestamp and endpoint signature; commit deduplicated minimal inbox data before 200. Supported events schedule bounded provider retrieval. Local facts and object identity prevent repeated financial application. Polling covers missing callbacks.

**Rationale:** callback ingress stays quick and survives downstream outages. Retrieval validates current account/mode/object/mapping and avoids trusting event arrival order. No broker is required for this durable database inbox.

**Trade-offs/failures:** retrieval uses provider budget; unfamiliar versions and unmatched objects need quarantine. A valid signature grants input authenticity, not permission to fulfill an order.

**Experiment/acceptance:** deliver duplicates and reversed success/failure events while the provider or database is unavailable. Only durable ingress is acknowledged; no fact regresses or repeats.

## PAY-ADR-05 — Refund reservations under the payment parent lock

**Context/problem:** two Admins or Admin plus cancellation could each observe enough refundable money. Timeout cannot safely free a refund's reservation.

**Options:** sum unlocked rows; rely only on provider rejection; serialize monetary admission under the payment row and maintain transactional aggregates.

**Decision:** use payment → compensation case → selected refund locks, with exact current-version checks for new Admin requests. Reserve money with acceptance and required audit. Successful refund converts its reservation to refunded balance; verified permanent failure releases an Admin reservation, while compensation keeps failed coverage reserved until a reviewed replacement.

**Rationale:** one parent lock protects the aggregate equation and avoids write skew. A durable full-compensation case tracks the obligation across existing successful/outstanding refunds and subsequent failures.

**Trade-offs/failures:** one payment serializes refund mutations. Financial anomalies can require a hold that prevents normal admission; actual provider evidence must still be retained.

**Experiment/acceptance:** race two full refunds, small partial refunds and full cancellation compensation. Successful plus reserved funds never exceed capture through ordinary local operations.

## PAY-ADR-06 — Append-only financial evidence with explicit corrections

**Context/problem:** Stripe refunds can move from reported success to failure; a late capture may contradict an earlier local no-capture classification. Rewriting history hides what operators and Checkout previously observed.

**Options:** immutable terminal status with discarded contradictions; overwrite status/history; append verified facts and correction links with guarded current projections.

**Decision:** facts are append-only. Capture proof remains historical. A verified refund failure after success appends one reversal fact and updates current net-refunded/reserved balances atomically. A capture after no-capture retains both facts, blocks fulfillment on a terminal Order and schedules compensation/manual review.

**Trade-offs/failures:** corrected settlement can make a formerly fully refunded payment partially/unrefunded again. Customer views expose the current state and ManualReview; historical Order status remains unchanged. Provider identity conflicts require quarantine rather than arithmetic guesses.

**Experiment/acceptance:** observe refund success then actual asynchronous failure; replay old success and restart. The reversal applies once, outstanding compensation reappears and the older event cannot restore success.

## PAY-ADR-07 — Bounded PostgreSQL work and provider backpressure

**Context/problem:** unlimited polling/retries consume connections and external quota while useful purchases stall.

**Decision:** use one financial work row per payment, short SKIP LOCKED claims, fenced leases and two financial action slots per replica. Provider calls consume the shared account budget before I/O. The initial sandbox topology uses one outbound Payments executor; extra outbound replicas require a shared account limiter before enablement.

**Alternatives/trade-offs:** a broker or Redis limiter adds infrastructure; process-only limiting across arbitrary replicas is incorrect. Durable PostgreSQL work is adequate for the current rate but requires vacuum/queue-age monitoring.

**Experiment/acceptance:** pause provider responses, fill the outbound budget and run duplicate callbacks. API acceptance remains local, queues remain durable, and no connection spans the external wait. Scale only after measured [capacity gates](performance-and-scalability/capacity-and-provider-budgets.md).
