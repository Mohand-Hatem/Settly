# Frontend Architecture

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #4, #10, #21, #23, #39, #40
    Related:      API.md, ../design/DESIGN_SYSTEM.md, ../GLOSSARY.md Section 11

## 1. Purpose

Rendering strategy, state ownership, the bilingual/RTL requirement, and the language distinctions
that must never be conflated.

## 2. Five rendering modes — never collapsed into fewer

| Mode | Routes | Revalidation |
|---|---|---|
| **SSG** (build-time only) | `/[locale]/about`, `/contact`, `/how-it-works`, `/privacy`, `/terms`, auth shells | Deploy |
| **Static + on-demand** | `/[locale]/areas`, `/areas/[slug]`, `/insights` (revalidated by the nightly matview refresh job) | Backend-triggered |
| **ISR + on-demand** | `/[locale]/properties/[slug]`, `/properties/[facet]`, `/agents`, `/agents/[slug]`, `/` | Publish/price/status change — **both locales invalidated together** |
| **SSR** | `/[locale]/properties` **only** — reads `searchParams`, dynamic automatically; `noindex` when filtered | None |
| **Static shell + CSR** | `/[locale]/map`, `/compare`, `/dashboard/*`, `/agent/*`, `/admin/*`, `/assistant` | Client fetch |

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
  UI LOCALE (/en, /ar)  ⊥  CONTENT LANGUAGE  ⊥  QUERY LANGUAGE  ⊥  AI RESPONSE LANG.  ⊥  EMBEDDING SPACE
```

UI locale is chrome only — navigation, buttons, forms, errors, notifications. Content language is
what the agent authored (never machine-translated for display). See `../GLOSSARY.md` Section 11.

## 5. Bilingual UI and RTL (Decision #39 — reverses the earlier English-only/LTR position)

Full `/en` + `/ar`, first-class RTL:

- `dir` on `<html>` from the locale
- **Logical CSS properties throughout** (`margin-inline-start`, never `margin-left`)
- Mirrored directional icons; reversed table/form/navigation order
- `dir="auto"` still applies to user-generated content **in both directions** — an English
  description inside an RTL page needs LTR rendering, and vice versa
- Charts (Recharts) and maps (MapLibre) need RTL-aware axis/control placement — PENDING V26
- No `Translation` model for UI strings — static message catalogs versioned with code

Numeral convention (Western vs. Arabic-Indic) is explicitly **not an architectural blocker** —
deferred to the Stitch design phase (V27).

## 6. Localized routes

Every public route gains a `/[locale]` segment. `generateStaticParams` becomes locale × params.
Middleware resolves locale (cookie → `Accept-Language` → default) alongside the existing
cookie-presence auth check; redirects preserve the locale segment.

## 7. SEO

One shared Latin slug across locales (percent-encoded Arabic URLs look broken on WhatsApp, the
dominant Egyptian sharing channel) · `hreflang` (`en`, `ar`, `x-default`) · each locale
self-canonical · localized metadata and `inLanguage` · one sitemap with alternates. Filtered
search is `noindex`; curated ISR facet pages carry organic discovery.

## 8. API consumption

The browser talks to `api.settly.com` **directly** — no Next.js proxy. CORS + credentialed
cookies (same-site because both share `.settly.com`). Generated typed client from the committed
OpenAPI snapshot (`openapi-typescript` + `openapi-fetch`) — see `API.md` Section 15.

## 9. Realtime and AI streaming

SSE via fetch-based streaming (not `EventSource`) — thin events trigger a TanStack Query
invalidation/refetch, never carry data directly. AI/agent responses stream via `POST` (not
create-then-connect). See `COMMUNICATION.md`, `AGENT.md`.

## 10. Auth UX boundary

> **Next middleware checks cookie PRESENCE only, for a fast redirect. It is NOT the authorization
> boundary.** The API is. Role-based UI hiding is presentational only.

## 11. Maps and libraries

MapLibre + MapTiler for display; Google Geocoding server-side at listing creation only (better
Egypt data quality, low volume). Tailwind + shadcn/ui (Radix) · TanStack Table · Recharts ·
Motion (respects `prefers-reduced-motion`).

## 12. Pending verification

**V25** (Next.js App Router i18n routing × ISR × `generateStaticParams`) · **V26** (RTL maturity
of shadcn/Radix, MapLibre, Recharts) · V27 (numerals — deferred, not blocking) · V29 (generated
client's RFC 9457 error handling).

## 13. Rejected / do not add

Cookie forwarding from the Next server · Next-as-proxy · WebSockets · Firestore chat · Mapbox/
Google Maps for display · locale-specific slugs (v1) · a fake design system invented before
Stitch.

## 14. Related documents

`API.md` for the contract consumed here · `../design/DESIGN_SYSTEM.md` and `UX_PATTERNS.md` for
visual/behavioural detail · `../GLOSSARY.md` Section 11 for the full multilingual model.
