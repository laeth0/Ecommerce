# Payments Non-Functional Requirements

**Status:** proposed implementation acceptance gates. No latency, provider, database, concurrency, availability or restore measurement has been made in this documentation increment.

## Workloads and measurement rules

Use the existing .NET10/EF Core/Npgsql/PostgreSQL 18 stack. Reference dataset:10,000 synthetic Customers/products,100,000 retained Orders/bindings/payment intents, at least 100,000 refunds with 1..50 per selected payment, mixed work states, deep history/equal creation times and explicit anomalies. Typical amount5,498cents; include provider amount boundaries and one-cent refunds. No real card/address data.

Application aggregate 2vCPU/2GiB; primary PostgreSQL 2vCPU/4GiB; generator outside both. Record exact patches/storage/pools/workers/telemetry. Local performance workload uses 50 clients, one in-flight request/client, one-second think time:60% financial GET,38% refund-history GET,2% new Admin refund acceptance with adequate balances/fresh versions. Use at least 10 distinct restricted Admin actors for the mutation mix and keep offered rate within the shared minute quotas, including auxiliary reads. Separate concurrent same-payment races and deliberate invalid requests. Warm 2minutes, measure 10minutes, three runs; extend until each operation has≥1,000 completed samples. Report offered/completed counts, all auxiliary authentication/version-refresh calls, percentiles, useful mutations, replay/conflicts, unexpected rejections, pool/lock waits, allocations and queue age.

**Local capacity runs MUST NOT load-test Stripe.** Use the isolated deterministic source or a separately approved future adapter stub, explicitly labeled. Existing simulator cannot demonstrate provider callbacks/reversals or partial refund integration; controlled stubs may exercise those local paths during later authorized verification. No stub or test infrastructure is created now. Actual sandbox verification uses small functional probes, with≤0.5 new payments/sec,≤0.1 new refunds/sec,≤100 affected objects per recovery drill and the account-wide≤5requests/sec budget. API-only reads/acceptance measurements and provider end-to-end results are separate.

## Measurable requirements

| ID | Category/requirement | Pass condition under the declared healthy workload |
| --- | --- | --- |
| PAY-NFR-01 | Financial-summary read | p50≤100ms,p95≤300ms,p99≤750ms including authority/projection; Admin audit included |
| PAY-NFR-02 | Refund-history page | p50≤100ms,p95≤300ms,p99≤750ms at shallow/deep positions, limit 20/50 |
| PAY-NFR-03 | Durable Admin refund acceptance/replay | p50≤150ms,p95≤500ms,p99≤1,000ms through commit/receipt, excluding asynchronous settlement |
| PAY-NFR-04 | Verified webhook ingress | p50≤100ms,p95≤300ms,p99≤750ms through durable receipt; no provider/Order work in request |
| PAY-NFR-05 | Useful local throughput | ≥30 completed eligible retail API requests/sec; unexpected5xx/timeouts/capacity rejects<0.5%; no sustained growth in required local work backlog |
| PAY-NFR-06 | Interactive database command | p95≤100ms including lockwait; report poolwait and transaction duration separately |
| PAY-NFR-07 | Financial scheduling lag | Eligible healthy due work/inbox hint to started action p95≤5s,p99≤15s within rated arrival budgets |
| PAY-NFR-08 | Verified fact propagation | Financial commit to correct Checkout resolution/compensation scheduling p95≤5s,p99≤15s when primary/workers are healthy |
| PAY-NFR-09 | Actual sandbox convergence | Report acceptance→provider capture/refund observation and acceptance→business outcome percentiles separately; target p95≤10s,p99≤30s for supported immediate fixtures at the small probe rate; unsupported/pending fixtures are separate |
| PAY-NFR-10 | Financial integrity | Zero ordinary double dispatch effects, false capture/no-capture/refund claims, over-reserved refunds, erased corrections or missing required compensation |
| PAY-NFR-11 | Security/privacy | Zero unauthorized target/source/refund access; zero raw card/secret/provider payload/PII in responses, logs, traces, metrics or artifacts |
| PAY-NFR-12 | Bounded resources | Retail bodies≤4,096bytes; callback≤262,144bytes; FinancialView≤4,096;receipt/view≤1,024;history≤65,536; provider response≤1MiB/page≤100 |
| PAY-NFR-13 | Bounded recovery | ≤10 unsuccessful observations/cycle; permanently unresolved work reaches alerted ManualReview within 5minutes of healthy scheduling; original IDs preserved |
| PAY-NFR-14 | Fault recovery | At≤100 affected intents/refunds,≥99% reach legitimate outcome or explicit ManualReview within 5minutes after dependencies recover; integrity violations remain zero |
| PAY-NFR-15 | Retained financial scan | Complete one persisted reconciliation cycle per24hours at the verified admitted dataset size; report cycle coverage/lag and refuse growth assumptions unsupported by service rate |
| PAY-NFR-16 | Restore | Isolated sandbox RPO≤24h,RTO≤2h includes provider-gap reconciliation/quarantine before purchase/fulfillment admission; DB startup alone fails the gate |

Healthy normal latency/error denominators include eligible requests with enough refundable money/current version; deliberately invalid, contention and provider fault cases are counted separately with all outcomes reported. No reclassification of unexpected failures is permitted. A fast202 with stranded refunds fails convergence. Provider eventual bank settlement has no promise in this sandbox; initial Succeeded is reported as provider-observed state and remains subject to verified correction.

## Budgets and failure isolation

| Resource | Required bound |
| --- | --- |
| API executing admission/shared pool | ≤100requests/replica; existing pool maximum 20/replica |
| Pool/lock/statement/transaction/request |1s/250ms/2s/3s/10s respectively; provider wait has no connection |
| Payments action slots/DB worker pool |2/2 for the active outbound executor; inbox/discovery/wake/scans share bounded turns |
| Outbound account calls |≤5requests/sec, burst2, concurrency2; initial topology has exactly one outbound executor |
| Provider call/action/lease |2s complete call /10s action /30s lease; fence after final waits |
| Discovery/claims/pagination |≤100 per class/pass or list page; one short claim per action; persisted scan position |
| Backoff |1,2,4,8,16,30s thereafter; max10 unsuccessful observations/cycle; rate-limited wait uses max(backoff,valid bounded provider delay) |
| Shutdown |Stop claims/admission; drain/cancel within 15s; durable keys/leases/work remain |
| Provider mutation retry horizon |Exactly23h from persisted earliest-send time; call must complete before cutoff; no automatic new key |

Finite pools/slots protect other modules from callback/provider stalls. Count API replicas, Identity/Inventory/Checkout/Payments workers, migrations/operators/monitoring and recovery reserve against PostgreSQL max_connections. Two API replicas do not imply two uncoordinated outbound account executors. A provider outage closes new Sandbox purchase admission and refund dispatch as appropriate, while primary-backed reads/exact receipts remain usable. Existing accepted refund instructions remain durable; ordinary refund acceptance during a transient provider outage may reserve money only when the configured refund-admission gate is open. Explicitly closed admission returns503 for new instructions, but exact replay still works.

## Consistency, availability and durability

Bindings, keys, financial counters, refund reservations, effective facts/audit and current version are strongly consistent primary transactions. Provider side effects and Checkout application converge eventually. No distributed transaction, read replica or cache authorizes financial admission or fulfillment. A verified capture/failed refund correction cannot be lost merely because coordinator application failed.

The proposed99.9%/30-day shared API availability objective remains Phase08/13 evidence. Measure retail API availability and financial settlement timeliness independently; 202durability is not financial completion. Liveness depends on responsiveness, readiness on safe configuration/primary/required worker lifecycle. Remote provider outage is a financial admission/alert condition, not a reason to restart all monolith instances. No real bank settlement or zero-data-loss claim follows from local database durability.

Use shared sandbox restore targets now; later RPO≤5min/RTO≤60min requires the subsequent infrastructure/recovery phase. Retain enough immutable IDs/provider metadata and outside-restore reconciliation access to find provider effects missing from the restored DB. Revocation and protected replay rules apply after restore. An unresolved orphan prevents affected purchase/fulfillment from reopening.

## Observability, maintainability and compatibility

Every provider action records bounded outcome/duration/retry/window/lease diagnostics without secret/object payload. Expose low-cardinality request/DB/pool/queue/call/capture/refund/reversal/hold/wake/scan metrics. Proposed alerts and operator actions are in [operations](../deployment-and-devops/configuration-and-operations.md). UUIDs/provider IDs/free-text reasons/customer data are restricted audit fields, never metric labels.

Central named Options validation, immutable API/source descriptors and strict module boundaries are required. API schemas are versioned; existing Orders/Checkout responses remain unchanged. Supported provider versions are explicit; a new major version requires reviewed schemas, recorded adapter observations and compatible deployment. Local money uses checked integer arithmetic and typed amount/currency; no float conversion or uncontrolled mutable DTO is a financial source.

Business rules remain separable from provider I/O/clock/randomness and persistence where practical; stable IDs and explicit transaction inputs make future verification possible. New automated tests/projects/fixtures/mocks/dependencies require later explicit authorization. This phase defines manual scenarios and future coverage without creating them.

## System Design Prerequisites & Concepts to Learn

Study percentile distributions, admitted arrival rate versus provider service rate, bounded queues, primary consistency and end-to-end recovery time. Use [capacity experiments](../performance-and-scalability/capacity-and-provider-budgets.md) to distinguish local throughput from external capability and the [verification scenarios](../testing-strategy/verification-scenarios.md) to collect actual evidence.
