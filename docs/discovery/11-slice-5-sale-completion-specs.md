# Slice 5 Screen Specifications — Two-Party Sale Completion & Admin Review (BUY-10, AGT-07, ADM-07)

    Status:       SPECIFICATION (transactional core) · design-ready · NOT implemented
    Last Updated: 2026-09-20
    Scope:        Two-party sale completion flow (Buyer & Agent mutual confirmation), 30-day review timer,
                  dispute handling, Admin Sale Completion Review queue (/admin/sales), and transition to SOLD (#77, #82, #102).
    Derived from: 05-final-frontend-screen-inventory.md (BUY-10, AGT-07, ADM-07), ../product/BUSINESS_RULES.md §2 (P9, P9a, P10),
                  §4 (O13, O14), §6, §7, §10, ../architecture/API.md, ../architecture/FRONTEND.md,
                  ../DECISIONS.md #76, #77, #82, #83, #84, #102, #107, #108, #109, #110

**Authority.** This document specifies behavior, data contracts, and UI states for Slice 5 (Two-Party Sale Completion & Admin Review).
Rules come from `DECISIONS.md` and `BUSINESS_RULES.md`. Visual design follows the Impeccable "Navy & Brass"
candidate design system (`docs/design/candidates/settly-landing/`).

---

## 0. Slice 5 Map

| Spec | Screen / Surface | Route | Inventory ID | Backend Actions |
|---|---|---|---|---|
| **S5-01** | Buyer Sale Confirmation | `/buyer/offers` & Offer Drawer | BUY-10 (BUY-07) | `POST /api/v1/offers/:id/confirm-sale`<br>`POST /api/v1/offers/:id/dispute-sale` |
| **S5-02** | Agent Sale Confirmation | `/agent/offers` & Offer Drawer | AGT-07 (AGT-03) | `POST /api/v1/offers/:id/confirm-sale`<br>`POST /api/v1/offers/:id/dispute-sale` |
| **S5-03** | Admin Sale-Completion Review Queue | `/admin/sales` | ADM-07 | `GET /api/v1/admin/sales`<br>`GET /api/v1/admin/sales/:id` |
| **S5-04** | Admin Sale Review Decisions | Modal / Drawer in ADM-07 | ADM-07 | `POST /api/v1/admin/sales/:id/confirm`<br>`POST /api/v1/admin/sales/:id/fell-through`<br>`POST /api/v1/admin/sales/:id/extend` |
| **S5-BE** | Two-Party Completion Engine | `/api/v1/offers/:id/*`<br>`/api/v1/admin/sales/*` | Pipeline Engine | P9/P9a/O13/O14 transitions, 30-day clock, conflict-of-interest check, notifications |

---

## S5-01 — Buyer Sale Confirmation (`BUY-10`)

| Field | Specification |
|---|---|
| **Role / Route** | Signed-in buyer (`/buyer/offers` or offer details drawer) |
| **Trigger State** | Offer status is `RESERVED` (deposit captured, property locked). |
| **Purpose** | Allow the buyer to review conveyance progress, confirm that the offline sale has completed (contract signed, remaining balance settled), or report a dispute. |
| **Sections** | 1. **Completion Status Strip:**<br>• Visual 2-step progress: `Buyer Confirmation` and `Agent Confirmation`.<br>• Remaining review clock: e.g. *"24 days remaining before administrative review"*, anchored to 30 days after reservation.<br>2. **Financial Recap:** Agreed price, deposit paid (50,000 EGP / 5%), remaining balance due at conveyance.<br>3. **Legal Notice:** Explicitly discloses that confirming signals deed conveyance completion and transitions the listing to `SOLD`.<br>4. **Action Area:**<br>• Primary: *"Confirm Sale Completed"* (green/brass badge).<br>• Secondary: *"Report Issue / Dispute"* (subtle rose outline). |
| **Confirmation Modal** | Triggered by "Confirm Sale Completed":<br>• Title: *"Confirm Property Sale Completion"*; explains that once both parties confirm, the transaction is marked final, deposit is credited toward purchase price (#76), and buyer lead advances to `WON` (#83).<br>• Checkbox: *"I confirm the sales contract has been executed and financial obligations are settled."*<br>• Actions: *"Confirm Completion"* (calls `POST /api/v1/offers/:id/confirm-sale`) and *"Cancel"*. |
| **Dispute Modal** | Triggered by "Report Issue / Dispute":<br>• Title: *"Report Transaction Issue"*; explains that raising a dispute halts the countdown and transfers the case immediately to Admin Review (`ADM-07`).<br>• Field: Required explanation textarea (min 20 chars).<br>• Actions: *"Submit Dispute"* (calls `POST /api/v1/offers/:id/dispute-sale`) and *"Cancel"*. |
| **States** | • **awaiting-both:** Neither party has confirmed yet; 30-day countdown running.<br>• **buyer-confirmed-waiting-agent:** Buyer confirmed; banner shows: *"You confirmed on [date]. Waiting for listing agent to confirm."*<br>• **agent-confirmed-waiting-buyer:** Agent has already confirmed; banner shows: *"Agent confirmed completion on [date]. Please confirm to finalize."*<br>• **disputed / in-admin-review:** Dispute raised or 30 days elapsed; alert banner explains: *"Under Admin Review. An administrator is evaluating this transaction."*<br>• **review-extended:** Admin granted review extension; displays reason and updated deadline.<br>• **completed (SOLD):** Both confirmed (or admin confirmed); celebratory banner: *"Sale Completed — Congratulations! Property marked SOLD."*<br>• **fell-through:** Deal cancelled; shows cause and refund status. |

---

## S5-02 — Agent Sale Confirmation (`AGT-07`)

| Field | Specification |
|---|---|
| **Role / Route** | Signed-in listing agent (`/agent/offers` or drawer) |
| **Trigger State** | Offer status is `RESERVED`. |
| **Purpose** | Allow the listing agent to confirm conveyance closing with the buyer, or report a dispute. |
| **Absolute Rule (#102)** | **Agent confirmation alone NEVER makes a listing `SOLD`.** If agent confirms first, the offer stays `RESERVED` awaiting buyer confirmation. |
| **Sections & Modals** | Mirror of `BUY-10` with agent-specific copy. |
| **States** | Identical progression states to `BUY-10`. |

---

## S5-03 — Admin Sale-Completion Review Queue (`ADM-07` at `/admin/sales`)

| Field | Specification |
|---|---|
| **Role / Route** | Signed-in administrator (`/admin/sales`) |
| **Purpose** | Centralized queue of property reservations requiring admin mediation: 30 days passed without mutual confirmation, or buyer/agent raised an active dispute (#77, #82). |
| **Filters & Tabs** | • Tabs: **Action Required** (Disputed or >30 days without completion), **Active Reservations** (all currently `RESERVED` offers), **Resolved** (`COMPLETED` or `FELL_THROUGH`).<br>• Search: Instant filter by Property title, Buyer email, or Agent name. |
| **Case Table Columns** | 1. **Property:** Thumbnail, title, area, agreed sale price.<br>2. **Parties:** Buyer name/email, Agent name/email.<br>3. **Status:** `Awaiting Buyer`, `Awaiting Agent`, `Disputed` (rose badge), `Review Extended` (amber badge), `30-Day Limit Reached` (warning badge).<br>4. **Timeline:** Days elapsed since reservation; 30-day review deadline.<br>5. **Actions:** "Review Case" button opening the Decision Drawer (`S5-04`). |
| **Empty State** | S5-03 empty state: *"No sales currently require administrative review. All reservations are within normal completion windows."* |

---

## S5-04 — Admin Sale Review Decisions (`ADM-07` Drawer)

| Field | Specification |
|---|---|
| **Context Display** | • Full property specs and agreed financial terms.<br>• Deposit receipt details (50,000 EGP held via Paymob).<br>• Timeline: Reservation date, buyer confirmation timestamp (if any), agent confirmation timestamp (if any), dispute timestamp and text (if any).<br>• Counterparty direct messaging / notes for administrative audit. |
| **Conflict-of-Interest Guard (#67, #71)** | If the signed-in admin is the buyer, seller, or listing agent of this transaction: all decision actions are strictly **disabled** with alert: *"Conflict of Interest: You are a party to this transaction. Another administrator must review this case."* |
| **Action 1: Confirm Sale (`POST /admin/sales/:id/confirm`)** | • Admin determines conveyance is genuine and complete.<br>• Requires admin review notes.<br>• Effects: Atomically transitions `Offer -> COMPLETED`, `Property -> SOLD` (P9), `Lead -> WON` (#83). Emits `SALE_COMPLETED` notifications to both parties. |
| **Action 2: Declare Fell Through (`POST /admin/sales/:id/fell-through`)** | • Admin determines the sale failed.<br>• Form requires: **Cause of collapse** dropdown (matching §7 refund policy table: Seller/agent withdrawal [100% refund], Buyer withdrawal <=48h [100%], Buyer withdrawal >48h [80% refund / 20% to seller], External failure [80% refund / 20% to seller]) and mandatory explanation.<br>• Effects: Transitions `Offer -> FELL_THROUGH`, `Property -> PUBLISHED` (P10), records refund determination, emits notifications. |
| **Action 3: Extend Review (`POST /admin/sales/:id/extend`)** | • Admin grants an extension for justified reasons (e.g., bank mortgage paperwork pending).<br>• Form requires: **Extension Days** (1–30 days) and mandatory **Justification Notes**.<br>• Effects: Extends `adminReviewDeadline`, logs audit record, notifies parties of extension. |

---

## S5-BE — Backend Pipeline Engine & Lifecycle Wiring

| Component | Specification |
|---|---|
| **Data Model Extensions (`schema.prisma`)** | Add to `Offer` model:
```prisma
buyerConfirmedAt      DateTime?
agentConfirmedAt      DateTime?
disputedAt            DateTime?
disputedById          String?
disputeReason         String?
adminReviewedAt       DateTime?
adminReviewedById     String?
adminReviewDecision   String?
adminReviewNotes      String?
adminReviewDeadline   DateTime?
``` |
| **Endpoints** | 1. `POST /api/v1/offers/:id/confirm-sale`<br>2. `POST /api/v1/offers/:id/dispute-sale`<br>3. `GET /api/v1/admin/sales`<br>4. `GET /api/v1/admin/sales/:id`<br>5. `POST /api/v1/admin/sales/:id/confirm`<br>6. `POST /api/v1/admin/sales/:id/fell-through`<br>7. `POST /api/v1/admin/sales/:id/extend` |
| **Atomic Completion Bundle (P9 & O13)** | When both buyer and agent confirm (or admin confirms):
```text
pg_advisory_xact_lock on property
Update Offer -> COMPLETED
Update Property -> SOLD
Update Lead (if exists) -> WON
Emit Notifications -> SALE_COMPLETED to buyer and agent
AuditLog entry
``` |
| **Permissions & Verification Boundary** | • Only buyer or agent belonging to the offer can confirm/dispute.<br>• Admin endpoints require `role === ADMIN`.<br>• Admin conflict of interest: `admin.id !== offer.buyerId && admin.id !== offer.agentId`. |
