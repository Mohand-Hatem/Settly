# Settly Documentation

    Status:       LOCKED (structure and process) · Architecture CLOSED at Decision #42
    Last Updated: 2026-09-05
    Decisions:    #30 (lifecycle), #42 (closure)
    Related:      DECISIONS.md, AI_AGENT_RULES.md, ../CLAUDE.md

Navigation index for Settly's documentation, for humans and AI coding agents alike.

---

## 1. Source-of-truth rules

**Documentation leads on *why* and *what must be true*. Code leads on *what exactly exists*, and
those documents are generated from it.**

| Concern | Source of truth |
|---|---|
| Product scope, business rules, state machines, invariants | **Documentation** |
| Architectural decisions, rationale, rejected alternatives | **Documentation** |
| Exact endpoint signatures | **Code** → `generated/api-reference.md` |
| Exact schema, fields, indexes | **Code** → `generated/erd.md` |
| Numeric business constants | **Code config**, table in `product/BUSINESS_RULES.md` generated from it |

When approved behaviour changes: **topic document → `DECISIONS.md` → code.** Never the reverse.

## 2. Status labels

| Label | Meaning | Agent behaviour |
|---|---|---|
| **LOCKED** | Approved and settled | Implement as written |
| **PROVISIONAL** | Approved in principle; details may change | Implement, flag assumptions |
| **PENDING VERIFICATION** | Depends on an unconfirmed external fact | **Do not implement as final.** Verify first |

A document may be LOCKED overall with individual PROVISIONAL/PENDING sections, stated explicitly.

## 3. Documentation map

```
docs/
├── README.md                   this file
├── AI_AGENT_RULES.md            the AI working protocol
├── GLOSSARY.md                  domain vocabulary
├── DECISIONS.md                 decision history + pending-verification checklist
│
├── discovery/                  existing-system discovery (started 2026-09-17)
│   ├── 01-system-audit.md        what the code actually does today, with evidence
│   ├── 02-gap-analysis.md        implementation vs documented intent; open questions
│   ├── 03-frontend-screen-audit.md  decisions → screens traceability; missing frontend work
│   ├── 04-frontend-design-plan.md   design candidates review; contradictions C-1…C-22
│   ├── 05-final-frontend-screen-inventory.md  final V1 screen inventory; routes; design order
│   └── 06-slice-1-screen-specs.md   specs for the vertical slice (auth, shells, property detail, viewings)
│
├── product/
│   ├── OVERVIEW.md               vision, scope, roles, journeys
│   ├── REQUIREMENTS.md           functional + non-functional requirements, traceability
│   ├── BUSINESS_RULES.md         state machines, invariants, constants
│   ├── ROLES_AND_PERMISSIONS.md  who can do what (discovery, #49–#53)
│   └── ANALYTICS.md              what is captured, why, and what is NOT built
│
├── architecture/
│   ├── OVERVIEW.md               topology, module map, cross-cutting principles
│   ├── DOMAIN_MODEL.md           the 39 tables
│   ├── DATABASE.md               extensions, indexes, constraints, migrations
│   ├── API.md                    contract shape (Decision #40)
│   ├── AUTH.md                   Better Auth boundary, sessions, authorization
│   ├── CONCURRENCY_AND_IDEMPOTENCY.md
│   ├── PAYMENTS.md
│   ├── SEARCH.md
│   ├── AI.md
│   ├── RAG.md
│   ├── AGENT.md
│   ├── COMMUNICATION.md          SSE, notifications, email, FCM
│   ├── STORAGE.md
│   ├── FRONTEND.md
│   ├── BACKEND.md
│   ├── SECURITY.md
│   ├── OBSERVABILITY.md
│   ├── INFRASTRUCTURE.md
│   └── FAILURE_MODES.md
│
├── process/
│   ├── CONVENTIONS.md
│   ├── TESTING.md                Decision #41
│   ├── SEED_DATA.md
│   ├── ENVIRONMENT.md
│   └── ROADMAP.md
│
├── design/                       CONSTRAINTS now; authoritative values after Stitch
│   ├── DESIGN_SYSTEM.md
│   └── UX_PATTERNS.md
│
└── generated/                    NEVER hand-edited
    ├── api-reference.md          from the OpenAPI spec
    └── erd.md                    from the Prisma schema
```

## 4. Task → documents routing table

| Task | Read first |
|---|---|
| Anything, first time | `../CLAUDE.md` → this file → `GLOSSARY.md` |
| Add/change an API endpoint | `architecture/API.md` → `process/CONVENTIONS.md` → the relevant domain doc |
| Payments, refunds, webhooks | `architecture/PAYMENTS.md` → `architecture/CONCURRENCY_AND_IDEMPOTENCY.md` → `product/BUSINESS_RULES.md` |
| **Change a state machine or business rule** | `product/BUSINESS_RULES.md` → `DECISIONS.md` → **explicit approval required** |
| Add a model, field or index | `architecture/DOMAIN_MODEL.md` → `architecture/DATABASE.md` |
| Search, ranking, filters | `architecture/SEARCH.md` → `architecture/DATABASE.md` → `architecture/AI.md` |
| AI assistant, RAG, embeddings | `architecture/AI.md` → `architecture/RAG.md` |
| The Property Shortlist Agent | `architecture/AGENT.md` → `architecture/AI.md` |
| Authentication or sessions | `architecture/AUTH.md` → `architecture/SECURITY.md` |
| Authorization / permissions | `product/ROLES_AND_PERMISSIONS.md` → `architecture/AUTH.md` → `architecture/BACKEND.md` |
| Frontend routes, rendering, caching, i18n | `architecture/FRONTEND.md` → `design/` |
| Realtime, notifications, email, push | `architecture/COMMUNICATION.md` |
| File and document uploads | `architecture/STORAGE.md` → `architecture/SECURITY.md` |
| Background jobs, queues, workers | `architecture/BACKEND.md` → `architecture/FAILURE_MODES.md` |
| Deployment, CI, environments | `architecture/INFRASTRUCTURE.md` → `process/ENVIRONMENT.md` |
| Writing or running tests | `process/TESTING.md` |
| Seed data or retrieval evaluation | `process/SEED_DATA.md` |
| Privacy, retention, deletion | `architecture/SECURITY.md` → `product/BUSINESS_RULES.md` §11-12 |
| Understanding a term | `GLOSSARY.md` |
| Understanding why something was chosen | `DECISIONS.md` |

## 5. Conventions

One responsibility per document, ~200–500 lines (`DECISIONS.md` is the sanctioned exception).
Current state only in topic documents — historical alternatives live in `DECISIONS.md`. Every
topic document carries a "Rejected / Do Not Add" section. Bidirectional links between decisions
and the documents they affect. **Anything mechanically enforceable is a lint rule or CI gate, not
prose** — module boundaries, type strictness, OpenAPI drift, migration validity.

## 6. Architecture status

**CLOSED at Decision #42.** 42 decisions locked, 1 provisional (#36 Resend), 39 tables, 33 pending
verifications (V1–V33, none verified). Zero application code. This Tier-B documentation set
describes the current implementation-ready state derived from that closed architecture — it is not
itself a new decision surface.
