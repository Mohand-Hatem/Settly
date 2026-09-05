# Testing Architecture

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decision #41 (extends #8, #10, #13, #27; generalises #19)
    Related:      ../architecture/CONCURRENCY_AND_IDEMPOTENCY.md, ENVIRONMENT.md

## 1. Purpose

The authoritative testing architecture. This is Decision #41 made implementation-ready — do not
simplify or reinterpret it; see `../DECISIONS.md` entry #41 for full rationale.

## 2. Six layers

| Layer | Environment | Contains | Must NOT contain |
|---|---|---|---|
| **1 Unit** | None | RRF, Arabic normalisation, cursor codec, guard predicates, chunking, prompt composition, money arithmetic | Prisma, HTTP, wall-clock time |
| **2 Service** | Real Postgres | Every transition/guard/invariant/policy function — every state-machine transition in BUSINESS_RULES.md Sections 2-5 (Property 14, Viewing 11, Offer 15, Payment 7) | HTTP concerns, external calls |
| **3 Database** | Real Postgres | Raw SQL in `sql/`, PostGIS, pgvector recall, FTS+trigram, generated columns, every constraint, migrations up/down | Business logic |
| **4 Concurrency** | Real Postgres, **serial, no wrapping transaction** | I9/I11/I12 advisory locks, viewing overlap, deposit race, idempotency races, offer CAS | Anything not racing |
| **5 API/contract** | Postgres + Redis | Status codes, RFC 9457 shapes, idempotency semantics, cursor round-trip, rate-limit headers, SSE framing, the 404-vs-403 leak rule | Business rules already covered at layer 2 |
| **6 E2E** | Full local stack | ~12 journeys | Exhaustive permutations |

**Business logic is tested at the service layer, not through HTTP** — authorization lives in
services, so HTTP tests would exercise the wrong boundary and run an order of magnitude slower.

**Layer 4 is separate because concurrency tests need genuinely concurrent transactions** — they
cannot run inside a wrapping transaction and cannot run parallel to one another. Layers 1-3 and 5
use transaction-rollback isolation and run in parallel; layer 4 uses truncate and runs serially.

## 3. Real Postgres, never a substitute

Exclusion constraints, partial unique indexes, advisory locks, `READ COMMITTED` re-evaluation
semantics, PostGIS, pgvector, and trigram **do not exist, or behave differently, in SQLite or any
in-memory substitute** — which would produce false confidence in exactly the mechanisms
`CONCURRENCY_AND_IDEMPOTENCY.md` depends on. **No Testcontainers** — Docker Compose (local) and
GitHub Actions service containers (CI, PENDING V32) already provide real Postgres/Redis.

## 4. Proving the concurrency invariants (layer 4)

| Invariant | Test |
|---|---|
| I9/I11/I12 | N concurrent requests at limit-1 → exactly the limit persists |
| Viewing overlap | Two overlapping confirmations → exactly one succeeds |
| Deposit race | Two rival webhooks concurrently → one RESERVED; loser SUPERSEDED + full refund |
| Idempotency | Two identical requests, one key → one execution or one replay |
| AuditLog immutability | UPDATE/DELETE both rejected by the database |

All against real Postgres, serial, **never retried** — a flake here is a genuine race.

## 5. Gate vs. report (generalised from Decision #19 to ALL AI evaluation)

| CI gate | CI report |
|---|---|
| Layers 1-5, OpenAPI drift, generated-client freshness, migration validation, destructive-migration detection, module boundaries, `npm audit` critical, gitleaks | Retrieval evaluation (Search.md thresholds), agent eval suite, backend/frontend snapshot skew |

**Evaluation of a non-deterministic system must never gate a deterministic pipeline** — an
intermittently-failing gate is one people learn to bypass.

## 6. Environment and substitution

Mailpit for email · fake Paymob adapter + local webhook signer (sandbox is a manual pre-release
check, never CI) · **Gemini never in gated CI** — evaluation runs separately · Cloudinary real
locally, faked in CI · MSW driven by the **committed OpenAPI snapshot**, so mocks cannot drift
from the contract.

⚠️ **Tests never use the demo seed corpus.** Factories only. The seed exists to demonstrate the
product, not to fixture tests.

## 7. Determinism

Fixed clock (fake timers) for expiry logic · seeded randomness · deterministic fixture ids ·
Playwright traces + database snapshots captured on failure.

> ⚠️ **Retries only for genuinely external flake in the manual pre-release sandbox check — never
> for layers 1-5.** A flaky concurrency test is a finding, not a nuisance.

## 8. Frontend and E2E

Component tests for bilingual rendering, RTL under `dir="rtl"`, `dir="auto"` on mixed content,
localized validation error mapping, URL-state round-trips, SSE-triggered TanStack Query
invalidation, axe accessibility assertions — no E2E duplication at component level.

**~12 E2E journeys**: browse+search · property detail · favourite · saved search · verification
gate blocking a viewing request · viewing request→confirm · offer submit→counter→accept · payment
initiation→webhook completion · refund · agent availability→confirm · admin moderation · AI
assistant + RAG permission boundary.

## 9. Coverage philosophy

**No coverage thresholds** — a number that gets gamed. Layer 4 passing is the real signal.

## 10. Pending verification

V28 (Zod→OpenAPI generator capability, gates what layer 5 can assert) · V30 (Express 5 + SSE vs.
compression — affects layer 5's SSE tests) · V32 (CI service-container extension support).

## 11. Rejected / do not add

SQLite/in-memory Postgres · Testcontainers · mocking Prisma · a shared long-lived CI database ·
coverage thresholds · retrying concurrency or E2E tests · duplicating E2E at component level.

## 12. Related documents

`../architecture/CONCURRENCY_AND_IDEMPOTENCY.md` for the exact races layer 4 proves ·
`ENVIRONMENT.md` for how local/CI environments are provisioned · `SEED_DATA.md` for why the
evaluation corpus is separate from tests.
