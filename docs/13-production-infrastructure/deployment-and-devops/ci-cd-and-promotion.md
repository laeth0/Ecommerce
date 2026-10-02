# GitHub Actions, Approval and Local Promotion

## Trust and scope

GitHub Actions is the chosen build/verification platform. Local kind release remains a scoped protected operator action using an approved immutable bundle; hosted runners do not receive local kubeconfig or a network path to the personal cluster.

No workflow, repository protection, runner, credential or artifact publication is configured in this task.

## Pipeline stages

| Stage | Input / action | Authority / output |
| --- | --- | --- |
| Untrusted PR verification | Approved read-only checkout and established build/static/schema checks; existing relevant tests if present | Read-only job token; no runtime/release/publish secrets |
| Trusted source build | Protected approved commit; locked/pinned owner builds and scans | Separate narrow artifact publication capability only if authorized |
| Artifact evidence | Image/SBOM/provenance/check/config/schema compatibility locators | Exact digest bundle and failed/unrun evidence |
| Release proposal | Exact source/digests/target/profile/backup/strategy | Closed ReleasePlan; no mutation |
| Protected manual review | Verify plan/evidence/current authority/target | Authenticated approval bound to exact plan digest |
| Local apply | Retrieve/verify same artifact; validate cluster identity; one release lock; execute controlled owner procedure | Scoped local release credentials, never inherited from build |
| Postrelease evidence | Probes/contracts/process/grants/receipts/work/latency and rollback/reopen checks | ReleaseOutcome and actual active/contained state |

Automatic build is distinct from automatic deployment. A workflow_dispatch button or green check does not establish permission to execute a changed plan.

## GitHub protection requirements

Pin third-party actions to reviewed full commit SHAs and explicitly set minimum token permissions. No untrusted script interpolation into shell, unsafe pull_request_target execution of attacker code or privileged fork artifacts. Validate all source/artifact inputs against exact approved commit/digest.

Use protected branches and a protected deployment environment/manual approval for the trusted release-proposal path. Restrict permitted branches/actors; separate approval from untrusted build. Prevent self-review/bypass where the repository plan supports it. Document actual entitlements and bypass actors before claiming enforcement.

If the chosen private repository's plan lacks required review protection, stop automatic promotion. Retain an equivalent attributed local review barrier and mark the unavailable GitHub enforcement Not run; do not describe an unprotected button as a protected environment.

GitHub's [security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) explains token/action/untrusted-code controls. Verify supported [environment protection](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) against the actual repository/plan before implementation.

## Resource and concurrency

The no-cloud-spend decision does not imply unlimited free hosted CI/private artifact storage. Confirm existing account entitlements, spending limits and retained artifact needs. Exhausted CI/storage budget is an explicit blocked/unrun gate; no paid resource is enabled automatically.

Do not install an always-on privileged self-hosted runner on the personal deployment machine for untrusted PR jobs. A later local runner proposal requires a separate isolated runner identity, allowlisted trusted jobs, ephemeral cleanup and no path for untrusted code to cluster/runtime secrets.

Workflow concurrency reduces overlapping job intent; it does not serialize database migrations or fence an orphan provider process. The local operating lock and database migration guard are authoritative for their own actions.

Do not cancel an in-progress financial release/restore and assume it was undone. Inspect actual original release/owner state and keep containment until resolved. Duplicate triggering cannot produce duplicate owner migrations or financial commands.

## Verification gates

Run established format/build/type/static/schema and existing applicable tests during implementation. New test projects/frameworks/fixtures/mocks require the user's explicit request. Missing tests stay an evidence gap; no dummy passing job replaces them.

Require secret/dependency/image/advisory/provenance review, exact public/private/event compatibility and reviewed migration/rollback/restore evidence. A successful container build does not establish database concurrency, network enforcement, financial recovery or hosted uptime.

## Local handoff

The local operator verifies bundle integrity and actual cluster/API fingerprint before applying the exact approved digest. Personal kubeconfig, provider/JWT/archive keys and database credentials remain in protected local runtime/security facilities.

Protected plan/approval/outcome records survive short CI-log retention. Reapplication of an original plan inspects actual generation/state; changed artifacts/config/target need new approval. Rollback references a verified compatible prior digest and the current owner store.
