# Product Overview

    Status:       LOCKED
    Last Updated: 2026-09-17
    Derived From: Decisions #1, #2, #4, #28, #29, #39, #45–#54, #79–#83
    Related:      REQUIREMENTS.md, BUSINESS_RULES.md, ../GLOSSARY.md

## 1. What Settly is

Settly is an AI-powered real estate intelligence platform for the **Egyptian market (EGP)**.
Buyers discover properties through structured, geographic and semantic search, request viewings,
negotiate offers, and pay a reservation deposit. Agents manage listings and their pipeline.
Admins moderate. A mid-scale modular monolith, not an MVP and not an enterprise SaaS (#1).

**Audience (#45):** the **whole Egyptian residential market**, with a **premium brand feel**.
"Premium" is the experience, not an eligibility filter: no price floor, no area whitelist.

**Stage (#46):** **demo first, designed production-ready** and launchable later. External
integrations may run in sandbox mode; production-grade controls are in scope from the start.

## 2. Scope package — Package B, "Full Buyer Journey"

Sale-first. Rent listings support discovery, viewings and inquiries — **never offers or
payments**. Independent agents only, no agency/organization model. The payment object is a
**reservation deposit against an accepted offer** (#1). This is the only **buyer** payment; the
revenue model below adds agent subscriptions and transaction revenue (#79, #80).

**Revenue model (#79, #80):** two streams — **transaction revenue** from successful sales (fee,
payer and payout rules TBD) and an **agent listing subscription** with **exactly three plans**:
**Free** (2 new listings per billing month, $0), **Pro** (4, **$20/month**), **Enterprise** (8,
**$50/month**). Subscription prices are **USD-based** and shown in USD; payment is charged in **EGP** at a fixed V1
rate of 48.98 EGP per USD (Pro 980 EGP, Enterprise 2,449 EGP — #103).
Real-estate amounts are in EGP.

**V1 listing scope (#47):** sale listings are **resale only**; **off-plan / developer primary
sales are future scope**. The reservation deposit applies to resale listings and runs against
**Paymob sandbox** during the demo stage (a real launch also needs V34).

## 3. Roles

| Role | Can |
|---|---|
| **User / Buyer** | Discover, search, filter, compare, favourite, save searches, request viewings, message agents, submit offers, pay deposits, receive notifications, use AI, review documents within their visibility scope |
| **Agent** | Manage listings, receive leads, manage viewings and offers, message buyers, view analytics, upload documents |
| **Admin** | Moderate listings, verify agents, handle reports, suspend accounts, access audit logs and platform analytics |

No additional roles without a strong product or technical reason (#1).

**Since discovery (#49–#53):** everyone registers as a buyer. A buyer becomes an agent through an
admin-approved application (identity + professional verification). One account can be buyer
and agent; an agent never makes offers on their own listings. Only verified agents list
properties; owner listings are future scope. All users give a phone number (unverified in V1).
Full matrix: `ROLES_AND_PERMISSIONS.md`.

## 4. Core journeys (J1–J8, from Decision #3)

J1 buyer primary path (discovery → viewing → offer → deposit) · J2 passive discovery (saved
search alerts) · J3 AI-assisted discovery · J4 agent onboarding and verification · J5 listing
lifecycle · J6 agent pipeline · J7 admin moderation · J8 notification fan-out.

## 5. Language (English-only V1 — #99)

**Settly V1 is English only end to end (#99):** UI, listing content, search, AI answers and system
messages. No `/ar` routes and no Arabic/RTL work in V1. **Arabic content, Arabic search, Arabic AI
answers and Arabic/RTL are a Future / Optional Feature**, reconsidered only after the core project is
completed (#99 defers the language parts of #39 for V1). Content is never machine-translated for
display. See `architecture/FRONTEND.md` §5.

## 6. Explicitly out of scope (v1)

Rental applications, screening, leases, recurring rent · agency/brokerage organizations ·
escrow/e-signature · multi-currency (subscriptions are priced in USD and charged in EGP at a fixed rate, #103; no currency toggle) · mobile apps (web only, responsive) ·
public/partner API · MLS import · ML-trained recommendations (v1 uses weighted scoring +
centroid similarity) · a dedicated search-analytics dashboard · advanced admin analytics (#28).

**Future scope, not v1 (#47):** off-plan / developer primary sales — developers, projects,
delivery dates, instalment plans and any developer-side payment (e.g. an EOI fee) need their own
domain and payment design first.

*Agent subscription billing was listed here until #80 moved it into scope.*

## 7. Admin scope (Decision #28)

**Kept, load-bearing:** property moderation, moderation actions, audit-log viewer,
reports/moderation workflow, essential operational dashboard.
**Reduced to stub:** advanced admin analytics, extensive admin user management.

## 8. Sequencing principle (Decision #29)

Do not reduce architecture because this is a portfolio project — reduce scope by **sequencing**.
Target an early end-to-end demonstrable slice: `auth → properties → search → property detail →
viewing request`. See `process/ROADMAP.md` for the full phase order.

## 9. Related documents

`REQUIREMENTS.md` for functional/non-functional detail · `BUSINESS_RULES.md` for the four
lifecycle state machines · `../GLOSSARY.md` for vocabulary.
