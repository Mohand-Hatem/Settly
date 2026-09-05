# Observability

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #33, #34, #37, #42
    Related:      SECURITY.md, BACKEND.md, FAILURE_MODES.md

## 1. Purpose

Logging, error tracking, health/readiness, and the alert set — proportionate to a portfolio-scale
system, no OpenTelemetry collector, no Grafana stack.

## 2. Logging — Pino, Morgan and Winston both removed (Decision #34)

`pino` + `pino-http`, structured JSON, `pino-pretty` in development only. **The decisive argument
was correlation, not redundancy**: `pino-http` + AsyncLocalStorage puts `requestId`, `userId`,
`route` on every line inside a request automatically — Morgan's access line and Winston's
application lines shared no key, forcing timestamp-based reconstruction during an incident.

**Redaction** (both environments, identical): `authorization` header, `cookie`, `*.password`,
`*.token`, `*.secret`, `*.hmac`, `*.apiKey`. Also never logged: message content, document content,
full webhook payloads (hash only), embedding vectors, prompt content beyond a hash.

## 3. Errors — Sentry

Backend + frontend, request id attached. Performance tracing **sampled ~10%**, with payment and
AI paths always traced — full tracing would exhaust the free tier in days. **Session Replay
disabled** (#33/#42) — it would capture private messages, offer amounts, and PII, contradicting
the logging boundary.

## 4. Scheduled-job monitoring

**Sentry Crons** — each of the nine scheduled jobs checks in; a missed check-in alerts. Answers
"did reconciliation quietly die?" with zero new infrastructure. Availability/quota — PENDING V14.

## 5. Health / readiness / degraded — three distinct endpoints

| Endpoint | Checks | Rule |
|---|---|---|
| `/health` | Nothing — process alive, event loop responsive | Must never check dependencies; a Redis blip must not restart the API |
| `/ready` | **PostgreSQL only** | The one dependency without which correct service is impossible |
| `/health/detail` | Every dependency (Postgres, Redis, Cloudinary, Paymob, Gemini, email, worker heartbeat, queue depths) | **Admin only**; reports per-dependency status with an overall `degraded` — a non-critical outage never makes the API look down |

⚠️ **Never actively probe paid providers** (Gemini, Paymob) from a health endpoint — report the
**last observed outcome from real traffic**, a lightweight circuit-breaker state per provider.

## 6. Metrics surface — a small admin panel, not a metrics stack

Postgres-derived indicators surfaced on the existing minimal admin operational view (already
scoped, Decision #28): payments stuck in `PROCESSING`, failed refunds, notification backlog,
embedding backlog, worker heartbeat, agent-run outcome distribution. **This is what replaces the
justification for OpenTelemetry/Grafana** — Sentry is the alerting surface, this panel is the
metrics surface.

`bull-board` is mounted **locally only** for queue inspection during development — never in
production, where it would be a third-party UI inside the API with its own auth exception.

## 7. Eight alerts — everything else is a dashboard

Any `Refund` in `FAILED` · a `Payment` stuck in `PROCESSING` > 30 min · webhook signature
failures above a threshold in an hour · a missed scheduled-job check-in · rate-limit fallback
engaged (Redis down) · AI daily spend above threshold · stale worker heartbeat · unhandled
exception rate spike. **Add a ninth: embedding-drift sweeper reports non-zero drift (#42) — a
security incident, not a warning.**

## 8. Request/response observability headers

`X-Request-Id` (always echoed) · `RateLimit-*` (Tiers B/C) · `Retry-After` (Tier A returns only
this — publishing remaining budget on a login endpoint hands an attacker their allowance) ·
`Idempotent-Replay`. All exposed via `Access-Control-Expose-Headers` or they're silently
unreadable cross-origin. See `API.md` Section 16.

## 9. What logs must never contain

Passwords, session tokens, cookies, authorization headers, payment secrets/card data, raw private
document content, private message content, unnecessary PII. See `SECURITY.md` Section 7 for the
AuditLog-specific rule (a stricter version — ids/enums only).

## 10. Pending verification

**V14** (Sentry Crons capability/quota) · V30 (Express 5 + SSE vs. compression middleware — a
streamed response silently broken by compression is an observability blind spot until traced).

## 11. Rejected / do not add

OpenTelemetry collector · Grafana/Prometheus stack · enterprise SIEM · active health-probing of
paid providers · `bull-board` in production · full (100%) performance tracing · Sentry Session
Replay.

## 12. Related documents

`SECURITY.md` for redaction and privacy rules this section assumes · `FAILURE_MODES.md` for how
these signals map to degradation behaviour · `BACKEND.md` for the request-context mechanism that
makes correlation possible.
