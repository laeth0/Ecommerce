# Inventory: System Design Prerequisites & Concepts to Learn

**Status:** Phase 03 study plan and failure experiments. The [project roadmap](../00-project-overview/phase-roadmap-and-scrum-plan.md#03--inventory-and-stock) sets stock conservation and durable reservation expiry as the learning outcomes.

## 1. Balances, availability, and conservation

**Concept.** Physical stock, units promised to active reservations, and units available for a new reservation are distinct facts. A read of available stock is an observation; only a guarded transaction can allocate it.

**Under the hood.** Model `available = on_hand - reserved` with nonnegative quantities. Reserving moves units from available to reserved without reducing physical on-hand. Consumption reduces both on-hand and reserved. Release or expiry reduces reserved only. A physical adjustment changes on-hand but cannot make it smaller than reserved.

**Why.** Decrementing on-hand at reservation time and incrementing it on release can work, but then on-hand no longer means physical stock and a duplicate release creates units. Separate counters make the accounting proof and operator reconciliation easier.

**Alternatives and costs.** An append-only ledger alone can derive balances, but summing it during every hot-row reservation is expensive. A materialized balance plus a transactionally written movement ledger uses more writes; it supports fast guarded allocation and independent reconciliation.

**Experiment.** Starting at on-hand 5/reserved 0, reserve 3, consume 2 through an appropriate reservation, release the remaining reservation, and compare both counters and the sum of movement deltas after each commit. Deliberately repeat a release and show that no new stock is created.

## 2. Row locks and final-unit races

**Concept.** Two clients can both read one available unit before either writes. A correct implementation serializes the decision at the stock row and rechecks the invariant after waiting.

**Under the hood.** In PostgreSQL, a guarded `UPDATE ... WHERE on_hand - reserved >= quantity RETURNING ...` or a `SELECT ... FOR UPDATE` followed by a guarded write can establish a single winner. For a multi-item reservation, lock every required stock row in a stable product-ID order and commit all lines or none.

**Why.** A plain application read followed by an unconditional write loses updates and oversells. Increasing API replicas does not fix a shared database race.

**Alternatives and costs.** Serializable isolation can detect conflicting transactions but requires correct retry handling. Optimistic versions expose conflicts but can be noisy on a hot SKU. Explicit row locks and guarded updates make the first baseline easy to inspect, at the cost of contention on popular stock rows.

**Experiment.** Set one unit available and launch two simultaneous reservations from separate connections and API replicas. Exactly one should commit; the other must receive a stock conflict. Repeat with a second product in the batch and verify that a failed batch leaves both products unchanged. Study [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html) and [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

## 3. Reservation state and authoritative time

**Concept.** A reservation is durable permission to attempt a later stock consumption until a database-defined deadline. Consumed, Released, and Expired are incompatible terminal outcomes.

**Under the hood.** A terminal transition locks the reservation, reads PostgreSQL `clock_timestamp()` after waiting, checks the current state/deadline, updates all affected balances and ledger rows, and commits. An expiry worker finds due active reservations from the database; memory timers are only wake-up hints.

**Why.** Application clocks can differ between replicas. A process can crash after a timer fires but before release. Database state and time let another worker resume safely and prevent payment completion from consuming an already expired reservation.

**Alternatives and costs.** A scheduled message per reservation introduces delivery, duplication, and ordering problems before a broker is justified. Periodic bounded polling adds database scans and expiry lag; an index and idempotent terminal transition bound those costs. Phase 06 will define how an unresolved payment is handled when its reservation reaches the deadline.

**Experiment.** Pause a consume and an expiry worker on the same reservation; release the locks in both orders. Inspect the one terminal state, balance delta and movement ledger. Kill the worker before and after commit, restart it, and show that due work is rediscovered without double release. Study PostgreSQL [`SKIP LOCKED`](https://www.postgresql.org/docs/current/sql-select.html) and the difference between transaction-start and wall-clock time.

## 4. Idempotency and unknown commits

**Concept.** A timeout does not prove that a stock mutation rolled back. Repeating a command safely requires a stable operation identity and a persisted result or terminal state.

**Under the hood.** A stock adjustment carries a caller-generated operation UUID; a reservation batch carries a stable checkout-intent UUID and canonical line fingerprint. A retry with the same identity and same intent returns the recorded outcome; a changed payload conflicts. Terminal reservation commands re-read their state under lock before writing any movement.

**Why.** Network retries and worker restarts are normal. Without persisted deduplication, a repeated decrement or release can silently corrupt stock.

**Alternatives and costs.** An in-memory dedupe map fails after restart and across replicas. A database uniqueness constraint plus state machine adds rows and index writes, but survives both. Rejected commands with no committed stock effect may be evaluated again against current stock unless the contract explicitly persists the rejection.

**Experiment.** Crash after a successful adjustment commit but before the HTTP response, retry with the same operation UUID, then retry with a different amount. Compare final balance and ledger. Repeat a terminal reservation command after a worker restart.

## 5. Module boundaries and recovery

**Concept.** Catalog owns sellability and product identity; Inventory owns stock and reservation truth; Checkout later coordinates an accepted order with both. A cart read never allocates stock.

**Under the hood.** Inventory references the immutable Catalog product UUID but does not modify Catalog price or publication fields. A reservation checks current sellability inside its database transaction and returns a durable reservation identity. Checkout will later place the reservation and order snapshot in one local transaction before any payment-provider call.

**Why.** A cached listing or cart cannot prove that stock is still free. Crossing a module boundary through an explicit operation makes future extraction costs visible without adding distributed infrastructure now.

**Alternatives and costs.** A single generic product table with price and stock updates in every module is simpler initially but destroys ownership and makes future checkout races harder to reason about. A separate Inventory service would add network failure and cross-service atomicity before the monolith baseline exists.

**Experiment.** Archive or hide a product while reserve waits on its Catalog row; then resume and verify the serialized outcome. Compare a direct SQL stock edit with the Inventory operation and explain why the latter alone preserves the ledger and reservation invariants.
