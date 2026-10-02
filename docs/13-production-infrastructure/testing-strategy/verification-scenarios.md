# Infrastructure Verification Scenarios

**Status:** all runtime checks are Not run in this documentation task. No tests, fixtures, workflow, manifests, provider probes or infrastructure execution are supplied.

| ID | Required assertion | Functional / quality mapping | Experiment |
| --- | --- | --- | --- |
| INF-V01 | Approved source/toolchain/image digest, provenance/SBOM and same build promotion | FR01;NFR16 | X01 |
| INF-V02 | Secret-free build/context/layers/artifact/log and unprivileged fork input | FR01/04;NFR16/18/25 | X01/X04 |
| INF-V03 | Untrusted trigger cannot publish/deploy/read runtime/local kubeconfig | FR01/05;NFR18 | X01 |
| INF-V04 | Actual branch/environment/reviewer/bypass/entitlement and no paid fallback | FR05;NFR18/32 | X01 |
| INF-V05 | Supported kind/platform matrix, measured host/VM/new-overhead/profile admission | FR02;NFR09/10 | X02 |
| INF-V06 | Actual CNI default-deny/allowlist, namespace/API/private separation | FR02/04;NFR11/12 | X02/X04 |
| INF-V07 | PV retained host mapping survives declared Pod/node/cluster transitions; no HA assumption | FR02/11;NFR27/29 | X02/X11 |
| INF-V08 | No simultaneous Compose/kind Payments executor or unbudgeted application | FR02/07;NFR04/08 | X02/X07 |
| INF-V09 | Exact owner retail/callback/unknown/method/private route and no public management | FR03;NFR02/11 | X03 |
| INF-V10 | Original raw callback bytes/signature/body/media/header/duplicate durable acknowledgement | FR03;NFR13 | X03 |
| INF-V11 | Backend/private CA/SAN/EKU/role/epoch, wrong/expired/revoked peers and direct private transport | FR03/04;NFR12/26 | X03/X04 |
| INF-V12 | Edge-local UUID Problem/no-store/template/headers and preserved application errors | FR03;NFR02/14 | X03 |
| INF-V13 | Trusted-hop/source normalization, NAT collapse and Admin-source denial | FR03;NFR15 | X03 |
| INF-V14 | Edge/private total time, actual retries0/hedging0/mirroring0 and Unknown owner result | FR03;NFR13/14 | X03 |
| INF-V15 | Runtime API/secret/workload/exec/RoleBinding and cross-owner CONNECT denial | FR04;NFR25 | X04 |
| INF-V16 | Original key/CA overlap and reused-connection revocation/expiry behavior | FR04;NFR12/26 | X04 |
| INF-V17 | Named Options/frozen epoch fail closed; trusted startup/readiness/liveness profile and primary bound | FR04/10;NFR03/20/21/25 | X04/X05 |
| INF-V18 | Closed plan/exact approval/current cluster identity, duplicate/unknown apply and serialized release | FR05;NFR18/19 | X06 |
| INF-V19 | Recreate quiescence, actual old pools/processes, readiness/drain/grace and maintenance | FR06/07;NFR01/08/20/21/22 | X05/X06 |
| INF-V20 | Compatible rollback after accepted writes retains current original store/identities | FR06/08;NFR01–03 | X06/X08 |
| INF-V21 | Gated serialized Commerce overlap includes terminating/resource/pool/mixed-reader proof | FR06;NFR08/23 | X06 |
| INF-V22 | Original worker/claim/due/receipt/event recovery and remote outage capabilities unchanged | FR06/07/10;NFR03/07 | X05/X06/X07 |
| INF-V23 | One owner migration job/connection and duplicate/ambiguous DDL inspection | FR08;NFR19 | X08 |
| INF-V24 | Expand/readers/legacy retry metadata/closed v1 byte compatibility | FR08;NFR02/03 | X08 |
| INF-V25 | Incompatible schema/reader/grant keeps affected writer/readiness closed | FR08;NFR02/19 | X08 |
| INF-V26 | Empty/wrong data root and incompatible PGDATA/ownership cannot initialize accepted history | FR02/08;NFR27 | X02/X08 |
| INF-V27 | Original PK/FK/check/grants/count/digest/transaction/audit/outbox and retained storage gates | FR08;NFR01/02/27 | X08 |
| INF-V28 | DDL/backup/epoch conflict and original four-connection/snapshot safety | FR08/11;NFR19/28 | X08/X11 |
| INF-V29 | Provider timeout during termination retains original key/earliest-send/window/R/hold | FR07;NFR03/04 | X07 |
| INF-V30 | Deleted/partitioned node/lease expiry cannot enable successor without actual old-egress fence | FR07;NFR04/08/20 | X07 |
| INF-V31 | Frozen startup epoch and rotated trust prevent stale process/connection authority | FR04/07;NFR03/04/26 | X04/X07 |
| INF-V32 | Original confirmation/refund/stock/decision/release guards survive executor handoff | FR07;NFR01/03/04 | X07 |
| INF-V33 | Manual one/two comparison complete useful/latency/debt plus48/79/actual resource cost | FR09;NFR05–09 | X09 |
| INF-V34 | HPA approved fixed per-Pod profile,min1/max2, no Payments scale and actual-process interlock | FR09;NFR08/09/24 | X09 |
| INF-V35 | Missing metric, Pending/image/slow start/churn and host pressure remain bounded | FR09;NFR10/24 | X09 |
| INF-V36 | No concurrent HPA/release replica ownership or terminating third process | FR06/09;NFR08/23/24 | X06/X09 |
| INF-V37 | Bounded privacy/cardinality/export and diagnostics gaps/alerts/SLI origin handling | FR10;NFR30/31 | X10 |
| INF-V38 | Actual paired-v3 two-snapshot/four-connection/off-host/digest/authentication/schedule | FR11;NFR28 | X11 |
| INF-V39 | Both snapshot asymmetries and missing original authority/Consume block false safe restore | FR11;NFR01/03/29 | X11 |
| INF-V40 | Provider full lost gap incl old objects/reversals and original window/account discovery | FR11;NFR03/04/29 | X11 |
| INF-V41 | Broker ahead/missing canonical source cannot create money/Order/sink proof | FR11;NFR01/02/27/29 | X11 |
| INF-V42 | Host-only archive, incomplete pair/key or unsupported data volume never satisfies off-host RPO/RTO | FR11;NFR27–29 | X02/X11 |
| INF-V43 | Current secret/grant recovery, restored session revocation/clock/epoch and negative authority | FR04/11;NFR12/25/26 | X04/X11 |
| INF-V44 | STRIDE/RBAC/host/route/source/data/diagnostic negative access and audit | FR04/10;NFR11/25/30 | X04/X10 |
| INF-V45 | Actual scan/exposure/high-critical mitigation/provenance and approval blocks | FR01/05;NFR17/18 | X01 |
| INF-V46 | Complete release maintenance/valid failure ledger, honest hosted30d/HA/paid scope limits | FR12;NFR22/31/32 | X10/X12 |
| INF-V47 | Original Reference100/advanced source/auth/quota/scan/work/resource targets and analytical limits | FR09/12;NFR05–07/32 | X09/X12 |
| INF-V48 | Timed integrated safe restore/reopen and complete earlier-phase evidence, no passed missing blocker | FR11/12;NFR01/04/29/32 | X11/X12 |

FRxx/NFRxx abbreviate INF-FR-xx/INF-NFR-xx in [workflows](../functional-requirements/infrastructure-workflows.md)/[quality targets](../non-functional-requirements/quality-targets.md); Xxx refers to INF-Xxx in [experiments](experiment-catalog.md).

## Static specification review

Validate links/anchors, closed schema/examples, exact process/pool/time/quota arithmetic, requirement mapping, prior file digests and scope. Inspect actual supported CRDs/client/controller/image defaults before implementing; documentation cannot certify those facilities.

## Evidence per branch

Record Passed/Failed/Not run/Analytical, exact operator/time/plan/target/release/artifact/schema/data/config/resource/source fingerprint, branch/input, actual owner/process/network proof, measurements, stop/reversal and safe reopen.

Runtime evidence must distinguish simulator, isolated transport and genuine provider. Insufficient observations remain descriptive. Existing relevant tests may be run during implementation; authoring new automated tests/projects/frameworks/fixtures requires explicit user authorization.

## Completion boundary

Optional HPA/rolling/derived-data scenarios remain Not run without an admitted actual prototype. A rejected proposal is a documented decision, not an executed experiment. Hosted30-day availability remains Not run until the observation exists. The [project exit](../project-completion-and-release-readiness.md) preserves these limits.
