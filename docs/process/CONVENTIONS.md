# Engineering Conventions

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #8, #33, #40
    Related:      ../architecture/BACKEND.md, ../architecture/API.md, TESTING.md

## 1. Purpose

Naming, layering, and coding conventions that keep the modular monolith modular and the API
contract consistent. Where a rule can be enforced mechanically (ESLint, `tsc`, CI), it is —
documentation covers what can't be encoded.

## 2. Module layering (mechanically enforced)

```
  routes/      HTTP surface only — parse, validate, delegate. No business logic.
  service/     Business rules, policy checks, transaction boundaries.
  repository/  Prisma access. THE ONLY place Prisma is imported.
  sql/         Raw SQL, named + tested functions with explicit return types.
```

ESLint import-boundary rules fail the build on: a module reaching into another module's
repository or Prisma models directly; Prisma imported outside `repository/`; raw SQL string
interpolation with a variable (must be a parameterized placeholder or a closed allowlist for
dynamic identifiers).

## 3. Naming

Plural nouns, kebab-case routes (`/saved-searches`). UUIDv7 in API paths; slugs only in public
frontend URLs, never API paths. Action endpoints are verbs (`/offers/:id/accept`), never
`PATCH { status }` (`../architecture/API.md` Section 4).

## 4. Error conventions

RFC 9457 `type` is the sole machine identifier — no second `code` field. `title`/`detail` are
developer-facing English, never localized, never rendered. See `../architecture/API.md` Section 5
for the full taxonomy and the rule bounding it.

## 5. Test placement (see TESTING.md for full detail)

Business logic tests live beside the service they test, at the service-test layer — never as
HTTP integration tests. Concurrency tests are isolated in their own suite (serial, truncate,
never retried).

## 6. Config conventions

Business constants (deposit %, TTLs, retention windows) live in **one backend configuration
module** — never duplicated inline. `product/BUSINESS_RULES.md`'s constants table is generated
from it (#31).

## 7. Logging conventions

`pino` only — no `console.log` in application code. Every log call includes structured fields,
never string-concatenated messages. Redaction paths are configured once, globally (see
`../architecture/OBSERVABILITY.md`).

## 8. Async/job conventions

Every BullMQ job handler must be idempotent (at-least-once delivery). Enqueue only after the
originating transaction commits, never inside it. Every async workload gets a durable status
column on its own row — never a new generic outbox model.

## 9. Migration conventions

Forward-only; expand/contract for anything destructive; a migration containing `DROP` or a
narrowing `ALTER TYPE` requires explicit human approval in review, flagged by a CI check.

## 10. Security-sensitive coding conventions

No state-changing GET endpoints, except capability-token flows where the token itself is the
authorization. Authorization checks happen in the service layer, never only in route middleware.
Any new resource-scoped endpoint must be evaluated against the 404-vs-403 leak rule
(`../architecture/API.md` Section 6) before merge.

## 11. Pending verification

None directly — this document is derived from already-locked decisions and encodes no new
external dependency.

## 12. Rejected / do not add

`console.log` in application code · business logic tested only via HTTP · a generic outbox model
· inline business constants duplicated across files.

## 13. Related documents

`../architecture/BACKEND.md` for the module structure this enforces · `../architecture/API.md`
for the contract conventions referenced here · `TESTING.md` for test-layer placement in detail.
