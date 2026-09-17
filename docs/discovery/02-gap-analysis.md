# Gap Analysis — Implementation vs Intent

    Status:       DISCOVERY WORKING DOCUMENT · updated after every confirmed decision
    Last Updated: 2026-09-17 (after discovery batch 6)
    Related:      01-system-audit.md, ../product/*, ../architecture/*, ../DECISIONS.md

**"Intended behaviour" comes only from existing LOCKED documents** (`product/`, `architecture/`,
`DECISIONS.md`) or from answers given during discovery. Where no source states the intent, the
column says **UNKNOWN — requires product decision**. Where two sources disagree, the row is
**CONTRADICTORY**.

Statuses: COMPLETE · PARTIAL · MISSING · CONTRADICTORY · UNKNOWN · NEEDS DECISION

---

## A. Product direction and documentation

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| A1 | Product positioning | UI and new docs say "institutional-grade luxury", "prime corridors", "sovereign/fiduciary", "escrow" | **Whole Egyptian residential market, premium brand feel** (#45); escrow out of scope | CONFIRMED (#45) — implementation CONTRADICTORY | UI copy, `SETTLY_MASTER_PLAN.md` | — (see A6, A7) |
| A2 | Execution plan | `SETTLY_MASTER_PLAN.md` + `phases/`: screen-order plan | **`process/ROADMAP.md` + `IMPLEMENTATION_PLAN.md` are authoritative**; next = finish the vertical slice (#48) | CONFIRMED (#48) | banners added to master plan and phases | — |
| A3 | "Zero application code" statements | Code exists | Docs describe the current state (#30) | PARTIAL | `ROADMAP.md` updated; `AI_AGENT_RULES.md` §2 and `README.md` still stale | Mechanical refresh; no decision needed |
| A4 | Placeholder / fabricated content | Several pages and two APIs return invented figures; a banner says "illustrative placeholders" | `design/candidates/settly-landing/DESIGN.md` §104, §233: "Settly has not launched. Never invent counters"; invented statistics are an anti-pattern. #27: the seed corpus must be realistic | NEEDS DECISION | audit §10, §12 | Is fabricated data acceptable for the current (portfolio/demo) stage, and where must it stop? |
| A5 | Project stage | Demo with a mockup banner | **Demo first, production-ready by design** (#46) | CONFIRMED (#46) | — | — |
| A6 | Luxury-only assumptions in the UI | Search price slider capped at 60M EGP; hard-coded "prime corridor" facets; exclusivity copy | Whole market (#45) | CONTRADICTORY | `SearchWorkspace.tsx`, `FacetRail`, landing copy | — (implementation follow-up) |
| A7 | Off-plan concepts in the UI | "Handover 2026/2027" facet, developer facet, instalment plans, delivery year on the detail page | Off-plan deferred (#47) | CONTRADICTORY | `SearchWorkspace.tsx`, `mapProperty.ts`, `properties/[slug]` | — (implementation follow-up) |
| A8 | Launch blockers for payments | Not assessed | Deposits in sandbox for the demo; a real launch needs legal/regulatory confirmation | UNKNOWN | V34 | — (verification item, before launch) |

## B. Roles and identity

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| B1 | Agent onboarding (J4) | Signup always creates USER; agent-profile call 403'd silently; nothing grants AGENT; register page has an "Advisor" tab | **Buyer first, then an agent application (National ID + selfie + professional proof), admin-approved** (#49) | CONFIRMED (#49) — implementation MISSING/CONTRADICTORY | `register/page.tsx`, `profile.routes.ts` | See B8, B9, B11 |
| B2 | Agent verification | Admin approves license number + brokerage name; no documents | Identity (manual ID-vs-selfie) + any admin-reviewable professional proof; rejection reason; re-apply anytime, one pending application; revocable (#49, #55–#58, #74) | CONFIRMED — implementation PARTIAL | `admin-agent.routes.ts` | — |
| B3 | Email verification | Better Auth link **and** a custom 6-digit OTP | V1/O1/O3/O5/Y2 guarded by email verification (#38); mechanism = email links (#9) | CONTRADICTORY — **decided: link only (#9, #106); OTP removal is implementation work** | `identity/auth.ts`, `routes/index.ts` | — |
| B4 | Session policy | 30 d sliding, no absolute cap | 7 d sliding + 30 d absolute cap (V12) | CONTRADICTORY — **decided: 7 d sliding / 30 d cap (V12, #106); config change is implementation work** | `auth.ts` session config | — |
| B5 | User id format | Better Auth default ids **[inferred]** | UUIDv7 everywhere (V5) | PARTIAL | `auth.ts` has no `generateId` | Fix before real data exists |
| B6 | Phone | Register page collects a phone but **never sends it**; backend has no field | Required at sign-up, international, unverified; visible to agent only after an offer; agent phone never public (#53, #60) | CONFIRMED — implementation CONTRADICTORY | `register/page.tsx`, `schema.prisma` | See B13–B15 |
| B8 | Role model for buyer + agent | Single `role` enum; frontend middleware redirects AGENT away from buyer routes | One role per account: USER / AGENT (+buyer) / ADMIN (+buyer); same login, portal switcher (#97) | CONFIRMED — implementation CONTRADICTORY (middleware redirect) | `middleware.ts`, `schema.prisma` Role | — |
| B9 | KYC data (ID images, selfie, ID number) | Nothing | Private storage, audited admin access (each view audited), no PII in AuditLog; retention period after legal review (#25, #42, #56, #57, V35) | CONFIRMED — implementation MISSING | — | — |
| B10 | Self-dealing | No rule | On own listings an agent may not offer, request viewings, message as buyer, or be named in O1b (#59) | CONFIRMED — implementation MISSING | — | — |
| B11 | Agent application lifecycle | `AgentProfile.isVerified` only | Submit → review → approve / reject (reason) → re-apply; revocation → re-verification (#49, #57, #58) | CONFIRMED — implementation MISSING | `schema.prisma` AgentProfile | Data model in step 7 |
| B12 | Admin scope | 12 listing routes accept `ADMIN` for agent actions; no conflict-of-interest check | Admins may buy, may not list (#59); no self-involved cases (#67) | CONFIRMED — implementation CONTRADICTORY | `property.routes.ts`, `admin-agent.routes.ts` | See B16 |
| B13 | Public agent phone numbers | Public agents page shows WhatsApp numbers (mock) and contact buttons | Agent phone never public (#60) | CONTRADICTORY | `agents/page.tsx` | — |
| B14 | Google sign-in without phone | Google OAuth enabled; no phone collected | Phone required at sign-up (#60) | MISSING | `auth.ts` | Completion step before first use? |
| B15 | Phone visibility lifecycle | Not modelled | Visible to agent while the buyer's offer (incl. O1b) is pending/accepted/reserved/completed; never to buyers; admin access audited (#66, #72) | CONFIRMED — implementation MISSING | — | — |
| B16 | "Personally involved" | — | Offer, viewing or conversation on the listing or with that agent; another admin handles it; demo seeds two admins (#71) | CONFIRMED — implementation MISSING | — | — |
| B7 | Account deletion / anonymisation | Not implemented | §11 BUSINESS_RULES, #42 | MISSING | — | — |

## C. Listings and catalog

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| C1 | Property states | 9 enum values incl. `RENTED`; no RENTED transition in code | **9 states; PUBLISHED → RENTED by the agent for rentals** (#78) | CONFIRMED — transition MISSING | `schema.prisma`, BUSINESS_RULES §2 P15 | Exits from RENTED (relist?) — C19 |
| C2 | Listing transitions P1–P15 | Implemented with CAS + audit; **`mark-sold` lets the agent alone complete a sale** (and `offline-sale` implements the removed P11; both are #102 follow-ups) | As documented; **P9 needs both confirmations + 30-day review** (#77); P15 RENTED (#78) | CONTRADICTORY | `property.service.ts` markSold | Side effects also missing (notifications, embeddings, saved-search matching, refunds) |
| C3 | Egyptian listing attributes | No developer, compound, finishing, delivery, payment plan, land area, floor. The UI invents them | **Resale only in V1** (#47): off-plan fields are out of scope. Which **resale** attributes are required is still open | PARTIAL — NEEDS DECISION | `properties/[slug]/page.tsx`, `mapProperty.ts` | Required resale attributes (finishing, floor, building age, compound name, land/garden area…)? |
| C4 | Developer entity | Guessed from title text | **Deferred with off-plan** (#47). Whether resale listings show a compound or developer *name* as plain text is open | NEEDS DECISION | `mapProperty.ts inferDeveloper` | Is compound/developer name a plain attribute of a resale listing? |
| C11 | Revocation cascade | Only single-listing suspend (P12) exists | All non-SOLD listings suspended; RESERVED → admin review, no automatic refund; offers/viewings frozen; re-verification → admin review (#58) | CONFIRMED — design + implementation MISSING | BUSINESS_RULES §2.4, §7 | See C13, C14 |
| C12 | Price semantics for under-construction resale | `price` = one BIGINT | `price` = paid to seller; remaining instalments separate; deposit on `price` (#61) | CONFIRMED — fields MISSING | — | Remaining-instalments structure (C15) |
| C13 | "Frozen" offers and viewings | No such concept; expiry is time-driven | Buyer may exit without penalty (#62); clocks pause and resume (#63) | CONFIRMED — design + implementation MISSING | BUSINESS_RULES §2.4, §10 | Storage of freeze state (step 7) |
| C14 | Reserved listing under revocation review | — | Admin decides within 5 business days: release or cancel with 100%; buyer withdrawal = 100% (#64) | CONFIRMED — implementation MISSING | BUSINESS_RULES §2.4, §7 | See C17, C18 |
| C15 | Remaining instalments structure | — | Total, count, frequency (monthly/quarterly/semi-annual/annual), end date; all required together (#68, #73) | CONFIRMED — fields MISSING | — | — |
| C16 | Suspended listings after re-verification | — | DRAFT/ARCHIVED restore; PENDING_REVIEW re-queued; REJECTED stays; PUBLISHED/RESERVED need review (#65, #69) | CONFIRMED — design MISSING | — | — |
| C17 | Missed 5-day review deadline | — | Auto-cancel with 100% refund; release only after re-verification (#69) | CONFIRMED — implementation MISSING | — | — |
| C18 | Business-day calendar | — | Sun–Thu minus admin-maintained Egyptian holidays (#70) | CONFIRMED — storage + admin UI MISSING | — | — |
| C19 | Exits from RENTED | — | Not terminal; relist via new DRAFT → PENDING_REVIEW → PUBLISHED lifecycle with history preserved; included in revocation (#81) | CONFIRMED — implementation MISSING | BUSINESS_RULES P16 | New record vs same record? Post-re-verification state? |
| C20 | Sale-completion review outcomes and disputes | Agent-only mark-sold | Admin confirms SOLD / declares fell-through / extends; disagreements go to admin review; conflict-of-interest applies (#82) | CONFIRMED — implementation CONTRADICTORY | BUSINESS_RULES P9a | Extension limits? Dispute enters review immediately? |
| C5 | Rent pricing | `price` + `rentalPeriod` fields exist | Rent = discovery + viewings + inquiries only | PARTIAL | schema | — |
| C6 | Area taxonomy | Area table (GOVERNORATE/CITY/DISTRICT/COMPOUND); public pages use 4 hard-coded "corridors" | Area = identity + geometry + names/aliases; guides in KnowledgeArticle (#39) | CONTRADICTORY | `areas/page.tsx`, `area.schema.ts` | Are "corridors/regions" (East Cairo, North Coast…) a real grouping? Where does area guide content come from? |
| C7 | Listing images | ≥3 required to submit; Cloudinary upload | Same (P2) | COMPLETE (backend) | `upload.routes.ts` | Max images? Size limits? (V16) |
| C8 | Agent listing UI | None | Agent portal (FR12) | MISSING | — | — |
| C9 | Admin moderation UI | None | #28 kept: moderation, audit viewer, reports | MISSING | — | — |
| C10 | Resale of under-construction units | Not modelled | **Included in V1 resale** with expected delivery and remaining instalments (#54) | CONFIRMED (#54) — implementation MISSING | — | Price semantics and deposit base (C12) |

## D. Discovery and search

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| D1 | Search | `GET /properties` returns the latest 20; filtering happens in the browser | Three execution paths (filter / map viewport / natural language) behind one endpoint (#14); SSR `/properties` | MISSING | `SearchWorkspace.tsx` | — (decided; not built) |
| D2 | Search facets | Hard-coded lists and counts | Real taxonomy (Area, Amenity) | CONTRADICTORY | `FacetRail` props | — |
| D3 | Market insights / area stats | Hard-coded numbers | Materialized views refreshed nightly (#10, #23) | CONTRADICTORY | `market.routes.ts`, `area.service.ts` | Where would real market data come from (only Settly's own listings/sales, or an external source)? |
| D4 | FX rates | Hard-coded USD/EUR | Not specified; multi-currency is out of scope | UNKNOWN | `market.routes.ts` | Should the product show USD/EUR conversions at all? |
| D5 | Favourites / collections, saved searches + alerts | Tables only | FR3, FR4 (max 25) | MISSING | — | — |
| D6 | Compare | Implemented (2–4, published only) | Listed in Decision #19 as an agent tool; no documented product rules | PARTIAL | `compare.routes.ts` | Is compare state kept only in the URL, or saved per user (Zustand "compare tray" per FRONTEND.md)? |
| D7 | Bilingual UI | English only | ~~`/en` + `/ar` with RTL (#39)~~ → **English-only V1 UI (#99)** | CONFIRMED — IMPLEMENTED (English only) | `layout.tsx` | Resolved by #99 (English only end to end, amended 2026-09-17) |
| D8 | Rendering strategy | Client-rendered public pages | SSG/ISR/SSR matrix (#23) | CONTRADICTORY | page files | — |
| D9 | Map library | Leaflet; CARTO tiles on area pages; hard-coded MapTiler key | **Leaflet + MapTiler everywhere; key in `NEXT_PUBLIC_MAPTILER_KEY`, domain-restricted** (#96) | CONFIRMED — implementation PARTIAL (CARTO and hard-coded key remain) | `SearchMap.tsx`, `AreaRadarMap.tsx` | — |

## E. Transactions (buyer journey J1)

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| E1 | Leads | Table only (statuses NEW, CONTACTED, QUALIFIED, LOST) | Created on first contact (#75); hybrid pipeline NEW → CONTACTED → QUALIFIED → WON / LOST (#83) | CONFIRMED — `WON` missing from schema; implementation MISSING | `schema.prisma` LeadStatus | Exact automatic rules; other buyers' leads when a listing closes |
| E2 | Viewings (V1–V11) | Table + exclusion constraint | Full state machine, max 3 open requests | MISSING | — | — |
| E3 | Agent availability | Table only | Availability as local wall-clock time | MISSING | — | — |
| E4 | Offers (O1–O15) | Table + unique index | Full state machine, max 5 live | MISSING | — | — |
| E5 | Deposit / payments | Tables only; no Paymob | Paymob hosted checkout, 15-min hold, webhook + reconciliation | MISSING | — | — |
| E11 | Revenue model | Not implemented | Transaction revenue (TBD amounts) + agent listing subscription, exactly 3 plans: Free 2 / Pro 4 / Enterprise 8 new listings per month (#79, #80) | CONFIRMED — implementation MISSING | BUSINESS_RULES §2.5 | See E12 |
| E12 | Subscription and transaction-fee details | — | Billing month, payment method, receipts, expiry, cancellation, plan changes, starting plan, waiting listings, enforcement decided (#88–#95); prices decided (#89: $0 / $20 / $50, USD base; #103: EGP charge at fixed 48.98, no toggle); transaction fee and payouts TBD (#79) | PARTIAL — NEEDS DECISION | #88–#95 | Paymob acceptance of the exact EGP amounts (V37);  fee %, payer, payouts; re-subscription after a lapse and renewal timing after an upgrade period (#92; the S2/S11 conflict itself was clarified 2026-09-17); phase placement |
| E13 | Deposit bundle marks lead "won" at reservation | Docs only (not implemented) | WON only when the sale completes (#83) | RESOLVED in docs | BUSINESS_RULES §6.3, PAYMENTS §7 | — |
| E14 | 20% retention recipient (late buyer withdrawal) | Not implemented | **100% to the seller**; not Settly revenue; not paid to the agent (#84). Legal and payout implementation remain TBD under **V34** | RESOLVED (#84) — implementation MISSING | BUSINESS_RULES §1, §7 | — (payout mechanics: V34) |
| E6 | Refunds | Table only | 48 h cooling-off full refund, then 20% retained (to the seller, #84) | MISSING | — | — |
| E7 | Messaging | Unauthenticated WebSocket stub | #43: native WebSocket for 1-on-1 chat | MISSING | `settly-api.ts` | — |
| E8 | Notifications | Table + device registration | In-app authoritative (SSE) + email + push | MISSING | — | — |
| E9 | Documents | Table only | Private documents via signed URLs; PUBLIC/PARTY/PRIVATE visibility | MISSING | — | — |
| E10 | Reports (abuse) | Table only | Reports/moderation workflow (#28) | MISSING | — | — |

## F. Security and reliability

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| F1 | Secrets | Cloudinary credentials were plaintext in the public CI file | Secret rotated; `ci.yml` uses GitHub Actions secrets; no history rewrite (#98) | RESOLVED (#98) | `.github/workflows/ci.yml` | — (repository secrets must be configured in GitHub) |
| F2 | Rate limiting | None | Three-tier degradation (#12); sensitive endpoints never fail open | MISSING | — | — |
| F3 | OTP security | `Math.random`, plaintext, unlimited attempts | Hashed tokens (V22), rate-limited | CONTRADICTORY | `auth.ts`, `verify-otp` | Decide B3 first |
| F4 | Audit hooks on auth events | None | Login/logout/reset/revocation/ban audited (#9) | MISSING | `auth.ts` | — |
| F5 | Password hashing | Better Auth default (scrypt) | Argon2id (#9) | CONTRADICTORY | `auth.ts` | — |
| F6 | Helmet / headers / CORS | CORS allowlist only | Deliberately configured Helmet; exact allowlist (#33) | PARTIAL | `settly-api.ts` | — |
| F7 | Background jobs | Stub | 9 idempotent scheduled jobs (#10) **plus** revocation-review and 30-day sale-completion deadlines (#69, #77) | MISSING | `settly-worker.ts` | — |
| F8 | Idempotency keys | Table only | Required on 4 operations (#40) | MISSING | — | — |
| F9 | Email delivery | Synchronous in the request | Non-critical dependency (#10) | CONTRADICTORY | `resend.ts` | — |
| F10 | Health / readiness | `/health` only | `/health` liveness, `/ready` Postgres, `/health/detail` admin (#33) | PARTIAL | `settly-api.ts` | — |
| F11 | Observability | Pino logs | Sentry + admin metrics panel + Sentry Crons (#33) | MISSING | — | — |

## G. Engineering process

| # | Area | Current implementation | Intended behaviour | Status | Evidence | Question |
|---|---|---|---|---|---|---|
| G1 | Tests | HTTP integration scripts against the configured DB | Six layers; business rules at the service layer; real Postgres; concurrency tests serial (#41) | CONTRADICTORY | `backend/test/**` | — |
| G2 | Frontend tests | None | Vitest + RTL, MSW, thin Playwright (#21) | MISSING | — | — |
| G3 | Zod version | 3.24 | Zod v4 (#8) | CONTRADICTORY | `backend/package.json` | Low priority |
| G4 | Postgres version | 16 | 17+ (#6) | CONTRADICTORY | `docker/Dockerfile.postgres` | Depends on the chosen host |
| G5 | Business constants → docs | Constants in `config/index.ts`; the docs table is hand-written | The docs table is generated from config (#31) | PARTIAL | — | — |
| G6 | Deployment | None | Vercel + Railway + managed Postgres/Redis (#22, #44) | MISSING | — | Hosting choice: Supabase or Neon? (V6 mentions Neon, #22 Supabase) |

---

## Decisions required (summary)

Resolved in batch 1 (2026-09-17): A1 (#45), A2 (#48), A5 (#46), off-plan part of C3/C4 (#47).
Resolved in batch 2 (2026-09-17): B1 (#49), B6 (#53), C10 (#54); listing creation (#51); dual capability (#50); revocation principle (#52).
Resolved in batch 3 (2026-09-17): B2 (#55–#57), B9, B10, B11, B12 (#59), C11 (#58), C12 (#61).
Resolved in batch 4 (2026-09-17): C13 (#62, #63), C14 (#64), C16 (#65), B15 (#66), admin conflict of interest (#67), C15 (#68).
Resolved in batch 5 (2026-09-17): B2, B15, B16, C1, C15–C18 (#69–#74, #78); lead creation (#75); deposit crediting (#76); sale completion (#77).
Resolved in batch 6 (2026-09-17): E11 (#79, #80), C19 (#81), C20 (#82), E1 (#83).
Resolved 2026-09-17: E14 — 20% retention recipient = the seller (#84); legal/payout details stay under V34.
Resolved in batch 7 (2026-09-17): most of E12 (#88–#95), D9 (#96), B8 decision (#97), F1 (#98).

Still open — product: A4, B14, C3, C4, C6, D3, D4, D6, D7, **E12 (subscription and fee details, excluding the retention recipient)**; details inside C19, C20, E1.
Architecture proposals awaiting approval: P1 (maps), P5 (role model).
Architecture: D9 (P1), F3/B3, G6.
Urgent operational action (not a decision): **F1 — rotate the Cloudinary credentials.**
