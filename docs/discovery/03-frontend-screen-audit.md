# Frontend Screen / Section Audit — Decisions → Screens

    Status:       AUDIT SNAPSHOT (discovery) · documentation only · no UI invented
    Last Updated: 2026-09-17
    Scope:        confirmed decisions #45–#98 (plus the locked journeys they build on)
    Related:      01-system-audit.md, 02-gap-analysis.md, ../product/ROLES_AND_PERMISSIONS.md,
                  ../product/BUSINESS_RULES.md, ../architecture/FRONTEND.md

**Question answered:** for each confirmed decision, does the frontend already have a screen, route
or section for it — and if not, what is missing?

Statuses: **EXISTS** (fully represented) · **PARTIAL** (some UI, required behaviour/section missing
or contradictory) · **MISSING** (no frontend surface) · **NOT NEEDED** (backend/internal/security
decision with no direct user-facing screen). A backend endpoint alone never counts as EXISTS.

---

## 1. Evidence base

### 1.1 Implemented frontend (`frontend/src/app`)

| Group | Routes | Notes |
|---|---|---|
| Public | `/`, `/search`, `/properties/[slug]`, `/compare`, `/areas`, `/areas/[slug]`, `/market-insights`, `/agents`, `/agents/[id]` | Only real data: search list, property detail, compare, area ids |
| Auth | `/login`, `/register`, `/verify-email`, `/forgot-password` | Login and register have a "Private Client / Certified Advisor" role tab |
| Buyer / Agent / Admin portals | **none** | `middleware.ts` protects `/buyer`, `/agent`, `/admin`, but no pages exist |

Other evidence:
- `components/layout/Navbar.tsx` — one "dashboard" link chosen by role (`ADMIN → /admin/verification`,
  `AGENT → /agent/overview`, else `/buyer/overview`); no portal switcher.
- `middleware.ts` — redirects `AGENT` users **away** from `/buyer/*` routes.
- Login / register / verify-email redirect to **`/agent-dashboard/overview`** and
  **`/buyer-dashboard/overview`**, which match neither the middleware paths nor any page.
- Property detail (`PropertyDetailClient.tsx`): favourite, viewing scheduler and "Submit Escrow
  Offer" are **local state / toasts only**; WhatsApp buttons use a fixed placeholder number.
- `PropertyCard.tsx`: favourite heart is local state only.
- Maps: `SearchMap.tsx` (Leaflet + MapTiler, key hard-coded); `AreaRadarMap.tsx` and
  `AreaDetailMap.tsx` (Leaflet + **CARTO** tiles). `.env.example` defines `NEXT_PUBLIC_MAPTILER_KEY`,
  but no code reads it.
- No notification centre, messaging, offers, viewings, subscription, quota or billing UI anywhere.

### 1.2 Design reference

- **Stitch project** `6142630270735704741` holds uploaded images and one landing `index.html` only —
  **no dashboard, subscription or admin screens**.
- **Design candidates** `docs/design/candidates/settly-landing/` (static HTML; the port source named
  in `AGENTS.md`). Relevant screens:

| Area | Candidate screens |
|---|---|
| Agent portal | `overview`, `listings`, `create-listing`, `edit-listing`, `leads`, `calendar`, `analytics`, `messages`, `notifications` |
| Buyer portal | `overview`, `favorites`, `saved-searches`, `viewings`, `offers`, `messages`, `notifications`, `documents`, `settings` |
| Admin | `moderation`, `agent-verification`, `reports`, `audit-log` (no admin overview) |
| Public / other | `search`, `property-detail`, `property-detail-ar`, `areas`, `area-detail`, `compare`, `agents`, `agent-profile`, `market-insights`, `assistant/index`, `assistant/ar`, auth screens |

**No candidate contains any subscription, plan, quota, billing, checkout, portal-switch (except
admin nav), agent-application, revocation, sale-confirmation or "waiting for quota" UI.** Several
candidates also contradict confirmed decisions (listed in §3 and §4).

---

## 2. Decision → screen traceability matrix

### 2.1 Agent subscription and quota (#79, #80, #85–#95)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Current plan (Free / Pro / Enterprise) (#80, #93) | Agent dashboard — subscription block | none (`/agent/*` has no pages) | MISSING | No agent pages; no candidate | Plan status block; newly verified agents shown on Free |
| Plan presentation, exactly 3 plans, prices $0 / $20 / $50 USD, no currency toggle; EGP charge amount shown at checkout (#80, #89, #103; updated 2026-09-17) | Plans / pricing screen | none | MISSING | No candidate | Plan comparison (quota 2/4/8); prices must show as TBD, never invented |
| Monthly quota / used / remaining (#80, #86, #88, #94) | Agent dashboard — quota indicator | none | MISSING | No candidate | Quota block counting first publications in the calendar month |
| Upgrade flow — immediate, full price, new 30-day period, quota = new − used (#92, #104) | Plan change screen/modal | none | MISSING | — | Upgrade confirmation explaining full price, new period start, resulting quota |
| New paid subscription — full price, 30 days from start, no proration (#104; replaces the #88 proration rule) | Checkout summary | none | MISSING | — | Price and period summary before checkout |
| Subscription status, billing period, expiry date (#90, #91) | Subscription details section | none | MISSING | — | Status, period end, "renew by" |
| Cancellation — active until period end, no refund (#91) | Cancel action + cancelled state | none | MISSING | — | Cancel confirmation; "cancelled, active until …" state |
| Downgrade — effective when the current 30-day period ends (#92, #104) | Scheduled-change notice | none | MISSING | — | "Downgrade scheduled for …" state |
| Expiry / failed payment → Free immediately; listings stay live (#91) | Status block + notification | none | MISSING | — | Expired state explaining listings remain live |
| Quota-exhausted warning at submission (#94, #95) | Listing submit step — warning | none | MISSING | Candidate `create-listing` has no warning | Non-blocking warning; submission still allowed |
| "Approved, Waiting for Quota" state (#94) | Listing status badge | none | MISSING | Candidate `listings` statuses: Published / Draft / Reserved / Sold only | New status label (sub-state of Pending review) |
| Waiting listings list, FIFO order (#94) | My listings — waiting section/filter | none | MISSING | — | List ordered by approval time |
| FIFO publication outcome (#94) | Listing status change + notification | none | MISSING | — | Result visible on the listing |
| Notification when a waiting listing publishes (#94) | Notification centre item | none | MISSING | Candidate agent `notifications` has no such item | Notification type |
| Immediate quota increase after upgrade releases waiting listings (#92, #94) | Post-upgrade confirmation | none | MISSING | — | Show released listings |
| Plan-change information / history (#92) | Subscription details | none | MISSING | — | Current and scheduled plan |

### 2.2 Subscription payment (#88–#92)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Plan selection | Plans screen | none | MISSING | — | — |
| Paymob hosted checkout initiation (#90) | Redirect action | none | MISSING | No payment code in frontend | Initiation + redirect |
| Payment pending | Return / status screen | none | MISSING | — | Pending state (frontend never authoritative for success) |
| Payment success / subscription activated | Return / status screen | none | MISSING | — | Activated state after verified webhook |
| Payment failure | Return / status screen | none | MISSING | — | Failure state + retry |
| Current subscription information | Subscription details | none | MISSING | — | — |
| Receipt display (#90) | Receipt link/section | none | MISSING | Candidate receipts exist only for **deposits** (buyer `offers`, `documents`) | Simple subscription receipt; no tax/invoicing UI (V36) |

### 2.3 Agent listings (#47, #51, #54, #61, #68, #73, #77, #78, #81, #85–#87, #94)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Create listing (verified agents only) (#51) | Create-listing wizard | none | MISSING | API `POST /api/v1/properties` exists; candidate `create-listing` exists but **ends with "Publish Mandate to Exchange / Mandate Published Successfully"** (skips review) and is **developer/off-plan oriented** (Direct Developer, NOC, off-plan delivery) | Resale-only form; submit-for-review outcome; unverified-agent blocked state |
| Resale completion status, expected delivery, remaining instalments (total, count, frequency, end date); `price` = paid to seller (#54, #61, #68, #73) | Create/edit form fields; detail display | none (form); `/properties/[slug]` (display) | PARTIAL | Detail page shows invented "delivery year", "finishing", developer, instalment schedule; no real fields | Real fields in form; detail shows full cost = price + remaining instalments |
| Draft | Listing status | none | MISSING | Candidate `listings` has "Draft / Private" | App screen |
| Submit for review | Action + confirmation | none | MISSING | API exists | Submit action; quota warning (#94) |
| Pending review / Rejected with reason | Status + reason display | none | MISSING | Candidate `listings` has no Pending/Rejected | Status labels; rejection reason; resubmit |
| Approved, waiting for quota | Status | none | MISSING | — | See §2.1 |
| Published | Status | none | MISSING | Candidate has "Active (Published)" | App screen |
| Editing a waiting listing invalidates approval (#94) | Edit screen warning | none | MISSING | — | Warning before editing |
| Structural edit re-enters review (§2.1) | Edit screen warning | none | MISSING | Candidate `edit-listing` has no such notice | Warning |
| Relisting (P14 archived, P16 rented) consumes quota at publication (#81, #85, #86) | Relist action | none | MISSING | API `POST /:id/relist` exists (archived only); candidate `listings` mentions relist | Relist action for archived and rented; quota note |
| Mark rental as RENTED (#78) | Listing action | none | MISSING | No candidate | Action for rental listings |
| Sale completion — buyer **and** agent confirm (#77, #82) | Confirmation action (agent + buyer sides) | none | MISSING | Candidate `edit-listing` has **"Mark as Reserved / Under Contract"** (P8 is system-only) and **"Mark Concluded & Sold"** (agent alone) — both contradict | Two-party confirmation; "awaiting other party"; dispute → admin review |
| Suspended / revoked state (#52, #58) | Status + explanation | none | MISSING | — | Suspended badge; reason |
| Listing history / status timeline | Listing detail (agent) | none | MISSING | No candidate | Status history view (data preserved per #81) |
| Quota exhausted state | See §2.1 | none | MISSING | — | — |
| Publication result | Notification + status | none | MISSING | Candidate shows immediate "published" | Correct outcome (published / waiting / rejected) |

### 2.4 Agent onboarding and identity (#49, #53, #55–#57, #60, #74)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Everyone registers as buyer; phone required, international (#49, #60) | Register | `/register` | PARTIAL | Phone field exists but **is never sent**; "Certified Advisor" tab collects licence/firm at sign-up (contradicts #49) | Buyer-only registration; phone persisted |
| Login role tabs | Login | `/login` | PARTIAL | "Private Client / Certified Advisor" tabs route to non-existent `/agent-dashboard`, `/buyer-dashboard` | One login; role from account (#97) |
| Google sign-in phone completion (#60) | Completion step | none | MISSING | Google button exists on register | Phone completion before use |
| Agent application: National ID + selfie + professional proof (#49, #55) | Apply-to-become-agent screen | none | MISSING | No candidate (buyer `settings` only shows "Verified National ID") | Application form with proof type |
| Application status: pending / rejected (reason) / re-apply; one pending at a time (#57, #74) | Application status section | none | MISSING | — | Status + reason + re-apply |
| Email verification | Verify email | `/verify-email` | PARTIAL | Page exists; redirects to non-existent `/buyer-dashboard/overview` | Correct redirect |
| Buyer phone visible to agent only during an offer; agent phone never shown (#60, #66, #72) | Lead / offer detail (agent); public pages | `/agents`, `/agents/[id]`, `/properties/[slug]` | PARTIAL (contradictory) | Public agents page shows WhatsApp numbers; property detail shows WhatsApp buttons (placeholder number) | Remove agent phone exposure; conditional buyer phone in agent views |

### 2.5 Buyer + agent dual capability and portals (#50, #59, #97)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Buyer dashboard reachable by agents and admins | Buyer portal | `/buyer/*` (no pages) | MISSING | No pages; middleware **redirects AGENT away** from `/buyer/*` | Buyer portal; middleware change |
| Buyer navigation | Buyer sidebar | none | MISSING | Candidate buyer nav exists (no switcher) | — |
| Buyer search | Search | `/search` | PARTIAL | Reachable by everyone; filters are client-side over 20 listings | Real search (backend D1) |
| Listing details | Property detail | `/properties/[slug]` | PARTIAL | Real data plus invented fields; CTAs fake | Real CTAs |
| Offers | Buyer offers | none | MISSING | Detail "Submit Escrow Offer" = toast; candidate `buyer-dashboard/offers` exists (uses "escrow" and developer counter-proposal wording) | Offer flow and list |
| Favourites / saved searches (max 25) | Favorites, saved searches | none | PARTIAL | Heart icons are local state only; candidates exist | Persisted favourites; saved-search pages |
| Self-dealing: own listing hides offer / viewing / message actions (#59) | Property detail CTA state | `/properties/[slug]` | MISSING | CTAs shown to everyone | Hide/disable on own listing |
| Portal switching (Buyer / Agent / Admin) (#97) | Switcher in nav | none | MISSING | Navbar picks one dashboard; candidate **admin** nav has "Buyer Portal" and **"Agent Desk"** (the latter contradicts #97); buyer/agent navs have no switcher | Switcher showing only allowed portals |
| Agent → Buyer transition | Switcher | none | MISSING | — | — |
| Buyer → Agent transition | Apply flow (§2.4) | none | MISSING | — | — |

### 2.6 Admin (#28, #49, #52, #56–#58, #64, #65, #67, #69–#71, #77, #82, #93, #94, #97)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Admin dashboard / portal access | Admin portal | `/admin/*` (no pages); Navbar links `/admin/verification` | MISSING | No pages; candidate has no overview (moderation queue is the entry) | Admin shell |
| Agent verification (manual ID vs selfie, professional proof, reason) (#56, #57) | Verification console | none | MISSING (design PARTIAL) | API `/api/v1/admin/agents` exists; candidate `agent-verification` shows National ID + syndicate licence, rejection reasons, "Request Document Rectification" (not a decided action) | App screen; proof types per #55; side-by-side ID/selfie |
| Revoke verification + cascade; re-verification (#52, #58, #65, #69) | Revoke action; re-verify | none | MISSING | No candidate | Revoke with confirmation of affected listings |
| Reserved-listing review after revocation, 5 business days, auto-cancel (#64, #69) | Review queue item | none | MISSING | — | Deadline display; release (only after re-verification) / cancel-with-refund |
| Listing review and approval (P3, P4) | Moderation queue | none | MISSING (design PARTIAL) | API exists; candidate `moderation` has "Approve & Publish to Market" and "Batch Approve Verified" | App screen; approval outcome can be "waiting for quota" |
| Approved-but-waiting-for-quota outcome (#94) | Moderation result | none | MISSING | Candidate assumes approve = publish | Outcome message/state |
| Queue visibility and order (original position kept, #93) | Queue | none | MISSING (design PARTIAL) | Candidate shows "Queue Depth / All Pending" | Ordering by original submission time |
| Conflict of interest — involved admin cannot act (#67, #71) | Case action state | none | MISSING | — | Disabled action + "assign to another admin" note |
| Sale-completion review — confirm / fell through / extend; disputes (#77, #82) | Review queue | none | MISSING | Candidate `reports` mentions completion only in passing | Review screen |
| Public-holiday list (#70) | Admin settings | none | MISSING | No candidate | Holiday list management |
| Phone access for support, audited (#66) | User detail | none | MISSING | Candidate `agent-verification` shows phone | Audited reveal |
| Admin → Buyer capability (#59, #97) | Switcher | none | MISSING (design PARTIAL) | Admin candidate nav links "Buyer Portal" | — |
| Admin must not reach agent/listing tools (#97) | Admin nav | none | MISSING (design contradicts) | Admin candidate nav links "Agent Desk" | Remove from design |
| Admin account creation (#97) | — | — | NOT NEEDED | Seed/CLI only; **no in-app screen exists — correct** | Must stay absent |
| Reports, audit log (#28) | Admin screens | none | MISSING (designs exist) | Candidates `reports`, `audit-log` | — |

### 2.7 Buyer transactional journey (locked journeys + #59, #62–#64, #72, #75–#77, #82–#84)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Request a viewing (email verified, max 3) | Detail CTA + viewings list | `/properties/[slug]` | PARTIAL | Scheduler is fake (toast); candidate `viewings` exists | Real request; statuses |
| Offer lifecycle, counter / accept / withdraw | Buyer offers | none | MISSING (design PARTIAL) | Candidate `offers` exists with "escrow" and developer wording (conflicts #45/#47) | App screens |
| Reservation deposit via Paymob; deposit credited to price (#13, #76) | Deposit checkout + status | none | MISSING (design PARTIAL) | Candidate shows deposit receipts and 48-hour guarantee | App flow; "credited toward price" wording |
| Late withdrawal: 20% to seller (#84); refunds (§7) | Withdrawal confirmation | none | MISSING | — | Refund explanation |
| Sale completion — buyer confirms (#77) | Offer/reservation detail | none | MISSING | No candidate | Confirm / dispute actions |
| Revocation freeze visible to buyer; exit without penalty (#62, #63) | Offer/viewing status | none | MISSING | No candidate | "Frozen" status; withdraw/cancel remain available |
| No offers on rentals (#1) | Detail CTA | `/properties/[slug]` | PARTIAL | Offer button shown regardless of intent | Hide on rent listings |
| Leads created on first contact; pipeline NEW → CONTACTED → QUALIFIED → WON / LOST (#75, #83) | Agent leads | none | MISSING (design PARTIAL) | Candidate `leads` stages: New Inquiries / Qualified & Diligence / Viewing Scheduled / Offer Submitted / Under Contract — **differs** from #83 | Stages per #83; manual LOST |
| Notifications (quota publication, deposits, offers, viewings…) | Notification centre | none | MISSING (designs exist) | Candidates `notifications` (buyer, agent) | App screens |
| Messaging (self-dealing, #59) | Messages | none | MISSING (designs exist) | Candidates `messages` | App screens |

### 2.8 Maps (#96)

| Decision / feature | Screen or section | Route | Status | Evidence | Missing / gap |
|---|---|---|---|---|---|
| Search map — Leaflet + MapTiler | Search | `/search` | PARTIAL | Leaflet + MapTiler, but **key hard-coded** | Read `NEXT_PUBLIC_MAPTILER_KEY` |
| Areas list map | Areas | `/areas` | PARTIAL | Leaflet + **CARTO** | Switch to MapTiler |
| Area detail map | Area detail | `/areas/[slug]` | PARTIAL | Leaflet + **CARTO** | Switch to MapTiler |
| `NEXT_PUBLIC_MAPTILER_KEY` reference | Config | `frontend/.env.example` | PARTIAL | Declared, not used by code | Use it |
| MapTiler domain restriction | — | — | NOT NEEDED | Dashboard action | — |

### 2.9 Internal / backend / security decisions (no screen)

| Decision | Status | Note |
|---|---|---|
| #95 per-user advisory lock, I13 atomic enforcement | NOT NEEDED | Backend |
| #63 paused expiry clocks, #69 auto-cancel job, #70 business-day computation | NOT NEEDED | Backend (the holiday list UI is in §2.6) |
| #97 admin creation by seed/CLI | NOT NEEDED | Must have no UI |
| #98 Cloudinary secret rotation, CI secrets, no history rewrite | NOT NEEDED | Infrastructure |
| #79 transaction revenue (TBD) | NOT NEEDED (yet) | Nothing to show until fee rules exist |
| #42/#48/#46 process and stage decisions | NOT NEEDED | — |

---

## 3. What we are missing

### 3.1 Existing

**No confirmed decision from #45–#98 is fully represented in the frontend.** The routes that exist
(search, property detail, compare, areas, agents, auth) are discovery and auth surfaces. They are
**EXISTS** only for public browsing and comparing, which predate these decisions. Admin
account creation is correctly absent (NOT NEEDED).

### 3.2 Partial (existing screens needing changes)

| Item | Why (decision) | Role | Kind | Depends on |
|---|---|---|---|---|
| `/register` — buyer-only, send phone | #49, #60 | Visitor | Screen change | Backend: phone field (DB + API) |
| `/login` — drop role tabs; redirect to real portal paths | #97 | All | Screen change | No backend dependency |
| `/verify-email` — redirect to real buyer route | #97 | All | Screen change | Buyer portal pages |
| `/properties/[slug]` — real viewing/offer/favourite CTAs; hide on own listing and on rentals; remove agent phone/WhatsApp; show resale + remaining-instalment data | #47, #54, #59–#61, #68, #1 | Buyer, agent-as-buyer | Section changes | Backend: viewings, offers, favourites, listing fields (DB + API) |
| `/agents`, `/agents/[id]` — remove agent phone/WhatsApp | #60, #66 | Visitor | Section change | No backend dependency |
| `/search` — real search; remove luxury/off-plan facets | #45, #47 | Visitor, buyer | Screen change | Backend: search (D1) |
| Search / areas maps — MapTiler everywhere, env key | #96 | Visitor | Component config | No backend dependency |
| `Navbar` — portal switcher instead of single role dashboard | #97 | Agent, admin | Nav section | Portal pages |
| `middleware.ts` — stop redirecting agents from buyer routes | #50, #97 | Agent | Routing rule | No backend dependency |
| Design candidates `create-listing`, `edit-listing`, `listings`, `moderation`, `leads`, `offers`, admin nav | #47, #58, #77, #83, #94, #97 (see §2) | Design | Design corrections | — |

### 3.3 Missing

| Item | Why (decision) | Role | Kind | Depends on |
|---|---|---|---|---|
| Agent portal shell (overview, nav) | #50, #97 | Agent | Full screen set | Backend APIs (partly exist) |
| **Subscription & plans** screen (3 plans, $0 / $20 / $50 USD, no toggle; exact EGP charge at checkout, #103) | #80, #89 | Agent | Full screen | Backend subscription module, DB, API |
| **Quota indicator** (used / remaining, calendar month) | #80, #86, #88, #94 | Agent | Dashboard section | Backend quota counting, API |
| **Subscription details** (status, period end, cancel, scheduled downgrade, expired) | #90–#92 | Agent | Screen section + modals | Backend, DB, API |
| **Upgrade / new subscription checkout** (full price, 30-day period, exact EGP amount) and **payment result** (pending / success / failure) | #88, #90, #92 | Agent | Screen + status screens | Backend, **Paymob integration**, webhook |
| **Subscription receipt** | #90 | Agent | Section / link | Backend, payment integration |
| **Listings management** with all statuses (draft, pending, rejected+reason, approved-waiting, published, reserved, sold, rented, archived, suspended) | #51, #78, #81, #94 | Agent | Full screen | Backend (partly exists), DB (waiting sub-state) |
| **Create / edit listing** (resale fields, submit for review, quota warning, edit-invalidates-approval warning) | #47, #54, #68, #73, #94 | Agent | Full screen | Backend fields (DB + API) |
| **Relist** (archived, rented) and **mark rented** actions | #78, #81, #85 | Agent | Actions | Backend (rented relist missing) |
| **Two-party sale confirmation** + dispute | #77, #82 | Agent, buyer | Actions + status | Backend, DB |
| **Listing status history** | #81 | Agent | Section | Backend/API |
| **Agent application** (ID + selfie + proof) and **application status** | #49, #55, #57, #74 | Buyer | Full screen + status | Backend, DB, **private storage** |
| **Google sign-in phone completion** | #60 | User | Step/modal | Backend phone field |
| **Buyer portal** (overview, favourites, saved searches, viewings, offers, messages, notifications, documents, settings) | locked journeys, #50, #97 | Buyer, agent, admin | Full screen set | Backend engagement / pipeline / payments / messaging / notifications |
| **Deposit checkout + status**, withdrawal/refund explanation (credited to price, 20% to seller) | #13, #76, #84 | Buyer | Flow + status | Backend, **Paymob**, DB |
| **Frozen offer/viewing state** with exit actions | #62, #63 | Buyer | Status block | Backend |
| **Leads pipeline** (NEW → CONTACTED → QUALIFIED → WON / LOST) with conditional buyer phone | #75, #83, #66, #72 | Agent | Full screen | Backend, DB (`WON`) |
| **Notification centre** incl. "waiting listing published" | #94 | All | Full screen + items | **Notification system** |
| **Portal switcher** | #97 | Agent, admin | Nav component | No backend dependency (role only) |
| **Admin portal**: moderation queue (waiting-for-quota outcome, original order, conflict-of-interest state) | #87, #93, #94, #67, #71 | Admin | Full screen | Backend (approve/reject exist; waiting state missing) |
| **Admin verification console** (ID/selfie side by side, proof types, reject reason, revoke, re-verify) | #52, #55–#58 | Admin | Full screen | Backend, private storage |
| **Revocation review** (reserved listings, 5-business-day deadline) | #58, #64, #69 | Admin | Queue screen | Backend, jobs, payments |
| **Sale-completion review** (confirm / fell through / extend) | #77, #82 | Admin | Queue screen | Backend |
| **Public-holiday list** | #70 | Admin | Settings screen | Backend, DB |
| **Audited phone reveal** | #66 | Admin | Section | Backend, audit |
| Reports, audit log | #28 | Admin | Full screens | Backend |
| Arabic `/ar` routes | #39 | All | Route set | — |

---

## 4. Contradictions between existing UI / designs and confirmed decisions

- Register/login "Certified Advisor" tabs vs **buyer-first onboarding** (#49) and single login (#97).
- Post-login redirects to `/agent-dashboard/*`, `/buyer-dashboard/*` vs middleware `/agent/*`,
  `/buyer/*` — neither has pages.
- Middleware blocks agents from buyer routes vs **dual capability** (#50, #97).
- Public agent pages and property detail expose WhatsApp/phone vs **agent phone never public** (#60).
- Candidate `create-listing`: immediate publish vs **admin review** (P2/P3); developer/off-plan
  fields vs **resale-only V1** (#47).
- Candidate `edit-listing`: agent marks Reserved (P8 is system-only) and marks Sold alone vs
  **two-party completion** (#77).
- Candidate `listings`: no Pending / Rejected / Suspended / Archived / Rented / Waiting statuses.
- Candidate `moderation`: "Approve & Publish" vs **approval may leave a listing waiting** (#87, #94).
- Candidate `leads` stages vs **NEW → CONTACTED → QUALIFIED → WON / LOST** (#83).
- Candidate admin nav "Agent Desk" vs **admins have no agent powers** (#97).
- Candidates and UI use "escrow" wording vs positioning and scope (#45, #47; escrow out of scope).
- Area maps use CARTO vs **MapTiler everywhere** (#96).

## 5. Dependency summary

| Dependency | Needed by |
|---|---|
| **Backend implementation + API + database** | Subscriptions, quota, waiting state, listing fields, relist/rented, sale confirmation, agent application, phone, leads (`WON`), revocation flows, holiday list, favourites, saved searches, viewings, offers |
| **Payment integration (Paymob)** | Subscription checkout/result/receipt; deposit checkout/status/refunds |
| **Notification system** | Waiting-listing published; offer/viewing/deposit/revocation notices |
| **Private storage** | Agent application documents; admin ID/selfie review |
| **No backend dependency** | Portal switcher, login/register redirect fixes, middleware rule, removal of phone exposure on public pages, MapTiler switch and env key |

## 6. Scope note

This audit changed no application code, created no routes and designed no UI. Where no design
exists (subscription, quota, billing, agent application, revocation, sale confirmation, portal
switcher, holiday list), a design step is required before implementation.
