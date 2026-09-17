# UX Patterns — Behavioural Contracts

    Status:       LOCKED (behaviour) · visual styling PROVISIONAL pending Stitch
    Last Updated: 2026-09-05
    Derived From: Decisions #5, #13, #17, #19, #21, #38, #39, #40
    Related:      ../architecture/FRONTEND.md, ../product/BUSINESS_RULES.md, DESIGN_SYSTEM.md

## 1. Purpose

Behavioural UX contracts derived from the locked state machines and API error taxonomy — what the
UI must do, not what it must look like. No visual styling is fabricated here.

## 2. Loading, empty, error states

Loading and empty states follow standard patterns per surface (skeleton for lists/dashboards,
explicit empty-state messaging for zero-result search — tied to `SearchEvent`'s zero-result
signal). Error states render from the RFC 9457 `type` + `params`, **never from `title`/`detail`**
(`../architecture/API.md` Section 5) — every error type needs a localized UI mapping, and an
unmapped type falls back to a generic message (never a raw backend string).

## 3. Verification gate UX (Decision #38)

An unverified user attempting a viewing request, offer submission, counter-offer, offer
acceptance, or deposit payment sees a clear verification CTA (`email-not-verified`, 403) — never
a silent failure or a hidden button. Browsing, search, favouriting, and saved searches remain
fully available and show no gate at all.

## 4. Payment state UX

The UI **never claims payment success on browser return** — it shows "confirming your payment"
and polls the status endpoint until the webhook/reconciliation settles it
(`../architecture/PAYMENTS.md`). During the 15-minute checkout hold, rival buyers see "another
buyer is completing payment; you'll be notified if it falls through" — never a fake "sold out."

## 5. Offer/viewing state UX

Every state-machine transition maps to an action button, not a generic "edit" form
(`../architecture/API.md` Section 4) — e.g., Accept/Counter/Withdraw as distinct actions on an
offer, mirroring `../product/BUSINESS_RULES.md` Sections 3-4. A `409 state-conflict` response
triggers a refetch and a "this has changed" banner, never a stale form resubmission.

## 6. AI streaming UX

Assistant and Agent responses stream token-by-token (SSE-adjacent, via streamed POST). The
**Property Shortlist Agent's plan unfolds visibly step by step** — "Searching... 40 matches...
narrowing to 3+ bedrooms... checking availability" — this live timeline is the intended UX, not a
loading spinner (`../architecture/AGENT.md`). Any AI-proposed state change (e.g., a viewing
request) renders as a **confirmable proposal card**, never auto-executed.

## 7. SSE-driven invalidation

Thin SSE events (`{entityType, entityId, at}`) trigger a TanStack Query invalidation/refetch —
never a direct state patch from the event payload (`../architecture/COMMUNICATION.md`). On
reconnect, the client refetches; there is no event replay to reconcile.

## 8. RTL/LTR behavioural differences — deferred (#99)

**Not a V1 requirement.** V1 is English only end to end (LTR, English content, no `dir="auto"` for
Arabic, #99). The notes below are kept for a future Arabic/RTL phase.

Directional icons (back/forward, chevrons) mirror under RTL. Form field order, table column
order, and navigation order reverse. User-generated content keeps its own direction via
`dir="auto"` regardless of the surrounding page direction (`../architecture/FRONTEND.md` Section
5).

## 9. Accessibility

WCAG 2.2 AA baseline: keyboard navigation and focus management (Radix primitives), visible focus
rings, form errors associated with their inputs via `aria-describedby`, axe-clean component
tests (`../process/TESTING.md`).

## 10. Pending verification

None for V1. V26 (RTL behaviour of component libraries) is deferred with §8 (#99).

## 11. Rejected / do not add

Optimistic UI for payment success · rendering backend `title`/`detail` strings directly · a
generic PATCH-based edit form for state transitions · silent AI-initiated state changes.

## 12. Related documents

`../architecture/API.md` for the error taxonomy these patterns render · `../product/BUSINESS_RULES.md`
for the state machines behind Sections 5-6 · `DESIGN_SYSTEM.md` for the visual constraints these
patterns will eventually be styled within.
