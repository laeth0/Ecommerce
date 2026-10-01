# Quality Targets

**Status:** proposed measurable targets. No benchmark, broker drill, database execution or deployment has occurred. All [Phase 08 targets](../../08-production-ready-monolith/non-functional-requirements/quality-targets.md) still apply to the purchase system.

| ID | Required target | Evidence/acceptance |
| --- | --- | --- |
| EVT-NFR-01 | Zero eligible committed mutations without matching outbox intent after activation | Given rollback/commit crashes, then owner audit/fact and eligible event reconcile exactly |
| EVT-NFR-02 | At most one local receipt per source/event identity | Given duplicates/replay/two senders, then unique receipt count remains one |
| EVT-NFR-03 | Zero notification-driven stock/Order/money/authority changes | Given valid, invalid or malicious events, then business invariants and protected grants remain unchanged |
| EVT-NFR-04 | No false Published from unknown/returned publication; no false Delivered from intake | Given boundary fault, then each persisted state reflects only its actual proof |
| EVT-NFR-05 | Healthy commit-to-local-receipt lag p95 ≤5s, p99 ≤15s at 10 new events/sec | Three declared runs, ≥1,000 eligible events/run; include all eligible events, not only fast completions |
| EVT-NFR-06 | Healthy publish and intake lag each p95 ≤2s, p99 ≤5s | Primary-clock timestamps; broker/inbox wait included; report total lag separately |
| EVT-NFR-07 | Sustained local delivery service ≥20 events/sec on one enabled worker instance | Ten-minute backlog experiment; complete receipts, not confirms or attempts |
| EVT-NFR-08 | At ≤1,000 affected events, recover ≥99% to Delivered or explicitly alerted review within five minutes after dependency recovery | Record operator resume timing; review is a fault disposition, not normal delivery success |
| EVT-NFR-09 | Existing Phase 08 API latency/throughput targets pass; eligible write p95 regression ≤10% | Same dataset/resources/mix, three runs with producer hooks and background delivery |
| EVT-NFR-10 | Finite resources: ≤8,192 body bytes, depth 8, ten attempts/cycle, no unbounded memory queue | Boundary, crash-count, overload and shutdown evidence |
| EVT-NFR-11 | All normal planned PostgreSQL pools ≤80 connections; 20 reserved slots retained | New maxima 41/71 at one/two replicas; measured actual and configured bounds |
| EVT-NFR-12 | Local shutdown ≤15s; stopped work retains recoverable identity | Given stop during confirm/ack/sink, then replay does not lose intent or duplicate receipt |
| EVT-NFR-13 | No public broker/management/notification operation; TLS and least privilege | Access-denial, certificate, grant and source-mapping evidence |
| EVT-NFR-14 | Zero forbidden PII/secrets in event payload, telemetry or operating output | Payload/schema/diagnostic review including invalid-input paths |
| EVT-NFR-15 | Open quarantine/parking/ManualReview detected within 60s of observable state | Alert evaluation and investigation drill; diagnostic loss raises its own alert |
| EVT-NFR-16 | No automatic deletion of original envelopes or deduplication/replay evidence | Retention/grant review and restore of terminal/ManualReview rows |
| EVT-NFR-17 | Whole-database RPO ≤24h/RTO ≤2h including messaging validation and existing provider reconciliation | Timed isolated complete restore; unmet safety/time targets remain failed |
| EVT-NFR-18 | Frozen v1 replay remains valid across compatible releases | Old-envelope/schema/route and rollback evidence; no remote schema lookup |

## Measurement semantics

Use owner occurred_at as commit-intent time; the transaction includes its small precommit interval. Measure first_published_at, inbox received_at and receipt delivered_at from the primary. A confirm's local recording time is not a broker commit timestamp. Retain failures, unanswered samples and phase completion time. Percentiles over completed events alone can hide loss: report eligible count, count delivered by deadline, pending count/oldest age, review/quarantine/skipped counts and final reconciliation.

Healthy success requires Delivered within target; ManualReview, quarantine and Skipped are not healthy completions. Fault experiments may meet the separate visible-disposition gate without delivering every event. The 99.9% purchase availability objective from Phase 08 remains an objective for later hosting evidence; notification success is a separate SLI. A business HTTP 202 does not prove notification or payment completion.

The one-node broker offers no broker HA objective. Broker failure should preserve the purchase path while outbox capacity is safe; primary failure remains a shared authoritative dependency. A missing telemetry interval is unknown evidence.
