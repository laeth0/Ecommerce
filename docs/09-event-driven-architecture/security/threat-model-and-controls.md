# Threat Model and Controls

**Status:** required Phase 09 controls, with runtime/grant/certificate evidence pending. Retain the [Phase 08 security baseline](../../08-production-ready-monolith/security/threat-model-and-controls.md), private accounts and provider controls.

## Assets and trust boundaries

Protect immutable owner intent, envelope identity, recipients, financial fact links, deduplication evidence, operator authority, broker/DB credentials and recovery archives. Boundaries are owner-to-outbox, relay-to-broker, broker-to-intake, intake-to-primary, protected tooling-to-work metadata and backup/restore-to-retained broker state.

CloudEvents identity, a digest, correlation IDs and tracing do not authenticate a sender. Transport trust requires private TLS connections, authenticated principals, restricted exchanges/vhost, validated source/type/route and controlled topology. A broker/publisher compromise may forge notification history; it must still be unable to mutate business owners. Contain it by revoking credentials, stopping intake and comparing retained work to canonical owner intent.

## STRIDE controls

| Threat | Concrete risk | Required control/evidence |
| --- | --- | --- |
| Spoofing | A Customer or Orders publisher claims a refund fact | No public publishing route; distinct producer credentials/exchanges; reject source/type/route mismatch; forged source denial scenario |
| Tampering | Replayed event changes amount/recipient under one ID | Immutable bytes/digest, strict schema and owner provenance; duplicate compares bytes; conflict quarantine preserves original |
| Repudiation | Unattributed replay or skip hides delivery loss | Authenticated operator, reason, operation UUID/fingerprint and atomic append-only receipt/audit |
| Information disclosure | Address/token/provider payload in events/logs/parking | Allowlisted minimal payload; bounded invalid evidence contains digest/code only; private encrypted storage; telemetry redaction and restricted inspection |
| Denial of service | Oversized payload, requeue loop, full queue or pool exhaustion | Broker/consumer byte limits, finite pools/prefetch/actions/attempts, bounded reconnect and parking; storage alerts and admission containment |
| Elevation of privilege | Consumer invokes paid/fulfillment/refund transitions | No business mutation grants/owner calls, no runtime DDL/superuser; operator and topology credentials separate from Admin Bearer access |

## Credentials and least privilege

Orders relay can publish only commerce.orders.v1; Payments relay only commerce.payments.v1. Notification principal can consume only the normal queue and cannot publish/rebind/delete resources. Protected recovery can inspect parking; topology management alone configures exchanges/queues/bindings/policies. Avoid broad resource regexes and default-exchange rights; verify anchored exact permissions and supported topic restrictions. [RabbitMQ access control](https://www.rabbitmq.com/docs/access-control)

Producer database permissions insert its own outbox only through the owner path. Relay credentials cannot edit immutable bytes or business tables. Notifications runtime grants cover its local tables by role; protected inspection/resume reuses bounded operator facilities, not Customer/Admin requests. The monolith's shared process cannot guarantee isolation after process compromise; report process-level and database-grant evidence separately.

Use AMQPS and database TLS per existing policy, validate certificates/hostnames, disable guest/default access and restrict management UI/API/metrics to approved private networks. No public plaintext listener or committed credential. Rotate credentials through drained connections; a live old connection may need explicit revocation/closure. Restore current protected credentials, not retired ones from an old export.

## Input and privacy controls

Set broker max_message_size=8192 to reject excessive payloads before application intake, plus the independent 8,192-byte/depth-8 consumer rule. It is a body limit, not a bound on every protocol/header allocation. Apply connection/channel limits and bounded metadata parsing; never copy/log arbitrary headers. [RabbitMQ configuration](https://www.rabbitmq.com/docs/configure)

Reject invalid UTF-8, duplicate keys, unexpected members, unsupported schemas, bad UUIDs/amounts, wrong subject/fact identity and source/route mismatches. Schemas are pinned locally; dataschema cannot trigger network fetch, file access or arbitrary code. Never deserialize polymorphic types selected by message input. Trace context has no authority.

No email, address/name, product descriptions, free-form Admin reason, password/token, provider key/ID, raw Stripe envelope or live card data appears in an event. Customer UUIDs and financial amounts are still protected data. Encrypt broker/primary volumes and backups, restrict local receipt inspection and keep typed history out of general logs.

Malformed body quarantine stores a SHA-256 digest, bounded code/route and safe canonical ID hints only. The broker necessarily holds original bounded bytes until durable intake/parking review; it may contain hostile sensitive input. Restrict access, prohibit payload logging/exports and use attributed disposal after investigation. Do not copy broker definitions containing password hashes into Git.

## Authorization and abuse invariants

Existing API authority, Admin source networks, whole-cart/Order/financial versions and quota scopes remain unchanged. A notification cannot revoke/grant a role, impersonate a Customer, mark paid, refund or release stock. Restricted Admin refund acceptance still requires existing API authority and payment-parent admission; event arrival cannot substitute for it.

Operator requests validate target/state/version/active lease and exact operation identity. No arbitrary SQL, payload editor, business mutation or unbounded replay command is exposed. SkipValid requires proven canonical source and attribution; invalid evidence cannot fabricate a local receipt.

Given compromised consumer input, then business writes are denied by grants and module boundaries. Given secret-looking invalid payload, then telemetry/quarantine contain no body. Given a public Admin token, then broker/operator control remains unavailable. Given a source/identity conflict, then the original receipt/intent is never overwritten.
