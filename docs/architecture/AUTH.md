# Authentication & Authorization

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #9, #33, #38, #39, #42, #97
    Related:      BACKEND.md, SECURITY.md, ../product/BUSINESS_RULES.md Section 9

## 1. Purpose

The Better Auth boundary, session model, and the authorization flow used by every request,
AI tool call, and Agent run.

## 2. The boundary

> **Better Auth owns authentication, credential verification, sessions, logout/revocation, email
> verification, password reset. Settly owns all authorization, roles as business data, resource
> policies, and the immutable AuditLog.**

| Better Auth-managed (4 tables) | Settly-owned |
|---|---|
| `user` (extended), `account`, `session`, `verification` | Everything else, including `AgentProfile`, `UserDevice` |

`user` is the canonical FK root (#39). No parallel `User`/`UserProfile` model — `role` and
`banned` must live on `user` because the admin plugin's ban check runs inside session validation,
which is what makes suspension **immediate**.

## 3. Session model

- Opaque session token, one row per device
- **Cookie cache DISABLED** — a suspended user must lose access immediately, not after a cache TTL
- `httpOnly; secure` (production) / not-secure (local http); `sameSite=lax`; domain `.settly.com`
  in production, host-only locally — `localhost:3000`/`:4000` are same-site because `SameSite` is
  evaluated on the registrable domain, ports are not part of it (#37)
- **Sliding 7-day expiry (refreshed daily), absolute 30-day cap** — V12 verified; confirmed by #106
- Trusted-origin allowlist matches the CORS allowlist
- Revoked on: password reset, password change, email change, admin suspension, explicit logout-all

## 4. Password hashing

**Argon2id** overrides Better Auth's default scrypt. Production parameters throughout; parameters
may be reduced **only in the automated test suite**, behind an explicit flag — never in local
development, where the real login cost should be felt (`../process/ENVIRONMENT.md` Section 8).

## 5. Identity fields and where they live

| Field | Home | Notes |
|---|---|---|
| `emailVerified` | `user`, native | Read directly by the verification boundary (Section 6 below) |
| `role` | `user`, admin plugin | Business data, enforced by Settly's policy functions — **not** the plugin's access-control DSL. **One role per account (#97):** `USER` = buyer · `AGENT` = buyer + agent (after verification) · `ADMIN` = buyer + admin, no agent/listing powers. `ADMIN` is set only by seed or a controlled CLI/script — no in-app promotion |
| `banned`/`banReason`/`banExpires` | `user`, admin plugin | The suspension mechanism |
| `anonymizedAt` | `user`, `additionalField` | Set on account deletion (#42) |
| `preferredLocale` | `user`, `additionalField` | Required by the notification worker (no request context) — PENDING V19 for JSON-field support |

## 6. The verification boundary (Decision #38)

> **Email verification is required for any buyer transition that creates or advances a financial
> obligation or a scheduled commitment. It is never required to withdraw, cancel, or read.**

Currently guarded: **V1** (request viewing), **O1** (submit offer), **O3** (counter-offer), **O5**
(accept offer), **Y2** (initiate deposit payment). Never guarded: withdrawal, cancellation,
browsing, search, favourites, saved searches. Full table in `../product/BUSINESS_RULES.md`
Section 9.1 — this is a business rule, enforced in the service layer, so the AI tool
`createViewingRequest` inherits it automatically through V1.

## 7. Authorization flow

```
  Route            coarse role guard (USER | AGENT | ADMIN)
  Service           resource policy function — canViewOffer(actor, offer), etc.
  Business rule      conditional update / invariant (database-enforced)
```

**AI tools and the Property Shortlist Agent execute as the authenticated user**, through this
same path, with actor context captured at run start and immutable for the run (#19, #33). There
is no separate authorization surface for AI to bypass, because none exists.

### Authorization matrix (condensed — full detail in BUSINESS_RULES.md Section 9)

| Resource | Buyer | Agent | Admin |
|---|---|---|---|
| Published property | Read | Read; write own only | Read; moderate any |
| Offer | Party only | Party only (never on own listings, #59) | Read; no transitions — except as the **buyer party** of their own offer (#59, #97) |
| Payment/Refund | Own; cannot self-initiate refund | Own subscription payments (#90) | Initiate refund with reason; own payments as a buyer |
| Private document | Per visibility scope | Own + own listings | Read only via audited path |
| Conversation | Participant only | Participant only | Not readable by default |

**Admin boundaries:** admins do not read buyer-agent conversations by default; admins may act only
as the **buyer** party of an offer or payment (#59, #97), never as the agent party, and never handle
a case they are personally involved in (#67, #71).

## 8. The 404/403 leak rule

See `API.md` Section 6 — 404 when the actor may not know a resource exists, 403 when they may
know but may not act. Enforced here at the policy-function level, observed there at the HTTP
level.

## 9. Capability-token exceptions

Email verification and password-reset links are **GET requests carrying single-use, high-entropy
tokens that are themselves the authorization** — the one exception to "no state-changing GET
relies on ambient session authority" (#33, #40). Token hashing at rest is PENDING — V22.

## 10. `/api/auth/*` separation

Better Auth's routes sit outside `/api/v1` and outside our OpenAPI spec — a library-owned
contract with its own client (#40). See `API.md` Section 2.

## 11. Security invariants (testable — see process/TESTING.md)

- An anonymised or banned user cannot authenticate
- A 404 for "doesn't exist" and a 404 for "not yours" are byte-identical
- Every `/me/*` and `/admin/*` route is tested against: unauthenticated, wrong role, not-owner,
  banned, unverified email (where applicable)

## 12. Pending verification

V5 (UUIDv7 id-generation override) · V12 (absolute session cap support) · V19 (`additionalFields`
JSON support) · V20 (`role`/`banned` exact column types) · V21 (CLI/Prisma coexistence) · V22
(verification token hashing) · V31 (mount-prefix flexibility). None verified.

## 13. Rejected / do not add

A parallel `User`/`UserProfile` model · stateless JWT as the primary session mechanism · Supabase
Auth · CASL/Casbin · PostgreSQL RLS · using the admin plugin's access-control DSL as the
authorization source of truth · admin impersonation (disabled).

## 14. Related documents

`SECURITY.md` for rate limiting and session-hardening detail · `../product/BUSINESS_RULES.md`
Section 9 for the full authorization-sensitive rule table.
