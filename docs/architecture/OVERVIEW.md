# Architecture Overview

    Status:           LOCKED
    Last Updated:     2026-09-05
    Derived From:     Decisions #1, #6, #8, #9, #10, #17, #18, #22, #33, #37, #39
    Related Documents: ../DECISIONS.md, ../GLOSSARY.md, DOMAIN_MODEL.md, INFRASTRUCTURE.md, FAILURE_MODES.md

## 1. Purpose

Map of the whole system: how the pieces fit, who owns what data, and the principles that hold
across every subsystem. Read this before any other architecture document.

## 2. Repository and process topology

```
  Settly/                              ONE git repo, TWO independent applications (#18)
  ├── frontend/   Next.js + TS         own package.json, build, deploy
  ├── backend/    Express 5 + TS       own package.json, build, deploy
  │     ├── api process                Express, SSE, always-on (#22)
  │     └── worker process             BullMQ consumers + 9 schedulers (#22)
  └── docs/       source of truth
```

No monorepo tooling, no shared-code dependency. The contract between `frontend/` and `backend/` is
OpenAPI, generated from backend Zod schemas (#18, #40) — see `API.md`.

## 3. Modular monolith — 11 backend modules

```
  identity · catalog · engagement · pipeline · payments
  messaging · notifications · knowledge · ai · search · analytics
```

No `admin` module — admin operations belong to whichever module owns the data (#8). Three
boundary rules, ESLint-enforced: modules call each other only through exported service
interfaces; **Prisma is imported only in `repository/`**; **raw SQL lives only in `sql/`**.

## 4. Request flow (synchronous)

```
  Browser ──CORS+cookie──► Express
                              │  role guard (coarse)
                              ▼
                          Service layer ──► policy function (resource-scoped)
                              │
                              ▼
                          Repository (Prisma) / sql/ (raw)
                              │
                              ▼
                          PostgreSQL (constraints = last line)
```

**Authorization lives in the service layer, never HTTP middleware** (#8, #33). This is what lets
AI tools and the Property Shortlist Agent call the *same* services with the *same* policy checks —
there is no middleware layer for them to bypass, because none exists to bypass.

## 5. Async flow

```
  Transaction commits ──► ENQUEUE (after commit, never inside it)
                              │
                              ▼
                          BullMQ (Redis) ──► Worker process
                              │
                       durable status column on the source row
                              │
                       sweeper (scheduled) re-drives anything stuck
```

**No generic outbox model** (#8). Every async workload gets a durable status column that a
sweeper re-drives — the queue is a latency optimization, never a correctness dependency (#10).

## 6. Data ownership — source of truth per concern

| Concern | Source of truth |
|---|---|
| Business-critical relational data | **PostgreSQL** (#6) |
| Authentication, sessions | **Better Auth** — 4 tables in our Postgres (#9, #39) |
| Payment success | **Verified webhook + reconciliation.** Never the browser return (#13) |
| Business/security history | **AuditLog** — immutable (#33) |
| API contract | **Backend Zod schemas** → generated OpenAPI (#18, #40) |
| Vectors | **pgvector**, column on `Property`, table for chunks (#6, #39) |

## 7. External providers — boundary and criticality

| Provider | Role | Critical? |
|---|---|---|
| Supabase PostgreSQL | Source of truth | ✅ **The only true single point of failure** (#10) |
| Upstash Redis | BullMQ, rate limiting, hybrid-search cache, WS pub/sub | ❌ Non-critical — degrades, doesn't fail (#10, #26, #44) |
| Cloudinary | Public media | ❌ |
| Supabase Storage | Private documents | ❌ |
| Paymob | Payments | ❌ — reconciliation covers outages (#13) |
| Google Gemini | LLM + embeddings | ❌ — AI is strictly additive (#17, #24) |
| Resend | Email delivery (all envs, real inboxes) | ❌ — BullMQ retry + sweeper covers outages (#36, #44) |
| FCM | Push | ❌ — in-app notification is authoritative (#10) |
| Sentry | Observability | ❌ |

**Every external dependency except Postgres is non-critical** — a direct consequence of #10's
reliability design. See `FAILURE_MODES.md` for the full matrix.

## 8. Local vs. future production topology

```
  LOCAL (now)                          FUTURE PRODUCTION
  localhost:3000 / :4000                Vercel (frontend) / Railway (api + worker, 2 services)
  Docker Postgres+PostGIS+pgvector      Supabase PostgreSQL
  Docker / Upstash Redis                Upstash Redis
  Resend (real email to Gmail/etc.)     Resend (LOCKED)
  Cloudinary (real, dev/ folder)        Cloudinary
  Fake Paymob adapter + local signer    Paymob
  Gemini (real, prompt-hash cached)     Gemini
```

**Every environment difference is a configuration value, never an `if (isProduction)` branch
around a security control** (#37). See `INFRASTRUCTURE.md` and `process/ENVIRONMENT.md`.

## 9. Reliability principles (see CONCURRENCY_AND_IDEMPOTENCY.md, PAYMENTS.md for detail)

- Correctness lives in database constraints and conditional updates; locks are an escalation, used
  in exactly two places (#10)
- `READ COMMITTED` default; `SERIALIZABLE` used nowhere
- Idempotency keys live in Postgres, never Redis (#10)
- Webhooks are a latency optimization; reconciliation is the correctness guarantee (#13)

## 10. What Settly explicitly does NOT contain

Kubernetes · Terraform · service mesh · multi-region · a staging environment · microservices ·
GraphQL · tRPC · Socket.IO (native WebSockets used for 1-on-1 chat; SSE for notifications) ·
Mailpit (real Resend delivery everywhere) · a generic event bus · CASL/Casbin · PostgreSQL RLS ·
a rental lifecycle · agency/organization models · agent subscription billing · a public/partner API ·
LangChain/LangGraph · a dedicated reranker (v1) · an autonomous or multi-agent system (#1, #8,
#10, #17, #19, #21, #22, #33, #43, #44).

## 11. Related documents

`DOMAIN_MODEL.md` (the 39 tables) · `BACKEND.md` (module internals) · `INFRASTRUCTURE.md`
(deployment) · `FAILURE_MODES.md` (degradation matrix) · `../DECISIONS.md` (rationale for every
choice above).
