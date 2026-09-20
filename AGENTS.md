# Settly — Instructions for AI Agents (Codex, Gemini, Cursor, Copilot, Claude and others)

Settly is an AI-assisted real-estate platform for Egypt: buyers discover properties, request viewings,
make offers and pay a reservation deposit; agents manage listings and their pipeline; admins moderate.
It is a portfolio project built production-style: modular monolith, TypeScript throughout,
`frontend/` (Next.js) and `backend/` (Express 5 + Prisma + PostgreSQL) as independent projects.

## 1. Read these first, in this order

1. `CLAUDE.md` — architecture boundaries you must not cross
2. `docs/process/AI_WORKFLOW.md` — **the work cycle and rules (mandatory)**
3. `docs/README.md` — documentation map and task → documents routing table
4. `docs/DECISIONS.md` — §1 summary table, §2 pending verifications, and every decision from #45 on
5. `docs/product/BUSINESS_RULES.md` — state machines, invariants, constants
6. `docs/discovery/05-final-frontend-screen-inventory.md` — every V1 screen, route and status
7. `docs/discovery/06-slice-1-screen-specs.md` — the spec format to follow for new screens
8. `docs/process/IMPLEMENTATION_PLAN.md` §7 "Status" — what is built and what comes next

`docs/` is the source of truth. The API reference and ERD are generated from code; never hand-edit
`docs/generated/`.

## 2. The work cycle (never skip a step)

```text
inspect docs + code → screen specs → implementation plan → STOP for user approval
→ implement the smallest change → verify (tests, type-check, lint, build, browser)
→ update docs → change report
```

## 3. Non-negotiable rules

- **Never commit or push.** The user does it. End with the list of changed files.
- Never change a locked decision or business rule without asking. If something in the docs looks
  wrong, stop and propose a decision change.
- Never invent prices, business rules, fields, figures or fake UI data. Missing rule → mark it OPEN
  and ask.
- **V1 is English only end to end** (#99). No Arabic/RTL work.
- Portals are `/buyer/*`, `/agent/*`, `/admin/*` (#100). USER = buyer; AGENT = buyer + agent;
  ADMIN = buyer + admin, never agent powers (#97).
- No agent phone number is ever public (#60). Agents never make a listing SOLD alone (#102).
- Maps: Leaflet + MapTiler, key from `NEXT_PUBLIC_MAPTILER_KEY` (#96).
- Prisma only in `repository/`; raw SQL only in `sql/`; modules talk only through service
  interfaces; authorization in the service layer.
- Never ask for, print or write real secrets into code or docs. If a feature needs credentials, ask
  the user to add them to their local `.env`.

## 4. Where the project is (2026-09-19)

**Done:** architecture and discovery (decisions up to #106), final screen inventory, **slice 1**
(auth, portal shells and switcher, viewing pipeline V1–V11, property page, viewing screens), and
**cleanup** (fake AI widget hidden, agent email removed from public property API, agent-only
`offline-sale` / `mark-sold` endpoints removed per #102).

**Next, in order:**

1. Transactional core: **Offers** (write specs and a plan first) → deposit payments (Paymob sandbox;
   reconcile deposit enums with BUSINESS_RULES §5, #105) → messaging → notifications.

## 5. Running and testing

- Backend: `npm --prefix backend run dev:api` (port 4000). Tests: `npm --prefix backend test`, plus
  `npm --prefix backend run test:viewings`. After changing routes: `npm --prefix backend run
  generate:openapi`, then `npm --prefix frontend run generate:types`.
- Frontend: `npm --prefix frontend run dev` (port 3000). Checks: `npx tsc --noEmit`, `npm run lint`,
  `npm run build` inside `frontend/`.
- Demo agent login: `SEED_DEMO_PASSWORD=<choose one> npm --prefix backend run seed:slice1-demo`, then
  sign in as `hana.k@settly.estate`.

## 6. Frontend design directive

- Follow the `impeccable` skill in `.agents/skills/impeccable/SKILL.md` for any UI work.
- Visual language: "Navy & Brass" candidate (`docs/design/candidates/settly-landing/DESIGN.md`) —
  Deep Navy `#131D36` / `#1E2A4A`, Brass `#C69749` / `#AE8033`, Bone canvas `#F7F6F3`, Sage `#3D5A4C`;
  Spectral headlines, Plus Jakarta Sans body, JetBrains Mono for numbers (EGP, m², times).
- Premium **feel**, whole-market **content** (#45): no "luxury-only", "sovereign" or "institutional"
  copy.
- Mockups in `docs/design/candidates/` are evidence, not truth: several contradict decisions (see
  inventory 05 §D). Never build from a contradictory mockup.
- Rendering follows `docs/architecture/FRONTEND.md`: public pages ISR without per-user cookies;
  portal pages are client-rendered shells. Every async view needs loading, empty, error, success and
  disabled states; errors are shown from the problem `type`, never the backend message.
