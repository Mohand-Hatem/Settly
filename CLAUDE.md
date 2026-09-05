# Settly — Instructions for AI Coding Agents

Settly is an AI-powered real estate intelligence platform for the Egyptian market (EGP).
Buyers discover properties through structured, geographic and semantic search, request
viewings, negotiate offers, and pay a reservation deposit. Agents manage listings and
their pipeline. Admins moderate. Mid-scale modular monolith, TypeScript throughout.

**Status: ARCHITECTURE CLOSED at Decision #42. Tier-B documentation set complete (docs/product,
docs/architecture, docs/process, docs/design constraints, docs/generated contracts). No
application code exists yet. Do not write application code unless explicitly asked.**

For the detailed AI working protocol, see `docs/AI_AGENT_RULES.md`.

---

## Source of truth

`docs/` is the source of truth for every locked product, architectural, business and API
decision. Read the relevant documents before changing anything.

**Start at `docs/README.md`** — it holds the documentation map and a task → documents
routing table.

Two exceptions where **code leads and documentation is generated from it**:

- API reference — generated from the OpenAPI spec (itself generated from backend Zod schemas)
- ERD — generated from the Prisma schema

Never hand-edit anything under `docs/generated/`.

---

## Decision status — these are three different things

| Status | Meaning | What you may do |
|---|---|---|
| **LOCKED** | Approved and settled | Implement it. Do not deviate |
| **PROVISIONAL** | Approved in principle, details may change | Implement, but flag assumptions |
| **PENDING VERIFICATION** | Depends on an external fact not yet checked | **Do not implement as if final.** Verify first, then update the decision |

`docs/DECISIONS.md` holds the active pending-verification checklist.

---

## Rules

1. **Read the relevant docs before implementing.** Use the routing table in `docs/README.md`.
2. **Never silently override a locked decision.** Not to save time, not because another
   approach seems better.
3. **If implementation reveals a documented decision is wrong or impractical: STOP and
   propose a decision change.** Do not implement a different approach and document it
   afterwards. This is the rule most likely to be broken and matters most.
4. **Never introduce a rejected technology or pattern.** Each topic document lists what was
   rejected and why. The rejections are as load-bearing as the selections.
5. **Never change a locked business rule or state machine** without explicit approval.
   Business rules live in `docs/product/BUSINESS_RULES.md`.
6. **Use the existing domain services and policy functions.** Do not bypass them, and do not
   invent a parallel pattern when an approved one exists.
7. **Update the documentation when approved behaviour changes** — the topic doc, then
   `DECISIONS.md`, then the code.
8. **An undocumented behaviour is not approved** merely because it is convenient to implement.
9. **When requirements are ambiguous or missing, ask.** Do not fill the gap with an assumption
   and proceed.

---

## Architecture boundaries you must not cross

- **PostgreSQL is the source of truth** for all business-critical relational data.
- **Prisma is imported only in `repository/`.** Services speak in domain types.
- **Raw SQL lives only in `sql/`** — PostGIS, pgvector and hybrid-ranking queries, each a
  named, tested function.
- **Modules talk to each other only through exported service interfaces.** Never another
  module's repository or Prisma models.
- **Authorization lives in the service layer**, not HTTP middleware. AI tools and the agent
  call the same services and inherit the same policy checks.
- **The frontend is never authoritative for payment success.** Only a verified webhook or
  reconciliation is.
- **Public ISR pages must not read per-user cookies in Server Components.** Personalization
  is client-side, or ISR breaks.
- **The AI agent is read-only.** All state changes are proposals requiring user confirmation.
- **AI data access is exactly the tool allowlist plus the RAG corpus.** Never messages, payments,
  offers, AuditLog or admin data.
- **`AuditLog.metadata` carries ids and enums only, never PII** — the table is immutable, so PII
  written there can never be removed.
- **Business logic is tested at the service layer, not through HTTP.** Concurrency tests run
  serially against real Postgres and are never retried.

---

## Repository shape

    Settly/
    ├── frontend/   Next.js + TypeScript   (independent: own package.json, build, deploy)
    ├── backend/    Node + Express 5 + TS  (independent: own package.json, build, deploy)
    └── docs/       source of truth

No monorepo tooling, no workspaces, no shared-code dependency between the two projects.
The contract between them is OpenAPI, generated from backend Zod schemas, with the spec
snapshot committed into `frontend/`.
