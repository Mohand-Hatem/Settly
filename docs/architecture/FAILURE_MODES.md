# Failure Modes & Degradation

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #10, #13, #33, #42
    Related:      OVERVIEW.md, CONCURRENCY_AND_IDEMPOTENCY.md, OBSERVABILITY.md

## 1. Purpose

The complete degradation matrix. Governing principle, restated:

> **PostgreSQL is the source of truth. No external service's availability determines core
> business correctness.**

## 2. Degradation matrix

| Service | Request fails? | Degrades to | Durable state? | Retry | Sweeper | Alert |
|---|---|---|---|---|---|---|
| **PostgreSQL** | **Yes — 503** | Vercel still serves ISR-cached public pages | — | — | — | Yes |
| Redis | No | Enqueues fail silently; Tier A limits move to Postgres; SSE fan-out is moot at 1 instance | Yes (Postgres) | — | Yes — re-drives everything | Yes |
| Worker | No | Async results delayed | Yes | BullMQ stall recovery | Yes | Yes |
| Paymob | Checkout only | "Couldn't start payment, try again"; existing Payment state untouched | Yes (attempt INITIATED) | Yes, same idempotency key | Yes — reconciliation | Yes |
| Gemini | No | Assistant errors clearly; search falls back to deterministic parsing; new content not yet embedded | Yes | Yes | Yes — embedding backlog drains | Only on sustained failure |
| Cloudinary | New uploads only | Existing images serve from CDN | Yes (upload intent) | Yes | Yes | Minor |
| Resend | No | In-app notification still delivered (authoritative) | Yes (Notification row) | Yes | Yes | On backlog |
| FCM | No | In-app still works | Yes | Yes | Yes | Minor |
| Sentry | No | Logs still reach stdout | Yes | — | — | None (nothing to alert with) |
| MapTiler | No | Map tiles fail; list/search view fully functional | — | — | — | Minor |
| SSE connection drop | No | Client reconnects and refetches — SSE was never the source of truth | — | Client-driven | — | None |

## 3. Two structural properties

**pgvector over an external vector database removed an entire failure domain** — there is no
"the vector database is down" state independent of "the database is down" (Decision #6).

**Every external dependency except Postgres is non-critical** — a direct consequence of routing
all correctness through durable status columns plus sweepers, never through a live external call
inside a transaction (Decision #10).

## 4. Recovery mechanisms referenced here (detail lives in CONCURRENCY_AND_IDEMPOTENCY.md)

Payment reconciliation (1m) · deposit/offer/viewing expiry (5m/15m) · checkout-hold expiry (1m) ·
notification sweep (60s) · idempotency cleanup (1h) · session cleanup (daily) · matview refresh
(nightly) · **embedding-drift sweeper** (per #42 — a non-zero drift count is a security incident,
not a data-quality warning).

## 5. What must never happen

No silent data loss — every durable-state write happens inside the transaction that also decides
the outcome; enqueue happens after, and its loss is bounded by a sweeper window, never permanent.
No external call inside a database transaction. No security control that degrades silently (rate
limiting steps down through explicit tiers, never disappears).

## 6. Pending verification

**V14** (Sentry Crons, the primary tool for detecting a silently-dead scheduled job) · V32
(whether CI service containers support the full extension set, affecting how faithfully failure
scenarios can be tested).

## 7. Rejected / do not add

Treating Redis, or any provider other than Postgres, as a dependency whose outage blocks core
business correctness · silent retries that mask a genuine failure · failing open on rate limits
for sensitive endpoints.

## 8. Related documents

`CONCURRENCY_AND_IDEMPOTENCY.md` for the full sweeper/job inventory · `OBSERVABILITY.md` for how
each row here is detected and alerted · `PAYMENTS.md` for the payment-specific failure sequence.
