# Slice 4 Screen Specifications — Notifications Center (SH-02: BUY-14, AGT-16, ADM-13), Header Bell, and Notification Engine

    Status:       SPECIFICATION (transactional core) · design-ready · NOT implemented
    Last Updated: 2026-09-20
    Scope:        In-app Notification Center (SH-02), Portal Header Bell with real-time badge,
                  dedicated portal notification pages (BUY-14, AGT-16, ADM-13), authoritative
                  Notification persistence, thin SSE/WebSocket real-time signals, and best-effort email delivery.
    Derived from: 05-final-frontend-screen-inventory.md (SH-02, BUY-14, AGT-16, ADM-13),
                  ../architecture/COMMUNICATION.md, ../architecture/API.md §13, ../architecture/FRONTEND.md,
                  ../product/BUSINESS_RULES.md, ../DECISIONS.md #10, #36, #42, #44, #100, #106, #107, #108, #109

**Authority.** This document specifies behavior, data contracts, and UI states for Slice 4 (Notifications Engine & Center).
Rules come from `DECISIONS.md`, `COMMUNICATION.md`, and `BUSINESS_RULES.md`. Visual design follows the Impeccable
"Navy & Brass" candidate system (`docs/design/candidates/settly-landing/buyer-dashboard/notifications.html` and `agent-dashboard/notifications.html`), purged of contradictory/luxury-only claims per Decision #45.

---

## 0. Slice 4 Map

| Spec | Surface / Screen | Route | Inventory ID | Backend Actions |
|---|---|---|---|---|
| **S4-01** | Notification Center Feed (Buyer) | `/buyer/notifications` | BUY-14 (SH-02) | `GET /api/v1/notifications`<br>`PATCH /api/v1/notifications/:id/read`<br>`POST /api/v1/notifications/mark-all-read` |
| **S4-02** | Notification Center Feed (Agent) | `/agent/notifications` | AGT-16 (SH-02) | Same endpoints, agent portal context |
| **S4-03** | Notification Center Feed (Admin) | `/admin/notifications` | ADM-13 (SH-02) | Same endpoints, admin governance alerts |
| **S4-04** | Global Header Bell & Dropdown | All portal topbars | Header in SH-02 | `GET /api/v1/notifications/unread-count`<br>`GET /api/v1/notifications?limit=5`<br>`PATCH /api/v1/notifications/:id/read` |
| **S4-BE** | Notification Service & Event Delivery | `/api/v1/notifications/*`<br>`/api/v1/events` | Engine (`COMMUNICATION.md`) | In-app PostgreSQL persistence (authoritative), thin real-time signal stream, best-effort Resend email trigger |

---

## S4-01, S4-02, S4-03 — Portal Notifications Center (`SH-02`: `BUY-14`, `AGT-16`, `ADM-13`)

| Field | Specification |
|---|---|
| **Role / Route** | **Buyer:** Signed-in buyer (`/buyer/notifications`)<br>**Agent:** Signed-in agent (`/agent/notifications`)<br>**Admin:** Signed-in admin (`/admin/notifications`) |
| **Header & Controls** | 1. **Page Title:** "Notifications & Alerts" with subtitle: *"Real-time updates on viewings, offer negotiations, deposit reservations, and account activity."*<br>2. **Actions:**<br>• **"Mark All as Read"** button (disabled when unread count = 0). Calls `POST /api/v1/notifications/mark-all-read`.<br>• **Category Filter Pills:** All Alerts, Offers & Deposits, Viewings, Messages, System.<br>• **Unread Only Toggle:** Switch to show only unread notifications.<br>• **Search Box:** Instant client-side search filtering alerts by title, description, or property name. |
| **Notification Card Structure** | Grid/card matching candidate styling (`docs/design/candidates/settly-landing/agent-dashboard/notifications.html` lines 600–750):<br>1. **Icon Disc:** Circular colored badge by notification category:<br>• **Brass** (Offers & counter-offers: `HandCoins`)<br>• **Sage** (Completed/confirmed deposits & accepted viewings: `ShieldCheck` or `CalendarCheck`)<br>• **Navy** (Viewing requests & messages: `CalendarDays` or `MessageSquare`)<br>• **Warning/Amber** (Deposit expiration & deadlines: `Clock` or `AlertCircle`)<br>2. **Card Content:**<br>• Top Row: Category tag (Brass/Sage/Navy pill), relative timestamp (e.g. "12m ago", "Yesterday"), unread status indicator dot.<br>• Title: Bold headline (e.g. *"New Counter-Offer Received: 14,200,000 EGP"*).<br>• Description: Descriptive context generated from `type` + `params`.<br>• Metadata chips: Property title, counterparty role.<br>3. **Action Button:** Contextual CTA button routing directly to the target record:<br>• Offer event -> *"Review Offer"* (`/buyer/offers` or `/agent/offers`)<br>• Deposit event -> *"View Reservation"* (`/buyer/offers/[id]/deposit`)<br>• Viewing event -> *"View Details"* (`/{portal}/viewings`)<br>• Message event -> *"Open Conversation"* (`/{portal}/messages`)<br>4. **Mark Read Action:** Single checkmark button to mark item read individually. |
| **Timeline Grouping** | Cards automatically grouped by date: **Today**, **Yesterday**, and **Earlier**. |
| **States** | • **loading:** Pulse skeletons of header pills and 3 notification cards.<br>• **empty:** Empty state card with Bell icon: *"You're all caught up! No notifications to display."*<br>• **unread-empty:** *"No unread notifications right now."* with button to toggle all.<br>• **error:** Error alert with retry button. |

---

## S4-04 — Global Header Bell & Quick Dropdown

| Field | Specification |
|---|---|
| **Placement** | Mounted in `PortalShell` header (`frontend/src/components/portal/PortalShell.tsx`), between `PortalSwitcher` and profile badge. |
| **Bell Icon & Badge** | • Lucide `Bell` icon.<br>• If `unreadCount > 0`: Bright Brass `#C69749` badge with number (e.g. `3` or `9+`) and animated subtle pulse on new incoming alert. |
| **Quick Dropdown Menu** | • Click on bell opens a flyout dropdown card (z-index 50, shadow-xl, border border-line bg-white, max-w-sm).<br>• **Header:** "Notifications" + unread badge + "Mark all read" link.<br>• **Body:** Up to 5 most recent unread/recent notification snippets with timestamp and icon.<br>• Click on item navigates to record and marks notification read.<br>• **Footer:** "View all notifications →" linking to `/${portal}/notifications`. |
| **Real-Time Integration** | Hook `useNotificationBadge()` polls or listens to events, keeping unread badge updated across tabs without manual page reload. |

---

## S4-BE — Backend Notification Engine, Event Types, and Persistence

| Component | Specification |
|---|---|
| **Data Model (`schema.prisma`)** | Uses existing Prisma model `Notification`:
```prisma
model Notification {
  id                String    @id
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String
  params            Json
  isRead            Boolean   @default(false)
  readAt            DateTime?
  channelsDelivered Json?
  createdAt         DateTime  @default(now())

  @@index([userId, isRead, createdAt(sort: Desc)])
}
``` |
| **Supported Types** | • `VIEWING_REQUESTED`: Buyer requested viewing -> notify Agent.<br>• `VIEWING_CONFIRMED`: Agent confirmed viewing -> notify Buyer.<br>• `VIEWING_DECLINED`: Agent declined viewing -> notify Buyer.<br>• `VIEWING_CANCELLED`: Viewing cancelled -> notify counterparty.<br>• `OFFER_SUBMITTED`: Buyer submitted initial offer -> notify Agent.<br>• `OFFER_COUNTERED`: Counter-offer revision submitted -> notify counterparty.<br>• `OFFER_ACCEPTED`: Offer accepted -> notify Buyer (triggers 72h deposit deadline).<br>• `OFFER_REJECTED`: Offer declined -> notify Buyer.<br>• `OFFER_WITHDRAWN`: Offer retracted -> notify Agent.<br>• `OFFER_SUPERSEDED`: Offer superseded by another accepted buyer -> notify Buyer.<br>• `DEPOSIT_CONFIRMED`: Reservation deposit payment succeeded -> notify Buyer & Agent.<br>• `DEPOSIT_SUPERSEDED`: Rival deposit cancelled/refunded -> notify Buyer.<br>• `NEW_MESSAGE`: Offline chat message -> notify recipient.<br>• `SYSTEM_NOTICE`: Platform or moderation announcement. |
| **API Endpoints** | 1. `GET /api/v1/notifications` — Returns paginated list for authenticated user with unread filter, total unread count.<br>2. `GET /api/v1/notifications/unread-count` — Returns `{ unreadCount: number }` for lightweight badge polling.<br>3. `PATCH /api/v1/notifications/:id/read` — Marks notification as read.<br>4. `POST /api/v1/notifications/mark-all-read` — Marks all notifications for user as read.<br>5. `DELETE /api/v1/notifications/:id` — Deletes single notification. |
| **Transactional Authority (`COMMUNICATION.md` §2)** | `NotificationService.createNotification(tx, { userId, type, params, sendEmail? })`:<br>• Writes `Notification` inside the transactional Prisma unit of work.<br>• If `sendEmail: true`, enqueues or dispatches best-effort email via Resend (`sendTransactionalEmail`). Email failures never abort the business transaction.<br>• Broadcasts thin signal `{ entityType: "notification", entityId: id, at: now }` to user's active WebSocket or SSE connection. |
| **Acceptance Criteria** | 1. Viewing, offer, deposit, and message events write an authoritative `Notification` row.<br>2. `GET /api/v1/notifications` returns correctly formatted items with computed titles and bodies.<br>3. Marking read updates `isRead = true` and `readAt = NOW()`.<br>4. Mark all as read clears unread status for all user notifications.<br>5. Header bell displays accurate unread badge in real time.<br>6. Clicking a notification CTA navigates directly to the target record in the portal. |
