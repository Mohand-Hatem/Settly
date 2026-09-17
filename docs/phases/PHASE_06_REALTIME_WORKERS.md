# Phase 06: Real-Time Communications, Notifications & Worker Infrastructure

> **⚠️ Non-authoritative (Decision #48, 2026-09-17).** V1 order and scope are defined by
> `../process/ROADMAP.md` and `../process/IMPLEMENTATION_PLAN.md`. This file is kept as a screen
> inventory and progress record; where it disagrees with those documents or with
> `../DECISIONS.md`, they win. Its "luxury / escrow" framing is superseded by #45 and #47.


> **Status**: ⬜ Not Started  
> **Milestone**: BullMQ Queues, WebSocket 1-on-1 Chat, SSE Notification Streams  
> **Governing Specifications**: `docs/architecture/COMMUNICATION.md`, `docs/architecture/CONCURRENCY_AND_IDEMPOTENCY.md`  

---

## 1. Phase Goal
Build the real-time communications infrastructure and background worker engine: install and configure `ioredis` and `bullmq`, implement the 9 scheduled jobs, complete the authenticated WebSocket chat server, and provide live Server-Sent Events (SSE) notification streaming.

---

## 2. Scope Breakdown

### Backend & Worker Engine
- **Redis Connection**: Configure `ioredis` singleton in `backend/src/shared/redis/index.ts`.
- **BullMQ Workers**: Implement `settly-worker.ts` running 9 background schedulers:
  1. `payment-reconciliation`: Sweeps pending payments and reconciles with Paymob.
  2. `deposit-expiry`: Releases expired reservations where 72h window lapsed without deposit.
  3. `offer-expiry`: Marks offers expired after 7 days without agent response.
  4. `viewing-expiry`: Marks viewing requests completed or expired.
  5. `checkout-hold-expiry`: Sweeps 15-minute reservation holds.
  6. `notification-sweep`: Batches and delivers digests.
  7. `idempotency-cleanup`: Purges keys older than 24h.
  8. `session-cleanup`: Cleans expired auth sessions.
  9. `matview-refresh`: Refreshes materialized price indices.
- **WebSocket Chat Server**: Authenticated `/ws/chat` endpoint validating session cookies, room multiplexing, and message delivery.
- **SSE Notification Stream**: `GET /api/v1/notifications/stream` emitting live events to active browser tabs.

### Frontend
- Real-time chat client hook in `/buyer/messages` and `/agent/messages`.
- Live notification toast emitter and badge counter connected to SSE stream.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **6.1** | Redis Client & BullMQ Worker Engine | Install `ioredis` and `bullmq`, configure worker queue foundation | ⬜ Not Started |
| **6.2** | 9 Scheduled Background Jobs | Implement all 9 background schedulers in `settly-worker.ts` | ⬜ Not Started |
| **6.3** | WebSocket Chat Server & Handshake Auth | Complete `/ws/chat` session validation, room join, and message delivery | ⬜ Not Started |
| **6.4** | Server-Sent Events (SSE) Notification Stream | Implement `GET /api/v1/notifications/stream` and client reconnection | ⬜ Not Started |
| **6.5** | Web Push Notification (FCM) Integration | Configure Web Push tokens and dispatch triggers | ⬜ Not Started |
