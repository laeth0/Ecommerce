# System Actors and Roles

| Field | Value |
| --- | --- |
| Document | ACT-001 |
| Status | Draft for review |
| Scope | Project-wide identities, authorization boundaries, and operational responsibilities |
| Depends on | [Overview and planning assumptions](overview-and-learning-objectives.md) |

## 1. Actor model

An actor is a person or system interacting with the platform. An application role is a permission grouping. An operator's infrastructure access is a separate concern from customer or administrator privileges.

The proposed baseline has Customer and Admin application roles. Anonymous visitors have no role. Services, workers, provider callbacks, and deployment processes MUST use dedicated identities appropriate to their trust boundary. Their exact authentication mechanisms belong to the phase that introduces them.

| Actor | Purpose | Trust boundary | Owning phase |
| --- | --- | --- | --- |
| Anonymous visitor | Browse published products; start supported authentication flows | Untrusted public client | 01–02 |
| Customer | Maintain their cart; buy; inspect their orders; request eligible cancellation | Authenticated public client, still untrusted for ownership and money values | 01, 04–07 |
| Administrator | Maintain catalog and stock; perform permitted fulfillment and refund actions | Privileged application access with explicit authorization and audit | 01–07 |
| Payment provider | Process sandbox financial operations and deliver outcomes | External system; each callback must be authenticated and matched to local records | 07 |
| Background worker | Expire reservations, reconcile uncertain payments, dispatch durable work | Internal execution identity with bounded data access | First required in 03 or 07; expanded in 08–09 |
| Notification consumer | Handle committed order notifications through a local delivery sink | Internal consumer of untrusted message envelopes and validated payloads | 09 |
| Extracted service | Own its domain data and operations | Independent network and database boundary | 10 |
| Operator | Deploy, observe, restore, and execute documented recovery procedures | Infrastructure control plane, separate from ordinary business APIs | Baseline setup in 01; expanded in 08–13 |
| CI/CD identity | Build artifacts and perform specifically authorized release steps | Automation boundary with scoped credentials | Baseline CI in 01; deployment automation evolves later |

For a solo learning project, one person may perform customer, administrator, operator, and developer activities using separate identities. That convenience MUST NOT collapse the application's authorization boundaries.

## 2. Business permission matrix

“Own” means that the server derives the customer identity from validated authentication and checks the persisted resource owner. An identifier supplied by a client is never evidence of ownership.

| Operation | Anonymous | Customer | Admin | Machine actor |
| --- | --- | --- | --- | --- |
| Browse published catalog | Allow | Allow | Allow | Only if explicitly required |
| View unpublished products | Deny | Deny | Allow for catalog administration | Internal catalog workflow only |
| Register and authenticate | Public flow subject to abuse controls | Supported account flows | Public registration MUST NOT grant Admin | Deny use of human login as service authentication |
| Read or modify cart | Deny | Own cart only | No privileged access to another customer's cart | Checkout may read the authenticated customer's cart through its owner |
| Submit checkout | Deny | Own cart and order context | Customer scope only when separately entitled; no impersonation | Internal orchestration under validated customer context |
| Read orders | Deny | Own orders only | Minimum data needed for fulfillment and refunds | Domain-specific reconciliation only |
| Request cancellation | Deny | Own order when lifecycle permits | When lifecycle permits, with recorded reason | Recovery workflow only under its documented policy |
| Create or modify products | Deny | Deny | Allow with audit | No generic worker permission |
| Adjust stock | Deny | Deny | Allow with reason and audit | Inventory commands for reservation, release, and consumption only |
| Record shipment or delivery | Deny | Deny | Allow when lifecycle permits | No carrier integration in the baseline |
| Initiate a refund | Deny | Deny direct financial mutation | Allow when refund policy permits, with reason and audit | Explicit compensation workflow only |
| Declare payment succeeded | Deny | Deny | Deny manual override | Payments domain after authenticated provider evidence or reconciliation |
| Grant administrator privileges | Deny | Deny | No general-purpose role-management feature by default | Controlled bootstrap/provisioning process defined in 01 |
| Read credentials, signing secrets, or payment instruments | Deny | Deny | Deny | Only the narrow runtime credential access needed for an integration |

Customers may view refund outcomes on their own orders. Customer self-service refund requests are outside the proposed baseline; cancellation may trigger a refund through the documented workflow. Administrative access never bypasses order, stock, or money invariants.

## 3. Authorization requirements

The following controls apply from the first relevant feature. They follow the principles of least privilege, default denial, and authorization on each request described in the [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

| ID | Requirement | Acceptance condition |
| --- | --- | --- |
| AUTH-01 | Every protected operation MUST validate both actor permission and resource scope | Customer A cannot read or mutate customer B's cart, order, checkout attempt, or payment through any exposed identifier |
| AUTH-02 | Role and ownership claims from request bodies, query strings, and unsigned metadata MUST NOT grant privileges | Supplying another customer ID or an Admin label cannot change the authenticated actor's rights |
| AUTH-03 | Public registration MUST NOT create administrators | The registration contract rejects or ignores privilege input according to its explicit validation contract and creates no privileged account |
| AUTH-04 | Admin mutations MUST pass domain rules and persist an audit record with the mutation where locally transactional | An invalid refund or shipment is rejected even for Admin; failure to persist the required audit record cannot report a completed local mutation |
| AUTH-05 | Authentication errors and ownership denials MUST avoid exposing credentials or another customer's data | Phase 01 defines a consistent public error policy; later domains apply it to both reads and mutations |
| AUTH-06 | Changing or revoking credentials and privileges MUST have a documented effect on existing access | Phase 01 specifies the maximum revocation delay and verifies it under the chosen session mechanism |
| AUTH-07 | Callback authenticity MUST be established before business processing | Invalid, tampered, replayed, or mismatched provider messages cannot alter money or order state; valid duplicates remain safe |
| AUTH-08 | Internal services MUST authorize the requested operation independently of public ingress | Calling a service directly without the required service identity and actor context is denied |

Exact password rules, MFA requirements, token/session format, CSRF handling, rate-limit algorithms, and HTTP denial semantics require the identity threat model. This overview does not prescribe a browser storage mechanism or a token transport before the client and authentication contracts are selected.

## 4. Data access and ownership boundaries

| Information | Owner | Permitted consumers | Restriction |
| --- | --- | --- | --- |
| Password hashes and session credentials | Identity | Identity authentication and revocation operations | No other domain receives these values |
| Current product descriptions and prices | Catalog | Public catalog reads; checkout price validation | Customers cannot submit authoritative prices |
| Stock and reservations | Inventory | Checkout and order workflows through inventory operations | No direct counter edits from cart, payments, or administration code outside Inventory |
| Customer cart | Cart | Owning customer and checkout | Admin support access is not included |
| Order lines, totals, and address snapshot | Orders | Owning customer; permitted Admin; narrow integration consumers | Later catalog or account edits cannot rewrite the purchase record |
| Provider references, payment attempts, and refunds | Payments | Customer-safe order/payment views; permitted Admin; reconciliation | Public responses expose only the fields explicitly allowed by the payment contract |
| Audit events | The domain performing the sensitive action | Authorized investigation procedures | Sensitive payloads and secrets are excluded; retention and tamper controls are specified before public operation |
| Logs, metrics, and traces | Operational telemetry systems | Operators with appropriate environment access | No passwords, tokens, card data, or full addresses in telemetry; unbounded customer IDs are not metric labels |

The platform MUST avoid collecting raw card numbers or card security codes. Provider-hosted or provider-tokenized sandbox flows are the proposed payment boundary. This is an architectural scope choice, not a claim of payment-industry compliance.

## 5. Machine identities and recovery authority

- A reservation-expiry worker may release only reservations eligible under Inventory's state and time rules. It cannot mark payments failed.
- A reconciliation worker may query the provider and submit verified outcomes to Payments. It cannot invent a success to resolve an alert.
- A notification consumer cannot change payment, inventory, or order truth. Delivery failure is tracked separately.
- A provider callback is input to Payments. Payments validates the provider account, local payment mapping, amount, currency, and permitted transition before accepting its business effect.
- An operator may replay or reconcile through documented operations. Direct database edits are exceptional recovery actions requiring an explicit procedure, audit, and post-repair invariant checks.
- An extracted service has access to its own database credentials. Shared hosting does not grant access to another service's tables.
- A build identity does not automatically receive production deployment credentials. Release authority is specified with the deployment design.

## 6. System Design Prerequisites & Concepts to Learn

**Core concepts:** authentication versus authorization; role-based permissions plus resource ownership; least privilege; trust boundaries; confused-deputy risks; replay protection; auditability.

**Under the hood:** establish who called; validate the requested operation; load or constrain the target resource using authoritative ownership; apply domain rules; commit the mutation and required audit data; return only permitted information. A trusted network location does not replace these checks.

**Why this design:** Customer and Admin roles cover the lean business scope. Ownership checks prevent cross-customer access that role checks alone cannot prevent. Dedicated machine identities restrict the damage from a leaked worker or deployment credential.

**Alternatives:** a full policy engine and large support-role hierarchy are deferred because the current permission matrix does not require them. A shared administrator credential for humans and workers is rejected because it prevents meaningful attribution and privilege isolation.

**Costs and failure modes:** every new operation must declare permissions; stale privileges can outlive a role change; callbacks can be spoofed or repeated; legitimate recovery tools can become privilege escalation paths.

**Learning experiment:** using two customer identities and one administrator identity, attempt cross-customer access, client-supplied privilege escalation, an invalid administrative state transition, and a forged payment callback. Each attempt must leave business state unchanged and return the domain's documented denial. Repeat direct service access after extraction.

**Recommended study:** [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), especially object-level access checks, default denial, and permission verification. Exact experiments and evidence belong to phases 01 and 07, then repeat in phase 10.
