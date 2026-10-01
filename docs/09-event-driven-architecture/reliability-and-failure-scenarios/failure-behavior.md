# Reliability and Failure Behavior

**Status:** required behavior, with fault evidence pending. Preserve [existing payment uncertainty and compensation](../../07-payments-and-refunds/reliability-and-failure-scenarios/failure-behavior.md).

## Boundary failures

| Failure | Persisted outcome and recovery | Forbidden outcome |
| --- | --- | --- |
| Crash before owner commit | Roll back local mutation/audit/outbox; ordinary owner replay/reconciliation | Phantom event |
| Crash after owner commit before relay | Original Pending row is discoverable | Reconstructing a new event from current state |
| Broker accepts but confirm is lost | Original intent retries; intake deduplicates | New ID or false Delivered |
| Mandatory return plus positive confirm | Return makes publication unsuccessful; bounded retry/review | Published solely from positive confirm |
| Broker unavailable/resource alarm | Outbox remains Pending/ManualReview; paid Order remains valid while primary capacity is safe | Reversing money/stock because notification failed |
| Queue full or parking unavailable | Reject/block publication; safe DLX retains source work; alert | Drop-head, downgrade dead-lettering or expiry |
| Intake crashes before commit | No acknowledgement; redelivery/parking | Lost notification from automatic ack |
| Intake commits then ack is lost | Matching duplicate sees original inbox/intent | Another delivery cycle or receipt |
| Primary unavailable during intake | Pause/close with outstanding delivery unacknowledged; bounded reconnect | Ack or empty successful intake |
| Local sender crashes after claim | Lease expiry, counted attempt, same intent | Reset attempts on process restart |
| Sender crashes in effect transaction | Receipt and completion both roll back | Receipt without committed work progress |
| Sender commits then crashes | Delivered receipt survives; exact duplicate remains one | Another local effect |
| Unsupported/malformed/conflicting body | Durable bounded quarantine before ack; protected canonical-source review | Mutating the original or guessing version |
| Ten attempts exhausted | ManualReview, cleared lease/due, alert and scoped audited resume | Unbounded retry or silent success |
| Crash on tenth claim | Guarded expired-lease sweep records ManualReview | Permanently stuck Pending/Scheduled or eleventh attempt |
| Out-of-order status/refund events | Independent historical receipts, version/time/correction link displayed | Dropping distinct facts or treating arrival as authority |
| Reversal precedes success | Record reversal referencing prior fact; later success remains historical | Increasing current refundable money through notifications |
| Customer disabled after original fact | Local sandbox history still records committed fact, with no user-facing delivery or Identity mutation | Reviving account/session or resolving an address |
| Broker disk/whole node lost | Stop transport, recreate approved topology, republish canonical undelivered work | Assuming publisher confirms survive storage loss |
| Old broker timeline after DB restore | Controlled drain with restored-source validation; missing/conflicting source quarantined | Normal delivery of unproved post-snapshot facts |
| Operator stale version/active lease | Conflict, no scheduling/audit-success receipt | Cancelling a live publisher by changing its token |
| Telemetry exporter unavailable | Bounded dropped diagnostics and explicit gap; business/event work retained | Making log/trace delivery a transaction prerequisite |

## Recovery policy

Application relay/sender retry delays and finite budgets are in [operating contracts](../functional-requirements/module-and-operating-contracts.md#retry-cycle). Broker delivery count is separate. ManualReview is visible unresolved work, not a delivered terminal state. Duplicate intake cannot restart cycles.

Recovery operators inspect ≤100 candidates/pass with persisted continuation and individual guarded actions. They distinguish canonical valid work, invalid evidence, source conflicts and absent restored intent. All accepted schedules/skips commit with operation receipt/audit. An invalid record can be discarded; a supported canonical notification can be explicitly Skipped; neither is Delivered.

Under broker/consumer outage, purchases continue only while primary durability/resources and existing worker gates remain safe. At the storage containment threshold, restrict new optional mutation through Phase 08 controls; continue required financial observation/compensation within remaining capacity. An inability to persist a required outbox event fails the local owner transaction; externally occurred financial truth stays uncertain until owner recovery commits it.

## Financial and stock boundaries

Order Confirmed notifications require the existing actual confirmation transition; they cannot themselves confirm. Reservation expiry remains 15 minutes despite transport delay. Late verified payment without usable stock follows original compensation. A preconfirmation refund still stops the purchase and compensates remaining money through Payments/Checkout, regardless of when notification arrives.

Refunds after historical confirmation leave Order/stock unchanged. An admitted reversal corrects the financial projection and may reopen original compensation coverage in Payments; its notification is a separate historical effect. Unknown funds, failed compensation and integrity holds retain their original review rules. Broker replay never issues a Stripe call or resets a 23-hour mutation window.

## Recovery assertions

Given any transport fault after owner commit, then original intent remains available until delivered or attributed review. Given a poisoned event, then valid unrelated work remains bounded and recoverable. Given restore with a provider gap, then original provider/Order/key reconciliation holds remain before business reopening. Given missing instrumentation, then delivery claims remain unknown until durable counts and timing evidence are reconciled.
