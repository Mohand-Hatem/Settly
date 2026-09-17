# System Audit — What Actually Exists

    Status:       FACTUAL SNAPSHOT (discovery phase) · not a requirements document
    Last Updated: 2026-09-17
    Branch:       fix/frontend-map-fonts-images-compare @ d916a4d (main @ 3d99320 + 3 commits)
    Related:      02-gap-analysis.md, ../README.md, ../DECISIONS.md

This document records **what the repository contains and does today**, with evidence. It does
not say what Settly *should* do; that lives in `../product/` and `../architecture/`, and the
differences are in `02-gap-analysis.md`.

Evidence labels used below: **[code]** confirmed by reading code or running it · **[docs]**
stated in existing documentation · **[inferred]** reasonable reading of the code, not proven ·
**[unknown]** could not be established.

---

## 1. Project overview

Settly is a real-estate marketplace for Egypt, priced in EGP, with the stated ambition of
AI-assisted discovery **[docs]**. The code today delivers:

- a **public discovery website**: landing, search with map, property detail, compare, areas,
  area detail, market insights, agent directory and agent profile **[code]**;
- **authentication**: register, login, email verification, password reset **[code]**;
- a **listing-moderation backend**: agents create listings, admins approve, reject and suspend
  them **[code]**;
- **agent verification by an admin** **[code]**.

**Nothing after discovery exists yet**: no buyer or agent dashboards, viewings, offers,
payments, messaging, notifications, AI, search engine or background jobs **[code]**.

Every public page shows a banner: "Design mockup … all listings, prices and figures are
illustrative placeholders" (`frontend/src/components/layout/MockupRibbon.tsx`) **[code]**.

Commit history: 12 commits between 2026-09-05 and 2026-09-17. The architecture and docs phase
was followed by roughly 170k lines added in four implementation commits **[code]**.

## 2. Technology stack

| Layer | What is installed and used | Notes |
|---|---|---|
| Frontend | Next.js 15.5.25 (App Router, webpack), React 19.3, TypeScript 5.7, Tailwind 3.4 plus about 15k lines of hand-written CSS, TanStack Query 5, `openapi-fetch` + `openapi-typescript`, Better Auth React client, Leaflet 1.9 + react-leaflet 5, Sonner, lucide-react | Not installed despite being locked in FRONTEND.md: nuqs, Zustand, React Hook Form, shadcn/ui, Recharts, TanStack Table, Motion, MapLibre, Vitest, Playwright |
| Backend | Node 22, Express 5, TypeScript (strict), ESM, Prisma 6.4 (`relationJoins`), Zod **3.24** (docs say Zod v4), `@asteasolutions/zod-to-openapi` 7, Pino + pino-http, `ws`, `uuidv7`, `sharp` | No BullMQ, ioredis, Helmet, rate limiter, Argon2, Paymob SDK or Gemini SDK installed |
| Database | PostgreSQL **16** (`postgis/postgis:16-3.4` + pgvector, `docker/Dockerfile.postgres`). Extensions: postgis, vector, pg_trgm, btree_gist, uuid-ossp, pg_stat_statements | Decision #6 said PG 17+. `DIRECT_URL` in the schema suggests a pooled host (Neon per V6; Decision #22 said Supabase) **[inferred]** |
| Authentication | Better Auth (email + password, optional Google OAuth, `admin` plugin), HTTP-only session cookie | No `bearer` plugin, Argon2id, UUIDv7 id generator or audit hooks configured (see §12) |
| Storage | Cloudinary: signed direct upload, then a finalize step (`catalog/routes/upload.routes.ts`) | No Supabase Storage / private documents |
| Payments | None. Only `PAYMOB_*` environment placeholders | — |
| Queues | None. `settly-worker.ts` only logs nine job names | `REDIS_URL` is read but never used |
| Caching | None server-side. The property detail page uses Next `fetch` with `revalidate: 60` | — |
| Email | Resend (`shared/email/resend.ts`): verification (link + 6-digit code) and password reset | Decision #44 removed Mailpit |
| Maps / tiles | MapTiler raster tiles on search (API key hard-coded in `SearchMap.tsx`); CARTO tiles on area maps | FRONTEND.md locks MapLibre |
| AI | None. `GEMINI_API_KEY` is optional and unused | — |
| Fonts | Self-hosted woff2 via `next/font/local` (since 2026-09-17) | — |
| Deployment | None. `docker-compose.yml` runs Postgres and Redis locally | No backend Dockerfile, no Vercel/Railway configuration |
| CI | GitHub Actions: backend (lint, build, boundary lint, migrate, DB constraints, OpenAPI drift, HTTP integration suites, `npm audit`) and frontend (lint, build) | **Contains a real Cloudinary API secret** (§12) |

Other repository content: `.agents/` (about 300 AI-skill files), `.specify/`, `graphify-out/`,
`Images/`, and agent instruction files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`). `AGENTS.md` and
`GEMINI.md` carry a UI "impeccable" directive and a 33-screen inventory.

## 3. Architecture as it actually exists

```
Browser ──► Next.js (localhost:3000)
  │           - route groups (public), (auth); nearly every page is "use client"
  │           - middleware.ts: calls the backend session endpoint for /buyer, /agent, /admin
  │             and the auth pages (those dashboard pages do not exist yet)
  │           - property detail: server fetch with revalidate 60
  └─ direct CORS + cookies ──► Express API (localhost:4000)
                                 ├─ /api/auth/*  Better Auth (mounted before express.json)
                                 ├─ /api/v1/*    module routers (see §7)
                                 ├─ /health, /api/v1/health
                                 └─ ws://…/ws/chat   WebSocket server: no auth, no-op handlers
                               settly-worker (separate entrypoint): logs and exits nothing
                               PostgreSQL (Prisma, repository layer + sql/)
                               Cloudinary · Resend
```

- **Modular monolith:** 11 module folders. **3 contain real logic** (identity, catalog, and one
  analytics route); **8 are scaffolds** that return stub objects (§4) **[code]**.
- **Layering:** routes → service → repository, enforced by ESLint boundary rules and a boundary
  test **[code]**. Known deviations:
  - `identity/routes/agent-directory.routes.ts` imports Prisma directly;
  - `analytics/routes/market.routes.ts` returns literal data from the route;
  - `catalog/service/area.service.ts` fabricates yield, appreciation and price-trend figures.
- **Contract:** Zod schemas generate the OpenAPI spec, which is committed to both
  `backend/docs/openapi.json` and `frontend/src/api/openapi.json`, with a CI drift gate
  **[code]**. The frontend's generated client is used by Compare, Search, Areas and Register;
  the other pages call `fetch` by hand **[code]**.
- **Errors:** RFC 9457 middleware **[code]**. Exception: `POST /api/v1/identity/verify-otp`
  returns `{error}` bodies.
- **Duplicate routing:** catalog routers are mounted both at `/api/v1/{areas,properties,…}`
  and under `/api/v1/catalog/…`. Every module also exposes `/api/v1/<module>/health`.
- **Rendering:** there is no `/[locale]` segment. The public pages are client components that
  fetch in the browser, whereas FRONTEND.md prescribes static/ISR rendering.

## 4. Modules

| Module | Current state | Evidence |
|---|---|---|
| identity | **Real.** Better Auth configuration; auth middleware (`requireAuth`, `requireRole`, `requireVerifiedEmail`); `/me` profile (get, patch); agent-profile upsert; admin agent list, get and verify; device register/unregister; public agent directory and profile; custom OTP verification | `modules/identity/**` |
| catalog | **Real.** Areas (list, get, insights); amenities (list, admin create); properties (public list, get by id or slug, agent create/edit/delete, the listing state machine, image delete/reorder); admin approve/reject/suspend/unsuspend; `/me/properties`; Cloudinary upload authorize + complete; compare | `modules/catalog/**` |
| analytics | **Partial.** Only `GET /market-pulse`, which returns hard-coded data. Service/repository are stubs | `analytics/routes/market.routes.ts` |
| engagement, pipeline, payments, messaging, notifications, knowledge, ai, search | **Scaffold only.** A `health` route, plus a stub service/repository returning `{ id, createdAt }` | `modules/<m>/service/index.ts` |
| shared | Problem-details errors, Pino logger, request context (AsyncLocalStorage), Prisma client with query metrics, OpenAPI registry, Resend email | `src/shared/**` |
| worker | Stub: logs nine scheduler names and does nothing | `src/settly-worker.ts` |

## 5. User roles

| Role | Where defined | Can do today | Confidence |
|---|---|---|---|
| Anonymous | — | Browse all public pages and public GET APIs | [code] |
| USER (buyer) | `Role` enum; Better Auth default role | Read/update own profile, register devices. **No buyer features exist yet.** | [code] |
| AGENT | `Role` enum | Create, edit and delete own listings; run the listing state machine; upload images; list own properties; upsert own agent profile | [code] |
| ADMIN | `Role` enum; admin plugin `adminRoles` | Everything AGENT can do (routes allow `AGENT, ADMIN`), plus approve/reject/suspend listings, verify agents and create amenities; Better Auth admin APIs (ban, impersonate) | [code] |

**How does someone become an AGENT?**
- **No code path grants the role [code].**
- The register page lets a user pick "Advisor", signs them up as `USER`, then calls
  `POST /me/agent-profile`, which requires the `AGENT` or `ADMIN` role. That call gets a 403,
  and the register page ignores the error.
- The only ways to become an agent are Better Auth's admin `setRole` API or seeding **[inferred]**.

Also:
- Agent **verification** (`AgentProfile.isVerified`) is a separate step, done by an admin
  **[code]**.
- **Ownership:** agents may only transition or edit listings where `agentId` = actor
  (`property.service.ts`). Admins bypass ownership on some transitions (`fallThrough`)
  **[code]**.

## 6. Database

**39 Prisma models** (4 Better Auth + 35 Settly), matching DOMAIN_MODEL.md's count **[code]**.
Migrations:
- `0_init` (1,111 lines of SQL);
- `session.impersonatedBy`;
- a `REJECTED` value added to `PropertyStatus`;
- `pg_stat_statements`;
- foreign-key indexes.

| Group | Models |
|---|---|
| Identity | `user`, `session`, `account`, `verification`, AgentProfile, UserDevice |
| Catalog | Property, PropertyImage, Amenity, PropertyAmenity, Area, PropertyPriceHistory |
| Engagement | Collection, CollectionItem, SavedSearch, SavedSearchMatch |
| Pipeline | Lead, AgentAvailability, Viewing, Offer, OfferRevision |
| Payments | Payment, PaymentAttempt, Refund, WebhookEvent, IdempotencyKey |
| Messaging / notifications | Conversation, Message, Notification |
| Knowledge / AI | Document, KnowledgeArticle, Embedding, AiConversation, AiMessage, AgentRun |
| Analytics / governance | PropertyViewEvent, SearchEvent, AuditLog, Report |

Database-level mechanisms present in `0_init` **[code]**:
- generated `searchVectorEn` and `searchVectorAr` (with an `ar_normalize()` function) and GIN
  indexes;
- a trigger that syncs `Property.location` (PostGIS) from latitude/longitude;
- `embedding vector(1536)` with HNSW indexes on Property and Embedding;
- a viewing **exclusion constraint** (btree_gist);
- a partial unique index: one RESERVED/COMPLETED offer per property;
- a partial unique index: one non-terminal payment attempt;
- an AuditLog immutability trigger;
- trigram indexes;
- unique keys for idempotency, webhook dedup, conversation, lead and collection items.

Discrepancies noted:
- `PropertyStatus` has **9** values, including `RENTED`; BUSINESS_RULES documents 8.
- Property has no `currency` column (Decision #6 proposed one). It also has no developer,
  project/compound, finishing, delivery-date, land-area or payment-plan fields, which the UI
  displays using invented defaults.
- `user.id` has no database default, and Better Auth is not configured for UUIDv7, so user ids
  may not be UUIDv7 **[inferred]**.
- `verification` rows hold the custom OTP in plain text.

## 7. APIs (implemented)

| Method and path | Auth | Purpose |
|---|---|---|
| `*` `/api/auth/*` | varies | Better Auth: sign-up/in/out, session, verify email, reset password, admin plugin, Google |
| GET `/health`, `/api/v1/health`, `/api/v1/<module>/health` | none | Liveness |
| POST `/api/v1/identity/verify-otp` | none | Consume a 6-digit email code and mark the email verified |
| GET `/api/v1/identity/agents`, `/agents/:id` | none | Public agent directory and profile |
| GET, PATCH `/api/v1/me` | session | Own profile |
| GET, POST `/api/v1/me/agent-profile` | AGENT/ADMIN | Own agent profile |
| POST, DELETE `/api/v1/me/devices` | session | Push-device registration (FCM token) |
| GET `/api/v1/me/properties` | AGENT/ADMIN | Own listings |
| GET `/api/v1/admin/agents`, `/:id`; POST `/:id/verify` | ADMIN | Agent verification |
| GET `/api/v1/areas`, `/:id`, `/:identifier/insights` | none | Area taxonomy and insights (insights partly fabricated) |
| GET `/api/v1/amenities`; POST | none / ADMIN | Amenity taxonomy |
| GET `/api/v1/properties`, `/:id`, `/slug/:slug` | none | Published listings (cursor `limit`) |
| POST `/api/v1/properties`; PATCH/DELETE `/:id` | AGENT/ADMIN | Create draft / edit (two-tier moderation) / hard-delete a never-published draft |
| POST `/api/v1/properties/:id/{submit,resubmit,archive,sell,mark-sold,relist}` | AGENT/ADMIN | Listing transitions |
| DELETE `/:id/images/:imageId`; PATCH `/:id/images/order` | AGENT/ADMIN | Image management |
| POST `/api/v1/admin/properties/:id/{approve,reject,suspend,unsuspend}` | ADMIN | Moderation |
| POST `/api/v1/uploads/authorize`, `/:assetId/complete` | session | Cloudinary signed upload |
| GET `/api/v1/catalog/compare?ids=` | none | 2–4 published properties side by side |
| GET `/api/v1/analytics/market-pulse` | none | **Hard-coded** FX, macro and corridor figures |
| WS `/ws/chat` | **none** | Accepts any connection; does nothing |

Not implemented anywhere: search (`/search/*`), viewings, offers, payments, webhooks, messaging,
notifications/SSE, favourites, saved searches, documents, AI, reports, audit-log viewer.

## 8. Integrations

| Service | Use today | Evidence |
|---|---|---|
| Resend | Verification and reset emails, sent inline in the request path (no queue, no retry) | `shared/email/resend.ts`, `identity/auth.ts` |
| Cloudinary | Signed direct upload + finalize; seed script uploads catalog images | `catalog/service/upload.service.ts`, `scripts/optimize-and-upload-images.ts` |
| Google OAuth | Enabled only if env vars are set; the register page has a "Google SSO" button | `identity/auth.ts` |
| MapTiler / CARTO | Map tiles loaded directly by the browser | `SearchMap.tsx`, `AreaRadarMap.tsx` |
| Paymob, Gemini, FCM, Redis/Upstash | **Not integrated** (env placeholders only) | `config/index.ts` |

## 9. Background processing

**None functional.**
- `settly-worker.ts` declares nine job names (payment reconciliation, deposit/offer/viewing/hold
  expiry, notification sweep, idempotency cleanup, session cleanup, matview refresh), but has
  no queue, scheduler or handlers **[code]**.
- Emails are sent synchronously during the auth request **[code]**.

## 10. Current features

| Feature | Status | Notes |
|---|---|---|
| Registration (buyer) | **Implemented** | Better Auth email + password |
| Registration (agent) | **Broken** | Role never becomes AGENT; the profile call is 403'd silently (§5) |
| Login / logout / session | Implemented | 30-day sliding session |
| Email verification | Implemented | Two mechanisms: Better Auth link **and** a custom 6-digit OTP |
| Password reset | Implemented | Better Auth |
| Google sign-in | Placeholder | Only when configured; not verified |
| Profile read/update | Implemented | — |
| Agent verification (admin) | Implemented | API only; no admin UI |
| Listing lifecycle (P1–P14) | **Partially implemented** | Transitions exist. Their side effects (notifications, embedding, saved-search matching, refunds) do not, because those systems don't exist. No agent UI |
| Two-tier edit moderation | Implemented | Tested over HTTP |
| Image upload (Cloudinary) | Implemented | API only; no UI |
| Public property list | Implemented | Basic list only: no filters, geo, or text/semantic search |
| Property detail page | **Partially implemented** | Real API data, padded with invented fields |
| Search page (filters + map) | **Partially implemented** | Loads up to 20 properties and filters them **in the browser** against hard-coded facets; developer is guessed from the title |
| Compare | Implemented | Now on TanStack Query |
| Areas directory | **Placeholder** | 4 hard-coded editorial cards; the API is only used for ids |
| Area detail | **Placeholder** | Hard-coded dossier registry; the insights API is partly fabricated |
| Market insights | **Placeholder** | Hard-coded datasets plus a hard-coded API |
| Agent directory / profile | **Partially implemented** | The directory uses the API with defaults; the profile page is fully hard-coded, including a fake scheduler |
| AI assistant widget | **Placeholder** | UI only |
| Buyer dashboard (9 screens) | Missing | Middleware protects routes that do not exist |
| Agent dashboard (7 screens) | Missing | — |
| Admin UI (4–5 screens) | Missing | — |
| Favourites, saved searches, viewings, offers, payments, messaging, notifications, documents, reports, audit viewer, AI, hybrid search | **Missing** | Tables exist; no services |
| Bilingual `/en` + `/ar` | Missing | English only; `dir="ltr"` is fixed |
| WebSocket chat | Placeholder | Unauthenticated no-op |
| Background jobs | Placeholder | — |

## 11. Business rules confirmed in code

**Constants** (`backend/src/config/index.ts`): deposit 5%, capped at 50,000 EGP · cooling-off
48 h · 20% retention · deposit deadline 72 h · offer TTL 7 d · checkout hold 15 min · viewing
grace 30 min · max 3 open viewing requests · max 25 saved searches · max 5 live offers ·
embedding `gemini-embedding-001` at 1536 dimensions. Only the listing rules below actually use
any of them today.

**Listing rules enforced** (`catalog/service/property.service.ts`):
- Submit or resubmit only from `DRAFT` or `REJECTED`; requires a **verified agent**, ≥3 images
  and required fields.
- Approve/reject only from `PENDING_REVIEW`; reject requires a reason.
- Editing a `PUBLISHED` listing: **structural** fields (title, type, intent, area, coordinates)
  send it back to `PENDING_REVIEW`; **price** changes write a price-history row.
- No agent edits while `SUSPENDED`; no edits once `SOLD` or `RENTED`.
- Archive only from `PUBLISHED`, and only with no `RESERVED` offer.
- Offline sale from `PUBLISHED`; confirm sale from `RESERVED`; fall-through (agent or admin).
- Hard delete only for never-published drafts.
- Transitions are compare-and-swap on the expected status, inside a transaction that also
  writes an AuditLog row.

**Auth rules:**
- A suspended (banned) user gets 403 `/errors/account-suspended` on any authenticated route.
- A `requireVerifiedEmail` guard exists, but nothing uses it yet.

**Compare:** 2–4 ids; only `PUBLISHED` listings; items returned in request order.

## 12. Risks and concerns

### Confirmed security issues

1. **Leaked secret.** `.github/workflows/ci.yml` contains `CLOUDINARY_API_KEY` and
   `CLOUDINARY_API_SECRET` in plain text, since commit `363f2ad` (2026-09-14). **The GitHub
   repository is publicly readable** (anonymous API 200). Anyone can use this key pair to
   upload to, or delete from, the Cloudinary account. It needs rotation, plus a move to
   GitHub Secrets.
2. **OTP brute force.** `POST /api/v1/identity/verify-otp` has **no rate limiting** (none
   exists anywhere in the API). With a 6-digit code (10⁶ possibilities) valid for 15 minutes,
   an attacker who knows an email address can verify that account.
3. **Weak, plaintext OTP.** The code is generated with `Math.random()` rather than a CSPRNG, and
   stored in plain text (V22 required hashed identifiers).
4. **Unauthenticated WebSocket.** `ws://…/ws/chat` accepts any connection. It is inert today,
   but it is an open resource surface.
5. **No abuse controls.** No rate limiting on login, reset, registration or uploads (Decision
   #12 is unimplemented). Better Auth's built-in limiter defaults to production-only
   **[inferred]**.
6. **Origins in every environment.** `trustedOrigins` lists 14 localhost origins in all
   environments, including production.

### Potential concerns

- **Sessions:** 30 days sliding with no absolute cap, versus the documented 7 d sliding and
  30 d absolute (V12).
- **Better Auth config gaps:** no UUIDv7 generator (V5), no Argon2id, no audit hooks (AUTH.md
  requirements).
- **Fabricated data:** market pulse, area insights, market insights, agent profile, and
  property-detail filler all present invented figures as real. A banner mitigates this, but
  the API itself returns fabricated numbers with no marking.
- **Frontend middleware** calls the backend on every protected navigation (FRONTEND.md says
  cookie presence only).
- **Emails sent in-request:** a Resend outage makes registration slow or failing, contradicting
  #10 ("every dependency except Postgres is non-critical").
- **Tests:** HTTP integration tests commit data to whatever database `.env` points at. There
  are no service-layer tests, which contradicts #41.

### Structural concerns

- **Competing plans.** `docs/SETTLY_MASTER_PLAN.md` + `docs/phases/*` (added 2026-09-17) call
  themselves the "single source of truth" and follow a different order (public marketing
  screens → portals → payments → AI) than the LOCKED `process/ROADMAP.md` vertical slice
  (auth → properties → search → detail → viewing request).
- **Product framing drift.** Newer docs describe an "institutional-grade luxury … escrow"
  product; OVERVIEW.md lists escrow as out of scope.
- **Stale documents.** `AI_AGENT_RULES.md`, `README.md` and `ROADMAP.md` still say "zero
  application code".
- **Routing inconsistencies.** Dashboard paths disagree: `/buyer`, `/agent`, `/admin`
  (middleware); `/agent-dashboard/overview` and `/buyer-dashboard/overview` (register
  redirect); `/dashboard/*` (FRONTEND.md).
- **Map library.** Leaflet is used; MapLibre is locked (proposal P1 in DECISIONS.md).
