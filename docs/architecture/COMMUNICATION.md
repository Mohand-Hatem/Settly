# Communication — SSE, WebSocket Chat, Notifications, Email, Push

    Status:       LOCKED
    Last Updated: 2026-09-14
    Derived From: Decisions #10, #21, #33, #36, #39, #40, #42, #43, #44
    Related:      API.md Section 13, ../process/ENVIRONMENT.md

## 1. Purpose

Realtime delivery, notification modelling, and the three channels (in-app, email, push) that
carry it — with the authority rule that keeps degradation safe.

## 2. The authority rule

> **The in-app `Notification` row is authoritative. Email and push are best-effort deliveries of
> it.** Written inside the same transaction as the business event, never after.

This is what makes a Firebase or Resend outage harmless: the user is never uninformed, only
notified through fewer channels until delivery catches up via the sweeper.

## 3. SSE contract

```
  GET /api/v1/events        authenticated, user-scoped, fetch-based streaming (NOT EventSource —
                              EventSource cannot set headers, which the future bearer path needs)
```

- **Thin events only**: `{ entityType, entityId, at }` — the client refetches through the normal
  API. No business data in the event payload
- **No `id:` field, deliberately** — so clients never send `Last-Event-ID`. No replay buffer
  exists; this makes that fact structural, not merely documented
- Heartbeat every ~25s · max 3 connections per user · ~30-minute lifetime, client reconnects and
  refetches on drop
- Redis pub/sub fan-out is **designed but not implemented** — only needed once there is more than
  one API instance (currently one)

## 4. Notification model

`Notification` stores `type` + `params` JSON and **per-channel delivery state**, rendered into
text at display time in the recipient's `preferredLocale`. No `NotificationTemplate` model — a
locale switch re-renders existing notifications correctly with no data migration.

## 5. Delivery flow

```
  Business transaction commits (writes Notification row, status=PENDING)
        │
        ▼  ENQUEUE — after commit, never inside it
  Delivery job → Resend (email) / FCM (push) / SSE (realtime signal)
        │
        ▼  60s sweeper re-enqueues anything still PENDING
```

## 6. Email — Resend (LOCKED, Decisions #36 & #44)

Chosen for React Email (templates in the same stack as the UI; **English only in V1**, #99), no sandbox-approval
friction (unlike SES), and bounce/complaint webhooks without extra infrastructure. **Resend is locked
across all environments (development, testing, production) — Mailpit is eliminated.** All emails
reach real inboxes (e.g., Gmail, Outlook). Business logic interacts strictly via an `EmailService`
abstraction. Production domain verification, SPF/DKIM/DMARC, pricing — **PENDING V18**, not to be
assumed verified.

## 7. Push — FCM

Firebase Cloud Messaging for push when the app is closed. **A no-op adapter locally** — logs the
payload, no real send. `UserDevice` holds registration tokens, pruned on invalidation.

## 8. Messages, conversations, and WebSocket chat (Decision #43)

`Conversation` is strictly two-party (buyer/agent, per property) — no group chat, no
`ConversationParticipant` model.

**Real-time transport:**
- **1-on-1 Chat uses native WebSocket (`/ws/chat`)** for instant bidirectional message exchange,
  delivery acknowledgements, and future typing indicators/presence.
- **PostgreSQL is the sole source of truth**: every message is validated (Zod), authorized (policy
  check), and written to PostgreSQL before or concurrently with WebSocket broadcast. Messages are
  never held only in memory or Redis.
- **Cross-instance communication**: because API instances are horizontally scalable and stateless,
  WebSocket connections across different server nodes are synchronized via **Upstash Redis Pub/Sub**.
  A message sent to node A is published to Redis and forwarded to the recipient connected to node B.
- Reconnection and auth: WebSocket connections authenticate via the user's active session cookie
  or bearer token during the HTTP upgrade handshake.

## 9. Privacy (Decision #42)

Message content **never** enters AI/RAG context (AI.md Section 7). On user deletion, messages are
**retained with an anonymised author** — the counterparty is a legitimate party to that
conversation and removing half of it would corrupt their record. Notification content is
regenerated from `type`+`params`, so no PII is trapped in stored notification text.

## 10. Failure behaviour

Resend down → in-app notification still delivered, email queued in BullMQ and retried, sweeper catches it.
FCM down → same, push-side. SSE/WebSocket connection drops → client reconnects and refetches; no data loss
because PostgreSQL is the source of truth, never the socket stream.

## 11. Pending verification

**V18** (Resend domain/pricing/webhooks) · V25 (Next.js locale routing interaction with any
SSE/WebSocket-driven client behaviour, if relevant).

## 12. Rejected / do not add

Socket.IO (native WebSockets used for 1-on-1 chat; SSE used for notifications) · Mailpit (real Resend
delivery locked across all environments) · Firestore for chat (a second database for business-critical
messages) · SSE event replay · a `NotificationTemplate` model · a `ConversationParticipant` model ·
storing rendered notification text.

## 13. Related documents

`API.md` Section 13 for the SSE HTTP contract · `../process/ENVIRONMENT.md` for environment variables
and external service configuration.
