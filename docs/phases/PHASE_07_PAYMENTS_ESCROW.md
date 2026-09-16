# Phase 07: Financial Escrow, Paymob & Concurrency Controls

> **Status**: ⬜ Not Started  
> **Milestone**: 15-Minute Reservation Hold, Paymob Gateway, Escrow State Machine  
> **Governing Specifications**: `docs/architecture/PAYMENTS.md`, `docs/product/BUSINESS_RULES.md`  

---

## 1. Phase Goal
Implement the earnest deposit escrow workflow, 15-minute exclusive reservation checkout hold, Paymob payment gateway integration with HMAC webhook validation, and cooling-off cancellation refund state machines.

---

## 2. Scope Breakdown

### Backend
- **15-Min Checkout Hold**: `POST /api/v1/payments/hold` atomically acquiring exclusive hold on property.
- **Paymob Gateway**: `POST /api/v1/payments/intent` initiating Paymob transaction; `POST /api/v1/payments/webhook` validating HMAC-SHA512 signature.
- **Atomic Transition Bundle**: Transitioning `Offer` -> `RESERVED`, `Property` -> `RESERVED`, voiding competing offers, and issuing escrow receipt in a single transaction.
- **Cooling-Off Refund Logic**: 100% refund within 48h cooling-off window; 20% retention fee post-cooling-off.

### Frontend
- Checkout reservation modal with 15:00 countdown timer.
- Paymob iframe / redirect handler.
- Payment confirmation and escrow guarantee certificate screen.
- Cooling-off refund cancellation request dialog.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **7.1** | 15-Minute Checkout Hold State Machine | Implement hold acquisition, TTL enforcement, and concurrency lock | ⬜ Not Started |
| **7.2** | Paymob Payment Intent Integration | Build intent creation, checkout URL generation, and status mapping | ⬜ Not Started |
| **7.3** | Paymob Webhook & HMAC-SHA512 Verification | Secure webhook receiver validating cryptographic Paymob HMAC | ⬜ Not Started |
| **7.4** | Atomic State Transition Bundle | Transactionally transition offer and property to RESERVED | ⬜ Not Started |
| **7.5** | Cooling-Off Refund Flow | Implement 48h full refund and post-cooling-off fee calculations | ⬜ Not Started |
