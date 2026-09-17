# Phase 05: Agent Advisory & Listing Management

> **⚠️ Non-authoritative (Decision #48, 2026-09-17).** V1 order and scope are defined by
> `../process/ROADMAP.md` and `../process/IMPLEMENTATION_PLAN.md`. This file is kept as a screen
> inventory and progress record; where it disagrees with those documents or with
> `../DECISIONS.md`, they win. Its "luxury / escrow" framing is superseded by #45 and #47.


> **Status**: ⬜ Not Started  
> **Milestone**: 7 Certified Advisor Screens (Screens 23–29) & Listing Lifecycle  
> **Governing Candidates**: `docs/design/candidates/settly-landing/agent-dashboard/`  

---

## 1. Phase Goal
Implement the Certified Advisor portal (Screens 23–29) giving licensed brokers listing creation and editing with 2-tier moderation triggers, direct Cloudinary uploads with EXIF stripping, leads pipeline CRM, viewing availability calendars, and performance analytics.

---

## 2. Scope Breakdown

### Frontend (Screens 23–29)
- **Shared Agent Layout (`/agent/layout.tsx`)**: Advisory sidebar, verification indicator, quick action bar.
- **Screen 23 — Agent Overview (`/agent/overview`)**: Commission pipeline, active leads, scheduled tours.
- **Screen 24 — My Listings (`/agent/listings`)**: Property table with status badges (`PUBLISHED`, `PENDING_REVIEW`, `DRAFT`, `RESERVED`).
- **Screen 25 — Create Listing (`/agent/listings/new`)**: Multi-step wizard with specs, pricing, Cloudinary photo dropzone, and CAD floorplans.
- **Screen 26 — Edit Listing (`/agent/listings/[id]/edit`)**: Update property with 2-tier moderation notice.
- **Screen 27 — Leads / Pipeline CRM (`/agent/leads`)**: Kanban/table view of qualified buyers and active negotiations.
- **Screen 28 — Viewings Calendar (`/agent/calendar`)**: Availability scheduler, slot booking confirmations.
- **Screen 29 — Analytics (`/agent/analytics`)**: Listing impression metrics, lead conversion rates, corridor benchmarks.

### Backend APIs
- `GET /api/v1/me/properties` & `POST /api/v1/me/properties` (Listing CRUD).
- `PATCH /api/v1/me/properties/:id` (2-tier moderation enforcement).
- `GET/POST /api/v1/me/availability` (Advisor calendar slots).
- `GET /api/v1/pipeline/leads` (Lead pipeline aggregation).

### Database
- Models: `Property`, `PropertyImage`, `PropertyPriceHistory`, `AgentAvailability`, `Lead`.
- PostgreSQL `btree_gist` exclusion constraint preventing overlapping bookings.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **5.1** | Shared Agent Advisory Layout & Shell | Implement advisor portal layout and navigation | ⬜ Not Started |
| **5.2** | Screen 23: Agent Overview (`/agent/overview`) | Build overview metrics and action cards | ⬜ Not Started |
| **5.3** | Screen 24: My Listings (`/agent/listings`) | Build listings data table and action drawer | ⬜ Not Started |
| **5.4** | Screen 25: Create Listing Wizard (`/agent/listings/new`) | Build multi-step wizard and Cloudinary photo dropzone | ⬜ Not Started |
| **5.5** | Screen 26: Edit Listing & 2-Tier Moderation | Build edit interface with moderation triggers | ⬜ Not Started |
| **5.6** | Screen 27: Leads Pipeline CRM (`/agent/leads`) | Build leads Kanban board and stage updates | ⬜ Not Started |
| **5.7** | Screen 28: Viewings Calendar (`/agent/calendar`) | Build advisor availability calendar scheduler | ⬜ Not Started |
| **5.8** | Screen 29: Agent Analytics (`/agent/analytics`) | Build listing telemetry and conversion charts | ⬜ Not Started |
| **5.9** | Agent Portal Integration Test Suite | Automated testing for agent operations | ⬜ Not Started |
