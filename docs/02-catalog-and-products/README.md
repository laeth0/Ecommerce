# Phase 02 — Catalog and Products

| Field | Value |
| --- | --- |
| Document | CAT-00 |
| Status | Draft specification for review; no application code is included |
| Architecture | Catalog module in the modular monolith |
| Depends on | [Project overview](../00-project-overview/overview-and-learning-objectives.md) and [Phase 01 identity](../01-identity-and-auth/README.md) |
| Next phase | Inventory and stock |

## Goal

An administrator can maintain a small catalog of categories and simple products. Anyone can browse or search only products that are currently published in active categories. The catalog owns current descriptions and prices; it does not claim stock availability or preserve historical order prices.

The project owner confirmed one merchant and **USD with two decimal places** for all project prices, totals, payments, refunds, and calculations. Prices use integer cents in API and database contracts; no decimal input is rounded. Currency is carried explicitly as `USD` so a later multi-currency design can extend the contract without changing the meaning of existing amounts. Multi-currency behavior is outside this phase.

## Contents

| Read | Purpose |
| --- | --- |
| [System design prerequisites](system-design-prerequisites.md) | Concepts to study and experiments to run before building |
| [Architecture decisions](architecture-decisions.md) | Module boundaries, ADRs, alternatives, failure costs |
| [Business workflows](functional-requirements/catalog-workflows.md) | Actors, product/category lifecycle, stories, acceptance criteria |
| [API contracts](functional-requirements/api-contracts.md) | Endpoints, exact payloads, validation, pagination, error mapping |
| [Quality targets](non-functional-requirements/quality-targets.md) | Measurable latency, throughput, correctness, and availability goals |
| [Search and capacity](performance-and-scalability/search-and-capacity.md) | PostgreSQL search, indexing, plans, bounded work |
| [Schema and transactions](database/schema-and-transactions.md) | Tables, constraints, locks, audit, migrations |
| [Security](security/threat-model-and-controls.md) | Public/admin boundary, publication leaks, data handling |
| [Failure behavior](reliability-and-failure-scenarios/failure-behavior.md) | Concurrent edits, database outages, retry and recovery rules |
| [Verification](testing-strategy/verification-scenarios.md) | Required future checks and evidence |
| [Operations](deployment-and-devops/configuration-and-operations.md) | Settings, migration, observability and deployment |

## Scope and dependencies

| Included now | Deferred or excluded |
| --- | --- |
| Flat categories with active/inactive status | Category hierarchy and tree queries |
| One SKU and one category per simple product | Variants, attributes, bundles, seller records |
| Current name, description, price, publication status | Coupons, promotions, reviews, ratings, recommendations |
| Public category listing, product detail/list and basic English-language search | Dedicated search engine and relevance ranking |
| Admin create/edit/publish/hide/archive with optimistic version checks | Media upload, bulk import, bulk mutation and public admin UI |
| Catalog audit and database query evidence | Inventory balances, reservations and order snapshots |

Phase 01 provides Admin authentication, the source-network restriction, and the security-sensitive mutation lock protocol. Product updates must use that protocol when the operation must order against Admin logout or revocation. Phase 03 owns inventory for the product ID. Phases 04 and 06 must re-read catalog truth rather than treating a displayed price or publication state as a purchase commitment.

## Scrum work package

| Epic | Outcome | Review evidence |
| --- | --- | --- |
| CAT-E1 Category maintenance | Active categories can be created, renamed, hidden, and restored | Versioned mutations and public filtering behave under concurrent edits |
| CAT-E2 Product lifecycle | Draft products can be published, hidden, republished, and archived | Forbidden transitions and validation leave state unchanged |
| CAT-E3 Discovery | Public browsing and basic search are bounded and deterministic | Draft/hidden/archived products never appear; cursors and search limits hold |
| CAT-E4 Operating quality | Query plans, audit, configuration and failure paths are reviewable | Measured dataset results and database outage behavior are recorded |

These are logical work packages, not Sprint Backlog tasks. Acceptance of this document does not establish that the software, data, or benchmark exists. The [global Definition of Done](../00-project-overview/global-definition-of-done.md) applies to later implementation evidence.

## Phase exit

The specification is ready for implementation review when all contracts and transitions agree, links/schema/SQL are checked, and no price, category, or authorization behavior is left to an implementer's guess. Software completion later requires real PostgreSQL behavior, multi-replica Admin checks, query plans, and the [verification scenarios](testing-strategy/verification-scenarios.md). No new automated tests are requested by this documentation phase.
