# API Contract

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decision #40 (extends #8, #18; refines #14's HTTP projection)
    Related:      BACKEND.md, AUTH.md, SEARCH.md, ../GLOSSARY.md

## 1. Purpose

The exact HTTP contract shape approved in Decision #40. This document must not simplify or
reinterpret that decision — see `../DECISIONS.md` entry #40 for full rationale on every rule below.

## 2. Base surface

```
  /api/v1/*        Settly business API — this document's scope
  /api/auth/*       Better Auth — library-owned, OUTSIDE /v1, excluded from our OpenAPI spec
```

Mount-prefix flexibility for `/api/auth/*` is PENDING — V31.

## 3. Response envelope

| Response | Shape |
|---|---|
| Single resource (GET/POST/PATCH) | **Bare** — the resource itself, no wrapper |
| Collection | `{ items: [...], pageInfo: {...} }` |
| Search collection | Adds `search: { interpretedFilters, degraded, appliedSort, resultCount }` |
| Delete | `204 No Content` |

**No universal `{ data, meta }` envelope.** The generated client (`openapi-fetch`) already
returns `{ data, error }` at the transport layer; an envelope would mean `result.data?.data` on
every call site. The wrapper key is `items`, chosen specifically so it cannot collide with the
transport's `data`.

⚠️ Interpreted-filter chips carry `{ kind, value }` — machine values only, **never a label**. The
frontend renders wording in the active locale (backend is language-neutral, see Section 5).

## 4. Action endpoints — state transitions are never PATCH

```
  POST /offers/:id/accept | /counter | /withdraw | /reject
  POST /properties/:id/submit | /publish | /reject | /archive
```

**Never** `PATCH /resource/:id { status: ... }` — that invites arbitrary state-setting and makes
authorization per-field. Each action endpoint maps to exactly one transition in
`../product/BUSINESS_RULES.md` Sections 2-5, with its own guard, Zod schema, idempotency and
concurrency behaviour. `PATCH` remains for genuine mutable attributes (title, price, description).

## 5. Error taxonomy — RFC 9457

```json
{
  "type": "/errors/email-not-verified",
  "title": "Email verification required",
  "status": 403,
  "detail": "...",
  "instance": "/requests/01J8X...",
  "requestId": "01J8X...",
  "params": { "limit": 25, "current": 25 },
  "errors": [ { "path": "price", "code": "too_small", "params": { "min": 0 } } ]
}
```

- **`type` IS the machine code** — no separate `code` field
- **Relative URIs** (`/errors/...`) — Settly does not yet own a production domain
- **Language-neutral backend**: `title`/`detail` are developer-facing English, logged, never
  rendered. The frontend localizes from `type` + `params` + `errors[].code` + `errors[].params`
- **New type only when the frontend must behave/render differently** — roughly 16 types total

| `type` | Status | Frontend behaviour |
|---|---|---|
| `validation-failed` | 422 | Field-level errors |
| `unauthenticated` | 401 | Redirect to login |
| `forbidden` | 403 | "Not authorized" |
| `not-found` | 404 | Not found page/state |
| `conflict` | 409 | Generic conflict |
| `rate-limited` | 429 | Show `Retry-After` |
| `internal` | 500 | Generic error |
| `service-degraded` | 503 | Degraded banner |
| `email-not-verified` | 403 | Verification CTA |
| `account-suspended` | 403 | Clear session, explain |
| `quota-exceeded` | 409 | "You've reached 25 saved searches" from `params` |
| `state-conflict` | 409 | Refetch; `params: {entity, currentState, attemptedTransition}` — one type covers ~40 transitions |
| `checkout-hold-unavailable` | 409 | "Another buyer is completing payment" |
| `idempotency-key-reused` | 422 | Client bug — log |
| `idempotency-in-progress` | 409 | Retry after `Retry-After` |
| `search-context-expired` | 410 | Silently re-run the search |

## 6. The 404/403 leak rule

> **404 when the actor may not know the resource exists. 403 when they may know it exists but may
> not act on it.**

A "doesn't exist" 404 and a "not yours" 404 must be **byte-identical**, and not measurably
different in latency. **HTTP status is the observable contract, not the security boundary** —
enforcement is in the service-layer policy functions (see `AUTH.md`).

## 7. Pagination

**Cursor** (search, feeds, messages, notifications):

```
  ?cursor=<opaque>&limit=<n>
  → { items, pageInfo: { nextCursor, hasNextPage } }
```

- Opaque, base64url, version-prefixed, encoding sort key + `id` + sort token
- **Never filters, never authorization** in the cursor
- A request whose `sort` mismatches the cursor's → **400**
- Every cursor query sorts on a column **plus `id`** — mandatory total ordering
- No `totalItems`
- Default 20, max 100
- Malformed cursor → **400** `/errors/invalid-cursor`
- Expired hybrid-search context (past the #26 5-min cache) → **410** `/errors/search-context-expired`

**Offset** for admin tables only: `?page=1&pageSize=50` with totals.

## 8. Resource naming and nesting

**Nest only when the child cannot exist without the parent AND the parent scopes authorization.
Max one level.** `/properties/:id/images`, `/offers/:id/revisions` qualify. `/properties/:id/offers`
does not — use `/offers?propertyId=`.

**`/me/*`** for self-scoped collections (`/me/favorites`, `/me/offers`, ...) — removes the IDOR
surface structurally, there is no id to tamper with.

**`/admin/*`** for admin-only collections/views. **Admin actions on domain resources stay on the
resource** (`POST /properties/:id/publish` with a role guard) — never duplicated under `/admin`.

## 9. Search endpoints — HTTP projection of Decision #14

```
  GET /api/v1/search/properties            → items (filter · NL · map at high zoom)
  GET /api/v1/search/properties/clusters   → clusters (aggregate map view)
```

**This refines #14, not reverses it.** Filter/map/NL remain three execution paths inside ONE
search service and pipeline. The clusters endpoint is a different HTTP *projection* of the same
service — it must not duplicate any search business logic, and reuses the same authorization.

`sort=relevance` is rejected with 400 when `q` is absent. Full request/response contract, ranking
internals boundary: see `SEARCH.md`.

## 10. Idempotency

**`Idempotency-Key` REQUIRED** (not optional) on: create payment attempt, request refund, create
viewing request, submit offer. Opaque string, 16-128 chars, scoped per (user, endpoint, key).

| Case | Response |
|---|---|
| Same key, same payload | Stored response, original status code, + `Idempotent-Replay: true` |
| Same key, different payload | 422 `/errors/idempotency-key-reused` |
| First request in progress | 409 `/errors/idempotency-in-progress` + `Retry-After` |
| Expired (24h) | New operation |

Keys stay in Postgres, never Redis (#10).

## 11. Query conventions

Single closed `sort` enum token (`price_asc`), never `sort` + `order`. Ranges as `minPrice`/
`maxPrice`. Repeatable filters `?areaId=a&areaId=b`. **No generic filter DSL** — no RSQL, no
`filter[price][gte]`. Dynamic SQL identifiers come from a closed server-side allowlist (#33).

## 12. Uploads

```
  POST /uploads/authorize     → { assetId, provider, uploadParams, constraints }
  [client uploads directly to Cloudinary / Supabase Storage]
  POST /uploads/:assetId/complete
```

No multipart endpoint anywhere. Bytes never traverse Express. See `STORAGE.md`.

## 13. SSE and AI streaming

```
  GET  /api/v1/events                 authenticated, thin events, no `id:` field (no replay)
  POST /api/v1/ai/messages            streamed response
  POST /api/v1/ai/agent-runs          streamed response
```

Full contract: `COMMUNICATION.md` (SSE), `AGENT.md` (agent streaming).

## 14. Versioning

Breaking (needs `/v2`): removing/renaming a response field, changing a type, tightening
validation, changing a success status, **adding a value to a response enum**. Additive: new
optional fields, new endpoints, new error types. Clients must ignore unknown response fields and
have a default branch for unknown error types. No per-endpoint or query-string versioning.

## 15. OpenAPI workflow

```
  Backend Zod schemas (runtime validation)
        → openapi.json (COMMITTED, CI drift gate)
        → copied to frontend/ (COMMITTED)
        → openapi-typescript → generated client (CI freshness gate)
```

**Backend owns the contract unilaterally.** Frontend never invents a schema. A non-blocking CI
job diffs the two snapshots and warns — they legitimately differ during independent deploys (#18).

## 16. Observability headers

`X-Request-Id` (always echoed) · `RateLimit-Limit/Remaining/Reset` (Tiers B/C only) ·
`Retry-After` (429/503; Tier A returns only this) · `Deprecation`/`Sunset` ·
`Idempotent-Replay`. All must be listed in `Access-Control-Expose-Headers` or they are silently
unreadable cross-origin.

## 17. Bulk operations

**None in v1.** Explicit domain operations only (`POST /me/notifications/read-all`) — never
`PATCH /resources { ids: [...] }`.

## 18. Pending verification

V28 (Zod→OpenAPI generator capability for discriminated unions, required headers, SSE) · V29
(generated client's RFC 9457 handling) · V30 (Express 5 + SSE vs. compression middleware) · V31
(Better Auth mount-prefix flexibility). None verified.

## 19. Rejected / do not add

Universal `{data,meta}` envelope · separate `code` beside `type` · generic filter DSL/RSQL ·
`sort`+`order` as two params · HATEOAS/`_links` · `?fields=`/`?include=` · `207 Multi-Status` ·
generic bulk CRUD · ETag/`If-None-Match` (v1) · per-endpoint/query-string versioning · vendor
media types · API keys.

## 20. Related documents

`generated/api-reference.md` for the exact generated spec · `AUTH.md` for authorization semantics ·
`SEARCH.md` for the search request/response contract in full.
