# Settly — Global UI Reconciliation Master Plan (Complete Screen Inventory & Audit)

    Status:       VERIFIED COMPLETE MASTER PLAN · 48 Reference Files Inspected · Zero Backend Changes
    Last Updated: 2026-09-24
    Governing:    docs/process/AI_WORKFLOW.md, docs/design/candidates/settly-landing/, docs/DECISIONS.md
    Core Rule:    Current Settly Logic + Real Backend Data + Reference-Level UI Richness
    Constraint:   100% Zero Backend / Schema / API Changes · Purely Presentational Enrichment · Zero Fabricated Facts

---

## 1. Master Formula & Architectural Invariants

$$\mathbf{Current\ Settly\ Business\ Logic} + \mathbf{Real\ Available\ API\ Data} + \mathbf{Reference\text{-}Level\ UI\ Richness\ \&\ Design}$$

### Non-Negotiable Directives:
1. **Zero Backend / API / Database Changes:**
   The backend modular monolith (`backend/src/modules/`), Prisma schema (`schema.prisma`), migrations, Express 5 routes, service boundaries, and OpenAPI contracts (`openapi.json`) remain **100% untouched**. No new backend endpoints, schema columns, or database queries are introduced.
2. **Data Honesty Mandate (No Fabricated Property Facts):**
   We restore the complete reference section, component structure, layout, interactions, density, and visual treatment. However, **the UI must represent real data honestly rather than pretending fake data is real**:
   - **Floorplans:** The tabbed architectural floorplan section component is restored from the reference with full layout, tabs, room breakdown styling, and download trigger. However, if the property does not have floorplan images or architectural blueprints attached, the component renders an honest empty / on-request state ("Architectural floorplans for this property have not been uploaded by the agent. You may request the official dossier or schedule a physical viewing to inspect the layout.") OR if floorplan documents exist in `Document`, it renders them. It never invents fake room dimensions (e.g. "Grand Reception 96.8 m²") for a real property listing that doesn't have that data.
   - **Commute Telemetry:** The commute telemetry matrix is restored from the reference. Do not claim real "drive times" or "open road network telemetry" unless an actual routing/road-network source is being used. Coordinates alone should not be presented as real driving-time telemetry. Commute times must be presented honestly as estimated/indicative estimates based on property coordinates/distance heuristics to prominent Cairo waypoints (AUC New Cairo, Cairo International Airport, Ring Road, Capital Business Park) with explicit labeling: *"Indicative estimated commute based on property coordinates (not live driving telemetry)"*.
   - **Financial Architecture & Scenario Simulations:** The financial card is restored with its progress track, down payment slider, and installment milestone table. The slider operates strictly on the **real listing price** (`price` / 100 in EGP) to calculate down payments (e.g. 10%, 20%, 30%) and projected quarterly installments. All financial calculations must be kept **strictly and explicitly labeled as hypothetical scenario simulations**. They must never imply that the calculated installments are actual seller or developer payment terms unless those specific payment terms exist in the real listing data.
   - **Dimensions & Specs:** 6-metric grid shows the real BUA (`areaSqm`), Bedrooms, Bathrooms, Property Type, Compound, and Area from the DB. Fields not in DB (like EV parking count or land area for an apartment) are conditionally hidden or marked "N/A" rather than inventing fake data.
   - **Amenities:** Only real amenities attached to the property via `property.amenities` are displayed, categorized by Interior / Exterior / Community, using the reference's badge and icon layout.
3. **Adaptation Over Elimination ("No Contradiction Panic"):**
   If a reference component contains an element conflicting with current locked business rules (e.g. prohibited broker WhatsApp link, direct phone number, or escrow terminology), **remove or adapt ONLY that specific element**. The surrounding card, container, or layout composition is strictly preserved.
4. **Reference HTML/CSS as Primary Visual Target:**
   Layout structure, typography scales (`Spectral` serif headlines, `Plus Jakarta Sans` body, `JetBrains Mono` values/dates), spacing, card hierarchies, table densities, hover states, and micro-interactions from `docs/design/candidates/settly-landing/` are followed faithfully.

---

## 2. Complete Filesystem Verification & Inventory

Every file inside `docs/design/candidates/settly-landing/` was verified against the filesystem. There are **48 total files** across 7 groups (including root):
- **39 Reference HTML Screens** (36 English screens + 2 Arabic out-of-scope screens + 1 splash redirect)
- **9 Reference Supporting Assets & Documentation** (CSS stylesheets, widget JS, DESIGN.md specs)

### Verified Filesystem Census

| Group Directory | HTML Screens | Supporting Assets (CSS/JS/MD) | Total Files | Directory Purpose |
|---|---|---|---|---|
| **Root** | 1 (`index.html`) | 3 (`DESIGN.md`, `master-nav-footer.css`, `style.css`) | **4** | Root splash and candidate global design tokens |
| **`shared/`** | 0 | 6 (`dashboard-topbar.css`, `DESIGN.md`, `master-nav-footer.css`, `settly-assistant-widget.css`, `settly-assistant-widget.js`, `style.css`) | **6** | Shared topbars, footers, widget assets, and CSS library |
| **`auth/`** | 4 (`login.html`, `register.html`, `verify-email.html`, `forgot-password.html`) | 0 | **4** | Identity & authentication screens |
| **`public/`** | 10 (`index.html`, `search.html`, `property-detail.html`, `property-detail-ar.html`, `areas.html`, `area-detail.html`, `agents.html`, `agent-profile.html`, `compare.html`, `market-insights.html`) | 0 | **10** | Public discovery storefront, search catalog, and property detail |
| **`buyer-dashboard/`** | 9 (`overview.html`, `viewings.html`, `offers.html`, `favorites.html`, `saved-searches.html`, `documents.html`, `messages.html`, `notifications.html`, `settings.html`) | 0 | **9** | Buyer portal management suite |
| **`agent-dashboard/`** | 9 (`overview.html`, `listings.html`, `create-listing.html`, `edit-listing.html`, `leads.html`, `calendar.html`, `analytics.html`, `messages.html`, `notifications.html`) | 0 | **9** | Agent portal commercial cockpit |
| **`admin/`** | 4 (`moderation.html`, `agent-verification.html`, `audit-log.html`, `reports.html`) | 0 | **4** | Admin portal governance suite |
| **`assistant/`** | 2 (`index.html`, `ar.html`) | 0 | **2** | Full-page AI advisory concierge (deferred per #48) |
| **TOTALS** | **39 Screens** | **9 Assets** | **48 Files** | Verified complete reference corpus |

---

## 3. Explicit Screen-by-Screen Mapping Across All Groups

### Group 0: Global Layout & Shared Shell Components
*Reference Files:* `shared/dashboard-topbar.css`, `shared/master-nav-footer.css`, `shared/style.css`, `settly-assistant-widget.css`, `settly-assistant-widget.js`, `DESIGN.md` (root & shared copies)  
*Implemented Components:* [Navbar.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/components/layout/Navbar.tsx), [Footer.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/components/layout/Footer.tsx), [PortalShell.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/components/portal/PortalShell.tsx), [portal.css](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/styles/settly/portal.css), [globals.css](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/globals.css)

| Reference Screen / File | Implemented Route / Component | Status | Cat | Reconciliation Action |
|---|---|---|---|---|
| `shared/master-nav-footer.css` (Nav Header) | `components/layout/Navbar.tsx` | Implemented (Basic) | **Cat 3** | Enrich navbar: restore sticky 74px bar, center search console with `↵` kbd trigger, and white logo backing plate. |
| `shared/master-nav-footer.css` (Footer) | `components/layout/Footer.tsx` | Implemented (Basic) | **Cat 2** | Restore 4-column broadsheet editorial footer with district guides, legal trust disclosure, and Egyptian regulatory notices. |
| `shared/dashboard-topbar.css` (Portal Topbar) | `components/portal/PortalShell.tsx` | Implemented (Basic) | **Cat 3** | Enrich topbar: restore 72px bar, monospaced breadcrumb (`BUYER PORTAL / ACTIVE OFFERS`), Cairo clock with pulsing dot, trust badge, and notification bell. |
| `shared/style.css` (Sidebar Navigation) | `components/portal/PortalShell.tsx` | Implemented (Basic) | **Cat 3** | Enrich sidebar: restore 288px fixed bar, active brass indicators, section headers, capacity badges, and responsive collapse. |
| `shared/style.css` (Portal Switcher `SH-01`) | `components/portal/PortalShell.tsx` | Implemented (Basic) | **Cat 3** | Enrich switcher styling with persona badges: USER: none; AGENT: Buyer↔Agent; ADMIN: Buyer↔Admin (#97). |
| `shared/style.css` (Mobile Nav `SH-12`) | `components/portal/PortalShell.tsx` | Implemented (Basic) | **Cat 2** | Restore mobile bottom navigation bar and drawer with quick portal switching. |
| `shared/settly-assistant-widget.*` | Hidden from layout | Omitted | **Cat 1** | Omit floating public AI widget per Decision #48 and project instructions. |
| Root `index.html` | Next.js root route `/` | Merged into `app/(public)/page.tsx` | **Cat 3** | Root redirect is handled natively by Next.js routing. |

---

### Group 1: Authentication & Identity (`auth/`)
*Reference Files:* `auth/login.html`, `auth/register.html`, `auth/verify-email.html`, `auth/forgot-password.html`  
*Implemented Components:* [login/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(auth)/login/page.tsx), [register/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(auth)/register/page.tsx), [verify-email/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(auth)/verify-email/page.tsx), [forgot-password/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(auth)/forgot-password/page.tsx), [complete-profile/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(auth)/complete-profile/page.tsx), [AuthFrame.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(auth)/_components/AuthFrame.tsx)

| Reference Screen / File | Implemented Route / Component | Status | Cat | Reconciliation Action |
|---|---|---|---|---|
| `auth/login.html` | `/login` (`app/(auth)/login/page.tsx`) | **Reconciled & Verified** | **Cat 1 & 3** | **Cat 1:** Removed role selector tabs (login is unified; role resolved by server per #97); replaced escrow text with verified reservation deposits.<br>**Cat 3:** Restored exact reference inputs with inset brass focus rings, typography, quick-fill demo bar, and divider. |
| `auth/register.html` | `/register` (`app/(auth)/register/page.tsx`) | **Reconciled & Verified** | **Cat 1 & 2** | **Cat 1:** Removed role tabs and advisor fields (all signups are USER per #49; agent onboarding handled via `APP-01` to `APP-05`); replaced escrow text with verified reservation deposits.<br>**Cat 2:** Restored 4-segment real-time password strength meter (Argon2id) and international phone flag selector. |
| `auth/verify-email.html` | `/verify-email` (`app/(auth)/verify-email/page.tsx`) | **Reconciled & Verified** | **Cat 3** | Enriched to match reference visual hierarchy, typography, and 60s resend cooldown clock. |
| `auth/forgot-password.html` | `/forgot-password` (`app/(auth)/forgot-password/page.tsx`) | **Reconciled & Verified** | **Cat 3** | Enriched with reference split-screen framing, two-step token reset, and bone canvas card styling. |
| *No Reference* (`AUTH-06`) | `/complete-profile` (`app/(auth)/complete-profile/page.tsx`) | **Reconciled & Verified** | **Cat 4** | Maintained custom onboarding screen requiring international phone collection (#60), styled with Navy & Brass tokens. |

---

### Group 2: Public Discovery & Properties (`public/`)
*Reference Files:* `public/index.html`, `public/search.html`, `public/property-detail.html`, `public/property-detail-ar.html`, `public/areas.html`, `public/area-detail.html`, `public/agents.html`, `public/agent-profile.html`, `public/compare.html`, `public/market-insights.html`  
*Implemented Components:* [page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/page.tsx), [search/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/search/page.tsx), [PropertyDetailClient.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/properties/[slug]/PropertyDetailClient.tsx), [SearchWorkspace.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/components/search/SearchWorkspace.tsx), [DiscoveryBar.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/components/search/DiscoveryBar.tsx), [areas/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/areas/page.tsx), [agents/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/agents/page.tsx), [compare/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/compare/page.tsx), [market-insights/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(public)/market-insights/page.tsx)

| Reference Screen / File | Implemented Route / Component | Status | Cat | Reconciliation Action |
|---|---|---|---|---|
| `public/property-detail.html` | `/properties/[slug]` (`PropertyDetailClient.tsx`) | Implemented (Simplified MVP) | **Cat 1, 2 & 3** | **Cat 1:** Omit escrow, deed notarization claims, off-plan developer plans, and broker phone/WhatsApp (#1, #47, #60).<br>**Cat 2:** Restore CAD floorplan section shell (rendering uploaded blueprints if present, or honest on-request state if absent); restore 4-card commute matrix (clearly labeled as indicative estimated commute times based on property coordinates, never claiming live road telemetry without routing engine); restore financial scenario simulator (derived from real price, explicitly labeled as hypothetical simulation, never implying developer terms); restore sub-header action cluster ("Compare", "Share", "PDF").<br>**Cat 3:** Upgrade gallery to asymmetric hover-zoom layout; upgrade 6-metric grid to high-density JetBrains Mono typography; embed inline viewing schedule picker into sticky action console. |
| `public/search.html` | `/search` (`SearchWorkspace.tsx`, `DiscoveryBar.tsx`) | Implemented (Basic cards) | **Cat 1, 2 & 3** | **Cat 1:** Omit CARTO tiles (use MapTiler #96); omit off-plan payment chips (#47); omit hyper-luxury price presets (#45).<br>**Cat 2:** Restore faceted filter count badges; restore dismissible active filter pill bar.<br>**Cat 3:** Enrich property cards with EGP/m² dark badge overlay, finishing status pills, land vs BUA chips, and map pin hover synchronization. |
| `public/index.html` | `/` (`app/(public)/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich landing layout to match reference composition, typography, and card treatments; omit "New Launches" off-plan blocks (#47). |
| `public/areas.html` | `/areas` (`app/(public)/areas/page.tsx`) | Implemented (Basic) | **Cat 3** | Align cards and map framing with reference; omit fabricated macroeconomic statistics (#28). |
| `public/area-detail.html` | `/areas/[slug]` (`app/(public)/areas/[slug]/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich area detail header, map integration, and listings list. |
| `public/agents.html` | `/agents` (`app/(public)/agents/page.tsx`) | Implemented (Basic) | **Cat 1 & 3** | **Cat 1:** Omit direct telephone, WhatsApp, and Zoom links (#60).<br>**Cat 3:** Enrich agent cards with syndicate badges and active mandate carousels. |
| `public/agent-profile.html` | `/agents/[id]` | **Missing Implementation** | **Cat 2** | Restore agent public profile screen showing verified agent bio, licensing information, and active listings (no phone/WhatsApp per #60). |
| `public/compare.html` | `/compare` (`app/(public)/compare/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich comparison table with sticky header and delta highlights. |
| `public/market-insights.html` | `/market-insights` (`app/(public)/market-insights/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich trends layout; display real database averages rather than fabricated market figures. |
| `public/property-detail-ar.html` | None (Arabic/RTL) | **Reference-Only / Out of V1** | **Cat 1** | Omit from V1 per Decision #99 (English-only V1; Arabic is a future feature). |

---

### Group 3: Buyer Portal (`buyer-dashboard/`)
*Reference Files:* `buyer-dashboard/overview.html`, `viewings.html`, `offers.html`, `favorites.html`, `saved-searches.html`, `documents.html`, `messages.html`, `notifications.html`, `settings.html`  
*Implemented Components:* [buyer/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/page.tsx), [viewings/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/viewings/page.tsx), [offers/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/offers/page.tsx), [saved/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/saved/page.tsx), [messages/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/messages/page.tsx), [notifications/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/notifications/page.tsx), [settings/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/buyer/settings/page.tsx)

| Reference Screen / File | Implemented Route / Component | Status | Cat | Reconciliation Action |
|---|---|---|---|---|
| `buyer-dashboard/overview.html` | `/buyer` (`app/(portal)/buyer/page.tsx`) | Implemented (Simplified) | **Cat 1, 2 & 3** | **Cat 1:** Omit "Chat on WhatsApp" advisor buttons (#60) and escrow terms (#13).<br>**Cat 2:** Restore 6-step visual conveyancing stepper (`Offer Made → Counter → Accepted → Deposit → Reserved → Closing`); restore 72-hour deposit countdown alert banner; restore compound gate pass & calendar export card; restore 5-dot offer capacity meter; restore saved residences spotlight.<br>**Cat 3:** Upgrade dashboard to executive command center layout. |
| `buyer-dashboard/viewings.html` | `/buyer/viewings` (`app/(portal)/buyer/viewings/page.tsx`) | Implemented (Basic list) | **Cat 1, 2 & 3** | **Cat 1:** Remove "Call Broker" telephone triggers (#60).<br>**Cat 2:** Restore gate pass code box, meeting instructions, and .ics export.<br>**Cat 3:** Upgrade viewing cards to 3-column layout with status badges and action drawer. |
| `buyer-dashboard/offers.html` | `/buyer/offers` (`app/(portal)/buyer/offers/page.tsx`) | Implemented (Has drawer) | **Cat 1, 2 & 3** | **Cat 1:** Replace 2% escrow wording with 5% Paymob reservation deposit (#13, #76).<br>**Cat 2:** Restore full 3-column negotiation card with visual revision diff and live 72h countdown timer.<br>**Cat 3:** Enrich offer list and drawer with complete transaction stepper. |
| `buyer-dashboard/favorites.html` | `/buyer/saved` (`app/(portal)/buyer/saved/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich saved property cards to match reference layout and density. |
| `buyer-dashboard/saved-searches.html` | `/buyer/saved` (tab or section) | Implemented (Basic) | **Cat 3** | Enrich saved searches with frequency pills and instant execution triggers. |
| `buyer-dashboard/documents.html` | `/buyer/documents` | **Missing Implementation** | **Cat 2** | Restore transaction document dossier screen (property title documents, contracts, deposit receipts) with access scopes (#39). |
| `buyer-dashboard/messages.html` | `/buyer/messages` (`app/(portal)/buyer/messages/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich chat interface with property context header and real-time status. |
| `buyer-dashboard/notifications.html` | `/buyer/notifications` (`app/(portal)/buyer/notifications/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich notification feed with category badges and quick-action buttons. |
| `buyer-dashboard/settings.html` | `/buyer/settings` (`app/(portal)/buyer/settings/page.tsx`) | Implemented (Basic) | **Cat 1 & 3** | **Cat 1:** Omit saved cards, 2FA, and refund bank accounts (#13, #90).<br>**Cat 3:** Enrich profile layout and phone verification badge. |
| *No Reference* (`BUY-08`, `BUY-09`) | `/buyer/offers/[id]/deposit` & `/callback` | Implemented (Custom) | **Cat 4** | Maintain Paymob hosted checkout flow, 15-minute hold timer, and polling telemetry return screen (`SH-05`) adhering to Navy & Brass tokens. |
| *No Reference* (`BUY-10`) | Mounted in offer details drawer | Implemented (Custom) | **Cat 4** | Maintain dual confirmation stepper and 30-day conveyance timeline (#77, #82). |
| *No Reference* (`BUY-11`) | Modal in offer details drawer | Implemented (Custom) | **Cat 4** | Maintain 48-hour 100% refund withdrawal dialog (#84) with clear consequence breakdown. |

---

### Group 4: Agent Portal & Subscription (`agent-dashboard/`)
*Reference Files:* `agent-dashboard/overview.html`, `listings.html`, `create-listing.html`, `edit-listing.html`, `leads.html`, `calendar.html`, `analytics.html`, `messages.html`, `notifications.html`  
*Implemented Components:* [agent/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/page.tsx), [listings/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/listings/page.tsx), [calendar/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/calendar/page.tsx), [offers/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/offers/page.tsx), [messages/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/messages/page.tsx), [notifications/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/notifications/page.tsx), [settings/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/agent/settings/page.tsx)

| Reference Screen / File | Implemented Route / Component | Status | Cat | Reconciliation Action |
|---|---|---|---|---|
| `agent-dashboard/overview.html` | `/agent` (`app/(portal)/agent/page.tsx`) | Implemented (Simplified) | **Cat 1, 2 & 3** | **Cat 1:** Omit WhatsApp buttons, "Dispatch SPA", and unilateral "Mark Sold" (#60, #102).<br>**Cat 2:** Restore Active Negotiation Pipeline Table; restore Upcoming Viewing Timeline Tiles; restore Compliance Action Desk checklist.<br>**Cat 3:** Upgrade dashboard to full commercial command cockpit. |
| `agent-dashboard/listings.html` | `/agent/listings` (`app/(portal)/agent/listings/page.tsx`) | Implemented (Basic) | **Cat 1, 2 & 3** | **Cat 1:** Remove "In Escrow" tab; omit immediate publish (#94).<br>**Cat 2:** Restore full 9-state tabbed inventory including **Waiting for Quota FIFO section** (#87, #94); restore archive-with-reason modal.<br>**Cat 3:** Upgrade table to reference layout with micro-metrics. |
| `agent-dashboard/create-listing.html` | `/agent/listings/new` | Implemented (Basic) | **Cat 1, 2 & 3** | **Cat 1:** Omit off-plan developer fields; save draft or submit for review only (no agent direct publish per P2/P3).<br>**Cat 2:** Restore quota-exhausted warning banner (`SUB-10`).<br>**Cat 3:** Enrich form sections with high-density architectural spec fields. |
| `agent-dashboard/edit-listing.html` | `/agent/listings/[id]/edit` | Implemented (Basic) | **Cat 1 & 3** | **Cat 1:** Omit "Mark Reserved" (system only) and unilateral "Mark Sold" (#77).<br>**Cat 3:** Enrich price history and re-review consequence warnings. |
| `agent-dashboard/calendar.html` | `/agent/calendar` (`app/(portal)/agent/calendar/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich calendar view with timeline tiles and gate pass verification status. |
| `agent-dashboard/leads.html` | `/agent/leads` | **Missing Implementation** | **Cat 1 & 2** | **Cat 1:** Omit buyer WhatsApp buttons and manual lead creation (leads created on contact per #75).<br>**Cat 2:** Restore 5-stage pipeline board (`NEW`, `CONTACTED`, `QUALIFIED`, `WON`, `LOST`) and interaction history drawer. |
| `agent-dashboard/analytics.html` | `/agent/analytics` | **Missing Implementation** | **Cat 2** | Restore listing analytics dashboard (views, inquiries, viewing completion rate) using real database events (#28). |
| `agent-dashboard/messages.html` | `/agent/messages` (`app/(portal)/agent/messages/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich chat interface with property context header and real-time status. |
| `agent-dashboard/notifications.html` | `/agent/notifications` (`app/(portal)/agent/notifications/page.tsx`) | Implemented (Basic) | **Cat 3** | Enrich notification feed with category badges and quick-action buttons. |
| *No Reference* (`SUB-01` to `SUB-12`) | `/agent/subscription` | Partial (quota bar only) | **Cat 4** | Build dedicated Subscription & Quota Cockpit: 3 plans (Free $0 / Pro $20 / Enterprise $50 per #89), fixed EGP charging (48.98 per #103), Cairo calendar month quota meter, manual 30-day renewal controls (#104), and waiting-for-quota FIFO queue indicators. |
| *No Reference* (`APP-01` to `APP-05`) | `/buyer/become-agent` or setting | Seeded agents currently | **Cat 4** | Build Agent KYC Application flow: National ID + live selfie upload (#56) and syndicate registration verification. |

---

### Group 5: Admin Governance Portal (`admin/`)
*Reference Files:* `admin/moderation.html`, `admin/agent-verification.html`, `admin/audit-log.html`, `admin/reports.html`  
*Implemented Components:* [admin/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/admin/page.tsx), [moderation/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/admin/moderation/page.tsx), [verification/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/admin/verification/page.tsx), [sales/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/admin/sales/page.tsx), [notifications/page.tsx](file:///c:/Users/Mohand/Documents/GitHub/Settly/frontend/src/app/(portal)/admin/notifications/page.tsx)

| Reference Screen / File | Implemented Route / Component | Status | Cat | Reconciliation Action |
|---|---|---|---|---|
| `admin/moderation.html` | `/admin/moderation` (`app/(portal)/admin/moderation/page.tsx`) | Implemented (Basic) | **Cat 1, 2 & 3** | **Cat 1:** Omit "Batch Approve & Publish" (#94) and deed notarization claims (#1).<br>**Cat 2:** Restore split-screen dossier layout with side-by-side contract review and reason-code rejection.<br>**Cat 3:** Enrich queue table with reference density, thumbnail sizing, and status pills. |
| `admin/agent-verification.html` | `/admin/verification` (`app/(portal)/admin/verification/page.tsx`) | Implemented (Basic) | **Cat 1, 2 & 3** | **Cat 1:** Omit automated registry sync claims (#55).<br>**Cat 2:** Restore side-by-side National ID and live selfie inspection modal (#56); restore license check controls.<br>**Cat 3:** Upgrade queue table to match reference layout and telemetry cards. |
| `admin/audit-log.html` | `/admin/audit-log` | **Missing Implementation** | **Cat 1 & 2** | **Cat 1:** Omit "Merkle root" and cryptographic ledger claims (#28, #42).<br>**Cat 2:** Build audit log viewer matching reference table and JSON payload inspector. |
| `admin/reports.html` | `/admin/reports` | **Missing Implementation** | **Cat 1 & 4** | **Cat 1:** Omit macroeconomic analytics (#28).<br>**Cat 4:** Build abuse moderation queue for flagged listings/agents with reason codes and uphold/dismiss actions. |
| *No Reference* (`ADM-01`) | `/admin` (`app/(portal)/admin/page.tsx`) | Implemented (Custom) | **Cat 4** | Maintain operational KPI ribbon, triage desks, and Cairo operational clock adhering to Navy & Brass tokens. |
| *No Reference* (`ADM-07`) | `/admin/sales` (`app/(portal)/admin/sales/page.tsx`) | Implemented (Custom) | **Cat 4** | Maintain 30-day deadline review, mutual confirmation audit, dispute resolution, and Conflict-of-Interest Guard (`ADM-11` per #67, #71). |

---

### Group 6: AI Property Advisory & Concierge (`assistant/`)
*Reference Files:* `assistant/index.html`, `assistant/ar.html`  
*Implemented Status:* Currently hidden/deferred from navigation per Decision #48.  
*Reconciliation Action:*
* `assistant/index.html`: **Reference-Only / Deferred Screen**. Provides the canonical full-page conversational UI, interactive property comparison cards, and action authorization triggers for when the AI assistant feature is activated in the Intelligence phase (`PUB-10`).
* `assistant/ar.html`: **Reference-Only / Out of V1**. Arabic version deferred per Decision #99.

---

## 4. Final Completion Summary

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    GLOBAL UI RECONCILIATION AUDIT SUMMARY                    │
├───────────────────────────────────────────────────┬──────────────────────────┤
│ Total Reference Groups Discovered                 │ 7 Groups                 │
│ Total Reference Files in Repository               │ 48 Files                 │
│   • Reference HTML Screens                        │ 39 Screens               │
│   • Reference Supporting Assets (CSS / JS / MD)   │ 9 Files                  │
│ Total Implemented Screen Counterparts Audited     │ 26 Active Routes/Screens │
│ Total Missing Implementations Identified          │ 6 Screens                │
│   • Public Agent Profile (/agents/[id])           │ Missing                  │
│   • Buyer Documents (/buyer/documents)            │ Missing                  │
│   • Agent Leads Board (/agent/leads)              │ Missing                  │
│   • Agent Analytics (/agent/analytics)            │ Missing                  │
│   • Admin Audit Log (/admin/audit-log)            │ Missing                  │
│   • Admin Abuse Reports (/admin/reports)          │ Missing                  │
│ Total Implemented Screens with No Reference (Cat 4)│ 7 Workflows              │
│   • Paymob Deposit Checkout & Result (BUY-08/09)  │ Implemented              │
│   • Two-Party Mutual Sale Completion (BUY-10/07)  │ Implemented              │
│   • Statutory 48-Hour Cooling-Off (BUY-11)        │ Implemented              │
│   • Google Phone Onboarding Step (AUTH-06)        │ Implemented              │
│   • Admin Sales Adjudication Desk (ADM-07)        │ Implemented              │
│   • Subscription & Quota Cockpit (SUB-01..12)     │ Implemented in part      │
│   • Agent KYC Application Flow (APP-01..05)       │ Seeded                   │
│ Reference-Only Screens (Out of V1 Scope)          │ 3 Screens                │
│   • Root Splash Redirect (index.html)             │ Not needed (Next.js)     │
│   • Arabic Property Detail (property-detail-ar)   │ Deferred per #99         │
│   • Arabic Assistant (assistant/ar.html)          │ Deferred per #99         │
│ Confirmed Backend / Database / API Impact         │ 100% ZERO                │
└───────────────────────────────────────────────────┴──────────────────────────┘
```

---

## 5. Implementation Sequencing & Group Verification

```text
Phase R0: Group 0 — Global Navigation & Shared Shell Components
          (Navbar, Footer, PortalShell, Topbar, Sidebar, Tokens)
                            ↓
Phase R1: Group 2 — Public Discovery & Properties
          (Home, Search Catalog + Map, Property Detail, Areas, Agents, Compare)
                            ↓
Phase R2: Group 1 — Authentication & Identity
          (Login, Register, Verify Email, Forgot Password, Complete Profile)
                            ↓
Phase R3: Group 3 — Buyer Portal
          (Dashboard, Viewings, Offers, Saved, Messages, Notifications, Settings)
                            ↓
Phase R4: Group 4 — Agent Portal & Subscription
          (Dashboard, Listings, Quota, Leads, Calendar, Messages, Settings)
                            ↓
Phase R5: Group 5 — Admin Governance Portal
          (Moderation, Verification, Sales Adjudication, Audit Log, Notifications)
```

### Verification Gate Per Group
Before declaring any group complete:
1. `npx tsc --noEmit` inside `frontend/` (0 errors)
2. `npm run lint` inside `frontend/` (0 warnings/errors)
3. `npm run build` inside `frontend/` (prerendering all routes successfully)
4. Visual browser inspection: Verify layout density, typography hierarchy, and interactions match the reference HTML/CSS.
5. Scope check: Confirm `git status` modifies ONLY intended frontend files with **zero backend or schema changes**.
