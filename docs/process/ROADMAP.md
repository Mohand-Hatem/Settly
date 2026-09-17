# Implementation Roadmap

    Status:       LOCKED (phase order) · scope within each phase is implementation detail
    Last Updated: 2026-09-05
    Derived From: Decisions #29, #30
    Related:      ../product/OVERVIEW.md, all architecture/ documents

## 1. Purpose

The approved sequencing principle and phase order. This document does not invent product
features — it sequences the already-locked architecture into a buildable order.

## 2. The sequencing principle (Decision #29)

> **Do not reduce architecture because the project is portfolio-only. Reduce scope by
> sequencing.**

Recorded estimate: 39 tables, ~27 screens, a real payment state machine, four-arm hybrid search,
RAG, a bounded agent, two worker classes, nine scheduled jobs, and a seed corpus is 4-8 months of
solo part-time work. The failure mode for a project this size is not bad architecture — it is
months of foundation with nothing to show before motivation runs out.

## 2a. Current position (2026-09-17, Decision #48)

This document and `IMPLEMENTATION_PLAN.md` are the V1 source of truth. `../SETTLY_MASTER_PLAN.md`
and `../phases/*` are non-authoritative. Application code now exists (identity, catalog and
public discovery pages, partially); see `../discovery/01-system-audit.md`. The next work is to
finish the **vertical slice** below.

## 3. Phase order

| Phase | Status | Scope |
|---|---|---|
| **Architecture** | **COMMITTED — closed at Decision #42** | Decisions #1-#42, five living Tier-A documents |
| **Tier-B Documentation** | **COMMITTED — this phase** | 30 documents derived from the closed architecture |
| **Vertical slice** (~6 weeks target) | Future | `auth → properties → search → property detail → viewing request` — end-to-end, demonstrable |
| **Layer: transactional core** | Future | Offers → payments → messaging → notifications |
| **Layer: intelligence** | Future | Hybrid search → RAG → AI assistant → Shortlist Agent |
| **Layer: operations** | Future | Advanced admin, analytics surfacing, deployment |
| **Stitch design phase** | Future | Visual design exploration, constrained by `design/DESIGN_SYSTEM.md`'s locked constraints |
| **Deployment/rollout** | Future | Vercel + Railway + Supabase, per `../architecture/INFRASTRUCTURE.md` |

## 4. Explicitly excluded from any phase

Rental lifecycle, agency organizations, escrow/e-signature,
multi-currency (subscriptions: USD price, EGP charge at a fixed rate, #103; no toggle), mobile apps, a public/partner API, ML-trained recommendations, a
search-analytics dashboard, advanced admin analytics — all out of scope per `../product/OVERVIEW.md`
Section 6, not deferred features.

**No longer excluded (#79, #80):** transaction revenue and the agent listing subscription (exactly
three plans: Free, Pro, Enterprise). **Their place in the phase order is OPEN** — to be decided
before any of it is built. Nothing about them changes the vertical-slice definition below.

## 5. Verification items as pre-work

Twelve pending-verification items block coding directly (`../DECISIONS.md` Section 2.1): 8 before
the first migration, 3 before the first endpoint, 1 before CI is wired. These are one-hour spikes
or documentation reads — schedule them at the start of the vertical-slice phase, not as
architecture work.

## 6. Step-level detail

Step-by-step breakdown of every phase above — verification spikes, scaffolding, and the ordered
task list for the vertical slice — lives in `IMPLEMENTATION_PLAN.md`. This document stays the
phase-order source of truth; that one is the execution checklist.

## 7. Related documents

`../product/OVERVIEW.md` for scope boundaries · `../DECISIONS.md` for the full pending-
verification tracker · `IMPLEMENTATION_PLAN.md` for step-level execution detail · every
`architecture/` document for what each phase builds against.
