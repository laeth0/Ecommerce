# Gateway, TLS and Routing Contract

## Problem and ownership

The edge must terminate trusted client HTTPS while preserving application identity, original request bytes and bounded failures. A broad route, stale source header or automatic POST replay can violate contracts even when the backend is correct.

Use approved supported Gateway API/Envoy Gateway versions. Platform authority owns GatewayClass/listener/TLS policy; narrow release authority owns reviewed application routes. No service mesh or private financial TLS termination is introduced.

Envoy documents [backend TLS](https://gateway.envoyproxy.io/docs/tasks/traffic/backend-tls/) and [response overrides](https://gateway.envoyproxy.io/docs/tasks/traffic/response-override/). Actual selected-version capability/CRD conformance must be demonstrated; quickstart configuration is not a compatibility proof.

## Route/listener matrix

| Traffic | Destination / rule |
| --- | --- |
| Original `/api/v1` retail routes | Commerce retail HTTPS listener, original route/method/parser/authority contract |
| Exact `/api/v1/payments/webhooks/stripe` path | Payments callback HTTPS listener; POST success only under original signed-ingress protocol |
| Unsupported method on callback path | Original405/Allow:POST contract; no successful fallback to another owner |
| Unknown retail route/method | Original404/405 Problem contract; no raw URL echo or invented success |
| `/internal`, management, health, metrics, diagnostics, cluster/data/broker paths | No public backend mapping or private listener reachability |
| Commerce↔Payments private operations | Direct approved private Service/mTLS listener; outside Gateway routing |

Route matching is exact on the callback path, with no rewrite, query-based owner selection or wildcard callback prefix. Unknown retail paths may reach only the Commerce retail host's original unknown-route handler; they cannot select internal listeners.

Only approved sandbox hostnames are served. Wrong/unapproved host receives bounded nonrouting denial; it cannot be used to reach a private virtual host. Plain HTTP cannot accept credentials/body and has no payment forwarding path; this baseline does not redirect a credential POST into HTTPS.

Backend TLS uses a fixed reviewed CA/server SAN via supported BackendTLSPolicy or equivalent reviewed Envoy capability. No trust-skip/insecure upstream HTTP is allowed outside original loopback exceptions. Gateway does not possess financial client certificates or assert private role/epoch for public requests.

## Original bytes and headers

Preserve original UTF-8 bytes, media/encoding/header rules and Idempotency-Key/Authorization/If-Match negotiation. Do not decompress, transcode, reserialize, mirror or shadow a purchase/refund/callback.

Global edge buffering ceiling is at most the largest original admitted body,262,144 bytes; individual retail routes retain their own smaller application limits. Callback retains one Stripe-Signature≤4,096 bytes, raw body≤262,144/depth32, no compression and original signature300s tolerance/account/object verification.

Clear internet-supplied forwarded-client-certificate and private epoch/provenance authority. Strip/rebuild forwarding headers from the actual trusted transport; a client header cannot create a trusted source. Public trace/baggage/correlation cannot force sampling or become private authority.

## Effective source and Admin access

Application trusted-proxy configuration allowlists exact Gateway peers/networks and the verified hop count. Edge reconstructs the effective source from actual socket/trusted infrastructure; original IPv4/IPv6-/64 normalization remains.

kind/Docker/WSL address translation can collapse clients to one effective source. Measure it. If three genuine source groups cannot be provided, the Phase 12 1,000-session healthy plan remains Not run or fails source admission; do not forge headers to fabricate groups.

Restricted Admin network checks use the verified effective source, never simply “request came from Gateway.” Direct untrusted requests to app listeners must not bypass the same source rules.

## Timeouts and errors

Retail edge total request budget≤10s; application original10s and nested budgets remain. Disable retries, hedging, mirroring and redirect replay at Gateway/HTTPRoute/backend policy. A timeout or backend reset after forwarding is Unknown relative to an owner commit; the client uses the original key/receipt recovery.

Pass original application responses unchanged, including no-store, RFC9457 Problem, server UUID X-Request-Id, ETag/Location/Allow/Retry-After and original CORS negotiation. Do not rewrite all backend500/404/403 into one generic response.

For edge-origin known-route unavailable/timeout/reset, use original503 Service.Unavailable, title `Service unavailable`, detail `The operation could not be completed. Follow the documented recovery procedure.`, media application/problem+json, no-store and generated canonical UUID X-Request-Id/traceId. Safe immediate local capacity shedding may include Retry-After:1; unknown recovery time may omit it.

The Problem's instance is the matched original route template or `/api/v1/unknown`, never raw customer IDs/query. Request.TooLarge413 and media/method/route denials retain original exact code/title/detail/Allow rules.

The selected implementation MUST demonstrate its edge-local Problem formatter, fresh UUID generation, route-template normalization and distinction between local and application responses. Static text/html Envoy defaults do not pass. If the pinned API cannot implement that bounded contract, record the blocker and review a concrete compatible adapter before deployment; do not invent a new public error schema or silently waive it.

TLS handshake failure precedes HTTP and need not emit an HTTP Problem. It is a distinct transport failure in evidence.

## Availability and verification

Gateway controller reconciliation acceptance and actual proxy readiness are separate checks. Inspect expected route/backend-reference/TLS status and perform protected real HTTPS traffic/negative access. A ready controller alone cannot reopen owner admission.

Exercise exact callback bytes/duplicates, unknown path/method, wrong host/CA/SAN, forged source/cert/header, backend outage/reset/timeout, oversized body and edge restart. Count edge-origin valid-request failures/maintenance in observed availability without double-counting backend errors.

No tunnel, domain publication, paid load balancer or internet exposure is created by this task.
