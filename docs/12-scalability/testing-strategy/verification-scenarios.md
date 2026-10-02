# Scalability Verification Scenarios

**Status:** future evidence index; all runtime scenarios are Not run in this documentation task. No automated tests, fixtures, test projects, generators or fault infrastructure are supplied.

| ID | Required assertion | Functional / quality mapping | Experiment |
| --- | --- | --- | --- |
| SCL-V01 | Closed plan validates tier/model/rates/resources/data/source/stop scope; generator limits visible | FR01/02; NFR30 | X01/X02 |
| SCL-V02 | Original Reference100 full mix/latency/≥ 50 useful/failure/backlog targets | FR02; NFR05/06 | X01 |
| SCL-V03 |250/500/1,000 paced tiers meet stated goals or explicit unreached/Failed, no hidden demand reduction | FR02; NFR07–09/30 | X01 |
| SCL-V04 |1,000 normal live sessions/login/refresh/logout and ≥ 3 verified sources; no token/authority bypass | FR01/02; NFR16 | X01/X02 |
| SCL-V05 | Two replicas share original global/source/actor quotas and correct window/error behavior | FR01/04; NFR15 | X02 |
| SCL-V06 | Core/auxiliary/pacing/timeouts/drops counted; complete time/admission budgets | FR01/02; NFR14/16/30 | X01/X02 |
| SCL-V07 | D0/D1/deep/heavy/search/skew query plans and immutable response equality | FR03; NFR05/10/12 | X03 |
| SCL-V08 | Statistics/vacuum/WAL/long-snapshot cost and storage headroom under healthy load | FR03; NFR10–12 | X03/X10 |
| SCL-V09 | Index/query proposal exact predicates/collations/grants/validity, write regression and rollback | FR03; NFR12/26 | X03 |
| SCL-V10 | New statement after hide/category/price edit uses original primary truth/no-store/cursor contract | FR03/05; NFR02/04 | X03/X04 |
| SCL-V11 | Last-unit/batch/multi-product sorted locks/conservation/no partial accepted state | FR05; NFR01 | X04 |
| SCL-V12 | Same key/changed body/cart-version/quote/deadline races preserve original identity/total/stock | FR05; NFR01–03 | X04 |
| SCL-V13 | Full pool 48/79/reserve/execution/no third overlap/source inventory | FR04; NFR13–15 | X02 |
| SCL-V14 | Duplicate worker/token/version/epoch and process ownership; no sticky session dependence | FR04; NFR03/14 | X02/X09 |
| SCL-V15 | Original command/receipt/event bytes and retry cycles remain across scaled faults | FR04/06/10; NFR03/04/14 | X05/X09 |
| SCL-V16 | Provider account/executor/rate/scan and fair accepted-work recovery unchanged | FR04/06/10; NFR17/19 | X05/X09/X10 |
| SCL-V17 | Cache gate includes primary guards/read economics and actual approved resources | FR07; NFR20 | X06 |
| SCL-V18 | Cache current snapshot/price/category/publication/slow old fill rules | FR07; NFR02/21 | X06 |
| SCL-V19 | Cold/cache/primary outage and saturated bounded fallback preserve errors/authority | FR07; NFR21/22 | X06 |
| SCL-V20 | Cache entry MAC/key/schema/namespace/restore/key rotation; no private data | FR07; NFR21/22 | X06/X11 |
| SCL-V21 | Cache 20ms/no-retry/TTL/size/map/fill/memory/resource limits | FR07; NFR22 | X06 |
| SCL-V22 | Standby gate safe protected read volume/benefit, no public/current control switch | FR08; NFR23/24 | X07 |
| SCL-V23 | Standby lag/conflict/fallback/slot/pool/WAL/resource costs bounded | FR08; NFR13/23/24 | X07 |
| SCL-V24 | Correct primary fence before fresh standby snapshot; current authority/fingerprint and primary outage | FR08; NFR02/24 | X07 |
| SCL-V25 | Source/timeline/epoch/cluster-wide disk/grants/restore/rebuild; no promotion | FR08; NFR24/26 | X07/X11 |
| SCL-V26 | Hash-line candidate PK/FK/check/collation/pruning/planning/write/maintenance benefit | FR09; NFR25 | X08 |
| SCL-V27 | Negative global-ID/time-partition/source-ID uniqueness and retained-data deletion cases rejected | FR09; NFR03/25 | X08 |
| SCL-V28 | Missing/wrong partition/copy/ORM/OID dependencies do not partially commit or reopen unsafe writer | FR09; NFR25/26 | X08/X11 |
| SCL-V29 | Actual event multiplicity/rate/relay ceiling/≥ 20 sink receipts and fair stable backlog | FR06; NFR17/18 | X05 |
| SCL-V30 | Publish/ack loss, duplicates/reorder/parking/queue pressure and canonical recovery | FR06; NFR03/17/18 | X05/X09 |
| SCL-V31 | Complete resource/disk growth/cost and no evidence cleanup to pass capacity | FR03/04/10; NFR11/13/30 | X02/X10 |
| SCL-V32 | Claimed D1 routine maintenance/paired backup and restore costs actually support growth | FR03/10; NFR10/11/28 | X10/X11 |
| SCL-V33 | Actual provider population/retained scan economics separate from simulator 1m Orders | FR03/10; NFR19/30 | X10 |
| SCL-V34 | Gate lifecycle/current reviewer/one-writer compatible adoption and postwrite rollback | FR09/10; NFR04/26 | X11 |
| SCL-V35 | Authenticated paired-v3 asymmetric restore counts/identities/provider gap and safe RPO/RTO | FR10; NFR03/28 | X11 |
| SCL-V36 | Old executor/epochs/source gaps/holds/cache/standby never fabricate restored permission | FR07/08/10; NFR01–03/28 | X09/X11 |
| SCL-V37 | Telemetry finite dimensions/cardinality/privacy/overhead and diagnostic outage evidence | FR10; NFR27 | X01/X09 |
| SCL-V38 | Cross-user/role/source/cache/replica/prototype/tool permission and audit failure denial | FR01/07–10; NFR02/27 | X02/X06–08/X11 |
| SCL-V39 | Closed reports/count inequalities/status/limits/economics and failed/Not run outcomes | FR01/10; NFR30 | All executed/proposed experiments |
| SCL-V40 |10k/100k analytical quota/refresh/resource limits and rolling availability evidence distinctly labeled | FR01/10; NFR29/30 | Analytical review/existing SLI ledger |

FRxx and NFRxx abbreviate SCL-FR-xx and SCL-NFR-xx in [workflows](../functional-requirements/scalability-workflows.md)/[quality targets](../non-functional-requirements/quality-targets.md); Xxx refers to SCL-Xxx in [catalog](experiment-catalog.md).

## Static and implementation review

Validate local links/anchors, closed JSON schema/examples, original prior-contract digests, exact quota/pool/refresh/relay arithmetic and traceability. For later implementation inspect actual DDL/grants/query plans/handler/client defaults and run existing applicable build/static checks; none alone passes runtime gates.

No new automated test framework, files, fixtures or mocks are authorized. Existing relevant tests may be preserved/run during later implementation; authored tests require the user's explicit request.

## Evidence per ID

Record Passed/Failed/Not run/Analytical, concrete branch/input, plan/proposal/release/schema/data/resource/policy fingerprint, operator/reviewer/time, observed protected owner proof, complete timings/counts/limits and cleanup/reopen.

Optional mechanism scenarios remain Not run until their approved prototype exists; a reasoned Rejected proposal still gets an evidence decision and does not pretend the prototype ran. Unreached healthy tiers are capacity gaps, not silently passed at a different workload.

SCL-V40 reviews quota/refresh/capacity mathematics and current SLI denominator implementation. Actual hosted 30-day availability evidence remains Not run until such a window exists. No short private sandbox experiment establishes an SLA.

## Learning exit

Explain the actual bottleneck, rejected alternatives, primary-authority boundaries, each chosen cost, hot-row/queue behavior and why supported capacity stops where it does. Show original stock/money/receipt/decision timelines before and after a scaling fault. Explain why caching, physical replication and table partitioning solve different problems and cannot collectively promise unlimited scale.
