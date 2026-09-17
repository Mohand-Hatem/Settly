# Product Requirements

    Status:       LOCKED
    Last Updated: 2026-09-17
    Derived From: Decisions #1, #3, #5, #14, #17, #19, #39, #40, #47, #49–#83
    Related:      OVERVIEW.md, BUSINESS_RULES.md, ../architecture/API.md

No new scope. This converts the approved product scope into implementation-oriented requirements.
This document folds in what a formal SRS would have covered — Decision #30 rejected a separate
SRS document; only a traceability matrix survives, at §5.

## 1. Functional requirements — by journey

| # | Requirement | Business rule / decision |
|---|---|---|
| FR1 | Buyer can search by structured filters, geography, or natural language | #14 |
| FR2 | Buyer can view a property detail page (English content in V1) | #39, #99 |
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
| FR18 | ~~UI is available in English and Arabic with full RTL~~ — **deferred: V1 is English only end to end (UI, content, search, AI); Arabic and RTL are a Future / Optional Feature** | #39, **#99** |
| FR19 | Refunds are issued per the retention/cooling-off policy | §7 BUSINESS_RULES |
| FR20 | A buyer can apply to become an agent with identity (National ID + selfie) and professional verification; an admin approves or rejects | #49 |
| FR21 | An admin can revoke an agent's verification; the agent's live listings become suspended | #52 |
| FR22 | One account can use buyer and agent capabilities; an agent cannot offer on their own listing | #50 |
| FR23 | Every user provides a phone number (not verified in V1) | #53 |
| FR24 | Resale listings record completion status; under-construction units add expected delivery and remaining instalments; `price` is the amount paid to the seller | #54, #61 |
| FR25 | Admin reviews an agent application by comparing ID and selfie manually and checking at least one professional proof; rejection needs a reason; applicants may re-apply | #55–#57 |
| FR26 | On revocation, all non-sold listings are suspended, reserved ones reviewed by an admin, open offers/viewings frozen; restoring listings needs admin review | #58 |
| FR27 | A buyer's phone is shown to the listing agent only while an offer is open; agent phones are never shown to buyers or the public; admin access is audited | #60, #66 |
| FR28 | During a revocation freeze, buyers can withdraw/cancel without penalty and expiry clocks pause; an admin decides reserved listings within 5 business days | #62–#64 |
| FR29 | An admin cannot act on a case they are personally involved in | #67 |
| FR30 | Under-construction listings show remaining instalments (total, count, frequency, end date) and the buyer's full cost | #68, #73 |
| FR31 | Admins maintain a public-holiday list; business-day deadlines use Sunday–Thursday minus holidays | #70 |
| FR32 | The first message, viewing request or offer between a buyer and a listing creates the lead | #75 |
| FR33 | The reservation deposit is shown and treated as credited toward the sale price | #76 |
| FR34 | A reserved listing becomes sold only when buyer and agent both confirm; after 30 days it goes to admin review | #77 |
| FR35 | An agent can mark a rental listing as rented, and later relist it through draft → review → published as a new lifecycle, with the rental history preserved | #78, #81 |
| FR36 | Settly earns transaction revenue from successful sales (fee and payout rules TBD) | #79 |
| FR37 | Agents hold one of exactly three plans — Free, Pro, Enterprise — limiting new listings per billing month to 2, 4 and 8; removing a listing never restores quota; quota resets each billing month; prices Free $0 · Pro $20 · Enterprise $50 per month (USD, shown in USD); paid in EGP at a fixed 48.98 EGP/USD, rounded up (980 / 2,449 EGP), with the exact EGP amount shown before checkout | #80, #89, #103 |
| FR38 | A reservation not completed within 30 days, or disputed by buyer or agent, goes to admin review; the admin confirms the sale, declares it fell through (refund rules apply) or extends the review with a reason | #82 |
| FR39 | Leads move through NEW → CONTACTED → QUALIFIED → WON / LOST, automatically on clear events (a completed sale sets WON) and manually by the agent | #83 |

## 2. Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | Filter search p95 < 120 ms; property page LCP < 2.5 s on 4G |
| Availability | Backend always-on (no scale-to-zero) — required for scheduled reconciliation (#22) |
| Reliability | Every external dependency except Postgres is non-critical (#10) |
| Security | Layered controls per `architecture/SECURITY.md`; no security theater (#33) |
| Privacy | Anonymisation on deletion, never a global soft-delete (#6, #42) |
| Accessibility | WCAG 2.2 AA target (#21) |
| i18n | **V1: English only end to end — UI, content, search, AI answers, system messages; no RTL, no `dir="auto"` for Arabic (#99)**; content never machine-translated for display (#39) |
| Testability | Every state-machine transition (49 total: Property 16 after #77/#78/#81/#102, Viewing 11, Offer 15, Payment 7; revocation and sale-review outcomes (#58, #82) still to be designed as transitions) covered at the service-test layer (#41) |
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
