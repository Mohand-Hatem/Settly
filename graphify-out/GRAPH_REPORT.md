# Graph Report - Settly  (2026-09-09)

## Corpus Check
- Large corpus: 77 files · ~2,561,143 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 670 nodes · 630 edges · 43 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Architecture Decisions & Ordering
- Visual Identity & Cobalt Ledger
- API Contract Specifications & OpenAPI
- Business Rules & State Machines
- Landing Page & Brand Design
- API Protocols & Idempotency
- Security, Retention & Privacy
- Hybrid Search & Retrieval Eval
- Authentication & Better Auth
- Shortlist AI Agent
- Backend Runtime & Error Handling
- Database Schema & Postgres/PostGIS
- Domain Model & 39 Tables
- Frontend Architecture & Next.js
- Payments & Paymob Workflows
- Implementation Phases & Delivery
- AI Layer & LLM Integration
- Realtime SSE & Communications
- Domain Glossary & Egypt Terminology
- Engineering Standards & Conventions
- Concurrency & Distributed Locking
- Infrastructure & Docker Deployment
- Observability & Tracing
- UX Patterns & Design Constraints
- Environment & Secrets Configuration
- Automated Testing & Concurrency Suites
- System Topology & Architecture Boundaries
- RAG Pipeline & Vector Indexing
- Object Storage & Asset Security
- UI Component Recipes & Token Specs
- Design System Constraints
- Seed Data & Evaluation Datasets
- Product Vision & Core Journeys
- Failure Modes & Degradation Matrix
- Data Lifecycle & Deletion Mechanisms
- Product Analytics & Metrics
- OpenAPI Generated Reference
- Roadmap Sequencing & Dependency Plan
- AI Coding Protocol & Boundaries
- Database ERD Generated Contract
- Product Requirements & Journey Specs
- Documentation Index & Task Routing
- Design Landing Candidates

## God Nodes (most connected - your core abstractions)
1. `4. Detailed entries` - 39 edges
2. `API Contract` - 21 edges
3. `Security & Privacy` - 21 edges
4. `Search Architecture` - 17 edges
5. `Property Shortlist Agent` - 15 edges
6. `Authentication & Authorization` - 15 edges
7. `Backend Architecture` - 15 edges
8. `Database Architecture` - 15 edges
9. `Domain Model — 39 Tables` - 15 edges
10. `Frontend Architecture` - 15 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (43 total, 0 thin omitted)

### Community 0 - "Architecture Decisions & Ordering"
Cohesion: 0.04
Nodes (44): #0 — Decision ordering, #10 — Reliability (high impact), #11 — Deposit race: the checkout hold, #12 — Rate-limit degradation, #13 — Payments: Paymob (high impact), #14 — Search architecture (high impact), #15 — Canonical English description, #16 — `SearchEvent` as model #37 (+36 more)

### Community 1 - "Visual Identity & Cobalt Ledger"
Cohesion: 0.06
Nodes (34): 1. Atmosphere, 2. Palette, 3. Typography, 4. Buttons, 5. Cards, 6. Charts, 7. Tabs, 8. Spacing (+26 more)

### Community 2 - "API Contract Specifications & OpenAPI"
Cohesion: 0.06
Nodes (34): 10. OpenAPI workflow, 10. Why this is still minimum sufficient, 11. SSE, uploads, observability, bulk, 12. Why this is the minimum sufficient contract, 1. Better Auth identity reconciliation, 1. Response envelope — bare resources, wrapped collections, 2. Document visibility, 2. ⭐ State transitions are action endpoints, not `PATCH status` (+26 more)

### Community 3 - "Business Rules & State Machines"
Cohesion: 0.07
Nodes (27): 10. Notification and expiry behaviour, 11.1 Three tiers of agent removal, 11. Account lifecycle and deletion (Decision #42), 12. Rejected / Do Not Add, 1. Business constants, 2.1 Two-tier edit moderation, 2.2 Deletion (Decision #42), 2. Property lifecycle (+19 more)

### Community 4 - "Landing Page & Brand Design"
Cohesion: 0.09
Nodes (22): Anti-patterns — do not produce, Brand, Browser surfaces, Buttons, Claims discipline, Colour roles, Components, Data visualisation (+14 more)

### Community 5 - "API Protocols & Idempotency"
Cohesion: 0.09
Nodes (21): 10. Idempotency, 11. Query conventions, 12. Uploads, 13. SSE and AI streaming, 14. Versioning, 15. OpenAPI workflow, 16. Observability headers, 17. Bulk operations (+13 more)

### Community 6 - "Security, Retention & Privacy"
Cohesion: 0.09
Nodes (21): 10. Data classification (condensed), 11. Deletion model — no global soft-delete, 12. Retention schedule, 13. User and agent deletion, 14. Property deletion, 15. Backups, 16. Ten testable privacy invariants, 17. Security headers (CSP detail) (+13 more)

### Community 7 - "Hybrid Search & Retrieval Eval"
Cohesion: 0.11
Nodes (17): 10. Retrieval evaluation gate (Decision #27, thresholds locked in #32), 11. Degradation, 12. SEO vs. interactive search — a deliberate separation, 13. Never exposed through the public contract, 14. Pending verification, 15. Rejected / do not add, 16. Related documents, 1. Purpose (+9 more)

### Community 8 - "Authentication & Better Auth"
Cohesion: 0.12
Nodes (16): 10. `/api/auth/*` separation, 11. Security invariants (testable — see process/TESTING.md), 12. Pending verification, 13. Rejected / do not add, 14. Related documents, 1. Purpose, 2. The boundary, 3. Session model (+8 more)

### Community 9 - "Shortlist AI Agent"
Cohesion: 0.12
Nodes (15): 10. Failure behaviour, 11. Testing (Decision #41), 12. Pending verification, 13. Rejected / do not add, 14. Related documents, 1. Purpose, 2. Why exactly one agent, and why this one, 3. Architecture (+7 more)

### Community 10 - "Backend Runtime & Error Handling"
Cohesion: 0.12
Nodes (15): 10. Config, 11. Failure philosophy, 12. Pending verification, 13. Rejected / do not add, 14. Related documents, 1. Purpose, 2. Runtime, 3. Two processes, one codebase (+7 more)

### Community 11 - "Database Schema & Postgres/PostGIS"
Cohesion: 0.12
Nodes (15): 10. Local vs. production, 11. Least-privilege role — optional, 12. Pending verification, 13. Rejected / do not add, 14. Related documents, 1. Purpose, 2. Engine and extensions, 3. Prisma / raw SQL boundary (+7 more)

### Community 12 - "Domain Model & 39 Tables"
Cohesion: 0.12
Nodes (15): 10. Analytics & governance (4), 11. Consequences of Decision #42 (privacy/retention), 12. Rejected / do not add, 13. Pending verification affecting this document, 14. Related documents, 1. Purpose, 2. Better Auth-managed (4) — not Settly's schema to design freely, 3. Settly identity (2) (+7 more)

### Community 13 - "Frontend Architecture & Next.js"
Cohesion: 0.12
Nodes (15): 10. Auth UX boundary, 11. Maps and libraries, 12. Pending verification, 13. Rejected / do not add, 14. Related documents, 1. Purpose, 2. Five rendering modes — never collapsed into fewer, 3. State ownership (+7 more)

### Community 14 - "Payments & Paymob Workflows"
Cohesion: 0.12
Nodes (15): 10. Failure matrix, 11. Five invariants, 12. Pending verification, 13. Rejected / do not add, 14. Related documents, 1. Purpose, 2. Provider and checkout model, 3. Models (+7 more)

### Community 15 - "Implementation Phases & Delivery"
Cohesion: 0.12
Nodes (15): 10. Phase 4 — Operations, 11. Deployment phase, 12. The parallel design track (Section 13 of this response covers this in detail), 13. What this document does not do, 14. Related documents, 1. Purpose, 2. Step 0 — Verification spikes (before any code), 3. Step 1 — Repository scaffolding (+7 more)

### Community 16 - "AI Layer & LLM Integration"
Cohesion: 0.13
Nodes (14): 10. Relationship to the Agent, 11. Pending verification, 12. Rejected / do not add, 13. Related documents, 1. Purpose, 2. Provider, 3. Orchestration — Vercel AI SDK as the port, nothing more, 4. Model boundary — the LLM never touches the database (+6 more)

### Community 17 - "Realtime SSE & Communications"
Cohesion: 0.13
Nodes (14): 10. Failure behaviour, 11. Pending verification, 12. Rejected / do not add, 13. Related documents, 1. Purpose, 2. The authority rule, 3. SSE contract, 4. Notification model (+6 more)

### Community 18 - "Domain Glossary & Egypt Terminology"
Cohesion: 0.13
Nodes (14): 10. Security and operations, 11. Multilingual architecture, 12. API contract, 13. Testing, privacy and retention, 1. The nine distinctions that matter most, 2. Actors and identity, 3. Catalog, 4. Engagement (+6 more)

### Community 19 - "Engineering Standards & Conventions"
Cohesion: 0.13
Nodes (14): 10. Security-sensitive coding conventions, 11. Pending verification, 12. Rejected / do not add, 13. Related documents, 1. Purpose, 2. Module layering (mechanically enforced), 3. Naming, 4. Error conventions (+6 more)

### Community 20 - "Concurrency & Distributed Locking"
Cohesion: 0.14
Nodes (13): 10. Pending verification, 11. Rejected / do not add, 12. Related documents, 1. Purpose, 2. Governing principle, 3. Race inventory, 4. The advisory-lock invariants (I9, I11, I12), 5. The deposit race and the checkout hold (Decision #11) (+5 more)

### Community 21 - "Infrastructure & Docker Deployment"
Cohesion: 0.14
Nodes (13): 10. Pending verification, 11. Rejected / do not add, 12. Related documents, 1. Purpose, 2. Local topology (current — this is what exists today), 3. Future production topology (not yet deployed), 4. Hard constraint, 5. Two Railway services — not one (+5 more)

### Community 22 - "Observability & Tracing"
Cohesion: 0.14
Nodes (13): 10. Pending verification, 11. Rejected / do not add, 12. Related documents, 1. Purpose, 2. Logging — Pino, Morgan and Winston both removed (Decision #34), 3. Errors — Sentry, 4. Scheduled-job monitoring, 5. Health / readiness / degraded — three distinct endpoints (+5 more)

### Community 23 - "UX Patterns & Design Constraints"
Cohesion: 0.14
Nodes (13): 10. Pending verification, 11. Rejected / do not add, 12. Related documents, 1. Purpose, 2. Loading, empty, error states, 3. Verification gate UX (Decision #38), 4. Payment state UX, 5. Offer/viewing state UX (+5 more)

### Community 24 - "Environment & Secrets Configuration"
Cohesion: 0.14
Nodes (13): 10. Pending verification, 11. Rejected / do not add, 12. Related documents, 1. Purpose, 2. Ports and services (local), 3. `.env` strategy, 4. Public vs. server variables, 5. Secret rotation (+5 more)

### Community 25 - "Automated Testing & Concurrency Suites"
Cohesion: 0.14
Nodes (13): 10. Pending verification, 11. Rejected / do not add, 12. Related documents, 1. Purpose, 2. Six layers, 3. Real Postgres, never a substitute, 4. Proving the concurrency invariants (layer 4), 5. Gate vs. report (generalised from Decision #19 to ALL AI evaluation) (+5 more)

### Community 26 - "System Topology & Architecture Boundaries"
Cohesion: 0.15
Nodes (12): 10. What Settly explicitly does NOT contain, 11. Related documents, 1. Purpose, 2. Repository and process topology, 3. Modular monolith — 11 backend modules, 4. Request flow (synchronous), 5. Async flow, 6. Data ownership — source of truth per concern (+4 more)

### Community 27 - "RAG Pipeline & Vector Indexing"
Cohesion: 0.15
Nodes (12): 10. Rejected / do not add, 11. Related documents, 1. Purpose, 2. Corpus scope — the decision that prevents the most common RAG mistake, 3. Ingestion pipeline, 4. Retrieval, 5. Visibility scopes (Decision #12/#39), 6. Embedding lifecycle (Decision #42) (+4 more)

### Community 28 - "Object Storage & Asset Security"
Cohesion: 0.15
Nodes (12): 10. Rejected / do not add, 11. Related documents, 1. Purpose, 2. The split, 3. Upload contract, 4. Security controls, 5. Malware scanning — a deliberate, documented v1 limitation, 6. Failure behaviour (+4 more)

### Community 29 - "UI Component Recipes & Token Specs"
Cohesion: 0.18
Nodes (11): 1 · Your role, 2 · Token compliance, 3 · Component recipes, 4 · Hard constraints, 5 · Before you finish — verify, AI Build Instructions, Buttons, Cards (+3 more)

### Community 30 - "Design System Constraints"
Cohesion: 0.18
Nodes (10): 1. Purpose, 2. Technical constraints (locked, not negotiable in Stitch), 3. Design intent (brand direction, to steer Stitch — not a finished system), 4. Density expectations, 5. Localized formatting (constraint, not a value), 6. Relationship to Stitch, 7. Pending verification, 8. Rejected / do not add (+2 more)

### Community 31 - "Seed Data & Evaluation Datasets"
Cohesion: 0.18
Nodes (10): 1. Purpose, 2. Corpus scope, 3. Deliberate hard cases, 4. Retrieval evaluation gate — pre-committed thresholds (Decision #32), 5. Script requirements, 6. Separation from tests, 7. Pending verification, 8. Rejected / do not add (+2 more)

### Community 32 - "Product Vision & Core Journeys"
Cohesion: 0.18
Nodes (10): 1. What Settly is, 2. Scope package — Package B, "Full Buyer Journey", 3. Roles, 4. Core journeys (J1–J8, from Decision #3), 5. Bilingual product (amends the original English-only decision — #39), 6. Explicitly out of scope (v1), 7. Admin scope (Decision #28), 8. Sequencing principle (Decision #29) (+2 more)

### Community 33 - "Failure Modes & Degradation Matrix"
Cohesion: 0.20
Nodes (9): 1. Purpose, 2. Degradation matrix, 3. Two structural properties, 4. Recovery mechanisms referenced here (detail lives in CONCURRENCY_AND_IDEMPOTENCY.md), 5. What must never happen, 6. Pending verification, 7. Rejected / do not add, 8. Related documents (+1 more)

### Community 34 - "Data Lifecycle & Deletion Mechanisms"
Cohesion: 0.20
Nodes (10): #42 — Privacy, Retention & Data Lifecycle (high impact), Backups, Deletion model — five mechanisms, no global soft-delete (#6 preserved), Model impact, Rejected, Retention — configuration with defaults, Ten testable invariants, The AI privacy boundary *(refines #17)* (+2 more)

### Community 35 - "Product Analytics & Metrics"
Cohesion: 0.20
Nodes (9): 1. Purpose, 2. Captured, 3. Explicitly not built in v1, 4. Privacy and retention (Decision #42), 5. Instrumentation principle, 6. Pending verification, 7. Rejected / do not add, 8. Related documents (+1 more)

### Community 36 - "OpenAPI Generated Reference"
Cohesion: 0.22
Nodes (8): 1. This file is never hand-edited, 2. Source of truth chain, 3. Update command / process (to be implemented), 4. Freshness checks (CI gates), 5. Frontend snapshot relationship, 6. Do not fabricate, 7. Related documents, API Reference — Generation Contract

### Community 37 - "Roadmap Sequencing & Dependency Plan"
Cohesion: 0.22
Nodes (8): 1. Purpose, 2. The sequencing principle (Decision #29), 3. Phase order, 4. Explicitly excluded from any phase, 5. Verification items as pre-work, 6. Step-level detail, 7. Related documents, Implementation Roadmap

### Community 38 - "AI Coding Protocol & Boundaries"
Cohesion: 0.25
Nodes (7): 1. Purpose, 2. Architecture status, 3. Rules, 4. Handling ambiguous or missing requirements, 5. Architecture boundaries that must not be crossed, 6. Related documents, AI Agent Working Rules

### Community 39 - "Database ERD Generated Contract"
Cohesion: 0.25
Nodes (7): 1. This file is never hand-edited, 2. Source of truth chain, 3. Update process (to be implemented), 4. Freshness expectation, 5. Do not fabricate, 6. Related documents, Entity-Relationship Diagram — Generation Contract

### Community 40 - "Product Requirements & Journey Specs"
Cohesion: 0.25
Nodes (7): 1. Functional requirements — by journey, 2. Non-functional requirements, 3. Scope boundary, 4. Acceptance orientation, 5. Traceability matrix (condensed), 6. Related documents, Product Requirements

### Community 41 - "Documentation Index & Task Routing"
Cohesion: 0.25
Nodes (7): 1. Source-of-truth rules, 2. Status labels, 3. Documentation map, 4. Task → documents routing table, 5. Conventions, 6. Architecture status, Settly Documentation

### Community 42 - "Design Landing Candidates"
Cohesion: 0.29
Nodes (6): Architecture boundaries you must not cross, Decision status — these are three different things, Repository shape, Rules, Settly — Instructions for AI Coding Agents, Source of truth

## Knowledge Gaps
- **564 isolated node(s):** `Source of truth`, `Decision status — these are three different things`, `Rules`, `Architecture boundaries you must not cross`, `Repository shape` (+559 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `The substitution rule` connect `API Contract Specifications & OpenAPI` to `Architecture Decisions & Ordering`, `Data Lifecycle & Deletion Mechanisms`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Settly Decision Record` connect `Architecture Decisions & Ordering` to `API Contract Specifications & OpenAPI`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `Source of truth`, `Decision status — these are three different things`, `Rules` to the rest of the system?**
  _564 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Architecture Decisions & Ordering` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `Visual Identity & Cobalt Ledger` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `API Contract Specifications & OpenAPI` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `Business Rules & State Machines` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._