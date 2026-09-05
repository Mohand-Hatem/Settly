# Product Overview

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #1, #2, #4, #28, #29, #39
    Related:      REQUIREMENTS.md, BUSINESS_RULES.md, ../GLOSSARY.md

## 1. What Settly is

Settly is an AI-powered real estate intelligence platform for the **Egyptian market (EGP)**.
Buyers discover properties through structured, geographic and semantic search, request viewings,
negotiate offers, and pay a reservation deposit. Agents manage listings and their pipeline.
Admins moderate. A mid-scale modular monolith, not an MVP and not an enterprise SaaS (#1).

## 2. Scope package — Package B, "Full Buyer Journey"

Sale-first. Rent listings support discovery, viewings and inquiries — **never offers or
payments**. Independent agents only, no agency/organization model. The payment object is a
**reservation deposit against an accepted offer** (#1).

## 3. Roles

| Role | Can |
|---|---|
| **User / Buyer** | Discover, search, filter, compare, favourite, save searches, request viewings, message agents, submit offers, pay deposits, receive notifications, use AI, review documents within their visibility scope |
| **Agent** | Manage listings, receive leads, manage viewings and offers, message buyers, view analytics, upload documents |
| **Admin** | Moderate listings, verify agents, handle reports, suspend accounts, access audit logs and platform analytics |

No additional roles without a strong product or technical reason (#1).

## 4. Core journeys (J1–J8, from Decision #3)

J1 buyer primary path (discovery → viewing → offer → deposit) · J2 passive discovery (saved
search alerts) · J3 AI-assisted discovery · J4 agent onboarding and verification · J5 listing
lifecycle · J6 agent pipeline · J7 admin moderation · J8 notification fan-out.

## 5. Bilingual product (amends the original English-only decision — #39)

Full UI in **English and Arabic** (`/en`, `/ar`), with first-class RTL — not a translation
layer. Content (property listings, knowledge articles) may be Arabic-only, English-only, or
both, and is never machine-translated for display. See `architecture/FRONTEND.md` §RTL and
`BUSINESS_RULES.md` for the full language model.

## 6. Explicitly out of scope (v1)

Rental applications, screening, leases, recurring rent · agency/brokerage organizations · agent
subscription billing · escrow/e-signature · multi-currency · mobile apps (web only, responsive) ·
public/partner API · MLS import · ML-trained recommendations (v1 uses weighted scoring +
centroid similarity) · a dedicated search-analytics dashboard · advanced admin analytics (#28).

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
