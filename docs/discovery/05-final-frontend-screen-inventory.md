# Final Frontend Screen Inventory (V1)

    Status:       PLANNING (discovery) · NOT a source of truth for rules or visuals · no UI invented
    Last Updated: 2026-09-17
    Evidence:     docs/design/candidates/settly-landing/ (re-inspected for this inventory),
                  frontend/src/app (implemented routes), frontend/src/components (maps)
    Derived from: ../DECISIONS.md, ../product/BUSINESS_RULES.md, ../architecture/FRONTEND.md,
                  ../architecture/AUTH.md, 03-frontend-screen-audit.md, 04-frontend-design-plan.md

**Authority.** Rules come from `DECISIONS.md` and `BUSINESS_RULES.md`; visual authority stays with
`design/DESIGN_SYSTEM.md` and `design/UX_PATTERNS.md` (#30). This document only maps those rules to
screens and surfaces. **If this inventory and a decision disagree, the decision wins** and this file
is corrected. It **replaces the inventory in §5 of `04-frontend-design-plan.md`**; the rest of 04
(candidate review, contradiction list C-1…C-22) stays valid and is referenced here.

**Vocabulary.**
- Design status: **EXISTS** · **PARTIAL** · **CONTRADICTORY** · **OUTDATED** · **MISSING** · **NOT NEEDED**
- Action: **KEEP** · **UPDATE** · **NEW DESIGN** · **MERGE** · **NOT NEEDED**
- Backend dependency: **BE** backend service/API · **PAY** Paymob hosted checkout · **NOTIF** notifications ·
  **STORE** private file storage · **—** none
- Routes are **conceptual**. They do not authorise creating routes in code. Routes marked † are
  not in the confirmed baseline and are listed in §E.3.

**Reclassified from 04:** `VALID` → `EXISTS`. Compare changes from PARTIAL/KEEP to PARTIAL/UPDATE,
because the multi-currency toggle (D4) is undecided. Deposit checkout changes from PARTIAL to
MISSING: the candidate only has a "Pay deposit" button and receipts, not a checkout design. Arabic
screens move out of V1 (§0).

---

## 0. Foundation used (confirmed by the product owner, 2026-09-17)

| Foundation | Source | Recorded in `DECISIONS.md`? |
|---|---|---|
| **English-only V1**; Arabic/RTL is a future/optional feature after core completion | **#99** (supersedes the UI parts of #39 §8 for V1) | **Yes — #99.** `FRONTEND.md` updated |
| Portal prefixes **`/buyer/*`, `/agent/*`, `/admin/*`**; no `/dashboard/*`, no `/buyer-dashboard/*`; one shell per portal | **#100** (refines #97) | **Yes — #100.** `FRONTEND.md` updated; code mismatches remain (§E.2) |
| Portal switcher: USER none · AGENT Buyer↔Agent · ADMIN Buyer↔Admin; admin has no agent powers | #97, #59 | Yes |
| Admin accounts only by seed/CLI | #97 | Yes |
| Quota Free 2 · Pro 4 · Enterprise 8; first publication consumes; Cairo calendar month | #80, #85, #86, #88 | Yes |
| Waiting for quota (sub-state of `PENDING_REVIEW`, FIFO, automatic) | #87, #94, #95 | Yes |
| Leaflet + MapTiler, `NEXT_PUBLIC_MAPTILER_KEY` | #96 | Yes |
| Agent phone never public; WhatsApp only as a non-functional demo CTA | #60, #66; demo-CTA rule from the product owner | Phone rule yes; **the demo-CTA allowance is not recorded** |

**Listing states.** `BUSINESS_RULES.md` §2 has **9** states. The 8 in the brief plus **`ARCHIVED`**
(P7, P14). This inventory covers all 9.

---

## A. Executive summary

Counted over the **106 rows** of §B. There are 98 distinct screens, sections, states and patterns;
the other 8 rows are portal entry points that open a shared surface (marked "→ SH-xx").

| Measure | Count | Notes |
|---|---|---|
| Existing / usable (EXISTS) | **3** | Password reset, saved searches, AI assistant (later phase) |
| Partial (PARTIAL) | **29** | Includes 4 entry-point rows |
| Contradictory (CONTRADICTORY) | **23** | Includes 1 entry-point row; references C-1…C-22 |
| Outdated (OUTDATED) | **1** | Market insights |
| Missing (MISSING) | **44** | Includes 3 entry-point rows (agent settings, admin notifications, admin settings) |
| Not needed (NOT NEEDED) | **6** | Arabic/RTL, admin creation, advanced admin analytics, out-of-scope features, internal decisions, redirect page |
| Shared surfaces (SH-xx) | **12** | Used by all portals; not duplicated per role |
| Actions | KEEP **3** · UPDATE **41** · NEW DESIGN **43** · MERGE **13** · NOT NEEDED **6** | |

**Headline.** Almost everything that makes Settly a real business, and not only a catalogue, has
**no design**. That covers the agent application, subscriptions, quota and waiting-for-quota,
deposit checkout and results, two-sided sale confirmation, the admin case workflows, the portal
switcher and mobile portal navigation. Most existing portal mockups need **correction before use**
(§D).

---

## B. Complete screen inventory

### B.1 Public

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PUB-01 | Home | Visitor, all | `/` | Discovery | PARTIAL (C-5, C-20) | `public/index.html` | Hero + search, featured listings, journey, areas/agents/insights teasers | loading, empty featured | Search (buy/rent), open listing | BE (catalog) | UPDATE — drop "New launches" and payment-plan cards (#47); market-wide copy (#45) |
| PUB-02 | Search (list + map) | Visitor, all | `/search` | Discovery | PARTIAL (C-20, C-21) | `public/search.html` | Filters, results list/grid, map, draw area, pagination | loading, empty, error, map error | Filter, sale/rent, favourite, compare, save search (signed in) | BE (search) | UPDATE — facets and prices must not assume luxury (#45); MapTiler (#96) |
| PUB-03 | Property detail | Visitor, all | `/properties/[slug]` | Discovery / transaction entry | CONTRADICTORY (C-3, C-5, C-9, C-11, C-21) | `public/property-detail.html` | Gallery, specs, price + remaining instalments (#61, #68), location map, agent card (no phone), similar | sale vs rent (no offer on rent, O1); own listing, so buyer actions hidden (#59); email unverified (SH-09); `RESERVED` (no new offers); another buyer in checkout (§6.1); unavailable | Favourite, request viewing, make offer (sale only), message agent, compare, WhatsApp demo CTA (SH-11) | BE | UPDATE — remove escrow offer, developer plan, deed "certified", tel/WhatsApp contact; 3D tour is OPEN (§E.4) |
| PUB-04 | Areas | Visitor | `/areas` | Discovery | PARTIAL (C-20, C-21) | `public/areas.html` | Area list, region filter, map | loading, empty | Open area | BE (areas) | UPDATE — area grouping OPEN (C6); unsourced figures OPEN (A4) |
| PUB-05 | Area detail | Visitor | `/areas/[slug]` | Discovery | PARTIAL (C-21) | `public/area-detail.html` | Area summary, map, listings in area | loading, empty, not found | Open listing, search in area | BE (areas, insights) | UPDATE — fabricated figures OPEN (A4); WhatsApp/tel removed |
| PUB-06 | Agents directory | Visitor | `/agents` | Discovery | CONTRADICTORY (C-5, C-9, C-20) | `public/agents.html` | Verified agents list, filters | loading, empty | Open profile | BE (directory) | UPDATE — no "Direct Desk" contact; NDA/representation request is undecided (§E.4) |
| PUB-07 | Agent public profile | Visitor | `/agents/[id]` (†, see E.3) | Discovery | CONTRADICTORY (C-9, C-12) | `public/agent-profile.html` | Bio, areas, active listings | not found, revoked (hidden) | Open listing, message via a listing | BE | UPDATE — no phone/WhatsApp, no Zoom, no fabricated ledger/endorsements (A4) |
| PUB-08 | Compare | Visitor, all | `/compare` | Discovery | PARTIAL | `public/compare.html` | Comparison matrix | 2–4 items, empty, max reached | Add/remove, open listing | BE (exists) | UPDATE — EGP only until D4 decides the currency toggle |
| PUB-09 | Market insights | Visitor | `/market-insights` (†) | Discovery | OUTDATED (C-5, C-20) | `public/market-insights.html` | Market indicators | loading, empty | Filter by area | BE (insights) | UPDATE — resale/rent market only (#47); figures OPEN (A4) |
| PUB-10 | AI assistant | Buyer | `/assistant` | Intelligence (later phase, #48) | EXISTS | `assistant/index.html` | Chat, shortlist | confirm-before-write | Ask, confirm proposed action | BE (AI) | KEEP — later phase; nav WhatsApp link per SH-11 |
| PUB-11 | Report listing (abuse report submission) | Signed-in user | action on PUB-03 | Governance | MISSING | — | — | — | Report | BE | NEW DESIGN — **blocked**: who may report and which reasons are undecided (§E.4) |

### B.2 Authentication

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Register | Visitor | `/register` | Identity | CONTRADICTORY (C-16) | `auth/register.html` | Account form, phone (international, required, #60), Google | validation, email sent, error | Create account (always USER, #49) | BE (phone field) | UPDATE — no role tabs, no advisor fields, no demo buttons; "Enterprise SSO" is undecided (§E.4) |
| AUTH-02 | Login | Visitor | `/login` | Identity | CONTRADICTORY (C-16) | `auth/login.html` | Credentials, Google | invalid, banned/disabled, loading | Sign in (role from account, #97) | BE | UPDATE — no role tabs |
| AUTH-03 | Verify email | User | `/verify-email` | Identity | PARTIAL | `auth/verify-email.html` | Instructions, resend | sent, expired, verified, error | Resend | BE | UPDATE — link vs code OPEN (B3); remove demo controls |
| AUTH-04 | Forgot / reset password | User | `/forgot-password` | Identity | EXISTS | `auth/forgot-password.html` | Request, new password | sent, invalid/expired token, done | Request, reset | BE | KEEP |
| AUTH-05 | Google sign-in | Visitor | within AUTH-01/02 | Identity | PARTIAL | buttons in register/login | Provider button | cancelled, error | Continue with Google | BE | UPDATE (part of AUTH-01/02) |
| AUTH-06 | Google sign-in phone step | New Google user | `/complete-profile` (#106) | Identity | MISSING | — | Phone entry | required, invalid, saved | Save phone before using the app (#60) | BE (phone field) | NEW DESIGN |

### B.3 Buyer portal (`/buyer/*`)

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BUY-00 | Buyer shell | USER, AGENT, ADMIN | `/buyer/*` | Portal | PARTIAL (C-22) | buyer sidebar (all `buyer-dashboard/*`) | Nav, portal switcher (SH-01), notifications, profile | desktop nav / mobile bottom nav (SH-12) | Navigate, switch portal | — | UPDATE — add switcher; remove WhatsApp nav link as real contact |
| BUY-01 | Buyer dashboard | Buyer | `/buyer` | Buyer journey | PARTIAL (C-9, C-11) | `buyer-dashboard/overview.html` | Active offers, upcoming viewings, saved items, "Become an agent" entry (APP-01) | empty, loading | Continue deposit, open item | BE | UPDATE — no "dedicated advisor" phone/WhatsApp; no escrow wording |
| BUY-02 | Favourites | Buyer | `/buyer/favourites` | Engagement | PARTIAL (C-11) | `buyer-dashboard/favorites.html` | Saved listings (collections per FR3) | empty, listing no longer available, own listing (#59) | Remove, compare, request viewing, make offer (sale only) | BE | UPDATE |
| BUY-03 | Saved searches | Buyer | `/buyer/saved-searches` | Engagement | EXISTS | `buyer-dashboard/saved-searches.html` | Searches, matches | empty, limit 25 reached (I11) | Create, edit, delete, run | BE, NOTIF | KEEP — pause and "forward" are undecided and excluded (§E.4) |
| BUY-04 | Viewings | Buyer | `/buyer/viewings` | Pipeline | PARTIAL (C-9) | `buyer-dashboard/viewings.html` | Upcoming / pending / past lists | `REQUESTED`, `RESCHEDULE_PROPOSED`, `CONFIRMED`, `DECLINED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`, `EXPIRED`, **frozen** (SH-10); 3-open limit (I9) | Accept/decline proposed time, cancel (always allowed when frozen, #62) | BE, NOTIF | UPDATE — no "Call Broker"; gate QR undecided |
| BUY-05 | Viewing details | Buyer | drawer in BUY-04 | Pipeline | PARTIAL | cards in `viewings.html` | Time, listing, status, history | as BUY-04; paused clock while frozen (#63) | As BUY-04 | BE | MERGE into BUY-04 |
| BUY-06 | Offers | Buyer | `/buyer/offers` | Transaction | CONTRADICTORY (C-5, C-11) | `buyer-dashboard/offers.html` | Live / concluded offers | live set `PENDING_AGENT`, `PENDING_BUYER`, `ACCEPTED`, `RESERVED`; terminal `REJECTED`, `WITHDRAWN`, `EXPIRED`, `SUPERSEDED`, `COMPLETED`, `FELL_THROUGH`; frozen; 5-live limit (I12) | Open offer | BE | UPDATE — sale listings only; no developer counter-proposal |
| BUY-07 | Offer details | Buyer | `/buyer/offers/[id]` (†) | Transaction | CONTRADICTORY (C-11) | negotiation cards in `offers.html` | Terms + revision history, deposit block, reservation block, sale-completion block (BUY-10) | as BUY-06; deposit due 72 h; "not held until your deposit clears" (§6); frozen | Counter, accept, withdraw (BUY-11), pay deposit (BUY-08) | BE, NOTIF | UPDATE — deposit is 5%, capped 50,000 EGP, after acceptance, credited to price (#13, #76) |
| BUY-08 | Deposit checkout | Buyer | step from BUY-07 → Paymob hosted page | Payments | MISSING | only "Pay deposit" button and receipts | Amount, credit-toward-price note, 72 h deadline, 15-min hold notice, refund terms (48 h cooling-off) | hold acquired, hold held by another buyer, deadline passed, email unverified | Proceed to Paymob | BE, PAY | NEW DESIGN — no stored card (#13, #90) |
| BUY-09 | Deposit payment result | Buyer | return page (†) | Payments | MISSING | — | Status (SH-05), next steps | pending (polling), success only after verified webhook (§5.1), failed (retry), cancelled, expired, lost race → automatic full refund (§6.2) | Retry, back to offer | BE, PAY, NOTIF | NEW DESIGN (uses SH-05) |
| BUY-10 | Sale confirmation (buyer side) | Buyer | section in BUY-07 | Transaction | MISSING | — | Completion status | awaiting both, buyer confirmed / awaiting agent, disputed, under admin review, review extended, `SOLD`, fell through (#77, #82) | Confirm completion, dispute | BE, NOTIF | NEW DESIGN |
| BUY-11 | Withdraw offer / reservation | Buyer | confirmation modal in BUY-07 (SH-06) | Transaction / refunds | MISSING | — | Consequence summary | before deposit (no charge); within 48 h (100%); after 48 h (20% retained, goes to seller, #84); frozen or under revocation review (100%, #62, #64) | Confirm withdrawal | BE, PAY | NEW DESIGN |
| BUY-12 | Documents | Buyer | `/buyer/documents` (†) | Documents | CONTRADICTORY (C-13) | `buyer-dashboard/documents.html` | Documents by listing/offer (visibility scopes, #39) | empty, access ended (offer no longer live) | View, download | BE, STORE | UPDATE — no e-signature; gate passes and buyer KYC are undecided |
| BUY-13 | Messages | Buyer | `/buyer/messages` | Messaging | PARTIAL | `buyer-dashboard/messages.html` | → SH-03 | — | — | BE | MERGE → SH-03 |
| BUY-14 | Notifications | Buyer | `/buyer/notifications` | Notifications | PARTIAL | `buyer-dashboard/notifications.html` | → SH-02 | — | — | NOTIF | MERGE → SH-02 |
| BUY-15 | Profile & settings | Buyer | `/buyer/settings` | Account | CONTRADICTORY (C-14, C-15) | `buyer-dashboard/settings.html` | → SH-04 | — | — | BE | MERGE → SH-04 |

### B.4 Agent application (buyer → agent)

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| APP-01 | "Become an agent" entry | USER | card in BUY-01 and SH-04 | Onboarding | MISSING | — | Short explanation, CTA | no application · pending (show status) · rejected (re-apply) · hidden once AGENT | Start application | BE | NEW DESIGN |
| APP-02 | Agent application | USER | TBD under `/buyer` (†) | Onboarding | MISSING | buyer settings shows ID documents only (not an application) | Identity: National ID + **selfie** (#49); professional proof, at least one of the #55 types ("other" needs a description); review & submit | uploading, upload failed, incomplete, submitted, **one pending application only** (#74) | Upload, submit | BE, STORE | NEW DESIGN — private storage only, never Cloudinary (#49); no automated checks (#55, #56); test documents only until V35 |
| APP-03 | Application status | USER, AGENT | same resource as APP-02 | Onboarding | MISSING | — | Status, submitted items, reason | `PENDING`, `REJECTED` + reason (#57), `APPROVED` (agent portal available) | Re-apply, go to agent portal | BE, NOTIF | NEW DESIGN (state of APP-02, not a separate flow) |
| APP-04 | Re-application after rejection | USER | state of APP-02/03 | Onboarding | MISSING | — | Previous reason, new submission | allowed immediately (#74); cooldown OPEN (#57) | Re-apply | BE, STORE | NEW DESIGN — admin "request rectification" is undecided (§E.4) |
| APP-05 | Verification status (agent side) | AGENT | banner in agent shell + SH-04 agent section | Governance | MISSING | — | Status, effect on listings | verified, **revoked** (listings suspended, offers/viewings frozen, #58), re-verification pending | Read-only | BE, NOTIF | NEW DESIGN |

### B.5 Agent portal (`/agent/*`)

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AGT-00 | Agent shell | AGENT | `/agent/*` | Portal | PARTIAL (C-22) | agent sidebar (all `agent-dashboard/*`) | Nav, switcher (Buyer↔Agent), notifications, profile, verification banner (APP-05) | revoked (restricted actions) | Navigate, switch portal | — | UPDATE |
| AGT-01 | Agent dashboard | AGENT | `/agent` | Agent operations | PARTIAL (C-9) | `agent-dashboard/overview.html` | Plan + quota summary (SUB-09), waiting-for-quota count, pending actions (offers, viewings), recent leads | empty, loading | Open item, go to subscription | BE | UPDATE — remove "Dispatch SPA", virtual-tour prep, WhatsApp |
| AGT-02 | Listings | AGENT | `/agent/listings` | Listings | CONTRADICTORY (C-7) | `agent-dashboard/listings.html` | Status filter, table (desktop) / cards (mobile), **Waiting for Quota section (FIFO order)**, pagination | all 9 states: `DRAFT`, `PENDING_REVIEW`, *Approved — Waiting for Quota*, `REJECTED` (reason), `PUBLISHED`, `RESERVED`, `SOLD`, `RENTED`, `ARCHIVED`, `SUSPENDED` | Create, open, filter | BE | UPDATE — no "Under Contract"/"In Escrow"; no share-to-WhatsApp as contact |
| AGT-03 | Listing details | AGENT | `/agent/listings/[id]` (†) | Listings | MISSING | — (edit-listing has only a price log) | Summary, status banner per state, offers/viewings/leads for the listing, history (AGT-06), sale confirmation (AGT-07), lifecycle actions (AGT-08) | per state; waiting (FIFO, no manual publish); suspended (no agent writes); frozen items | Edit, submit for review, archive, relist, mark rented | BE | NEW DESIGN |
| AGT-04 | Create listing | Verified AGENT | `/agent/listings/new` | Listings | CONTRADICTORY (C-4, C-5) | `agent-dashboard/create-listing.html` | Location + area, specs, sale/rent + price, under-construction instalments (#54, #68, #73), media (≥3 images) | save draft (no quota used), incomplete, unverified agent blocked (#51), **quota exhausted warning** (SUB-10), submitted | Save draft, **Submit for review** (final action) | BE | UPDATE — never publishes; no developer/off-plan/NOC/handover fields |
| AGT-05 | Edit listing | AGENT | `/agent/listings/[id]/edit` (†) | Listings | CONTRADICTORY (C-6) | `agent-dashboard/edit-listing.html` | Same fields as AGT-04, price history | structural edit → re-review (§2.1); **editing a waiting listing invalidates approval** (#94); suspended (read-only) | Save, resubmit | BE | UPDATE — no "Mark as Reserved" (system only) and no agent-only "Sold" (#77) |
| AGT-06 | Listing history | AGENT | section in AGT-03 | Listings | MISSING | — | Status changes, price changes, previous rental lifecycle (#81) | empty | Read-only | BE | NEW DESIGN — data source is OPEN (§E.1, PI-12) |
| AGT-07 | Sale confirmation (agent side) | AGENT | section in AGT-03 | Transaction | MISSING | — | Completion status | awaiting both, agent confirmed / awaiting buyer, disputed, admin review, extended, `SOLD`, fell through | Confirm completion, dispute | BE, NOTIF | NEW DESIGN |
| AGT-08 | Lifecycle actions (archive, relist, mark rented) | AGENT | modals in AGT-03 (SH-06) | Listings | PARTIAL | archive-with-reason modal in `listings.html` | Consequence summary | archive blocked while reserved (P7); relist → new `DRAFT`, uses quota at first publication (#85, #86); mark rented only for rent listings (#78) | Confirm | BE | UPDATE |
| AGT-09 | Offer handling (agent side) | AGENT | **location OPEN** (AGT-03 / AGT-11 / own page) | Transaction | MISSING | counter-offer alert only (overview) | Offer terms, revisions, buyer phone when allowed (#72) | pending agent, countered, accepted (deposit due), reserved, frozen (agent actions blocked, #62) | Accept, counter, reject, record offline offer (O1b) | BE, NOTIF | NEW DESIGN — placement OPEN (§E.1, PI-8) |
| AGT-10 | Leads | AGENT | `/agent/leads` | CRM | CONTRADICTORY (C-8, C-10) | `agent-dashboard/leads.html` | Board/table by stage, pagination | `NEW`, `CONTACTED`, `QUALIFIED`, `WON` (automatic on sale), `LOST`; empty | Filter, change stage, set `LOST` | BE | UPDATE — no "In Escrow"; no "Add Private Lead" (leads come from first contact, #75) |
| AGT-11 | Lead details | AGENT | drawer in AGT-10 | CRM | CONTRADICTORY (C-10) | detail panel in `leads.html` | Buyer, listing, interactions, stage | phone visible only while an offer is pending/accepted/reserved/completed (#66, #72) | Change stage, message | BE | MERGE into AGT-10 |
| AGT-12 | Calendar & viewing requests | AGENT | `/agent/calendar` | Pipeline | PARTIAL | `agent-dashboard/calendar.html` | Availability, requests, confirmed viewings | overlap blocked (§3.1), frozen, grace period before no-show | Add availability, confirm, decline, propose time, complete, no-show | BE, NOTIF | UPDATE — agent-created "VIP/Emergency" tours and iCal sync are undecided |
| AGT-13 | Analytics | AGENT | `/agent/analytics` (†) | Agent operations | PARTIAL | `agent-dashboard/analytics.html` | Listing performance | empty, loading | Filter period | BE | UPDATE — no commission view (fee TBD, #79); no fabricated figures (A4) |
| AGT-14 | Public profile management | AGENT | section in SH-04 | Account | MISSING | "Public Profile" nav link only | Public bio/areas shown on PUB-07 | — | Edit | BE | NEW DESIGN — kept separate from private settings |
| AGT-15 | Messages | AGENT | `/agent/messages` | Messaging | PARTIAL (C-19) | `agent-dashboard/messages.html` | → SH-03 | — | — | BE | MERGE → SH-03 |
| AGT-16 | Notifications | AGENT | `/agent/notifications` | Notifications | PARTIAL (C-19) | `agent-dashboard/notifications.html` | → SH-02 | — | — | NOTIF | MERGE → SH-02 |
| AGT-17 | Profile & settings | AGENT | `/agent/settings` | Account | MISSING | — | → SH-04 | — | — | BE | MERGE → SH-04 |

### B.6 Agent subscription and quota

Plans: **Free 2 · Pro 4 · Enterprise 8** new publications per Cairo calendar month (reset on the
1st). **Prices (#89): Free $0 · Pro $20 · Enterprise $50 per month, USD base.** The plans UI
shows **USD only — no currency toggle**. **Payment is charged in EGP at the fixed rate 1 USD = 48.98
EGP**, rounded up to a whole EGP (Pro **980 EGP**, Enterprise **2,449 EGP**), and SUB-02 must show the
**exact EGP amount before the Paymob redirect** (#103). EGP never appears as an alternative plan price.

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SUB-01 | Plans | AGENT | section of `/agent/subscription` | Subscription | MISSING | — | Three plans with quota; current plan marked | new agent on Free (#93); prices $0 / $20 / $50 (#89) | Choose plan | BE | NEW DESIGN |
| SUB-02 | Subscription checkout | AGENT | step → Paymob hosted page | Subscription / payments | MISSING | — | Plan, amount (from backend), period | **every paid period** (first, re-subscription, upgrade, renewal): **full price, 30 days from start, no proration** (#104); exact EGP amount shown (#103) | Proceed to Paymob | BE, PAY | NEW DESIGN — 30-day periods, no saved card, no auto-renewal (#90, #104) |
| SUB-03 | Subscription payment result | AGENT | return page (†) | Subscription / payments | MISSING | — (deposit receipt does not cover it) | Status (SH-05) | pending, success, failed, cancelled | Retry, back | BE, PAY, NOTIF | NEW DESIGN (uses SH-05) |
| SUB-04 | Current subscription | AGENT | `/agent/subscription` | Subscription | MISSING | — | Plan, status, period end, quota, receipts (simple receipt, #90), renew | active, cancelled (active until period end), downgrade scheduled, expired → Free | Renew (manual payment per 30-day period), upgrade, downgrade, cancel | BE, PAY | NEW DESIGN — states also include **renewal queued** (starts at current period end). Renew is available only in the last 7 days, one queued period max; end dates are 30 × 24 h from start, shown in Cairo time (#104) |
| SUB-05 | Upgrade confirmation | AGENT | modal (SH-06) | Subscription | MISSING | — | Full price, new 30-day period starts now (no credit for the old plan, #104); **blocked while a renewal is queued**, with an explanation, new remaining quota = new quota − used, waiting listings may publish (#92, #94) | — | Confirm | BE, PAY | NEW DESIGN |
| SUB-06 | Downgrade (scheduled) | AGENT | modal + state in SUB-04 | Subscription | MISSING | — | To a lower paid plan: a **paid queued period** starting when the current one ends (last 7 days only); to Free: let the plan expire (#105). Published listings stay live (#91) | scheduled (paid) | Confirm and pay | BE, PAY | NEW DESIGN |
| SUB-07 | Cancellation | AGENT | modal + state in SUB-04 | Subscription | MISSING | — | Active to period end, **no refund** (#91); an already-paid queued period still runs (#105) | cancelled-until | Confirm | BE | NEW DESIGN |
| SUB-08 | Expired → Free | AGENT | state in SUB-04 + notification | Subscription | MISSING | — | Moved to Free immediately, no grace (#91) | expired | Subscribe again (full price, new 30-day period, #104) | BE, NOTIF | NEW DESIGN |
| SUB-09 | Quota indicator | AGENT | section in AGT-01 (and AGT-02 header) | Quota | MISSING | — | Used / remaining this month, reset date | available, exhausted | Go to subscription | BE | NEW DESIGN |
| SUB-10 | Quota-exhausted submission warning | AGENT | in AGT-04 / AGT-05 submit | Quota | MISSING | — | Warning: submission allowed, listing will wait after approval (#95) | exhausted | Submit anyway, upgrade | BE | NEW DESIGN |
| SUB-11 | Waiting for Quota | AGENT (admin view in ADM-02) | section in AGT-02, state in AGT-03 | Quota | MISSING | — | Waiting listings in approval order | *Approved — Waiting for Quota* (= `PENDING_REVIEW`); auto-publishes FIFO; no cap; edit invalidates approval | Open, edit (with warning) | BE | NEW DESIGN — no manual publish or bypass |
| SUB-12 | Waiting listing published | AGENT | notification type in SH-02 | Quota | MISSING | — | Which listing published and why | — | Open listing | NOTIF | NEW DESIGN |

### B.7 Admin portal (`/admin/*`)

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ADM-00 | Admin shell | ADMIN | `/admin/*` | Portal | CONTRADICTORY (C-1) | admin sidebar (all `admin/*`) | Nav, switcher (Buyer↔Admin), notifications | — | Navigate, switch portal | — | UPDATE — **remove "Agent Desk"** (#97) |
| ADM-01 | Admin dashboard | ADMIN | `/admin` | Governance | MISSING | — | Essential operational counts only (#28): pending reviews, applications, cases near deadline, failed-refund alerts (§5) | empty | Open queue | BE | NEW DESIGN — exact contents need a spec; no analytics |
| ADM-02 | Listing moderation | ADMIN | `/admin/moderation` | Governance | CONTRADICTORY (C-2, C-3) | `admin/moderation.html` | Queue in original order (#93), review detail | approve → published **or** *Approved — Waiting for Quota* (#94); reject (reason required); re-review after edit; involved admin (ADM-11) | Approve, reject | BE, NOTIF | UPDATE — no "Approve & Publish", no batch approve, no deed certification |
| ADM-03 | Listing suspension / reinstatement | ADMIN | action — location OPEN | Governance | MISSING | — | Reason, consequences (full refund if reserved, P12) | suspended, reinstated (P13) | Suspend, reinstate, archive | BE, PAY | NEW DESIGN |
| ADM-04 | Agent verification | ADMIN | `/admin/verification` | Governance | PARTIAL (C-18) | `admin/agent-verification.html` | Applications queue; **National ID and selfie side by side** (#56); proof type; audited document access | pending, approved, rejected (reason required, #57); involved admin | Approve, reject | BE, STORE, NOTIF | UPDATE — add selfie; remove registry sync / automated ID hash |
| ADM-05 | Revocation / re-verification | ADMIN | section of agent record in ADM-04 | Governance | MISSING | — | Reason, affected listings, frozen items | revoked, re-verified (listings restored or re-reviewed per #65, #69) | Revoke, re-verify | BE, NOTIF | NEW DESIGN |
| ADM-06 | Reserved-listing review (after revocation) | ADMIN | route OPEN (†) | Governance / refunds | MISSING | — | Case, 5-business-day deadline (#64, #70) | pending, release **disabled until the agent is re-verified** (#69), cancelled with 100% refund, auto-cancelled at deadline, buyer withdrew (100%) | Release, cancel with refund | BE, PAY, NOTIF | NEW DESIGN |
| ADM-07 | Sale-completion review | ADMIN | `/admin/sales` | Governance | MISSING | — | Case, confirmations, dispute, optional evidence request | entered at 30 days or on dispute; involved admin | Confirm sale, declare fell through (§7 cause), extend (reason) (#82) | BE, PAY, NOTIF | NEW DESIGN — extension limits TBD (#82) |
| ADM-08 | Abuse reports | ADMIN | `/admin/reports` | Governance | CONTRADICTORY (C-17) | `admin/reports.html` (analytics, not reports) | Report queue, report detail | open, upheld (→ suspension, 100% refund if reserved), dismissed | Uphold, dismiss | BE | NEW DESIGN — report reasons and outcomes need a spec (§E.4) |
| ADM-09 | Holiday list | ADMIN | `/admin/holiday-list` | Governance | MISSING | — | Egyptian public holidays list (#70) | empty | Add, remove | BE | NEW DESIGN |
| ADM-10 | Audited phone reveal | ADMIN | section in user/case views | Privacy | MISSING | — | Masked phone, reveal | hidden, revealed (access audited, ids only, #42, #66) | Reveal | BE | NEW DESIGN |
| ADM-11 | Conflict-of-interest state | ADMIN | state on every case screen | Governance | MISSING | — | Explanation | actions disabled when the admin is involved (#67, #71); handled by another admin | — | BE | NEW DESIGN |
| ADM-12 | Audit log | ADMIN | `/admin/audit-log` | Governance | PARTIAL | `admin/audit-log.html` | Event list, filters, event detail (ids/enums only) | empty, loading | Filter | BE | UPDATE — remove "Merkle root", "signed ledger", "simulate event" |
| ADM-13 | Notifications | ADMIN | `/admin/notifications` | Notifications | MISSING | — | → SH-02 | — | — | NOTIF | MERGE → SH-02 |
| ADM-14 | Profile & settings | ADMIN | `/admin/settings` | Account | MISSING | — | → SH-04 | — | — | BE | MERGE → SH-04 |

### B.8 Shared surfaces and patterns

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SH-01 | Portal switcher | AGENT, ADMIN | global (shell header) | Portal | PARTIAL (C-22) | "Buyer Portal" link in admin nav only | Allowed portals only | USER: hidden · AGENT: Buyer/Agent · ADMIN: Buyer/Admin | Switch | — | NEW DESIGN |
| SH-02 | Notification centre | All signed-in | `/{portal}/notifications` + header bell | Notifications | PARTIAL (C-19) | buyer + agent notifications | List, unread, filters | unread, empty | Open, mark read | NOTIF | MERGE — types include offer/viewing events, deposit result, refund, publication, rejection, waiting published, subscription expired, revocation |
| SH-03 | Messages | Buyer, agent | `/buyer/messages`, `/agent/messages` | Messaging | PARTIAL (C-19) | buyer + agent messages | Conversations (buyer↔agent per listing, #3), thread | own listing blocked (#59), empty | Send | BE | MERGE — no "Legal/Developers" desks, no offer acceptance in chat, no SMS PIN |
| SH-04 | Profile & settings | All signed-in | `/{portal}/settings` (PI-11) | Account | CONTRADICTORY (C-14, C-15) | `buyer-dashboard/settings.html` | Profile, phone (international), password, notification preferences, "Become an agent" (USER), agent section (verification status, public profile AGT-14, subscription link) | — | Save | BE | MERGE — **no 2FA, no saved cards, no refund bank account**; buyer KYC tiers undecided |
| SH-05 | Payment status pattern | Buyer, agent | used by BUY-09, SUB-03 | Payments | MISSING | — | Status, amount, reference, next step | **PENDING · SUCCESS · FAILED · CANCELLED** (mapping OPEN, PI-9) | Retry, return | PAY | NEW DESIGN — success only from a verified webhook or reconciliation |
| SH-06 | Confirmation pattern | All | modal/drawer | UX | PARTIAL | modals in 23 candidates (e.g. archive with reason) | Consequence, reason field when required | destructive, reason-required | Confirm, cancel | — | UPDATE — for withdraw, archive, relist, upgrade/downgrade/cancel, reject, suspend, revoke, release, fell-through |
| SH-07 | Loading / empty / error / success / disabled / permission denied | All | global | UX | PARTIAL | some empty states in candidates | — | all six | Retry | — | UPDATE |
| SH-08 | Public header & footer | Visitor, all | global | UX | PARTIAL (C-20) | `master-nav-footer.css` | Nav, sign-in | signed in / out | Navigate | — | UPDATE — no "sovereign"/luxury copy; no WhatsApp "private advisor" |
| SH-09 | Email-not-verified gate | Signed-in, unverified | global banner + disabled actions | Identity | MISSING | — | Explanation, resend | viewing, offer, deposit blocked (§9.1) | Resend | BE | NEW DESIGN |
| SH-10 | Frozen-item state | Buyer, agent | state on offers/viewings | Governance | MISSING | — | Why frozen, paused clocks (#63) | buyer may exit without penalty (#62); agent actions blocked | Withdraw/cancel (buyer) | BE | NEW DESIGN |
| SH-11 | WhatsApp demo CTA | Visitor, buyer | where shown | UX | CONTRADICTORY (C-9, C-10) | many candidates | Visual CTA only | non-functional | — | — | UPDATE — no real number, no real contact implied, no private data (#60, #66) |
| SH-12 | Mobile portal navigation | All signed-in | bottom nav + More menu | UX | MISSING | none (only compare/floor-plan bars) | Primary areas in bottom nav; secondary under More; breadcrumbs for deep flows (breadcrumbs exist in candidates) | — | Navigate | — | NEW DESIGN |

### B.9 Maps (Leaflet + MapTiler, #96)

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MAP-01 | Search map | Visitor, all | in PUB-02 | Maps | CONTRADICTORY (C-21) | `search.html` (CARTO) | Markers, draw area | tiles failed, no results in area | Pan, draw | BE | UPDATE — **code** uses MapTiler with a hard-coded key (`SearchMap.tsx`); must read `NEXT_PUBLIC_MAPTILER_KEY` |
| MAP-02 | Areas list map | Visitor | in PUB-04 | Maps | CONTRADICTORY (C-21) | `areas.html` (CARTO) | Area shapes | tiles failed | Select area | BE | UPDATE — **code** uses CARTO (`AreaRadarMap.tsx`) |
| MAP-03 | Area detail map | Visitor | in PUB-05 | Maps | CONTRADICTORY (C-21) | `area-detail.html` (CARTO) | Boundary, listings | tiles failed | Pan | BE | UPDATE — **code** uses CARTO (`AreaDetailMap.tsx`) |
| MAP-04 | Property location map | Visitor, all | in PUB-03 | Maps | CONTRADICTORY (C-21) | `property-detail.html` (CARTO) | Location | tiles failed | Pan | BE | UPDATE — no map in the current property page code |
| MAP-05 | Listing location input | AGENT | in AGT-04/05 | Maps / listings | MISSING | none (no map in `create-listing.html`) | — | area must resolve to a valid `Area` (P2) | — | BE | NEW DESIGN — whether a map picker is used is OPEN (PI-13) |

### B.10 Not needed in V1

| ID | Screen / Surface | Role | Route | Product Area | Design Status | Existing Candidate | Main Sections | Important States | Main Actions | Backend Dependency | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NN-01 | Arabic / RTL screens | — | none in V1 | Localisation | NOT NEEDED | `property-detail-ar.html`, `assistant/ar.html` (kept as future reference) | — | — | — | — | NOT NEEDED — **Future / Optional Feature after core project completion** |
| NN-02 | Admin account creation / promotion | — | — | Identity | NOT NEEDED | none (correct) | — | — | — | — | NOT NEEDED (#97: seed/CLI only) |
| NN-03 | Advanced admin analytics | — | — | Governance | NOT NEEDED | `admin/reports.html` content | — | — | — | — | NOT NEEDED (#28) |
| NN-04 | Out-of-scope features shown in candidates | — | — | — | NOT NEEDED | various | Escrow, off-plan/new launches/developer desks, deed certification, e-signature, saved cards, refund bank account, 2FA, Zoom briefings, SMS PIN, MLS, cart/"buy now" (none found) | — | — | — | NOT NEEDED (#1, #9, #13, #47, #53) |
| NN-05 | Internal-only decisions | — | — | — | NOT NEEDED | — | #95 lock, #63 clocks, #98 secrets, admin seed | — | — | — | NOT NEEDED (no screen) |
| NN-06 | Root redirect page | — | — | — | NOT NEEDED | `index.html` | — | — | — | — | NOT NEEDED |

---

## C. Missing design list (NEW DESIGN)

Verified against the candidates directory on 2026-09-17. No candidate contains subscription, plan,
quota, billing, checkout, holiday, portal-switcher (beyond an admin link), agent-application,
revocation, sale-confirmation or waiting-for-quota UI.

| Group | Items |
|---|---|
| Auth | AUTH-06 Google phone step |
| Buyer | BUY-08 deposit checkout · BUY-09 deposit result · BUY-10 buyer sale confirmation · BUY-11 withdrawal/refund confirmation |
| Agent application | APP-01 entry · APP-02 application · APP-03 status · APP-04 re-application · APP-05 verification status |
| Agent | AGT-03 listing details · AGT-06 listing history · AGT-07 agent sale confirmation · AGT-09 agent offer handling · AGT-14 public profile management |
| Subscription & quota | SUB-01 … SUB-12 (all) |
| Admin | ADM-01 dashboard · ADM-03 suspension/reinstatement · ADM-05 revocation/re-verification · ADM-06 reserved-listing review · ADM-07 sale-completion review · ADM-08 abuse reports · ADM-09 holiday list · ADM-10 phone reveal · ADM-11 conflict-of-interest state |
| Shared | SH-01 portal switcher · SH-05 payment status · SH-09 email-not-verified gate · SH-10 frozen state · SH-12 mobile portal navigation |
| Public / maps | PUB-11 report listing (blocked, §E.4) · MAP-05 listing location input |
| Surfaces with no candidate (merged into shared designs) | AGT-17 agent settings · ADM-13 admin notifications · ADM-14 admin settings |

## D. Contradictory / outdated design list

Contradiction ids are from `04-frontend-design-plan.md` §3. None is silently treated as valid.

| Candidate | Status | Contradictions | Decisions |
|---|---|---|---|
| Admin sidebar (all `admin/*`) | CONTRADICTORY | "Agent Desk" (C-1) | #97 |
| `admin/moderation` | CONTRADICTORY | "Approve & Publish", "Batch Approve" (C-2); deed certification (C-3) | #87, #94, #1 |
| `admin/reports` | CONTRADICTORY | Analytics instead of abuse reports (C-17) | #28 |
| `admin/agent-verification` | PARTIAL | Registry sync / automated ID hash; no selfie (C-18) | #55, #56 |
| `admin/audit-log` | PARTIAL | Cryptographic-ledger claims | #28, #42 |
| `agent-dashboard/create-listing` | CONTRADICTORY | Immediate publication (C-4); developer/off-plan (C-5) | P2/P3, #94, #47 |
| `agent-dashboard/edit-listing` | CONTRADICTORY | Agent marks Reserved; agent-only Sold (C-6) | P8, #77 |
| `agent-dashboard/listings` | CONTRADICTORY | Missing lifecycle states (C-7); "In Escrow" | #78, #81, #94, #1 |
| `agent-dashboard/leads` | CONTRADICTORY | Wrong stages, "In Escrow", manual lead (C-8); buyer WhatsApp (C-10) | #75, #83, #66, #72 |
| `agent-dashboard/messages`, `notifications` | PARTIAL | SMS PIN, MLS (C-19); "in Escrow" | #53, #1 |
| `agent-dashboard/overview` | PARTIAL | WhatsApp, virtual-tour prep, "Dispatch SPA" | #60; undecided features |
| `buyer-dashboard/offers` | CONTRADICTORY | Escrow, 2% deposit before acceptance (C-11); developer counter-proposal (C-5) | #13, #76, #47 |
| `buyer-dashboard/documents` | CONTRADICTORY | Digital signature (C-13) | #1 |
| `buyer-dashboard/settings` | CONTRADICTORY | Saved payment cards, refund bank account/IBAN (C-14); 2FA (C-15) | #13, #90, #9 |
| `buyer-dashboard/overview`, `viewings` | PARTIAL | Advisor WhatsApp / "Call Broker" (C-9); escrow wording | #60, #66 |
| `auth/register`, `auth/login` | CONTRADICTORY | Role tabs (C-16); "Enterprise SSO" (undecided) | #49, #97 |
| `public/property-detail` | CONTRADICTORY | Escrow offer (C-11), developer plan (C-5), deed "certified" (C-3), phone/WhatsApp (C-9), CARTO (C-21) | #1, #47, #60, #96 |
| `public/agents`, `public/agent-profile` | CONTRADICTORY | Contact exposure (C-9), Zoom (C-12), luxury framing (C-20), developer allocations (C-5) | #60, #45, #47 |
| `public/index`, `search`, `areas`, `area-detail` | PARTIAL | Luxury framing (C-20), off-plan (C-5), CARTO (C-21) | #45, #47, #96 |
| `public/market-insights` | OUTDATED | Luxury framing, off-plan content, fabricated figures | #45, #47, A4 |
| Buyer and agent sidebars | PARTIAL | No portal switcher (C-22) | #97 |
| `public/property-detail-ar`, `assistant/ar` | NOT NEEDED (V1) | Out of V1 (English-only) | §0 |

---

## E. Route architecture

### E.1 Intended conceptual structure (V1, English only)

```text
PUBLIC     /  /search  /properties/[slug]  /areas  /areas/[slug]
           /agents  /agents/[id]†  /compare  /market-insights†  /assistant (later phase)
AUTH       /register  /login  /verify-email  /forgot-password  + Google phone step (route TBD)

/buyer                     dashboard
/buyer/favourites
/buyer/saved-searches
/buyer/viewings            (details in a drawer)
/buyer/offers
/buyer/offers/[id]†        offer details · deposit · withdrawal · sale confirmation
/buyer/documents†
/buyer/messages
/buyer/notifications
/buyer/settings            (includes "Become an agent")
  agent application†       route TBD under /buyer

/agent                     dashboard (plan + quota)
/agent/listings            (incl. Waiting for Quota section)
/agent/listings/new
/agent/listings/[id]†      details · history · sale confirmation · lifecycle actions
/agent/listings/[id]/edit†
/agent/leads               (details in a drawer)
/agent/calendar
/agent/analytics†
/agent/subscription        plans · current subscription · receipts
/agent/messages
/agent/notifications
/agent/settings

/admin                     dashboard
/admin/moderation
/admin/verification        (incl. revocation / re-verification)
/admin/sales               sale-completion review
/admin/reports             abuse reports
/admin/holiday-list
/admin/audit-log
/admin/notifications
/admin/settings
  reserved-listing review†  route TBD

Paymob return pages† (deposit, subscription)  route TBD
```

### E.2 Conflicting prefixes and route names found in the project (planning issues, not fixed)

| # | Where | What it says | Conflict |
|---|---|---|---|
| PI-1 | `architecture/FRONTEND.md` §2 | Was **`/dashboard/*`** | **Resolved in documentation by #100** |
| PI-1 | `frontend/src/app/(auth)/login`, `register`, `verify-email` | Redirect to **`/buyer-dashboard/overview`** and **`/agent-dashboard/overview`** | No such routes; contradicts #100. **Implementation follow-up** |
| PI-1 | `components/layout/Navbar.tsx` | `/buyer/overview`, `/agent/overview`, `/admin/verification` | Uses `…/overview` where the baseline uses `/buyer` and `/agent` as the dashboard |
| PI-1 | `frontend/src/middleware.ts` | Protects `/buyer`, `/agent`, `/admin`; **redirects AGENT away from `/buyer/*`** | Prefixes match; the redirect contradicts #97 |
| PI-2 | `DECISIONS.md` #39 §8, `FRONTEND.md` §4–§6, V25/V26 | Were `/[locale]` routes, full `/en` + `/ar`, RTL first-class | **Resolved by #99** (English only end to end: UI, content, search, AI); V25–V27 deferred |
| PI-4 | `FRONTEND.md` §2 | `/insights`, `/agents/[slug]`, `/map` | Code uses `/market-insights`, `/agents/[id]`, and the map inside `/search` |
| — | Implemented portal pages | None exist under `/buyer`, `/agent`, `/admin` | Nothing to migrate; only redirects and links are wrong |

### E.3 Routes not in the confirmed baseline (†)

`/agents/[id]`, `/market-insights`, `/buyer/offers/[id]`, `/buyer/documents`, the agent application
route, `/agent/listings/[id]`, `/agent/listings/[id]/edit`, `/agent/analytics`, the reserved-listing
review route, the Google phone step route and the Paymob return routes. Each needs confirmation
before implementation.

### E.4 Open points that block or limit design

| # | Open point | Blocks |
|---|---|---|
| PI-5 (= P7, **resolved by #102**) | `BUSINESS_RULES.md` listed **P11** (agent marks `PUBLISHED → SOLD` for an offline sale) and **O13** (agent alone completes a reserved offer). #77 and the product owner's rule say an agent cannot mark SOLD alone | **Resolved by #102:** no agent-only SOLD action anywhere. P11 is removed and O13 needs both confirmations. Open under #102: confirmation before cooling-off ends; properties sold entirely off-platform |
| PI-8 | Where the agent handles offers (listing details, leads, or its own page) | AGT-09 |
| PI-9 | Mapping of 4 display states (pending/success/failed/cancelled) to Payment (7 states) and PaymentAttempt (6 states), including `EXPIRED` and refunds; **subscription payment states are not documented** (#79: do not assume from the deposit) | SH-05, BUY-09, SUB-03 |
| PI-10 | Abuse-report submission: who may report, reasons, outcomes | PUB-11, ADM-08 |
| PI-11 | One settings design served at three portal routes, or one shared route | SH-04 |
| PI-12 | Listing history source (`PropertyStatusHistory` was rejected in #39; #81 leaves new-record vs same-record TBD) | AGT-06 |
| PI-13 | How listing location is captured (map picker or address + area) | MAP-05, AGT-04 |
| PI-14 | Subscription: prices and FX settled (#89, #103); Paymob acceptance of the EGP amounts (V37); period rules settled (#104, incl. early renewal and 720-hour periods); data model and checkout lifetime (60 min) settled (#105) | SUB-01, SUB-02, SUB-04, SUB-08 |
| PI-15 | Where admins suspend/reinstate a published listing | ADM-03 |
| PI-16 | Contents of the essential admin dashboard (#28) | ADM-01 |
| — | Existing open gaps: D4 (currency toggle), A4 (fabricated figures), C6 (area grouping), B3 (verify link vs code), #57 re-application cooldown, #82 extension limits | PUB-08, PUB-04/05/09, AGT-13, AUTH-03, APP-04, ADM-07 |
| — | Features in candidates **never decided**: 3D virtual tour, gate passes/QR, iCal sync, VIP/emergency tours, manual lead creation, NDA/representation requests, SPA drafting, "request rectification", buyer KYC tiers, saved-search pause/forward, Enterprise SSO | Excluded from design until decided |

---

## F. Design dependencies

| Dependency | Screens / surfaces |
|---|---|
| **None (—)** | BUY-00, AGT-00, ADM-00, SH-01, SH-06, SH-07, SH-08, SH-11, SH-12, NN-* |
| **Backend/API only (BE)** | PUB-01…PUB-11, AUTH-01…AUTH-06, BUY-01, BUY-02, BUY-05, BUY-06, BUY-13, BUY-15, APP-01, AGT-01…AGT-08, AGT-10, AGT-11, AGT-13, AGT-14, AGT-15, AGT-17, SUB-01, SUB-06, SUB-07, SUB-09, SUB-10, SUB-11, ADM-01, ADM-02, ADM-08, ADM-09, ADM-10, ADM-11, ADM-12, ADM-14, SH-03, SH-04, SH-09, SH-10, MAP-01…MAP-05 |
| **Backend + notifications** | BUY-03, BUY-04, BUY-07, BUY-10, APP-03, APP-05, AGT-07, AGT-09, AGT-12, SUB-08, ADM-02, ADM-05 |
| **Notifications only** | BUY-14, AGT-16, ADM-13, SH-02, SUB-12 |
| **Paymob (with backend)** | BUY-08, BUY-09, BUY-11, SUB-02, SUB-03, SUB-04, SUB-05, SH-05 (pattern), ADM-03, ADM-06, ADM-07 (refunds) |
| **Private file storage** | APP-02, APP-04, ADM-04, BUY-12 |

Rows with several dependencies appear under the most demanding one, except that **private storage**
rows also need BE. Full per-row dependencies are in the Backend Dependency column of §B.

---

## G. Design order (V1)

| Step | Contents | Depends on |
|---|---|---|
| **1. Foundation / shells / navigation** | Design-system approval into `DESIGN_SYSTEM.md`; terminology clean-up (C-5, C-11, C-20); BUY-00, AGT-00, ADM-00; SH-01 portal switcher; SH-12 mobile navigation; SH-08 header/footer; route decisions recorded (#99, #100) | Design authority (#30) |
| **2. Public + auth corrections** | PUB-01…PUB-10; MAP-01…MAP-04 (MapTiler); SH-11; AUTH-01…AUTH-06; SH-09 | Step 1 |
| **3. Buyer core flows** | BUY-01…BUY-12 (viewings, offers, deposit checkout/result, withdrawal, buyer sale confirmation, documents); SH-05 payment status; SH-06 confirmation; SH-10 frozen state | Steps 1–2; PI-9 for SH-05 |
| **4. Agent application** | APP-01…APP-05; ADM-04 verification side (National ID + selfie) | Step 1; SH-04 entry point |
| **5. Agent listing lifecycle** | AGT-01…AGT-14; MAP-05 | Step 4 (only verified agents reach it); PI-5, PI-8, PI-12, PI-13 |
| **6. Subscription + quota** | SUB-01…SUB-12 | Step 5 (listing states); SH-05 (step 3); PI-9, PI-14 |
| **7. Admin workflows** | ADM-01…ADM-12 | Steps 3–6 (states admins act on); ADM-11 conflict state; PI-10, PI-15, PI-16 |
| **8. Shared states & notifications** | SH-02 (all notification types), SH-03, SH-04, SH-07 final pass | Can start with step 1; types grow with steps 3–7 |

**Arabic / RTL:** Future / Optional Feature after core project completion.

---

## H. Verification (2026-09-17)

| Check | Result |
|---|---|
| Every frontend-relevant confirmed decision maps to a surface or is NOT NEEDED | ✔ #1, #9, #13, #28, #45, #47, #49–#51, #53–#97 mapped in §B; internal-only decisions in NN-05 |
| No screen invented without being marked NEW DESIGN | ✔ every surface without a candidate is MISSING / NEW DESIGN (§C) |
| No outdated or contradictory mockup treated as valid | ✔ §D; EXISTS is used only for password reset, saved searches (with undecided extras excluded) and the AI assistant |
| English-only V1 | ✔ no `/ar` routes; NN-01; recorded as **#99** |
| `/buyer/*`, `/agent/*`, `/admin/*` | ✔ §E.1; recorded as **#100**; code mismatches listed in §E.2 |
| Admin: Buyer + Admin, no Agent portal | ✔ ADM-00, SH-01 |
| Agent: Buyer + Agent | ✔ AGT-00, SH-01 |
| USER: no switcher | ✔ SH-01 |
| Free 2 / Pro 4 / Enterprise 8; prices $0 / $20 / $50 USD (#89) | ✔ §B.6 |
| Waiting-for-quota flow (agent + admin) | ✔ SUB-09…SUB-12, AGT-02, AGT-03, AGT-05, ADM-02 |
| Leaflet + MapTiler | ✔ §B.9; CARTO and the hard-coded key are recorded, not fixed |
| No public agent phone | ✔ PUB-03, PUB-06, PUB-07, BUY-01, BUY-04, SH-11 |
| WhatsApp only as a non-functional demo CTA | ✔ SH-11 |
| No application/frontend code modified | ✔ documentation only |
| No design candidate modified | ✔ `docs/design/candidates/` untouched |
