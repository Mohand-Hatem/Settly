# Security & Privacy

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #33, #37, #42
    Related:      AUTH.md, STORAGE.md, OBSERVABILITY.md, ../product/BUSINESS_RULES.md

## 1. Purpose

The layered security model, rate limiting, logging safety, and the full privacy/retention/data-
lifecycle architecture. Every control here answers a named threat — nothing is included because
it is common practice.

## 2. Layering

```
  Vercel/Edge      TLS, HSTS, all browser security headers (CSP, Referrer-Policy, etc.)
  Express          CORS allowlist, Origin validation, body limits, rate limiting, Helmet (configured
                    deliberately — most of Helmet's value is browser-directed and inert on a JSON API;
                    what matters here is nosniff, HSTS, removing X-Powered-By)
  Service layer     authorization policies, business invariants, idempotency
  PostgreSQL        constraints — the last line
```

## 3. CORS and CSRF

Exact origin allowlist, `credentials: true`. **Never regex-match `*.vercel.app`** — would let any
Vercel deployment make credentialed requests with a victim's cookies. CSRF defence is
`SameSite=Lax` + Origin validation on state-changing requests — no separate CSRF-token system.

**Rule: no state-changing GET that relies on ambient session authority.** Capability-token GETs
(email verification, password reset links) are exempt — the token itself is the authorization and
cannot be forged.

## 4. Rate limiting — three tiers, simplified

| Tier | Redis healthy | Redis down |
|---|---|---|
| **A** — login, reset, verification, payment ops | Shared Redis limits | **Postgres-backed counters, tightened ~50%**, checked *after* a cheap in-memory pre-check |
| **B** — authenticated writes | Redis limits | Coarse in-memory cap / fail-open — **safe because business invariants (I9/I11/I12) already bound the surface** |
| **C** — public reads | Redis limits | Generous fail-open |

Always on regardless of Redis: per-account exponential delay (never a hard lockout — that's a
DoS primitive), enumeration-resistant responses. AI carries its own independent quota
(`AI.md` Section 6) with a **Postgres-backed** global spend cap that fails closed.

## 5. Authentication and authorization

See `AUTH.md` for the full Better Auth boundary, session model, and verification-boundary rule.
Key invariant restated here: **HTTP status is the observable contract, not the security
boundary** — enforcement is in service-layer policy functions.

## 6. Upload security

See `STORAGE.md` Section 4 for the full control set (magic bytes, re-encoding, EXIF stripping,
structural PDF rejection, resource limits) and Section 5 for the malware-scanning decision.

## 7. AuditLog — immutability and its limit

**Database-enforced append-only** (rule/trigger rejecting UPDATE/DELETE — PENDING V33). ⚠️
**Metadata carries ids and enums only, never PII** (Decision #42) — because the table is
immutable, anything written there is permanent and **anonymisation cannot reach it**. Enforced by
a test asserting metadata keys against a closed allowlist.

## 8. Webhook payload retention

`WebhookEvent`'s raw payload is **purged after 90 days; the event id is kept forever** for dedup
— the dedup mechanism needs only the id, and the payload can carry cardholder metadata (#42,
refining #13/#3).

## 9. The AI privacy boundary

See `AI.md` Section 7 for the full table. Restated: **the AI's data-access surface is exactly the
tool allowlist plus the RAG corpus, executed as the user — there is no other path.**

## 10. Data classification (condensed)

| Class | Sensitivity | Deletable | In AI/RAG |
|---|---|---|---|
| Auth (`account`, `session`, `verification`) | Critical | Hard delete | Never |
| Private documents | High | Yes | Scope-filtered, in-query |
| Messages/conversations | High | No (retained, anonymised author) | Never |
| Payments, refunds, `WebhookEvent` id, AuditLog | Critical | **Never** | Never |
| PropertyViewEvent, SearchEvent | Low-medium | 365d then deleted | Never |
| AI conversations, AgentRun | High | User-initiated anytime | Own thread only |
| Embedding | Inherits source | Lifecycle-bound to source | Scope-filtered |

## 11. Deletion model — no global soft-delete

```
  HARD DELETE      sessions · tokens · idempotency keys · expired analytics ·
                   AI conversations (user-initiated) · read+aged notifications ·
                   failed ingestion artifacts · devices · never-published DRAFT properties
  ANONYMISE        user  ← the ONLY anonymised entity
  IMMUTABLE        AuditLog
  RETAIN           Payment · PaymentAttempt · Refund · Offer · OfferRevision ·
                   Viewing · WebhookEvent (id) · published property history
  LIFECYCLE-BOUND  Embedding — bound to its source, never time-bound
```

## 12. Retention schedule

| Data | Default | Rationale |
|---|---|---|
| Sessions, tokens | 7d past expiry | Cleanup hygiene |
| Idempotency keys | 24h | Locked (#10) |
| WebhookEvent payload | Null after 90d; id forever | Dispute window, then purge |
| Payments, refunds, offers, viewings | Indefinite | Financial/contractual history |
| AuditLog | Indefinite | Evidence layer |
| Notifications | Delete read after 180d | Transient UI state |
| PropertyViewEvent, SearchEvent | 365d, then delete rows | Longest useful analytics window |
| AI conversations, AgentRun | User-deletable anytime; 365d inactivity auto-delete | Most personal, least business-critical |
| Failed ingestion artifacts | 30d | Triage window |
| Logs | Platform-managed | Railway/Vercel/Sentry retention |

Defaults live in the same backend constants module as business constants (#31, #42) — engineering
configuration, not invented compliance numbers.

## 13. User and agent deletion

| | Deleted | Anonymised | Retained |
|---|---|---|---|
| Any user | account, session, UserDevice, AI conversations/AgentRun, saved searches, collections | `user` PII in place; email → unique non-routable placeholder; `banned=true`; `anonymizedAt` set | Offers, viewings, payments, refunds, audit entries, **messages** |
| Agent, additionally | AgentProfile licence details | Same | Property ownership/attribution ("Former agent") |

Three tiers of agent removal: **suspend** (reversible) → **deactivate** (reversible) →
**anonymise** (irreversible, attribution preserved). Full rules: `../product/BUSINESS_RULES.md`
Section 11.

## 14. Property deletion

**Hard delete only from never-published DRAFT.** Anything ever published becomes ARCHIVED or
SUSPENDED. `SOLD` is permanent. Full rules: `../product/BUSINESS_RULES.md` Section 2.2.

## 15. Backups

Backups are operational recovery, **not an application deletion mechanism**. Deleted data persists
until backup expiry. ⚠️ **A restore must not resurrect access** — the post-restore runbook
re-applies anonymisation and re-runs the embedding-drift sweeper.

## 16. Ten testable privacy invariants

PR1 authorization precedes AI retrieval · PR2 private documents cannot become public via
embeddings (drift sweeper) · PR3 an anonymised user cannot authenticate · PR4 a deleted private
asset is unretrievable · PR5 AuditLog is append-only · PR6 audit metadata has no PII · PR7
payment records cannot be deleted · PR8 logs never contain credentials · PR9 AI cannot read
messages/payments/audit/admin data · PR10 outbound AI payloads are minimised.

## 17. Security headers (CSP detail)

CSP lives on Vercel-served documents (only Vercel serves documents). **Ship `Report-Only` first**,
collect violations, then enforce — an enforcing CSP deployed blind breaks Next hydration,
MapLibre workers, or Cloudinary images. `frame-src 'none'` is available because Paymob is a
hosted redirect, never embedded.

## 18. Pending verification

**V22** (Better Auth verification-token hashing at rest) · **V33** (does `prisma migrate`
preserve the AuditLog append-only rule) · V26 (RTL CSP interaction, if any).

## 19. Rejected / do not add

CASL/Casbin · PostgreSQL RLS · a CSRF-token system (SameSite+Origin suffice) · ClamAV · a global
`deletedAt` column · anonymising analytics instead of deleting it · a `PrivacyRequest` model ·
deleting AuditLog on user deletion · Kubernetes/enterprise SIEM/WAF products · IP-allowlisting
Paymob.

## 20. Related documents

`AUTH.md` for authentication detail · `OBSERVABILITY.md` for log redaction · `STORAGE.md` for
upload security · `AI.md`/`RAG.md` for the AI privacy boundary · `../product/BUSINESS_RULES.md`
Sections 2.2 and 11 for the two business rules this document depends on.
