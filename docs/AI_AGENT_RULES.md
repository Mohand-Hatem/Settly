# AI Agent Working Rules

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #30, #42, all of #1-#42
    Related:      ../CLAUDE.md, README.md, ../DECISIONS.md

## 1. Purpose

The complete working protocol for any AI coding agent implementing Settly. `../CLAUDE.md` is the
short, auto-loaded entry point; this document is the detailed protocol it points to.

## 2. Architecture status

**CLOSED at Decision #42.** 42 decisions locked, 1 provisional (#36 Resend), 39 tables, 33
pending verifications, zero application code as of this writing. Do not treat this document, or
any Tier-B document, as an invitation to reopen architecture decisions.

## 3. Rules

1. **Read the relevant docs before implementing.** Use the routing table in `README.md`.
2. **Locked decisions #1-#42 are not casually reopenable.** A genuine, implementation-blocking
   contradiction is grounds to stop and propose a change — not to route around it silently.
3. **No coding before instructions permit it.** This documentation phase produces no application
   code; do not infer permission to start implementing from the existence of these documents.
4. **No new libraries, frameworks, or infrastructure without justification** tracing to a stated
   requirement — see every document's "Rejected / do not add" section before reaching for a
   familiar pattern.
5. **No microservices, no generic abstractions, no premature optimization.** Settly is a modular
   monolith; module boundaries (`architecture/BACKEND.md`) are enforced by ESLint, not convention.
6. **Preserve business invariants.** State machines and invariants in `product/BUSINESS_RULES.md`
   are not implementation details — changing one requires an explicit approved decision.
7. **Verify before assuming.** A `PENDING VERIFICATION` item (`../DECISIONS.md` Section 2) must
   never be implemented as if it were confirmed. Check current documentation or run the spike
   first.
8. **Distinguish an implementation choice from an architecture decision.** Folder layout,
   variable naming, and library internals are yours to decide within the locked boundaries.
   Anything that changes a business rule, a data model relationship, a security boundary, or a
   locked technology choice is not.
9. **Never bypass authorization.** Authorization lives in the service layer
   (`architecture/BACKEND.md` Section 5) — never introduce an HTTP-middleware-only check as if it
   were sufficient, and never let an AI tool or agent call anything outside that path.
10. **Never bypass payment/webhook truth.** The frontend is never authoritative for payment
    success (`architecture/PAYMENTS.md`). A browser return sets nothing.
11. **Never bypass idempotency.** The four locked idempotent operations require the
    `Idempotency-Key` header; keys live in Postgres, never Redis
    (`architecture/CONCURRENCY_AND_IDEMPOTENCY.md`).
12. **Never leak private RAG data.** The visibility filter is applied in-query, never
    post-filtered (`architecture/RAG.md` Section 4). Never let an embedding's visibility drift
    from its source's without the same-transaction sync rule.
13. **Never weaken a test to make it pass.** A failing concurrency or invariant test is a real
    defect, not a test problem — do not loosen the assertion, mock around it, or delete it.
14. **Never add retries to hide a race.** Retrying a flaky concurrency or E2E test conceals a
    genuine correctness bug (`process/TESTING.md` Section 7).
15. **Update documentation when approved behaviour changes** — the topic document, then
    `DECISIONS.md`, then the code.
16. **An undocumented behaviour is not approved** merely because it is convenient to implement.
17. **When requirements are ambiguous or missing, ask.** Do not fill the gap with an assumption
    and proceed silently.

## 4. Handling ambiguous or missing requirements

If a task requires a decision not covered by any locked document:

1. Check whether it is genuinely architectural (affects data model, security boundary, business
   rule, or a locked technology choice) or merely an implementation detail.
2. If implementation detail: make the reasonable, minimum-sufficient choice consistent with the
   conventions in `process/CONVENTIONS.md`, and note the choice inline.
3. If architectural: **stop and ask**, rather than inventing a new decision unilaterally. Do not
   fabricate a `DECISIONS.md` entry number.

## 5. Architecture boundaries that must not be crossed

See `../CLAUDE.md` Section "Architecture boundaries you must not cross" for the always-loaded
summary. This document adds no exceptions to it.

## 6. Related documents

`../CLAUDE.md` for the short always-loaded entry point · `README.md` for the full documentation
map and routing table · `../DECISIONS.md` for the complete rationale behind every rule above.
