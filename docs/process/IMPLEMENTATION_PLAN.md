# Implementation Plan

    Status:       LOCKED (step order and boundaries) · task-level detail may be refined during execution
    Last Updated: 2026-09-17
    Derived From: ROADMAP.md, DECISIONS.md Section 2.1, all architecture/ documents, discovery decisions #45–#83
    Related:      ROADMAP.md, ../DECISIONS.md, ../design/DESIGN_SYSTEM.md

## 1. Purpose

`ROADMAP.md` locks the phase *order*. This document breaks each phase into ordered,
individually-completable **steps** — what to build, which documents govern it, and how to know
it's done. It invents no new architecture; every step cites the decision or document that
justifies it. Where a step's internal detail is genuinely an implementation choice (not
architecture), it says so and moves on.

**Two tracks run in parallel from day one:** Backend/architecture implementation (this document)
and Design (Section 8). Neither blocks the other until Step 14 (frontend UI work).

## 2. Step 0 — Verification spikes (before any code)

Twelve items gate coding directly (`../DECISIONS.md` Section 2.1). None require architectural
work — each is a documentation read or a short integration spike. Do these in the batches below,
not all twelve upfront: only the first batch blocks Step 1.

| Batch | Items | Gates | Effort |
|---|---|---|---|
| **0a — before the first migration** | V1 (Gemini embedding model/dims), V2 (pgvector/`halfvec` limits), V5 (Better Auth UUIDv7 override), V12 (absolute session cap), V20 (`role`/`banned` column types), V21 (Better Auth CLI/Prisma coexistence), V22 (verification token hashing), V33 (does `prisma migrate` preserve hand-written rules/triggers) | Step 3 (schema) | ~1 day |
| **0b — before the first endpoint** | V28 (Zod→OpenAPI generator capability), V30 (Express 5 + SSE vs. compression), V31 (Better Auth mount-prefix) | Step 5 (API skeleton) | ~half a day |
| **0c — before CI is wired** | V32 (GitHub Actions service containers with the required Postgres extensions) | Step 2 (CI) | ~2 hours |
| **0d — now, since Cloudinary is real locally** | V16 (Cloudinary signed upload preset constraints) | Step 11 (uploads) | ~1 hour |

**Acceptance criteria for Step 0:** each item's `DECISIONS.md` row updated from `☐ Open` to a
verified outcome, with the affected topic document(s) corrected if the verification contradicts
an assumption. **"It sounds plausible" does not close an item** (`../DECISIONS.md` Section 2.1).

Everything else (V3, V4, V7-V11, V13-V19, V23-V27, V29) is deferred to the phase that actually
needs it — do not front-load them.

## 3. Step 1 — Repository scaffolding

- `frontend/` and `backend/` as independent applications (Decision #18) — separate
  `package.json`, lockfiles, no shared-code dependency
- `docker-compose.yml`: Postgres (PostGIS + pgvector + pg_trgm + btree_gist), Redis (or Upstash Redis config)
  (`process/ENVIRONMENT.md`). Mailpit is eliminated per Decision #44; Resend is used for email delivery.
- `.env.example` in each project with every key present, no real values
- Backend module skeleton: 11 modules, each with `routes/ service/ repository/ sql/`
  (`architecture/BACKEND.md` Section 4)
- ESLint import-boundary rules enforcing the layering (Prisma only in `repository/`, raw SQL only
  in `sql/`, no cross-module repository access)

**Acceptance:** `docker-compose up` brings up a working local stack; both apps boot with a health
check; the boundary lint rules fail on a deliberately-broken test import.

## 4. Step 2 — CI skeleton

Lint, strict `tsc`, empty test suite passing, GitHub Actions service containers for Postgres +
Redis (pending V32), branch protection on `main` (`architecture/INFRASTRUCTURE.md` Section 7,
`process/CONVENTIONS.md`).

**Acceptance:** a trivial PR runs all gates green.

## 5. Step 3 — Database schema (first migration)

The 39-table schema from `architecture/DOMAIN_MODEL.md`, generated columns for FTS
(`architecture/DATABASE.md` Section 5), the exclusion constraint for viewing overlap, partial
unique index for the deposit race, the AuditLog append-only rule (subject to V33's outcome).
Better Auth's 4 tables generated via its CLI into the same schema (Decision #9).

**Acceptance:** `prisma migrate dev` succeeds from empty; every constraint in
`architecture/DATABASE.md` Section 7 exists and is independently verifiable with a failing-insert
test (layer 3, `process/TESTING.md`).

## 6. Step 4 — Testing harness

Layers 1-5 wired per `process/TESTING.md`: transaction-rollback isolation for layers 1-3/5,
truncate + serial for layer 4. Factories (never the seed corpus). This step exists *before*
feature work so every subsequent step ships with real tests, not tests bolted on after.

**Acceptance:** one trivial test per layer passes, including one real concurrency test against
two live transactions.

## 7. Phase 1 — Vertical slice (`auth → properties → search → property detail → viewing request`)

Target: ~6 weeks (Decision #29). Steps 5-13 below. This is the phase that produces something
demonstrable end to end.

| Step | Delivers | Governing docs | Acceptance |
|---|---|---|---|
| **5** | API skeleton: Zod schemas → OpenAPI generation → CI drift gate; RFC 9457 error middleware; `X-Request-Id`/Pino correlation | `API.md`, `BACKEND.md` §7-9, `OBSERVABILITY.md` | A schema change regenerates the spec and fails CI if uncommitted |
| **6** | Better Auth wired: sessions, cookie config, `emailVerified`, `role`/`banned`, `preferredLocale` | `AUTH.md` | Register/login/logout work locally with real verification email via Resend; a banned user is rejected immediately |
| **7** | Identity module: `AgentProfile`, `UserDevice`, agent verification flow | `AUTH.md`, `DOMAIN_MODEL.md` §3 | An agent can register and await verification; an admin can verify them |
| **8** | Catalog module: `Property` CRUD, two-tier edit moderation, image upload via Cloudinary | `BUSINESS_RULES.md` §2, `STORAGE.md` | Full property lifecycle (P1–P16 as of #77/#78/#81) testable at the service layer. Whether the listing quota (#80) is enforced in this step: **OPEN** |
| **9** | Filter search: structured + geo (PostGIS), cursor pagination | `SEARCH.md` §2-3, §9 (filter path only — defer lexical/semantic to Phase 3) | `/search/properties` returns correct results with a stable cursor under concurrent inserts |
| **10** | Property detail page contract: English content fields (V1 is English only, #99), `searchVectorEn` generated column present (unused until Phase 3) | `DOMAIN_MODEL.md` §4, `FRONTEND.md` §5 | A bilingual property record round-trips correctly |
| **11** | Uploads: authorize/complete flow, magic-byte verification, EXIF stripping | `STORAGE.md`, pending V16 | A malicious-extension upload is rejected; a real image is re-encoded and served without EXIF |
| **12** | Pipeline module: `Lead` (created on first contact, hybrid pipeline — #75, #83), `AgentAvailability`, `Viewing` — the full V1-V11 state machine including the exclusion constraint and I9 advisory lock | `BUSINESS_RULES.md` §3, `CONCURRENCY_AND_IDEMPOTENCY.md` | Two overlapping confirmations race correctly (layer 4 test); a 4th open request is rejected |
| **13** | Email verification gate wired to V1 (and O1/O3/O5/Y2 stubbed for Phase 2) | `AUTH.md` §6, `BUSINESS_RULES.md` §9.1 | An unverified user is blocked at viewing-request creation with `email-not-verified` |

**Frontend, in step with the backend (not a separate phase):** English-only app shell (no locale segment, #99), auth pages,
property search + detail (SSR/ISR per `FRONTEND.md` §2), viewing-request flow, generated API
client wired end to end. This is where Design (Section 8) must have delivered at least the core
screens — see the dependency note in Section 9.

**Phase 1 exit criteria:** a user can register, verify their email, browse English listings,
search by filter, view a property, and request a viewing — all through the real UI, against the
real API, with zero mocked business logic.

## 8. Phase 2 — Transactional core

Offers (`BUSINESS_RULES.md` §4, including I12 and the verification boundary on O1/O3/O5) →
Payments (`PAYMENTS.md` — the checkout hold, the atomic bundle, the fake-adapter test suite, one
mandatory Paymob sandbox test for V4) → Messaging (`COMMUNICATION.md` §8) → Notifications
(§2-5, the authority rule and the sweeper pattern). This phase is where
`CONCURRENCY_AND_IDEMPOTENCY.md`'s hardest mechanisms (the deposit race, idempotency keys) get
built and proven.

Also governed by the discovery decisions: two-party sale completion and its admin review (#77, #82).
Transaction revenue and subscription billing (#79, #80) are **not placed in any phase yet — OPEN**.

**Exit criteria:** a buyer can submit an offer, have it accepted, pay a deposit through the fake
adapter with a real webhook signature check, and see the reservation succeed — with a second
concurrent buyer correctly superseded and refunded.

## 9. Phase 3 — Intelligence

Lexical + semantic search arms and RRF fusion (`SEARCH.md` §4-6) — English only in V1 (#99); V23/V24
(Arabic and cross-language retrieval) are deferred with Arabic. RAG
ingestion and the visibility-filtered retrieval pipeline (`RAG.md`). The AI assistant tool-calling
loop (`AI.md`). The Property Shortlist Agent (`AGENT.md`), built last since it composes the
others. Seed data (`SEED_DATA.md`) is built and the evaluation gate run **as part of this phase**,
not before — there's nothing to seed until the schema and search arms exist.

**Exit criteria:** the retrieval evaluation report (`SEED_DATA.md` §4) meets its pre-committed
thresholds, or the embedding decision is revisited per the documented gate — not silently shipped
either way.

## 10. Phase 4 — Operations

Admin moderation surface (load-bearing per Decision #28), the minimal operational panel
(`OBSERVABILITY.md` §6), the privacy/retention sweepers (`SECURITY.md` §11-15), remaining
scheduled jobs. Advanced admin analytics and a search-analytics dashboard are **explicitly out of
scope** (`product/ANALYTICS.md` §3) — do not add them here or anywhere.

## 11. Deployment phase

Only after Phase 1 is demonstrable. Vercel + Railway (2 services) + Supabase, per
`architecture/INFRASTRUCTURE.md`. Resolve the deployment-only verification batch (V8, V9, V10,
V11, V13, V14, V15, V17, V18) at this point, not earlier — most concern a domain, a hosting tier,
or a production email provider that don't exist yet.

## 12. The parallel design track (Section 13 of this response covers this in detail)

Stitch design exploration should start **now**, alongside Step 0, not after Phase 1. It has the
longest lead time and blocks nothing except the frontend UI work in Steps 5-13's frontend column.
`design/DESIGN_SYSTEM.md` Section 3 is the brief; Section 13 below (delivered separately) covers
how to run it.

## 13. What this document does not do

It does not re-litigate scope (`product/OVERVIEW.md` Section 6, as amended by the discovery decisions
#45–#83), does not re-open any locked decision, and does not specify exact file names, class names, or line-level tasks —
that granularity belongs to whoever executes each step, constrained by `process/CONVENTIONS.md`.

## 14. Related documents

`ROADMAP.md` for the phase-level view this document expands · `../DECISIONS.md` Section 2.1 for
the authoritative verification-blocking table · every `architecture/` document cited per step
above.
