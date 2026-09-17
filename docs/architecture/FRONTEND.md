# Frontend Architecture

    Status:       LOCKED
    Last Updated: 2026-09-17
    Derived From: Decisions #4, #10, #21, #23, #39, #40, #43, #44, #96, #97, #99, #100
    Related:      API.md, ../design/DESIGN_SYSTEM.md, ../GLOSSARY.md Section 11

## 1. Purpose

Rendering strategy, state ownership, portal routes, the V1 language scope (English only, #99), and
the language distinctions that must never be conflated.

**V1 scope (#99, #100).** The V1 frontend is **English only**: no `/ar/*` routes, no `/[locale]`
segment, no RTL implementation. Portals live under **`/buyer/*`**, **`/agent/*`** and **`/admin/*`**.

## 2. Five rendering modes — never collapsed into fewer

| Mode | Routes | Revalidation |
|---|---|---|
| **SSG** (build-time only) | `/about`, `/contact`, `/how-it-works`, `/privacy`, `/terms`, auth shells | Deploy |
| **Static + on-demand** | `/areas`, `/areas/[slug]`, `/insights` (revalidated by the nightly matview refresh job) | Backend-triggered |
| **ISR + on-demand** | `/properties/[slug]`, `/properties/[facet]`, `/agents`, `/agents/[slug]`, `/` | Publish/price/status change |
| **SSR** | `/properties` **only** — reads `searchParams`, dynamic automatically; `noindex` when filtered | None |
| **Static shell + CSR** | `/map`, `/compare`, `/buyer/*`, `/agent/*`, `/admin/*`, `/assistant` | Client fetch |

Public route names above are the architectural baseline. The implemented app currently uses
`/search`, `/market-insights` and `/agents/[id]`; the V1 screen inventory
(`../discovery/05-final-frontend-screen-inventory.md` §E) tracks these differences for confirmation.

**⚠️ Locked rule: public ISR pages must not read per-user cookies/session in Server Components.**
Favourites, viewed state, saved-search state are client-side only, or the route becomes dynamic
and ISR is lost — this is also why dashboards are pure CSR shells: the Next server never forwards
cookies to the API.

## 3. State ownership

| Kind | Owner |
|---|---|
| Server state (properties, offers, viewings, notifications, current user) | **TanStack Query** |
| URL state (filters, sort, page, map bounds) | **nuqs** — a property search is bookmarked/shared, so the filter set must *be* the URL |
| Client UI state (compare tray, panel open/closed, unapplied filter draft) | **Zustand** — a handful of items only |
| Forms | **React Hook Form** + Zod resolver |

**No server data in Zustand, ever.**

## 4. The five language concepts — never conflated

```
  UI LOCALE (V1: English only)  ⊥  CONTENT LANGUAGE  ⊥  QUERY LANGUAGE  ⊥  AI RESPONSE LANG.  ⊥  EMBEDDING SPACE
```

UI locale is chrome only — navigation, buttons, forms, errors, notifications. Content language is
what the agent authored (never machine-translated for display). **In V1 all five are English (#99):**
English UI, English listing content, English search queries, English AI answers and English
embeddings. The separation is kept so that a future Arabic phase needs no redesign. See
`../GLOSSARY.md` Section 11.

## 5. Language scope — English only in V1, end to end (#99)

- The V1 product is **English only**: UI text, listing content, search, AI answers and system
  messages. `<html lang="en" dir="ltr">`.
- **No Arabic/RTL implementation is required in V1**: no RTL layout, mirrored icons, reversed
  table/form/navigation order or Arabic UI catalog.
- UI strings still live in code (no `Translation` model).
- **Arabic/RTL is a Future / Optional Feature**, reconsidered only after the core project is
  completed and only through a new decision. The earlier bilingual requirement (#39 §8) is **not a
  current requirement**. If Arabic/RTL is ever resumed, the #39 §8 design (logical CSS properties,
  mirrored icons, `hreflang`, locale middleware) is the starting point, together with V25–V27.
- **No mixed-direction handling in V1:** no `dir="auto"` for Arabic content (#99).
- **Arabic content, Arabic search and Arabic AI answers** are deferred together with the Arabic UI.
  API responses may still carry optional Arabic fields (#101); V1 screens never render them.

Numeral convention (V27) is deferred with the Arabic UI.

## 6. Routes

**No locale segment in V1 (#99).** There are no `/ar/*` or `/en/*` routes, and middleware does no
locale resolution.

**Portal prefixes (#100):**

| Portal | Canonical prefix | Who may use it (#97) |
|---|---|---|
| Buyer | **`/buyer/*`** | USER, AGENT, ADMIN |
| Agent | **`/agent/*`** | AGENT (verified) |
| Admin | **`/admin/*`** | ADMIN |

Dashboards live at the prefix root (`/buyer`, `/agent`, `/admin`), and the Google phone step is `/complete-profile` (#106).
`/dashboard/*`, `/buyer-dashboard/*` and `/agent-dashboard/*` are **not** canonical. The routes
inside each prefix are set with the screen specifications; the conceptual structure is in
`../discovery/05-final-frontend-screen-inventory.md` §E.

**Known code mismatches (implementation follow-ups, #100):**
- the auth pages redirect to `/buyer-dashboard/overview` and `/agent-dashboard/overview`;
- the navbar landing links (`/buyer/overview`, `/agent/overview`, `/admin/verification`) must match
  the approved screen specifications;
- the middleware redirects agents away from `/buyer/*` (see §10).

## 7. SEO

One Latin slug per listing. English metadata only in V1 — no `hreflang` alternates (#99). Pages are
self-canonical, with one sitemap. Filtered search is `noindex`; curated ISR facet pages carry
organic discovery.

## 8. API consumption

The browser talks to `api.settly.com` **directly** — no Next.js proxy. CORS + credentialed
cookies (same-site because both share `.settly.com`). Generated typed client from the committed
OpenAPI snapshot (`openapi-typescript` + `openapi-fetch`) — see `API.md` Section 15.

## 9. Realtime, chat, and AI streaming

- **1-on-1 Chat**: Native browser WebSocket (`/ws/chat?token=...`) connecting directly to the backend (`settly-api`). Bidirectional, typed frames for instant message delivery, optimistic client updates, read receipts, and presence, backed authoritatively by PostgreSQL persistence.
- **In-App Notifications**: SSE via fetch-based streaming (not `EventSource` due to auth header requirement) — thin events (`/api/v1/events`) trigger a TanStack Query invalidation/refetch, never carry payload data directly.
- **AI / Agent Responses**: Stream via `POST` (not create-then-connect). See `COMMUNICATION.md`, `AGENT.md`.

## 10. Auth UX boundary

> **Next middleware checks cookie PRESENCE only, for a fast redirect. It is NOT the authorization
> boundary.** The API is. Role-based UI hiding is presentational only.

**Portals (#97):** one login per account. Agents and admins also use the **buyer** portal; the UI
offers a switch between the portals the account may use (Buyer, Agent, Admin). Middleware must not
redirect agents or admins away from buyer routes. (Recorded decision; not yet implemented.)

## 11. Maps and libraries

**Leaflet + MapTiler for display (#96)** — Leaflet is the approved V1 map library and MapTiler the
only tile provider (no CARTO). The MapTiler key comes from `NEXT_PUBLIC_MAPTILER_KEY` (never
hard-coded) and is **domain-restricted** in the MapTiler dashboard, since `NEXT_PUBLIC_*` values are
visible in the browser. Google Geocoding server-side at listing creation only (better
Egypt data quality, low volume). Tailwind + shadcn/ui (Radix) · TanStack Table · Recharts ·
Motion (respects `prefers-reduced-motion`).

## 12. Pending verification

V29 (generated client's RFC 9457 error handling). **Deferred by #99, not needed in V1:** V25
(i18n routing × ISR), V26 (RTL maturity of shadcn/Radix, Leaflet, Recharts), V27 (numerals).

## 13. Rejected / do not add

MapLibre migration in V1 (#96) · CARTO or other tile providers (#96) · hard-coded map keys (#96) ·
Cookie forwarding from the Next server · Next-as-proxy · Socket.IO (native WebSockets used for chat) · Firestore chat · Mapbox/
Google Maps for display · locale-specific slugs (v1) · a fake design system invented before
Stitch · **`/ar/*` or `/[locale]` routes and RTL work in V1 (#99)** · **`/dashboard/*`,
`/buyer-dashboard/*`, `/agent-dashboard/*` portal prefixes (#100)**.

## 14. Related documents

`API.md` for the contract consumed here · `../design/DESIGN_SYSTEM.md` and `UX_PATTERNS.md` for
visual/behavioural detail · `../GLOSSARY.md` Section 11 for the multilingual model (UI locale parts
deferred by #99) · `../discovery/05-final-frontend-screen-inventory.md` for the V1 screens and routes.
