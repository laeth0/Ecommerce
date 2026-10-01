# Cart Quality Targets

**Status:** proposed implementation acceptance targets. Documentation contains no measured performance, executed transaction or availability evidence.

## Measurement contract

Use the existing .NET/EF Core/Npgsql and PostgreSQL 18 stack. Prepare 100 categories, 10,000 products, 10,000 synthetic Customers, 8,000 durable carts and 2,000 Customers with no cart. For seeded nonempty carts, 80% have 1–5 lines and 20% have 20; include retained empty parents separately. Record SKU popularity, unit-price/name lengths, visibility distribution, line counts and database statistics. Normal write products must be publicly sellable; hidden/category-inactive cases and intentional conflicts run separately. Stock quantities do not control Cart success.

Resource envelope: all application processes 2 vCPU/2 GiB in aggregate, PostgreSQL 2 vCPU/4 GiB, generator outside those budgets. Record host/storage, patches, pools, expiry-worker activity and telemetry overhead. Compare replicas within the same total resource envelope. Authenticate before measurement, use 50 concurrent clients with one in-flight request each and one-second think time, warm up two minutes, measure ten minutes and repeat three runs.

Normal request mix: 60% GET, 25% SetItem, 10% RemoveItem, 5% Clear. Assign a single writer to each measured Customer so ordinary runs do not intentionally create stale conflicts. Track expected versions from receipts; GETs are included in the declared request mix. Preserve a separate read-only owner pool for maximum-size carts, and use bounded writer carts with known permitted products. Record the actual line-count distribution throughout a run; do not quietly measure only carts emptied by clear. SetItem changes quantity/adds lines, RemoveItem targets existing lines and Clear targets nonempty carts for measured effective-write classes. Measure no-ops separately.

## Acceptance requirements

| ID | Requirement | Pass condition in each normal-load run |
| --- | --- | --- |
| CRT-NFR-01 | Customer-observed GET and each mutation class latency | p50 ≤150 ms, p95 ≤500 ms, p99 ≤1,000 ms, including real Identity checks and database work |
| CRT-NFR-02 | Completed useful throughput | At least 25 successful requests/second under the declared mix, including effective writes; report class throughput |
| CRT-NFR-03 | Unexpected failures | <0.5% of valid normal-load attempts, including unexpected 5xx, timeout and capacity rejection; deliberate invalid/conflict traffic reported separately |
| CRT-NFR-04 | Interactive database command latency | p95 ≤100 ms per measured command including execution/lock wait; report pool wait and total per-request database time separately |
| CRT-NFR-05 | Integrity and concurrency | Zero duplicate parents/products, committed version-0 parents, lost accepted edits, cap breaches, partial parent/line commits or version reuse |
| CRT-NFR-06 | Ownership and visibility | Zero successful unauthorized accesses or hidden Catalog payload disclosures; revocation races obey transaction order |
| CRT-NFR-07 | Money and stock boundary | Every displayed USD subtotal equals its exact checked sum; unavailable totals are null; Cart operations create zero Inventory balance/movement/reservation changes |
| CRT-NFR-08 | Bounded work | ≤20 returned lines, ≤21 intent rows fetched for corruption detection, one Catalog batch query rather than one query per line; decoded GET ≤65,536 bytes and receipt ≤1,024 bytes |
| CRT-NFR-09 | Failure response | Recognized DB/lock/pool failure produces sanitized failure within ten seconds; no stale/empty-cart success fallback; no commit acknowledged before commit completes |
| CRT-NFR-10 | Persistence and recovery | Contents/versions survive normal restart, clear retains version history, readiness reflects required dependencies, isolated restore passes integrity inspection |

At least 1,000 completed samples are required per reported latency class per run. Extend measurement when Remove/Clear or the 20-line GET class is undersampled, and record the actual window. Report typical, empty/virtual, 20-line and unavailable-line GETs separately, as well as effective writes/no-ops. Include offered attempts, all outcomes, client timeouts and slow responses in workload reporting. Successful-response percentiles alone cannot hide a failed error/throughput gate. All classes must pass in each declared run; zero-tolerance integrity/authorization gates override speed.

## Contention, availability and recovery

Run two-client and 100-concurrent-client edits against one owner separately from normal load. With one shared expected version and distinct effective edits, at most one change commits; others conflict or encounter the bounded lock/dependency timeout, each reported distinctly. Two no-ops may both succeed. Repeat at 19 lines, from no parent, and with stale clear/refill. A high conflict rate under deliberate contention is not normal-load availability evidence.

The project 99.9%/30-day availability objective and broader 100-user mixed-workload gate belong to later operating phases. Phase 04 cannot claim them. Reuse sandbox RPO ≤24 hours and RTO ≤2 hours for a combined isolated backup/restore drill, including Identity session revocation and all existing Inventory recovery checks. Cart has no new worker, retry queue or convergence deadline. A Catalog/primary failure blocks a coherent current-price view; liveness can remain healthy while readiness fails.

## System Design Prerequisites & Concepts to Learn

Study latency distributions, sample sufficiency, parent-row contention and snapshot lifetime. Compare one-line and 20-line queries at the same dataset/resources, then concentrate writers on one owner. Determine whether tail latency comes from authorization, pool waiting, row locks or Catalog hydration before proposing another component. Use the [capacity plan](../performance-and-scalability/capacity-and-concurrency.md) and [global targets](../../00-project-overview/global-definition-of-done.md) when recording evidence.
