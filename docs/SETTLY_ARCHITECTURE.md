# Settly Authoritative System Architecture

> **Status**: Living Architectural Specification  
> **Last Updated**: 2026-09-16  
> **Source Documents**: `docs/DECISIONS.md`, `docs/architecture/`  

---

## 1. System Topology & Architectural Boundaries

Settly operates as a modular, high-integrity full-stack platform designed specifically for institutional and private luxury real estate in Egypt.

```
                    ┌─────────────────────────────────────────┐
                    │               CLIENT WEB                │
                    │   Next.js 15 (App Router) + React 19    │
                    │      Luxury Tokens (/impeccable)        │
                    └───────────┬───────────────────┬─────────┘
                                │                   │
           HTTP / JSON (RFC 9457)                   │ WebSocket (/ws/chat)
           Session Cookies (settly_session)         │ SSE (/api/v1/notifications/stream)
                                │                   │
                    ┌───────────▼───────────────────▼─────────┐
                    │               API SERVER                │
                    │       Node.js 22 + Express 5 ESM        │
                    │   Better Auth (/api/auth) + REST (/v1)  │
                    └───────────┬───────────────────┬─────────┘
                                │                   │
                  Prisma Client │                   │ ioredis / BullMQ
                                │                   │
        ┌───────────────────────▼────────┐ ┌────────▼───────────────────────┐
        │       DATABASE ENGINE          │ │      REDIS 7 (IN-MEMORY)       │
        │ PostgreSQL 16 + PostGIS 3.4    │ │ BullMQ Queues + Schedulers     │
        │ pgvector (1536-dim embeddings) │ │ Distributed Locks + Hold TTL   │
        │ 39 Domain Tables (Prisma)      │ │ Real-Time PubSub Bus           │
        └────────────────────────────────┘ └────────────────────────────────┘
```

---

## 2. Frontend Architecture (Next.js 15 & React 19)

### Key Architectural Pillars
1. **App Router Structure**:
   - `(public)`: Catalog discovery, property details, compare, areas, market insights, agent directory.
   - `(auth)`: Login, register, email OTP verification, password recovery.
   - `(buyer)`: Protected buyer portal (Screens 14–22) with persistent luxury sidebar (`--sidebar-width: 288px`).
   - `(agent)`: Protected certified advisor portal (Screens 23–29) with listings manager, calendar, and leads CRM.
   - `(admin)`: Fiduciary compliance console (Screens 30–33) with moderation queue, broker verification, and audit logs.
2. **Visual Standards & Impeccable Craft Floor**:
   - **Palettes**: Settly Deep Navy (`#0B111F`, `#131D36`), Brass (`#C69749`, `#AE8033`), Bone canvas (`#F7F6F3`, `#EDE9DF`), Sage (`#3D5A4C`).
   - **Typography**: Editorial Serif (`Spectral`) for luxury headlines; Clean Sans (`Plus Jakarta Sans`) for controls; Monospace (`JetBrains Mono`) for measured numerical values (EGP, m², coordinates).
   - **Portrait Cards**: Framed vertical portrait cards (`aspect-ratio: 4 / 4.65`) with genuine imagery.
   - **Responsive Discipline**: Zero horizontal blowout (`min-width: 0`, strict flex/grid constraints).
3. **API Client & Type Invariants**:
   - Automated typed client generated via `openapi-typescript` from backend `openapi.json`.
   - Better Auth client (`src/lib/auth-client.ts`) managing credentials, OAuth, and reactive session state.

---

## 3. Backend Architecture (Express 5 & Node.js ESM)

### Module Isolation & Layering
The backend enforces 11 isolated modular domains under `backend/src/modules/`:
1. `identity`: Better Auth, user profile, broker verification, device tokens.
2. `catalog`: Properties, areas, amenities, Cloudinary media metadata.
3. `engagement`: Collections, favorites, saved searches, lead attribution.
4. `pipeline`: Viewings scheduler, agent availability slots, offer negotiations.
5. `payments`: Checkout reservation holds, Paymob intent and webhook processing, escrow tracking.
6. `messaging`: Direct 1-on-1 conversations, message persistence, WebSocket routing.
7. `notifications`: In-app notification feed, SSE event streaming, FCM push dispatch.
8. `knowledge`: Due diligence document vault, legal articles, vector chunking.
9. `ai`: Gemini Shortlist AI Agent, conversational state, bounded tool execution.
10. `search`: 4-arm hybrid search engine (filters + PostGIS + tsvector + pgvector).
11. `analytics`: Market telemetry, property view metrics, search demand tracking.

### Operational Standards
- **RFC 9457 Problem Details**: Standardized error envelopes with `type`, `title`, `status`, `detail`, `instance`, `requestId`.
- **Request Tracing**: `X-Request-Id` (UUIDv7) attached via Node.js `AsyncLocalStorage`.
- **OpenAPI Synchronization**: Zod schemas register directly into `@asteasolutions/zod-to-openapi` registry; drift checks fail CI if routes drift from spec.

---

## 4. Database Architecture (PostgreSQL 16, PostGIS, pgvector)

### Core Model Breakdown (39 Tables)
- **Better Auth (4)**: `User`, `Session`, `Account`, `Verification`.
- **Identity (2)**: `AgentProfile`, `UserDevice`.
- **Catalog (6)**: `Property`, `PropertyImage`, `Amenity`, `PropertyAmenity`, `Area`, `PropertyPriceHistory`.
- **Engagement (5)**: `Collection`, `CollectionItem`, `SavedSearch`, `SavedSearchMatch`, `Lead`.
- **Pipeline (4)**: `Viewing`, `AgentAvailability`, `Offer`, `OfferRevision`.
- **Payments (4)**: `Payment`, `PaymentAttempt`, `Refund`, `IdempotencyKey`.
- **Messaging (2)**: `Conversation`, `Message`.
- **Notifications (1)**: `Notification`.
- **Knowledge (4)**: `Document`, `DocumentChunk`, `KnowledgeArticle`, `KnowledgeChunk`.
- **AI (3)**: `AiConversation`, `AiMessage`, `AgentRun`.
- **Analytics & Governance (4)**: `PropertyViewEvent`, `SearchEvent`, `AuditLog`, `Report`.

### Critical Concurrency Invariants
1. **Exclusive Reservation Hold**: A partial unique index on `Property(id)` where `checkoutHoldExpiresAt > NOW()` guarantees only one buyer can hold a property at any instant.
2. **Double-Booking Prevention**: PostgreSQL `btree_gist` exclusion constraint prevents overlapping confirmed viewings for an advisor.
3. **Immutable Audit Trail**: Append-only trigger on `AuditLog` disallows `UPDATE` and `DELETE` queries.

---

## 5. Concurrency, Payments & Escrow Model

```
Buyer Initiates Reservation
       │
       ▼
1. Acquire 15-min Checkout Hold (Atomically set checkoutHoldExpiresAt)
       │
       ▼
2. Create Paymob Payment Intent (Generate cryptographically signed checkout URL)
       │
       ▼
3. Paymob Webhook Callback Received (Verify HMAC-SHA512 signature)
       │
       ├── SUCCESS:
       │     - Transition Offer -> RESERVED
       │     - Transition Property -> RESERVED
       │     - Void competing pending offers
       │     - Issue escrow deposit receipt
       │
       └── FAILURE / EXPIRY (15 min elapsed):
             - BullMQ sweeper clears hold
             - Property reverts to PUBLISHED
```

---

## 6. Search Intelligence & AI Advisory

Settly combines four query modalities into a single Reciprocal Rank Fusion (RRF) result:
1. **Structured**: Property type, pricing limits, bedroom count, completion date.
2. **Spatial**: PostGIS `ST_DWithin` calculating geodesic distance from corridor centers or landmarks.
3. **Lexical**: PostgreSQL `ts_rank` evaluated against the English `tsvector` generated column (V1 is English only, #99; the Arabic vector is deferred).
4. **Vector**: Cosine distance (`<=>`) against 1536-dimensional Gemini embeddings stored in `pgvector`.
