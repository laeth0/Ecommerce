---
description: learned preferences, project conventions, and Do-Not-Repeat rules
budget_tokens: 2000
---
# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-10-02

## User Preferences

- This repository is the backend repository: do not introduce a nested `backend/` directory. Keep `docs/` outside the solution; the user requested removal of its solution entries.

- Use module-owned Clean Architecture projects with vertical slices inside modules. Do not create automated tests unless explicitly requested.

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- If WSL directory rename/removal fails on the Windows mount, verify the destination copies and use native Windows filesystem operations. Update the solution before final cleanup: design-time builds may recreate old `obj` paths.

- **Project:** ecommerce
- This repository is already the backend; source lives in root `src`; the solution, Dockerfile, Compose file, and domain documentation stay at the repository root. The API is the only executable project.
- The initial backend had no business code or persistence to migrate. Module folders are scaffolding, not completed implementation of the documented phases.
- Presentation controller assemblies are explicitly registered through module-owned `Add<Module>Presentation` extensions.
- WSL uses Windows `dotnet.exe`, `docker.exe`, and `node.exe`; OpenWolf CLI entry point is `C:\Users\laeth\AppData\Roaming\npm\node_modules\openwolf\dist\bin\openwolf.js`.

## Do-Not-Repeat

- [2026-10-02] Do not add a redundant `backend/` wrapper around the source; the user confirmed that the repository itself is the backend.

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

- [2026-10-02] Seven modules match the overview ownership table. Each has Domain, Application, Infrastructure, Presentation, and Contracts projects to establish inward dependencies and an explicit collaboration boundary. Do not add a shared business layer, mediator dependency, or unused registration abstraction.
- [2026-10-02] Preserve existing authentication, package versions, launch profiles, and Compose behavior during restructuring. JWT identity and database semantics belong to subsequent explicitly requested feature work.

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
