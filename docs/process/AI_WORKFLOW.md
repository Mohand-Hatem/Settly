# AI Workflow — Settly Product Engineering Governor

    Status:       LOCKED (process) · applies to every AI agent working on Settly
    Last Updated: 2026-09-19
    Related:      ../../AGENTS.md, ../../CLAUDE.md, ../AI_AGENT_RULES.md, ../DECISIONS.md

> The same rules are loaded in Claude Code as the `settly-governor` skill. This file is the copy every
> AI tool can read. **If a decision in `docs/DECISIONS.md` disagrees with this file, the decision wins.**

## Purpose

This skill is the primary workflow governor for the Settly project.

Its job is to prevent premature implementation, preserve product decisions, protect source-of-truth boundaries, enforce design-first development, and ensure every implementation step is traceable to an approved requirement.

This skill does not replace domain-specific technical skills. It governs HOW work is performed.

---

## 1. Project context

Settly is an Egypt-focused, production-oriented real-estate platform.

Core characteristics:

- Egypt / EGP
- English-only in V1
- Arabic/RTL is a future/optional feature
- Modular monolith
- No microservices
- Production-style architecture
- Real business workflows, not a toy MVP
- No invented business behavior
- No mock data in application implementation unless explicitly requested for visual/design work

Primary portals:

```text
/buyer/*
/agent/*
/admin/*
```

Portal model:

- USER = Buyer
- AGENT = Buyer + Agent after verification
- ADMIN = Buyer + Admin
- ADMIN has no Agent powers

Global shared concepts:

- Portal Switcher
- Notification Center
- Messages
- Profile & Settings
- Responsive design
- Shared loading/empty/error/success/disabled patterns
- Confirmation for high-impact actions

## 2. Design source of truth

The primary frontend design evidence directory is:

`C:\Users\Mohand\Documents\GitHub\Settly\docs\design\candidates\settly-landing`

Always inspect the actual files in this directory before making conclusions about existing designs.

Never assume a screen exists because:

- its filename sounds correct;
- a route exists;
- a component exists;
- another tool generated a screen;
- a screenshot exists elsewhere.

Classify design evidence as:

- EXISTS
- PARTIAL
- CONTRADICTORY
- OUTDATED
- MISSING
- NOT NEEDED

Never silently treat contradictory or outdated mockups as valid.

## 3. Document sources

Use these sources in this order:

**Product decisions**

- `docs/DECISIONS.md`
- `docs/product/BUSINESS_RULES.md`

**Architecture** — `docs/architecture/*`, especially:

- `FRONTEND.md`
- `AUTH.md`
- `PAYMENTS.md`
- `DOMAIN_MODEL.md`
- `CONCURRENCY_AND_IDEMPOTENCY.md`

**Discovery / Planning**

- `docs/discovery/03-frontend-screen-audit.md`
- `docs/discovery/04-frontend-design-plan.md`
- `docs/discovery/05-final-frontend-screen-inventory.md`

**Implementation planning** — respect, when these are defined as authoritative:

- `docs/process/ROADMAP.md`
- `docs/process/IMPLEMENTATION_PLAN.md`

Do not create competing sources of truth.

## 4. Decision discipline

Treat explicitly confirmed decisions as locked.

Do not:

- reopen confirmed decisions;
- replace decisions with personal recommendations;
- infer missing business rules;
- invent prices;
- invent policy;
- convert a suggestion into a decision.

When a requirement is missing or ambiguous:

1. identify it;
2. explain why it matters;
3. mark it OPEN;
4. stop implementation of the dependent area.

Never silently choose a business rule.

## 5. Design-first gate

Before implementing any user-facing feature, verify:

```text
Decision
↓
Screen
↓
Route
↓
Sections
↓
States
↓
Actions
↓
Dependencies
↓
Acceptance Criteria
```

If a screen is missing:

- identify it as NEW DESIGN;
- do not invent the UI;
- create a design requirement/specification;
- wait for design approval when the workflow requires it.

If an existing mockup contradicts a confirmed decision:

- mark it CONTRADICTORY;
- explain the contradiction;
- do not implement from the contradictory design.

## 6. Screen specification requirement

Every non-trivial frontend screen must have a specification before implementation.

Minimum specification:

```text
Screen name
Role
Route
Purpose
Entry points
Sections
Primary actions
Secondary actions
States
Permissions
Dependencies
API requirements
Loading behavior
Empty behavior
Error behavior
Success behavior
Disabled behavior
Mobile behavior
Desktop behavior
Acceptance criteria
Definition of done
```

Do not create a full screen spec for tiny shared components unless necessary.

## 7. Routing discipline

V1 portal routing is:

```text
/buyer/*
/agent/*
/admin/*
```

Do not introduce the following without an explicit new decision:

```text
/dashboard/*
/buyer-dashboard/*
```

Routes must be resource-oriented. Example:

```text
/buyer/offers
/agent/listings
/agent/listings/new
/admin/moderation
```

A route conflict must be reported as a planning issue before implementation.

## 8. UI structure rules

Use these defaults unless an approved decision overrides them:

- **Main workflows:** full pages.
- **Contextual actions:** modal/drawer.
- **Resource lifecycle:** keep lifecycle states inside the resource workflow. Do not create one screen per status unless there is a real workflow reason.
- **Data-heavy screens:** tables where appropriate on desktop; cards/list representation where appropriate on mobile.
- **Large lists:** server-side pagination by default.
- **Navigation:**
  - Desktop: portal navigation.
  - Mobile: bottom navigation for primary areas; More/Menu for secondary areas.
  - Deep workflows: breadcrumbs when useful.

## 9. State discipline

Every async/data-driven workflow must explicitly consider:

- loading
- empty
- error
- success/feedback
- disabled
- permission denied where applicable

Business states must be represented exactly as documented.

Do not simplify a complex business lifecycle into `Active / Inactive` when the product has multiple real states.

## 10. Business rule traceability

Every implementation item must identify:

- the decision/business rule supporting it;
- the affected role;
- the affected screen;
- the expected user action;
- the backend/API dependency;
- the relevant acceptance criteria.

Example:

```text
Feature:       Listing waiting for quota
Business rule: S15–S22 / quota decisions
Role:          Agent + Admin
Frontend:      Agent Listings, Agent Listing Details, Admin Moderation
State:         Approved — Waiting for Quota
Behavior:      Automatic FIFO publication when quota becomes available
```

## 11. No invented UI

Do not invent:

- new business workflows;
- unsupported fields;
- unsupported buttons;
- fake analytics;
- placeholder numbers presented as real;
- undocumented user actions;
- unsupported integrations.

Visual/demo content is allowed only when clearly non-functional.

For example, WhatsApp may appear as a visual/demo CTA, but:

- no real Agent phone may be exposed;
- no real WhatsApp contact is implied;
- no private contact information may be revealed.

## 12. Payment safety

Treat payment-related UI as high-risk.

Never invent:

- prices;
- refunds;
- payment states;
- billing periods;
- saved-card behavior;
- tax behavior.

Current subscription rules include:

```text
Free       = 2 publications/month
Pro        = 4
Enterprise = 8
```

Subscription prices (#89): **Free $0 · Pro $20 · Enterprise $50 per month, base currency USD**, shown
in USD with **no currency toggle**. The payment is **charged in EGP at the fixed V1 rate 1 USD = 48.98
EGP** (#103): `USD × 48.98`, rounded up to a whole EGP (Pro 980, Enterprise 2,449). The exact EGP amount
is shown before the Paymob redirect. There is no live exchange rate, rate provider or refresh job.
Real-estate and deposit amounts stay in EGP.

V1:

- every paid period lasts **30 full days from its start time**, at the **full plan price** — no
  proration, no credit (#104): first subscription, re-subscription, upgrade and renewal;
- an upgrade charges the full new-plan price and starts a new 30-day period immediately;
- a downgrade applies when the current period ends;
- early renewal (same plan): only in the last 7 days, starts when the current period ends, one
  queued period max, no upgrade while a renewal is queued;
- a period is exactly 720 hours from its start (UTC), not "same date next month";
- Paymob Hosted Checkout; no saved-card requirement.

The subscription period (30 days from start) and the listing quota month (Cairo calendar month, reset
on the 1st) are separate cycles. Never merge them.

If payment behavior is ambiguous, mark it OPEN.

## 13. Listing lifecycle safety

The listing lifecycle must remain consistent with the product rules.

Important states include:

```text
DRAFT
PENDING_REVIEW
PUBLISHED
RESERVED
RENTED
SOLD
SUSPENDED
REJECTED
```

Special internal/UI state: `Approved — Waiting for Quota`. This remains `PENDING_REVIEW`.

- Never bypass Admin review.
- Never allow Agent-only publication shortcuts.
- Never allow Agent to independently mark a listing SOLD.

## 14. Quota safety

Current quota:

```text
Free       = 2
Pro        = 4
Enterprise = 8
```

Quota meaning:

- new first publications during the calendar month;
- Cairo calendar month;
- resets on the 1st;
- draft creation does not consume quota;
- submission does not consume quota;
- first publication consumes quota;
- relisting consumes quota;
- approved waiting listings publish FIFO when quota is available;
- no waiting queue cap.

Submission with exhausted quota:

- allowed;
- warning shown;
- listing may be reviewed;
- approval does not bypass quota.

Concurrent approval must never exceed quota. Enforcement uses the existing per-user database lock.

## 15. Map rules

V1: `Leaflet + MapTiler`.

Do not migrate to MapLibre unless a new decision explicitly requires it.

MapTiler key env var: `NEXT_PUBLIC_MAPTILER_KEY`. Never expose actual credentials.

## 16. Role / portal rules

Portal availability:

| Role  | Portals       |
|-------|---------------|
| USER  | Buyer         |
| AGENT | Buyer, Agent  |
| ADMIN | Buyer, Admin  |

Admin must never have Agent portal powers.

Portal switching is a shared/global pattern.

## 17. Implementation gate

Before writing code for a phase, produce:

- **Phase Goal** — what user/business problem is solved?
- **Area** — which product area?
- **Dependencies** — business decisions, backend, APIs, database, payments, storage, notifications, design.
- **Screens** — exact screens affected.
- **Routes** — exact intended routes.
- **States** — all relevant states.
- **API / Backend Impact** — required endpoints or dependencies.
- **Database Impact** — required only if explicitly necessary.
- **Files** — exact files expected to change.
- **Acceptance Criteria** — observable, testable behavior.
- **Definition of Done** — what must be true before the phase is complete?
- **Risks** — known contradictions or unresolved issues.

Then: **STOP AND WAIT FOR EXPLICIT APPROVAL.**

Never implement immediately after presenting the plan.

## 18. Implementation discipline

After explicit approval:

1. Re-read the approved plan.
2. Verify the current repository state.
3. Inspect related code before modifying it.
4. Make the smallest change that satisfies the approved scope.
5. Do not opportunistically refactor unrelated code.
6. Do not introduce abstractions without need.
7. Keep the modular monolith architecture.
8. Do not create microservices.
9. Avoid premature optimization.
10. Avoid speculative features.

## 19. Test / verification gate

After implementation, verify:

**Functional**

- acceptance criteria;
- permissions;
- lifecycle states;
- edge cases;
- error paths.

**Technical**

- type checks;
- lint;
- tests;
- build;
- relevant integration behavior.

**Security**

- no secrets;
- no unauthorized data exposure;
- no role escalation;
- no public phone leakage;
- payment safety.

**Repository scope** — run:

```text
git status
git diff --stat
git diff
```

Confirm only intended files changed. Generated files must not be included accidentally.

## 20. Documentation update gate

After successful implementation, update only the appropriate documentation. Possible updates:

- `DECISIONS.md`
- `BUSINESS_RULES.md`
- architecture docs
- implementation plan
- phase documentation
- discovery/gap analysis

Never silently change business meaning during documentation updates.

## 21. Change report

Every completed task must end with:

- **Implemented** — exact behavior implemented.
- **Files Changed** — exact files.
- **Tests / Verification** — what was run and the result.
- **Documentation Updated** — exact docs.
- **Remaining Issues** — only genuinely unresolved items.
- **Scope Verification** — confirm whether:
  - unrelated files changed;
  - generated files changed;
  - application code changed;
  - schema changed;
  - APIs changed.

## 22. Dry run rule

For any task that modifies multiple files or has meaningful risk, perform a dry run first. Report:

```text
Files to change
Why each file changes
Expected modifications
Potential contradictions
Potential side effects
```

Then wait for explicit approval before implementation, unless the user has already explicitly approved the exact implementation plan.

## 22a. Version control

**Never commit or push.** The user commits and pushes Settly changes themselves. Finish every task
with the change report (§21) and, if useful, a suggested commit message.

## 23. Diff gate

After every meaningful implementation task, inspect:

```text
git status
git diff --stat
git diff
```

Do not accept a task as complete until:

- only intended files changed;
- no unrelated generated files are included;
- no secrets were introduced;
- no accidental refactor occurred.

## 24. Absolute stop conditions

STOP and ask for clarification / approval when:

- a confirmed business rule conflicts with implementation;
- a screen does not exist and design is required;
- a route is ambiguous;
- payment behavior is ambiguous;
- role permissions are ambiguous;
- a database change is not justified;
- a new dependency is required;
- implementation would require changing an authoritative decision;
- a design mockup contradicts the confirmed product behavior.

Do not resolve business ambiguity by guessing.

## 25. Current project priority

**Position (2026-09-19):** discovery and screen inventory are done, and **slice 1 is delivered**
(branch `feat/slice-1`: auth fixes, portal shells, viewing pipeline V1–V11, property page, buyer and
agent viewing screens). See the "Status" note in `docs/process/IMPLEMENTATION_PLAN.md` §7.

Every new area follows the same cycle:

```text
1. Screen specifications (like docs/discovery/06-slice-1-screen-specs.md)
2. Resolve any OPEN product decisions the area depends on
3. Implementation plan (files, routes, states, API, tests, risks)
4. STOP — explicit user approval
5. Implementation
6. Verification (tests, type-check, lint, build, browser)
7. Documentation update and change report
```

Next, in order:

1. **Cleanup:** remove or hide the fake public AI-assistant widget; stop the public property API from
   returning the agent's email; remove the agent-only `offline-sale` / `mark-sold` endpoints (#102).
2. **Transactional core (#48):** Offers (specs + plan first) → deposit payments (Paymob sandbox;
   reconcile deposit enums with BUSINESS_RULES §5, #105) → messaging → notifications (including the
   viewing events that currently notify nobody).

Do NOT jump directly to implementation.

## 26. Language

- V1 frontend UI/content: English only.
- Arabic/RTL: future / optional feature.

Do not add Arabic routes or RTL screens during V1 unless explicitly requested later.

## 27. General principle

Prefer:

```text
Simple
Traceable
Explicit
Documented
Production-safe
```

Avoid:

```text
Overengineering
Speculation
Duplicate abstractions
Fake UI
Fake data
Premature implementation
Silent business-rule assumptions
```

When in doubt:

**inspect → document → plan → ask for approval → implement → verify → update docs**
