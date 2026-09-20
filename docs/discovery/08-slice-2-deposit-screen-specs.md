# Slice 2 Screen Specifications — Reservation Deposit Payments (BUY-08, BUY-09) & Paymob Engine

    Status:       SPECIFICATION (transactional core) · design-ready · NOT implemented
    Last Updated: 2026-09-20
    Scope:        Reservation deposit payment flow: checkout hold, Paymob hosted checkout, status polling, webhook atomic bundle, and enum reconciliation (#105)
    Derived from: 05-final-frontend-screen-inventory.md (BUY-08, BUY-09, SH-05), ../product/BUSINESS_RULES.md §5, §6, §7,
                  ../architecture/PAYMENTS.md, ../architecture/CONCURRENCY_AND_IDEMPOTENCY.md,
                  ../architecture/API.md, ../architecture/FRONTEND.md, ../design/UX_PATTERNS.md,
                  ../DECISIONS.md #11, #13, #76, #84, #90, #105, #107

**Authority.** This document specifies behaviour, states, and acceptance criteria for Slice 2 (Reservation Deposits).
Rules come from `DECISIONS.md`, `PAYMENTS.md`, and `BUSINESS_RULES.md`. Visual design follows the Impeccable "Navy & Brass"
candidate design system (`docs/design/candidates/settly-landing/`).

---

## 0. Slice 2 Map

| Spec | Screen / Surface | Route | Inventory ID | Backend Actions |
|---|---|---|---|---|
| S2-01 | Deposit Checkout | `/buyer/offers/[id]/deposit` | BUY-08 | `POST /api/v1/offers/:id/deposit/checkout` |
| S2-02 | Deposit Payment Result | `/buyer/offers/[id]/deposit/callback` | BUY-09, SH-05 | `GET /api/v1/offers/:id/deposit/status` |
| S2-03 | Buyer Offers Deposit Callout | `/buyer/offers` & Offer Drawer | BUY-06, BUY-07 | Status badge & direct "Pay Reservation Deposit" CTA |
| S2-BE | Paymob Payment Engine | `/api/v1/payments/*` | Provider Engine | Webhook HMAC, 15-min hold, Atomic Bundle T1 |

---

## S2-01 — Deposit Checkout (`BUY-08`)

| Field | Specification |
|---|---|
| Role / Route | Signed-in buyer (USER, or AGENT buying on others' listings) · `/buyer/offers/[id]/deposit` |
| Purpose | Review deposit obligation (5% capped at 50,000 EGP), acquire exclusive 15-minute checkout hold, review 48-hour cooling-off refund policy, and redirect to Paymob hosted checkout. |
| Entry points | "Pay Reservation Deposit" CTA on `/buyer/offers` or offer details drawer (`BUY-07`) when offer status is `ACCEPTED`. |
| Sections | 1. **Header & Progress:** Breadcrumbs (`Offers / Offer #[id] / Deposit Checkout`), 72-hour offer acceptance deadline badge.<br>2. **Property Summary Card:** Image, title, address, agreed purchase price (EGP).<br>3. **Financial Breakdown:** Agreed price, calculated 5% deposit amount (capped at 50,000 EGP), note confirming deposit is 100% credited toward purchase price (#76).<br>4. **Exclusive Checkout Hold Banner (15-minute clock):** Explains that starting checkout locks the unit exclusively for 15 minutes to prevent race conditions (#11).<br>5. **Consumer Protection & Refund Terms:** 48-hour cooling-off window (100% refund); after 48 hours, withdrawal retains 20% compensation to seller (#84); full automatic refund if out-raced (§6.2).<br>6. **Payment Action Area:** "Proceed to Secure Paymob Checkout" button, secure badges (Paymob, TLS 1.3 256-bit, PCI-DSS Level 1 compliant provider). |
| Primary Action | **Proceed to Paymob Checkout:** Calls `POST /api/v1/offers/:id/deposit/checkout` with idempotency key. Acquires 15-minute exclusive hold on `Property`, sets `PaymentAttempt` to `REDIRECTED`, and redirects browser to Paymob hosted checkout URL. |
| States | • **idle / ready:** Hold available; 72-hour deadline active.<br>• **submitting:** Hold being acquired; checkout URL being requested.<br>• **hold active:** 15-minute countdown running for current buyer.<br>• **hold held by another buyer (409):** Explains another buyer has an active 15-min hold; shows remaining hold time with auto-refresh.<br>• **deadline passed (410):** 72-hour deposit deadline expired; offer expired; CTA disabled.<br>• **email-not-verified (403):** Action blocked per §9.1 until email is verified.<br>• **already reserved / completed (409):** Offer or property already reserved. |
| Permissions | Buyer owning the offer only (`offer.buyerId === session.user.id`). Other users receive 404/403. |
| API Dependency | `GET /api/v1/offers/:id` (load offer terms & deposit amount)<br>`POST /api/v1/offers/:id/deposit/checkout` (acquire hold & create Paymob session) |
| Acceptance Criteria | 1. Deposit amount is strictly 5% of accepted price, capped at 50,000 EGP (in EGP / piastres).<br>2. Clearly discloses: *"This unit is not held until your deposit clears"* per BUSINESS_RULES §6.<br>3. Attempting checkout while another buyer holds the 15-min hold returns 409 and shows the hold notice without advancing.<br>4. Redirects to Paymob hosted checkout URL without collecting or touching card data. |

---

## S2-02 — Deposit Payment Result / Callback Polling (`BUY-09`, `SH-05`)

| Field | Specification |
|---|---|
| Role / Route | Signed-in buyer · `/buyer/offers/[id]/deposit/callback` |
| Purpose | Landing destination after Paymob hosted checkout redirect. Displays real-time transaction verification via polling, never trusting query params alone. |
| Entry Points | Browser return redirect from Paymob hosted page (`?success=true&id=...`). |
| Core Invariant | **Absolute Rule 1 (§5.1):** Browser return URL never updates payment status or grants `SUCCEEDED`. UI polls `GET /api/v1/offers/:id/deposit/status` until authoritative state is reached. |
| Sections | 1. **Telemetry Card:** Status icon, headline, transaction amount, reference ID.<br>2. **Status Progress Bar:** Real-time polling indicator with smooth progress animation.<br>3. **Resolution Content:**<br>   • If `SUCCEEDED`: Emerald badge, "Unit Reserved", link to Buyer Portal and next legal steps.<br>   • If `PROCESSING`: Brass badge, "Confirming with Central Bank...", countdown timer with reassurance.<br>   • If `FAILED`: Rose badge, provider failure explanation, "Try Again" button (re-entering hold).<br>   • If `SUPERSEDED` (Lost Race): Clear alert explaining another buyer's deposit cleared first; confirmation that 100% full refund was initiated immediately (§6.2). |
| States | • **VERIFYING (polling):** Polling every 2.5s up to 60s while status is `PROCESSING`.<br>• **SUCCEEDED:** Authoritative webhook processed; `Offer` is `RESERVED`; confetti/celebration state.<br>• **FAILED:** Payment rejected or cancelled by buyer on Paymob.<br>• **TIMEOUT / RECONCILING:** Polling timed out; payment is queued for reconciliation sweep; reassuring notice.<br>• **SUPERSEDED:** Residual race lost; full refund triggered automatically. |
| Acceptance Criteria | 1. UI never shows "Success" solely because query parameter `success=true` exists.<br>2. UI polls `GET /api/v1/offers/:id/deposit/status` until status changes from `PROCESSING`.<br>3. On `SUCCEEDED`, displays link to view updated offer in `/buyer/offers` with `RESERVED` status.<br>4. On residual race loss (`SUPERSEDED`), displays automatic refund notification with zero fee deduction. |

---

## S2-03 — Buyer Offers Deposit Callout & Action Integration (`BUY-06`, `BUY-07`)

| Field | Specification |
|---|---|
| Role / Route | Signed-in buyer · `/buyer/offers` and Offer Details Drawer |
| Behaviour | When an offer reaches `ACCEPTED`:
1. Status pill changes to gold `ACCEPTED` with "Deposit Required" pulse badge.
2. Prominent Brass CTA button: **"Pay Reservation Deposit (EGP {amount})"** linking directly to `/buyer/offers/{id}/deposit`.
3. Displays countdown to 72-hour `depositDeadlineAt`.
4. If property has active checkout hold by another buyer, displays subtle clock badge: *"In Checkout by another buyer"*. |
| Acceptance Criteria | 1. Accepted offers make deposit payment the primary action.<br>2. Deadline countdown updates in real time. |

---

## S2-BE — Backend Payment & Concurrency Engine

| Component | Specification |
|---|---|
| Enum Reconciliation (#105) | 1. `PaymentStatus`: `PENDING`, `PROCESSING`, `SUCCEEDED`, `CANCELLED`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`. (Remove `FAILED` from Payment, add `CANCELLED`).<br>2. `AttemptStatus`: `INITIATED`, `REDIRECTED`, `SUCCEEDED`, `FAILED`, `ABANDONED`, `EXPIRED`.<br>3. `RefundStatus`: `REQUESTED`, `PROCESSING`, `SUCCEEDED`, `FAILED`. (Replace `COMPLETED` with `SUCCEEDED`). |
| 15-Minute Checkout Hold | Conditional atomic update on `Property`:
```sql
UPDATE "Property"
SET "checkoutHoldExpiresAt" = NOW() + INTERVAL '15 minutes',
    "checkoutHoldUserId" = :buyerId
WHERE "id" = :propertyId
  AND ("checkoutHoldExpiresAt" IS NULL OR "checkoutHoldExpiresAt" < NOW() OR "checkoutHoldUserId" = :buyerId)
RETURNING *;
```
If 0 rows returned, checkout hold is active by another buyer -> throw 409 `/errors/checkout-hold-active`. |
| Paymob Sandbox Adapter | Implements `createCheckout`, `getTransaction`, `reverse`, `verifyWebhook`. Supports test mock mode when Paymob credentials are not supplied, enabling full offline test coverage. |
| Atomic Bundle (T1) | On verified webhook receipt:
1. Insert `WebhookEvent` (unique on provider + eventId).
2. Set `Payment` status `SUCCEEDED`, `paidAt = NOW()`.
3. Set `PaymentAttempt` status `SUCCEEDED`.
4. Set `Offer` status `RESERVED`.
5. Set `Property` status `RESERVED`, clear checkout hold.
6. Set rival `Offer`s on property to `SUPERSEDED`.
7. Set rival pending `Payment`s to `CANCELLED`.
8. Log `AuditLog` entry. |
