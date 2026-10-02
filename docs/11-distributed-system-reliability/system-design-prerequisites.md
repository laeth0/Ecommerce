# System Design Prerequisites and Concepts to Learn

## Study sequence

For each concept, draw a concrete purchase trace, name its authority and simulate a failure between two commits. Study the concept before implementing its work package.

| Concept | Under the hood / exercise | Why it matters here | Study and experiment |
| --- | --- | --- | --- |
| Safety versus liveness | List forbidden outcomes separately from work that must eventually progress; close a link while a hold exists | An unavailable permission can be safe; timeout-based permission can corrupt stock/money | [System design](system-design.md); REL-F04/F07 |
| Ambiguous distributed result | Owner commits, response is lost, caller retries the original identity and reads original receipt | Transport failure says nothing definitive about remote commit | [Phase 10 protocol](../10-microservices/reliability-and-failure-scenarios/workflow-coordination.md); REL-F01/F02 |
| Idempotency versus deduplication | Compare canonical request under command ID; compare exact event bytes under source/ID; provider key identifies a different boundary | One identity does not protect all steps; changed payload conflicts | REL-F01/F09; AWS [idempotent API guidance](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) |
| Orchestration and compensation | Walk acceptance, capture, hold, decision, finalization, release; then late capture with expired stock | Multiple local commits require explicit recovery rather than rollback | [Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga); [analysis](reliability-and-failure-scenarios/workflow-and-compensation-analysis.md) |
| Isolation and lock order | Identify root locks, row versions and the consume/decision atomic commit; hold a conflicting local transaction | A read across HTTP cannot reserve a financial version; one lock order prevents avoidable deadlock | PostgreSQL [explicit locking](https://www.postgresql.org/docs/18/explicit-locking.html); REL-F07/F12 |
| Leases, tokens and epochs | Pause worker A, expire its lease, let B claim; reject A's local apply; then restore while old A still runs | A stale result differs from an already executed external effect; restore requires stronger fencing | REL-F06/F15; [database design](database/leases-recovery-and-integrity.md) |
| Time budget versus business deadline | Draw public 10s, RPC 2s, action 10s, lease 30s, cycle 5m, stock 15m and provider 23h on separate lines | Cancellation stops waiting; no timeout rewrites stock or first-send | [Transport policy](reliability-and-failure-scenarios/retry-timeout-and-breaker-policy.md); REL-F03/F04 |
| Exponential backoff and jitter | Persist one bounded delay per failed claim; compare same-time failures under fixed and jittered scheduling | Disperses retry waves while introducing measurable amplification | AWS [timeouts and jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/); REL-F03 |
| Circuit breaker and bulkhead | Count actual eligible failures, open one class, admit one half-open operation; saturate reads without taking command slots | Breaker admission and capacity isolation solve different problems | [Circuit breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker); REL-F04/F05 |
| At-least-once messages and poison handling | Lose a publish confirm, lose consumer ack, then inject invalid bytes; compare outbox, inbox and sink receipts | Duplicate delivery is expected; poison messages cannot become authority | RabbitMQ [confirms](https://www.rabbitmq.com/docs/confirms), [quorum queues](https://www.rabbitmq.com/docs/quorum-queues); REL-F09/F10 |
| Event time versus observation time | Replay an old valid notification; compare highest hint, actual owner version and fact application time | Delayed hints cannot raise authoritative money or reorder historical decisions | [Message policy](functional-requirements/event-and-compatibility-contracts.md); REL-F11 |
| Queue stability and retry amplification | Compute arrival rate × calls/operation × attempts; measure service rate and recovery debt | More workers/pools can overload the same primary/account | [Capacity](performance-and-scalability/retry-amplification-and-recovery-capacity.md); REL-F05/F13 |
| Distributed traces and sampling | Follow HTTP parent spans, then a new worker trace linked to accepted intent | One long open span is not a durable workflow record | OpenTelemetry [trace links](https://opentelemetry.io/docs/concepts/signals/traces/); REL-F14 |
| RPO/RTO and asymmetric recovery | Restore skewed snapshots, compare terminal decision and hold, reconcile provider gap without inventing rows | Two valid archives need cross-owner integrity proof | [Phase 10 restore](../10-microservices/deployment-and-devops/backup-and-restore.md); REL-F15/F16 |

## Questions to answer before implementation

1. Which exact local transaction makes each public acknowledgement true?
2. Which response is a receipt, which is current evidence, and which is only a hint?
3. How can a stale worker result be rejected while its remote effect remains real?
4. What prevents an Admin refund from invalidating preconfirmation capture during a partition?
5. Why can a confirmation hold never expire into permission to fulfill?
6. Which original IDs/bytes/first-send times survive resumption, restart and restore?
7. Where does the attempt counter increment, and how does a breaker avoid infinite deferral?
8. Why can one account's safe retry throughput be lower than its advertised rate limit?
9. What would justify adding a workflow engine, cache, second executor or physically separate server later?
10. Which evidence would falsify a claimed recovery, rather than merely show an HTTP success?

Exit the prerequisite review with a worked trace for successful purchase, lost-response purchase, late capture, failed compensation and asymmetric restore. The [experiment catalog](testing-strategy/fault-experiment-catalog.md) gives the proof obligations; it is not evidence that the experiments ran.
