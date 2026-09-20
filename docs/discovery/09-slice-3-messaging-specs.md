# Slice 3 Screen Specifications — In-App Messaging (SH-03: BUY-13, AGT-15, PUB-03) & Real-time Communication

    Status:       SPECIFICATION (transactional core) · design-ready · NOT implemented
    Last Updated: 2026-09-20
    Scope:        Two-party property-scoped messaging, auto-lead generation (#75), native WebSocket chat (/ws/chat),
                  responsive master-detail chat terminal (SH-03), and property detail "Message Agent" modal.
    Derived from: 05-final-frontend-screen-inventory.md (SH-03, BUY-13, AGT-15, PUB-03),
                  ../architecture/COMMUNICATION.md, ../architecture/API.md, ../architecture/FRONTEND.md,
                  ../product/BUSINESS_RULES.md §3, ../DECISIONS.md #40, #42, #43, #59, #60, #66, #75

**Authority.** This document specifies behavior, data contracts, and UI states for Slice 3 (In-App Messaging).
Rules come from `DECISIONS.md`, `COMMUNICATION.md`, and `BUSINESS_RULES.md`. Visual design follows the Impeccable
"Navy & Brass" candidate system (`docs/design/candidates/settly-landing/buyer-dashboard/messages.html`).

---

## 0. Slice 3 Map

| Spec | Surface / Screen | Route | Inventory ID | Backend Actions |
|---|---|---|---|---|
| **S3-01** | Buyer Messages Terminal | `/buyer/messages` | BUY-13 (SH-03) | `GET /api/v1/me/conversations`<br>`GET /api/v1/conversations/:id/messages`<br>`POST /api/v1/conversations/:id/messages`<br>`POST /api/v1/conversations/:id/read` |
| **S3-02** | Agent Messages Terminal | `/agent/messages` | AGT-15 (SH-03) | Same endpoints scoped to agent role (`conversation.agentId === user.id`) |
| **S3-03** | Public Property "Message Agent" Modal | `/properties/[slug]` | in PUB-03 | `POST /api/v1/conversations` (starts thread + creates/updates `Lead`, redirects to portal) |
| **S3-BE** | Communication & WebSocket Engine | `/api/v1/conversations/*`<br>`/ws/chat` | Provider Engine | Native WebSocket server with session authentication, message broadcast, auto-lead creation, and PostgreSQL persistence |

---

## S3-01 & S3-02 — Master-Detail Messaging Terminal (`SH-03`: `BUY-13` & `AGT-15`)

| Field | Specification |
|---|---|
| **Role / Route** | **Buyer:** Signed-in user (`/buyer/messages`)<br>**Agent:** Signed-in agent (`/agent/messages`) |
| **Layout Structure** | Responsive 2-pane Master-Detail layout matching `buyer-dashboard/messages.html`:<br>1. **Left Pane (Channels Directory):** Search input, active thread list, unread badge indicators, property badges, latest message snippets.<br>2. **Right Pane (Active Discussion Desk):** Counterparty header, property context bar (price, location, link to listing), message scroll area, quick-reply pills, message composer textarea + send CTA.<br>3. **Mobile Behavior:** Single-pane master/detail switcher (selecting a conversation slides into the chat pane; "Back to Channels" button returns to list). |
| **Thread List Item** | • Counterparty Avatar / Initials + online presence dot.<br>• Counterparty name + role tag (e.g. `Advisor` / `Verified Agent` or `Buyer`).<br>• Property badge: Property title, district, price (EGP JetBrains Mono).<br>• Last message snippet (truncated with ellipsis) + relative timestamp.<br>• Unread messages count badge (Brass `#C69749` pill). |
| **Active Chat Context Bar** | Sits directly above message history: displays property thumbnail, title, agreed or listed price (`JetBrains Mono`), and direct link to view property details or live offer (if one exists). |
| **Message Bubble Anatomy** | • **Inbound (Counterparty):** White card on Canvas `#F7F6F3`, Navy text `#131D36`, timestamp, read status.<br>• **Outbound (Self):** Deep Navy background `#131D36`, White text, Brass accent, timestamp, double checkmark read indicator.<br>• Chronological order with date separators ("Today", "Yesterday", "MMM D, YYYY"). |
| **Composer Area** | • Multi-line autogrowing textarea (max 2000 chars, enforces character counter).<br>• Send button (Navy `#131D36` / Brass `#C69749`, disabled while empty or sending).<br>• Enter to send (Shift+Enter for newline).<br>• Quick replies: Contextual prompts (e.g. *"Is this property still available?"*, *"Can we schedule a viewing?"*, *"I have a question about the payment terms"*). |
| **States** | • **loading:** Skeleton loaders for channel list and message history.<br>• **empty (no conversations):** Elegant empty state illustration: *"No conversations yet. Inquire about properties to connect with agents."* with Browse Listings CTA.<br>• **no thread selected (desktop):** Placeholder desk: *"Select a conversation on the left to start messaging."*<br>• **sending:** Message appears optimistically in outbound style with pending clock icon.<br>• **error:** Failed message shows retry action; network disconnection banner displays reconnecting indicator. |
| **Permissions** | Strictly scoped to participants: `conversation.buyerId === session.user.id || conversation.agentId === session.user.id`. Any other user receives 404 (leak rule #40). |

---

## S3-03 — Property Detail "Message Agent" Modal (`PUB-03`)

| Field | Specification |
|---|---|
| **Role / Route** | Public property page `/properties/[slug]` (accessible to signed-in buyers) |
| **Entry Point** | Secondary CTA button **"Message Agent"** on Property Detail agent card and floating action bar. |
| **Modal Content** | 1. **Header:** "Message Listing Agent" with agent name and property title.<br>2. **Notice:** *"Your contact information remains protected. Discussions remain in your Settly Messages portal."*<br>3. **Initial Message Input:** Pre-populated with default inquiry or custom text (min 5, max 2000 chars).<br>4. **Submit Action:** "Send Message & Open Chat" button. |
| **Behavior** | • If unauthenticated: redirects to `/login?callbackUrl=/properties/[slug]` with saved intent.<br>• If user is the listing's own agent: blocked per Invariant #59 (cannot message oneself on own listing).<br>• On submit: calls `POST /api/v1/conversations`, creates/retrieves conversation, posts first message, automatically creates/updates `Lead` record, and navigates user to `/buyer/messages?id=[conversationId]`. |

---

## S3-BE — Backend Communication & Real-time WebSocket Engine

| Component | Specification |
|---|---|
| **Data Models** | • `Conversation`: `(id, propertyId, buyerId, agentId, lastMessageAt, createdAt, updatedAt)`. Unique compound constraint `[buyerId, agentId, propertyId]`.<br>• `Message`: `(id, conversationId, senderId, body, attachments, isRead, readAt, createdAt)`. Indexed on `[conversationId, createdAt]`.<br>• `Lead`: `(id, buyerId, agentId, propertyId, status, createdAt, updatedAt)`. Unique `[buyerId, propertyId]`. |
| **Auto-Lead Generation (Decision #75)** | When a conversation is initiated by a buyer:
```typescript
await prisma.lead.upsert({
  where: { buyerId_propertyId: { buyerId, propertyId } },
  create: { buyerId, agentId, propertyId, status: "NEW" },
  update: { updatedAt: new Date() } // Maintains lead touch
});
``` |
| **API Endpoints** | 1. `GET /api/v1/me/conversations` — Returns list of conversations for current user with unread counts and latest message.<br>2. `POST /api/v1/conversations` — Finds or creates conversation between current buyer and property listing agent. Validates property is `PUBLISHED` or `RESERVED`. Returns bare conversation object.<br>3. `GET /api/v1/conversations/:id/messages?cursor=&limit=` — Returns cursor-paginated messages for the conversation with total ordering (`createdAt ASC, id ASC`).<br>4. `POST /api/v1/conversations/:id/messages` — Validates message body (1–2000 chars), validates sender is participant, creates `Message`, updates `Conversation.lastMessageAt`, and broadcasts via WebSocket.<br>5. `POST /api/v1/conversations/:id/read` — Marks all unread messages from counterparty as `isRead = true`, `readAt = NOW()`. |
| **WebSocket Engine (`/ws/chat`)** | • Native `ws` server mounted on `/ws/chat`.<br>• Handshake: parses session cookie / Better Auth session to authenticate user. Unknown/invalid session closes connection with code 4401.<br>• In-memory client connection pool mapped by `userId`.<br>• On `POST /messages`: immediately dispatches `{ type: "message:new", conversationId, message }` to recipient socket if connected.<br>• On read receipt: dispatches `{ type: "conversation:read", conversationId, readAt }` to counterparty. |
| **Privacy & Security** | • **Invariant #42:** Message text is private and excluded from RAG and semantic vector embeddings.<br>• **Invariant #60 & #66:** Counterparty phone numbers are never returned in messaging payloads.<br>• **Invariant #59:** Agent cannot create conversation on their own listing. |
| **Acceptance Criteria** | 1. Buyer can start a conversation from property detail modal.<br>2. Starting a conversation creates/touches a `Lead` in `LeadStatus.NEW`.<br>3. Messages stream in real-time between connected browser tabs via `/ws/chat` without page reload.<br>4. Sending a message when recipient is offline stores reliably in PostgreSQL; recipient receives it upon next load or polling.<br>5. Unread counter decrements to zero when conversation is opened and read.<br>6. Unauthorized access attempts return 404 (byte-identical leak protection). |
