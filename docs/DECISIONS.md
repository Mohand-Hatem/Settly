# Settly Decision Record

    Status:       LOCKED (entries #0–#31) · living document
    Last Updated: 2026-09-17
    Decisions:    all
    Related:      README.md, GLOSSARY.md, product/BUSINESS_RULES.md

Append-oriented history of every architectural, product and process decision.

**Entries are never edited except to mark them superseded.** Topic documents describe the
*current* state; this document explains *why* it is that way, and what was rejected.

**Size note:** this file is the one deliberate exception to the ~400–500 line guideline
(Decision #30). Sections 1–3 are designed to be scannable without reading section 4.

---

## 1. Current decision summary

| # | Category | Decision | Status |
|---|---|---|---|
| 0 | Process | Data platform decided before frontend; payment object treated as product scope | LOCKED |
| 1 | Product | **Package B** — discovery → viewing → offer → reservation deposit. Sale-first; rent is discovery/viewing only; independent agents, no agency entity | LOCKED · **agent subscriptions: superseded in part by #79/#80** |
| 2 | Product | Market **Egypt**, currency **EGP** | LOCKED · **agent subscription base prices are USD (#89)**; real-estate amounts stay EGP |
| 3 | Domain | 8 core journeys; 36 models in 8 modules | **AMENDED by #39** |
| 4 | Product | ~~English-only UI~~ -> **full bilingual UI (/en + /ar) with RTL** | **REVERSED by #39** · **V1 UI English-only again by #99** (Arabic/RTL deferred) |
| 5 | Domain | Four lifecycle state machines: Property 8 · Viewing 8 · Offer 10 · Payment 7 states | LOCKED · **Property amended to 9 states by #78; `RENTED` non-terminal by #81; `PUBLISHED → SOLD` escape hatch removed by #102** |
| 6 | Data | **PostgreSQL 17** + PostGIS + pgvector + pg_trgm + FTS | **AMENDED by #39** (FTS) |
| 7 | Data | **Prisma** ORM; custom SQL for PostGIS / pgvector / exclusion constraints / hybrid ranking | LOCKED |
| 8 | Backend | Separate API + frontend; **Express 5** + Node 22 LTS + TS; 11 modules; REST `/api/v1`; Zod | LOCKED · **extended by #40** |
| 9 | Auth | **Better Auth** owns authentication and sessions; Settly owns all authorization | LOCKED |
| 10 | Reliability | READ COMMITTED + conditional updates; constraints over locks; Redis for BullMQ + rate limiting only | LOCKED |
| 11 | Reliability | **15-minute exclusive checkout hold**; deposit remains the commitment point *(amends #5)* | LOCKED |
| 12 | Reliability | Three-tier rate-limit degradation; sensitive endpoints never lose shared protection | LOCKED |
| 13 | Payments | **Paymob**, hosted redirect checkout; synchronous methods only in v1 | LOCKED · **refined by #42** |
| 14 | Search | Three execution paths; hard constraints always structured; RRF fusion | LOCKED · **refined by #40** (HTTP projection) |
| 15 | Search | ~~Canonical English description~~ | ❌ **REVERSED by #39** |
| 16 | Data | **`SearchEvent`** added as model #37 | LOCKED |
| 17 | AI | Two-tier models; AI SDK orchestration; RAG scope; tool boundary; recommendations | LOCKED |
| 18 | Process | **Separate projects**, one repo; OpenAPI as the contract | LOCKED |
| 19 | AI | Exactly one bounded, read-only **Property Shortlist Agent** | LOCKED · **generalised by #41** |
| 20 | Data | **`AgentRun`** added as model #38 | LOCKED |
| 21 | Frontend | Next.js App Router; SEO server-rendered, dashboards CSR; SSE realtime | **AMENDED by #39** (RTL) & **#43** (WebSocket chat) · **maps superseded by #96** (Leaflet) · **RTL deferred for V1 by #99** |
| 22 | Infra | Vercel + Railway (2 services) + Supabase; backend must be always-on | LOCKED · **refined by #44** |
| 23 | Frontend | Five distinct rendering modes; only `/properties` is SSR | **AMENDED by #39** (locales) · **no locale segment in V1 (#99)** |
| 24 | AI | **Google Gemini** primary ecosystem; **no reranker in v1** *(amends #17)* | LOCKED · strengthened by #39 |
| 25 | Storage | Cloudinary = public images; **Supabase Storage = private RAG documents** | LOCKED |
| 26 | Reliability | Redis caching narrowed to the hybrid-search result list only *(clarifies #10)* | LOCKED · **refined by #44** |
| 27 | Process | Seed data + retrieval evaluation as one first-class deliverable, with a pre-committed gate | LOCKED · **extended by #39** · **Arabic/cross-language parts deferred for V1 by #99** |
| 28 | Product | Admin scope reduced; no analytics dashboards in v1 | LOCKED |
| 29 | Process | Reduce scope by **sequencing**, never by weakening architecture | LOCKED |
| 30 | Process | Three-tier documentation lifecycle | LOCKED |
| 31 | Process | Business constants have a single authoritative code definition | LOCKED |
| 32 | Process | Pre-committed retrieval evaluation thresholds *(part of #27)* | LOCKED · **V1 gate = English rows only (#99)** |
| 33 | Security | Security & operations model — layered, proportionate, no security theater | LOCKED · **refined by #42** |
| 34 | Ops | **Pino** for all logging — Morgan and Winston removed | LOCKED |
| 35 | Domain | Email-verification guards + invariants **I11** and **I12** *(amends #5)* | LOCKED |
| 36 | Ops | Email provider: **Resend** (all environments, Mailpit eliminated) | **LOCKED by #44** *(was provisional)* |
| 37 | Process | Local-vs-production environment model + the substitution rule | LOCKED · **refined by #44** |
| 38 | Domain | **The verification boundary** — a principle replacing the guard list; adds O3 and O5 *(amends #35)* | LOCKED |
| 39 | Domain | **Domain model reconciliation** — Better Auth identity, document visibility, multilingual content. **39 tables** | LOCKED · **refined by #42** · **language scope (§3 Arabic content, §5 Arabic FTS, §6 cross-language, §8 UI locale/RTL/AI language) deferred for V1 by #99** |
| 40 | API | **API contract shape** — bare resources, action endpoints, error taxonomy, cursor contract | LOCKED |
| 41 | Testing | **Testing architecture** — six layers, real Postgres/Redis, gates vs reports | LOCKED |
| 42 | Privacy | **Privacy, retention & data lifecycle** — deletion model, retention windows, AI boundary | LOCKED |
| 43 | Communication | **Real-time communication** — native **WebSocket** for 1-on-1 Chat, **SSE** for In-app notifications *(amends #21)* | LOCKED |
| 44 | Infra | **Managed services** — **Upstash Redis** (BullMQ, rate limit, cache, WS pub/sub) & **Resend** (real email) *(locks #36)* | LOCKED |
| 45 | Product | **Positioning:** the whole Egyptian residential market, with a premium brand feel (not a luxury-only marketplace) | LOCKED (discovery 2026-09-17) |
| 46 | Product | **Project stage:** demo first, designed production-ready and launchable later | LOCKED (discovery 2026-09-17) |
| 47 | Product | **V1 listing scope:** sale = **resale only**; rentals = discovery + viewing only; **off-plan deferred** to future scope. Reservation deposit (Paymob **sandbox**) for resale only; no rental payments. Refines #1, #13 | LOCKED (discovery 2026-09-17) |
| 48 | Process | **Authoritative plan:** `process/ROADMAP.md` + `IMPLEMENTATION_PLAN.md` define V1; `SETTLY_MASTER_PLAN.md` and `phases/*` do not override them | LOCKED (discovery 2026-09-17) |
| 49 | Identity | **Agent onboarding:** everyone signs up as a buyer; becoming an agent = an application with **identity verification (National ID + selfie)** and **professional verification**, approved by an admin | LOCKED (discovery 2026-09-17) · details open |
| 50 | Identity | **Dual capability:** one account can be buyer and agent. An agent may buy, but **never make offers on their own listings** | LOCKED (discovery 2026-09-17) |
| 51 | Product | **Listing creation:** verified agents only in V1; owner (FSBO) listings are future scope. Confirms #1 | LOCKED (discovery 2026-09-17) |
| 52 | Governance | **Verification revocation:** an admin may revoke an agent's verification; the agent's listings become **SUSPENDED** and hidden from the public marketplace | LOCKED (discovery 2026-09-17) · cascade details open |
| 53 | Identity | **Phone number:** collected for all users; **not verified** in V1 (no SMS/WhatsApp cost) | LOCKED (discovery 2026-09-17) |
| 54 | Product | **Resale includes under-construction units**, with expected delivery date and remaining instalments when applicable. Amends #47 | LOCKED (discovery 2026-09-17) · price semantics open |
| 55 | Identity | **Professional proof:** any admin-reviewable proof is accepted (broker/license document, employment or authorization letter, commercial registration/tax document, other) | LOCKED (discovery 2026-09-17) |
| 56 | Identity | **Identity check:** an admin manually compares National ID and selfie; no paid KYC provider in V1 | LOCKED (discovery 2026-09-17) |
| 57 | Identity | **Rejection:** a reason is mandatory; the applicant may re-apply; ID/selfie retention period to be set after legal review (V35) | LOCKED (discovery 2026-09-17) · period open |
| 58 | Governance | **Revocation cascade:** every listing except `SOLD` is suspended; `RESERVED` listings go to admin review (no automatic refund); open offers and viewings are frozen; after re-verification, listings need admin review before going live. Amends #52 and BUSINESS_RULES §7 for this case | LOCKED (discovery 2026-09-17) · state-machine design open |
| 59 | Identity | **Self-dealing and admin scope:** on their own listings an agent may not offer, request viewings, message as a buyer or be named in an offline offer. **Admins may buy as buyers but may not create listings.** Amends #50 | LOCKED (discovery 2026-09-17) |
| 60 | Identity | **Phone rules:** required at sign-up; international numbers allowed; a buyer's phone is visible to the agent **only after an offer**; an agent's phone is **never public**. Amends #53 | LOCKED (discovery 2026-09-17) |
| 61 | Product | **Under-construction price:** `price` = amount paid to the seller; remaining instalments are separate; the 5% deposit (cap 50,000 EGP) is computed on `price` only. Amends #54, confirms #13 | LOCKED (discovery 2026-09-17) |
| 62 | Governance | **Frozen items:** buyers may withdraw offers or cancel viewings during a revocation freeze, **without penalty**. Consistent with BUSINESS_RULES §9.1 | LOCKED (discovery 2026-09-17) |
| 63 | Reliability | **Expiry clocks pause while frozen** and resume with the remaining time | LOCKED (discovery 2026-09-17) |
| 64 | Governance | **Reserved listing under revocation review:** admin decides within **5 business days**; buyer withdrawal during review = **100% refund**; outcomes = **release** the reservation or **cancel with full refund** | LOCKED (discovery 2026-09-17) · missed-deadline behaviour open |
| 65 | Governance | **After re-verification:** listings that were `DRAFT`/`ARCHIVED` return to their previous state; listings that were `PUBLISHED`/`RESERVED` need admin review before becoming active | LOCKED (discovery 2026-09-17) · `PENDING_REVIEW`/`REJECTED` open |
| 66 | Privacy | **Phone visibility:** the agent loses access to a buyer's phone when that offer is withdrawn, rejected or expires; buyers never see agent phones; admins may view phones for support/moderation, **audited** | LOCKED (discovery 2026-09-17) |
| 67 | Governance | **Conflict of interest:** an admin may not review, approve, suspend or verify a case they are personally involved in; another admin must handle it | LOCKED (discovery 2026-09-17) · definition of "involved" open |
| 68 | Product | **Remaining instalments** are stored as total remaining amount, number of instalments, frequency and end date | LOCKED (discovery 2026-09-17) · frequency values open |
| 69 | Governance | **Revocation details:** after re-verification `PENDING_REVIEW` returns to the queue and `REJECTED` stays rejected; a missed 5-day review **auto-cancels with 100% refund**; a reservation can be released **only after re-verification** | LOCKED (discovery 2026-09-17) |
| 70 | Governance | **Business days:** Sunday–Thursday, excluding Egyptian public holidays maintained by admins | LOCKED (discovery 2026-09-17) |
| 71 | Governance | **"Personally involved"** = the admin has an offer, viewing or conversation on the listing or with that agent; another admin handles it; the demo is seeded with two admins | LOCKED (discovery 2026-09-17) |
| 72 | Privacy | **Phone access lifecycle:** agent-recorded offers (O1b) grant access like buyer offers; access lasts while the offer is pending, accepted, reserved or completed and ends on withdrawal, rejection, expiry or cancellation | LOCKED (discovery 2026-09-17) |
| 73 | Product | **Instalment frequency:** monthly, quarterly, semi-annual or annual; all instalment fields are required whenever a remaining amount exists | LOCKED (discovery 2026-09-17) |
| 74 | Identity | **Agent applications:** no waiting period to re-apply; at most **one pending application** per user | LOCKED (discovery 2026-09-17) |
| 75 | Product | **Leads:** any first real contact (message, viewing request or offer) creates the buyer–listing lead | LOCKED (discovery 2026-09-17) |
| 76 | Payments | **Deposit is credited toward the sale price** and deducted from the final amount | LOCKED (discovery 2026-09-17) |
| 77 | Product | **Sale completion:** `RESERVED` → `SOLD` needs confirmation from **both buyer and agent**; after **30 days** without completion the listing goes to admin review; the admin may request evidence, which is not mandatory for every sale. Amends P9 | LOCKED (discovery 2026-09-17) |
| 78 | Product | **`RENTED` is an official listing state:** the agent moves a rental listing to `RENTED` when it is rented. Amends #5 (Property 8 → 9 states) | LOCKED (discovery 2026-09-17) · RENTED exits open |
| 79 | Product | **Revenue model:** two streams — **transaction revenue** from successful sales (fee and payout rules TBD) and an **agent listing subscription**. Supersedes in part #1 | LOCKED (discovery 2026-09-17) · amounts TBD |
| 80 | Product | **Agent listing subscription:** **exactly 3 plans** — **Free** (2 new listings/month), **Pro** (4), **Enterprise** (8). Quota counts listings created/published in the billing month; deleting, selling, suspending or archiving never restores it; resets at the next billing month. Prices set by #89 ($0 / $20 / $50, USD) | LOCKED (discovery 2026-09-17) · rules resolved by #85–#95 |
| 81 | Product | **RENTED is not terminal:** relisting goes through `DRAFT → PENDING_REVIEW → PUBLISHED` as a new, reviewable listing lifecycle; rental history is preserved; never `RENTED → PUBLISHED`. Revocation applies to `RENTED` listings. Amends #78 | LOCKED (discovery 2026-09-17) |
| 82 | Product | **Sale review outcomes:** at 30 days without both confirmations the case enters admin review automatically; the admin may **confirm SOLD**, **declare fell-through** (refund/cancellation rules apply) or **extend** with a justified reason. **A buyer–agent disagreement goes to admin review**, never resolved automatically. Conflict-of-interest rules apply. Refines #77 | LOCKED (discovery 2026-09-17) |
| 83 | Product | **Lead pipeline (hybrid):** `NEW → CONTACTED → QUALIFIED → WON / LOST`; clear system events advance leads automatically (a completed sale → `WON`); agents may update stages manually and set `LOST`. Refines #75 | LOCKED (discovery 2026-09-17) |
| 84 | Payments | **Late-withdrawal retention goes to the seller:** the 20% retained when a buyer withdraws after the 48-hour cooling-off goes **100% to the seller**; it is **not Settly revenue** and **not paid to the agent**. Resolves the TBD in #76/#79 | LOCKED (discovery 2026-09-17) |
| 85 | Product | **Relisting consumes quota:** each relisting (P14 `ARCHIVED → DRAFT`, P16 `RENTED` relist) uses **1 listing** from the agent's current monthly plan quota, still follows `DRAFT → PENDING_REVIEW → PUBLISHED`, and can never bypass the monthly limit. Resolves part of #80/#81 | LOCKED (discovery 2026-09-17) |
| 86 | Product | **Quota is consumed at first publication:** a listing uses quota when it is **first published**; drafts, submissions and rejected listings never consume it; once consumed it is never restored (sold, rented, suspended, archived or deleted); relistings follow the same rule. Resolves the consumption point left open in #80/#85 | LOCKED (discovery 2026-09-17) |
| 87 | Product | **Exhausted quota blocks publication:** an admin approval must not publish a listing when the agent's quota is used up; the listing **stays `PENDING_REVIEW`** until quota is available after the billing-month reset; the limit is enforced **atomically** so concurrent approvals cannot exceed it (invariant I13) | LOCKED (discovery 2026-09-17) |
| 88 | Product | **Billing month = calendar month (Cairo time)**; quota resets on the 1st for every agent. ~~A paid plan started mid-month has a first period ending at month end, with a **prorated** first payment~~ **(S2 superseded by #104: every paid period is 30 days from its start, full price)** (S1, S2) | LOCKED (discovery 2026-09-17) · S2 superseded by #104 |
| 89 | Product | **Plan pricing (amended 2026-09-17):** **Free $0 · Pro $20 · Enterprise $50 per month**, billed per **30-day period** (#104; no annual option); **base prices in USD** (canonical). Real-estate amounts stay EGP (S3). *Currency display and charging: see #103* | LOCKED (discovery 2026-09-17) · amended by #103 |
| 90 | Payments | **Subscription payment:** Paymob **hosted checkout for each 30-day period (#104)**; no saved card, no automatic renewal in V1; **simple receipt only**; VAT/e-invoicing checked before launch (V36) (S4, S5) | LOCKED (discovery 2026-09-17) |
| 91 | Product | **Expiry, downgrade, cancellation:** unrenewed or failed paid plan → **Free immediately on the expiry date** (no grace period); published listings stay live after a downgrade; cancel any time, plan runs to the end of the paid period, **no refund** (S6–S8) | LOCKED (discovery 2026-09-17) |
| 92 | Product | **Plan changes:** a **mid-period upgrade** is **immediate**; quota = new plan quota − publications already consumed this month; the agent pays the **full price of the new plan** and a **new 30-day billing period starts at the upgrade time** (no proration, #104). Downgrade takes effect **when the current paid period ends** (S9–S11) | LOCKED (discovery 2026-09-17) · period rules amended by #104 |
| 93 | Product | **Starting plan and verification:** a newly verified agent starts on **Free** (no trial); revocation does **not** pause or cancel the subscription; listings returning to review after re-verification **keep their original queue position** (S12–S14) | LOCKED (discovery 2026-09-17) |
| 94 | Product | **Listings waiting for quota:** admins review them anyway; approved content stays `PENDING_REVIEW` as **Approved, Waiting for Quota** and **publishes automatically, oldest approval first (FIFO)**, whenever quota becomes available (reset, upgrade, other approved increase); an edit invalidates the approval; no cap on waiting listings; agents see remaining quota, a submission warning and a publication notification (S15–S20) | LOCKED (discovery 2026-09-17) |
| 95 | Reliability | **Quota enforcement:** reuse the **existing per-user advisory lock**, keyed on the listing's agent, in the approval/publication operation (invariant I13); **no new counter model**; the submission-time check is **warning-only** (S21, S22). Accepts P6 | LOCKED (discovery 2026-09-17) |
| 96 | Frontend | **Maps:** **Leaflet** is the approved V1 map library (no MapLibre migration); **MapTiler** is the tile provider everywhere (area pages move off CARTO); the MapTiler key moves to `NEXT_PUBLIC_MAPTILER_KEY` and is **domain-restricted** in the MapTiler dashboard (S23–S25). Accepts P1 option (b); supersedes the map part of #21 | LOCKED (discovery 2026-09-17) |
| 97 | Identity | **Role model:** one role per account — `USER` = buyer · `AGENT` = buyer + agent (after verification) · `ADMIN` = buyer + admin, no agent/listing powers; same login for all applicable portals (Buyer / Agent / Admin) with a switcher; **admins created only by seed or a controlled CLI/script**, no in-app promotion in V1 (S26–S28). Accepts P5 option (a) | LOCKED (discovery 2026-09-17) |
| 98 | Security | **Cloudinary secret remediation:** the exposed secret has been **rotated**; plaintext credentials are removed from `ci.yml` in favour of **GitHub Actions secrets**; **git history is not rewritten** (S29–S31) | LOCKED (discovery 2026-09-17) |
| 99 | Product / Frontend | **English-only V1, end to end:** UI, listing and editorial content, search, AI answers and system messages are **English only**; no `/ar/*` routes, no `/[locale]` segment, no RTL and no `dir="auto"` for Arabic in V1; **Arabic content, Arabic search, Arabic AI answers and Arabic/RTL are a Future / Optional Feature** after core completion. Defers for V1 the language parts of #39 §3/§5/§6/§8 and the Arabic/cross-language parts of #27/#32; V3, V23–V27 deferred | LOCKED (2026-09-17, amended same day) · Arabic schema/API fields: separate data-model decision OPEN |
| 100 | Frontend | **Portal route prefixes:** Buyer **`/buyer/*`** · Agent **`/agent/*`** · Admin **`/admin/*`**; `/dashboard/*` and `/buyer-dashboard/*` are not canonical. Existing code mismatches (auth redirects, navbar landing links, middleware agent redirect) are implementation follow-ups. Refines #97 | LOCKED (2026-09-17) · code not yet aligned |
| 101 | Data / API | **Arabic data fields in V1:** existing Arabic columns, API fields and `ar_normalize` are **kept for future compatibility but unused in V1**; Arabic fields required only for Arabic support become **nullable** (`Area.nameAr`, `Amenity.nameAr`, `KnowledgeArticle.titleAr`/`bodyAr`); **no placeholder Arabic data**; V1 flows, search, RAG and AI use English only. Resolves the data-model point of #99 | LOCKED (2026-09-17) · **implementation pending** (F1–F9) |
| 102 | Product | **No agent-only SOLD:** a listing becomes `SOLD` only via accepted offer → deposit paid → cooling-off / sale process → **buyer + agent confirmation** → sale completed; admin review per #82 when P9a applies. **P11 removed**; O13 happens only with P9; O12 loses the offline-sale trigger; no new state. Accepts P7; #77 stays the governing rule | LOCKED (2026-09-17) · code follow-ups pending (`offline-sale`, `mark-sold`) |
| 103 | Payments | **Subscription charge currency:** plans UI shows **USD only** (no toggle); payment charged in **EGP** at a **fixed V1 rate of 1 USD = 48.98 EGP** (not live, never auto-refreshed), **rounded up to a whole EGP** — Pro **980 EGP**, Enterprise **2,449 EGP** (always the full price, #104); the exact EGP amount is shown before the Paymob redirect; receipt shows EGP charged plus the USD reference and rate. Supersedes the #89 toggle and FX open items; the live-rate proposal (S158–S160) was withdrawn | LOCKED (2026-09-17) · Paymob confirmation (V37) and legal review (V36) pending |
| 104 | Product / Payments | **Subscription periods:** every paid period (first subscription, re-subscription, upgrade, renewal) lasts **30 full days from its start time** at the **full plan price** — **no proration, no credit**; an upgrade starts a new 30-day period immediately; a downgrade applies when the current period ends. **The listing quota stays on the Cairo calendar month (reset on the 1st)**; the two cycles are never merged. Supersedes #88 S2; proration questions S161–S162 withdrawn | LOCKED (2026-09-17) · amended same day: early renewal stacks after the current period (last 7 days only, one queued period, no upgrade while queued); a period is exactly 720 hours from start (UTC) |
| 105 | Data / Payments | **Subscription payment data model:** four new tables (`AgentSubscription`, `SubscriptionPeriod`, `SubscriptionPayment`, `SubscriptionPaymentAttempt`); deposit `Payment` untouched; `WebhookEvent`, idempotency, audit, provider port and advisory lock reused. Effective plan computed from the active period (else Free). No-overlap, one-queued-period and one-open-checkout constraints; USD cents + EGP piastres + fixed-rate snapshot. Paid downgrade = queued period; cancel keeps a paid queued period; 60-minute checkout; unapplicable success → admin review + manual refund | LOCKED (2026-09-17) · design only, implementation pending |
| 106 | Product / Frontend | **Slice 1 defaults:** a viewing lasts **60 minutes** (availability split into 60-minute slots); requests up to **30 days ahead**; dashboards at `/buyer`, `/agent`, `/admin`; Google phone step at `/complete-profile`; unbuilt actions are not rendered; slice-1 agents/listings are seeded. Confirms: email verification by **link only** (#9), sessions **7 d sliding / 30 d absolute** (V12) | LOCKED (2026-09-17) |

**Model count: 39 tables — 4 Better Auth-managed, 35 Settly-owned (#39).**
**No application code exists yet.**
**✅ ARCHITECTURE CLOSED at #44.** Next phase: Tier-B Documentation.
**Current phase: local development only — no deployment exists.**

---

## 2. Pending verification checklist

Active checklist, not notes. Nothing here may be implemented as though final.
Lifecycle: `PENDING VERIFICATION → Verified → Decision updated → Related docs updated`.

| # | Item | Blocks | Status |
|---|---|---|---|
| V1 | Gemini embedding model: **`gemini-embedding-001`** (native 3072 dims; MRL `outputDimensionality: 1536`; mandatory post-truncation $L_2$ re-normalization; \$0.15/1M tokens; `text-embedding-004` deprecated/404) | **First migration** — it is a schema decision | ✅ **Verified** (2026-09-14) |
| V2 | pgvector on Supabase: v0.7.0+; HNSW ceiling is 2,000 dims for standard `vector`; `vector(1536)` fits natively with `vector_cosine_ops`; `halfvec` (float16) verified up to 4,000 dims as 3072 fallback | First migration | ✅ **Verified** (2026-09-14) |
| V3 | **Arabic retrieval quality** against the evaluation set and the thresholds in §Decision 27 | The entire bilingual search design (#14, #15) | ⏸ **Deferred by #99** — no Arabic search in V1 |
| V4 | Paymob: HMAC field list and ordering, partial-refund availability on the account tier, current fee schedule | Webhook verification (#13) | ☐ Open |
| V5 | Better Auth: `bearer` plugin built-in; `advanced.database.generateId` overrides IDs with UUIDv7 cleanly for all models (`user`, `session`, `account`, `verification`); Expo plugin not required for web | First auth migration (#9) | ✅ **Verified** (2026-09-14) |
| V6 | Prisma over Neon's PgBouncer pooler: Neon supports protocol-level prepared statements (`max_prepared_statements`); removing `pgbouncer=true` eliminates 4–5 round trips and repeated `DEALLOCATE ALL`, reducing statement latency from ~494ms to ~85ms | Connection configuration | ✅ **Verified** (2026-09-16) |
| V7 | Next.js fetch-caching semantics for the installed major version | ISR behaviour (#23) | ☐ Open |
| V8 | Supabase tier before the public demo — free-tier inactivity suspension | Demo reliability (#22) | ☐ Open |
| V9 | Gemini data-use terms if real user content ever reaches a prompt | Privacy posture (#24) | ☐ Open |
| V10 | Partial Prerendering stability, only if used on `/` | Optional (#23) | ☐ Open |
| V11 | **`btree_gist` availability and version on Supabase** — a *fifth* required extension, needed by the viewing exclusion constraint. Trivially available in the local Docker image | Deployment (#33) | ☐ Open |
| V12 | Better Auth session lifetime: sliding expiry supported natively (`session.expiresIn = 7d`, `session.updateAge = 1d`); absolute 30-day cap enforced by clamping `expiresAt` against immutable `session.createdAt` | Session config (#33) | ✅ **Verified** (2026-09-14) |
| V13 | **Vercel stable preview-domain aliasing** for the CORS allowlist. ⚠️ Regex-matching `*.vercel.app` would let any Vercel deployment make credentialed requests | Deployment (#33) | ☐ Open |
| V14 | **Sentry Crons** capability and free-tier quota — the primary replacement for a metrics stack | Deployment (#33) | ☐ Open |
| V15 | Supabase Storage signed-URL expiry and single-use semantics | Deployment (#33) | ☐ Open |
| V16 | **Cloudinary signed upload preset constraints** — needed *now*, since Cloudinary is real in local development | Current (#33) | ☐ Open |
| V17 | Railway healthcheck path and restart configuration | Deployment (#33) | ☐ Open |
| V18 | **Resend** — domain verification, SPF/DKIM/DMARC, pricing, free-tier limits, bounce/complaint webhooks, React Email compatibility | Production email (#36) | ☐ Open |
| V19 | Better Auth `additionalFields` — supported types, **specifically JSON/object support** for notification preferences | Where preferences live (#39) | ☐ Open |
| V20 | Better Auth admin plugin: exact columns are `role` (mapped to native PG `Role` enum `USER`/`AGENT`/`ADMIN`), `banned` (bool), `banReason` (text), `banExpires` (timestamp); immediate ban block verified | **First migration** (#39) | ✅ **Verified** (2026-09-14) |
| V21 | Better Auth Prisma coexistence: CLI generation risks overwriting custom relations; resolution is maintaining Better Auth models explicitly in Settly's primary `schema.prisma` via `prismaAdapter` | **Migration workflow** (#39) | ✅ **Verified** (2026-09-14) |
| V22 | Better Auth token hashing: default stores plaintext tokens; mandatory `verification: { storeIdentifier: "hashed" }` verified to store SHA-256 digests in `verification.identifier` at rest | Security posture (#39) | ✅ **Verified** (2026-09-14) |
| **V23** ⭐ | **Gemini AR↔EN cross-lingual retrieval quality specifically** — not merely "handles Arabic". With canonical English removed, the model is *solely* responsible for cross-language retrieval | **The entire retrieval design** (#39) | ⏸ **Deferred by #99** — no cross-language retrieval in V1 |
| **V24** ⭐ | **Arabic normalisation function** validated against the evaluation set — measure recall with and without | Arabic FTS quality (#39) | ⏸ **Deferred by #99** |
| V25 | Next.js App Router i18n routing and its interaction with ISR + `generateStaticParams` across locales | Rendering (#39) | ⏸ **Deferred by #99** — not needed in V1 (no locale segment) |
| V26 | RTL maturity of shadcn/Radix, **Leaflet** map controls (MapLibre until #96) and Arabic tile labels, Recharts axis orientation | Frontend components (#39) | ⏸ **Deferred by #99** — no RTL in V1 |
| V27 | Numeral convention for the Arabic UI — Western (`123`) vs Arabic-Indic (`١٢٣`). **Explicitly NOT an architectural blocker** — a product/design decision during Stitch | Design (#39) | ☐ Deferred (no Arabic UI in V1, #99) |
| **V28** ⭐ | **Zod → OpenAPI generator capability**: `@asteasolutions/zod-to-openapi` (v7 for Zod 3) empirically verified (`backend/test/spikes/v28-openapi.test.mjs`). Correctly expresses discriminated unions, `application/problem+json` oneOf error schemas, required header parameters (`idempotency-key`), and `text/event-stream` SSE endpoints | **The whole contract workflow** (#40) | ✅ **Verified** (2026-09-14) |
| V29 | `openapi-typescript` / `openapi-fetch` handling of `application/problem+json` — does the generated client surface non-2xx bodies as a typed error union? | Frontend error handling (#40) | ☐ Open |
| **V30** ⚠️ | **Express 5 + SSE vs compression middleware**: Empirically verified (`backend/test/spikes/v30-sse.test.mjs`) that Express 5 streams SSE chunks immediately without buffering. Compression middleware is explicitly omitted from streaming routes | SSE contract (#40) | ✅ **Verified** (2026-09-14) |
| V31 | Better Auth mount-prefix flexibility: In Express 5 (`path-to-regexp` v8), mounting Better Auth via `app.use('/api/auth', toNodeHandler(auth))` correctly handles all subroutes without `path-to-regexp` wildcard errors, isolating library auth routes from `/api/v1/*` | Auth surface (#40) | ✅ **Verified** (2026-09-14) |
| V32 | GitHub Actions CI Postgres with **PostGIS + pgvector + pg_trgm + btree_gist**: Stock `postgres` image lacks PostGIS and pgvector. Running `docker compose up -d postgres redis` on GitHub Actions runners builds `docker/Dockerfile.postgres` (`postgis/postgis:16-3.4` + `postgresql-16-pgvector`) and initializes all 5 extensions via `init-db.sql` in ~8s, providing 100% dev/CI parity without external registry rate limits or supply-chain drift | **CI setup** (#41) | ✅ **Verified** (2026-09-14) |
| **V33** ⭐ | Prisma migrate custom triggers & rules: hand-written SQL migrations (AuditLog append-only trigger, Viewing exclusion constraints, custom tsvector expressions) persist untouched across subsequent migrations; Prisma migrate diffs only schema-defined objects and does not drop unmanaged triggers or rules | **First migration** (#41, #42) | ✅ **Verified** (2026-09-14) |
| **V34** | **Legal/regulatory feasibility of Settly collecting reservation deposits on behalf of sellers** (CBE payment rules, Paymob merchant terms, who holds funds, payout timing, dispute handling). Not needed for the sandbox demo | **Real launch only** (#46, #47) | ☐ Open |
| **V35** | **Egypt Personal Data Protection Law (151/2020) obligations for KYC data**: National ID numbers/images and selfies (lawful basis, consent wording, retention limits, storage region, registration/licensing duties) | **Before collecting real identity documents** (#49); the demo uses test documents only | ☐ Open |
| **V37** | **Paymob acceptance of Settly-computed EGP subscription amounts** (980 / 2,449 EGP, no Paymob-side conversion) (#103). **Portfolio/demo scope (#46):** verified by the Paymob **sandbox** test during implementation; written confirmation from Paymob is needed **only before a real launch** | **Real launch only** (sandbox test during implementation) | ☐ Open |
| **V36** | **Egyptian VAT and e-invoicing obligations for agent subscription payments** (and any other Settly revenue): whether invoices are required, VAT treatment, e-invoicing registration | **Real launch only** (#90); also covers showing USD plan prices while charging EGP (Law 194/2020, #103); V1 issues a simple receipt | ☐ Open |

### 2.1 When each item actually blocks

| When | Items |
|---|---|
| **Before the first migration** | V1 · V2 · V5 · V12 · **V20 · V21 · V22 · V33** |
| **Before the first endpoint** | **V28 · V30 · V31** |
| **Before CI is wired** | **V32** |
| **Now, as Cloudinary is wired** | V16 |
| **Before the seed / AI phase** | *(V3, V23, V24 deferred by #99 — English-only V1)* |
| **Before payment work is complete** | V4 and V37 (both checked with a Paymob **sandbox** test) |
| **During frontend work** | V7 · **V29** |
| **Before deployment only** | V8 · V9 · V10 · V11 · V13 · V14 · V15 · V17 · V18 |
| **Before a real (non-demo) launch** | **V34** · **V35** · **V36** · **V37** (written Paymob confirmation) |

Four items gate the first migration. Everything else waits for the phase that needs it.

**An implementation must never silently settle a pending item.** Verify against current
documentation or an integration test, update the decision, update the affected documents, then
implement. **"It sounds plausible" is not verification.**

---

## 3. Decision index

- **Product & domain:** #1, #2, #3, #4, #5, #28, **#35, #38, #39**, **#45–#47, #49–#62, #64–#83, #97, #102**
- **API contract:** **#40**
- **Testing:** **#41**
- **Privacy & retention:** **#42**
- **Data & persistence:** #6, #7, #16, #20, #25, **#101, #105**
- **Backend & auth:** #8, #9
- **Reliability & concurrency:** #10, #11, #12, #26, **#63**
- **Payments & revenue:** #13, **#76, #79, #80, #84, #85, #86, #87, #88–#95, #103, #104, #105**
- **Search & AI:** #14, #15, #17, #19, #24
- **Frontend:** #21, #23, **#96, #99, #100, #106**
- **Infrastructure:** #22, **#37**
- **Security & operations:** **#33, #34, #36, #98**
- **Process:** #0, #18, #27, #29, #30, #31, #32, **#48**

---

## 4. Detailed entries

Entries are weighted by consequence. High-impact decisions carry the full record; settled or
minor decisions are compact.

---

### #0 — Decision ordering
`2026-09-05` · **LOCKED** · Process

Data platform decided before frontend, because the Postgres-extensions choice determines
infrastructure, local development, and whether filtered semantic search is one query or two
systems. "What is the user paying for" was moved from the payments phase into product scope,
because it determines the payment state machine, refund rules and several models.

---

### #1 — Product scope: Package B (high impact)
`2026-09-05` · **LOCKED** · Product · Affects: `product/OVERVIEW.md`, `product/REQUIREMENTS.md`

> **Superseded in part (2026-09-17) by #79 and #80:** the exclusion of agent subscriptions no
> longer holds; Settly now has an agent listing subscription and transaction revenue. The rest of
> Package B stands. Also refined by #47 (resale only) and #78/#81 (`RENTED`).

**Context.** Scope failure in projects this size comes from too many *lifecycles*, not too many
features. Each lifecycle carries a state machine, notification rules, permissions, edge cases,
screens and tests.

**Options.**
- **A — Discovery & Intelligence:** search/AI/RAG, viewings, messaging. No offers. Payments limited to listing promotion. ~24 models.
- **B — Full Buyer Journey:** A plus a real offer lifecycle on sale listings plus a reservation deposit tied to an accepted offer. ~31 models, later 38.
- **C — Complete Marketplace:** B plus rental applications, leases, recurring rent, agencies, agent subscriptions, mortgage partners. ~55 models.

**Decision. Package B.** Sale-first. Rent exists as a listing type for discovery, viewings and
inquiries but has **no** offer or application lifecycle. Independent agents only — **no agency
entity**. The payment object is a **reservation deposit against an accepted offer**.

**Rationale.** Without offers the payment system has nothing to be coupled to, so transaction
atomicity, race conditions and idempotency become academic rather than real. "Accept offer plus
supersede competing offers plus create a deposit obligation plus notify" is a genuine multi-write
atomicity problem with a genuine concurrency problem on top. Rent-as-discovery-only buys real
product surface at near-zero domain cost. An agency entity would add a permission dimension to
every authorization check in the system, permanently, for no new capability.

**Trade-offs.** The offer-to-deposit coupling is the hardest part of the build. No rental
transactional story, which a real portal would have.

**Rejected payment objects.** Viewing reservation fee — uncommon in the real market, reads as
invented. Listing promotion — realistic, but sits in a corner touching nothing; kept as an
optional post-v1 addition since it exercises entitlements and expiry.

---

### #2 — Market and currency
`2026-09-05` · **LOCKED** · Product

**Egypt, EGP.** Consequences carried forward: Stripe cannot onboard Egyptian entities for payouts,
so the provider field is Paymob/Kashier/Fawry (#13); the timezone is Africa/Cairo with DST observed
again since 2023, so viewing slots are never stored as naive local time (#6); listing content may
be Arabic, affecting FTS configuration and embedding-model choice (#6, #24); money is stored in
integer minor units, piastres. **Amended by #89 (2026-09-17):** agent subscription base prices are in
**USD**; EGP remains the currency of real-estate amounts (prices, deposits, refunds).

---

### #3 — Core journeys and entity skeleton
`2026-09-05` · **LOCKED · identity + Area/KnowledgeArticle overlaps corrected by #39** · Domain · Affects: `architecture/DOMAIN_MODEL.md`

8 journeys: buyer primary path, passive discovery, AI-assisted discovery, agent onboarding,
listing lifecycle, agent pipeline, admin, notification fan-out. **36 models** across Identity,
Catalog, Engagement, Pipeline, Payments, Communication, Knowledge and AI, Analytics. Later grew to
**38** via #16 and #20.

**Key modelling calls.** `Area` is a **self-referencing hierarchy** — governorate, city, district,
compound — so there is deliberately **no `City` or `District` model**. `Lead` is the pipeline
anchor, unique per buyer-property pair. `Offer` is stateful; `OfferRevision` is append-only
history. `Payment` is the obligation and `PaymentAttempt` is one try, so failure is an attribute of
an attempt rather than of the obligation. `Conversation` is strictly two-party, so there is no
participant table. Notification *preferences* are a JSON column on `User`.

**Deliberately not modelled.** A double-entry ledger — with one provider, one currency and one
payment type, `Payment` plus `PaymentAttempt` plus `Refund` plus `WebhookEvent` plus `AuditLog`
already give a fully reconstructable history. `AiToolCall`, which would be a 1:1 satellite of
`AiMessage`. Daily stat rollups, which are materialized views. A generic outbox table, see #8.

**User ruling:** models are justified by requirements, never trimmed to hit a target count.

---

### #4 — UI and content language
`2026-09-05` · ❌ **REVERSED BY #39** · Product

English-only UI. Content is language-agnostic: Arabic or English listings are both first-class. AI
is bilingual where practical. UI chrome stays LTR; user-generated content requires `dir="auto"`, an
Arabic-capable font, and bidi isolation (#21).

---

### #5 — Lifecycle state machines (high impact)
`2026-09-05` · **LOCKED** · Domain · Amended by #11 · Affects: `product/BUSINESS_RULES.md`

Property 8 states, Viewing 8, Offer 10, Payment 7 plus PaymentAttempt 6 and Refund 4. Full
transition tables live in `product/BUSINESS_RULES.md`.

**Defining decisions.**
- **The paid deposit, not offer acceptance, is the commitment point.** Multiple offers may sit in
  `ACCEPTED` simultaneously and race to fund. *User ruling, reflecting Egyptian practice.*
- **Viewing exclusivity attaches at `CONFIRMED`, not `REQUESTED`**, moving contention off the
  high-volume buyer path onto the low-volume agent path.
- **Failure belongs to `PaymentAttempt`, not `Payment`.** A declined card fails one attempt; the
  obligation returns to `PENDING` for retry.
- **Two offline escape hatches**, because not every Egyptian deal walks the in-app path:
  agent-initiated offers, and ~~a direct `PUBLISHED` to `SOLD` transition~~ **(removed by #102 — an
  agent can never make a listing `SOLD` alone)**.
- **Two-tier edit moderation.** Structural fields — address, geo, type, area, images, title —
  trigger blocking re-review. Content fields — price, description, amenities — stay live with a
  non-blocking recheck flag. Instant price edits matter: stale prices are the top complaint on
  every property portal.

**Correction recorded.** Viewing exclusivity is enforced by an **exclusion constraint over a
`tstzrange`**, not a unique index on the start instant — viewings have duration, and a 14:00–15:00
booking must block a 14:30 request.

---

### #6 — Data platform (high impact)
`2026-09-05` · **LOCKED · FTS approach amended by #39** · Data · Affects: `architecture/DATABASE.md`

**PostgreSQL 17** with **PostGIS**, **pgvector**, **pg_trgm** and FTS.

**Why Postgres specifically.** Four capabilities we had already committed to needing are
Postgres-only: partial indexes, exclusion constraints, PostGIS and pgvector. In MySQL each would
have become application code, which is to say each would have become a bug.

**pgvector over Pinecone, Qdrant and Weaviate.** The decisive factor is not scale but
**filtering**. Every semantic query in Settly carries hard predicates — status, price, bedrooms,
area. An external vector store means replicating price into a second system, creating a second
source of truth for the field users filter on most. With pgvector the filter and the vector search
are one planned query. It also removes an entire failure domain: there is no "the vector database
is down" state independent of "the database is down".

**Vector placement.** The property vector is a **column on `Property`** with a partial HNSW index
`WHERE status = 'PUBLISHED'`; the `Embedding` table holds document and article chunks. One vector
per row means a column; many vectors per source means a table.

**Arabic and FTS.** Postgres ships no Arabic text-search configuration. Rather than add Meilisearch
or Typesense — a third stateful system and a second source of truth for listings — we use
`english`/`simple` per row language plus `pg_trgm`, and let the **multilingual embedding model
carry Arabic recall**. Because the configuration varies per row, the `tsvector` cannot be a
generated column and must be trigger-maintained.

**Also locked.** Money as `BIGINT` piastres plus an explicit currency column. `timestamptz` UTC
plus IANA zone, with availability stored as local wall-clock and resolved per date so DST cannot
shift a booking. UUIDv7 everywhere plus an SEO slug on `Property`. Native PG enums for the locked
state machines. **No global soft-delete** — lifecycle states already express withdrawal, and a
blanket `deleted_at` poisons every query and silently breaks unique constraints.

---

### #7 — ORM: Prisma
`2026-09-05` · **LOCKED** · Data · *User decision, against the standing recommendation*

**The recommendation was Drizzle**, on the grounds that Settly's hardest queries — filtered vector
search, geospatial ranking, hybrid fusion — are ones Prisma cannot express, so the difficult 30%
would fall out of the type system into raw SQL.

**The user chose Prisma** for developer experience, type safety, relational modelling, migrations
and productivity across the majority of the application, with **Prisma migrations carrying custom
SQL** for PostGIS, pgvector, exclusion constraints and triggers, and **TypedSQL or raw SQL** for
the limited set of complex queries.

**User ruling.** Using raw SQL for these cases is **not** an architectural failure. The goal is
Prisma for the application and data-access layer while allowing PostgreSQL-specific capabilities
where they provide real value.

**Containment.** Raw SQL lives only in `sql/`, each query a named, individually tested function
with an explicit return type (#8). That containment is what makes the split healthy rather than
leaky.

---

### #8 — Backend core (high impact)
`2026-09-05` · **LOCKED · contract shape specified by #40** · Backend · Affects: `architecture/BACKEND.md`, `architecture/API.md`

Separate API service and Next.js frontend, deployed as `app.settly.com` and `api.settly.com` so
the session cookie is **same-site** and `SameSite=Lax` suffices — one DNS decision that removes a
class of CSRF work. **Express 5** with Node 22 LTS, TypeScript strict, ESM.

**11 modules:** identity, catalog, engagement, pipeline, payments, messaging, notifications,
knowledge, ai, search, analytics. There is deliberately **no `admin` module** — admin operations
belong to whichever module owns the data, otherwise an admin module becomes a god-object.

**Three boundary rules, ESLint-enforced.** Modules call each other only through exported service
interfaces. **Prisma is imported only in `repository/`.** **Raw SQL lives only in `sql/`.**

**No outbox model.** Enqueueing to BullMQ is a Redis write and cannot be atomic with Postgres.
Rather than add a generic outbox, **every async workload gets a durable status column that a
sweeper re-drives** — the `Notification` row is written inside the transaction and a 60-second
sweeper re-enqueues anything still pending. Each table is its own outbox.

**Authorization lives in the service layer**, not HTTP middleware, which is what lets AI tools and
the agent inherit policy checks structurally — there is no middleware to bypass.

**Rejected.** Fastify, which was recommended and overridden by the user in favour of Express 5.
NestJS, whose DI and decorators abstract away exactly the wiring the project exists to teach. Hono.
GraphQL — one client, and it discards HTTP caching. tRPC — welds the frontend to backend TypeScript
and produces no inspectable contract. Next.js full-stack — cannot host long-running workers.

---

### #9 — Authentication: Better Auth (high impact)
`2026-09-05` · **LOCKED** · Auth · *User-initiated, evaluated then adopted*

**Boundary.** Better Auth owns credential verification, sessions, logout and revocation, email
verification, password reset, and the `user`, `session`, `account` and `verification` tables.
**Settly owns all authorization**, roles as business data, resource policies, and the immutable
AuditLog fed by Better Auth hooks.

**Rationale.** Not code reduction — a custom bearer path would be about twenty lines. The argument
is **security maintenance and future extensibility**: authentication is the one subsystem where the
cost is not the initial write but the indefinite obligation to keep it correct, and where the
plausible next features — OAuth, 2FA, passkeys, mobile — each cost days custom and minutes
configured.

**Eight non-negotiable configuration items.**
1. **Cookie cache DISABLED.** Otherwise a suspended user stays authenticated for the cache TTL,
   reintroducing exactly the staleness problem that disqualified stateless JWTs.
2. UUIDv7 id generation wired in **before the first migration**.
3. Argon2id overriding the default scrypt.
4. Cross-subdomain cookies on `.settly.com` plus a trusted-origin allow-list.
5. Audit hooks on login, logout, password reset, session revocation and ban.
6. Auth handler mounted **before** `express.json()`; webhook routes keep raw body.
7. Declared exception to the repository rule: Better Auth **is** the identity module's repository
   for auth tables.
8. Known seam: user creation in Better Auth and `AgentProfile` creation in Settly are **not one
   transaction**. Handled by an after-create hook plus a reconciliation path on the first
   agent-scoped request.

**Plugins used.** `admin` for ban and revocation mechanics only — **not** its access-control DSL;
`bearer`, which keeps React Native possible later; built-in rate limiting.
**Later if justified.** `expo`, `twoFactor` for agents and admins, Google OAuth.
**Not used.** `organization`, `multiSession`, `username`, `passkey`, `magicLink`, `emailOTP`,
`phoneNumber`, **`jwt`** which reintroduces the revocation problem, `apiKey`, `sso`,
`oidcProvider`, payments plugins.

**Rejected alternatives.** Custom sessions, the original design — secure, but trades future
extensibility and ongoing security maintenance. **Supabase Auth** — JWT sessions fail the
immediate-suspension requirement, and `auth.users` lives in a schema Prisma cannot migrate, forcing
a `profiles` mirror and a second source of truth for identity. Auth.js, which is Next-shaped and
weak on credentials. Lucia, sunset as a library. Clerk, Auth0 and WorkOS — per-MAU pricing, user
data off-platform, and every foreign key becomes a foreign identifier needing webhook sync.

---

### #10 — Reliability (high impact)
`2026-09-05` · **LOCKED** · Reliability · Affects: `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`

**Governing principle: correctness lives in database constraints and conditional updates.
Isolation levels and locks are escalations, used only where constraints cannot express the rule.**

**`READ COMMITTED` default.** Under Read Committed a blocked `UPDATE` re-evaluates its `WHERE`
clause against the new row version, which makes a conditional update a genuine atomic
compare-and-swap. Since every transition in #5 changes a status column, **the state machines give
us optimistic concurrency for free** — no version column, no retry loop.

**Exactly two escalations.** A transaction-scoped **advisory lock** for the open-viewing-request
cap, because write skew applies and "at most N rows matching a predicate" is not expressible as a
constraint — and locking the `user` row would contend with Better Auth. And **`SELECT … FOR
UPDATE`** on `Payment` for the refund-sum invariant, because money must be exact and refunds are
rare. **`SERIALIZABLE` is used nowhere**: it would force retry handling on every transaction to
solve two problems that two targeted mechanisms already solve.

**Nine of eleven races are solved by a constraint or a conditional update** — the deposit race by a
partial unique index, duplicate webhooks by a unique constraint on the provider event id, viewing
overlap by an exclusion constraint, concurrent offer edits by status-as-CAS.

**Idempotency.** An `Idempotency-Key` header on four endpoints only: create payment attempt,
request refund, create viewing request, submit offer. Keys live in **Postgres, not Redis** — they
must be durable and must commit atomically with the operation they protect. The payload hash is
compared, and the **original status code** is replayed on retry. Webhooks use a different key
source, the provider event id; jobs use a third, deterministic job ids.

**Redis is justified for BullMQ and distributed rate limiting, and rejected as a cache.** Property
detail is already cached at the edge by ISR; area statistics belong in materialized views, which
keep them in Postgres, joinable, with no invalidation logic. See #26 for the final narrow scope.

**Every external dependency except Postgres is non-critical.** Redis, Cloudinary, Paymob, FCM, the
LLM and the embedding provider can each fail without taking the product down, because durable state
lives in Postgres and a sweeper re-drives the work.

---

### #11 — Deposit race: the checkout hold
`2026-09-05` · **LOCKED** · Reliability · *Amends #5*

**Problem.** Because the deposit is the commitment point, two buyers holding `ACCEPTED` offers can
both pay before either webhook lands. The loser's money is already captured — correct engineering
producing a terrible experience, plus provider fees on both legs.

**Options.** (a) allow the race and auto-refund the loser; (b) a short exclusive checkout hold.

**Decision: (b), a 15-minute exclusive hold**, taken by conditional update when checkout starts.
The hold reserves nothing legally and grants no rights; **the deposit remains the commitment
point**. The automatic full-refund path is kept as the fallback for residual races and for holds
that expire mid-payment.

**Rationale.** It moves contention from *after* money moves to *before* it — onto an operation that
is free, instant and reversible. It also constrains payment methods; see #13.

---

### #12 — Rate-limit degradation
`2026-09-05` · **LOCKED** · Reliability · *User amendment to a weaker proposal*

The original proposal was to fail open on a Redis outage. **The user required that sensitive
endpoints never lose protection.** The resulting three-tier degradation:

| Tier | Redis healthy | **Redis down** | Both down |
|---|---|---|---|
| **A** — login, password reset, verification, payment operations | Redis counters | **Postgres-backed counters, limits tightened ~50%** | In-memory, hard floor |
| **B** — authenticated writes | Redis counters | In-memory, divided by instance count | In-memory |
| **C** — public reads | Redis counters | Fail open, generous cap | Fail open |

Postgres counters stay **shared across instances**, which is the property in-memory limiting loses
and the only one that matters against an attacker. Always on regardless of Redis health: per-account
exponential lockout independent of IP. Entering fallback raises an immediate alert.

---

### #13 — Payments: Paymob (high impact)
`2026-09-05` · **LOCKED · webhook payload retention refined by #42** · Payments · Affects: `architecture/PAYMENTS.md`

**Provider: Paymob**, chosen for payment-method breadth, the best developer documentation in the
Egyptian market, sandbox access without commercial registration, and HMAC-signed callbacks.
Rejected: Kashier as smaller; Fawry, strongest on cash but with heavy onboarding and worth adding
later *specifically for cash*; PayTabs, Geidea and APS for enterprise onboarding; Stripe, which
cannot onboard Egyptian entities.

**Hosted redirect checkout, never embedded card fields.** Settly never accepts, transmits, logs or
stores a card number, CVV or expiry — not in the database, not in logs, not in an error report.
This keeps PCI scope at its lightest.

**v1 accepts synchronous methods only** — card, wallet, instalments. **Kiosk, cash and manual bank
transfer are deferred to v2** because they complete in *hours* and cannot fit inside the 15-minute
hold from #11. When they are added the rule is already set: holds are granted only to synchronous
methods.

**Deposit rule: 5% of property price, capped at 50,000 EGP.**

**Webhook verification, in strict order** — nothing before step 3 is trusted: read the raw body,
verify the HMAC, parse, map to a known Payment, **assert amount and currency match exactly**,
insert `WebhookEvent` with its unique provider event id so a duplicate returns 200 immediately,
interpret the provider flags, apply the transaction, return 200. Return 5xx only on genuine
failure, so that Paymob retries.

**Two Paymob specifics.** Its HMAC is computed over a **specific ordered concatenation of
transaction fields**, not over the raw request body — the usual "HMAC the raw bytes" instinct
produces a signature that never matches. And its callbacks carry several boolean flags whose
meaning lives in the **combination**; never branch on `success` alone.

**Refunds.** A single `reverse(attempt, amount)` operation choosing void or refund by settlement
window, using the recoverable three-step pattern — record intent, call the provider, record the
result — with a durable state in between. **The provider generally does not return the processing
fee on a refund**, so gross, fee and net are modelled explicitly on `Payment`, and `fee_returned`
on `Refund`. Without them, financial reporting silently overstates revenue.

**Provider port.** Four methods, one adapter, justified primarily by **testability**: a fake
adapter makes the entire payment state machine and every race testable in CI without touching
Paymob.

**Five invariants.** The frontend can never mark a payment successful. Webhooks may arrive any
number of times, in any order, with the same outcome. **If webhooks stop entirely, reconciliation
still settles every payment** — webhooks are latency, not correctness. Captured money is always
either applied or refunded, never neither. Every transition is audited.

---

### #14 — Search architecture (high impact)
`2026-09-05` · **LOCKED · HTTP projection refined by #40** · Search · Affects: `architecture/SEARCH.md`

**Three execution paths behind one endpoint**, because routing all traffic through one pipeline
makes the common case pay for the rare one:

| Path | Composition | Share |
|---|---|---|
| Filter search | Structured SQL plus PostGIS. No vector, no LLM | ~70% |
| Map viewport | PostGIS plus server-side clustering | Very high frequency |
| Natural language | Query understanding, then four arms, then fusion | ~25% |

**Hard constraints are always structured filters, never the vector arm.** Embeddings encode
"affordable" as a fuzzy direction, not as an inequality: a semantic search for "under 5 million"
will return a 12M villa whose description says "affordable luxury". Query understanding extracts
constraints into SQL and hands the vector arm only residual intent text.

**Query understanding.** Deterministic extraction first — price patterns, bedroom patterns, an
Area gazetteer matched against real rows, amenity synonyms — with the **LLM invoked only on
residual intent text**. The model **proposes and the backend disposes**: every returned filter
value is Zod-validated *and* checked against real `Area` and `Amenity` rows, so it can never
introduce a value that does not exist. Parses are cached. Parsed filters are surfaced to the user
as **removable chips**, which turns an opaque AI into a correctable one.

**Selectivity switch.** Below roughly 1,000 candidates, compute exact distances over the candidate
set — faster *and* more accurate than approximate search. Above that, use the HNSW index with
iterative scan. Do not approximate what you can compute exactly.

**Fusion: Reciprocal Rank Fusion**, k around 60. Not weighted score fusion: `ts_rank` and cosine
distance live on incomparable scales and any invented normalization drifts as the corpus changes,
a well-known source of "search got worse and nobody knows why". Business boosts — freshness,
completeness, agent responsiveness — are applied afterwards, additively and **capped**, so they can
reorder near-equivalent results but never float an irrelevant listing above a relevant one.

**Map.** Server-side clustering; the semantic result set is computed **once per query** and then
geo-filtered on pan, so panning never re-runs the LLM parse or the vector search.

**Pagination.** Keyset for filter search. For hybrid, the fused ranking has no stable SQL sort key,
so the top ~500 are materialized once and cached, and pagination happens within that list. *This
amends #10: Redis search caching is justified — for hybrid text queries only, never for viewports.*

**Degradation: every arm is optional except the structured one.**

**SEO correction.** Indexing arbitrary filter combinations creates infinite crawl space and
duplicate content. Filtered search pages are `noindex`; organic discovery comes from a curated set
of ISR facet landing pages.

---

### #15 — Canonical English description
`2026-09-05` · ❌ **REVERSED BY #39** · Search · *User-constrained*

At publish time a canonical English description is generated from whatever language the agent
wrote in, and used for the lexical index and the embedding. This makes cross-language **lexical**
search work and keeps embeddings stylistically consistent.

**User constraint, strict.** It must be a **faithful translation and normalization only** — never
inventing, inferring, embellishing or adding facts absent from the original. It is **never a
business source of truth** and is **never displayed to users**. The original remains the display
source of truth.

That containment is what makes it safe: a hallucination degrades ranking slightly; it cannot show
a buyer a false claim about a property.

---

### #16 — `SearchEvent` as model #37
`2026-09-05` · **LOCKED** · Data

Captures normalized query, parsed filters, per-arm timings, result count, **zero-result flag** and
clicked position. Zero-result queries are the highest-value dataset the product generates: they say
exactly what buyers want and cannot find, in their own words. Search quality is Settly's
differentiator and cannot be improved without this data. Per #28, the data is captured but **no
analytics dashboard is built in v1**.

---

### #17 — AI architecture (high impact)
`2026-09-05` · **LOCKED, amended by #24** · AI · Affects: `architecture/AI.md`, `architecture/RAG.md`

**Two-tier models.** Query understanding is high-volume and latency-critical, under ~400 ms, and
trivially easy; the assistant is low-volume, latency-tolerant and hard. Using one model for both is
a large cost mistake. *(#28 notes the saving is small at portfolio scale; the architecture stays
model-per-task configurable.)*

**Orchestration: the Vercel AI SDK plus our own logic.** LangChain rejected — heavy abstraction
over things done once, frequent breaking changes, and it obscures the exact prompt and tool payload,
which is precisely what you need visibility into when RAG misbehaves. LangGraph rejected — built for
stateful graphs with cycles, which #19 concluded we do not need.

**RAG scope, the decision that prevents the most common RAG mistake.** Price, bedrooms, area,
status and availability are **structured fields**; retrieving a chunk that mentions the price is
strictly worse than injecting the live record, because chunks go stale and can contradict the
database. So the RAG corpus is **only** area guides, FAQs, approved documents and help content.
**Property facts come from tools, never from RAG.**

**Chunking.** Structure-aware recursive splitting, target ~500 tokens with ~15% overlap, chunked by
**tokens rather than characters** because Arabic is markedly more token-dense, with a contextual
provenance prefix added before embedding.

**Retrieval.** Hybrid top-20, then a **mandatory visibility filter applied in-query** — this is a
security control, not a ranking feature; post-filtering leaks through timing and result counts —
then a relevance floor, then abstention if nothing survives.

**Grounding.** Citations required and **mechanically validated** against the retrieved set, so a
fabricated citation is caught rather than trusted. Live facts never come from RAG. Abstention is a
success state.

**Tool calling.** Eight read tools and exactly one write tool, `createViewingRequest`. Tools
execute **as the user**, through the same service and policy layer a controller would use — the
whole security model. Write tools require explicit user confirmation. Maximum around five
iterations per turn.

**Recommendations.** Weighted scoring over a preference profile, ranked partly by semantic
similarity to the **centroid of favourited property vectors** — no training, no labels, works from
about three favourites, and reuses vectors already stored. No ML in v1: there is no interaction
data, no labels and no evaluation set.

**Prompt injection.** The attack arrives through agent-written property descriptions that we
deliberately feed into embeddings. Defence is architectural, not prompt-level: **capability
containment** — the model can do nothing the user could not already do — and **no
outward-transmitting tool**, so even a fully successful injection has nowhere to send anything.
This is why "let the AI message the agent for you" is not a v1 feature.

**Cost.** AI is the only unbounded cost in Settly. **Per-user rate limits are mandatory.**

**Known gap.** No OCR; scanned or image-only PDFs are unsupported in v1.

---

### #18 — Repository topology: separate projects
`2026-09-05` · **LOCKED** · Process · *User-initiated, evaluated and endorsed*

One git repository containing `frontend/` and `backend/` as **fully independent applications** —
separate `package.json`, lockfiles, environment, builds and deployments. No monorepo tooling, no
workspaces, no shared-code dependency.

**Rationale, and it favours separation on the merits.** A monorepo with directly-imported shared
types produces compile-time safety that **hides a production truth**: deployed frontend and
deployed backend are always different versions for some window. Separation forces API versioning to
be a real discipline. The team-coordination benefit that justifies most monorepos does not exist for
a solo developer, and the two sides have genuinely different runtime shapes.

**The contract.** OpenAPI **generated from the same Zod schemas that perform runtime validation**,
so the spec cannot drift from behaviour. The spec snapshot is **committed into `frontend/`**, so
contract changes appear as reviewable diffs and the frontend build never depends on a running
backend. A **CI drift gate** in the backend fails the build if the regenerated spec differs.
Generated types via `openapi-typescript` plus `openapi-fetch`.

**Ownership split.** Wire-contract validation is generated and backend-owned; UI-only validation —
password confirmation, multi-step form state — is hand-written and frontend-owned. These are
genuinely different concerns and duplicating them is correct.

**Tier-B requirement recorded:** `architecture/API.md` must contain a "Changing the contract"
section documenting the end-to-end workflow.

---

### #19 — One bounded AI agent (high impact)
`2026-09-05` · **LOCKED · report-not-gate rule generalised by #41** · AI · Affects: `architecture/AGENT.md`

**The Property Shortlist Agent**, and exactly one.

**The test used to decide.** *Can you draw the complete call graph before seeing any results?*
Yes means tool calling; no means an agent. Option B, the "Property Research Agent" — get property,
get area, retrieve knowledge, analyse — **fails this test and is a fixed pipeline**; calling it an
agent would be self-deception. The Shortlist Agent passes on two mechanisms: **adaptive constraint
relaxation** when a result set comes back too thin, and **content-dependent shortlisting** when
forty results must be narrowed to five under a finite enrichment budget.

**Honest accounting, recorded because it was asked for.** The learning value is high; the *product*
value is real but modest — a better front door to search. This is bought primarily with learning
value, which is a legitimate reason as long as it stays the stated one.

**Architecture.** A hand-written bounded controller, **not LangGraph** — LangGraph's strongest
argument is checkpointing with mid-run human interrupts, but our writes happen *after* the run, so
that feature goes unused; and writing the loop is what teaches what LangGraph does.

**Safety, in order of importance.**
1. **The loop is read-only.** All state changes are proposals confirmed by a human, then routed
   through the normal write path. This collapses nearly the entire risk surface.
2. **The planner chooses from a closed action enum**, not free-form text, so the worst outcome of a
   successful injection is a wasted step.
3. **State is a typed scratchpad**, not a message transcript — which keeps context flat, cost
   bounded, and the run assertable in tests.
4. **Five independent caps:** 8 steps, 60 seconds, token budget, cost budget, and a **no-progress
   detector** — a step that does not change the scratchpad costs double, and two consecutive
   no-ops terminate the run.
5. Actor context is captured at run start and **immutable**, never re-derived from model output.

**Tools:** `searchProperties`, `getPropertyDetails`, `compareProperties`, `getAreaInsights`,
`checkViewingAvailability`, `retrieveKnowledge`, `getMyPreferences`. All read-only. **No web
access** — it would reintroduce the exfiltration path #17 deliberately closed.

**Router.** Simple question goes to RAG; a single lookup goes to tool calling; only a
multi-constraint adaptive discovery goal reaches the agent. **The agent must not become the default
path**, or the product has a slow, expensive search box.

**Testing.** Deterministic controller tests with a scripted planner stub — budgets, no-progress
detection, termination and failure handling, where the risky logic lives — plus record/replay
fixtures, plus a non-deterministic evaluation suite run as a **CI report, never a pass/fail gate**.

**Three standing conditions.** The loop stays read-only. One agent, not two. The router stays.

---

### #20 — `AgentRun` as model #38
`2026-09-05` · **LOCKED** · Data

Persists goal, actor, status, budgets consumed, typed scratchpad, step trace as JSONB, and result.
Steps are deliberately **not** a separate model: a bounded 8-step run fits in JSONB and Postgres
queries it fine.

---

### #21 — Frontend architecture (high impact)
`2026-09-05` · **LOCKED · LTR-only stance REVERSED by #39** · Frontend · Affects: `architecture/FRONTEND.md`

> **Superseded in part (2026-09-17) by #96:** the V1 map library is **Leaflet** (with MapTiler tiles),
> not MapLibre.

Next.js App Router. **SEO pages are server-rendered or static; dashboards are pure client-side**,
which means the Next server **never forwards cookies** and that entire class of bug disappears.
Dashboards genuinely do not want SSR — they are interactive, unindexed, and server-rendering them
would add a hop for nothing. The browser talks to `api.settly.com` **directly**; no Next proxy.

**Locked rule.** Public ISR pages must not read per-user cookies or session data in Server
Components. Favourites, viewed state and saved-search state are **client-side only**, or the route
becomes dynamic and ISR is lost — along with the argument in #10 that ISR removes the need for a
Redis property cache.

**State ownership.** TanStack Query owns all server state including the current user. `nuqs` owns
URL state — filters, sort, map bounds — because a property search is something people bookmark and
share, which only works if the filter set *is* the URL. Zustand holds four pieces of UI state.
React Hook Form owns form state. **No server data in Zustand, ever.**

**Realtime: SSE only.** *Sending* a message already goes over REST for validation, persistence and
authorization; only *receiving* needs a push, so the traffic is server-to-client and SSE is exactly
that. One authenticated stream per user session. **Rejected:** WebSockets and Socket.IO as
bidirectional infrastructure for a unidirectional problem; **Firestore for chat**, which would put
business-critical messages in a second database with authorization rules re-expressed there. Redis
pub/sub fan-out is designed but inactive at one instance. FCM stays separate for closed-tab push.

**Libraries.** Tailwind, shadcn/ui on Radix, TanStack Query, TanStack Table, Recharts — chosen
partly because shadcn ships chart components built on it — Motion, `date-fns`. **Maps: MapLibre
plus MapTiler for display, with Google Geocoding server-side at listing creation only**, because
Google's geocoder is materially better for Egypt and being honest about that beats ideological
consistency.

**Dates.** All scheduling arithmetic happens **server-side**; the frontend only formats. Egypt's DST
transitions are exactly where a booking silently shifts by an hour, and duplicating that logic in
the browser gives it a second place to be wrong.

**Bilingual content in an English UI.** `dir="auto"` on all user-generated content, an
Arabic-capable font in the stack, and bidi isolation. Not full RTL support — correct rendering of
bidirectional content, which is a smaller and entirely necessary job.

**Auth UX boundary.** Next middleware checks only whether a session cookie **exists**, for a fast
redirect. **It is not the authorization boundary** and must never be treated as one; the API is.

---

### #22 — Deployment topology
`2026-09-05` · **LOCKED** · Infrastructure · Affects: `architecture/INFRASTRUCTURE.md`

Vercel for the frontend; Railway running **two services**, `settly-api` and `settly-worker`, from
one `backend/` codebase; managed Redis; Supabase PostgreSQL.

**Hard constraint: the backend must be always-on.** A backend that sleeps stops reconciling
payments and stops every expiry job, silently invalidating the #10 recovery story. Any
scale-to-zero host is disqualified.

**Two services rather than one**, for about $5/month more: it matches the architecture rather than
a diagram that quietly differs from reality, it makes a real property demonstrable — kill the
worker, watch the API keep serving and the sweepers catch up — and it keeps CPU-bound image work
away from request latency.

**Kept:** Docker Compose for local development, a backend Dockerfile for local/production parity,
GitHub Actions CI with lint, typecheck, test, the OpenAPI drift gate and migration validation, a
health endpoint, Sentry plus structured logs. Local and production only; no staging, with Vercel
previews and one-click Railway rollback as mitigation. Colocate in EU/Frankfurt.

**Rejected:** Kubernetes, Terraform, ECS, service mesh, multi-region, staging infrastructure.

**Recorded risk & Neon Migration (2026-09-14):**
Per user directive, the project database is hosted directly on **Neon Serverless PostgreSQL (PostgreSQL 18 on aarch64)** rather than local Docker or Supabase.
- Both pooled `DATABASE_URL` and direct `DIRECT_URL` configured for runtime queries and Prisma migrations.
- Full parity confirmed on Neon for all 5 extensions (`postgis` 3.6.4, `vector` 0.8.6, `pg_trgm` 1.6, `btree_gist` 1.8, `uuid-ossp` 1.1).
- Complete 39-table schema and all constraints (AuditLog append-only trigger, Viewing exclusion constraint, Invariant I1 deposit race partial unique index, bilingual FTS generated columns, and PostGIS location sync trigger) migrated and verified in production.
- Neon PgBouncer transaction pooler verified to support protocol-level prepared statements (`max_prepared_statements`). Removing `pgbouncer=true` eliminates artificial `DEALLOCATE ALL` statements and disables Prisma's fallback round-trip mode, lowering warm per-statement latency from ~494ms to ~85ms.

---

### #23 — Rendering matrix
`2026-09-05` · **LOCKED · localized routes added by #39** · Frontend · *Corrects an earlier over-simplification*

Five modes, never to be collapsed again: true SSG, time-based ISR, **on-demand ISR**, SSR, and
static shell plus client-side fetching.

| Mode | Routes |
|---|---|
| **SSG**, no revalidation | `/about`, `/contact`, `/how-it-works`, `/privacy`, `/terms`, auth shells, 404/500 |
| **Static plus on-demand** | `/areas`, `/areas/[slug]`, `/insights` — the latter revalidated by the nightly matview refresh job, so page and data source stay aligned by construction |
| **ISR plus on-demand** | `/properties/[slug]` on publish, price and status change, with `generateStaticParams` for the top ~100; `/properties/[facet]`; `/agents`; `/agents/[slug]`; `/` |
| **SSR** | **`/properties` only** — it reads `searchParams`, so it is dynamic automatically; `noindex` when filters are present |
| **Static shell plus CSR** | `/map`, `/compare`, `/dashboard/*`, `/agent/*`, `/admin/*`, `/assistant` |

**On-demand revalidation is the preferred mode**, because we control the backend and know exactly
when a listing publishes or a price changes. Time-based revalidation regenerates pages that did not
change and still serves stale prices in between.

**How App Router decides.** A route is static by default and becomes dynamic the moment it touches
`cookies()`, `headers()`, `searchParams` or an uncached fetch. Hence dashboards are automatically
static shells, `/properties` is automatically SSR, and the client-only-personalization rule in #21
is a structural requirement rather than a style preference.

**`/properties` SSR was reconsidered and kept.** The three-hop path — Vercel function, Railway,
Supabase — is the worst latency profile in the system, but it is the highest-intent page and
populated first paint is worth it. Mitigation is colocated regions and real measurement, explicitly
**not** a Redis page cache to compensate for deployment topology.

---

### #24 — AI provider: Google Gemini
`2026-09-05` · **LOCKED, amends #17 · multilingual requirement strengthened by #39** · AI · *User decision*

**Google Gemini** as the primary ecosystem: generation, structured output, tool calling, streaming
**and embeddings**. Cohere removed. Provider choice had been deliberately left open pending
evaluation of pricing, Arabic quality, structured output, tool calling, streaming and reliability.

**Embeddings target 1,536 dimensions** via official dimensionality reduction where the selected
model supports it, with **mandatory re-normalization after truncation**. Exact model, native
dimensions and reduction mechanism are **PENDING VERIFICATION** (V1, V2) because Gemini embeddings
are natively 3,072-dimensional while pgvector's HNSW index has a ceiling around 2,000 — so the
approved configuration does not work without either truncation or `halfvec`.

**No dedicated reranker in v1.** The Gemini switch silently removed Cohere Rerank, which #17 had
approved. Rather than leave an approved requirement unimplemented, this is now an explicit
decision: retrieval is structured plus lexical plus semantic plus RRF plus a relevance floor plus
abstention. **Vertex AI Ranking and all external reranking vendors are rejected.** LLM-as-reranker
remains a future experiment, gated on evaluation evidence.

**The AI SDK is the provider port.** A generic `AiProvider` wrapper on top of it would duplicate
what already exists. A narrow Settly-owned embedding service handles domain concerns only —
property embedding construction, chunk embedding, model and version metadata, dimension validation,
normalization, retry.

**Recorded risk.** Bilingual search now rests on an **unverified assumption** about Gemini's Arabic
quality. This is why #27 makes retrieval evaluation a gate.

---

### #25 — Storage split
`2026-09-05` · **LOCKED** · Storage · Affects: `architecture/STORAGE.md`

**Cloudinary** for public property images and media. **Supabase Storage** for private RAG documents
— contracts, floor plans, authorized property documents. PostgreSQL remains the metadata source of
truth. Private access goes through Settly authorization issuing a short-lived signed URL. **No
Supabase RLS.** No third object-storage provider.

Cloudinary was chosen by the user, superseding an earlier Cloudflare R2 recommendation. It is right
for images and wrong for authorization-gated documents, which is why the split exists.

**Upload security, unchanged.** Signed direct upload with the backend issuing the signature; the
API secret never reaches the browser. Magic-byte verification, because a declared content type is
not evidence. Mandatory re-encode, which neutralizes polyglot files and — non-obviously — **strips
EXIF GPS data**, since phone photos of properties carry exact coordinates for listings whose
addresses are deliberately approximate. User content is served from a separate domain, never the
API origin, so an uploaded SVG cannot become stored XSS with access to the session cookie.

**Known gap.** No malware scanning on document uploads in v1.

---

### #26 — Redis scope clarification
`2026-09-05` · **LOCKED, clarifies #10** · Reliability

Redis caching is **not** a general application caching strategy. The **only** approved cache is the
short-lived hybrid-search ranked ID list — roughly the top 500 for natural-language search, TTL
around five minutes.

Explicitly **not** cached in Redis: property pages, arbitrary API responses, user profiles,
dashboards, database entities. On-demand ISR owns public property-page caching.

Redis's other approved roles stand: BullMQ backing store, distributed rate limiting, and future SSE
fan-out once there is more than one instance.

---

### #27 — Seed data and retrieval evaluation
`2026-09-05` · **LOCKED · evaluation scope extended by #39 · Arabic/cross-language corpus and gates deferred for V1 by #99** · Process · Affects: `process/SEED_DATA.md`

One first-class deliverable, roughly 1–2 weeks of real work — **not optional demo decoration**.
Hybrid search, semantic retrieval, RAG and the agent are all invisible on forty listings.

**Corpus.** 500–1,000 realistic Egyptian properties, real area hierarchy, realistic price-to-area
correlation, **genuinely bilingual descriptions** — the Arabic must be real Arabic or the bilingual
design is untested — agents and users, favourites and saved searches, representative viewing, offer
and payment states, 10–20 trusted RAG sources, demo accounts for buyer/agent/admin, and a safe demo
reset. Structure real, content synthetic.

**Deliberate hard cases**, because these are what prove hybrid search works rather than merely
runs: near-duplicate listings, descriptions contradicting structured fields, Arabic-only listings,
English-only listings, areas without guides, ambiguous semantic queries.

**Pre-committed evaluation gate.** 20–30 bilingual benchmark queries with expected results.

| Metric | Threshold |
|---|---|
| Recall@10, same-language (EN→EN, AR→AR) | **≥ 0.80** |
| Recall@10, cross-language (EN→AR, AR→EN) | **≥ 0.65** |
| Zero-result rate | **≤ 10%** |
| Relevant result in top 3 | **≥ 0.70** |

**Interpretation, locked:** if cross-language Recall@10 falls below approximately **0.50**, the
bilingual semantic-search assumption is considered materially unsuccessful and the embedding
decision (#24) must be revisited.

**These numbers are fixed before the corpus is built and must not be tuned after seeing results.**
"The API returns 200" is not success. Cross-language is set lower deliberately because it is
genuinely harder; holding it to the same bar would fail a usable model.

**Script requirements.** Idempotent, resumable, safe to rerun, skips completed embedding work, and
backs off on Gemini rate limits — around 4,000 embedding calls will meet free-tier quota limits.

---

### #28 — Admin scope reduction
`2026-09-05` · **LOCKED** · Product

**Kept, because load-bearing:** property moderation, moderation actions, audit-log viewer,
reports and moderation workflow, essential operational dashboard information.
**Reduced to minimal or stub:** advanced admin analytics, extensive admin user management.

Rationale: six admin routes is roughly 20% of the frontend for a role that, in a demo, has exactly
one user. Moderation is load-bearing because the property lifecycle depends on it; admin analytics
and user management are decoration. `SearchEvent` data is still captured; **no search-analytics
dashboard in v1**.

---

### #29 — Sequencing principle
`2026-09-05` · **LOCKED** · Process · Affects: `process/ROADMAP.md`

**Do not reduce architecture because the project is portfolio-only. Reduce scope by sequencing.**

Recorded estimate: 38 models, ~27 screens, a real payment state machine, four-arm hybrid search,
RAG, a bounded agent, two worker classes, nine scheduled jobs and a seed corpus is **4–8 months of
solo part-time work**. The failure mode for a project this size is not bad architecture; it is four
months of foundation with nothing to show and motivation running out before the interesting parts
are built.

**Target an early end-to-end vertical slice**, roughly six weeks:
`auth → properties → search → property detail → viewing request`.
Then layer: offers, payments, messaging, notifications, hybrid search, RAG, AI assistant, Shortlist
Agent, advanced operations.

---

### #30 — Documentation lifecycle
`2026-09-05` · **LOCKED** · Process · Affects: `README.md`, all documentation

Three tiers. **Tier A now** — `CLAUDE.md`, `docs/README.md`, `DECISIONS.md`, `GLOSSARY.md`,
`product/BUSINESS_RULES.md` — because their content is already locked and highly perishable.
**Tier B after all architecture is locked**, in a dedicated Documentation Phase. **Tier C after
Stitch**, with design documents holding intent and constraints only beforehand — no invented
colours, type scales, spacing tokens, radii, shadows or animation timings.

**Governing principle: documentation leads on *why* and *what must be true*; code leads on *what
exactly exists*, and those documents are generated.** Hand-writing an API reference before
implementation is drift on day one.

**Rejected.** A separate formal SRS — it would duplicate the PRD, business rules, API and database
docs across ~60 pages nobody reads; only the traceability matrix survives, folded into
`product/REQUIREMENTS.md`. A `CHANGELOG.md` before there are releases. A flat 30-file layout.
Per-decision ADR files, which force many reads to answer "what is already decided".

**`DECISIONS.md` is the one deliberate size exception**, structured as summary table, pending
checklist, index, then entries weighted by consequence.

**The Documentation Phase must be artifact-driven** — from `DECISIONS.md` and the Architecture
Record, not from reconstructing the conversation. Conversation recall is exactly where "documentation
describes an idealized version of the system" comes from.

**`CLAUDE.md` is the real entry point**, because it is auto-loaded while `docs/README.md` is only
read if an agent chooses to look. Stack-specific `frontend/CLAUDE.md` and `backend/CLAUDE.md` are
reserved for the implementation phase.

**Anything mechanically enforceable becomes a lint rule or CI gate, not prose.** An agent will
violate a document; it will not get past a failing build.

---

### #31 — Business constants have one authoritative definition
`2026-09-05` · **LOCKED** · Process · Affects: `product/BUSINESS_RULES.md`

Numeric business constants are defined **once** in a backend configuration module. The constants
table in `product/BUSINESS_RULES.md` is **generated from it** where practical.

**Rationale.** Unlike a stale architecture description, which merely misleads, a stale *constant*
means the documented refund policy is not the one users experience. This applies the "generated
where practical" principle to the highest-consequence drift surface.

**The prose stays hand-written**, because it explains what the generated table cannot: why the rule
exists, what happens when it triggers, who is affected, what state transitions follow, and what
notifications result. **The generated table must never be the only documentation of a rule.**

**Business constants and AI/technical operational limits are separate.** They are not to be merged
into one undifferentiated table: business constants belong in `product/BUSINESS_RULES.md`;
technical and AI limits belong in the relevant architecture documents.

---

### #32 — Retrieval evaluation thresholds
`2026-09-05` · **LOCKED · V1 gate is the English rows only; AR and cross-language rows deferred by #99** · Process · *Part of #27*

Pre-committed and **not to be tuned after seeing results**: same-language Recall@10 ≥ 0.80;
cross-language Recall@10 ≥ 0.65; zero-result rate ≤ 10%; relevant result in top 3 ≥ 0.70. If
cross-language Recall@10 falls below approximately **0.50**, the bilingual semantic-search
assumption is materially unsuccessful and the embedding decision (#24) must be revisited. Full
context in #27.

---

### #33 — Security and operations (high impact)
`2026-09-05` · **LOCKED · AuditLog metadata rule refined by #42** · Security · Affects: `architecture/SECURITY.md`, `OBSERVABILITY.md`, `FAILURE_MODES.md` *(all Tier B)*

**Governing test applied to every mechanism: what threat, failure mode, or correctness problem does
this actually solve?** Anything that failed it was cut.

**Layering — controls sit once, at the cheapest correct layer.**
Vercel/edge owns TLS, HSTS and **all browser security headers**, because only Vercel serves
documents. Express owns CORS, Origin validation, body limits, timeouts, request ids and rate
limiting. The service layer owns authorization and invariants. Postgres constraints are the last
line.

**Helmet is kept but configured deliberately.** On a JSON API most of what Helmet sets is inert —
CSP and `X-Frame-Options` on a JSON response accomplish nothing, because no browser renders it as a
document. What earns its place is `nosniff`, HSTS and removing `X-Powered-By`. **The failure mode is
not Helmet; it is believing Helmet on the API secured the browser.**

**CORS: an exact allowlist with `credentials: true`.** ⚠️ Never reflect arbitrary origins, and never
regex-match `*.vercel.app` — that would let *anyone's* Vercel deployment make credentialed requests
with a victim's cookies (V13).

**CSRF: `SameSite=Lax` plus Origin validation. No token system**, which would be a third layer over
two that already hold. **Rule (E2): no state-changing GET that relies on ambient session authority.**
Capability-token GETs — verification and reset links — are exempt, because the token *is* the
authorization and cannot be forged.

**Authorization confirmed unchanged**, with two admin boundaries made explicit: admins do not read
buyer↔agent conversations by default, and admins never act as a party to an offer or payment.
Refunds are system- or admin-initiated per policy, never buyer self-service. CASL/Casbin and RLS
remain rejected.

**Rate limiting — simplified from the earlier three-tier design.** Tier A keeps its Postgres
fallback; **Tier B drops the instance-divided arithmetic** and falls open to a coarse cap, because
**business invariants already bound it** (I9, I11, I12, O1) — and an invariant is strictly better
than a limiter, being permanent rather than per-window. **(E6)** The in-memory check runs *before*
the Postgres counter, or the fallback becomes a write-amplification vector under attack.
Account-based **exponential delay**, not hard lockout, because a hard lock is a denial-of-service
primitive; responses stay enumeration-resistant.
**(E5) The global AI spend cap is Postgres-backed** — it is the one limit that must fail *closed*.

**AuditLog boundary.** Business and security history only: lifecycle transitions, moderation, agent
verification, admin actions on users, Better Auth security events, **private-document access**, **AI
state-changing tool executions**, audit exports. Never ordinary reads, search queries, application
logs, request bodies, secrets or AI conversation content. Actor types include `SYSTEM` and
**`AI_TOOL`**, so "what did the AI do on this user's behalf?" is answerable as a distinct question.
**(E4) Strictly immutable** — database-enforced, and the earlier 90-day IP-nulling proposal is
dropped because nulling a field *is* an `UPDATE` and the two cannot both hold.

**Secrets.** Platform-managed; no Vault. The `NEXT_PUBLIC_` boundary is absolute — **the Gemini API
key, Paymob secrets, Cloudinary secrets, Firebase service credentials and Supabase service-role keys
must never reach the browser.** A leaked LLM key is a direct, unbounded bill.

**Database.** Pooled Supavisor for the app, direct for migrations, TLS, forward-only migrations,
expand/contract for destructive changes with a CI gate. SQL injection risk lives **entirely** in
`sql/`: parameterized placeholders always, and **dynamic identifiers from a closed allowlist** —
sorting is where injection sneaks back in, because parameters cannot be identifiers. The
`settly_app` least-privilege role is **optional hardening**, not a dependency.

**File upload.** ⚠️ The two paths verify at different points: **Cloudinary validates image formats
server-side; Supabase Storage inspects nothing**, so magic-byte verification is *ours* on the
document path and must complete before a document is retrievable or indexed. UUID storage keys make
extension spoofing irrelevant. **Never serve the original image asset** — only a transformed
derivative, because originals retain EXIF, and property photos carry exact coordinates for listings
whose addresses are deliberately approximate.

**Malware scanning: deliberately absent in v1.** ClamAV's detection rate against targeted or novel
malware is poor; deploying it would produce a *feeling* of protection larger than the protection —
security theater. **And it defends the wrong threat.** The real exposure is our own parser being
exploited during extraction. Containment addresses that directly: PDF/DOCX allowlist, **structural
rejection of PDFs containing `/JavaScript`, `/OpenAction` or `/EmbeddedFile`**, hard time and memory
limits on extraction, worker-only extraction so a parser crash takes a job rather than a request,
`attachment` disposition, separate serving domain. **Documented as a known v1 limitation.**

**Payments.** Nine-step verification, nothing trusted before the HMAC check. The **amount and
currency assertion is a fraud control, not a sanity check** — a forger would set the amount to one
piastre. **Replay protection is the unique provider-event-id constraint, not a timestamp check**:
rejecting old events would strand legitimate retries. Paymob IPs are logged, never gated on. Log the
event id and a payload **hash**, never the payload.

**SSE.** Two decisions dissolve most of the security surface: **events are thin signals**
(`{type, entityId}`) so authorization is never duplicated into a payload and backpressure is a
non-issue; and **no `Last-Event-ID` replay** — reconnect triggers a refetch, because the database is
the source of truth and the stream is only a hint. Fetch-based streaming, not `EventSource`, since
`EventSource` cannot set headers the future bearer path needs. ~3 streams per user; heartbeat;
finite lifetime.

**Observability — no OpenTelemetry, no Grafana, and here is what replaces them.** Sentry is the
**alerting** surface; a small Postgres-backed admin operational panel is the **metrics** surface.
**Sentry Crons** monitors the nine scheduled jobs, answering "did reconciliation quietly die?" with
zero new infrastructure (V14). Performance tracing **sampled ~10%**, with payment and AI paths always
traced — full tracing would exhaust the free tier in days. **(E9) Session Replay disabled**: it would
capture private messages, offer amounts and PII, contradicting the logging boundary. **(E8)
`bull-board` is development-only and never mounted in production.**

**Eight alerts, everything else is a dashboard:** failed refund · payment `PROCESSING` > 30 min ·
webhook signature failures above threshold · missed scheduled-job check-in · rate-limit fallback
engaged · AI spend over threshold · stale worker heartbeat · exception-rate spike.

**Health.** `/health` liveness with **no dependency checks** — a Redis blip must never restart the
API. `/ready` checks **Postgres only**, the sole readiness-critical dependency. `/health/detail` is
admin-only and reports per-dependency status with an overall `degraded`, so a non-critical provider
outage never makes the API look down. **(E7) Never actively probe paid providers** — report the last
observed outcome from real traffic. A health check that calls Gemini spends money.

**(E10)** `SearchEvent` must not block the search response path. **Ops endpoints** live in a small
application-level ops surface, not a new module — they own no domain data, consistent with there
being no admin module.

**CI/CD and supply chain.** All gates from the first commit: lint, strict `tsc`, tests, OpenAPI drift,
migration validation, destructive-migration detection, module boundaries, `npm audit` on **critical
only** (failing on `high` in a large transitive tree produces CI paralysis, and a gate everyone
bypasses protects nothing), gitleaks, generated-client freshness. Protected `main`, least-privilege
workflow permissions, **third-party actions pinned to commit SHAs** — a tag can be re-pointed at
malicious code. Dependabot with **grouped weekly** routine updates and immediate security updates;
the weekly grouping is itself the practical anti-supply-chain control, since most malicious publishes
are caught within hours to days.

**Browser policy.** CSP belongs on Vercel-served documents. Asymmetric rollout: **enforced locally
from day one** for fast feedback, **Report-Only for the first production week** because production
exercises paths local development never hits, then enforced. `frame-src 'none'` is available to us
**because we chose hosted redirect checkout** and never embed the provider.

**Rejected:** Kubernetes · Terraform · ECS · service mesh · OpenTelemetry collector · Grafana ·
Prometheus · enterprise SIEM · WAF product · CASL/Casbin · RLS · CSRF token system · WebSockets ·
ClamAV · Morgan · Winston · `bull-board` in production · active health probes of paid providers.

---

### #34 — Logging: Pino
`2026-09-05` · **LOCKED** · Ops · *Replaces the previously stated Morgan + Winston*

**`pino` + `pino-http`**, structured JSON to stdout, `pino-pretty` in development only.
**Morgan and Winston are both removed.**

**The decisive argument is correlation, not redundancy.** Morgan emits a text access line knowing
nothing about the request id; Winston emits JSON knowing nothing about the request unless context is
threaded manually. So when a payment fails at 03:14 you have an access line and five application
lines with **no shared key**, and you reconstruct the request by timestamp — exactly the debugging
logging exists to avoid. With `pino-http` plus AsyncLocalStorage, **every line inside a request
automatically carries `requestId`, `userId` and `route`.**

Secondary: JSON by default (Winston's API nudges toward unqueryable string concatenation), built-in
`redact` paths, lower overhead. Railway and Vercel ingest stdout, so no transports are needed.

**What is genuinely lost:** Morgan's `dev` one-liner (replaced by `pino-pretty`), Winston's
transports (unneeded — `pino-roll` exists if rotation is ever required), and some ecosystem
familiarity. **Nothing structural.** Sentry integrates with both equally.

**Attached implementation requirement:** the AsyncLocalStorage context must be established once,
correctly, at the request boundary. Done wrong, correlation is absent and nothing has been gained.

**Redaction is not a production feature** — local logs reach terminal scrollback, screenshots and
gists. Redact `authorization`, `cookie`, `*.password`, `*.token`, `*.secret`, `*.hmac`, `*.apiKey`.

---

### #35 — Email-verification guards and invariants I11 / I12
`2026-09-05` · **LOCKED** · Domain · *Amends #5* · **Guard list superseded in part by #38** · Affects: `product/BUSINESS_RULES.md`

**Context.** Two gaps surfaced during the security review. First, Decision #11 proposed gating
transactions on email verification — but the locked V1, O1 and Y2 guards contained no such
requirement, so a security decision was silently contradicting a business rule. Second, tracing
Tier B fail-open against the invariants showed **saved searches and offers had no business bound at
all**.

**Decision.**
- **`emailVerified = true`** is now a guard on **V1** (viewing request), **O1** (submit offer) and
  **Y2** (initiate deposit payment). Unverified users may still browse, search, view, favourite and
  save searches. **This is a business rule enforced in the service layer, not middleware** — which is
  why the AI tool `createViewingRequest` inherits it automatically.
- **I11 — max 25 saved searches per user.**
- **I12 — max 5 live offers per buyer across all properties**, with **live** defined exactly as
  `{PENDING_AGENT, PENDING_BUYER, ACCEPTED, RESERVED}` (`BUSINESS_RULES.md` §4.1). `RESERVED` counts
  deliberately: a buyer holding a reservation while negotiating five more properties is precisely the
  over-extension the rule bounds.

**Rationale for I11 specifically.** Every saved search is evaluated against every newly published
property. Ten thousand saved searches don't merely consume storage — they multiply the work of a job
that runs on every publish. **A rate limiter is the wrong tool**: limits are per-window, and this
damage persists after the window closes. An invariant is permanent.

**Concurrency consequence.** I9, I11 and I12 share a shape — *"at most N rows for this user"* — and
all three are **write-skew** vulnerable, which `READ COMMITTED` cannot prevent and no unique
constraint can express. All three are enforced by a **transaction-scoped advisory lock keyed on the
user id**, in one shared namespace. **This extends Decision #10**, which identified two lock
escalations; I11 and I12 join the viewing-request cap under the same mechanism.

**Left open, deliberately:** **O5** (buyer accepts an agent-initiated offer) carries no verification
guard. It is covered transitively because Y2 blocks the resulting payment, but the failure surfaces
later than ideal. Not changed without approval.

---

### #36 — Email provider: Resend
`2026-09-05` · ⚠️ **PROVISIONAL — pending verification (V18)** · Ops

**Context.** Email had been referenced repeatedly but never decided, while verification, password
reset, notifications and saved-search digests all depend on it.

**Compared:** Resend · Postmark · AWS SES · SendGrid.

**Selected: Resend**, on three Settly-specific grounds. **React Email is the same stack** — templating
bilingual transactional email as React components with the same `dir="auto"` considerations as the UI
is a genuine fit. **No onboarding friction** — AWS SES accounts start in a sandbox requiring manual
approval before sending to unverified addresses, potentially days, which blocks a working signup flow.
And **bounce/complaint webhooks without extra infrastructure**, treated as a **v1 requirement**: a
hard-bounced address that keeps receiving verification emails degrades sending reputation.

**Honest counter, recorded:** **Postmark is genuinely better on deliverability**, the axis that
matters most for a product whose signup depends on email arriving. Its free tier is simply thin for
a portfolio. If deliverability is prioritised over developer experience, Postmark is the right call.

**Rejected:** SES (sandbox friction, IAM/SNS overhead, reputation warmup you own — disproportionate
here despite being cheapest at scale); SendGrid (dated DX, weakest free-tier shared-IP
deliverability).

**Two rules regardless of provider:** local development previously proposed Mailpit, but by **Decision #44 Resend is locked across all environments** (development, testing, and production) to deliver real emails to real test inboxes (Gmail/Outlook). Bounce and complaint webhooks are wired in v1.

**Status: LOCKED by Decision #44** (formerly provisional). Mailpit eliminated from the project.

---

### #37 — Environment model and the substitution rule
`2026-09-05` · **LOCKED** · Process · Affects: `process/ENVIRONMENT.md` *(Tier B)*

**The project is in local development. No deployment exists.** The Vercel/Railway/Supabase topology
(#22) is the intended future target and is **not a current requirement**.

| | Local (now) | Production (future) |
|---|---|---|
| Frontend | `localhost:3000` | Vercel, `app.settly.com` |
| API | `localhost:4000` | Railway, `api.settly.com` |
| Worker | Local process | Railway service |
| Postgres | Docker + PostGIS + pgvector + pg_trgm + btree_gist | Supabase |
| Redis | Docker or Upstash Redis | Upstash Redis (managed, #44) |
| Email | **Resend** (real inbox delivery, #44) | Resend (locked, #44) |
| Sentry | Off | On |

**A custom domain is a deployment prerequisite, not a development blocker** — correcting an earlier
over-weighting. And the local model is a faithful rehearsal rather than a compromise: **`localhost:3000`
and `localhost:4000` are same-site**, because `SameSite` is evaluated on the registrable domain and
ports are not part of it. `SameSite=Lax` therefore behaves locally exactly as it will across
production subdomains.

**Governing rule: every environment difference is a configuration value, never a code branch.
No `if (isProduction)` around a security control.**

**Identical across environments:** authorization · business rules · state machines · transactions ·
idempotency · database constraints · Zod validation · audit behaviour · rate limits · request ids ·
**log redaction**.

**Legitimately different:** cookie `secure` and `domain` · CORS origins · HSTS · CSP enforcement mode ·
log format and level · Sentry on/off · `bull-board` presence.

**The one sanctioned weakening:** Argon2id parameters may be reduced **in the automated test suite
only**, behind an explicit flag — not in local development, where the real login cost should be felt.

## The substitution rule

> **Substitute where the security or behavioural control belongs to Settly. Use the real external
> service where the service itself owns a behaviour we need to exercise.**

| Service | Local | Why |
|---|---|---|
| **Cloudinary** | **Real**, `dev/` folder | **EXIF/GPS stripping and re-encoding are theirs.** A local substitute means the control protecting property locations is never once executed before production |
| Supabase Storage | Local adapter | Magic bytes, authorization and audit are **ours**; only signed-URL issuance is theirs |
| **Paymob** | **Fake adapter** + local webhook signer | HMAC verification, amount assertion and the state machine are **ours**. The four-method port from #13 pays off exactly as justified: the full state machine, every race and the atomic bundle run locally with no network. ⚠️ **One sandbox test remains mandatory** to confirm the real HMAC field ordering (V4) |
| Gemini | Real, **prompt-hash response cache** | Quality is theirs. The cache makes iterating on a RAG prompt twenty times free |
| **Email** | **Resend** (real delivery to developer inbox) | Delivery is theirs; eliminates dev/prod divergence and verifies real DKIM/SPF and rendering (#44) |
| FCM | No-op adapter, logs payload | Delivery is theirs; the decision to send is ours and still runs |
| Google Geocoding | Fixtures | Called once per listing, deterministic |
| Sentry | Off | — |

**Rate limiting is not disabled locally.** Disabling it means never exercising the 429 path or the
client's handling of it, and first seeing it in production. A per-test bypass token covers tests that
must exceed a limit.

---

### #38 — The verification boundary
`2026-09-05` · **LOCKED** · Domain · *Amends #5, supersedes the guard list in #35* · Affects: `product/BUSINESS_RULES.md` §9.1, `GLOSSARY.md`

**Context.** #35 guarded V1, O1 and Y2 on `emailVerified`, and explicitly left **O5** open. Reviewing
that gap surfaced a defect rather than an inelegance, and a second gap alongside it.

**The O5 defect.** O5 (`PENDING_BUYER` → `ACCEPTED`) *creates a `Payment` obligation and starts the
72-hour deposit clock*. An unverified buyer accepting therefore produced: a payment row, a running
countdown, an agent notified that a deal was progressing, and a consumed I12 live-offer slot — for
an actor structurally unable to reach Y2. **The only downstream path was expiry.** The design was
"technically safe" solely in the sense that no money moved.

> **A state machine must not permit a transition whose sole outcome is an obligation the actor
> cannot fulfil.**

**The O3 gap.** With O1 guarded, the only route to `PENDING_BUYER` while unverified is **O1b**, the
agent-initiated offline offer. From there an unverified buyer could counter-offer (O3) indefinitely —
generating `OfferRevision` rows and agent notifications — while permanently unable to accept. A
counter-offer *is* an offer submission.

**Options.**
- **(a)** Guard O5 only, and record O3 as a deliberate exception
- **(b)** Guard O3 and O5, and **replace the list with a principle** ← chosen

**Decision — the verification boundary:**

> **Email verification is required for any buyer transition that creates or advances a financial
> obligation or a scheduled commitment. It is never required to withdraw, cancel, or read.**

Applied: **V1, O1, O3, O5, Y2** guarded. Withdrawal (O7, O8), cancellation (V6, V7), browsing,
search, property views, favourites and saved searches are not.

**Rationale for a principle over a list.** A list of transition ids must be remembered and extended
by hand every time the state machines grow, and the O5 gap is precisely what happens when someone
forgets. A principle answers the question for transitions that do not exist yet, without
re-litigating this decision.

**Exit is never guarded — and this is load-bearing, not politeness.** Blocking withdrawal would trap
an unverified buyer inside a live offer, consuming an I12 slot and holding an agent's attention, with
no way out. **A verification requirement must never become a state a user cannot escape.**

**Resulting behaviour for O1b.** An agent may record offline-agreed terms against a buyer regardless
of that buyer's verification state — the agent is the actor and cannot be expected to know it. The
unverified buyer may then review or withdraw, but may not counter, accept or pay. **Two paths:
verify, or withdraw.**

**Unchanged.** #35's invariants I11 and I12, its write-skew analysis, and the shared advisory-lock
mechanism all stand. The AI path is unaffected — `createViewingRequest` routes through V1 and
inherits the guard automatically. Nothing else from Decision #11 (#33, #34, #36, #37) changes.

**Noted, not decided.** For the Egyptian market, email as the *sole* verification channel is worth
revisiting later given mobile penetration versus email engagement. #9 chose email links over SMS OTP
primarily on cost. A separate decision, deliberately not opened here.

---

### #39 — Domain Model Reconciliation (high impact)
`2026-09-05` · **LOCKED · embedding lifecycle sync refined by #42 · language scope (§3, §5, §6, §8) deferred for V1 by #99 — V1 is English only end to end** · Domain · *Amends #3, #6, #21, #23, #24, #27 · Reverses #4, #15 · Completes #9*
Affects: `GLOSSARY.md`, `product/BUSINESS_RULES.md`, and every Tier-B architecture document

**Context.** Decision #3 named 36 models. Decisions #9, #14, #15, #24 and #33 then changed what those
models must contain, and **nothing closed the loop** — leaving the data model as the last blocker on
the first migration. Mid-decision, a new product requirement arrived: **the UI must be fully
bilingual (`/en` + `/ar`) with RTL**, which reversed #4 and forced the content model to be
re-derived from scratch.

---

#### 1. Better Auth identity reconciliation

**`user` is Better Auth's table, extended via `additionalFields`. There is no parallel Settly `User`
or `UserProfile`.**

The deciding constraint is not taste: **`role` and `banned` must live on Better Auth's `user`**,
because the admin plugin's ban check runs inside session validation — and that mechanism *is* the
immediate-suspension requirement from #9. A Settly-owned status column would not be read by Better
Auth, and suspension would stop being immediate, reintroducing exactly the staleness that
disqualified stateless JWTs. With the two most important identity attributes pinned there by the
architecture, a second table would split identity semantics across two places for three leftovers.

| Resolution | |
|---|---|
| `User` | → Better Auth's `user`, extended |
| `Session` | → Better Auth's `session` (reclassified, not removed) |
| **`AuthToken`** | ❌ **REMOVED** — duplicates Better Auth's `verification` |
| ➕ **`account`** | **Holds the password hash.** Was absent from the 38-model inventory entirely |
| ➕ **`verification`** | Replaces `AuthToken` |
| `AgentProfile`, `UserDevice` | ✅ Settly-owned |
| `BuyerProfile` | **Not created** — the #17 preference profile is *derived* from saved searches and favourites |

**FK root: `user.id`, UUIDv7 (V5).**
⚠️ **No `ON DELETE CASCADE` from `user` to any business table** — we anonymise rather than delete
(§7 below), and a cascade would be a loaded gun for anyone who later ran one.

**`preferredLocale` added as a Settly `additionalField`** — and this reverses an earlier "no locale
field" position. Under an English-only UI it was speculative. Under a bilingual UI it is **required
by the notification architecture**: a worker rendering an email or push has no cookie and no request
context, so the recipient's locale must be persisted. A cookie also fails to follow the user across
devices. One scalar column, load-bearing. Exact `additionalFields` capability is **V19**.

---

#### 2. Document visibility

| Scope | Retrieve | Download | RAG |
|---|---|---|---|
| **`PUBLIC`** | Anyone who can view the property | Same | Every actor |
| **`PARTY`** | Owning agent + any buyer with a **live offer** (`BUSINESS_RULES.md` §4.1) | Same, audited | Those actors only |
| **`PRIVATE`** | Uploader only | Uploader; **admins via a separate audited path** | Uploader only |

Three, not six: `AUTHENTICATED` has no use case distinct from `PUBLIC`; `AGENT_ONLY` and
`ADMIN_ONLY` collapse into `PRIVATE` plus the admin path that exists for every scope. **Admin access
is a path, not a scope** — consistent with #33's admin boundaries.

⚠️ **`Embedding` carries `visibilityScope` denormalised**, so the RAG security filter is a predicate
on the chunk rather than a join. If visibility lived only on `Document`, every RAG query would join
inside a vector search — the filtered-ANN problem #6 avoided. **A security filter that costs recall
is one someone eventually moves after retrieval**, which leaks through result counts and timing.

---

#### 3. Multilingual content model

> **Deferred for V1 by #99:** V1 content is English only. The Arabic columns below are **kept for
> future compatibility, optional and unused in V1 (#101)**. The "at least one pair" wording is
> superseded for V1: English content is what V1 requires.

**The requirement that decided it:** content may be Arabic-only, English-only, **or both**. A single
`language` column with one title/description pair **cannot represent a bilingual listing** — so the
model originally proposed in this decision was rejected on its own terms.

**Chosen: parallel nullable columns** — `titleEn`, `descriptionEn`, `titleAr`, `descriptionAr`, with
a check constraint requiring at least one pair. **No `language` column** (it would contradict itself
on a bilingual listing).

| Rejected | Why |
|---|---|
| **`PropertyTranslation`** | Puts a **join in the hottest query in the product, permanently**, for a third language with no stated requirement. It would also split content from the vector, which #6 pins to the `Property` row |
| JSONB content blob | You cannot build a per-language **ranked `tsvector`** from JSONB in a generated column. Trades away the search system to save a migration |
| Hybrid primary + variants | The same concept in two places; every read checks both |

**Honest trade recorded:** a third content language would require a migration. Judged unlikely for an
Egypt-focused product (#1 excluded multi-country), and a one-time cost against a permanent daily one.
`PropertyTranslation` would win if N languages or per-language moderation were real requirements.

**Same parallel pattern for `KnowledgeArticle`** (our editorial content, intended in both languages).
**`Document` is deliberately different** — a single detected `language`, because you do not translate
a PDF.

**Bilingual reference data:** `Area` gains `nameEn`, `nameAr` and **`aliases text[]`** (GIN-indexed),
so the query-understanding gazetteer resolves `التجمع الخامس`, `التجمع`, `5th Settlement` and
`New Cairo` to one area. **No `AreaAlias` model** — aliases are admin-maintained reference data.
`Amenity` gains `nameEn`, `nameAr`.

**Second #3 overlap corrected:** #3 gave `Area` *"guide content"* **and** gave `KnowledgeArticle`
*"area guides"* — the same content described twice. **`Area` now owns identity and geometry only**
(names, aliases, slug, parent, level, boundary, centroid); **long-form guides move to
`KnowledgeArticle`**, linked by `areaId`. `Area` is touched by every search filter; it should not
also carry RAG-chunked prose.

---

#### 4. Canonical English — REVERSED (#15)

Both of #15's justifications collapse under a multilingual embedding model:

- *"Cross-language lexical search starts working"* → superseded. Two FTS vectors handle same-language;
  **the semantic arm handles cross-language**, which is what it exists for
- *"Consistent embedding space"* → **normalising language before embedding partially defeats the
  point of choosing a multilingual model**

And the costs were real: an **LLM call in the property publish path** (cost, latency, a new failure
mode), translation drift, an extra pipeline stage with its own status and sweeper, and —
strongest — **hallucination silently affecting ranking**. The earlier containment argument ("never
displayed") was weaker than claimed: a hallucinated feature makes a property match queries it should
not, a relevance bug with no user-visible symptom. It also became redundant whenever an agent
authored English themselves.

**What is given up:** cross-language *lexical* precision. Accepted — that is what the semantic arm is
for, and RRF means one firing arm suffices.

---

#### 5. FTS architecture — amends #6

> **V1 (#99):** only the English vector is in scope. `searchVectorAr`, Arabic normalisation and
> code-switched queries are deferred with Arabic search.

**Two GENERATED tsvector columns**: `searchVectorEn` (`english` config) and `searchVectorAr`
(`simple` + deterministic Arabic normalisation), each GIN-indexed. Plus `pg_trgm` on both title
columns, `Area` names and aliases, and agent names.

**Both can be generated columns because each configuration is fixed — so #6's trigger requirement
disappears.** It existed only because the config varied per row.

**Query both vectors, take the better rank, feed RRF.** This is not a fallback but the common case:
Egyptian users **code-switch inside a single query** (`شقة 3 غرف في New Cairo`), and a single vector
would silently discard half of it.

**Arabic normalisation** (alef unification, yeh, teh marbuta, tatweel/diacritic stripping, leading
`ال` removal) is applied identically to indexed text and to the query. Postgres ships no Arabic
stemmer, and without normalisation `الشقة` cannot match `شقة`. Deterministic and immutable, so the
column stays generated. Quality is **V24**.

---

#### 6. Embedding architecture

> **V1 (#99):** the single vector is built from English content. Cross-language retrieval and V23
> are deferred.

**One multilingual vector per `Property`**, as a **column**, partial HNSW `WHERE status='PUBLISHED'` —
#6 preserved intact. Composed from whichever authored content exists (both languages when both are
present) plus the structured attributes from #17.

One-vector-per-language and one-per-translation were both rejected: semantically equivalent AR and EN
text maps to **near-identical vectors**, so storing both means **the same property retrieved twice,
requiring dedup**, at roughly double the index size and with the partial-index predicate lost.

**Consequence:** with canonical English gone, the multilingual model is **solely** responsible for
cross-language retrieval, making **V23** the highest-stakes verification item in the project.

---

#### 7. Privacy and account lifecycle — structural implications only

**Deletion is anonymisation, not deletion**, because payments, refunds, offers and audit entries must
survive. Structurally: `user.anonymizedAt`; PII overwritten in place; **`account`, `session` and
`UserDevice` rows genuinely deleted**; `banned = true`; the unique email constraint preserved via a
**non-routable placeholder** rather than a null. Messages survive with an anonymised author, or the
counterparty's conversation becomes incoherent. `AuditLog.actorId` points at a surviving row, so the
trail stays intact by construction. Retention windows for `SearchEvent`, `PropertyViewEvent` and
`AiMessage` are **policy for a later decision**; the model only needs an indexed `createdAt`.

---

#### 8. AI and frontend language behaviour

> **Superseded for V1 by #99** (amended 2026-09-17): the UI locale, localized routes, RTL,
> `hreflang` **and** the AI response-language behaviour below are all deferred. V1 AI answers are
> English only.

**Detect language per message**; `preferredLocale` / UI locale is a tiebreaker only; **respond in the
detected language**; **no conversation-level language state and no language model**. Egyptian users
code-switch constantly, so a locked conversation language would be wrong within three messages —
per-message detection supports switching for free because there is no state to switch. Detected
language stored as a field on `AiMessage`.

**An Arabic query legitimately retrieves English sources and the assistant answers in Arabic citing
them.** Correct behaviour, not a bug.

**Localized routes (amends #23):** every public route gains a locale segment. SSG pages 9 → 18;
`generateStaticParams` becomes locale × params; ⚠️ **publish, price and status changes must
invalidate BOTH locales** — miss this and half your users see stale prices. Middleware now carries
locale resolution alongside the auth cookie-presence check, and auth redirects must preserve the
locale.

**RTL is first-class (amends #21):** `dir` on `<html>`; **logical CSS properties throughout**;
mirrored directional icons; reversed table and form order; chart axis orientation and map control
placement (**V26**). **`dir="auto"` on user content survives and generalises** — an English
description inside an RTL page needs LTR rendering, and vice versa.

**SEO:** one shared Latin slug in v1 (percent-encoded Arabic URLs look broken on WhatsApp, the
dominant sharing channel in Egypt); `hreflang` `en`/`ar`/`x-default`; **each locale canonical to
itself**; localized metadata and `inLanguage`; one sitemap with alternates.

**No `Translation` model for UI strings** — static message catalogs versioned with code. **No
`NotificationTemplate`** — `Notification` stores a `type` + `params` JSON and renders at display
time, so a user switching locale sees their existing notifications in the new language. That is also
why `Notification` needs no language field.

**Language metadata goes only where it carries information:** `Document` (detected), `Embedding`
(chunk), `AiMessage` (detected), `SearchEvent` (**zero-result rate per language is a direct product
signal**). **Not** on `Property`, `KnowledgeArticle`, `Area`, `Amenity`, `Message` or `Notification`.

---

#### 9. Final inventory — **39 tables · 4 Better Auth-managed · 35 Settly-owned**

Identity 6 · Catalog 6 · Engagement 4 · Pipeline 5 · Payments 5 · Communication 3 ·
Knowledge & AI 6 · Analytics & governance 4.

Derived, not targeted: 38 − 1 (`AuthToken`) + 2 (`account`, `verification`) = 39.
**The bilingual reversal added zero models** — parallel columns are fields, message catalogs are
code, and `preferredLocale` is one scalar.

---

#### 10. Why this is still minimum sufficient

**The architecture became simpler under a harder requirement.** Bilingual UI, bilingual content and
four-direction retrieval, yet we **removed** a pipeline stage (canonicalisation), **removed** a
trigger, and added **no models** — because the multilingual embedding model does the work
canonicalisation was invented to fake.

> ⚠️ **Explicitly evaluated and rejected. Implementation must not reintroduce these because the
> patterns are familiar:** `PropertyTranslation` · `AreaAlias` · `BuyerProfile` · `UserProfile` ·
> a canonical-English pipeline · `Translation` (UI strings) · `NotificationTemplate` ·
> `CheckoutHold` · `NotificationDelivery` · `PropertyStatusHistory` · `PropertyRevision` ·
> `AiToolCall` · `AgentStep` · `DailyPropertyStat` · `OutboxEvent` · `City`/`District` ·
> `Favorite` · `ConversationParticipant` · a double-entry ledger · agency/organization models.

Roughly twenty tables not built, each with a stated reason. Every model in the 39 traces to a locked
journey, state machine, invariant or security control — and the two additions exist because **an
authentication library needs somewhere to put a password hash and a verification token.**

**No business rules changed.** State machines, invariants and the verification boundary are untouched.

---

### #40 — API Contract Shape (high impact)
`2026-09-05` · **LOCKED** · API · *Extends #8 · Refines #14's HTTP projection · Closes an #8 flag*
Affects: `architecture/API.md` (Tier B), `GLOSSARY.md`

**Context.** #8 locked the API *style* — REST, `/api/v1`, OpenAPI generated from Zod, RFC 9457,
cursor pagination, SSE. It did not lock the *shape*, and the frontend's generated client (#18) is
derived from that shape. Retrofitting an envelope or an error taxonomy across a finished API and a
generated client is mechanical but miserable, so it is cheap now and expensive later.

---

#### 1. Response envelope — bare resources, wrapped collections

Single resources, and the results of `POST`/`PATCH`, are returned **bare**. `DELETE` returns `204`.
Collections return `{ items, pageInfo }`. Search additionally returns a `search` member carrying the
interpreted-filter chips, the degraded-arm list and the applied sort (#14 requirements).

**A universal `{ data, meta }` envelope was rejected on two concrete grounds.** `openapi-fetch`
already returns `{ data, error, response }` at the transport layer, so an envelope produces
`result.data?.data.title` on **every call site, forever**, in a codebase where the generated client is
the only way the frontend reaches the API. And the usual extensibility argument — being able to attach
per-viewer `meta` later — **does not apply here**, because #39 forbids reading per-user state on
public pages at all: it destroys ISR. Viewer state is fetched separately by design.

**The wrapper key is `items`, not `data`**, chosen specifically so it can never collide with the
transport layer's `data`.

⚠️ **Chips carry `kind` + machine `value`, never a label.** The frontend renders the wording in the
active locale — the same language-neutrality rule as the error taxonomy. **The backend never emits
user-facing prose in either language** (#39).

---

#### 2. ⭐ State transitions are action endpoints, not `PATCH status`

```
  ❌  PATCH /offers/:id { status: "ACCEPTED" }
  ✅  POST  /offers/:id/accept · /counter · /withdraw · /reject
  ✅  POST  /properties/:id/submit · /publish · /reject · /archive
```

**The most consequential naming decision in this contract.** A `status` field in a PATCH body invites
arbitrary state-setting and forces authorization to become per-field — which is precisely how state
machines get bypassed. An action endpoint maps to **exactly one transition**, with its own guard,
Zod schema, authorization, side effects, idempotency semantics and concurrency behaviour.

**The payoff is legibility:** the endpoint list becomes a **direct mirror of the transition tables in
`product/BUSINESS_RULES.md` §2–§5**. An implementer can read the two side by side.

`PATCH` remains for genuine mutable attributes — title, price, description.

---

#### 3. Pagination

**Cursor** for search, feeds, messages and notifications: `?cursor=<opaque>&limit=<n>` →
`{ items, pageInfo: { nextCursor, hasNextPage } }`. Default 20, max 100.

| Rule | |
|---|---|
| **Opaque cursors** | Base64url, version-prefixed — so the internal keyset can change without a contract break, and clients cannot construct cursors that break ordering |
| Contents | Sort key + `id` tiebreaker + sort token. **Never filters, never authorization** |
| ⚠️ **Sort-change guard** | The cursor encodes its sort token; a mismatched request `sort` → **400**. Changing sort mid-pagination silently produces duplicates and gaps |
| ⚠️ **Total ordering required** | **Every cursor endpoint sorts on a column *plus* `id`.** Without a tiebreaker, rows are skipped and repeated |
| No `totalItems` | An exact count on a filtered search costs a full scan for a number nobody acts on |
| Malformed cursor | **400** `/errors/invalid-cursor` |
| **Expired search context** | **410** `/errors/search-context-expired` |

**`410` is a real case, not a hypothetical:** #26 caches the top-500 ranked list for ~5 minutes, so
paginating past that window means the context is genuinely gone. A distinct status lets the client
silently re-run the search — whereas restarting at page 1 produces an **infinite scroll loop**.

**Offset** for admin tables only: `?page=1&pageSize=50` with totals. Page numbers are the point there,
and the `COUNT` is affordable at admin volumes.

---

#### 4. Error taxonomy

RFC 9457 `application/problem+json`. **`type` *is* the application error code** — there is no second
`code` field, because two identifiers means two sources of truth and inevitable drift.

**`type` uses relative URIs (`/errors/…`).** RFC 9457 permits a URI *reference*, and absolute URIs
would embed a domain into the wire contract that isn't yet established.

Extension members: `requestId` · `params` (localization inputs) · `errors[]` for field validation as
`{ path, code, params }`.

> **Governing rule: the backend is language-neutral. `title` and `detail` are developer-facing English,
> logged and never rendered. The frontend maps `type` + `params` + `errors[].code` to localized
> strings.**

This is why **validation errors carry a code and parameters, never a message**. `{ path: "price",
code: "too_small", params: { min: 0 } }` renders in either language; English prose does not. With
`/en` and `/ar` both live (#39), any user-facing English crossing the wire is a defect.

**~16 types: 8 generic** (validation-failed, unauthenticated, forbidden, not-found, conflict,
rate-limited, internal, service-degraded) **and 8 domain-specific**, each existing only because the
frontend must behave differently: `email-not-verified` (#38 CTA) · `account-suspended` ·
`quota-exceeded` (I11/I12, with limits in `params`) · `state-conflict` · `checkout-hold-unavailable`
(#11) · `idempotency-key-reused` · `idempotency-in-progress` · `search-context-expired`.

> **The rule that prevents hundreds of types: add one only when the frontend must render or behave
> differently. Otherwise use a generic type and put specifics in `detail`.**

`state-conflict` carries `params: { entity, currentState, attemptedTransition }` — **one type covering
roughly forty state-machine transitions** rather than forty types.

---

#### 5. Resource naming, nesting, and the leak rule

**Nest only when the child cannot exist without the parent *and* the parent scopes authorization.
Maximum one level.** `/properties/:id/images` and `/offers/:id/revisions` qualify;
`/properties/:id/offers` does not — an offer belongs to a buyer *and* a property, so nesting would
create two canonical URLs for one collection. Use `/offers?propertyId=`.

**`/me/*` for self-scoped collections**, not `/users/:id/…` — it makes the scoping visible and
**removes the IDOR surface entirely, because there is no id to tamper with**.

**`/admin/*` for admin-only collections and views** (moderation queue, users, audit log, reports).
**Admin actions on domain resources stay on the resource** — `POST /properties/:id/publish` with a
role guard — because duplicating transition endpoints under an admin prefix would mean two paths into
one state machine.

**The information-leak rule:**

> **`404` when the actor may not know the resource exists. `403` when they may know it exists but may
> not act on it.**

A buyer requesting another buyer's offer, or a `DRAFT` property, gets **404**. A verified-email guard
on a property the buyer *can* see gets **403 `email-not-verified`** — hiding it would confuse and
leaks nothing. Wrong turn in a state machine gets **409 `state-conflict`**.

⚠️ **A "doesn't exist" 404 and a "not yours" 404 must be byte-identical**, and must not differ
meaningfully in latency — an authorization check measurably slower than a primary-key miss
reconstructs the leak the status code was chosen to prevent.

**HTTP status is the observable contract, not the security boundary.** Enforcement lives in the
service-layer policy functions (#33); OpenAPI documents what a caller observes.

**Closes an #8 flag:** Better Auth's routes sit at **`/api/auth/*`, outside `/api/v1`, and are
excluded from our OpenAPI spec** — deliberately, because that surface is a library-owned contract with
its own client, and versioning it under `/v1` would imply we control its evolution. *(Mount-prefix
flexibility is V31.)*

---

#### 6. Search — the HTTP projection of #14

```
  GET /api/v1/search/properties            → items    (filter · NL · map at high zoom)
  GET /api/v1/search/properties/clusters   → clusters (aggregate map view)
```

**This refines #14 rather than reversing it.** #14's *"three execution paths, one endpoint"* remains
true of the **search service and pipeline**: filter, map and natural-language all execute inside one
service, and the clusters endpoint **must not duplicate any search business logic**. It reuses the
same filters and the same authorization semantics.

The reason for a second endpoint is that **clusters are aggregates, not entities** — `{ lat, lng,
count }` is a different kind of thing from a property. Serving both from one endpoint would require a
discriminated response union, which generates awkwardly in OpenAPI and forces every caller to narrow a
type it already knows statically from the zoom level.

**Request:** `q` · structured filters · `bounds` or `near`+`radiusKm` · repeatable `areaId`/`amenityId`
· optional `contentLang` (#39) · closed `sort` enum (`relevance` · `price_asc` · `price_desc` ·
`newest` · `distance`) · `cursor` · `limit`.

**`sort=relevance` is rejected with 400 when `q` is absent** — there is no relevance without a query,
and silently substituting another order is a lie the client cannot detect.

**Never exposed:** arm timings, RRF scores, ranking internals. Those go to `SearchEvent` and logs.

---

#### 7. Idempotency HTTP semantics

**`Idempotency-Key` is REQUIRED** on the four locked operations (#10) — create payment attempt,
request refund, create viewing request, submit offer. **Required, not optional**, because an optional
protection is the one clients forget precisely when it matters; OpenAPI declares it a required header
so the generated client cannot omit it. Missing → **400**.

Opaque URL-safe string, 16–128 chars. Scoped **per (user, endpoint, key)**.

| Case | Response |
|---|---|
| Same key, same payload | **Stored response with its original status code** (`201` stays `201`) + **`Idempotent-Replay: true`** |
| Same key, different payload | **422** `/errors/idempotency-key-reused` |
| First request still running | **409** `/errors/idempotency-in-progress` + `Retry-After` |
| Expired (24h) | Treated as a new operation — documented and accepted |

**Keys stay in Postgres** (#10). `Idempotent-Replay` exists because without it a replay is
indistinguishable from a fresh success, which makes the mechanism untestable end to end.

---

#### 8. Query conventions

**A single `sort` token from a closed enum** — `price_asc`, **not** `sort=price&order=asc`. Two params
permit combinations that do not exist (`sort=relevance&order=desc`) and cannot be expressed as an
allowlist. One enum becomes a Zod literal union → a TypeScript union in the generated client, so
**invalid sorts are a compile error rather than a runtime 400**.

Ranges as `minPrice`/`maxPrice`. Repeatable filters as `?areaId=a&areaId=b`. Dates ISO 8601 UTC.
Shared parameter names across every endpoint.

⚠️ **No generic filter DSL** — no `?filter[price][gte]=`, no RSQL, no arbitrary operators. This is the
contract-level expression of #33's rule that **dynamic SQL identifiers come from a closed allowlist**;
a filter DSL is exactly the door that rule closes.

---

#### 9. Versioning

**Breaking** (needs `/v2`): removing or renaming a response field · changing a type · tightening
validation · changing a success status · changing a `type` value's meaning · ⚠️ **adding a value to a
*response* enum**, which breaks strictly-typed generated clients — ours included.

**Additive**: new optional request fields · new response fields · new endpoints · new optional query
params · **new error types**.

**Two contract obligations that make additive change safe:** clients must **ignore unknown response
fields**, and must have a **default branch for unknown error types**.

**Deprecation** via OpenAPI `deprecated: true` plus `Deprecation`/`Sunset` headers. **A field may only
be removed after the frontend using it is retired** — which matters precisely because the two deploy
independently (#18), so a live frontend always outlives a backend change for some window.

No per-endpoint versioning, no query-string versioning, no vendor media types.

---

#### 10. OpenAPI workflow

```
  Zod schemas (runtime validation) → openapi.json (committed, CI drift gate)
        → copied to frontend/ (committed) → openapi-typescript → generated client (CI freshness gate)
```

**The backend owns the contract unilaterally.** The frontend never invents a schema; it requests a
change. The spec cannot drift from behaviour because it is generated from **the same Zod schemas that
validate at runtime** (#18) — the property that makes separate projects safe.

**Each project's gate is self-contained. Nothing gates the frontend snapshot against the backend's —
deliberately**, because in production they legitimately differ during every deploy window. A
**non-blocking** CI job diffs them and warns.

---

#### 11. SSE, uploads, observability, bulk

**SSE** — `GET /api/v1/events`: authenticated, user-scoped, **thin events** (`{ entityType, entityId,
at }`) with the client refetching through the normal API; closed event-type enum; heartbeat ~25 s;
3 connections per user; ~30-minute lifetime. ⚠️ **No `id:` field is emitted, deliberately, so clients
never send `Last-Event-ID`** — making the absence of a replay buffer structural rather than merely
documented. AI uses **streamed POST responses** (`/ai/messages`, `/ai/agent-runs`) — one round trip
instead of create-then-connect. No WebSockets.

**Uploads** — `POST /uploads/authorize` → direct client upload to Cloudinary or Supabase Storage →
`POST /uploads/:assetId/complete`. **No multipart endpoint exists anywhere**; bytes never traverse
Express (#33). The finalize step is required for both providers — uniform contract, immediate
feedback, and it is where the provider reference binds to our record. A sweeper re-checks assets stuck
in `PENDING`.

**Observability headers** — `X-Request-Id` (accepted inbound if well-formed, else generated,
**always echoed**) · `RateLimit-*` on Tiers B and C only · `Retry-After` (Tier A returns *only* this,
per #33) · `Deprecation`/`Sunset` · `Idempotent-Replay`. ⚠️ **All must appear in
`Access-Control-Expose-Headers`** — cross-origin responses hide non-safelisted headers by default, so
`X-Request-Id` would be **silently unreadable** from `app.settly.com`. No other custom `X-` headers.

**Bulk operations: none in v1.** Authorization becomes per-item, partial failure needs `207
Multi-Status` (which clients handle badly), and idempotency becomes ambiguous. Where batching has real
product meaning, use an **explicit domain operation** — `POST /me/notifications/read-all` — never
`PATCH /resources { ids: [...] }`.

---

#### 12. Why this is the minimum sufficient contract

Every convention traces to something already locked: action endpoints to the state machines (#5) ·
machine codes to the bilingual UI (#39) · closed `sort` enum and no filter DSL to allowlisted SQL
identifiers (#33) · required `Idempotency-Key` to the four idempotent operations (#10) · `410` to the
search cache (#26) · thin SSE events with no `id:` to the no-replay design (#21) · relative `type`
URIs to not owning a domain · bare resources to `openapi-fetch` ergonomics and #39's client-only
personalization rule · the 404/403 rule to resource-scoped authorization (#33).

> ⚠️ **Explicitly evaluated and rejected — do not reintroduce because the pattern is common:**
> a universal `{ data, meta }` envelope · a separate `code` beside `type` · a generic filter DSL or
> RSQL · `sort` + `order` as two params · HATEOAS/`_links` · field selection `?fields=` · relation
> expansion `?include=` · `207 Multi-Status` · generic bulk CRUD · ETag/`If-None-Match` (a later
> optimization, not v1) · per-endpoint or query-string versioning · vendor media types · API keys.

**Eleven common conventions rejected**, and the error taxonomy is bounded by a stated rule rather than
by discipline alone. **No business rules changed, no models changed** — the 39-table inventory is
untouched.

---

### #41 — Testing Architecture (high impact)
`2026-09-05` · **LOCKED** · Testing · *Extends #8, #10, #13, #27, #37 · Generalises #19*
Affects: `process/TESTING.md`, `process/CONVENTIONS.md`, `process/ENVIRONMENT.md` (Tier B)

**Context.** Testing was decided piecemeal across four decisions — Vitest/RTL/Playwright/MSW (#21),
agent controller tests and the eval suite (#19), the fake payment adapter (#13), concurrency tests
against real Postgres (#13) — and never assembled. That matters more here than in a typical project,
because **the concurrency and idempotency work of #10 is only valuable if it is verifiable**, and
verification has infrastructure consequences.

#### Six layers with hard boundaries

| Layer | Environment | Contains | Must NOT contain |
|---|---|---|---|
| **1 Unit** | none | RRF, Arabic normalisation, cursor codec, guard predicates, chunking, prompt composition, money arithmetic | Anything touching Prisma, HTTP or wall-clock time |
| **2 Service** | **Real Postgres** | Every transition, guard, invariant, policy function, transaction boundary — **all 45 transitions in `product/BUSINESS_RULES.md` §2–§5** | HTTP concerns, response shapes, external calls |
| **3 Database** | **Real Postgres** | Raw SQL in `sql/`, PostGIS, pgvector recall, FTS + trigram, generated columns, every constraint, migrations up/down | Business logic |
| **4 Concurrency** ⭐ | **Real Postgres, serial, no wrapping transaction** | I9/I11/I12 advisory locks, viewing overlap, deposit race, idempotency races, offer CAS | Anything not racing |
| **5 API/contract** | Postgres + Redis | Status codes, RFC 9457 shapes, idempotency semantics, cursor round-trip, rate-limit headers, SSE framing, **the 404-vs-403 leak rule** | Business rules already covered at layer 2 |
| **6 E2E** | Full local stack | ~12 journeys, happy path plus two critical failures | Exhaustive permutations |

**Business logic is tested at the service layer, not through HTTP.** This follows directly from #8:
authorization lives in services, so testing it through HTTP would exercise the wrong boundary and be
an order of magnitude slower.

**Layer 4 is separate for a structural reason:** concurrency tests need genuinely concurrent
transactions, so they **cannot run inside a wrapping transaction** and cannot run in parallel with one
another. Folding them into layer 2 would force the whole suite onto the slowest isolation strategy.
Layers 1–3 and 5 use transaction-rollback isolation and run in parallel; **layer 4 uses truncate and
runs serially.**

#### Real Postgres, never a substitute

> Exclusion constraints over `tstzrange`, partial unique indexes, advisory locks, `READ COMMITTED`
> re-evaluation semantics, PostGIS, pgvector and trigram **do not exist, or behave differently, in
> SQLite or any in-memory substitute.**

A substitute would produce **false confidence in exactly the mechanisms Decision #10 depends on** —
which is worse than having no test at all.

**No Testcontainers.** Docker Compose provides Postgres and Redis locally (#37) and GitHub Actions
service containers provide them in CI. Testcontainers would add a dependency and startup cost to
replicate what both environments already have. *(Service-container extension support is **V32** — a
stock `postgres` image will not suffice.)*

#### Proving the concurrency invariants

This is what makes #10 real rather than asserted. Each runs against real Postgres, serially, **and is
never retried**:

| Invariant | Test |
|---|---|
| I9 / I11 / I12 | N concurrent requests at the limit − 1 → exactly the limit persists, N−1 rejected |
| Viewing overlap | Two confirmations overlapping by one minute → exactly one succeeds |
| **Deposit race** | Two rival webhooks concurrently → one `RESERVED`; **the loser `SUPERSEDED` with a full refund issued** |
| Idempotency | Two identical requests, one key → one execution, one `409` or one replay |
| AuditLog immutability | `UPDATE` and `DELETE` both rejected by the database |

#### Gates versus reports

**Generalising #19's rule from the agent suite to all AI evaluation:**

| CI gate | CI report |
|---|---|
| Layers 1–5 · OpenAPI drift · generated-client freshness · migration validation · destructive-migration detection · module boundaries · `npm audit` critical · gitleaks | **Retrieval evaluation** against the #27 thresholds · agent eval suite · backend↔frontend snapshot skew |

**Evaluation of a non-deterministic system must never gate a deterministic pipeline.** A gate that
fails intermittently is a gate people learn to bypass.

#### Environment and substitution — inheriting #37 and #44

Resend for email locally (real delivery to developer's inbox; Mailpit eliminated per #44; faked in CI) · **fake Paymob adapter with a local webhook signer** (sandbox is a *manual
pre-release check*, never CI) · **Gemini never in gated CI**; evaluation runs separately · Cloudinary
real locally, faked in CI · MSW driven by the **committed OpenAPI snapshot**, so frontend mocks cannot
drift from the contract.

⚠️ **Tests never use the demo seed corpus (#27).** Factories only. Coupling tests to demo data makes
both fragile, and the seed exists to demonstrate the product, not to fixture it.

**Argon2id may be weakened in the automated test suite only** (#33), behind an explicit flag.

#### Determinism

Fixed clock for expiry logic · seeded randomness · deterministic fixture ids · Playwright traces and
database snapshots captured on failure.

> ⚠️ **Retries are permitted only for genuinely external flake in the manual pre-release sandbox check
> — never for layers 1–5. A flaky concurrency test is a finding, not a nuisance.**

#### Rejected

SQLite or in-memory Postgres · Testcontainers · mocking Prisma · a shared long-lived CI database ·
**coverage thresholds** (a number that gets gamed; layer 4 passing is the real signal) · retrying
concurrency or E2E tests · duplicating E2E coverage at component level.

**No models, no fields, no business rules changed.**

---

### #42 — Privacy, Retention & Data Lifecycle (high impact)
`2026-09-05` · **LOCKED** · Privacy · *Refines #33, #13/#3, #39, #17*
Affects: `architecture/SECURITY.md`, `DOMAIN_MODEL.md`, `AI.md`, `RAG.md`, `PAYMENTS.md` (Tier B)
**Adds two business rules to `product/BUSINESS_RULES.md`**

**Context.** #39 established the *structural* implications of anonymisation but deferred policy.
Reconciling that policy against the locked model surfaced **three gaps that would have become defects
in implementation** — all security-relevant.

#### Three gap-closing rules

**① Embedding lifecycle is transactional, not eventual.** *(refines #39)*

> **A change to a document's `visibilityScope`, or its deletion, updates or deletes its `Embedding`
> rows in the same transaction.** A reconciliation sweeper detects drift and alerts on any non-zero
> count.

#39 denormalised `visibilityScope` onto `Embedding` for in-query security filtering but never said
what happens when the source changes. **Without this rule, a document downgraded from `PARTY` to
`PRIVATE` would remain retrievable by the counterparty through RAG** — a live security hole. Both are
Postgres rows, so atomicity is free. **Drift is a security incident, not a data-quality warning.**

**② `AuditLog.metadata` carries ids and enums only — never PII.** *(refines #33)*

Because the table is immutable, anything written there is permanent and **anonymisation cannot reach
it**. An email in a moderation reason would outlive the account it belongs to. Enforced by a test
asserting metadata keys against a closed allowlist.

**③ `WebhookEvent` raw payload is purged after 90 days; the event id is kept forever.** *(refines #13/#3)*

#3 said "stored raw"; #13 said never log the full payload — the *table* was never covered, meaning
cardholder metadata would persist indefinitely. **Dedup correctness needs only the id**, so the
payload can be nulled once the dispute window closes.

#### Deletion model — five mechanisms, no global soft-delete (#6 preserved)

```
  HARD DELETE      sessions · tokens · idempotency keys · expired analytics ·
                   AI conversations (user-initiated) · read+aged notifications ·
                   failed ingestion artifacts · devices · never-published DRAFTs
  ANONYMISE        user  ← the ONLY anonymised entity
  IMMUTABLE        AuditLog
  RETAIN           Payment · PaymentAttempt · Refund · Offer · OfferRevision ·
                   Viewing · WebhookEvent (id) · published property history
  LIFECYCLE-BOUND  Embedding — bound to its source, never time-bound
```

#### Retention — configuration with defaults

Defaults live in the same backend constants module as the business constants (#31), because these are
operational values that will be tuned.

| Data | Default | Rationale |
|---|---|---|
| Sessions, tokens | Delete 7d past expiry | Already TTL'd; cleanup is hygiene |
| Idempotency keys | 24h | Locked (#10) |
| **WebhookEvent payload** | **Null after 90d; id forever** | Dispute window, then purge |
| Payments, refunds, offers, viewings | **Indefinite** | Financial and contractual history |
| AuditLog | **Indefinite** | The evidence layer |
| Notifications | Delete **read** after 180d | Transient UI state; unread never auto-deleted |
| PropertyViewEvent, SearchEvent | **365d, delete rows** | Year-over-year is the longest useful window. **Deletion, not anonymisation** — simpler and stronger than nulling a user id on the highest-volume tables |
| AI conversations, AgentRun | **User-deletable anytime; auto-delete after 365d inactivity** | Most personal, least business-critical |
| Failed ingestion artifacts | 30d | Triage window |
| BullMQ job metadata | Last 1,000 failures | Triage without unbounded growth |
| Logs | Platform-managed | Railway/Vercel/Sentry retention |

#### The AI privacy boundary *(refines #17)*

> **The AI's data-access surface is exactly the tool allowlist plus the RAG corpus, executed as the
> user. There is no other path.**

| May reach Gemini | **Never** |
|---|---|
| Public property content · published `KnowledgeArticle` · `Document` chunks **passing the actor's visibility filter** · the user's **own** favourites, viewings and preferences via tools · the user's message text | Messages · payments · refunds · offers · AuditLog · admin data · any other user's data · emails, phone numbers, session tokens |

Outbound payloads are minimised to retrieved chunks, the composed property summary and the user's
message. **The paid Gemini tier must be in use before any real user content reaches a prompt** (V9);
synthetic seed data carries no such constraint.

#### User and agent deletion

| | Deleted | Anonymised | Retained |
|---|---|---|---|
| **User** | `account`, `session`, `UserDevice`, AI conversations, saved searches, collections | `user` PII in place; email → unique non-routable placeholder; `banned = true`; `anonymizedAt` set | Offers, viewings, payments, refunds, audit entries, **messages** |
| **Agent** | Same, plus `AgentProfile` licence details | Same | **Property ownership and attribution** — listings show "Former agent" |

**Messages are retained with an anonymised author, deliberately:** the counterparty is a legitimate
party to that conversation, and removing half of it would corrupt their record.

**Three tiers of agent removal**, distinguished because they are routinely conflated:
`suspend` (banned, reversible) → `deactivate` (listings archived, login intact) → `anonymise`
(irreversible, attribution preserved).

#### Backups

**Backups are operational recovery, not an application deletion surface.** Deleted data persists until
backup expiry. ⚠️ **A restore must not resurrect access:** the post-restore runbook re-applies
anonymisation and re-runs the embedding-drift sweeper.

#### Ten testable invariants

`PR1` authorization precedes AI retrieval · `PR2` private documents cannot become public via
embeddings · `PR3` an anonymised user cannot authenticate · `PR4` a deleted private asset is
unretrievable · `PR5` AuditLog is append-only · `PR6` audit metadata has no PII · `PR7` payment
records cannot be deleted · `PR8` logs never contain credentials · `PR9` AI cannot read messages,
payments, audit or admin data · `PR10` outbound AI payloads are minimised.

Each has a corresponding test in layer 2 or 5 of #41.

#### Rejected

Global `deletedAt` (#6 already rejected it) · anonymising analytics instead of deleting (an UPDATE
over the highest-volume tables to preserve rows nobody queries) · a `PrivacyRequest` model (one admin
operation, not a workflow) · deleting AuditLog entries on user deletion (destroys the evidence layer).

#### Model impact

**None. 39 tables stand.** Two fields only: `WebhookEvent.payloadPurgedAt`, `Notification.readAt`.
`anonymizedAt` was already locked in #39.

---

### #43 — Real-Time Communication Architecture: WebSocket for 1-on-1 Chat, SSE for In-App Notifications
`2026-09-14` · **LOCKED** · Communication · *Amends #21* · Affects: `architecture/COMMUNICATION.md`, `architecture/FRONTEND.md`, `architecture/OVERVIEW.md`

**Context.** Decision #21 originally rejected WebSockets and Socket.IO on the grounds that in-app notifications are a unidirectional server-to-client event stream. However, Settly’s product scope includes real-time 1-on-1 messaging between Buyers and Agents, which requires low-latency bidirectional messaging, instant delivery confirmation, and future capabilities such as typing indicators, presence, and read receipts.

**Decision.**
1. **1-on-1 Chat uses native WebSocket (`/ws/chat`).** The Buyer ↔ Agent conversation stream uses WebSocket connections authenticated via the active user session.
2. **In-App Notifications retain Server-Sent Events (SSE, `/api/v1/events`).** Server-to-client events (offer status updates, viewing confirmations, payment alerts, new message indicators) remain thin SSE events that trigger TanStack Query cache invalidations on the client.
3. **PostgreSQL remains the source of truth for all chat messages and notifications.** WebSocket is strictly an ephemeral transport layer. Messages are never stored solely in memory or Redis. Every message is validated and persisted to PostgreSQL before or concurrently with real-time broadcast.
4. **Serverless & Multi-Instance Coordination:** Because client connections may land on different backend instances, cross-instance messaging and presence coordination is handled via **Redis Pub/Sub** (backed by Upstash Redis). No in-memory state is assumed to be shared across processes.
5. **Rejection maintained:** Socket.IO remains **rejected**. Native WebSockets (`ws` protocol) provide all required capabilities without proprietary framing, client bundle bloat, or fallback polling complexity.

---

### #44 — Infrastructure & Managed Services: Upstash Redis and Resend Email
`2026-09-14` · **LOCKED** · Infra / Ops · *Locks #36, refines #22 and #37* · Affects: `architecture/INFRASTRUCTURE.md`, `architecture/BACKEND.md`, `process/ENVIRONMENT.md`

**Context.** Infrastructure choices refined to support managed cloud deployment, serverless compatibility for caching, and real email verification during both development and production.

**Decision.**
1. **Email Provider — Resend Locked Everywhere.** Resend is locked across all environments (development, testing, production). **Mailpit is eliminated.** All transactional emails (email verification OTP, password reset, notifications) are delivered to real inboxes (e.g., Gmail, Outlook). Business logic interacts exclusively with an application-level `EmailService` abstraction so domain code is not coupled to Resend's SDK.
2. **Redis Provider — Upstash Redis.** Settly adopts Upstash Redis as its managed Redis provider for BullMQ background queues, rate limiting (`express-rate-limit`), hybrid search result caching (top-500 candidate lists), and WebSocket cross-instance coordination. Redis remains strictly ephemeral; PostgreSQL is the sole source of truth for business data.
3. **Serverless Runtime Boundary Constraint:** While the Next.js frontend is deployed serverless on Vercel, the backend API (`settly-api`) and background workers (`settly-worker`) require a persistent, always-on container environment (such as Railway or containerized host). Native WebSockets, long-lived SSE streams, and BullMQ worker event loops cannot execute inside stateless, ephemeral serverless functions (like Vercel functions) due to execution timeouts and lack of persistent TCP listeners.

---

> ## ✅ ARCHITECTURE CLOSED at #44
>
> Forty-four decisions locked, zero provisional, 39 tables, 33 pending verifications,
> zero application code. **Next phase: Tier-B Documentation update & verification spikes.**

---

## 5. Proposed decisions (P1, P5, P6, P7 accepted; P2–P4 as noted)

Raised during implementation, recorded under CLAUDE.md rule 3. **Not locked.** Each needs an
explicit decision before it is treated as settled; the topic documents are unchanged until then.

### P1 — Map library drift: Leaflet in code vs MapLibre locked
`2026-09-17` · **ACCEPTED → #96** (option b: Leaflet + MapTiler) · Frontend · Affects: `architecture/FRONTEND.md` §11

**Context.** FRONTEND.md §11 locks **MapLibre + MapTiler** for display. The search map
(`components/search/SearchMap.tsx`, `react-leaflet`) and the area maps
(`components/areas/AreaRadarMap.tsx`, `AreaDetailMap.tsx`, plain Leaflet) use **Leaflet**,
with MapTiler raster tiles on search and CARTO tiles on areas. Leaflet is not on the rejected list,
but it is not the locked choice either. Map bugs (NaN camera flights on hidden maps, marker label
overflow) were fixed in Leaflet on 2026-09-17 to avoid mixing a migration into a bug fix.

**Options.** (a) Migrate the three maps to MapLibre GL (vector tiles, RTL work under V26).
(b) Amend §11 to accept Leaflet + MapTiler raster tiles, and move V26's map concern accordingly.

**Also noted.** The MapTiler key is hard-coded in `SearchMap.tsx` although
`NEXT_PUBLIC_MAPTILER_KEY` exists; the area maps use CARTO tiles, which no document lists.

### P2 — Frontend server state: TanStack Query adoption started; nuqs and Zustand not yet
`2026-09-17` · **IN PROGRESS** (implements locked FRONTEND.md §3) · Frontend · Affects: `architecture/FRONTEND.md` §3

**Context.** FRONTEND.md §3 locks TanStack Query (server state), nuqs (URL state) and Zustand
(client UI state), but the pages were built with ad-hoc `fetch` + `useState`. The Compare page
glitched on add/remove because server data was duplicated in component state and re-synchronised
from the URL by an effect.

**Implemented.** `@tanstack/react-query` with a root `QueryProvider`, query-key factories
(`lib/query/keys.ts`) and shared query definitions (`lib/query/catalog.ts`) on the generated
`openapi-fetch` client. Compare, Search and Areas are migrated. On Compare, the `ids` URL param is
the single source of truth and is written through one `history.replaceState` helper.

**Still open.** Adopting **nuqs** for URL state (Compare ids, search filters), **Zustand** for the
compare tray, and migrating the remaining pages (agents, area detail, market insights, property
detail client parts).

### P3 — Fonts are self-hosted with `next/font/local`
`2026-09-17` · **PROPOSED** · Frontend · Affects: `design/DESIGN_SYSTEM.md` (typography)

**Context.** `next/font/google` downloads font files at dev start and build time, and silently
substitutes a metric fallback (Arial) for a whole family if any download fails. On the
development network some `fonts.gstatic.com` connections from Node time out, so Plus Jakarta Sans
rendered as Arial.

**Implemented.** The Latin (Spectral, Plus Jakarta Sans, JetBrains Mono) and Arabic (IBM Plex Sans
Arabic, Noto Naskh Arabic) woff2 subsets are committed under `frontend/src/fonts/` (SIL OFL 1.1),
with Google's `unicode-range`, so builds make no network requests for fonts. The font tokens
(`--display`, `--sans`, `--mono-ui`) are defined once in `app/globals.css`, with the Arabic
companions listed first (their `unicode-range` keeps them off Latin text).

### P4 — Open product/API questions
`2026-09-17` · **OPEN** · Catalog

1. **Area cover images.** `Area` has no image field; the areas directory uses static editorial
   images from `frontend/public/images`. Should area covers become admin-managed (schema + API
   change)?
2. **Compare with unpublished ids.** `GET /api/v1/catalog/compare` returns 422 when fewer than two
   of the requested ids are published. Should it instead return the published subset and report
   the missing ids? (The frontend currently falls back to the latest listings on 422.)
3. **Seed image URLs.** `backend/scripts/seed-catalog.ts` falls back to relative `/images/...`
   URLs when the Cloudinary map is missing, which violates `PropertyImage.url` (`z.string().url()`).

---

### P5 — Role model for dual-capability accounts (follows #50)
`2026-09-17` · **ACCEPTED → #97** (option a) · Identity · Affects: `architecture/AUTH.md`, `architecture/DOMAIN_MODEL.md`, `frontend/src/middleware.ts`

**Context.** `user.role` is a single enum (USER | AGENT | ADMIN), kept on `user` so the Better Auth
admin plugin can read it (#39). #50 says one account can be both buyer and agent. The frontend
middleware currently redirects agents away from buyer routes.

**Options.** (a) Keep one role column; **AGENT means "buyer + agent"** (a superset). Buyer
capabilities are granted to USER and AGENT; agent capabilities require AGENT **and** a verified
agent profile. (b) Several roles per user (a role list). (c) Everyone is USER; agent capability
comes only from an approved agent profile.

**Recommendation.** (a): no schema change, keeps #39, and self-dealing is already a resource
policy (buyer ≠ listing agent), not a role check. It requires removing the middleware redirect
that blocks agents from buyer routes.

**Update after #59.** Admins may buy but may not list. Under (a) that reads: **USER** = buyer ·
**AGENT** = buyer + agent · **ADMIN** = buyer + admin (no agent capabilities). Today 12 listing
routes accept `ADMIN` for agent actions, which #59 forbids for creation.

---

### P6 — Mechanism for atomic quota enforcement (follows #87)
`2026-09-17` · **ACCEPTED → #95** · Reliability · Affects: `product/BUSINESS_RULES.md` §8.1, `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`

**Context.** I13 ("an agent's first publications in a billing month never exceed the plan quota") has
the same shape as I9, I11 and I12: a per-user count that two concurrent approvals could both pass
(write skew).

**Recommendation.** Reuse the existing mechanism of §8.1: the **transaction-scoped advisory lock keyed
on the user id** (here, the listing's agent), taken inside the P3 approval transaction before
counting the month's first publications. No new locking pattern.

---

### P7 — Agent-only SOLD paths vs two-sided sale completion (#77)
`2026-09-17` · **ACCEPTED → #102** (no agent-only SOLD; P11 removed; O13 aligned with #77) · Product · Affects: `product/BUSINESS_RULES.md` §2, §4

**Context.** #77 (refined by #82) says a listing becomes `SOLD` only when **both buyer and agent
confirm**, or when an admin confirms at review; the product owner restated that an agent can never
mark a listing `SOLD` alone. `BUSINESS_RULES.md` still contains two agent-only paths:
- **P11** — `PUBLISHED → SOLD` by the agent with a reason (the offline-sale escape hatch);
- **O13** — `RESERVED → COMPLETED` by the agent alone, which moves the property to `SOLD`.

Found by the frontend screen inventory (`discovery/05-final-frontend-screen-inventory.md`, PI-5).

**Not decided.** Whether P11 is removed, kept with extra confirmation (e.g. admin), or reworded, and
how O13 is aligned with the two-confirmation rule (P9). **Until decided, P11, O13 and #77 stay as
written, and no UI is designed for an agent-only SOLD action.**

---

## 6. Discovery decisions (existing-system requirements discovery, from 2026-09-17)

Decided by the product owner during the discovery described in `discovery/`. Same weight as
#1–#44. Topic documents are updated to match.

### #45 — Positioning: whole residential market, premium brand feel
`2026-09-17` · **LOCKED** · Product · Affects: `product/OVERVIEW.md`, `design/*`, seed data (#27)

**Context.** Newer documents and UI copy framed Settly as an "institutional-grade luxury"
marketplace for "prime corridors"; OVERVIEW.md said "the Egyptian market" (gap A1).

**Options.** (A) luxury/prime only · (B) whole market, neutral brand · (C) whole market, premium
brand feel.

**Decision.** **(C).** Settly serves the whole Egyptian residential market. "Premium" describes
the brand and experience, **not** an eligibility filter on listings, prices or areas.

**Consequences.** No price floor or area whitelist. The area taxonomy must cover the market, not
only four "prime corridors". Search facets and price ranges must not assume luxury values. Copy
claiming exclusivity ("institutional-grade", "sovereign", "prime only") is off-brief. The seed
corpus (#27) must span segments.

### #46 — Project stage: demo first, production-ready by design
`2026-09-17` · **LOCKED** · Product / Process · Affects: `process/ROADMAP.md`, `architecture/SECURITY.md`, #29

**Context.** Whether Settly is a portfolio demo or a launch decides how strict security,
compliance and data honesty must be (gap A5).

**Decision.** **Demo first, but designed from the beginning to be production-ready and
launchable later.** Consistent with #29 (reduce scope by sequencing, not by lowering
architecture).

**Consequences.** Production-grade controls (secret handling, rate limiting, secure verification,
audit) are **in scope now**, not "later hardening". External integrations may run in sandbox or
test mode (Paymob sandbox) as long as the production path is the same code. Anything that would
block a real launch but not the demo is recorded as a verification item (e.g. V34). Whether
fabricated figures are acceptable in the demo is **not** decided here (open question A4).

### #47 — V1 listing scope and payment scope
`2026-09-17` · **LOCKED** · Product · Refines #1 and #13 · Affects: `product/OVERVIEW.md`, `product/BUSINESS_RULES.md`, `architecture/PAYMENTS.md`, `architecture/DOMAIN_MODEL.md`

**Context.** Egyptian residential supply is resale, off-plan (developer) and rental. The schema
has no developer/project/delivery/instalment fields, and the UI invented them (gaps C3, C4).
Off-plan deals do not fit the offer → accept → deposit flow: prices are developer-set and the
developer, not the agent, collects money.

**Options.** (A) resale only · (B) resale + off-plan · (C) resale + off-plan + rentals. For
payments: keep the locked deposit · no in-app payment in v1 · a different payment object (e.g.
developer EOI fee).

**Decision.**
1. **Sale listings in V1 are resale only.**
2. **Rentals stay as locked in #1:** discovery, viewings and inquiries, never offers or payments.
3. **Off-plan / developer primary sales are deferred to future scope.** They need their own
   domain design (developers, projects, delivery, payment plans) and payment design first.
4. **Payments:** keep the locked reservation-deposit flow (#11, #13) for resale listings,
   running against **Paymob sandbox**. No payment flow for rentals.

**Consequences.** No developer/project/instalment fields or filters in V1. UI elements that
present off-plan concepts (handover year, developer facets, instalment plans) are out of V1
scope. A real launch additionally requires V34. Open follow-up: whether "resale of a unit still
under construction" counts as resale in V1 (discovery batch 2).

### #48 — The locked roadmap is the V1 source of truth
`2026-09-17` · **LOCKED** · Process · Affects: `process/ROADMAP.md`, `process/IMPLEMENTATION_PLAN.md`, `SETTLY_MASTER_PLAN.md`, `phases/*`

**Context.** `SETTLY_MASTER_PLAN.md` and `phases/*` (added 2026-09-17) called themselves the
"single source of truth" and ordered work by screen groups, contradicting the LOCKED roadmap
(gap A2).

**Decision.** **`process/ROADMAP.md` (phase order) and `process/IMPLEMENTATION_PLAN.md` (steps)
define V1.** The vertical slice `auth → properties → search → property detail → viewing request`
comes next, then offers → payments → messaging → notifications, then intelligence.
`SETTLY_MASTER_PLAN.md` and `phases/*` are **non-authoritative**: useful as a screen inventory and
progress record, and they cannot override the roadmap unless a later decision says so.

**Consequences.** Those two documents carry a non-authoritative banner. Work already delivered
beyond the slice (compare, areas, insights, agent directory) is kept but is not a reason to
continue in screen order.

### #49 — Agent onboarding: buyer first, then a verified application
`2026-09-17` · **LOCKED** · Identity · Affects: `product/ROLES_AND_PERMISSIONS.md`, `architecture/AUTH.md`, `architecture/DOMAIN_MODEL.md`, `architecture/STORAGE.md`, `architecture/SECURITY.md`

**Context.** Agent sign-up was broken: nothing granted the AGENT role (gap B1). How the role is
granted had never been specified.

**Decision.** Every user registers as a **buyer**. To become an agent, a user submits an **agent
application** with **identity verification** (National ID + selfie) and **professional
verification**. An **admin reviews and approves** it; approval grants agent capability and marks
the agent verified.

**Consequences.**
- The application needs a lifecycle (submitted, approved/rejected, resubmission). The current
  `AgentProfile` (only `isVerified`, `verifiedAt`) cannot express it. Data-model design is pending
  (discovery step 7).
- National ID images and selfies are **sensitive personal data**: private storage only (#25:
  Supabase Storage, signed URLs, audited admin access path), **never Cloudinary** (public media),
  never in `AuditLog.metadata` (#42). Retention rules are open. Legal check: **V35**.
- The register page's "Advisor" tab and license fields no longer match this flow.
- Open: what "professional verification" requires; whether the selfie is compared manually or by a
  KYC provider; whether rejected applicants may re-apply.

### #50 — One account, buyer and agent capabilities
`2026-09-17` · **LOCKED** · Identity · Amends `BUSINESS_RULES.md` O1 · Affects: `architecture/AUTH.md`, `frontend/src/middleware.ts`

**Decision.** One account may hold both buyer and agent capabilities. An agent may act as a buyer
on other agents' listings. **An agent may never make an offer on a listing they own** (new O1
guard: buyer ≠ listing agent).

**Consequences.** The role model needs a design (proposal **P5**). The frontend middleware that
redirects agents away from buyer routes contradicts this decision. Open: whether the same
self-dealing ban covers viewings, messages and agent-recorded offers (O1b).

### #51 — Listings are created by verified agents only (V1)
`2026-09-17` · **LOCKED** · Product · Confirms #1

**Decision.** Only verified agents may create and submit listings in V1 (P1/P2 unchanged).
**Owner (for-sale-by-owner) listings are future scope.**

### #52 — Revoking agent verification suspends the agent's listings
`2026-09-17` · **LOCKED** · Governance · Affects: `product/BUSINESS_RULES.md` §2, §11.1

**Decision.** An admin may **revoke** an agent's verification. The agent's listings become
**SUSPENDED** and are hidden from the public marketplace. The account stays active (the user keeps
buyer capability) unless it is separately suspended (§11.1).

**Consequences and open points.**
- `SOLD` is terminal and cannot become SUSPENDED, so the cascade applies to live listings.
- Under the existing P12 rule, a `RESERVED` listing moving to SUSPENDED triggers a **full deposit
  refund**. Is that intended for revocation?
- Open: effect on `DRAFT`, `PENDING_REVIEW` and `ARCHIVED` listings, open offers and scheduled
  viewings; whether re-verification restores listings automatically or through admin review.
- This is a fourth, distinct form of agent removal next to suspend / deactivate / anonymise
  (§11.1).

### #53 — Phone numbers collected, not verified
`2026-09-17` · **LOCKED** · Identity · Affects: `architecture/AUTH.md`, `architecture/DOMAIN_MODEL.md`

**Decision.** Collect a phone number from **all users**. **No phone verification in V1** (no
SMS/WhatsApp provider cost). Better Auth's `phoneNumber` plugin stays unused (#9); the number is
ordinary profile data.

**Consequences.** An unverified number must never be used as a login identifier, a verification
channel or proof of identity. Open: required at sign-up or later; accepted formats; who can see a
buyer's or agent's number, and when.

### #54 — Resale includes under-construction units
`2026-09-17` · **LOCKED** · Product · Amends #47 · Affects: `architecture/DOMAIN_MODEL.md`, `product/BUSINESS_RULES.md` §1, `architecture/SEARCH.md`

**Context.** In Egypt, much resale supply is units not yet delivered, where the seller still owes
the developer instalments.

**Decision.** V1 resale includes **under-construction** units. Such listings carry an **expected
delivery date** and **remaining instalments** where applicable. Developer primary (off-plan) sales
remain future scope (#47).

**Consequences.** New listing attributes (completion status, expected delivery, remaining
instalments) are needed; none exist today. Open and important: what `price` means for these
listings (the amount paid to the seller, or the total including remaining instalments), and which
amount the 5% deposit is calculated on.

### #55 — Professional proof: several accepted types
`2026-09-17` · **LOCKED** · Identity · Refines #49

**Decision.** An agent application must include at least one professional proof. Accepted types:
broker or license document, employment/authorization letter from a brokerage, commercial
registration or tax document, or **other** proof an admin can review (with a description).

**Consequences.** The application stores a proof type and the uploaded file(s) in private
storage. No external registry lookup in V1.

### #56 — Manual identity check
`2026-09-17` · **LOCKED** · Identity · Refines #49

**Decision.** An admin compares the National ID image with the selfie by eye. **No paid KYC or
face-matching provider in V1.**

**Consequences.** The admin review screen must show both documents side by side through the
audited access path (§9). Each view of an identity document is audited (ids only, #42).

### #57 — Rejection, re-application, retention
`2026-09-17` · **LOCKED** · Identity · Refines #49 · Depends on V35

**Decision.** Rejecting an application **requires a reason** shown to the applicant. A rejected
applicant **may re-apply**. ID and selfie files follow a **defined retention period**, set after
legal review (V35).

**Consequences.** Until V35 is resolved, only test identity documents may be collected. Open:
whether re-application needs a cooldown or attempt limit.

### #58 — Revocation cascade (amends #52)
`2026-09-17` · **LOCKED** · Governance · Amends #52 and `BUSINESS_RULES.md` §7 (for this case) · Affects: `BUSINESS_RULES.md` §2, §3, §4, §7, §10; `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`

**Decision.** When an admin revokes an agent's verification:
1. **Every listing of that agent except `SOLD`** becomes suspended and hidden.
2. **`RESERVED` listings are not refunded automatically.** An admin reviews each one. This
   overrides the "admin suspends the listing → 100% refund" row of §7 for revocation only; abuse
   suspensions (P12) keep the automatic full refund.
3. **Open offers and viewings on those listings are frozen.**
4. After **re-verification**, the listings **need admin review** before becoming public again.

**Consequences.** The current state machines have no path from `DRAFT`, `PENDING_REVIEW`,
`REJECTED` or `ARCHIVED` into `SUSPENDED`, no way back through review, and no "frozen" concept for
offers or viewings, whose timers (offer TTL, 72 h deposit deadline, viewing expiry) are driven by
scheduled jobs. These need a design in the state-machine step. Open: can the buyer still withdraw
or cancel a frozen item (principle §9.1 says exit is never blocked); do timers pause; is there a
deadline for the admin review of a reserved listing, and what is refunded if the buyer withdraws
meanwhile.

### #59 — Self-dealing ban and admin scope (amends #50)
`2026-09-17` · **LOCKED** · Identity · Amends #50 · Affects: `BUSINESS_RULES.md` §3, §4, §9; `product/ROLES_AND_PERMISSIONS.md`

**Decision.** On a listing they own, an agent may **not**: make an offer (O1), request a viewing
(V1), message as a buyer, or be named as the buyer of an agent-recorded offer (O1b).
**Admins may act as buyers but may not create listings.**

**Consequences.** Guards on V1, O1, O1b and conversation creation: actor ≠ listing agent. Listing
routes that accept `ADMIN` for creation must stop doing so. Open: conflict of interest when an
admin moderates a listing, or verifies an agent, they are dealing with as a buyer.

### #60 — Phone number rules (amends #53)
`2026-09-17` · **LOCKED** · Identity · Amends #53 · Affects: `architecture/AUTH.md`, `architecture/SECURITY.md`

**Decision.** Phone is **required at sign-up**. **International numbers are allowed.** A buyer's
phone becomes visible to the listing agent **only after the buyer makes an offer** on that agent's
listing. An agent's phone is **never public**.

**Consequences.** Store numbers in a normalised international format. Sign-in with Google does not
supply a phone, so those accounts need a completion step before use. The public agents page
currently shows WhatsApp numbers (mock data), which this decision forbids. The register page
collects a phone but never sends it. Open: whether visibility ends when the offer ends, and whether
the buyer ever sees the agent's phone.

### #61 — Under-construction resale price semantics (amends #54)
`2026-09-17` · **LOCKED** · Product · Amends #54 · Confirms #13 · Affects: `BUSINESS_RULES.md` §1, §2.3, §6; `architecture/SEARCH.md`

**Decision.** For every resale listing, `price` is **the amount the buyer pays the seller**.
Remaining developer instalments are stored and shown **separately**. The **5% reservation deposit
(cap 50,000 EGP) is calculated from `price` only**.

**Consequences.** Price filters, sorting and comparison operate on `price`; a buyer's full cost
for an under-construction unit is `price` + remaining instalments, which the UI must show clearly.
Open: the structure of "remaining instalments" (total only, or amount + count + frequency + end
date).

### #62 — Buyers can always exit a frozen item
`2026-09-17` · **LOCKED** · Governance · Refines #58 · Applies BUSINESS_RULES §9.1

**Decision.** While offers and viewings are frozen by a revocation (#58), the buyer may **withdraw
the offer or cancel the viewing at any time, without penalty**. Agent-side actions stay blocked.

**Consequences.** Exit transitions (O7/O8, V6/V7) must accept frozen items. Withdrawing frees the
buyer's I9/I12 slot immediately.

### #63 — Expiry clocks pause during a freeze
`2026-09-17` · **LOCKED** · Reliability · Refines #58 · Affects: BUSINESS_RULES §10, `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`

**Decision.** Time-based expiries on a frozen item (offer TTL 7 d, deposit deadline 72 h, viewing
expiry, cooling-off 48 h) **pause** when the freeze starts and **resume with the remaining time**
when it ends.

**Consequences.** Each frozen item must record when the freeze started and how much time was left;
the scheduled expiry jobs must skip frozen items. Clock arithmetic stays server-side (#21).

### #64 — Review of a reserved listing after revocation
`2026-09-17` · **LOCKED** · Governance · Refines #58 · Affects: BUSINESS_RULES §2.4, §7

**Decision.**
- An admin must decide within **5 business days**.
- If the buyer withdraws during the review, the refund is **100%**.
- The admin either **releases** the reservation (the issue is resolved and the listing continues
  toward sale) or **cancels it with a full refund**.

**Consequences.** A business-day calendar is needed (open: Egyptian working week and public
holidays). Open: what happens automatically if the deadline passes with no decision, and whether a
release requires the agent to be re-verified first.

### #65 — Restoring listings after re-verification
`2026-09-17` · **LOCKED** · Governance · Refines #58

**Decision.** When a revoked agent is verified again: listings that were **`DRAFT` or `ARCHIVED`**
return to that state automatically; listings that were **`PUBLISHED` or `RESERVED`** stay hidden
until an admin reviews each one.

**Consequences.** A suspended listing must remember its pre-suspension state and the reason for
suspension (revocation vs abuse), so that re-verification never reinstates an abuse suspension.
Open: listings that were `PENDING_REVIEW` or `REJECTED`.

### #66 — Phone visibility lifecycle
`2026-09-17` · **LOCKED** · Privacy · Refines #60 · Affects: BUSINESS_RULES §9, `architecture/SECURITY.md`

**Decision.**
- An agent sees a buyer's phone only while that buyer has an offer on the agent's listing; access
  **ends when the offer is withdrawn, rejected or expires**.
- **Buyers never see an agent's phone.**
- **Admins may view any phone number** for support or moderation; **every access is audited**
  (ids only in the audit record, #42).

**Consequences.** Visibility is computed per request from the offer's current state, never copied
to the agent. Open: whether an agent-recorded offer (O1b) grants access, and whether access
continues after acceptance, reservation and sale.

### #67 — Admin conflict of interest
`2026-09-17` · **LOCKED** · Governance · Affects: BUSINESS_RULES §9, `product/ROLES_AND_PERMISSIONS.md`

**Decision.** An admin may not review, approve, reject, suspend or verify a case in which they are
**personally involved**. Another admin must handle it.

**Consequences.** A service-layer guard on every admin action, plus a way to route the case to
another admin. Open: what counts as "involved" (an offer, viewing or conversation on the listing?
a favourite? a past deal with the agent?), and what happens when only one admin exists (the demo
setup).

### #68 — Remaining-instalments structure
`2026-09-17` · **LOCKED** · Product · Refines #54, #61 · Affects: `architecture/DOMAIN_MODEL.md`, `architecture/SEARCH.md`

**Decision.** An under-construction resale listing records **total remaining amount** (EGP
piastres), **number of remaining instalments**, **instalment frequency** and **last instalment
date**.

**Consequences.** Enables showing the per-instalment amount and the buyer's full cost (`price` +
remaining total). Open: allowed frequency values, and validation rules (e.g. all four fields
required together).

### #69 — Revocation follow-ups
`2026-09-17` · **LOCKED** · Governance · Refines #58, #64, #65

**Decision.**
1. After re-verification, a listing that was **`PENDING_REVIEW` returns to the review queue**; one
   that was **`REJECTED` stays `REJECTED`**.
2. If the **5-business-day** review of a reserved listing passes with no decision, the system
   **cancels the reservation and refunds 100%**.
3. An admin may **release** a reservation **only after the agent is verified again**.

**Consequences.** A new system-driven expiry (review deadline) joins the scheduled jobs, so the
"nine jobs" of #10 grows (see #77 as well).

### #70 — Business-day calendar
`2026-09-17` · **LOCKED** · Governance · Refines #64

**Decision.** Business days are **Sunday to Thursday**, excluding **Egyptian public holidays kept in
an admin-maintained list**.

**Consequences.** Requires storage for the holiday list and an admin screen to maintain it (the
table count of #39 would change; data-model step). Deadline computation is server-side, in
`Africa/Cairo` time.

### #71 — Definition of "personally involved"
`2026-09-17` · **LOCKED** · Governance · Refines #67

**Decision.** An admin is personally involved in a case when they have an **offer, viewing or
conversation** on the listing, **or with that agent**. Such a case must be handled by another admin.
The demo is seeded with **two admins**.

**Consequences.** The guard is computable from existing tables (Offer, Viewing, Conversation). With
a single admin in a real deployment, involved cases wait.

### #72 — Phone access follows the offer, whoever recorded it
`2026-09-17` · **LOCKED** · Privacy · Refines #66

**Decision.** An agent-recorded offer (O1b) grants the agent access to the buyer's phone under the
same rules as a buyer-submitted offer. Access lasts while the offer is **pending, accepted,
reserved or completed**, and ends when it is **withdrawn, rejected, expired or cancelled**.

### #73 — Instalment frequency and validation
`2026-09-17` · **LOCKED** · Product · Refines #68

**Decision.** Frequency is one of **monthly, quarterly, semi-annual, annual**. Whenever a listing
has a remaining amount, **all instalment fields are required** (total, count, frequency, end date).

### #74 — One pending agent application
`2026-09-17` · **LOCKED** · Identity · Refines #57

**Decision.** A user may re-apply immediately after a rejection, but may have **at most one pending
application** at a time.

**Consequences.** A database-level uniqueness rule on pending applications per user (data-model step).

### #75 — What creates a lead
`2026-09-17` · **LOCKED** · Product · Affects: BUSINESS_RULES §3, §4; `architecture/DOMAIN_MODEL.md`

**Decision.** The **first real contact** between a buyer and a listing (a **message**, a **viewing
request** or an **offer**) creates the lead for that buyer and listing; later contacts reuse it.

**Consequences.** Consistent with V1 ("Lead created or reused") and the existing uniqueness of
(buyer, listing). Agent-recorded offers also create or reuse the lead. The lead's own status
lifecycle (`NEW`, `CONTACTED`, `QUALIFIED`, `LOST` in the schema) is not yet specified.
**→ Resolved by #83.**

### #76 — The deposit counts toward the price
`2026-09-17` · **LOCKED** · Payments · Refines #13 · Affects: BUSINESS_RULES §6, §7; `architecture/PAYMENTS.md`

**Decision.** The reservation deposit (5% of `price`, cap 50,000 EGP) is **credited toward the sale
price** and deducted from the final amount the buyer pays.

**Consequences.** Buyer-facing wording must say so. The deposit therefore belongs, economically, to
the seller's proceeds: how and when it reaches the seller is part of V34. Open: who receives the
20% retained on a late buyer withdrawal (§7 says "platform/agent"), and how Settly earns revenue at
all, since no revenue model is recorded anywhere. **→ Revenue model: #79. The 20% recipient remains
TBD.** **→ Recipient resolved by #84 (the seller).**

### #77 — Two-sided sale completion with a 30-day review
`2026-09-17` · **LOCKED** · Product · **Amends P9** · Affects: BUSINESS_RULES §2, §10

**Decision.** A `RESERVED` listing becomes `SOLD` only when **both the buyer and the agent confirm
completion**. If it is **not completed within 30 days**, the listing goes to **admin review**. The
admin **may request evidence** (for example a signed contract) when needed; evidence is **not
mandatory** for every sale.

**Consequences.** P9 changes from an agent-only transition to a two-confirmation transition. Another
system-driven deadline joins the scheduled jobs. The 30-day clock pauses during a revocation freeze
(#63). The current code lets the agent mark a sale alone, which this decision forbids. Open: what the
admin can decide at review, and what happens when one party disputes completion.
**→ Resolved by #82.**

### #78 — RENTED becomes an official listing state
`2026-09-17` · **LOCKED** · Product · **Amends #5** (Property 8 → 9 states) · Affects: BUSINESS_RULES §2

**Decision.** Add **`RENTED`** to the property state machine. The listing agent moves a **rental**
listing from `PUBLISHED` to `RENTED` when it has been rented.

**Consequences.** Matches the value already present in the database enum. Open: whether `RENTED` is
terminal like `SOLD` or can be relisted when the tenancy ends, and whether a revocation (#58)
suspends `RENTED` listings. **→ Resolved by #81.**

### #79 — Revenue model: transaction revenue + agent listing subscription
`2026-09-17` · **LOCKED** · Product · **Supersedes in part #1** (agent subscriptions) · Affects: `product/OVERVIEW.md`, `product/BUSINESS_RULES.md`, `architecture/PAYMENTS.md`, `process/ROADMAP.md`

**Context.** No revenue model was recorded anywhere (gap E11). #1 had listed agent subscriptions
under Package C and the out-of-scope lists excluded "agent subscription billing".

**Decision.** Settly has **two revenue streams**:
1. **Transaction revenue** — Settly earns revenue from **successful property sales**. The fee or
   percentage, who pays it, and the payout rules are **TBD** and will be defined separately.
2. **Agent listing subscription** — see #80.

**Consequences.** "Agent subscription billing" is removed from every out-of-scope / rejected list.
Subscription payments and the transaction fee are **new payment objects** next to the reservation
deposit; how they are collected (provider flow, timing, refunds) is **not decided** and must not be
assumed from the deposit design. V34 (legality of Settly handling funds) now also covers transaction
revenue and payouts. Still TBD: who receives the 20% retained on a late buyer withdrawal (§7). **→ Resolved by #84: the
seller.**

### #80 — Agent listing subscription: exactly three plans with a monthly quota
`2026-09-17` · **LOCKED** · Product · Refines #79 · Affects: `product/BUSINESS_RULES.md` §1, §2.5; `architecture/DOMAIN_MODEL.md`; `product/ROLES_AND_PERMISSIONS.md`

**Decision.**
- **Exactly 3 plans exist: Free, Pro, Enterprise.** No other tiers.

| Plan | New listings per billing month |
|---|---|
| **Free** | **2** |
| **Pro** | **4** |
| **Enterprise** | **8** |

- The quota counts listings **created/published during the billing month**, not the number of
  currently active listings.
- **Deleting, selling, suspending or archiving a listing does not restore quota.**
- The quota **resets at the beginning of the next billing month**.
- **Prices are not set** (TBD). **→ Set by #89 (2026-09-17): Free $0, Pro $20, Enterprise $50 per month, USD base.**

**Consequences.** Needs plan and subscription data plus a per-month usage record (data-model step).
TBD, deliberately not assumed: plan prices; payment method and recurring-billing mechanics; what
"billing month" is anchored to (calendar month or subscription start) **(→ #88–#93 resolve these; prices set by #89)**; the exact event that consumes
quota (draft creation, submission for review, or first publication) **(→ first publication, resolved by #86)**; whether relisting (`ARCHIVED →
DRAFT`, `RENTED` relist) consumes quota **(→ yes, resolved by #85)**; plan changes mid-month; what happens when a paid plan lapses;
whether a newly verified agent starts on Free.

### #81 — RENTED is not terminal; relisting is a new reviewed lifecycle
`2026-09-17` · **LOCKED** · Product · **Amends #78** · Refines #58, #65 · Affects: `product/BUSINESS_RULES.md` §2, §2.4

**Decision.**
- `RENTED` is **not terminal**. When the rental period ends, the agent may **relist** the property.
- Relisting always goes through **`DRAFT → PENDING_REVIEW → PUBLISHED`** and is reviewable as a
  **new listing lifecycle**.
- The **previous rental listing and its history are preserved**.
- **Never `RENTED → PUBLISHED` directly**, and never silently.
- **Revocation applies to `RENTED` listings** (they are not exempt like `SOLD`). The agent must be
  verified again before such a listing can become publicly active, which in any case requires
  relisting through review.

**Consequences.** New transition P16 (relist from `RENTED`). TBD: whether relisting creates a new
listing record linked to the old one or reuses the record with preserved history (note that a
`PropertyStatusHistory` table was rejected in #39, so "preserved history" currently means
`AuditLog` plus the retained listing data); the state a suspended `RENTED` listing returns to after
re-verification; whether relisting consumes subscription quota (#80) **(→ yes, resolved by #85)**.

### #82 — Sale-completion review: outcomes and disputes
`2026-09-17` · **LOCKED** · Product · Refines #77 · Affects: `product/BUSINESS_RULES.md` §2, §7, §10

**Decision.**
- A reservation becomes `SOLD` **only after both buyer and agent confirm** (unchanged, #77).
- If **30 days** pass without both confirmations, the case **automatically enters admin review**.
- The admin may:
  1. **confirm the sale** → `SOLD`;
  2. **determine that the sale fell through** → the applicable refund/cancellation rules (§7) apply;
  3. **extend the review period** when there is a justified reason.
- If the buyer and agent **disagree** about whether the sale completed, the case is **not resolved
  automatically**; it goes to **admin review**.
- Every admin decision respects the conflict-of-interest rules (#67, #71).

**Consequences.** TBD: the maximum length or number of extensions; whether a disagreement enters
review immediately or at the 30-day mark (the decision only says it goes to admin review); how the
admin records which §7 cause applies to a fell-through case.

### #83 — Lead pipeline: hybrid automatic and manual stages
`2026-09-17` · **LOCKED** · Product · Refines #75 · Affects: `product/BUSINESS_RULES.md` §3.3, §6.3; `architecture/DOMAIN_MODEL.md`; `architecture/PAYMENTS.md`

**Decision.**
- Pipeline: **`NEW → CONTACTED → QUALIFIED → WON / LOST`**.
- **Automatic progression** on clear system events, for example: the first qualifying interaction
  can move `NEW → CONTACTED`; an offer can move the lead toward `QUALIFIED`; **a completed sale sets
  `WON`**.
- **Agents may update the stage manually** when they have more context, and **set `LOST`**.

**Consequences.** The schema's `LeadStatus` lacks `WON` (data-model step). The atomic deposit bundle
previously said "Lead → won" at reservation; under this decision **`WON` is set when the sale
completes (`SOLD`)**, so that line is corrected. The exact automatic rules beyond the examples are
intentionally not fixed yet (TBD), as is what happens to other buyers' leads when a listing is sold,
rented or archived.

### #84 — The late-withdrawal retention goes to the seller
`2026-09-17` · **LOCKED** · Payments · Resolves the open point in #76 and #79 · Affects: `product/BUSINESS_RULES.md` §1, §7

**Context.** When a buyer withdraws after the 48-hour cooling-off period, 20% of the reservation
deposit is retained (§7). The recipient was recorded as "platform/agent" and then marked TBD once
the deposit was defined as credited toward the sale price (#76) and the revenue model was set (#79).

**Decision.** The retained 20% goes **100% to the seller**. It is **not Settly revenue** and is **not
paid to the agent**.

**Consequences.** Settly's revenue remains the two streams of #79 only. How and when the amount reaches
the seller is part of the still-open payout rules and legal check V34. The same recipient applies
wherever §7 says "per the same retention" (collapse for external reasons).

### #85 — Relisting counts against the monthly listing quota
`2026-09-17` · **LOCKED** · Product · Resolves the relisting question in #80 and #81 · Affects: `product/BUSINESS_RULES.md` §2, §2.5

**Context.** #80 left open whether relisting consumes the agent's monthly new-listing quota; #81
made `RENTED` relistable through a new reviewed lifecycle.

**Decision.**
- A **relisting counts against the agent's monthly listing quota** and consumes **1 listing** from
  the current plan's quota (Free 2 · Pro 4 · Enterprise 8).
- Relisting **still follows `DRAFT → PENDING_REVIEW → PUBLISHED`**.
- Relisting **cannot be used to bypass the monthly limit**.

**Scope.** Applies to both relisting paths in `BUSINESS_RULES.md` §2: **P14** (`ARCHIVED → DRAFT`)
and **P16** (relisting a `RENTED` property).

**Consequences.** An agent whose quota for the month is used up cannot relist until the quota
resets. Still TBD (unchanged): the exact event within the lifecycle at which quota is consumed
(#80), which applies to relistings the same way as to new listings. **→ Refined by #86:** quota is
consumed when the relisted listing is first published, so creating the relist draft itself is not
blocked; the limit applies at publication. **OPEN:** whether P10 (a
fall-through that returns a reserved listing directly to `PUBLISHED`, described as "relisted") or
the automatic restorations after re-verification (#65, #69) count as relistings; neither goes
through `DRAFT`, so this decision does not cover them. **→ Resolved by #86:** they are not first
publications of a listing lifecycle, so they do not consume quota.

### #86 — Listing quota is consumed at first publication
`2026-09-17` · **LOCKED** · Product · Resolves the consumption point left open in #80 and #85 · Affects: `product/BUSINESS_RULES.md` §2, §2.5

**Context.** #80 said the quota counts listings "created/published" in the billing month and left the
exact consuming event open; #85 made relistings consume quota without fixing when.

**Decision.**
- An agent's monthly listing quota is consumed **when a listing is first published** (`PUBLISHED`).
- **Creating a draft or submitting it for review does not consume quota.**
- **Rejected listings do not consume quota.**
- Once consumed, quota is **not restored** if the listing is later **sold, rented, suspended,
  archived or deleted**.
- **Relistings follow the same rule:** a relisting (P14, P16) consumes quota when the relisted
  listing is first published.

**Consequences.**
- Quota is consumed at **P3** (`PENDING_REVIEW → PUBLISHED`, an admin approval) for a listing
  lifecycle's first publication, and counts in the billing month of that publication (the
  billing-month anchor is still TBD, #80).
- Returning an already-published listing to `PUBLISHED` is **not** a first publication and consumes
  nothing: re-approval after a structural edit (P6 → P3), a fall-through (P10), reinstatement after a
  suspension (P13), and restorations after re-verification (#65, #69).
- A never-published draft, the only listing that can be hard-deleted (§2.2), never consumed quota.
- **OPEN:** what happens when an admin is about to approve (P3) a listing whose agent has no quota
  left in the current month (approval blocked, listing waits until the reset, or submission blocked
  earlier); and how concurrent approvals for the same agent are kept within the limit (design step).
  **→ Resolved by #87** (the listing stays `PENDING_REVIEW`; enforcement is atomic; the mechanism is
  proposal P6).

### #87 — Exhausted quota: the listing waits in review; enforcement is atomic
`2026-09-17` · **LOCKED** · Product / Reliability · Resolves the open point in #86 · Affects: `product/BUSINESS_RULES.md` §2, §2.5, §8

**Decision.**
- If an agent has **exhausted** the monthly listing quota, an **admin approval must not publish**
  a new listing (a first publication, #86).
- The listing **remains `PENDING_REVIEW`** until quota becomes available **after the billing-month
  reset**.
- The limit is enforced **atomically**: concurrent approvals can never take an agent beyond the plan
  quota.

**Consequences.** New invariant **I13**. P3 gains a quota guard for first publications (re-publications
under #86 are unaffected). Mechanism: proposal **P6** (the existing per-user advisory lock). Still
OPEN: how a waiting listing gets published after the reset (automatically or by a new admin
approval), in which order, whether the admin reviews its content before the reset, and whether an
upgrade mid-month releases waiting listings. **→ Resolved by #94; mechanism by #95.**

### #88 — Billing month and first paid period
`2026-09-17` · **LOCKED · S2 (first paid period) superseded by #104** · Product · Refines #80 · Batch 7 S1, S2

**Decision.**
- The **billing month is the calendar month in Cairo time** (`Africa/Cairo`). Every agent's quota
  resets on the **1st** of each calendar month.
- ~~When a paid plan starts **mid-month**, its first subscription period **ends at the end of the
  current calendar month**, and the **first payment is prorated**.~~ **Superseded by #104:** every
  paid period lasts 30 days from its start time at the full price. The calendar month above now
  governs **only the listing quota**.

**Consequences.** Quota usage is counted per calendar month; no per-agent reset schedule is needed.
See #92 for the unresolved interaction with upgrades.

### #89 — Plan pricing
`2026-09-17` · **LOCKED** · Product · Refines #80 · Batch 7 S3 · **Prices set and currency changed by the amendment below (2026-09-17)**

**Decision.** **Free is always free.** ~~**Pro and Enterprise prices are TBD.** Prices are in **EGP**.~~
*(superseded by the amendment below)* **Monthly billing only** in V1 (no annual option).

**Consequences.** ~~No numeric price appears anywhere in the documentation until a later decision
sets it.~~ *(superseded: the prices are now set)*

**Amendment (2026-09-17) — final V1 prices, USD base.** *(Currency display and charging are superseded
by #103: USD-only plans UI, no toggle, EGP charged at a fixed 48.98 EGP/USD.)*

| Plan | Base price | Billing | Quota (#80) |
|---|---:|---|---|
| **Free** | **$0 / month** | 30-day period (#104) | 2 |
| **Pro** | **$20 / month** | 30-day period (#104) | 4 |
| **Enterprise** | **$50 / month** | 30-day period (#104) | 8 |

- **Subscription base prices are denominated in USD.** These USD amounts are the canonical prices.
- ~~**Display currency:** the frontend may show subscription prices in **USD or EGP**, with a
  user-selectable toggle. There is one price per plan (the USD base); EGP is a converted,
  equivalent display value from a current exchange rate. It is never stored as the canonical price
  and never hard-coded as a base price.~~ **Superseded by #103:** one price per plan (the USD base),
  shown in USD with no toggle; EGP is the charged amount at the fixed rate 48.98.
- **Scope of the currency change:** subscription pricing only. **Real-estate amounts (listing
  prices, the reservation deposit — 5%, capped at 50,000 EGP — refunds and retention) stay in EGP**
  as defined in #2, #13, #76 and `BUSINESS_RULES.md`. #2 is amended only to that extent.
- ~~The proration (#88) and full-price upgrade (#92) rules apply to the USD base price.~~ **Superseded
  by #104:** no proration; every paid period is charged the full price.
- **Not implemented by this amendment:** no currency conversion, no exchange-rate API, and no
  payment, schema or UI change.
- **OPEN (not decided here):**
  *(Items 1–3 resolved by #103.)*
  1. **Charge currency at Paymob checkout.** Is the agent charged in USD, or in EGP converted from
     the USD base? And if converted, which rate applies at the moment of charge? It depends on what
     the Paymob merchant account supports (**V37**).
  2. The **receipt currency** (and the rate shown on it, if converted).
  3. The **exchange-rate source**, refresh frequency and staleness handling for the display toggle.
  4. How USD amounts are stored. #5 locks money as `BIGINT` minor units with an explicit currency
     column; storing cents for USD is part of the subscription data-model design.
  5. VAT/e-invoicing on USD-priced subscriptions remains **V36**.

### #90 — Subscription payment method and receipts
`2026-09-17` · **LOCKED** · Payments · Refines #79, #80 · Batch 7 S4, S5 · Affects: `architecture/PAYMENTS.md`

**Decision.**
- Pro and Enterprise are paid through **Paymob hosted checkout, ~~each month~~ for each 30-day period (#104)**.
- **No saved card** and **no automatic saved-card renewal** in V1.
- V1 issues a **simple receipt only**. Egyptian VAT, e-invoicing and tax handling are checked before
  launch as part of the legal review (**V36**); no tax implementation is assumed.

**Consequences.** Subscription payments reuse the hosted-checkout approach already chosen for
deposits (#13). Renewal is a manual payment by the agent for each **30-day period (#104)**; its absence leads to #91.

### #91 — Expiry, downgrade effect and cancellation
`2026-09-17` · **LOCKED** · Product · Batch 7 S6–S8

**Decision.**
- When a paid plan **expires** (not renewed, or payment failed), the agent moves to **Free
  immediately on the expiry date**. **No grace period.**
- After a downgrade to Free, **existing published listings stay live**; the quota limits new
  publications only (#86).
- An agent may **cancel at any time**: the paid plan stays active **until the end of the paid
  period**, and **no refund** is given.

### #92 — Changing plans mid-month
`2026-09-17` · **LOCKED · period wording amended by #104 (30-day periods, no proration)** · Product · Batch 7 S9–S11

**Decision.**
- **Upgrade takes effect immediately.** The agent gets the **new plan's monthly quota minus the
  publications already consumed** in the current calendar month (e.g. Free with 1 used → Pro: 3
  remaining).
- On a **mid-period upgrade**, the agent pays the **full price of the new plan**, and a **new
  ~~full one-month~~ 30-day (#104) billing period starts immediately from the upgrade time**. There is **no prorated
  price-difference** calculation.
- **Downgrade takes effect ~~at the next billing month~~ when the current paid period ends (#104)**;
  the current plan stays effective until its paid period ends.

**Consequences.** An immediate upgrade can release listings waiting for quota (#94).

**Clarification (2026-09-17) — two distinct cases.** *(Superseded by #104: every paid period —
first, re-subscription, upgrade, renewal — is 30 days from its start at the full price.)*

| Case | When | Price | Billing period |
|---|---|---|---|
| ~~**New paid subscription** (#88, S2)~~ | ~~An agent on Free starts a paid plan for the first time, mid-calendar-month~~ | ~~Prorated first payment~~ → **full price (#104)** | ~~First period ends at the end of the current calendar month~~ → **30 days from start (#104)** |
| **Mid-period upgrade** (this decision, S11) | An agent with an active paid plan moves to a higher plan during its period | **Full price** of the new plan | A **new ~~full one-month~~ 30-day period starts at the upgrade time** (#104) |

In both cases the **quota month stays the calendar month** (#88): quota resets on the 1st, and an
upgrade's remaining quota is the new plan's quota minus publications already consumed this calendar
month.

~~**Not covered by S2/S11 (OPEN):** an agent who starts a paid plan again after a previous paid plan
expired or was cancelled; and when renewals fall once an upgrade's one-month period ends
(upgrade-anchored or back to the calendar month).~~ **Resolved by #104:** re-subscription and renewals
are full-price 30-day periods, never tied to the calendar month.

### #93 — Starting plan, revocation and queue position
`2026-09-17` · **LOCKED** · Product · Batch 7 S12–S14 · Refines #58, #69

**Decision.**
- A newly verified agent starts on **Free**. **No Pro trial.**
- When an agent's verification is **revoked**, the **subscription keeps running**: billing is not
  paused or cancelled. Listing availability follows the revocation rules (#58, #64, #65, #69).
- Listings that return to review after **re-verification** **keep their original place and time in
  the review queue**.

### #94 — Listings waiting for quota
`2026-09-17` · **LOCKED** · Product · Refines #87 · Batch 7 S15–S20 · Affects: `product/BUSINESS_RULES.md` §2, §2.5

**Decision.**
- Admins **review a listing even when the agent has no quota left**. If the content is approved,
  the listing **stays `PENDING_REVIEW`** with the internal status **Approved, Waiting for Quota**,
  and **publishes automatically** once quota is available.
- When quota becomes available — after the **monthly reset**, an **immediate upgrade**, or any other
  approved quota increase — waiting listings are published **automatically, oldest approval first
  (FIFO)**, until the available quota is used.
- **Editing** a waiting listing **invalidates its approval**; it must be reviewed again.
- Agents see quota through **three mechanisms**: remaining quota in the dashboard, a **warning** when
  submitting with no quota left, and a **notification** when a waiting listing is published.
- There is **no cap** on the number of waiting listings.
- An **immediate mid-month upgrade** can release waiting listings at once, in the same FIFO order.

**Consequences.** Publication of a waiting listing is a system-driven first publication (P3a) with the
same effects as P3, and it consumes quota under I13. The "waiting" status is a sub-state of
`PENDING_REVIEW`, not a new property state.

### #95 — Quota enforcement mechanism
`2026-09-17` · **LOCKED** · Reliability · Accepts P6 · Batch 7 S21, S22 · Affects: `product/BUSINESS_RULES.md` §8.1, `architecture/CONCURRENCY_AND_IDEMPOTENCY.md` §4

**Decision.**
- Enforce the monthly listing quota with the **existing per-user advisory lock** (the pattern used
  for I9, I11, I12), keyed on the **listing's agent**, inside the approval/publication operation.
- Invariant **I13**: an agent's first publications in a billing month never exceed the quota of the
  agent's **active plan**, including under concurrent admin approvals.
- **No new quota-counter model** and no new enforcement architecture.
- The check at **submission is warning-only**; submission is allowed with no quota left. Enforcement
  stays at approval/publication, so such a listing can enter review, and approval leaves it
  `PENDING_REVIEW` as **Approved, Waiting for Quota** (#94).

### #96 — Maps: Leaflet with MapTiler
`2026-09-17` · **LOCKED** · Frontend · Accepts P1 (option b) · **Supersedes the map part of #21** · Batch 7 S23–S25 · Affects: `architecture/FRONTEND.md`, `design/DESIGN_SYSTEM.md`, `architecture/SECURITY.md`

**Decision.**
- **Leaflet** is the approved V1 map library. The maps are **not** migrated to MapLibre.
- **MapTiler** is the tile provider **everywhere** in V1; area pages that use CARTO are standardised
  on MapTiler.
- The hard-coded MapTiler key moves to **`NEXT_PUBLIC_MAPTILER_KEY`**, and the key is
  **domain-restricted** in the MapTiler dashboard. No real key appears in documentation or commits.

**Consequences.** `NEXT_PUBLIC_*` values are visible in the browser, so the domain restriction is the
protection that matters. V26 now concerns Leaflet controls. The code changes (CARTO → MapTiler, key to
env) are implementation work, not done by this decision.

### #97 — Role model, portals and admin creation
`2026-09-17` · **LOCKED** · Identity · Accepts P5 (option a) · Batch 7 S26–S28 · Affects: `architecture/AUTH.md`, `product/ROLES_AND_PERMISSIONS.md`, `architecture/FRONTEND.md`

**Decision.**
- **One role per account.** Effective capabilities:
  - `USER` → Buyer
  - `AGENT` → Buyer + Agent (after verification)
  - `ADMIN` → Buyer + Admin, **without** agent/listing powers
- No multiple roles per account and no role-schema change. Self-dealing limits stay per-listing
  business rules (#59).
- Agents and admins use buyer functionality with the **same login/account**; the frontend lets them
  **switch between the applicable portals** (Buyer, Agent, Admin). Not implemented by this decision.
- **Admin accounts are created only by seed or a controlled CLI/script.** No in-app "promote to
  admin" feature (API or UI) in V1.

**Consequences.** The frontend middleware that redirects agents away from buyer routes contradicts
this decision (implementation follow-up).

### #98 — Cloudinary secret remediation
`2026-09-17` · **LOCKED** · Security · Batch 7 S29–S31 · Affects: `process/ENVIRONMENT.md`, `architecture/INFRASTRUCTURE.md`, `.github/workflows/ci.yml`

**Context.** Cloudinary credentials were committed in plain text in `.github/workflows/ci.yml` (public
repository) from 2026-09-14.

**Decision.**
1. The exposed Cloudinary API secret **has been rotated**; the new value lives only in the owner's
   local `.env` and in GitHub Actions secrets.
2. `ci.yml` reads `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` from
   **GitHub Actions secrets**; no plaintext credentials.
3. **Git history is not rewritten** (no force-push, no history clean-up). Rotation is what makes the
   old value useless.

**Consequences.** The three repository secrets must exist in GitHub for the CI steps that use
Cloudinary. No real credential appears in documentation, code, CI files, logs or commits.

### #99 — V1 frontend is English only; Arabic/RTL deferred
`2026-09-17` · **LOCKED** · Frontend · **Supersedes for V1 the UI-locale, localized-route and RTL parts of #39 §8** (and so the #4 reversal, for the UI only) · Affects: `architecture/FRONTEND.md`, `product/OVERVIEW.md`, `product/REQUIREMENTS.md`, `design/DESIGN_SYSTEM.md`, `design/UX_PATTERNS.md`, `process/IMPLEMENTATION_PLAN.md`, `process/TESTING.md`, `architecture/SEARCH.md`, `GLOSSARY.md`

**Context.** #39 made the UI fully bilingual (`/en` + `/ar`) with first-class RTL and a `/[locale]`
segment on every public route. The implemented frontend is English only with no locale segment, and
the final screen inventory (`discovery/05-final-frontend-screen-inventory.md`) was planned as English
only. The two positions could not both be current.

**Decision.**
- The **Settly V1 frontend is English only**.
- There are **no `/ar/*` routes in V1**, and V1 routes carry **no `/[locale]` segment**.
- **No Arabic/RTL implementation is required during V1** (no RTL layout, mirrored icons, reversed
  table/form order, Arabic UI catalog or `hreflang` alternates).
- **Arabic/RTL is a Future / Optional Feature**, to be reconsidered **only after the core project is
  completed**, through a new decision.
- Existing `/ar`, `/[locale]` and RTL references in older documents and design candidates are **not
  current requirements**.

**Scope — ~~what this decision does not change~~ (superseded by the amendment below, 2026-09-17).** It concerns the **UI locale** (chrome, routes,
layout direction) only. #39's content model (`titleEn`/`titleAr`, …), bilingual area aliases, Arabic
query understanding and search, AI response language, and the checks V3, V23 and V24 are **not
changed here**. **OPEN:** whether V1 still accepts and searches Arabic listing content, Arabic
queries and Arabic AI answers, and therefore whether `dir="auto"` on user-generated content remains
a V1 requirement. Until that is decided, those parts of #39 stand.

**Consequences.**
- V25 (i18n routing × ISR), V26 (RTL maturity) and V27 (Arabic numerals) are **deferred**: they do
  not block V1.
- ISR invalidation concerns one locale, not two.
- Middleware does no locale resolution.
- The two Arabic design candidates (`property-detail-ar.html`, `assistant/ar.html`) and the
  bilingual statements in the candidate `DESIGN.md` files are kept as future reference only.
- The Arabic font subsets committed under P3 are not required by V1. Keeping or removing them is an
  implementation matter, not decided here.
- No code changes are made by this decision.

**Amendment (2026-09-17) — English only end to end.** The open point above is decided by the product
owner. **Settly V1 is English only across the entire user-facing product**, not only the interface:

| V1 language surface | Scope |
|---|---|
| UI text (chrome, labels, errors, emails, notifications) | **English only** |
| Listing / property content (titles, descriptions, captions, agent bios) and editorial content (`KnowledgeArticle`, area names shown to users) | **English only** |
| Search queries and search-facing language (lexical, semantic, query understanding, gazetteer) | **English only** |
| AI assistant and AI-generated answers | **English only** |
| User-facing system messages | **English only** |

- **Arabic content, Arabic search, Arabic AI answers and Arabic/RTL support** are all a **Future /
  Optional Feature after core project completion**. Arabic is **not implemented in V1**.
- **No mixed-direction handling in V1:** no `dir="auto"` for Arabic content and no RTL rendering.
- The language parts of **#39 §3 (content model), §5 (Arabic FTS vector and normalisation), §6
  (cross-language embedding role) and §8 (AI response language, UI locale)** are **deferred for V1**.
  The English parts stand: the English generated tsvector, the single multilingual embedding
  vector (now used for English), and "content is never machine-translated for display".
- **Retrieval evaluation (#27, #32) in V1 covers English only:** the Recall@10 **EN→EN ≥ 0.80**,
  **zero-result rate ≤ 10%** and **relevant-in-top-3 ≥ 0.70** gates apply unchanged. The **AR→AR and
  cross-language rows**, the **"< 0.50 cross-language → revisit #24"** rule, the bilingual benchmark
  queries and the Arabic-only seed listings are **deferred** with Arabic.
- **V3, V23 and V24** (Arabic retrieval, AR↔EN cross-lingual quality, Arabic normalisation) are
  **deferred**. They do not block V1.
- The AI assistant answers in English. Detecting the language of an incoming message is no longer a
  V1 behaviour requirement. How a non-English message is handled is an AI-spec detail, and may not
  produce Arabic output.

**OPEN — data-model and API follow-up (not decided here, no code changed).** The implemented schema and
catalog API already carry Arabic fields (`Property.titleAr`/`descriptionAr`/`searchVectorAr`,
`AgentProfile.bioAr`, `PropertyImage.captionAr`, `Amenity.nameAr` and `Area.nameAr` (both required),
`KnowledgeArticle.titleAr`/`bodyAr` (required), the `ar_normalize` SQL function, and the Arabic
fields in `property.schema.ts`/`compare.schema.ts` and the catalog seed). V1 must not require or
populate Arabic values through user-facing flows. **Whether these columns stay dormant, become
optional, or are removed is a separate data-model decision** (it changes the schema and the OpenAPI
contract). Until it is made, documentation describes them as present but unused in V1.
**→ Resolved by #101** (kept, optional, unused in V1; implementation pending).

### #100 — Canonical portal route prefixes
`2026-09-17` · **LOCKED** · Frontend · Refines #97 · Affects: `architecture/FRONTEND.md`, `discovery/05-final-frontend-screen-inventory.md`

**Context.** #97 defined three portals but no URL prefixes. `FRONTEND.md` §2 named `/dashboard/*`
for the buyer area; the frontend middleware and navbar use `/buyer/*`, `/agent/*` and `/admin/*`; the
auth pages redirect to `/buyer-dashboard/overview` and `/agent-dashboard/overview`.

**Decision.**

| Portal | Canonical V1 prefix |
|---|---|
| Buyer | **`/buyer/*`** |
| Agent | **`/agent/*`** |
| Admin | **`/admin/*`** |

**`/dashboard/*` and `/buyer-dashboard/*` are not canonical V1 portal prefixes**, and neither is
`/agent-dashboard/*`.

**Consequences.**
- Documentation uses only the three canonical prefixes.
- The exact routes inside each prefix are set with the screen specifications. The conceptual
  structure is in `discovery/05-final-frontend-screen-inventory.md` §E.
- Design-candidate folder names (`buyer-dashboard/`, `agent-dashboard/`) are file paths, not routes.
- **Implementation follow-ups (not done by this decision; no route, middleware or redirect is
  changed):**
  1. `frontend/src/app/(auth)/login`, `register` and `verify-email` redirect to the non-canonical
     `/buyer-dashboard/overview` and `/agent-dashboard/overview`.
  2. `frontend/src/components/layout/Navbar.tsx` links to `/buyer/overview`, `/agent/overview` and
     `/admin/verification`. The prefixes are canonical, but the landing routes must match the
     approved screen specifications.
  3. `frontend/src/middleware.ts` protects the canonical prefixes but still redirects agents away
     from `/buyer/*`, contrary to #97 (already recorded there).
  4. No portal pages exist yet under any of the three prefixes.

### #101 — Arabic data fields: kept for future compatibility, optional and unused in V1
`2026-09-17` · **LOCKED** · Data / API · Resolves the data-model open point of #99 · Refines #39 §3, §5 · **Implementation pending** · Affects: `architecture/DOMAIN_MODEL.md`, `architecture/DATABASE.md`, `architecture/SEARCH.md`, `architecture/RAG.md`, `process/SEED_DATA.md`, `GLOSSARY.md`

**Context.** #99 makes V1 English only end to end. The schema, migrations and catalog/identity API
already carry Arabic fields from #39, and four of them are required (`NOT NULL`). #99 left open whether
they stay, become optional or are removed.

**Decision.**
- **Keep** the existing Arabic-related database and API fields **for future compatibility**. They are
  **not deleted**, and neither is the `ar_normalize` function.
- **V1 does not use them:**
  - V1 application flows read and write **English fields only**;
  - Arabic fields are **not used by V1 search**, and `searchVectorAr` (with its GIN index) is not
    queried;
  - `ar_normalize` stays present but unused;
  - **Arabic RAG retrieval** and **Arabic AI answers** are deferred (#99).
- Arabic fields that are currently **required only for Arabic support become optional (nullable)**.
- **No dummy or placeholder Arabic content** is ever written to satisfy a constraint, a seed or a test.
  **V1 never requires Arabic data to be supplied.**
- #99 remains **the** language-scope decision; this decision only settles the data-model consequence.

**Follow-up implementation work (not done by this decision; no schema, migration, API, seed, test or
application code is changed here):**

| # | Area | Work |
|---|---|---|
| F1 | Migration (new, additive) | Make **`Area.nameAr`**, **`Amenity.nameAr`**, **`KnowledgeArticle.titleAr`** and **`KnowledgeArticle.bodyAr`** nullable (`DROP NOT NULL`). Keep the already-nullable `Property.titleAr`/`descriptionAr`, `PropertyImage.captionAr` and `AgentProfile.bioAr`, the generated `searchVectorAr`, its GIN index, the trigram indexes on `titleAr`/`nameAr`, and `ar_normalize` unchanged. Update `schema.prisma` to match (`String?`). Existing migrations are not edited |
| F2 | English required in V1 | V1 validation requires the **English** fields where content is required (e.g. `Property.titleEn`/`descriptionEn`). Replace the "English **or** Arabic" refinements in `catalog/schema/property.schema.ts`. Whether a database constraint also enforces English is part of the F1 migration design |
| F3 | API schemas (Zod → OpenAPI) | Response fields `nameAr` (area, amenity, compare) become **nullable**. `amenity.schema.ts` create input no longer requires `nameAr`. Arabic inputs (`titleAr`, `descriptionAr`, `captionAr`, `bioAr`, `nameAr`) are optional and not used by V1 clients. Whether write endpoints ignore or reject them is part of this change |
| F4 | Contract snapshot | Regenerate the OpenAPI spec and the committed frontend snapshot (`frontend/src/api/openapi.json`, `v1.d.ts`) |
| F5 | Backend code | Remove Arabic fallbacks from V1 logic, e.g. the slug seed falling back to `titleAr` in `property.repository.ts`. Catalog and identity services stay English-only in behaviour |
| F6 | Seed | `backend/scripts/seed-catalog.ts` stops writing Arabic values (leaves them `NULL`). No placeholder Arabic. Clearing Arabic values already in local databases is done with the reseed |
| F7 | Tests | Update factories and tests that set or assert Arabic values (`test/harness/factories.mjs`, `test/database-constraints.test.mjs`, `test/endpoints/areas.test.mjs`, `auth.test.mjs`, `catalog.test.mjs`) so that no Arabic data is required |
| F8 | Frontend | Remove hard-coded Arabic area names and `nameAr` search matching (`app/(public)/areas/page.tsx`, `areas/[slug]/page.tsx`). Property pages render English fields only |
| F9 | Search / RAG / AI (when built) | Lexical search queries `searchVectorEn` only. Embeddings, RAG chunks and AI answers use English content only. Nothing calls `ar_normalize` |

F1–F8 is one reviewed change (schema + API contract + dependants). It follows the normal implementation
gate: plan → approval → implement → verify.

### #102 — No agent-only SOLD: sale completion always needs both parties
`2026-09-17` · **LOCKED** · Product · **Accepts and resolves P7** · Confirms #77 (governing rule), #82 · **Removes P11**, amends O12/O13 · Affects: `product/BUSINESS_RULES.md` §2, §4; `product/ROLES_AND_PERMISSIONS.md`; `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`; `GLOSSARY.md`

**Context.** #77 requires both buyer and agent to confirm before a reserved listing becomes `SOLD`, but
`BUSINESS_RULES.md` kept two agent-only paths (P7): **P11** (`PUBLISHED → SOLD` by the agent, the
"offline-sale escape hatch" from #5) and **O13** (`RESERVED → COMPLETED` by the agent alone, which set
the property to `SOLD`).

**Decision.** **An agent can never make a listing `SOLD` independently.** The only path to `SOLD` is:

```text
Accepted offer
→ Deposit paid (offer and listing RESERVED)
→ Cooling-off / sale process
→ Buyer confirmation + Agent confirmation
→ Sale completed (offer COMPLETED)
→ Listing SOLD
```

- **#77 remains the governing rule** for two-party completion. When a case enters admin review under
  the existing rules (P9a: 30 days without both confirmations, or a buyer–agent disagreement), the
  admin decides per #82 (confirm → `SOLD`, fell through, or extend), subject to #67/#71.
- **P11 is removed.** There is no `PUBLISHED → SOLD` transition. A deal agreed off-platform is
  recorded through the existing **O1b** path (the agent records the terms, the buyer confirms) and
  then follows the path above.
- **O13 becomes the offer side of P9.** `RESERVED → COMPLETED` happens only when both parties have
  confirmed (or an admin confirms at review), at the same moment as P9.
- **O12** loses its "property sold offline" trigger.
- **No new state** (such as `SALE_REPORTED`) is introduced.

**Consequences.**
- Property transitions drop from 17 to 16 (P11 kept as a retired row number for traceability).
- #5's "direct `PUBLISHED` to `SOLD`" escape hatch is superseded.
- **OPEN (not decided here):**
  - whether completion confirmations may be recorded before the 48-hour cooling-off window ends
    (the rule lists cooling-off before confirmation but sets no guard);
  - how a property sold entirely outside Settly, with no buyer on the platform, is handled. The only
    existing agent option is archiving (P7), and no special handling is decided.
- **Implementation follow-ups (not done by this decision; no code, schema or API is changed):**
  1. `backend/src/modules/catalog/routes/property.routes.ts` and `service/property.service.ts`:
     - `POST /api/v1/properties/{id}/offline-sale` (P11, `offlineSale`) must be removed;
     - `POST /api/v1/properties/{id}/mark-sold` (`markSold`, the agent alone completes a reserved
       sale) must be replaced by the two-party confirmation flow with admin review (#77, #82).
  2. Regenerate the OpenAPI spec and the frontend snapshot afterwards.
  3. Update the tests that exercise these actions.
  4. Transaction T6 (offline sale) in `CONCURRENCY_AND_IDEMPOTENCY.md` is retired; the atomic writes
     of the two-party completion are designed with that flow.

### #103 — Subscription charge currency: EGP at a fixed V1 rate of 48.98 EGP per USD
`2026-09-17` · **LOCKED** · Payments / Product · **Supersedes the display-toggle and open-currency parts of the #89 amendment** · Refines #88, #90, #92 · Affects: `product/BUSINESS_RULES.md` §1, §2.5; `architecture/PAYMENTS.md`; `architecture/DOMAIN_MODEL.md`; `GLOSSARY.md`

**Context.** The #89 amendment made USD the canonical subscription price, allowed a USD/EGP display
toggle, and left the charge currency, receipt currency and exchange-rate source open (V37). A
live-rate model (a CBE sell rate, a refresh job, blocking checkout on a stale rate, an external rate
provider) was then proposed in discussion as S158–S160. **It was never recorded and is withdrawn by
this decision.**

**Decision (subscription payments only).**

| Item | V1 rule |
|---|---|
| Canonical plan prices | **Free $0 · Pro $20 · Enterprise $50 per month (USD)** — unchanged from #89 |
| Plans UI | Shows **USD prices only**. **No USD/EGP currency toggle**, and EGP is never shown as an alternative plan price |
| Charge currency | **EGP** — the Paymob payment is created in EGP |
| Conversion rate | **Fixed: 1 USD = 48.98 EGP.** A product/business rate, **not a live market rate**, never refreshed automatically. Changing it needs a new decision |
| Calculation | `EGP = USD amount × 48.98`, then **round up to the next whole EGP** (rounding applied once, to the final amount) |
| Before checkout | The agent sees the **exact EGP amount that will be charged** before being redirected to Paymob |

| Plan | USD | × 48.98 | EGP charged | Minor units |
|---|---:|---:|---:|---|
| Free | $0 | — | no payment | — |
| Pro | $20 | 979.60 | **980 EGP** | 2000 US cents → 98,000 piastres |
| Enterprise | $50 | 2,449.00 | **2,449 EGP** | 5000 US cents → 244,900 piastres |

- ~~**New paid subscription (#88):** the prorated USD amount is converted with the same rule~~
  **Superseded by #104:** there is no proration. **Every paid period** (first, re-subscription,
  upgrade, renewal) converts the **full USD price**: 980 or 2,449 EGP.
- **Payment record:** stores the USD base amount (cents) and the EGP charged amount (piastres,
  always a whole-pound multiple) with currency `EGP`, plus the rate used (48.98) for audit. The
  webhook checks that EGP amount and currency exactly. The rate is a business constant in the
  backend configuration module (#31); there is no rate table, rate provider or refresh job.
- **Receipt (#90):** shows the **EGP amount charged** as the paid amount, with the plan's USD price,
  the 30-day period (#104) and the fixed rate (1 USD = 48.98 EGP) as reference.
- **Superseded:**
  - from the #89 amendment: the USD/EGP display toggle, "EGP is a converted display value", and open
    items 1–3 (charge currency, receipt currency, exchange-rate source);
  - the withdrawn S158–S160 proposal: the CBE sell rate, FX refresh jobs, stale-rate blocking and live
    exchange-rate providers.
- **Unchanged:** real-estate listing prices, the reservation deposit (5%, capped at 50,000 EGP),
  refunds and retention, and the transaction-fee rules (#79) — all EGP as before.

**Consequences.**
- V37 is narrowed to Paymob confirming that the Egypt account accepts the exact EGP amounts Settly
  sends.
- V36 (legal, VAT and e-invoicing review) also covers showing USD plan prices while charging EGP
  (Law 194/2020: dealing inside Egypt is in Egyptian pounds).
- **OPEN:** ~~the proration formula (#88); re-subscription after a lapse and renewal timing after an
  upgrade (#92)~~ *(resolved by #104)*; the subscription payment data model (a separate record, since
  `Payment` requires an offer) **→ resolved by #105**.
- **Not implemented:** no code, schema, migration, UI or payment-integration change is made by this
  decision.

### #104 — Subscription periods: 30 days from the start time, full price, no proration
`2026-09-17` · **LOCKED** · Product / Payments · **Supersedes the S2 part of #88** · Amends #90, #92, #103 · Affects: `product/BUSINESS_RULES.md` §1, §2.5; `architecture/PAYMENTS.md`; `GLOSSARY.md`

**Context.** #88 (S2) gave a new paid subscription a **prorated** first payment and a first period
ending at the **end of the calendar month**, while #92 gave upgrades a full-price **one-month**
period from the upgrade time. That left re-subscription and renewal timing open, and made #103 need a
proration formula. The proration questions S161–S162 were raised in discussion only; **they are
withdrawn and not applicable**.

**Decision.**
- **Every paid subscription period lasts 30 full days from its exact start time**
  (e.g. starts September 17 → ends October 17).
- The agent **always pays the full plan price**: **no proration, no credit**. At the fixed rate
  (#103) that is **980 EGP** for Pro and **2,449 EGP** for Enterprise.
- This applies to:
  - the **first paid subscription**;
  - **re-subscription after expiry or cancellation**;
  - a **mid-period upgrade**;
  - **subsequent renewals**.
- **Upgrade:** charges the **full price of the new plan** and **starts a new 30-day period
  immediately** from the upgrade time (e.g. upgrade September 17 → new period ends October 17). The
  previous plan's remaining time is **not prorated or credited**. Quota effect unchanged (#92: new
  plan quota − publications already consumed this calendar month; waiting listings may publish, #94).
- **Downgrade:** takes effect **when the current 30-day paid period ends** (#92's "until its paid
  period ends").
- **Cancellation / expiry:** unchanged (#91). A cancelled plan runs to the end of its 30-day period
  with no refund; an unrenewed or failed plan moves to Free on its expiry time.

**Two separate cycles — never merged.**

| Cycle | Rule |
|---|---|
| **Subscription billing period** | **30 days from the start time** of each paid period (this decision) |
| **Listing quota month** | **Calendar month in Cairo time, reset on the 1st** (#88, unchanged) |

Wherever the quota rules say "billing month" (#80, #86, #87, I13, P3), they mean the **Cairo
calendar quota month**, not the subscription period.

**Superseded:**
- #88's S2 bullet (prorated first payment, first period ending at month end);
- #92's "one-month period" wording and its S2/S11 clarification table;
- #92's two OPEN points (re-subscription after a lapse, renewal timing after an upgrade), now
  resolved: full price and a 30-day period;
- #103's proration line and its open proration-formula point.

~~**OPEN (not decided here):** early-renewal start; 30-day time arithmetic.~~ **Resolved by the
amendment below.**

**Amendment (2026-09-17) — early renewal and period arithmetic (approved by the product owner).**

*Early renewal (same plan):*
- A renewal paid while a period is active **starts when the current period ends** (stacked). The
  agent never loses paid days, and no credit is involved.
- Renewal is available **only in the last 7 days** of the active period. Outside that window, and
  after expiry, the agent starts a new subscription (a full-price 30-day period from payment).
- **At most one queued period** at a time. A different plan goes through the upgrade or downgrade
  flow, never through renewal.
- **Upgrade is blocked while a renewal is queued**, until the queued period starts. The UI explains
  why. This keeps an already-paid queued period from being lost.

*Period arithmetic:*
- A period is **exactly 30 × 24 hours (720 hours)** from its start instant:
  `endsAt = startsAt + 30 days`, stored in **UTC**, computed server-side (#21) and displayed in Cairo
  time.
- It is **not** "same date next month". January 17 → **February 16**; July 17 → **August 16**;
  September 17 → October 17.
- Across a Cairo daylight-saving change, the displayed end time differs from the start time by one
  hour. This is accepted.
- A queued renewal's `startsAt` equals the previous period's `endsAt`.

**Not implemented:** no code, schema, migration, UI or payment-integration change.

### #105 — Subscription payment data model
`2026-09-17` · **LOCKED** · Data / Payments · Resolves the data-model open point of #103 · Implements the rules of #88–#93, #103, #104 · **Design only — implementation pending** · Affects: `architecture/DOMAIN_MODEL.md`, `architecture/PAYMENTS.md`, `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`, `product/BUSINESS_RULES.md` §2.5

**Context.** Subscription payments need a record, but the deposit `Payment` requires an `offerId` and
carries deposit-only invariants: one reserved offer per property, the 72-hour deadline, the checkout
hold and the refund flows. #79 says subscription payments must not be assumed to follow the deposit
design.

**Decision.** **Separate subscription tables; the deposit `Payment` is not reused or generalised.**

**Reused unchanged:**
- `WebhookEvent` (one inbound table, deduplicated on `(provider, eventId)`). The Paymob merchant
  order reference carries a prefix (`sub_` / `dep_`) so the webhook routes to the right flow;
- `IdempotencyKey`, `AuditLog`, the provider port (`createCheckout`, `getTransaction`,
  `verifyWebhook`);
- the reconciliation-job pattern and the per-user advisory lock.

**Four new tables:**

| Table | Purpose | Key fields |
|---|---|---|
| `AgentSubscription` | One row per agent; anchors the subscription | `agentId` (unique), `cancelledAt`, timestamps |
| `SubscriptionPeriod` | One row per **paid** 30-day period (Free has none) | `subscriptionId`; `plan` (`SubscriptionPlan`: `PRO` \| `ENTERPRISE`); `kind` (`NEW` \| `RENEWAL` \| `UPGRADE` \| `DOWNGRADE`); `startsAt`, `endsAt` (UTC, `endsAt = startsAt + 30 days`); `endedEarlyAt` (set when an upgrade replaces the period); `status` (`SCHEDULED` \| `ACTIVE` \| `ENDED` \| `SUPERSEDED`); `paymentId` (unique) |
| `SubscriptionPayment` | The payment obligation for one period | `agentId`, `plan`, `kind` (snapshot); `baseAmountMinor` BigInt, US cents, `baseCurrency = 'USD'`; `fxRate` Decimal(10,4) (snapshot of 48.98, #103); `chargedAmountMinor` BigInt, piastres, `chargedCurrency = 'EGP'`; `feeAmountMinor`, `netAmountMinor` BigInt piastres; `status`; `expiresAt`; `paidAt`; `receiptNumber` (unique, sequential) |
| `SubscriptionPaymentAttempt` | One try at Paymob; failure belongs here, not to the obligation | `subscriptionPaymentId`, `provider`, `providerTransactionId`, `status`, `error` |

**No plan table and no exchange-rate table.** Prices, quotas and the rate are business constants in
the backend configuration module (#31) and are copied into each payment when it is created.

**Subscription payment states** follow the documented deposit pattern (`BUSINESS_RULES.md` §5), not the
drifted deposit enums in the current schema:
- `PENDING` (created; the exact EGP amount has been shown);
- `PROCESSING` (redirected to Paymob);
- `SUCCEEDED` (**verified webhook or reconciliation only**; the browser return never sets it);
- `EXPIRED` (**checkout lifetime of 60 minutes** passed unpaid);
- `CANCELLED` (replaced by a newer checkout from the same agent).

A failed attempt returns the payment to `PENDING`. There are no refund states, since subscriptions
are never refunded (#91), except the exception rule below.

**Rules and database protections:**

| Rule | Enforcement |
|---|---|
| **Effective plan** = the plan of the period where `startsAt ≤ now < coalesce(endedEarlyAt, endsAt)`; otherwise **Free** | Computed on read, so a queued period takes effect by time alone. I13 reads it under the per-user advisory lock (#95) |
| No overlapping periods per agent | Exclusion constraint on `(subscriptionId, tstzrange(startsAt, coalesce(endedEarlyAt, endsAt)))`, the pattern of viewing overlaps (R4) |
| At most one queued period | Partial unique index on `subscriptionId` WHERE `status = 'SCHEDULED'` |
| At most one open checkout per agent | Partial unique index on `agentId` WHERE `status IN ('PENDING','PROCESSING')`. Starting a new checkout cancels the old one |
| Currency and whole-pound checks | `CHECK (baseCurrency = 'USD')`, `CHECK (chargedCurrency = 'EGP')`, `CHECK (chargedAmountMinor % 100 = 0)` |
| Webhook | Maps by the `sub_` reference, checks the stored EGP amount and currency exactly, then creates or activates the period atomically |
| Upgrade | One transaction: current period → `SUPERSEDED` with `endedEarlyAt = now`; new `UPGRADE` period `[now, now + 30 days)`; waiting listings published FIFO (#94) under the per-user lock |
| Anonymisation (#42) | Subscription and payment rows are kept as financial records; the person is anonymised, as for deposits |

**Gap answers (approved by the product owner):**
1. **Downgrade to a lower paid plan** (Enterprise → Pro) is a paid, queued `DOWNGRADE` period that
   starts when the current period ends. It uses the renewal rules of #104: only in the last 7 days,
   one queued period, and it blocks upgrades until it starts. A downgrade to Free means letting the
   plan expire; there is nothing to pay.
2. **Cancelling while a period is queued:** the queued period is already paid and **still runs** (no
   refund, #91). Cancellation only stops renewal reminders and records `cancelledAt`.
3. **Checkout lifetime:** **60 minutes**, then `EXPIRED`.
4. **A payment that succeeds but cannot be applied** (the agent's state changed during checkout) is
   **flagged for admin review and refunded manually through Paymob**. This is the only subscription
   refund path; it is an exception, not a product feature.

**Consequences.**
- The table inventory grows from 39 to 43, before the other pending additions in
  `DOMAIN_MODEL.md` §11a.
- New race entries R12–R14 and transactions T8–T9 in `CONCURRENCY_AND_IDEMPOTENCY.md`.
- **Separate follow-up, not part of this decision:** the implemented deposit enums disagree with
  `BUSINESS_RULES.md` §5:
  - `PaymentStatus` has `FAILED` but no `CANCELLED`;
  - `AttemptStatus` lacks `ABANDONED` and `EXPIRED`;
  - `RefundStatus` uses `COMPLETED` instead of `SUCCEEDED`.
- **Not implemented:** no schema, migration, code, API or UI change. The implementation follows the
  normal gate (plan → approval → implement → verify).

### #106 — Slice 1 defaults: viewing length, portal landing routes, phone step, unbuilt actions
`2026-09-17` · **LOCKED** · Product / Frontend · Chosen by the assistant on the product owner's instruction ("choose what is best"; portfolio scope, #46) · Affects: `product/BUSINESS_RULES.md` §3, `architecture/FRONTEND.md` §6, `discovery/06-slice-1-screen-specs.md`

**Context.** The slice-1 screen specifications (#48 vertical slice) need a few values that no decision
set.

**Decision.**
1. **A viewing lasts 60 minutes.** Agent availability windows are split into 60-minute slots, and a
   window shorter than 60 minutes is rejected. This matches the 14:00–15:00 example in
   `BUSINESS_RULES.md` §3.1.
2. **Buyers may request viewings up to 30 days ahead** (UI and service limit).
3. **Portal dashboards live at the prefix root:** `/buyer`, `/agent`, `/admin` (#100).
4. **The Google phone step is `/complete-profile`.** A signed-in user without a phone cannot use any
   portal page until the phone is saved (#60).
5. **Actions whose phase is not built are not rendered** (no fake buttons). In slice 1 that means
   make offer, message agent and favourite on the property page.
6. **Slice-1 agents and listings come from the seed.** The agent application flow is a later phase.

**Confirmed, not new:**
- **Email verification is by Better Auth link only.** #9 already lists `emailOTP` as not used, so the
  custom 6-digit OTP in the code is removed (gap B3/F3).
- **Session policy is 7 days sliding with a 30-day absolute cap** (V12, verified); `AUTH.md` §3 is
  corrected to match (gap B4).

**Not implemented:** documentation only.
