# Product Requirements

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #1, #3, #5, #14, #17, #19, #39, #40
    Related:      OVERVIEW.md, BUSINESS_RULES.md, ../architecture/API.md

No new scope. This converts the approved product scope into implementation-oriented requirements.
This document folds in what a formal SRS would have covered — Decision #30 rejected a separate
SRS document; only a traceability matrix survives, at §5.

## 1. Functional requirements — by journey

| # | Requirement | Business rule / decision |
|---|---|---|
| FR1 | Buyer can search by structured filters, geography, or natural language | #14 |
| FR2 | Buyer can view a property detail page with bilingual content | #39 |
| FR3 | Buyer can favourite properties and manage collections | Decision #3 |
| FR4 | Buyer can save a search with an alert cadence, max 25 per user | I11 |
| FR5 | Buyer can request a viewing, subject to email verification and max 3 open requests | V1, I9 |
| FR6 | Agent can confirm/decline/reschedule a viewing; exclusivity at CONFIRMED | V2–V11 |
| FR7 | Buyer can submit an offer, subject to email verification and max 5 live offers | O1, I12 |
| FR8 | Buyer/agent can counter, accept, reject, withdraw an offer per the state machine | O2–O14 |
| FR9 | Accepted offer creates a deposit obligation; deposit is the commitment point | O4/O5, §6 BUSINESS_RULES |
| FR10 | Buyer can pay a deposit via Paymob hosted checkout, subject to a 15-min exclusive hold | Y1–Y7, #11, #13 |
| FR11 | Webhook + reconciliation are the sole source of payment truth | #13 |
| FR12 | Agent can create, edit, submit, publish, archive listings; two-tier edit moderation | P1–P14 |
| FR13 | Admin can moderate, verify agents, triage reports, suspend accounts | #28 |
| FR14 | Buyer/agent can message within a lead's conversation | Decision #3 |
| FR15 | User receives in-app notifications (authoritative) + email + push (best-effort) | #10 |
| FR16 | Buyer can use an AI assistant with RAG-grounded answers and citations | #17 |
| FR17 | Buyer can invoke the Property Shortlist Agent for multi-constraint discovery | #19 |
| FR18 | UI is available in English and Arabic with full RTL | #39 |
| FR19 | Refunds are issued per the retention/cooling-off policy | §7 BUSINESS_RULES |

## 2. Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | Filter search p95 < 120 ms; property page LCP < 2.5 s on 4G |
| Availability | Backend always-on (no scale-to-zero) — required for scheduled reconciliation (#22) |
| Reliability | Every external dependency except Postgres is non-critical (#10) |
| Security | Layered controls per `architecture/SECURITY.md`; no security theater (#33) |
| Privacy | Anonymisation on deletion, never a global soft-delete (#6, #42) |
| Accessibility | WCAG 2.2 AA target (#21) |
| i18n | Full EN/AR with RTL, content never machine-translated for display (#39) |
| Testability | Every state-machine transition (47 total: Property 14, Viewing 11, Offer 15, Payment 7) covered at the service-test layer (#41) |
| Cost | Per-user and global AI rate limits mandatory — AI is the only unbounded cost (#17, #33) |

## 3. Scope boundary

See `OVERVIEW.md` §6 for the explicit out-of-scope list. This document does not expand it.

## 4. Acceptance orientation

Every FR above maps to one or more state-machine transitions in `BUSINESS_RULES.md` and one or
more API action endpoints in `architecture/API.md` (Decision #40, §2: "state transitions are
action endpoints"). An implementation is acceptance-complete for a journey when its transition
table, guards, and action endpoints are all present and tested at the service layer (#41).

## 5. Traceability matrix (condensed)

| Requirement | Business rule | API surface | Test layer |
|---|---|---|---|
| FR5 viewing request | V1 (§3 BUSINESS_RULES) | `POST /viewings` | Service + Concurrency (I9) |
| FR7 submit offer | O1 (§4) | `POST /offers` | Service + Concurrency (I12) |
| FR9/FR10 deposit | O4/O5, Y1-Y7 (§4-6) | `POST /offers/:id/accept`, `/uploads/authorize`... | Service + Concurrency + Payment tests |
| FR12 listing lifecycle | P1-P14 (§2) | `POST /properties/:id/submit|publish|...` | Service |
| FR16 AI assistant | RAG boundary (#17, #42) | `POST /ai/messages` (stream) | AI deterministic + offline eval (report) |
| FR17 Shortlist Agent | Agent bounds (#19) | `POST /ai/agent-runs` (stream) | Agent controller tests + record/replay |

## 6. Related documents

`BUSINESS_RULES.md` for full transition tables · `architecture/API.md` for the contract ·
`process/TESTING.md` for how each requirement is verified.
