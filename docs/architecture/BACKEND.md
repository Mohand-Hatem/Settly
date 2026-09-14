# Backend Architecture

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #8, #10, #33, #37
    Related:      OVERVIEW.md, API.md, AUTH.md, CONCURRENCY_AND_IDEMPOTENCY.md, ../process/CONVENTIONS.md

## 1. Purpose

Backend runtime, module structure, and the layering rules that keep the modular monolith modular.

## 2. Runtime

**Node.js 22+ LTS, Express 5, TypeScript strict, ESM.** A boring choice on purpose — Bun/Deno
would introduce ecosystem risk on load-bearing dependencies (Prisma engines, BullMQ, sharp,
PostGIS drivers) for no benefit Settly needs (#8).

## 3. Two processes, one codebase

```
  backend/
  ├── settly-api       Express, SSE, native WebSocket (/ws/chat), ALWAYS ON
  └── settly-worker    BullMQ consumers + 9 schedulers (Upstash Redis, ALWAYS ON)
```

Two Railway/container services in production (#22, #44) — split for architectural honesty (a worker
crash cannot take down the API) at negligible cost. **Critical constraint:** BullMQ worker event loops
and native WebSocket connections require persistent, continuously-running Node.js processes. They
cannot be deployed inside ephemeral, scale-to-zero serverless functions (such as Vercel functions).

## 4. Module structure — 11 modules, no admin module

```
identity · catalog · engagement · pipeline · payments
messaging · notifications · knowledge · ai · search · analytics
```

Admin operations live in the module that owns the data — an `admin` module would become a
god-object reaching into everything (#8).

Internal shape of each module:

```
  routes/      HTTP surface: parse, validate, map to a use case. No business logic.
  service/     Business rules, policy checks, transaction boundaries.
  repository/  Prisma access. THE ONLY place Prisma is imported.
  sql/         Hand-written SQL — PostGIS, pgvector, hybrid ranking. Each query named, tested.
  events/      Event definitions this module emits.
  types/       Module-internal types.
```

**Three ESLint-enforced boundary rules:**

1. A module calls another only through its exported service interface — never another module's
   repository or Prisma models directly
2. Prisma is imported in `repository/` only
3. Raw SQL lives only in `sql/`

**Declared exception:** Better Auth *is* the identity module's repository for its 4 tables (#9).

## 5. Authorization lives in the service layer

```
  Route     → coarse role guard (declarative)
  Service   → resource policy function: canViewOffer(actor, offer)
  Business  → conditional update / invariant
```

**Not HTTP middleware.** This is what lets AI tools and the Property Shortlist Agent call the same
service functions with the same actor context and inherit every policy check automatically — there
is no middleware layer for them to route around (#8, #33).

## 6. Async workloads — no generic outbox

Every async workload gets a **durable status column on its own row** plus a scheduled sweeper that
re-drives anything stuck. No generic `OutboxEvent` model (#8).

```
  Transaction commits (writes the row, status = PENDING)
        │
        ▼  ENQUEUE — after commit, never inside the transaction
  BullMQ (Upstash Redis via TCP)
        │
        ▼
  Worker executes, updates status
        │
        ▼
  Sweeper (scheduled) re-enqueues anything still PENDING past its window
```

Nine scheduled jobs drive every system-initiated state transition (payment reconciliation,
deposit/offer/viewing expiry, checkout-hold expiry, notification sweep, idempotency cleanup,
session cleanup, matview refresh) — full list in `CONCURRENCY_AND_IDEMPOTENCY.md`.

**Every BullMQ job must be idempotent** — the queue is at-least-once.

## 7. Validation

**Zod v4**, schemas shared with the frontend via generated OpenAPI (#8, #18, #40). Three layers,
never conflated:

| Layer | Answers | Lives in |
|---|---|---|
| Schema validation (Zod) | Is this well-formed? | Route boundary |
| Business invariants | Is this allowed right now? | Service layer |
| Database constraints | Is this possible? | PostgreSQL |

## 8. Error handling

RFC 9457 `application/problem+json` per Decision #40 — see `API.md` for the full taxonomy.
Errors are language-neutral; the frontend localizes from `type` + `params` + `errors[].code`.

## 9. Request context

`X-Request-Id` accepted inbound if well-formed, else generated; propagated via AsyncLocalStorage
so every Pino log line in a request carries `requestId`, `userId`, `route` automatically (#34).

## 10. Config

Environment variables per `../process/ENVIRONMENT.md`. Business constants (deposit %, TTLs,
retention windows) live in one backend configuration module — the single authoritative source
that `product/BUSINESS_RULES.md`'s constants table is generated from (#31, #42).

## 11. Failure philosophy

**Every external dependency except PostgreSQL is non-critical** (#10). See `FAILURE_MODES.md` for
the complete degradation matrix.

## 12. Pending verification

V21 (Better Auth CLI/Prisma coexistence), V28/V30/V31 (contract and SSE generation, mount-prefix
flexibility) affect this document's implementation but not its architecture.

## 13. Rejected / do not add

Fastify, NestJS, Hono (Express 5 was the user's explicit choice over the Fastify recommendation) ·
Next.js full-stack (cannot host long-running workers) · GraphQL, tRPC · a generic outbox model ·
an admin module · HTTP middleware as the authorization boundary.

## 14. Related documents

`API.md` for the HTTP contract · `AUTH.md` for the Better Auth boundary ·
`CONCURRENCY_AND_IDEMPOTENCY.md` for the transaction and job inventory ·
`../process/CONVENTIONS.md` for naming and layering conventions.
