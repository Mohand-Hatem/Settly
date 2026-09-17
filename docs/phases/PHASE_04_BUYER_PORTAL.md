# Phase 04: Buyer Portal & Engagement Lifecycle

> **⚠️ Non-authoritative (Decision #48, 2026-09-17).** V1 order and scope are defined by
> `../process/ROADMAP.md` and `../process/IMPLEMENTATION_PLAN.md`. This file is kept as a screen
> inventory and progress record; where it disagrees with those documents or with
> `../DECISIONS.md`, they win. Its "luxury / escrow" framing is superseded by #45 and #47.


> **Status**: ⬜ Not Started  
> **Milestone**: 9 Buyer Dashboard Screens (Screens 14–22) & Engagement Lifecycle  
> **Governing Candidates**: `docs/design/candidates/settly-landing/buyer-dashboard/`  

---

## 1. Phase Goal
Deliver the private buyer portal (Screens 14–22) enabling clients to manage saved residences, alert criteria, viewing appointments, binding offer negotiations, due diligence documents, and security settings.

---

## 2. Scope Breakdown

### Frontend (Screens 14–22)
- **Shared Buyer Layout (`/buyer/layout.tsx`)**: 288px persistent sidebar, 76px sticky header, mobile drawer.
- **Screen 14 — Buyer Overview (`/buyer/overview`)**: Metrics summary, active viewing countdown, recent offers glance.
- **Screen 15 — Favorites & Curated Collections (`/buyer/favorites`)**: Custom collection boards, price-drop tags.
- **Screen 16 — Saved Searches (`/buyer/saved-searches`)**: Criteria cards, instant/daily alert toggles.
- **Screen 17 — My Viewings (`/buyer/viewings`)**: Agenda/calendar view, viewing status badges, calendar export (.ics).
- **Screen 18 — My Offers (`/buyer/offers`)**: Offer negotiation table, counter-offer history, escrow status.
- **Screen 19 — Messages (`/buyer/messages`)**: 2-pane chat desk with advisor info and property card attachment.
- **Screen 20 — Notifications (`/buyer/notifications`)**: Feed categorized by offers, viewings, and price alerts.
- **Screen 21 — My Documents (`/buyer/documents`)**: Due diligence vault with KYC, contracts, escrow receipts.
- **Screen 22 — Account Settings (`/buyer/settings`)**: Profile info, password update, notification preferences.

### Backend APIs
- `engagement` module: Collections CRUD, Saved Searches management.
- `pipeline` module: Viewing booking requests, Offer submission and counter-offers.
- `knowledge` module: Document vault upload presigning and file listing.

### Database
- Models: `Collection`, `CollectionItem`, `SavedSearch`, `SavedSearchMatch`, `Lead`, `Viewing`, `Offer`, `Document`.
- Invariants: Max 3 open viewing requests per buyer (Invariant I9); Max 5 live offers (Invariant I12).

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **4.1** | Shared Buyer Layout & Shell | Implement persistent 288px sidebar, top header, and mobile navigation | ⬜ Not Started |
| **4.2** | Screen 14: Buyer Overview (`/buyer/overview`) | Build overview metrics and quick action bar | ⬜ Not Started |
| **4.3** | Screen 15: Favorites & Collections (`/buyer/favorites`) | Build tabbed collection boards and card actions | ⬜ Not Started |
| **4.4** | Screen 16: Saved Searches (`/buyer/saved-searches`) | Build saved search cards and alert frequency controls | ⬜ Not Started |
| **4.5** | Screen 17: Viewing Booking Flow (`/buyer/viewings`) | Build viewing calendar/agenda and booking requests | ⬜ Not Started |
| **4.6** | Screen 18: Offer Negotiation (`/buyer/offers`) | Build offer timeline and escrow status tracker | ⬜ Not Started |
| **4.7** | Screen 19 (Messages) & Screen 20 (Notifications) | Build 2-pane messaging desk and notification feed | ⬜ Not Started |
| **4.8** | Screen 21 (Documents) & Screen 22 (Settings) | Build due diligence vault and account security | ⬜ Not Started |
| **4.9** | Buyer Portal End-to-End Test Suite | Automated integration tests for buyer workflows | ⬜ Not Started |
