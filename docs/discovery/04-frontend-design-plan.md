# Frontend Design Plan — Screens, Corrections and Gaps

    Status:       PLANNING (discovery) · NOT a design authority · no UI invented
    Last Updated: 2026-09-17
    Evidence:     docs/design/candidates/settly-landing/ (primary design evidence for this plan)
    Related:      03-frontend-screen-audit.md, ../design/DESIGN_SYSTEM.md, ../design/UX_PATTERNS.md,
                  ../product/ROLES_AND_PERMISSIONS.md, ../product/BUSINESS_RULES.md, ../DECISIONS.md

**Authority.** Visual design authority stays with `design/DESIGN_SYSTEM.md` and `design/UX_PATTERNS.md`
(Tier C, #30). The candidates directory is itself a **candidate** ("pending approval into
`DESIGN_SYSTEM.md`", per its `DESIGN.md`). This plan only records which screens exist, which need
correction, which are missing, and what each must support. It decides no colours, spacing,
components or visual patterns.

Candidate classification: **VALID** · **PARTIAL** · **CONTRADICTORY** · **OUTDATED** · **UNRELATED**.
Inventory action: **KEEP** · **UPDATE** · **MERGE** · **NEW DESIGN** · **NOT NEEDED**.

---

## 1. Design source reviewed

**Directory:** `C:\Users\Mohand\Documents\GitHub\Settly\docs\design\candidates\settly-landing`
(read-only; last changed in commits `7f30586`, `ce697c6`, `fd9c2d3`, 2026-09-09 → 09-14).

| Kind | Files |
|---|---|
| Screen mockups (static HTML) | **39**: `public/` 10 · `auth/` 4 · `buyer-dashboard/` 9 · `agent-dashboard/` 9 · `admin/` 4 · `assistant/` 2 · root `index.html` (redirect only) |
| Design-system reference | `DESIGN.md` and identical `shared/DESIGN.md` ("Settly — Navy & Brass", candidate) |
| Shared layout assets | `shared/style.css` (= root `style.css`), `shared/master-nav-footer.css` (= root copy), `shared/dashboard-topbar.css`, `shared/settly-assistant-widget.css` + `.js` |
| Screenshots / images | **None in this directory** (mockups reference imagery outside it) |

**Conventions observed**
- Naming: `<portal>/<screen>.html`; Arabic variants use an `-ar` suffix (`property-detail-ar.html`) or
  `ar.html` (`assistant/`). Only **2 Arabic screens** exist (`lang="ar" dir="rtl"`).
- Shared layouts:
  - **Public header/footer** (Buy · Districts · Compare · Market Insights · Agents · AI Assistant ·
    Sign in · Get Started);
  - **Buyer sidebar** ("BUYER PORTAL": Overview, Favorites & Collections, Saved Searches, My
    Viewings, My Offers, Messages, Notifications, My Documents, Account Settings, Chat on WhatsApp);
  - **Agent sidebar** ("AGENT PORTAL": Overview, Messages, Notifications, My Listings, Leads &
    Pipeline, Viewings Calendar, Analytics & Reports, Create Listing, Public Profile);
  - **Admin sidebar** ("SOVEREIGN ADMIN": Moderation Queue, Agent Verification, Platform Reports,
    Audit Log, **Agent Desk**, **Buyer Portal**, Public Market);
  - an AI assistant widget on most pages.
- Maps: `search`, `areas`, `area-detail`, `property-detail(-ar)` load **Leaflet 1.9.4 (unpkg)** with
  **CARTO** tiles; no MapLibre, no MapTiler, no API keys present.
- Security: **no infrastructure secrets or private configuration** found in any candidate.
  Placeholder WhatsApp/phone numbers appear widely (see §3).

---

## 2. Candidate review

Route column: candidate path → implemented app route (if any). Portal prefixes in the app are
`/buyer`, `/agent`, `/admin` (`middleware.ts`), while `architecture/FRONTEND.md` §2 names
`/dashboard/*` for the buyer area — **resolved by #100: `/buyer/*`** (§7).

### 2.1 Public

| File | Screen | Role | Route | Purpose / major sections | Key actions / states | Class | Why |
|---|---|---|---|---|---|---|---|
| `public/index.html` | Home | Visitor | → `/` | Hero, three search modes, featured residences, draw-area map teaser, journey (discover → viewing → offer → reserve), viewing teaser, agents teaser, insights, alerts | Buy / Rent / **New launches** tabs; payment-plan cards ("7-Yr plan") | PARTIAL | Journey matches #1; "New launches" and developer payment plans are off-plan (deferred, #47) |
| `public/search.html` | Search (split/grid/map) | Visitor, buyer | → `/search` | Filter chips, list, map, draw boundary, pagination | Price chips up to 50M+; Split/Grid/Map | PARTIAL | Leaflet ✔ but **CARTO** tiles (#96); corridor facets fixed |
| `public/property-detail.html` | Property detail | Visitor, buyer | → `/properties/[slug]` | Gallery, specs, **"7-Year Developer Plan"**, CAD floorplans, district map, **title-deed audit "Certified 100% Clear"**, similar residences, AI concierge | Save · Schedule Private Viewing · **Submit Escrow Offer** · **Instant WhatsApp** · **tel** · 3D Virtual Tour | CONTRADICTORY | Escrow (out of scope, #1/#45); developer plan (#47); agent phone/WhatsApp (#60); title certification (out of scope, #1); CARTO (#96) |
| `public/property-detail-ar.html` | Property detail (AR) | Visitor, buyer | → `/ar/properties/[slug]` (not built) | Same as above; section headings still English | Same | CONTRADICTORY | Same contradictions; RTL translation incomplete |
| `public/areas.html` | Areas directory | Visitor | → `/areas` | "Catalog of Sovereign Districts", 8 corridors, region filter, benchmark index | Region tabs; WhatsApp/tel "private advisor" | PARTIAL | Luxury "sovereign" framing (#45); CARTO (#96); corridor grouping OPEN (C6); figures unsourced (A4) |
| `public/area-detail.html` | Area detail | Visitor | → `/areas/[slug]` | Price trajectory, compound polygons, estates, commute, available residences | Book corridor tour; WhatsApp/tel | PARTIAL | CARTO (#96); fabricated figures (A4) |
| `public/agents.html` | Agent directory | Visitor | → `/agents` | "Certified **Luxury** Advisors", territory filter, 5-stage verification standard, representation request | **Direct Desk** (WhatsApp), Dispatch NDA Mandate | CONTRADICTORY | Agent contact exposure (#60); luxury framing (#45); "Direct Developer Allocations" (#47); representation/NDA flow not a decided feature |
| `public/agent-profile.html` | Agent profile | Visitor | → `/agents/[id]` | Bio, corridor focus, portfolio, **settlements ledger**, endorsements, advisory console | **WhatsApp Direct Desk**, **"Encrypted Zoom Video Briefing"**, schedule briefing | CONTRADICTORY | Agent phone (#60); video calls not a V1 feature; fabricated ledger/endorsements (A4) |
| `public/compare.html` | Compare | Visitor, buyer | → `/compare` | Side-by-side matrix, add unit | EGP/USD/AED/EUR toggle, export, schedule tour | PARTIAL | Core valid; currency display is OPEN (D4) |
| `public/market-insights.html` | Market insights | Visitor | → `/market-insights` | Macro "Luxury… Capital Flow", primary vs resale yield, developer league, foreign capital, research library | Downloads; currency toggle | OUTDATED | Framing superseded (#45); off-plan/developer content (#47); fabricated data (A4) |
| `assistant/index.html` | AI assistant | Buyer | → `/assistant` (not built) | Chat, Shortlist Agent, shortlist cards | Confirm & Book Viewing (confirm-before-write ✔) | PARTIAL | Matches #17/#19 (later phase); buyer nav includes WhatsApp link |
| `assistant/ar.html` | AI assistant (AR) | Buyer | → `/ar/assistant` | Same, RTL | Same | PARTIAL | As above |

### 2.2 Authentication

| File | Screen | Role | Route | Purpose / sections | Key actions / states | Class | Why |
|---|---|---|---|---|---|---|---|
| `auth/register.html` | Register | Visitor | → `/register` | Account form, +20 phone prefix, Google SSO | **"Private Client / Certified Advisor" tabs**, demo buttons | CONTRADICTORY | Buyer-first onboarding (#49); phone must allow international numbers (#60) |
| `auth/login.html` | Login | Visitor | → `/login` | Sign-in form, Google SSO | **Buyer / Advisor tabs**, demo buttons | CONTRADICTORY | One login, role from the account (#97) |
| `auth/verify-email.html` | Verify email | User | → `/verify-email` | Code entry, resend | "Autofill", "Simulate Expired" demo controls | PARTIAL | Code vs link mechanism OPEN (B3); demo controls not production |
| `auth/forgot-password.html` | Password reset | User | → `/forgot-password` | Two-step request + new password | — | VALID | Consistent with Better Auth reset (#9) |
| `index.html` | Redirect | — | — | Redirects to `public/index.html` | — | UNRELATED | Not a screen |

### 2.3 Buyer portal

| File | Screen | Role | Route | Purpose / sections | Key actions / states | Class | Why |
|---|---|---|---|---|---|---|---|
| `buyer-dashboard/overview.html` | Buyer overview | Buyer | `/buyer/overview` (none) | Active negotiations, next inspection, **dedicated advisor**, saved spotlight | Pay Reservation Deposit (EGP 50,000), advisor **WhatsApp** | PARTIAL | Deposit cap matches #13; agent WhatsApp (#60); escrow wording; no portal switcher (#97) |
| `buyer-dashboard/favorites.html` | Favourites & collections | Buyer | none | Collections, grid/table | Create collection, compare, Request Viewing, Make Offer | PARTIAL | Matches FR3; escrow wording; must hide actions on own listings (#59) |
| `buyer-dashboard/saved-searches.html` | Saved searches | Buyer | none | Searches with results, price-drop log, create search | Pause/Resume/Edit, "Forward to Laila" | VALID | Matches FR4; pause/forward are undecided extras (§7) |
| `buyer-dashboard/viewings.html` | My viewings | Buyer | none | Timeline/calendar; Upcoming Confirmed, Pending, Completed | Reschedule, Cancel Request, **Call Broker (tel)**, gate QR | PARTIAL | Missing states (declined, expired, reschedule-proposed, no-show, frozen #62); agent phone (#60) |
| `buyer-dashboard/offers.html` | My offers | Buyer | none | Negotiation, accepted/reserved, concluded | Counter, withdraw, deposit receipt; **"2.0% Segregated Escrow … NBE escrow wallet … until seller acceptance"**; developer counter-proposal | CONTRADICTORY | Deposit is 5% capped 50,000 EGP, paid **after** acceptance, credited to price (#13, #76); escrow out of scope; developer deals (#47); no two-party completion (#77), frozen state (#62) or cooling-off withdrawal (§7, #84) |
| `buyer-dashboard/messages.html` | Messages | Buyer | none | Desks: Advisors, **Legal & Contracts**, **Developers** | Accept counter-offer in chat; WhatsApp concierge | PARTIAL | Conversations are buyer↔agent per listing (#3); offers belong to the offer flow |
| `buyer-dashboard/notifications.html` | Notifications | Buyer | none | Counter-offer, deposit confirmed, gate access, price reduction, new listing, **AML/KYC recertification** | Accept & Pay Deposit, preferences | PARTIAL | Core types valid; KYC recertification for buyers not decided |
| `buyer-dashboard/documents.html` | Documents | Buyer | none | Contracts/SPAs, deposit receipts, deeds, gate passes, identity/KYC | **Sign Digitally**, upload, share | CONTRADICTORY | E-signature out of scope (#1); document visibility scopes apply (§9) |
| `buyer-dashboard/settings.html` | Account settings | Buyer | none | Profile, localisation, identity documents (Tier-1 KYC), password, **2FA**, sessions, notifications, **bank account for deposit restitution**, **saved payment cards** | Deactivate account | CONTRADICTORY | Settly never stores card data (#13); 2FA not in V1 (#9); buyer KYC tiers not decided; no "apply to become an agent" entry (#49) |

### 2.4 Agent portal

| File | Screen | Role | Route | Purpose / sections | Key actions / states | Class | Why |
|---|---|---|---|---|---|---|---|
| `agent-dashboard/overview.html` | Agent overview | Agent | `/agent/overview` (none) | Counter-offer alert, negotiation pipeline, featured mandates, viewing schedule, action desk | Accept Offer, **"Accept Offer & Dispatch SPA"**, WhatsApp | PARTIAL | No plan/quota/application status (#80, #94); contract drafting not decided |
| `agent-dashboard/listings.html` | My listings | Agent | none | Grid/table of mandates | Filters: Active, Under Contract, Draft/Off-Market; archive with reason; share | CONTRADICTORY | Missing statuses: pending review, rejected, **approved-waiting-for-quota**, suspended, rented, sold, archived (#78, #94); no relist/mark-rented |
| `agent-dashboard/create-listing.html` | Create listing | Agent | none | 5 steps: mandate & location, specs, valuation & terms, media, title & diligence | Save Draft, **"Publish Mandate to Exchange" → "Mandate Published Successfully"**; Direct Developer, NOC, "2028 Off-Plan Delivery" | CONTRADICTORY | Listings go through review, never publish directly (P2/P3, #94); resale only (#47); needs resale/under-construction fields (#54, #68, #73) and quota warning (#95) |
| `agent-dashboard/edit-listing.html` | Edit listing | Agent | none | 4 tabs; price revision log; archive | **Mark as Reserved / Under Contract**, **Mark Concluded & Sold** | CONTRADICTORY | Reserved is system-only (P8); sold needs both parties (#77); missing edit-invalidates-approval and structural re-review notices |
| `agent-dashboard/leads.html` | Leads & pipeline | Agent | none | Board/table: New Inquiries, Qualified, Viewings, Offers, **In Escrow** | **Add Private Lead**, Advance Stage, **WhatsApp Client** | CONTRADICTORY | Stages must be NEW → CONTACTED → QUALIFIED → WON / LOST (#83); leads come from first contact (#75); buyer phone only during an offer (#66, #72) |
| `agent-dashboard/calendar.html` | Viewings calendar | Agent | none | Week/month/agenda, availability slots, gate clearance | + Add Slot (availability ✔), **Schedule VIP Viewing / Emergency Tour**, iCal sync | PARTIAL | Availability matches V1 guard; agent-created viewings and gate passes are not decided |
| `agent-dashboard/analytics.html` | Analytics | Agent | none | Volume velocity, corridor share, conversion funnel, mandate matrix | Volume / **Commission** toggle | PARTIAL | Agent analytics in scope (OVERVIEW §3); commission figures undecided (#79) and fabricated (A4) |
| `agent-dashboard/messages.html` | Messages | Agent | none | Desks incl. **Developers**, **Legal & Escrow** | **SMS PIN**, counter-offer term sheet in chat | PARTIAL | SMS not in V1 (#53); offers via offer flow; conversation scope (#3) |
| `agent-dashboard/notifications.html` | Notifications | Agent | none | Deposit cleared, counter-offer expiry, gate clearance, deed verified, telemetry | Filters incl. **System & MLS** | PARTIAL | MLS import out of scope (OVERVIEW §6); missing quota/waiting/publication/rejection/revocation/subscription notices |

### 2.5 Admin

| File | Screen | Role | Route | Purpose / sections | Key actions / states | Class | Why |
|---|---|---|---|---|---|---|---|
| `admin/moderation.html` | Moderation queue | Admin | `/admin/*` (none) | Queue (All Pending, Flagged Conflicts, New, Clarifications), deed inspection | **Approve & Publish to Market**, **Batch Approve**, Reject with reason, **Certify Deed**, Request Clarification | CONTRADICTORY | Approval may leave a listing **Approved, Waiting for Quota** (#94); title/deed certification out of scope (#1); no conflict-of-interest state (#67); no original-order guarantee (#93) |
| `admin/agent-verification.html` | Agent verification | Admin | none | Queue; syndicate card, tax certificate, commercial registry, POA; national ID | Issue Verified Accreditation, Request Rectification, Reject with reason code; **"Sync Syndicate API"**, "Automated National ID hash" | PARTIAL | Multiple proof types match #55; **no selfie** to compare with the National ID (#56); manual check required, no external registry sync (#55, #56); no revoke / re-verify (#52, #58) |
| `admin/reports.html` | "Platform Analytics & Governance Reports" | Admin | none | Capital flow, buyer liquidity, developer health index, governance dossiers | Exports | CONTRADICTORY | #28 "reports" means the abuse-report moderation workflow; advanced admin analytics is out of scope (#28) |
| `admin/audit-log.html` | Audit log | Admin | none | Ledger events by category, trace inspector | "Verify Merkle Root", "Export Signed Ledger", "Simulate Live Event" | PARTIAL | Audit viewer is load-bearing (#28); cryptographic ledger claims are not part of the decided AuditLog |
| Admin sidebar (all admin files) | Admin navigation | Admin | — | — | **Agent Desk** link, Buyer Portal link | CONTRADICTORY | Admin has no agent powers (#97); the buyer link fits the portal switcher (#97) |

---

## 3. Design contradictions requiring correction

Each item is documented, not fixed.

| # | Candidate(s) | Contradiction | Decision |
|---|---|---|---|
| C-1 | Admin sidebar (all `admin/*`) | "Agent Desk" access | #97 |
| C-2 | `admin/moderation` | "Approve & Publish to Market", "Batch Approve" | #87, #94 |
| C-3 | `admin/moderation` | Deed / title certification | #1 (title out of scope) |
| C-4 | `agent-dashboard/create-listing` | Immediate publication | P2/P3, #94 |
| C-5 | `agent-dashboard/create-listing`, `public/index`, `public/property-detail(-ar)`, `public/market-insights`, `public/agents` | Developer / off-plan / "new launches" / developer payment plans | #47 |
| C-6 | `agent-dashboard/edit-listing` | Agent marks Reserved; agent-only "Concluded & Sold" | P8, #77 |
| C-7 | `agent-dashboard/listings` | No pending/rejected/waiting/suspended/rented/archived/sold lifecycle | #78, #81, #94 |
| C-8 | `agent-dashboard/leads` | Stages and "In Escrow"; manual "Add Private Lead" | #75, #83 |
| C-9 | `public/property-detail(-ar)`, `public/agents`, `public/agent-profile`, `buyer-dashboard/overview`, `buyer-dashboard/viewings` | Agent WhatsApp/phone exposure | #60, #66 |
| C-10 | `agent-dashboard/leads` | Buyer WhatsApp without the offer condition | #66, #72 |
| C-11 | `buyer-dashboard/offers`, `public/property-detail(-ar)`, many headers | "Escrow" terminology; 2% deposit before acceptance | #1, #13, #45, #76 |
| C-12 | `public/agent-profile` | "Encrypted Zoom Video Briefing" (video calls) | Not a V1 feature |
| C-13 | `buyer-dashboard/documents` | Digital signature | #1 (e-signature out of scope) |
| C-14 | `buyer-dashboard/settings` | Saved payment cards; restitution bank account | #13 (no card data; provider refunds) |
| C-15 | `buyer-dashboard/settings` | 2FA | #9 (not in V1) |
| C-16 | `auth/register`, `auth/login` | Buyer/Advisor role tabs; advisor sign-up | #49, #97 |
| C-17 | `admin/reports` | Macro analytics instead of abuse reports | #28 |
| C-18 | `admin/agent-verification` | External registry sync / automated ID hash | #55, #56 |
| C-19 | `agent-dashboard/messages`, `agent-dashboard/notifications` | SMS PIN dispatch; MLS | #53; OVERVIEW §6 |
| C-20 | Many public screens | "Sovereign", "institutional", "luxury-only" positioning | #45 |
| C-21 | `public/search`, `public/areas`, `public/area-detail`, `public/property-detail(-ar)` | CARTO tiles | #96 |
| C-22 | Buyer and agent sidebars | No portal switcher | #97 |

**Not found:** any online-shopping pattern (cart, "buy now"), exposed secrets, or MapLibre usage.

---

## 4. Audit requirements → design coverage

Source: `03-frontend-screen-audit.md` §3.

| Missing / partial requirement | Covered by existing design? | Resolution |
|---|---|---|
| Portal shells (buyer, agent, admin) | Yes (sidebars) | Minor correction (switcher, remove Agent Desk) |
| Portal switcher | Only an admin nav link | New design |
| Register (buyer-only, phone) / login / verify-email | Yes | Minor correction |
| Google sign-in phone step | No | New design |
| Agent application + application status | No (buyer settings only shows identity documents) | New design |
| Plans / subscription / subscription details / cancel / downgrade / expiry | No | New design |
| Subscription checkout and payment result (pending / success / failure) | No | New design |
| Subscription receipt | Deposit receipts only | New design (can follow the receipt pattern) |
| Quota indicator; submission warning | No | New design |
| Approved, Waiting for Quota status; waiting list; publication notice | No | New design (statuses inside listings) |
| Listings management with full lifecycle | Partly (`listings`) | Major correction |
| Create / edit listing (resale + under-construction fields, review flow) | Partly | Major correction |
| Relist, mark rented | Mentioned only ("relist") | Correction to listings/edit |
| Listing status history | No | New design |
| Two-party sale confirmation (agent and buyer) + dispute | No | New design |
| Buyer overview, favourites, saved searches | Yes | Minor correction / keep |
| Viewings with full statuses and frozen state | Partly | Correction |
| Offers with correct deposit, frozen state, withdrawal refund | Partly | Major correction |
| Deposit checkout + payment result | Receipt and "Pay deposit" buttons only | New design |
| Leads pipeline per #83 | Partly | Major correction |
| Messages, notifications | Yes (buyer + agent) | Merge + correction |
| Documents, settings | Yes | Correction |
| Admin dashboard (essential operational, #28) | No | New design |
| Moderation with waiting outcome, order, conflict-of-interest | Partly | Correction |
| Verification console with ID-vs-selfie comparison, revoke / re-verify | Partly (no selfie) | Correction + new sections |
| Revocation review of reserved listings | No | New design |
| Sale-completion review | No | New design |
| Holiday list | No | New design |
| Abuse reports | No (candidate is analytics) | New design |
| Audit log | Yes | Minor correction |
| Audited phone reveal; conflict-of-interest state | No | New design (sections/states) |
| Map provider (MapTiler) | Leaflet yes, CARTO no | Correction |
| Arabic `/ar` screens | 2 of 39 | New design / RTL review |

---

## 5. Final screen inventory

> **Superseded by `05-final-frontend-screen-inventory.md` (2026-09-17)**, which applies English-only
> V1 and the `/buyer/*` · `/agent/*` · `/admin/*` routes. The table below is kept as history.

Backend dependency key: **BE** backend service/API/DB · **PAY** Paymob · **NOTIF** notification system ·
**STORE** private storage · **—** none.

### 5.1 Public

| Screen | Role | Route | Design exists? | Design status | Required by | Main states | Backend dependency | Action |
|---|---|---|---|---|---|---|---|---|
| Home | Visitor | `/` | Yes | PARTIAL | #1, #45, #47 | — | — | UPDATE |
| Search | Visitor, buyer | `/search` | Yes | PARTIAL | #14, #45, #47, #96 | results, empty, map/list | BE (search) | UPDATE |
| Property detail | Visitor, buyer, agent, admin | `/properties/[slug]` | Yes | CONTRADICTORY | #1, #47, #54, #59–#61, #68, #96 | own-listing, rental (no offer), unverified email, frozen | BE (viewings, offers, favourites, fields) | UPDATE |
| Areas | Visitor | `/areas` | Yes | PARTIAL | #45, #96 | — | BE (areas) | UPDATE |
| Area detail | Visitor | `/areas/[slug]` | Yes | PARTIAL | #96, A4 | — | BE (insights) | UPDATE |
| Agents | Visitor | `/agents` | Yes | CONTRADICTORY | #45, #60 | empty | BE (directory) | UPDATE |
| Agent profile | Visitor | `/agents/[id]` | Yes | CONTRADICTORY | #60, A4 | — | BE | UPDATE |
| Compare | Visitor, buyer | `/compare` | Yes | PARTIAL | D4 (open) | 2–4 items, min/max | BE (compare, exists) | KEEP |
| Market insights | Visitor | `/market-insights` | Yes | OUTDATED | #45, #47, A4 | — | BE (analytics) | UPDATE |
| AI assistant | Buyer | `/assistant` | Yes | PARTIAL | #17, #19 | confirm-before-write | BE (AI, later phase) | KEEP |

### 5.2 Authentication

| Screen | Role | Route | Design exists? | Design status | Required by | Main states | Backend dependency | Action |
|---|---|---|---|---|---|---|---|---|
| Register (buyer-only, international phone) | Visitor | `/register` | Yes | CONTRADICTORY | #49, #60 | validation, email sent | BE (phone field) | UPDATE |
| Login (single, role from account) | User | `/login` | Yes | CONTRADICTORY | #97 | error, banned | — | UPDATE |
| Email verification | User | `/verify-email` | Yes | PARTIAL | #9, #38, B3 | expired, resent, verified | — | UPDATE |
| Password reset | User | `/forgot-password` | Yes | VALID | #9 | sent, reset | — | KEEP |
| Google sign-in phone step | User | TBD | No | — | #60 | required, invalid | BE (phone field) | NEW DESIGN |

### 5.3 Buyer

| Screen | Role | Route | Design exists? | Design status | Required by | Main states | Backend dependency | Action |
|---|---|---|---|---|---|---|---|---|
| Buyer portal shell | Buyer, agent, admin | `/buyer/*` (see §7) | Yes | PARTIAL | #50, #97 | — | — | UPDATE |
| Buyer overview | Buyer | `/buyer/overview` | Yes | PARTIAL | journeys, #60, #76 | empty | BE | UPDATE |
| Favourites & collections | Buyer | TBD | Yes | PARTIAL | FR3, #59 | empty | BE (engagement) | UPDATE |
| Saved searches | Buyer | TBD | Yes | VALID | FR4 (max 25) | limit reached, empty | BE (engagement, alerts) | KEEP |
| Viewing requests | Buyer | TBD | Yes | PARTIAL | V1–V11, I9, #62, #63 | requested, reschedule proposed, confirmed, declined, cancelled, completed, no-show, expired, frozen, 3-open limit | BE (pipeline) | UPDATE |
| Offers | Buyer | TBD | Yes | CONTRADICTORY | O1–O15, I12, #62, #76, #77, #84 | pending, countered, accepted (deposit due), reserved, withdrawn, expired, frozen, awaiting completion, disputed, sold | BE (pipeline) | UPDATE |
| Deposit checkout + result | Buyer | TBD | Partly (receipts, pay button) | PARTIAL | #11, #13, #76 | 15-min hold, pending, success, failure, cooling-off window, refund (100% / 20% to seller) | BE, PAY | NEW DESIGN |
| Sale completion confirmation (buyer side) | Buyer | within Offers | No | — | #77, #82 | awaiting other party, confirmed, disputed, under admin review | BE | NEW DESIGN |
| Messages | Buyer, agent | TBD | Yes (buyer + agent) | PARTIAL | FR14, #59 | own-listing blocked | BE (messaging) | MERGE |
| Notifications | All | TBD | Yes (buyer + agent) | PARTIAL | FR15, #94 | unread, empty | NOTIF | MERGE |
| Documents | Buyer | TBD | Yes | CONTRADICTORY | §9 visibility, #1 | empty | BE, STORE | UPDATE |
| Settings / profile (incl. "Become an agent" entry) | Buyer, agent, admin | TBD | Yes | CONTRADICTORY | #49, #53, #60, #9 | — | BE | UPDATE |

### 5.4 Agent

| Screen | Role | Route | Design exists? | Design status | Required by | Main states | Backend dependency | Action |
|---|---|---|---|---|---|---|---|---|
| Agent portal shell | Agent | `/agent/*` | Yes | PARTIAL | #97 | — | — | UPDATE |
| Agent overview (plan, quota, application status summary) | Agent | `/agent/overview` | Yes | PARTIAL | #80, #93, #94 | — | BE | UPDATE |
| Agent application | Buyer | TBD | No | — | #49, #55, #74 | draft, submitted, one-pending limit | BE, STORE | NEW DESIGN |
| Application status | Buyer, agent | TBD | No | — | #57, #58, #74 | pending, rejected (reason), approved, revoked, re-apply | BE | NEW DESIGN |
| Plans (Free / Pro / Enterprise, prices TBD) | Agent | TBD | No | — | #80, #89, #93 | current plan | BE | NEW DESIGN |
| Subscription checkout + result | Agent | TBD | No | — | #88, #90, #92 | new paid (prorated), upgrade (full price, new period), pending, success, failure | BE, PAY | NEW DESIGN |
| Subscription details (status, period end, cancel, scheduled downgrade, expired, receipt) | Agent | TBD | No | — | #90, #91, #92 | active, cancelled-until, downgrade scheduled, expired → Free | BE, PAY | NEW DESIGN |
| Quota indicator | Agent | dashboard section | No | — | #80, #86, #88, #94 | used / remaining, exhausted | BE | NEW DESIGN |
| Listings (full lifecycle, waiting section, FIFO order) | Agent | TBD | Yes | CONTRADICTORY | #78, #81, #94 | draft, pending review, rejected, approved-waiting, published, reserved, sold, rented, archived, suspended | BE | UPDATE |
| Create listing (resale fields, submit for review, quota warning) | Agent | TBD | Yes | CONTRADICTORY | #47, #51, #54, #68, #73, #95 | unverified agent blocked, quota warning | BE | UPDATE |
| Edit listing (edit warnings, relist, mark rented; no manual reserve/sold) | Agent | TBD | Yes | CONTRADICTORY | §2.1, #77, #78, #81, #94 | structural-edit warning, waiting-approval invalidation | BE | UPDATE |
| Listing status history | Agent | within listing | No | — | #81 | — | BE | NEW DESIGN |
| Sale completion confirmation (agent side) | Agent | within listing/offer | No | — | #77, #82 | awaiting other party, disputed, admin review | BE | NEW DESIGN |
| Leads pipeline | Agent | TBD | Yes | CONTRADICTORY | #75, #83, #66, #72 | NEW, CONTACTED, QUALIFIED, WON, LOST; phone visible/hidden | BE | UPDATE |
| Viewings calendar & availability | Agent | TBD | Yes | PARTIAL | V2–V9, #62 | frozen | BE | UPDATE |
| Analytics | Agent | TBD | Yes | PARTIAL | OVERVIEW §3, A4 | — | BE | UPDATE |
| Notifications / messages / settings | Agent | TBD | Yes | PARTIAL | #94, FR14 | — | NOTIF, BE | MERGE |

### 5.5 Admin

| Screen | Role | Route | Design exists? | Design status | Required by | Main states | Backend dependency | Action |
|---|---|---|---|---|---|---|---|---|
| Admin portal shell (no Agent Desk; switcher) | Admin | `/admin/*` | Yes | CONTRADICTORY | #97 | — | — | UPDATE |
| Admin dashboard (essential operational) | Admin | TBD | No | — | #28 | — | BE | NEW DESIGN |
| Agent verification (manual ID vs selfie, proof types, reason) | Admin | `/admin/verification` (Navbar) | Yes | PARTIAL | #55–#57 | pending, approved, rejected | BE, STORE | UPDATE |
| Revocation / re-verification | Admin | within verification | No | — | #52, #58, #65, #69, #93 | affected listings, frozen items | BE | NEW DESIGN |
| Reserved-listing revocation review | Admin | TBD | No | — | #64, #69, #70 | deadline countdown, release (only after re-verification), cancel with refund, auto-cancelled | BE, PAY | NEW DESIGN |
| Listing moderation (waiting outcome, original order) | Admin | TBD | Yes | CONTRADICTORY | P3/P4, #87, #93, #94 | approved-published, approved-waiting, rejected | BE | UPDATE |
| Sale-completion review | Admin | TBD | No | — | #77, #82 | confirm, fell through, extend (reason), evidence requested | BE, PAY | NEW DESIGN |
| Holiday list | Admin | TBD | No | — | #70 | — | BE | NEW DESIGN |
| Abuse reports | Admin | TBD | No (candidate is analytics) | CONTRADICTORY | #28 | — | BE | NEW DESIGN |
| Audit log | Admin | TBD | Yes | PARTIAL | #28, #42 | — | BE | UPDATE |
| Audited phone reveal | Admin | section | No | — | #66 | hidden / revealed (audited) | BE | NEW DESIGN |
| Conflict-of-interest state | Admin | state in all case screens | No | — | #67, #71 | action disabled, handled by another admin | BE | NEW DESIGN |
| Admin account creation | — | — | No (correct) | — | #97 | — | — | NOT NEEDED |

### 5.6 Shared

| Screen | Role | Route | Design exists? | Design status | Required by | Main states | Backend dependency | Action |
|---|---|---|---|---|---|---|---|---|
| Portal switcher (Buyer / Agent / Admin) | Agent, admin | global nav | Admin link only | PARTIAL | #97 | shows allowed portals only | — | NEW DESIGN |
| Notification centre (incl. waiting-listing published, subscription expired, revocation) | All | TBD | Yes (buyer + agent) | PARTIAL | #94, FR15 | — | NOTIF | MERGE |
| Profile / settings | All | TBD | Buyer only | CONTRADICTORY | #53, #60 | — | BE | MERGE |
| Payment status pattern (pending / success / failure) | Buyer, agent | — | No | — | #13, #90 | — | PAY | NEW DESIGN |
| Global empty / error / loading states | All | — | Some empty states ("No Advisors Match…", "No Matching Alerts") | PARTIAL | UX_PATTERNS | — | — | UPDATE |
| Internal decisions (#95 lock, #63 clocks, #98 secrets, admin seed/CLI) | — | — | — | — | — | — | — | NOT NEEDED |

### 5.7 Arabic / RTL

| Screen | Route | Design exists? | Design status | Required by | Action |
|---|---|---|---|---|---|
| Property detail (AR) | `/ar/properties/[slug]` | Yes | CONTRADICTORY, incomplete translation | #39 | UPDATE |
| AI assistant (AR) | `/ar/assistant` | Yes | PARTIAL | #39 | KEEP |
| All other screens (AR) | `/ar/*` | No | — | #39 | NEW DESIGN (approach to be set by the design authority) |

---

## 6. Recommended design order (by dependency)

| Group | Contents | Depends on |
|---|---|---|
| **1. Foundation** | Approval of the candidate design system into `DESIGN_SYSTEM.md`; terminology correction across candidates (C-5, C-11, C-20); portal shells + **portal switcher** (C-1, C-22); auth corrections (register, login, verify, Google phone step); global states; map provider correction (C-21); route-prefix decision (§7) | Design authority (#30); no backend |
| **2. Core buyer flows** | Property detail CTAs; viewings (full states, frozen); favourites; saved searches; offers; deposit checkout + payment status; buyer-side sale confirmation; documents; settings (incl. "Become an agent") | Foundation; payment status pattern; backend pipeline/payments |
| **3. Core agent flows** | Agent application + status; listings with full lifecycle; create/edit listing (resale fields, review flow); relist / mark rented; listing history; agent-side sale confirmation; leads (#83); calendar; overview; analytics | Foundation; application flow must exist before any agent screen is reachable |
| **4. Subscription & quota** | Plans; subscription checkout + result; subscription details (cancel, downgrade, expiry, receipt); quota indicator; submission warning; Approved-Waiting status and list; publication notice | Group 3 listing lifecycle; payment status pattern (group 2); notifications (group 6) |
| **5. Admin workflows** | Admin shell + dashboard; moderation (waiting outcome, order, conflict state); verification + revoke/re-verify; reserved-listing revocation review; sale-completion review; holiday list; abuse reports; audit log; phone reveal | Groups 3–4 (states admins act on); conflict-of-interest state pattern |
| **6. Shared states & notifications** | Notification centre (merge) and notification types; messages (merge); payment pending/success/failure pattern; empty/error/loading | Can start with group 1; notification types grow with groups 2–5 |
| **7. Arabic / RTL** | Fix `property-detail-ar`; RTL review/design of all screens | English designs of groups 1–6 stable; V26 (RTL maturity) |

---

## 7. Open points surfaced (not decided here)

- ~~Buyer portal route prefix~~ — **resolved by #100** (`/buyer/*`, `/agent/*`, `/admin/*`); the
  auth-page redirects to `/buyer-dashboard/*` remain an implementation follow-up.
- Arabic/RTL (§5.7, group 7) — **deferred by #99** (English-only V1).
- Features shown in candidates but never decided: 3D virtual tour; compound gate passes / QR; iCal
  sync; saved-search pause and forwarding; agent-created viewings ("VIP / Emergency Tour"); manual lead
  creation; representation / NDA requests; contract (SPA) drafting; "request document clarification /
  rectification" admin actions; buyer KYC tiers; buyer bank details for refunds.
- Multi-currency display (USD/AED/EUR) on compare and insights (gap D4).
- Fabricated figures on public/admin screens (gap A4).
- Area "corridor" grouping (gap C6).
- Email verification by link or code (gap B3).

## 8. Scope

Documentation only. No file in `docs/design/candidates/settly-landing/` was modified. No frontend
source, route, backend, schema or migration was changed, and no UI was designed.
