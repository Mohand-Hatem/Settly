# Roles and Permissions

    Status:       PROVISIONAL — confirmed rows are LOCKED; rows marked OPEN await a decision
    Last Updated: 2026-09-17
    Derived From: Decisions #1, #9, #28, #38, #42, #49–#97
    Related:      OVERVIEW.md §3, BUSINESS_RULES.md §9 and §11, ../architecture/AUTH.md,
                  ../discovery/02-gap-analysis.md (section B)

Who may do what in Settly. **Authorization is enforced in the service layer**, never in HTTP
middleware or the UI (#8). The frontend only hides what a user cannot do.

Row status: **CONFIRMED** (decided) · **OPEN** (needs a decision) · **PROPOSED** (recommended,
awaiting approval) · **FUTURE** (explicitly deferred).

## 1. Actors

| Actor | Who | Status |
|---|---|---|
| **Visitor** | Not signed in | CONFIRMED |
| **Buyer** | Any registered user. Every account starts here (#49) | CONFIRMED |
| **Agent** | A buyer whose agent application was approved (identity + professional verification). Keeps all buyer capabilities (#50) | CONFIRMED |
| **Admin** | Platform operator (#28). May also act as a buyer; may not list (#59). Created only by seed or a controlled CLI/script (#97) | CONFIRMED |
| **System** | Scheduled jobs and webhooks acting on state machines (#10) | CONFIRMED |
| **AI assistant / Shortlist Agent** | Acts **as the signed-in user**, read-only; any write is a proposal the user confirms (#17, #19) | CONFIRMED |
| Owner (for-sale-by-owner) | — | FUTURE (#51) |
| Agency / brokerage organization | — | Rejected (#1) |

**Role model (#97):** one role per account — **USER** = buyer · **AGENT** = buyer + agent (after
verification) · **ADMIN** = buyer + admin, without agent/listing powers. One login; the frontend
offers a switch between the applicable portals (Buyer, Agent, Admin). No in-app promotion to admin.

## 2. Account and identity

| Capability | Visitor | Buyer | Agent | Admin | Status |
|---|---|---|---|---|---|
| Register (always as buyer) | ✅ | — | — | — | CONFIRMED (#49) |
| Provide a phone number (required at sign-up, international allowed, unverified) | ✅ at sign-up | ✅ | ✅ | ✅ | CONFIRMED (#53, #60) · Google sign-in completion step: OPEN |
| Verify email | — | ✅ | ✅ | ✅ | CONFIRMED (#9, #38) |
| Edit own profile | — | ✅ | ✅ | ✅ | CONFIRMED |
| Apply to become an agent (National ID + selfie + at least one professional proof) | — | ✅ | — | — | CONFIRMED (#49, #55) |
| Re-apply after rejection (no waiting period; one pending application at a time) | — | ✅ | — | — | CONFIRMED (#57, #74) |
| Review / approve / reject agent applications (manual ID-vs-selfie check; rejection reason mandatory) | — | — | — | ✅ | CONFIRMED (#49, #56, #57) |
| View applicants' identity documents | — | — | — | ✅ via an audited path | CONFIRMED (#39, #42, #56) · retention period: after legal review (#57, V35) |
| Revoke agent verification (all non-SOLD listings suspended; reserved ones reviewed; offers/viewings frozen) | — | — | — | ✅ | CONFIRMED (#52, #58) · state-machine design: OPEN |
| Restore listings after re-verification | — | — | — | ✅ review formerly public listings (drafts/archived return automatically) | CONFIRMED (#58, #65) |
| Decide a reserved listing after revocation (release only once re-verified, or cancel with full refund) within 5 business days; missed deadline = automatic cancel + 100% refund | — | — | — | ✅ | CONFIRMED (#64, #69, #70) |
| Maintain the public-holiday list used for business days | — | — | — | ✅ | CONFIRMED (#70) |
| Withdraw / cancel a frozen offer or viewing without penalty | — | ✅ | ✅ | ✅ | CONFIRMED (#62) |
| Suspend (ban) any account; immediate effect | — | — | — | ✅ | CONFIRMED (#9, BUSINESS_RULES §11.1) |
| Delete own account (anonymisation) | — | ✅ | ✅ | ? | CONFIRMED (#42) · admins: OPEN |
| Admins act as buyer | — | — | — | ✅ | CONFIRMED (#59) |
| Handle a case the admin is personally involved in (offer, viewing or conversation on the listing or with the agent) | — | — | — | ❌ another admin must | CONFIRMED (#67, #71) |
| Admins act as agent / list properties | — | — | — | ❌ | CONFIRMED (#59) |

## 3. Listings

| Capability | Visitor | Buyer | Agent | Admin | Status |
|---|---|---|---|---|---|
| Browse, search, view published listings | ✅ | ✅ | ✅ | ✅ | CONFIRMED |
| Create and submit a listing (resale or rental); publication limited by the plan's monthly quota (Free 2 · Pro 4 · Enterprise 8) | — | — | ✅ verified only | ❌ | CONFIRMED (#51, #59, #80, #86, #95) |
| Choose / change subscription plan (exactly three plans); pay per 30-day period via hosted checkout (full price, #104); cancel any time (no refund) | — | — | ✅ | — | CONFIRMED (#80, #89–#92) · prices $0 / $20 / $50 per month, USD base |
| See remaining quota; get a warning when submitting with none left; get notified when a waiting listing publishes | — | — | ✅ | — | CONFIRMED (#94) |
| Edit, submit, archive, relist **own** listing | — | — | ✅ owner only | — | CONFIRMED (BUSINESS_RULES §9) |
| Approve, reject, suspend, reinstate any listing (approval of a no-quota listing leaves it Approved, Waiting for Quota) | — | — | — | ✅ (reason required where stated) | CONFIRMED (P3, P4, P12, P13, #94) |
| Promote a user to admin in the app | — | — | — | ❌ (seed / controlled script only) | CONFIRMED (#97) |
| Use the buyer portal with the same login, and switch portals | — | ✅ | ✅ | ✅ | CONFIRMED (#97) |
| Confirm sale completion of a reserved listing (both parties must confirm) | — | ✅ buyer party | ✅ owner | — | CONFIRMED (#77) |
| Review a reservation not completed within 30 days, or disputed by the parties; request evidence if needed; confirm SOLD, declare fell-through, or extend with a reason | — | — | — | ✅ (not if personally involved) | CONFIRMED (#77, #82) · extension limits: TBD |
| Record a fall-through (reason required) | — | — | ✅ owner | ✅ | CONFIRMED (P10) |
| Mark a listing `SOLD` alone (offline sale or agent-only completion) | — | — | ❌ | — | **Forbidden (#102)** — deals agreed off-platform go through O1b and two-party confirmation |
| Mark own rental listing as rented | — | — | ✅ owner | — | CONFIRMED (#78) |
| Relist a rented property (new draft → review → published lifecycle) | — | — | ✅ owner | ✅ reviews it | CONFIRMED (#81) |

## 4. Buyer journey

| Capability | Visitor | Buyer | Agent (as buyer) | Admin | Status |
|---|---|---|---|---|---|
| Favourite, save searches (max 25) | — | ✅ | ✅ | ✅ | CONFIRMED (FR3, FR4, #59) |
| Request a viewing (email verified; max 3 open) | — | ✅ | ✅ not on own listing | ✅ | CONFIRMED (V1, I9, #59) |
| Make an offer on a **sale** listing (email verified; max 5 live) | — | ✅ | ✅ **never on own listing** | ✅ | CONFIRMED (O1, I12, #50, #59) |
| Pay the reservation deposit (5% of `price`, cap 50,000 EGP; sandbox in the demo) | — | ✅ offer party | ✅ offer party | ✅ offer party | CONFIRMED (#13, #47, #61) |
| Message an agent about a listing | — | ✅ | ✅ not about own listing | ✅ | CONFIRMED (FR14, #59) |
| Offers or payments on rentals | — | ❌ | ❌ | — | CONFIRMED (#1) |

## 5. Agent pipeline

| Capability | Agent | Admin | Status |
|---|---|---|---|
| Confirm / decline / complete / no-show a viewing on own listing | ✅ owner | — | CONFIRMED (§9) |
| Respond to (counter, accept, reject) offers on own listing | ✅ owner | — | CONFIRMED (O-transitions) |
| Record an offline-agreed offer for a buyer (O1b) — never naming themselves | ✅ owner | — | CONFIRMED (#59) |
| Move own leads between stages (NEW → CONTACTED → QUALIFIED → WON / LOST); set LOST | ✅ owner (system also advances automatically) | — | CONFIRMED (#83) · automatic rules: TBD |
| See a buyer's phone number | ✅ while that buyer has a pending, accepted, reserved or completed offer (buyer- or agent-recorded) on the agent's listing | ✅ support/moderation, audited | CONFIRMED (#60, #66, #72) |
| Show own phone publicly, or to buyers | ❌ never | — | CONFIRMED (#60, #66) |

## 6. Governance

| Capability | Admin | Status |
|---|---|---|
| Moderation queue, moderation actions | ✅ | CONFIRMED (#28) |
| Audit-log viewer | ✅ | CONFIRMED (#28) |
| Reports / abuse workflow | ✅ | CONFIRMED (#28) · who can file a report and about what: OPEN |
| Download any document (audited path, never into AI context) | ✅ | CONFIRMED (§9) |

## 7. Rules that always apply

- A **suspended** account loses access immediately (§9).
- **Email verification** is required only to create or advance a commitment; never to read,
  withdraw or cancel (§9.1).
- **Ownership** is checked on every resource action; 404 when the actor may not know a resource
  exists, 403 when they may know but may not act (#40).
- Identity documents and phone numbers never appear in `AuditLog.metadata` (#42).

## 8. Rejected / do not add

Agency or brokerage permission layers (#1) · owner listings in V1 (#51) · phone number as a
login or verification channel in V1 (#53) · offers on rentals (#1) · a separate admin module
with its own authorization model (#8).
