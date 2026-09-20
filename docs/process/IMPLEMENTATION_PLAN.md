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

**Status (2026-09-19): slice 1 delivered on branch `feat/slice-1`** per
`../discovery/06-slice-1-screen-specs.md` and decision #106:
- **Delivered:**
  - link-only email verification;
  - required phone and the `/complete-profile` step;
  - 7-day sliding / 30-day absolute sessions;
  - portal shells and switcher;
  - the viewing pipeline V1–V11 with I9 and R4 (backend `test:viewings`, 14 tests including both
    races);
  - property page and request modal;
  - buyer and agent viewing screens;
  - MapTiler everywhere.
- **Verified end to end in the browser:** register → verification gate → request → agent confirms →
  Upcoming.
- **Known follow-ups outside the slice:**
  - notification delivery for viewing events (notifications phase);
  - the agent-application flow (seeded agents for now);
  - ~~the public "AI assistant" widget~~ (hidden from public layout, 2026-09-19);
  - ~~public property response includes agent's email~~ (removed from schema & repository, 2026-09-19);
  - Better Auth still uses its default ids and password hasher (gaps B5, #9 Argon2id);
  - the deposit-enum mismatch (#105);
  - the Arabic-field migration (#101);
  - ~~the `offline-sale` / `mark-sold` removal~~ (removed per #102, 2026-09-19).

## 8. Phase 2 — Transactional core

**Status (2026-09-20): Offers and Reservation Deposit Payments delivered end-to-end (Decisions #107, #108):**
- **Authoritative 10-state machine** (`PENDING_AGENT`, `PENDING_BUYER`, `ACCEPTED`, `RESERVED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`, `SUPERSEDED`, `COMPLETED`, `FELL_THROUGH`) with migration applied (`20260919143000_offer_status_and_reasons`).
- **Negotiation revisions:** `OfferRevision` thread tracking counter-offers with price, earnest money, and contingencies.
- **Invariant I12 & Concurrency:** strictly enforces at most 5 live offers per buyer via transactional advisory lock.
- **Privacy enforcement:** listing agent sees buyer phone number only while an active offer exists (#60, #66); agent phone is never public.
- **72-hour deposit obligation:** 5% deposit (capped at 50,000 EGP) generated on offer acceptance with `depositDeadlineAt`.
- **Reservation Deposit Payments & Concurrency Engine (Decision #108):**
  - Database enums reconciled (`20260920110000_reconcile_deposit_enums`): `PaymentStatus.CANCELLED`, `AttemptStatus.ABANDONED/EXPIRED`, `RefundStatus.SUCCEEDED`.
  - 15-minute exclusive checkout hold on property (`checkoutHoldExpiresAt`) preventing concurrent checkout races (409 Conflict).
  - Paymob hosted checkout adapter with HMAC-SHA512 webhook signature verification across sorted keys and sandbox fallback.
  - Absolute Rule: client return URLs never mark payment `SUCCEEDED`; webhook is sole authority.
  - Transaction T1 (Atomic Bundle): WebhookEvent -> Payment `SUCCEEDED` -> Offer `RESERVED` -> Property `RESERVED` -> rival offers `SUPERSEDED` -> rival payments `CANCELLED`.
  - Polling telemetry endpoint `GET /api/v1/offers/:id/deposit/status` (`SH-05`).
  - Frontend screens `BUY-08` (`/buyer/offers/[id]/deposit`) and `BUY-09` (`/buyer/offers/[id]/deposit/callback`) built to Impeccable "Navy & Brass" design tokens.
- **In-App Messaging Engine (Decision #109, SH-03):**
  - Property-scoped 1-on-1 conversations between buyers and agents (`Conversation`, `Message` Prisma models).
  - Invariant #59 strictly enforced (agent cannot message own listing, returns 409 Conflict).
  - Decision #75 automatic `Lead` creation in `LeadStatus.NEW` upon conversation initialization.
  - Real-time WebSocket server at `/ws/chat` with session-based authentication and user-level multi-device fan-out.
  - Privacy rules (#42, #60, #66): chat messages strictly excluded from AI RAG embeddings; phone numbers never exposed in chat DTOs or UI; 404 leak protection for unauthorized requests.
  - Frontend screens `BUY-13` (`/buyer/messages`) and `AGT-15` (`/agent/messages`) built to Impeccable "Navy & Brass" terminal style, plus "Message Agent" modal (`PUB-03`) on property detail pages.
  - Backend test coverage: 8 integration tests (`test:messaging`) passing with 100% green exit code 0.
- **Notification Engine & Notification Center (Decision #110, SH-02):**
  - PostgreSQL authoritative store for all notification records (`COMMUNICATION.md` §1); email (Resend) and real-time WebSocket signals (`NOTIFICATION_SIGNAL`) as best-effort deliveries.
  - Category taxonomy: `DEALS`, `VIEWINGS`, `MESSAGES`, `SYSTEM` with dynamic contextual server-side template formatting.
  - Lifecycle event triggers wired into Viewing pipeline, Offer negotiation pipeline, Deposit payment webhooks, and Chat messaging.
  - High-performance unread count endpoint `GET /api/v1/notifications/unread-count` and management endpoints (`PATCH /read`, `POST /mark-all-read`, `DELETE /:id`).
  - Header bell with unread badge counter and preview dropdown integrated into `PortalShell`.
  - Full Notification Center feeds implemented for Buyer (`BUY-14` at `/buyer/notifications`), Agent (`AGT-16` at `/agent/notifications`), and Admin (`ADM-13` at `/admin/notifications`) with 4-metric overview, category filters, timeline grouping (`Today`, `Yesterday`, `Earlier`), and quick action buttons.
  - Backend test coverage: 8 integration tests (`test:notifications`) passing with 100% green exit code 0.
- **Two-Party Sale Completion & Admin Review (Decision #111, P9, P9a, P10, O13, O14):**
  - Enforced two-party mutual confirmation rule (Decisions #77, #102): an agent can never mark a listing SOLD alone; both buyer and agent confirmation required to transition Offer to `COMPLETED` and Property to `SOLD`.
  - 30-day conveyance period timer with automatic escalation to Admin Review upon deadline expiration or dispute reporting (Decision #82, Transition P9a).
  - Conflict-of-Interest Guard (Decisions #67, #71): administrators who are party to the deal are barred by software guard and backend authorization (`/errors/admin-conflict-of-interest`, HTTP 403) from adjudicating the sale.
  - Full admin adjudication actions at `/admin/sales` (`ADM-07`): Confirm Sale -> `SOLD`, Fell Through -> `PUBLISHED` with §7 deposit refund determination, and Extend Review with audit justification notes.
  - Lead lifecycle progress: Completing a sale marks the buyer's `Lead` as `QUALIFIED` (Decision #83).
  - Frontend components: `SaleCompletionCard` with dual confirmation stepper and 30-day timeline progress bar mounted in buyer and agent offer drawers, and full `ADM-07` admin review dashboard with conflict-of-interest handling.
  - Backend test coverage: 10 integration tests (`test:sales`) passing with 100% green exit code 0.
  - **🎉 Phase 2 (Transactional Core) is 100% COMPLETE!** All 6 milestones (Offers, Viewings, Deposit Payments & Concurrency, In-App Messaging, Notification Engine, Two-Party Sale Completion & Admin Review) fully implemented and verified.

**Exit criteria achieved:** a buyer can submit an offer, negotiate revisions, have it accepted, pay a reservation deposit through the Paymob checkout flow, supersede rival offers, message the agent in real time, receive authoritative notifications, complete mutual two-party conveyance or resolve disputes through Admin Review — with the property transitioning accurately between `PUBLISHED`, `RESERVED`, and `SOLD`.

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
