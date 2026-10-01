# Project Overview and Learning Objectives

| Field | Value |
| --- | --- |
| Document | OVR-001 |
| Status | Draft for review |
| Scope | Project-wide product vision, scope, learning outcomes, and planning assumptions |
| Source | [Project brief](../../prompt.md) |
| Decision owner | Project owner |

## 1. Product goal

Build a small e-commerce backend that supports a complete purchase and refund journey, then evolve it through measured reliability and scaling problems. The main outcome is an engineer who can explain, implement, and evaluate system design decisions using working software and reproducible evidence.

The project begins with a modular monolith and PostgreSQL. Later increments introduce asynchronous processing, selected service extraction, distributed recovery, scaling, and production infrastructure. Feature count and service count are not measures of success.

This document set defines the project baseline and proposed architecture. The project owner has confirmed one merchant, one stock location, USD with two decimal places, and sandbox payments. Phases 01–07 specify the backend stack, authentication, purchase and refund policies listed below. These documents do not claim that application code, infrastructure, benchmarks, or operational controls exist.

## 2. Read this folder in order

| Document | Responsibility |
| --- | --- |
| This document | Product goal, included and excluded capabilities, assumptions, learning outcomes |
| [System actors and roles](system-actors-and-roles.md) | Human and machine actors, access boundaries, ownership rules |
| [Global architecture and evolution](global-architecture-and-evolution.md) | Module responsibilities, consistency boundaries, diagrams, architecture decisions |
| [Phase roadmap and Scrum plan](phase-roadmap-and-scrum-plan.md) | Ordered work packages, dependencies, prerequisites, milestone outcomes |
| [Global Definition of Done](global-definition-of-done.md) | Documentation quality, implementation evidence, measurable quality targets, release gates |

Folders `00-project-overview` through `07-payments-and-refunds` contain specifications. Folders 08–13 remain empty until requested; their roadmap entries are planning summaries. Documentation completion is separate from implementation and operational evidence.

Uppercase MUST, MUST NOT, SHOULD, and MAY express requirement strength using [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and its [RFC 8174 clarification](https://www.rfc-editor.org/rfc/rfc8174). In a draft, these words describe the proposed contract; they do not indicate stakeholder approval or completed implementation.

## 3. Lean scope

### 3.1 Core capabilities

| Candidate domain | Decision | Included boundary | System design learning value |
| --- | --- | --- | --- |
| Authentication and users | Include | Customer identity, administrator access, credential and session lifecycle, ownership enforcement | Trust boundaries, revocation, privilege separation, abuse controls |
| Product catalog and categories | Include | Simple sellable products, categories, current prices, active/inactive availability, bounded browsing | Read models, indexing, pagination, cache correctness |
| Inventory and stock management | Include | Stock adjustments, reservations, consumption, release, expiry, auditability | Transactions, contention, locking, conservation of stock |
| Shopping cart | Include | Customer-owned persisted cart, item quantities, removal, price revalidation at checkout | Concurrent updates, stale state, ownership, durability |
| Orders and lifecycle | Include | Immutable purchase snapshots, customer history, cancellation, minimal fulfillment progression | State machines, invariants, historical truth, concurrent transitions |
| Checkout | Include | Server-side total calculation, availability checks, reservation, order creation, payment coordination, recovery | Transaction boundaries, idempotency, orchestration, partial failure |
| Payments | Include | One provider integration in sandbox mode, attempts, authenticated callbacks, unknown outcomes, reconciliation | External consistency, deduplication, crash recovery |
| Full and partial refunds | Include | Refund requests and outcomes, cumulative amount limits, duplicate protection | Financial invariants, concurrency, compensation |
| Basic shipping and addresses | Minimize | Address snapshot and a simple shipping charge in checkout/orders; manual shipping and delivery updates | Stable order snapshots and lifecycle completion without a logistics subsystem |
| Notifications | Minimize | A transactional order notification delivered to a local sink when asynchronous processing is introduced | Durable publication, retry, deduplication, failure isolation |
| Product search | Minimize | Catalog-owned basic search, with PostgreSQL search/index experiments when justified | Query plans and text indexing without a separate discovery platform |
| Audit logging | Include as a cross-cutting control | Sensitive administrative actions, stock changes, payment/refund operations | Accountability, privacy, operational investigation |

Minimal shipping and notification capabilities MUST stay within the owning work packages. They do not introduce additional numbered domain phases.

### 3.2 Exclusions

| Candidate domain | Decision and rationale |
| --- | --- |
| Wishlists | Exclude; cart persistence already teaches the relevant ownership and storage concerns |
| Coupons | Exclude; adds pricing policy and redemption rules beyond the core transaction learning goals |
| Promotions | Exclude; adds scheduling and price precedence without a necessary new architecture problem |
| Complex product variants and attributes | Exclude; simple products are sufficient for indexing, inventory, and checkout experiments |
| Product or seller moderation | Exclude; no marketplace or seller onboarding is planned |
| Returns | Exclude physical return logistics; financial refunds remain included |
| Customer reviews | Exclude; additional CRUD and moderation do not advance the selected system design milestones |
| Ratings | Exclude; aggregate read models can be studied through the existing catalog and order domains |
| Advanced analytics | Exclude; operational metrics remain required |
| Business reporting | Exclude dashboards and exports for business intelligence; diagnostic queries and audit access remain in scope |
| Recommendations | Exclude; ranking and personalization would create a separate learning project |
| Carrier integrations and multi-warehouse allocation | Exclude from the proposed baseline; manual fulfillment and one stock location cover the purchase lifecycle |
| Full storefront, mobile application, and admin UI | Exclude from this backend roadmap; API clients and a minimal demonstration harness are sufficient |

The brief's coupon-validation example is therefore inapplicable. It MUST NOT become an implicit checkout requirement. Refunds MUST NOT silently introduce returns, return labels, or warehouse inspections.

## 4. Current decisions and remaining gates

The table records the current baseline and links each decision to its owning specification. Detailed engineering contracts remain drafts for implementation review; a documented policy is not evidence that its software exists. Later technology choices still require measured justification.

| ID | Current baseline or open decision | Why it matters | Owning specification or remaining gate |
| --- | --- | --- | --- |
| A-01 | Confirmed: one merchant operates the store; no marketplace sellers | Avoids marketplace settlement and tenant isolation scope | Confirmed for the project baseline |
| A-02 | Confirmed: one stock location, one stock record per product, whole units and no backorders | Bounds inventory ownership and allocation | [Inventory baseline](../03-inventory-and-stock/README.md) |
| A-03 | Confirmed: USD with two decimal places; integer cents throughout; no multi-currency implementation | Avoids rounding loss, currency conversion and multi-currency settlement | [Catalog monetary contract](../02-catalog-and-products/README.md) |
| A-04 | Anonymous catalog browsing; authenticated Customer cart and checkout; no guest checkout or Admin impersonation | Bounds identity and cart ownership | [Identity](../01-identity-and-auth/README.md) and [Cart](../04-shopping-cart/README.md) |
| A-05 | Confirmed: Stripe sandbox/test mode with protected operator-assigned test methods; existing simulator purchases remain synthetic | Makes failure experiments repeatable without moving real money | [Payments source boundary](../07-payments-and-refunds/README.md) |
| A-06 | Confirmed: immutable address snapshot and manual whole-order fulfillment; US destinations, USD 5.00 shipping and explicitly simulated 0% tax | Keeps logistics small while retaining a complete journey | [Orders](../05-orders/README.md) and [Checkout](../06-checkout/README.md); no real tax or deliverability claim |
| D-01 | Selected: ASP.NET Core 10, EF Core/Npgsql 10 and PostgreSQL 18 | Fixes implementation and operational tooling | [Identity operations](../01-identity-and-auth/deployment-and-devops/configuration-and-operations.md); pin supported stable patches during implementation |
| D-02 | Confirmed: five-minute preview quote and explicit acceptance; changed cart, prices or totals require a new preview | Prevents silent acceptance of changed purchase terms | [Checkout policy](../06-checkout/README.md) |
| D-03 | Confirmed: JSON JWT access plus rotating refresh credentials; mutually exclusive Customer/Admin roles; restricted Admin sources and operator-assisted sandbox recovery | Defines security and client contracts | [Identity scope](../01-identity-and-auth/README.md); email verification, self-service reset and MFA remain deferred |
| D-04 | Confirmed: fifteen-minute reservations without uncertainty extensions; cancellation before Processing; restricted Admin full/partial refunds; late success without stock is compensated; a refund before confirmation stops that purchase and requires full remaining compensation | Governs stock and money across failures | [Inventory](../03-inventory-and-stock/README.md), [Orders](../05-orders/README.md), [Checkout](../06-checkout/README.md), [Payments](../07-payments-and-refunds/README.md) |
| D-05 | Broker, cache, hosting platform, resource budget, and service extraction candidates require evidence | Premature selection adds operating cost and failure modes | At phases 08, 09, 10, and 13 as applicable |

The defaults keep the project small. Changing them is valid, but the roadmap and affected contracts MUST be reviewed before implementation. An unresolved decision may remain in the overview when it has an owner and deadline; it MUST NOT remain unresolved in an implementation-ready specification that depends on it.

## 5. End-to-end product outcomes

The following outcomes define the intended learning product. Later phases own their exact API schemas, state transitions, error responses, and acceptance scenarios.

| ID | Required outcome | Acceptance evidence and owning phases |
| --- | --- | --- |
| OUT-01 | An administrator can publish a simple product and establish available stock | Authorized creation succeeds; a customer cannot perform the same administrative mutation; phases 01–03 |
| OUT-02 | A customer can browse, keep a cart, and submit a purchase using current server-validated information | Stale cart prices or availability cannot silently become an incorrect accepted order; phases 02–06 |
| OUT-03 | Concurrent buyers cannot consume the same final unit | With one available unit and concurrent valid requests, at most one reservation succeeds; phase 03 and every subsequent architecture |
| OUT-04 | A customer can complete a sandbox payment and observe the resulting order | The amount and currency match the order snapshot; duplicate submissions and callbacks do not duplicate financial effects; phases 06–07 |
| OUT-05 | A delayed or uncertain provider result remains recoverable | A client timeout does not invent a failure or success; reconciliation reaches a documented terminal or explicit manual-review outcome; phases 07, 10–11 |
| OUT-06 | Cancellation and refunds preserve stock and money invariants | Stock is released at most once; ordinary refund admission cannot exceed captured funds; verified corrections remain visible; refunds do not restock, and consumed stock uses a separate reasoned Inventory adjustment; phases 03, 05–07 |
| OUT-07 | A confirmed order can progress through minimal fulfillment | Only permitted actors and transitions can record shipment/delivery; fulfilled quantities never exceed committed quantities; phase 05 integrated by phase 07 |
| OUT-08 | Optional work can fail without corrupting a purchase | A notification outage does not undo a paid order; backlog recovery produces no duplicate business record; phase 09 |
| OUT-09 | Architecture changes retain earlier guarantees | The original purchase, access-control, concurrency, and recovery scenarios remain valid after service extraction and scaling; phases 08–13 |

## 6. System Design Prerequisites & Concepts to Learn

### 6.1 Concepts to learn before implementation

| Concept | Mental model | Evidence of understanding |
| --- | --- | --- |
| Domain boundary and data ownership | A module exposes operations over facts it owns; another module cannot change those facts through its tables | Draw ownership for price, reservation, order, and payment; identify who enforces each invariant |
| Invariant and state machine | An invariant must hold across every allowed transition, including retries and concurrent requests | Explain why a refund has its own lifecycle instead of overwriting payment history |
| Transaction and isolation | A transaction groups local changes; the isolation level determines what concurrent work can observe | Trace two buyers reading one unit, then explain how the chosen write protocol prevents overselling |
| Idempotency and uncertain outcomes | A repeated logical command needs a stable identity; a missing reply does not prove the original command failed | Trace a payment success whose response is lost and show how the result is recovered |
| Latency, throughput, and capacity | Concurrency is work in progress; throughput is completed work per second; waiting time can rise before CPU saturates | Distinguish registered users, active sessions, concurrent requests, and requests per second |
| Consistency and asynchronous delivery | Local truth commits first; other components may learn about it later; duplicate and delayed delivery are normal design inputs | State which reads may lag and which decisions require authoritative data |
| Reliability and observability | Recovery needs durable state; diagnosis needs evidence linking the request, database work, and later processing | Explain how an unresolved payment is discovered, investigated, and resolved |
| Experimental reasoning | Hold workload and resource limits constant, change one design element, compare behavior | Produce a before/after result and describe costs as well as improvements |

Recommended initial study: PostgreSQL's [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html), followed by the phase-specific references in the [roadmap](phase-roadmap-and-scrum-plan.md). References explain mechanisms; project targets and design choices remain proposals defined here.

### 6.2 Architectural rationale and learning method

For every major change, the engineer MUST record the triggering problem, observed evidence, alternatives, chosen mechanism, operational cost, failure modes, and a repeatable verification experiment. A failed experiment is useful evidence and MUST NOT be relabeled as a successful milestone.

The learning cycle is:

1. State the invariant or measurable outcome.
2. Reproduce the failure or bottleneck in an isolated environment.
3. Explain the current design's limitation.
4. Compare the simplest viable alternatives.
5. Implement the selected design only after its phase is authorized.
6. Repeat the scenario under the same workload and resource limits.
7. Record the result, new failure modes, and remaining limits.

No deliberately unsafe baseline may be exposed to real users. Load and failure exercises use synthetic data and sandbox dependencies.

## 7. Success measures and scope discipline

- A complete sandbox purchase, cancellation, full refund, and partial refund can be demonstrated by the end of phase 07.
- Every architecture stage preserves the core invariants and contributes at least one measured learning outcome.
- Every introduced infrastructure component has an explicit owner, operating cost, failure behavior, and reason to exist.
- Performance claims name the workload, dataset, resource limits, and measurement window. User counts alone are insufficient.
- Security, data correctness, and basic recovery begin with the first relevant feature. Later hardening phases deepen these controls.
- The project MUST NOT claim production readiness from diagrams, compilation, or a single successful local request.

Detailed quality gates and initial measurement targets are owned by the [Global Definition of Done](global-definition-of-done.md). Scope additions require a concrete learning benefit and an explicit decision about the added time and complexity.
