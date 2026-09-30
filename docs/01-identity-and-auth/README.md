# Phase 01 — Identity and Authentication

| Field | Value |
| --- | --- |
| Specification | ID-01 |
| Status | Draft for review; documentation only |
| Owner | Project owner |
| Architecture stage | Modular monolith |
| Predecessor | [Project overview](../00-project-overview/overview-and-learning-objectives.md) |
| Successor | `02-catalog-and-products` |

## 1. Objective and confirmed scope

Establish a small identity module that later domains can trust: a customer can register, log in, renew access, and log out; an administrator has narrowly authorized access; an operator can recover or disable a sandbox account without a public recovery endpoint.

The project owner selected:

- ASP.NET Core, EF Core, and PostgreSQL.
- JWT access tokens and rotating refresh tokens returned in JSON; protected APIs use `Authorization: Bearer`.
- Sandbox accounts, operator-assisted recovery, basic roles, and restricted administrator access.
- Deferral of email verification, self-service password reset, MFA, and advanced account recovery.

This phase resolves the identity direction previously reserved by overview decisions D-01 and D-03. The detailed policies below are a proposed specification, not evidence of implementation. The earlier overview remains the record of phase 00; these documents provide the later, more specific identity decisions.

## 2. Reading order and authoritative contracts

| Document | Owns |
| --- | --- |
| [System design prerequisites](system-design-prerequisites.md) | Concepts, mechanisms, alternatives, and experiments to study first |
| [Architecture decisions](architecture-decisions.md) | Selected design, boundaries, rationale, and diagrams |
| [Identity workflows](functional-requirements/identity-workflows.md) | Business rules, stories, state transitions, acceptance criteria |
| [API contracts](functional-requirements/api-contracts.md) | Exact endpoints, JSON schemas, headers, public errors |
| [Schema and transactions](database/schema-and-transactions.md) | PostgreSQL DDL, ownership, locking, concurrency, retention |
| [Threat model and controls](security/threat-model-and-controls.md) | Password/JWT rules, trust boundaries, authorization, privacy |
| [Quality targets](non-functional-requirements/quality-targets.md) | Latency, capacity, availability, and correctness measures |
| [Capacity and rate limiting](performance-and-scalability/capacity-and-rate-limiting.md) | Admission limits, shared counters, bounded resources, query work |
| [Recovery and concurrency](reliability-and-failure-scenarios/recovery-and-concurrency.md) | Failure matrix, retries, crash and replay behavior |
| [Verification scenarios](testing-strategy/verification-scenarios.md) | Traceable manual and future automated verification requirements |
| [Configuration and operations](deployment-and-devops/configuration-and-operations.md) | Settings, administrator boundary, operator commands, startup and CI |

When documents disagree, the conflict must be resolved before implementation; an implementer must not choose whichever requirement is easiest. Uppercase requirement words have the meaning established in the [global overview](../00-project-overview/overview-and-learning-objectives.md).

## 3. Scope boundaries

| Include now | Defer or exclude |
| --- | --- |
| Customer registration without automatic login | Email ownership verification; email delivery infrastructure |
| Password login and bounded per-device sessions | Social login, federation, OAuth authorization-server behavior |
| Rotating refresh tokens and replay-triggered session revocation | Browser cookies, browser token persistence, mobile storage implementation |
| Current-session logout and current-user read | Customer session-management UI and self-service account deletion |
| Customer/Admin roles with explicit resource policies | Generic permission editor, tenant model, impersonation |
| Admin read of a minimal user support record from an allowed network | Public role management, public account reset, MFA |
| Operator create-admin, reset-password, disable/enable, and revoke-sessions operations | Self-service recovery, email changes, advanced account recovery |
| Basic audit, admission control, cleanup, configuration validation, and local CI requirements | Redis, broker, distributed cache, service extraction, Kubernetes |

Email is an unverified login identifier. It MUST NOT prove mailbox ownership, authorize account linking, trigger messages, or justify password recovery. Use synthetic accounts and private development environments. Unrestricted public administrator access and use with real customer identities remain outside this phase's operating envelope.

Anonymous catalog browsing and authenticated customer cart/checkout remain the proposed later-domain baseline. This phase creates no catalog, cart, order, or payment endpoint.

## 4. Epics and delivery outcomes

| Epic | Stories and technical outcomes | Demonstration |
| --- | --- | --- |
| E-01 Account entry | ID-FR-01 registration; ID-FR-02 login; password and identifier policies | Synthetic customer registers and obtains its own credentials; no public privilege escalation |
| E-02 Session lifecycle | ID-FR-03 refresh; ID-FR-04 logout; transactional rotation and revocation | Two sessions work independently; replay revokes only its originating session |
| E-03 Authorization | ID-FR-05 current user; ID-FR-06 restricted admin lookup | Customer cannot use Admin operation; Admin cannot bypass network restriction |
| E-04 Operator recovery | ID-FR-07 provisioning/recovery; account-wide serialization | Reset or disable prevents old access and old refresh credentials from issuing access |
| E-05 Operating foundation | Schema, migrations, settings, audit, limits, cleanup, diagnostics | Two replicas share consistent identity state and fail closed during database outage |

These are work packages, not a promise to complete the folder within one Sprint. Fine-grained implementation tasks and new automated tests are not created in this documentation phase.

## 5. Fixed policy baseline

The values are proposed project policy. Changing them requires updating the API, persistence, configuration, and verification contracts together.

| Policy | Customer | Admin |
| --- | --- | --- |
| Access JWT lifetime | 300 seconds | 300 seconds |
| JWT validator clock skew | At most 30 seconds | At most 30 seconds |
| Absolute session lifetime from login | 14 days | 8 hours |
| Refresh inactivity lifetime | 7 days | 30 minutes |
| Maximum concurrent active sessions | 5 | 5 |
| Credential response transport | JSON over HTTPS | JSON over HTTPS from an allowed admin network |
| Authorization source | Valid JWT plus current user/session state in PostgreSQL | Same, plus Admin role and source-network restriction |

Refresh extends only the inactivity deadline, capped by the original absolute deadline. Ordinary API requests do not extend either deadline. Database expiry checks use `clock_timestamp()` and no grace period. JWT clock skew never extends a database session deadline.

## 6. Definition of Done for this phase

Specification completion requires all linked contracts to agree, machine-readable JSON schemas and documented DDL to pass the available static checks, and all deferred features to remain excluded.

Implementation completion additionally requires evidence for all [verification scenarios](testing-strategy/verification-scenarios.md), including real PostgreSQL concurrency, two-replica revocation, refresh replay, operator recovery, source-network enforcement, failure handling, and measured password cost. A build cannot substitute for those outcomes.

No application, migration, test project, or deployed identity system is delivered by these documents. The [global Definition of Done](../00-project-overview/global-definition-of-done.md) still applies.
