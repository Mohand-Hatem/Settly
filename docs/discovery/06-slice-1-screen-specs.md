# Slice 1 Screen Specifications — Auth, Portal Shells, Property Detail, Viewing Requests

    Status:       SPECIFICATION (discovery) · design-ready · NOT implemented
    Last Updated: 2026-09-17
    Scope:        the locked vertical slice (#48): auth → properties → search → property detail → viewing request
    Derived from: 05-final-frontend-screen-inventory.md, ../product/BUSINESS_RULES.md §3 §9,
                  ../architecture/AUTH.md, ../architecture/API.md, ../architecture/FRONTEND.md,
                  ../design/UX_PATTERNS.md, ../DECISIONS.md #9, #38, #48, #59, #60, #97, #99, #100, #106

**Authority.** This document specifies behaviour only; rules come from the decisions and
`BUSINESS_RULES.md`, and visual design comes from the design system (#30). If a spec here disagrees
with a decision, the decision wins. Screen IDs match `05-final-frontend-screen-inventory.md`.

**Endpoints** are named after the API conventions (#40): action endpoints per transition, `/me/*`
for self-scoped collections, cursor pagination. **Exact paths are fixed when the OpenAPI spec is
generated**; the names below are the intended shape.

**Slice defaults (#106):**
- a viewing lasts **60 minutes**;
- the portal dashboards live at `/buyer`, `/agent` and `/admin`;
- the Google phone step is `/complete-profile`;
- actions whose phase is not built yet (offer, message, favourites) are **not rendered**, rather
  than shown as fake buttons;
- agents and listings in this slice come from the **seed** (the agent application flow is a later
  phase).

## 0. Slice map

| Spec | Screen | Route | Inventory ID |
|---|---|---|---|
| S1-01 | Portal shells + portal switcher + mobile nav | `/buyer/*`, `/agent/*`, `/admin/*` | BUY-00, AGT-00, ADM-00, SH-01, SH-12 |
| S1-02 | Register | `/register` | AUTH-01 (+ AUTH-05) |
| S1-03 | Login | `/login` | AUTH-02 (+ AUTH-05) |
| S1-04 | Verify email | `/verify-email` | AUTH-03 |
| S1-05 | Forgot / reset password | `/forgot-password` | AUTH-04 |
| S1-06 | Complete profile (Google phone step) | `/complete-profile` | AUTH-06 |
| S1-07 | Email-not-verified gate | global | SH-09 |
| S1-08 | Property detail (slice scope) | `/properties/[slug]` | PUB-03, MAP-04 |
| S1-09 | Request viewing (modal) | on S1-08 | PUB-03 action |
| S1-10 | Buyer dashboard (slice scope) | `/buyer` | BUY-01 |
| S1-11 | Buyer viewings + detail drawer | `/buyer/viewings` | BUY-04, BUY-05 |
| S1-12 | Agent dashboard (slice scope) | `/agent` | AGT-01 |
| S1-13 | Agent calendar, availability and viewing requests | `/agent/calendar` | AGT-12 |

Search (PUB-02) is already implemented; its corrections (MapTiler key from env, market-wide price
facets, CARTO removal) are listed in the inventory and need no new spec.

**Shared behaviour for every screen below** (not repeated per spec):
- **Loading:** skeletons.
- **Errors:** rendered from the RFC 9457 `type` + `params`, never from `title`/`detail`; an unmapped
  type shows a generic message (UX_PATTERNS §2).
- **Stale data:** `409 state-conflict` → refetch + "this has changed" banner (UX_PATTERNS §5).
- **Permissions:** `401` → login with `callbackUrl`; `403` → permission message; `404` → not-found
  state. A "not yours" and a "does not exist" 404 look the same.
- **Language:** English only (#99).
- **Destructive or high-impact actions:** confirmation (SH-06).
- **Accessibility:** WCAG 2.2 AA (keyboard, focus, labelled errors).

---

## S1-01 — Portal shells, portal switcher, mobile navigation

| Field | Specification |
|---|---|
| Role | USER (buyer shell only) · AGENT (buyer + agent shells) · ADMIN (buyer + admin shells) (#97) |
| Route | `/buyer/*`, `/agent/*`, `/admin/*` (#100). Dashboards at the prefix root (#106) |
| Purpose | One consistent frame per portal; switch portals with the same login |
| Entry points | Header account menu after sign-in; post-login redirect (S1-03) |
| Sections | Desktop: side navigation (portal items), top bar (portal switcher, notification bell placeholder hidden until notifications exist, account menu). Mobile: top bar + **bottom navigation** (primary items) + **More** sheet (secondary items) |
| Navigation (slice) | Buyer: Dashboard, Viewings, Settings (link only when built). Agent: Dashboard, Calendar & requests. Admin: Dashboard (placeholder page stating that admin tools arrive in a later phase). Items for unbuilt screens are **not shown** |
| Primary actions | Switch portal; sign out |
| States | USER: **no switcher**. AGENT: Buyer ↔ Agent. ADMIN: Buyer ↔ Admin (**never Agent**). Current portal highlighted |
| Permissions | Server authoritative. The middleware only checks cookie presence and **must not redirect agents or admins away from `/buyer/*`** (#97). Wrong role on `/agent/*` or `/admin/*` → redirect to `/buyer` with a notice |
| Dependencies | Session endpoint (current user + role) |
| Loading / error | Shell renders immediately; user menu shows a skeleton until the session loads; a session error → sign-in prompt |
| Mobile / desktop | Bottom nav ≤ 767 px; side nav ≥ 768 px |
| Acceptance criteria | (1) A USER never sees a switcher. (2) An AGENT can open `/buyer` and `/agent`. (3) An ADMIN can open `/buyer` and `/admin`, and `/agent` redirects to `/buyer`. (4) No "Agent Desk" anywhere in the admin shell. (5) No link to an unbuilt screen |
| Definition of done | Shell components used by S1-10…S1-13; middleware redirect conflict removed; auth redirects to `/buyer-dashboard/*` and `/agent-dashboard/*` removed (#100 follow-ups) |

## S1-02 — Register

| Field | Specification |
|---|---|
| Role / route | Visitor · `/register` |
| Purpose | Create an account. **Everyone registers as a buyer (USER)** (#49) |
| Entry points | Header "Get started"; login page link; `callbackUrl` preserved from a gated action |
| Sections | Name, email, password (strength hint), **phone** (required, international format; country selector defaulting to Egypt +20) (#60), terms acceptance, "Continue with Google" (AUTH-05) |
| Primary action | Create account → "check your email" state |
| Secondary actions | Continue with Google (→ S1-06 if no phone); go to login |
| States | idle · validating · submitting · **email sent** (shows the address, resend link) · email already registered (neutral message, no account enumeration beyond Better Auth defaults) · rate-limited |
| Permissions | Signed-in users are redirected to `/buyer` |
| Dependencies / API | Better Auth sign-up (`/api/auth/*`) with the `phone` additional field; the verification email is sent by the backend (Resend) |
| Not included | **No role tabs, no "Certified Advisor"/licence fields, no demo buttons, no "Enterprise SSO"** (C-16) |
| Mobile / desktop | Single column; the phone field uses a numeric keyboard |
| Acceptance criteria | (1) A new account has role USER. (2) Phone is required and stored normalised (E.164). (3) Submitting shows the email-sent state; no automatic sign-in redirect to a portal before verification is offered. (4) Google sign-up without a phone lands on S1-06 |
| Definition of done | Register page matches this spec; the phone reaches the backend (today it is collected but never sent) |

## S1-03 — Login

| Field | Specification |
|---|---|
| Role / route | Visitor · `/login` |
| Purpose | Sign in; the role comes from the account (#97) |
| Sections | Email, password, "Forgot password?", "Continue with Google", link to register |
| Primary action | Sign in → redirect to `callbackUrl` if it is a safe same-site path, else the role's default: USER → `/buyer`, AGENT → `/agent`, ADMIN → `/admin` |
| States | idle · submitting · invalid credentials (generic message) · **banned/suspended** (message with no reason details beyond what policy allows) · rate-limited · Google account without phone → S1-06 |
| Not included | **No Buyer/Advisor tabs, no demo buttons** |
| Acceptance criteria | (1) Redirect targets are `/buyer`, `/agent` or `/admin` only — never `/buyer-dashboard/*` or `/agent-dashboard/*`. (2) An open redirect via `callbackUrl` is impossible. (3) Unverified users can sign in (verification gates actions, not sign-in, #38) |
| Definition of done | Login page matches this spec; redirect targets fixed |

## S1-04 — Verify email

| Field | Specification |
|---|---|
| Role / route | Signed-up user · `/verify-email` |
| Mechanism | **Better Auth email link only** (#9 lists `emailOTP` as not used). The emailed link is a single-use capability token (AUTH §9). **No 6-digit code** — the custom OTP flow is removed (gap B3/F3) |
| Sections | "Check your inbox" message with the address, resend button (cooldown), change-email hint (sign out and register again is acceptable in V1) |
| States | **pending** (after register or from the gate) · **verifying** (landing from the link) · **verified** (continue to `callbackUrl` or the role default) · **expired/invalid link** (resend) · resend cooldown · rate-limited |
| Not included | "Autofill" and "Simulate Expired" demo controls |
| Acceptance criteria | (1) Clicking a valid link sets `emailVerified = true` and shows verified. (2) A reused or expired link shows the invalid state with resend. (3) No code input exists |
| Definition of done | OTP endpoints and UI removed; link flow end to end |

## S1-05 — Forgot / reset password

| Field | Specification |
|---|---|
| Role / route | User · `/forgot-password` (request) and the reset step reached from the emailed link |
| Sections | Step 1: email. Step 2 (from link): new password + confirm |
| States | request sent (**same message whether or not the email exists**) · invalid/expired link · password rules failed · reset done → sign-in |
| Security | A successful reset **revokes all sessions** (AUTH §3) |
| Acceptance criteria | (1) No account enumeration. (2) After reset, older sessions are signed out |
| Definition of done | Existing candidate kept (EXISTS); wired to Better Auth reset |

## S1-06 — Complete profile (Google phone step)

| Field | Specification |
|---|---|
| Role / route | Signed-in user **without a phone** · `/complete-profile` (#106) |
| Purpose | Google sign-in supplies no phone; the phone is required before using the app (#60) |
| Entry points | Automatic redirect after Google sign-in/sign-up when `phone` is empty; any portal route while the phone is missing |
| Sections | Phone (international, required); short privacy note: the phone is never public and is shared with an agent only while you have an offer on their listing (#60, #66, #72) |
| States | required · invalid · saving · saved → continue to `callbackUrl` or the role default |
| Permissions | Only the signed-in user; users who already have a phone are redirected away |
| Acceptance criteria | (1) A Google account without a phone cannot reach any portal page until the phone is saved. (2) Public pages remain browsable |
| Definition of done | Page + redirect rule implemented |

## S1-07 — Email-not-verified gate

| Field | Specification |
|---|---|
| Role / route | Signed-in, unverified users · global |
| Purpose | Make the verification boundary visible (#38; UX_PATTERNS §3) |
| Behaviour | (1) A **persistent banner** in portal shells: "Verify your email to request viewings and make offers" + resend. (2) Guarded actions stay **visible**; activating one opens a **verification dialog** (resend, open inbox hint) instead of the action. (3) A server `403 email-not-verified` shows the same dialog |
| Guarded in this slice | Request viewing (V1). Offer, counter, accept and deposit follow in the transactional phase |
| Never gated | Browsing, search, property detail, cancelling a viewing |
| Acceptance criteria | (1) An unverified user cannot create a viewing request (server-enforced). (2) The button is not hidden. (3) After verifying, the banner disappears without a manual reload |

## S1-08 — Property detail (slice scope)

| Field | Specification |
|---|---|
| Role / route | Everyone · `/properties/[slug]` (ISR; **no per-user cookies in Server Components** — personalised parts load client-side, FRONTEND §2) |
| Purpose | Understand a listing and request a viewing |
| Entry points | Search results, home, area pages, compare, shared links |
| Sections | Gallery; title, price (EGP), intent (sale/rent); key specs; **under-construction block** when applicable (delivery date, remaining instalments: total, count, frequency, end date; full cost = price + remaining, #61, #68); description (English, #99); amenities; **location map (Leaflet + MapTiler, #96)**; agent card (name, verified badge, profile link — **no phone, no WhatsApp contact**, #60); similar listings |
| Primary action | **Request a viewing** (S1-09) |
| Secondary actions | Compare; share; WhatsApp **demo CTA only if kept, clearly non-functional** (SH-11) |
| Not rendered in this slice | Make offer, message agent, favourite (their phases are not built — #106). No escrow wording, no developer payment plan, no deed "certified" badge, no 3D tour (C-3, C-5, C-11) |
| States | loading · not found / not public (404) · **own listing** (agent viewing their own listing: buyer actions hidden, "This is your listing" note, #59) · **`RESERVED`** (viewing action hidden; "Reserved" badge) · rental listing (viewing allowed) · map tiles failed (address text remains) |
| Permissions | Public read of `PUBLISHED`/`RESERVED` listings only |
| API | `GET /api/v1/properties/:slug` (exists); similar listings from the catalog service |
| Mobile / desktop | Mobile: sticky bottom bar with "Request a viewing"; desktop: sticky side card |
| Acceptance criteria | (1) No agent phone or real WhatsApp number anywhere in the page source. (2) The map uses MapTiler with the key from `NEXT_PUBLIC_MAPTILER_KEY`. (3) The own-listing state hides the viewing action. (4) Under-construction listings show the full cost |
| Definition of done | Page matches this spec; the local-state "Submit Escrow Offer", favourite and scheduler mocks are removed or replaced by the real viewing flow |

## S1-09 — Request viewing (modal on S1-08)

| Field | Specification |
|---|---|
| Role | Signed-in buyer (USER, AGENT on others' listings, ADMIN as buyer), **never the listing's agent** (#59) |
| Purpose | Create a viewing request (V1) |
| Entry points | "Request a viewing" on S1-08 |
| Pre-checks (client, for UX only; the server decides) | Signed out → login with `callbackUrl` back to the listing. Unverified → S1-07 dialog. Phone missing → S1-06 |
| Sections | Date picker (next 30 days) → **available 60-minute slots** (#106) derived from the agent's availability, shown in Cairo time; optional note to the agent; summary (listing, date, time) |
| Primary action | Send request → success state: "Request sent — the agent will confirm, decline or propose another time" + link to `/buyer/viewings` |
| States | loading slots · **no slots** in the chosen period (try another date) · submitting · success · **3 open requests reached** (I9: explain the limit, link to My viewings) · slot no longer available / outside availability (refresh slots) · listing no longer published (close modal, refresh page) · `email-not-verified` (S1-07) · idempotent retry (same key → same result) |
| API | `GET /api/v1/properties/:id/viewing-slots?from&to` (intended) · `POST /api/v1/viewings` with an **Idempotency-Key** (#40) |
| Business rules | V1 guards: `emailVerified`, listing `PUBLISHED`, time inside availability, in the future, fewer than 3 open requests (I9), actor ≠ listing agent. **Exclusivity attaches at confirmation, not at request** — several buyers may request the same slot (§3.1). A lead is created or reused (#75) |
| Mobile / desktop | Full-screen sheet on mobile; modal on desktop |
| Acceptance criteria | (1) A 4th open request is rejected with the limit message. (2) Double-clicking "Send" creates one request. (3) Times display in Cairo time and are stored as UTC instants. (4) An unverified user gets the verification dialog, and the server also rejects the request |

## S1-10 — Buyer dashboard (slice scope)

| Field | Specification |
|---|---|
| Role / route | Signed-in user · `/buyer` |
| Purpose | Landing page of the buyer portal |
| Sections (slice) | **Upcoming viewings** (next 3, link to S1-11) · **Pending requests** count · "Find a property" CTA to search · verification banner when unverified (S1-07). Offers, favourites and saved searches arrive with their phases (not rendered now) |
| States | loading · **empty** (no viewings: explain the viewing flow + search CTA) · error |
| API | `GET /api/v1/me/viewings?status=…&limit=3` |
| Acceptance criteria | No advisor phone/WhatsApp, no escrow wording, no fabricated figures |

## S1-11 — Buyer viewings + detail drawer

| Field | Specification |
|---|---|
| Role / route | Signed-in user · `/buyer/viewings`; detail in a **drawer** (BUY-05) |
| Purpose | Track and act on viewing requests (§3) |
| Sections | Tabs: **Upcoming** (`CONFIRMED`) · **Pending** (`REQUESTED`, `RESCHEDULE_PROPOSED`) · **Past** (`COMPLETED`, `NO_SHOW`, `DECLINED`, `CANCELLED`, `EXPIRED`). List items: listing thumbnail + title, date/time (Cairo), status badge. Cursor pagination |
| Drawer | Listing link, date/time, status history, agent note/decline reason, proposed new time (if any), agent name (**no phone**) |
| Actions by state | `REQUESTED`: **Cancel request** · `RESCHEDULE_PROPOSED`: **Accept new time** (V5), **Decline** (V6 → cancelled) · `CONFIRMED`: **Cancel viewing** (V7; reason required; warning when less than 2 hours before: it affects your reliability record) · terminal states: none |
| Frozen items | Not reachable in this slice (revocation is a later phase); when it arrives, SH-10 applies and cancelling stays allowed (#62) |
| States | loading · empty per tab · error · `409` (refetch, "this viewing changed") |
| API | `GET /api/v1/me/viewings` · action endpoints `POST /api/v1/viewings/:id/cancel`, `/accept-reschedule`, `/decline-reschedule` (intended names) |
| Mobile / desktop | Cards on mobile; table or list on desktop; drawer becomes a full-screen sheet on mobile |
| Acceptance criteria | (1) Each transition is its own button (never a generic edit). (2) Accepting a reschedule that now overlaps another confirmed viewing shows the server conflict and refreshes. (3) Cancellation is never blocked by verification (#38) |

## S1-12 — Agent dashboard (slice scope)

| Field | Specification |
|---|---|
| Role / route | AGENT · `/agent` |
| Sections (slice) | **Requests awaiting you** (count + next 5, link to S1-13) · **Today's and upcoming confirmed viewings** · availability summary (whether any is set; CTA to S1-13). Plan/quota, listings and leads arrive with their phases |
| States | loading · empty (no availability set: strong CTA, because buyers cannot request without it) · error |
| API | `GET /api/v1/me/agent/viewings?…` (intended), `GET /api/v1/me/availability` |

## S1-13 — Agent calendar, availability and viewing requests

| Field | Specification |
|---|---|
| Role / route | Verified AGENT · `/agent/calendar` |
| Purpose | Publish availability and act on buyer requests (V2–V11) |
| Sections | (1) **Calendar** (week view desktop, agenda view mobile) with confirmed viewings and pending requests. (2) **Requests list** (pending first, oldest first). (3) **Availability**: weekly windows (day + start/end, local Cairo wall-clock) and blackout dates |
| Request actions | **Confirm** (V2) · **Decline** (V3, optional reason) · **Propose new time** (V4, must be inside availability) |
| Confirmed actions | **Cancel** (V7, reason required, under-2-hours warning) · after start: **Mark completed** (V8) · after start + 30 min: **Mark no-show** (V9) — buttons stay disabled with a tooltip until allowed |
| Availability actions | Add/edit/remove weekly window; add/remove blackout date. Windows are split into **60-minute slots** (#106); a window shorter than 60 minutes is rejected |
| States | loading · no availability (explain that buyers cannot request) · no requests · **overlap** on confirm (another confirmed viewing: server rejects; UI refreshes; rival requests for the same slot are auto-declined on success) · request expired meanwhile (V10) · `409` refetch · unverified or revoked agent → read-only notice (revocation is a later phase) |
| Not included | "Schedule VIP / Emergency Tour", iCal sync, gate passes/QR (undecided) |
| API | `GET/PUT /api/v1/me/availability` · `GET /api/v1/me/agent/viewings` · `POST /api/v1/viewings/:id/confirm`, `/decline`, `/propose-reschedule`, `/cancel`, `/complete`, `/no-show` (intended names) |
| Mobile / desktop | Mobile: agenda + requests tabs; availability editor as a full-screen sheet |
| Acceptance criteria | (1) Two concurrent confirmations for overlapping times: exactly one succeeds (R4). (2) Confirming auto-declines rival requests for that slot. (3) No-show is impossible before start + 30 minutes. (4) Times entered in Cairo wall-clock are correct across the DST change |
| Definition of done | Availability, requests and calendar work end to end against the pipeline module (IMPLEMENTATION_PLAN step 12) |

---

## Slice acceptance (end to end, #48)

A visitor registers (phone required), verifies the email through the link, searches, opens a
property, requests a 60-minute viewing, and sees it under **Pending**. A seeded agent sets
availability, confirms the request (rival requests auto-declined), and later marks it completed. An
unverified user is gated with a visible dialog. An agent switches Buyer ↔ Agent; an admin switches
Buyer ↔ Admin and cannot open the agent portal.

## Open points (not blocking the slice)

- Visual design of these screens (Stitch / design-system approval, #30).
- Exact OpenAPI paths for the intended endpoints above (generated from the backend schemas).
- How far ahead buyers may book (this spec uses 30 days as a UI limit; not a business rule).
