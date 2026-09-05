# Communication — SSE, Notifications, Email, Push

    Status:       LOCKED · Resend PROVISIONAL
    Last Updated: 2026-09-05
    Derived From: Decisions #10, #21, #33, #36, #39, #40, #42
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

## 6. Email — Resend (PROVISIONAL, Decision #36)

Chosen for React Email (bilingual templates in the same stack as the UI), no sandbox-approval
friction (unlike SES), and bounce/complaint webhooks without extra infrastructure. **Local
development uses Mailpit and never touches Resend** — no quota burned, no risk of emailing a real
address from seeded data. Production domain verification, SPF/DKIM/DMARC, pricing — **PENDING
V18**, not to be assumed verified.

## 7. Push — FCM

Firebase Cloud Messaging for push when the app is closed. **A no-op adapter locally** — logs the
payload, no real send. `UserDevice` holds registration tokens, pruned on invalidation.

## 8. Messages and conversations

`Conversation` is strictly two-party (buyer/agent, per property) — no group chat, no
`ConversationParticipant` model. Sending a message goes through normal REST (validation,
persistence, authorization, audit trail); only *receiving* needs a push, which is exactly what
SSE's thin-event model provides.

## 9. Privacy (Decision #42)

Message content **never** enters AI/RAG context (AI.md Section 7). On user deletion, messages are
**retained with an anonymised author** — the counterparty is a legitimate party to that
conversation and removing half of it would corrupt their record. Notification content is
regenerated from `type`+`params`, so no PII is trapped in stored notification text.

## 10. Failure behaviour

Resend down → in-app notification still delivered, email queued and retried, sweeper catches it.
FCM down → same, push-side. SSE connection drops → client reconnects and refetches; no data loss
because SSE was never the source of truth.

## 11. Pending verification

**V18** (Resend domain/pricing/webhooks) · V25 (Next.js locale routing interaction with any
SSE-driven client behaviour, if relevant).

## 12. Rejected / do not add

WebSockets/Socket.IO (bidirectional infrastructure for a unidirectional problem) · Firestore for
chat (a second database for business-critical messages) · SSE event replay · a
`NotificationTemplate` model · a `ConversationParticipant` model · storing rendered notification
text.

## 13. Related documents

`API.md` Section 13 for the SSE HTTP contract · `../process/ENVIRONMENT.md` for Mailpit/FCM
local substitution.
