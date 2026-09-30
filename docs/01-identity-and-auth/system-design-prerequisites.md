# Identity: System Design Prerequisites & Concepts to Learn

**Status:** specification draft. Study and experiment guidance; no application or automated tests are implemented by this document.

## 1. Learning objective

Explain how an identity decision remains correct when requests are malicious, credentials are stolen, requests overlap, or a process fails. The phase establishes authentication, authorization, credential lifecycle, durable access revocation, and the minimum application foundation for later domains.

Use the [global actor model](../00-project-overview/system-actors-and-roles.md) and [quality gates](../00-project-overview/global-definition-of-done.md) as the starting constraints. Identity does not own carts, orders, payment data, or product permissions beyond establishing the actor and their authorized role.

## 2. Authentication, authorization, and resource ownership

**Concept:** authentication identifies the caller; authorization determines whether that caller may perform an operation on a particular resource. A Customer role does not establish ownership of every customer record.

**Under the hood:** validate the credential; obtain a server-controlled user identifier and current access state; check the operation's permission; constrain the resource lookup by its owner; execute the permitted operation. Public request fields cannot change the actor context.

**Triggering problem:** accepting a customer ID from a body or URL can expose another customer's data even when the request has a valid login.

**Alternatives and rationale:** use a small role model plus explicit ownership checks. A large policy engine is unnecessary for Customer and Admin; role checks alone are insufficient for customer-owned resources.

**Costs and failure modes:** each operation needs a declared policy. Over-broad administrator access and stale role information can bypass the intended boundary.

**Experiment:** authenticate two customers. Change every exposed resource identifier and attempt privileged operations. Verify the denial and unchanged state, not merely the response status. No cart or order endpoints are created in phase 01 solely to perform this exercise; repeat it when those domains exist.

**Study:** [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## 3. Password verification and computational cost

**Concept:** a password verifier intentionally costs computation. A random salt prevents identical passwords from producing identical stored verifiers. A password hash is not an encryption format from which the application retrieves the password.

**Under the hood:** normalize according to the accepted password contract; derive a verifier with a dedicated password-hashing implementation; store the version and parameters; verify later using those parameters; upgrade outdated parameters only after successful verification and a concurrency-safe credential recheck.

**Triggering problem:** a database leak exposes password verifiers, while unrestricted verification requests can exhaust application CPU or memory.

**Alternatives and rationale:** compare a vetted memory-hard algorithm with a supported platform password hasher. A fast digest such as SHA-256 alone is unsuitable for passwords. High-entropy random tokens have different properties and can use a fast cryptographic digest for lookup.

**Costs and failure modes:** increasing hash cost slows attacks but also increases legitimate login cost. Performing expensive hashing while holding database locks amplifies contention. A password change can race with a login that verified an older hash.

**Experiment:** measure verification duration and resource use at the selected parameters, then run concurrent logins and a password change. Demonstrate bounded admission and rejection of a stale credential verification result.

**Study:** [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Exact algorithm parameters belong to this phase's security contract; benchmark results must not justify silently weakening them.

## 4. Session credentials and revocation

**Concept:** a session connects authenticated access to a particular login. A signed token proves that an issuer signed claims; it does not by itself prove that the account or session is still allowed to act.

**Under the hood:** verify token authenticity or look up an opaque credential; check its intended use, expiration, account state, and session state; derive actor context; reject invalid or revoked access. Distinguish per-device logout from account-wide credential changes.

**Triggering problem:** a credential can remain cryptographically valid after logout, privilege removal, or password recovery.

**Alternatives and rationale:** compare opaque database sessions with signed access tokens backed by revocable session state. Stateless access validation reduces database reads but leaves an explicit revocation delay; immediate revocation requires authoritative state or a distributed invalidation design.

**Costs and failure modes:** state checks create database dependency and load. Cache invalidation introduces a revocation window. A request already authorized before revocation can still be in flight, so sensitive mutations need an explicit concurrency boundary.

**Experiment:** revoke access on one application replica and immediately use the same credential on another. Also pause a sensitive mutation between authentication and commit; verify the documented ordering against revocation.

**Study:** [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [JWT security guidance](https://www.rfc-editor.org/rfc/rfc8725). The phase's selected credential contract determines which mechanisms apply.

## 5. Single-use secrets and concurrent consumption

**Concept:** a rotating refresh credential grants renewal authority only once. Checking “unused” before starting a transaction does not serialize concurrent consumers.

**Under the hood:** locate a candidate by a digest; acquire the documented account/credential locks; recheck eligibility against database time; commit consumption and its effect together. Retain the evidence needed to distinguish safe repetition from replay where the selected protocol requires it.

**Triggering problem:** two requests can both pass the same pre-check and rotate one credential inconsistently.

**Alternatives and rationale:** guarded updates and row locks can both establish an atomic decision. Choose a consistent lock order across flows. An application-process mutex cannot coordinate multiple replicas.

**Costs and failure modes:** contention, deadlocks, and lost responses remain possible. Rolling back a transaction must roll back consumption; receiving no response does not establish that the transaction rolled back.

**Experiment:** send simultaneous consumers to two replicas; interrupt one request around commit. Inspect the final records and prove that the protocol's permitted effects occurred at most once.

**Study:** PostgreSQL [row-level locks and deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html). Refresh-token rotation and replay handling are discussed in [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700); using those ideas does not make a custom first-party login API an OAuth authorization server.

## 6. Enumeration resistance and abuse controls

**Concept:** errors, response timing, and rate limits can reveal whether an account exists. Controls also need to limit CPU-intensive verification without granting an attacker a permanent account lockout mechanism.

**Under the hood:** validate input; apply limits derived from trusted network information and normalized identifiers; perform a comparable verification path for existing and nonexistent accounts where required; return the same public failure contract; record bounded internal diagnostics.

**Triggering problem:** one generic message does not prevent enumeration if one branch returns immediately and another performs an expensive password check.

**Alternatives and rationale:** combine network, identifier, and resource-capacity limits. Account-only blocking lets an attacker deny service to a victim; IP-only blocking is weak against distributed sources and harsh on shared networks.

**Costs and failure modes:** shared counters add database writes; identifier cardinality can grow under attack; trusting forwarded headers lets callers choose their own rate-limit identity.

**Experiment:** compare wrong-password and unknown-account requests with the same workload, rotate source identifiers, and exhaust the hash-work budget. Measure latency distributions, database growth, and the behavior of legitimate requests.

**Study:** [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Numerical limits and acceptable measurement bounds are project policies, not universal security guarantees.

## 7. Browser credential transport and CSRF

**Concept:** browser cookies may be attached automatically; an Authorization header set by a client follows different request rules. Cross-origin access controls and CSRF protection solve different problems.

**Under the hood:** identify which credentials a browser automatically sends; constrain allowed origins and request media types; use the chosen framework's anti-forgery mechanism when ambient credentials authorize mutations. Restrict credential storage and never place secrets in URLs or telemetry.

**Triggering problem:** a hostile page can cause a browser to send requests with the victim's ambient credentials, even when the hostile page cannot read the response.

**Alternatives and rationale:** evaluate transport as a whole: client types, cookie settings, anti-forgery validation, token exposure to scripts, and refresh transport. Choosing JSON Bearer tokens does not make script compromise harmless; choosing HttpOnly cookies does not remove CSRF considerations.

**Costs and failure modes:** permissive CORS, missing login CSRF controls, leaked tokens, and mismatched development/production cookie settings can invalidate the design.

**Experiment:** attempt a mutation and login from an untrusted origin with the selected credential transport. Inspect both server-side effects and response visibility.

**Study:** [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## 8. Operator recovery and administrative authority

**Concept:** recovery is another path to account authority. An unverified email address cannot establish that a caller owns the account. A locally privileged operator and an application administrator are different authorities.

**Under the hood:** identify the intended synthetic fixture through controlled operator access; validate the new password; lock the user; replace its verifier and security version; revoke its sessions; commit the audit record with the change. Public API callers have no access to this command.

**Triggering problem:** an operator reset can race with credential issuance, or accidentally target the wrong account. A startup seeder that repeatedly replaces an Admin password can also undo deliberate recovery actions.

**Alternatives and rationale:** the user selected explicit operator-assisted recovery for the restricted sandbox. Self-service recovery needs a verified communication channel and additional contracts; it is deferred along with MFA. Explicit provisioning avoids repeated startup credential changes.

**Costs and failure modes:** operator access becomes sensitive infrastructure authority. This process covers known synthetic accounts, not identity proofing for real customers. An uncertain commit requires audit inspection before repeating a reset.

**Experiment:** pause login after checking the old password, reset it through the operator command, and then resume login. Verify that no old authority remains usable and that the audit identifies the operator and target without recording the password.

**Study:** the distinction between credential replacement, access revocation, and recovery authority in [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Email verification, self-service reset, and MFA require a separate later security design.

## 9. Readiness to implement

Before writing application code, the engineer must be able to trace: successful login; denied login; session revocation; simultaneous secret consumption; credential change racing with login; database outage; and a committed operation whose response was lost.

For every trace, identify the authoritative record, transaction boundary, lock order, public result, sensitive data that must remain private, and recovery procedure. The selected phase contracts must resolve these details before implementation is described as ready.
