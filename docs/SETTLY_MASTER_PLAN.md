# Settly Master Project Plan & Execution Roadmap

> **Status**: Living Document · Single Source of Truth for Settly Lifecycle  
> **Last Updated**: 2026-09-16  
> **Authority**: Current Settly Source Code, `docs/DECISIONS.md`, `docs/architecture/`  

---

## 1. Project Overview & Vision

Settly is an institutional-grade luxury real estate marketplace tailored for the prime Egyptian corridor (New Cairo, Katameya, Sheikh Zayed, 6th of October, North Coast, Red Sea). It combines:
- **Sovereign Legal & Fiduciary Transparency**: Verified brokers, FRA/REA licenses, and immutable audit trails.
- **Architectural & Aesthetic Distinction (/impeccable)**: Framed portrait cards, Spectral Serif typography, JetBrains Mono measured telemetry, and Settly Navy/Brass palette.
- **Advanced Concurrency & Escrow Controls**: 15-minute exclusive checkout reservation holds, atomic state transitions, cooling-off refund state machines, and Paymob payment integration.
- **Search Intelligence & AI Advisory**: 4-arm hybrid search (PostGIS spatial, PostgreSQL tsvector full-text, pgvector 1536-dimensional embeddings, structured filters) with a bounded Gemini Shortlist AI Agent.

---

## 2. Current Project Position

```text
CURRENT PHASE:
Phase 02 — Identity, Authentication & Fiduciary RBAC (COMPLETED)
  ✅ Step 2.1: Better Auth Core Engine & PostgreSQL Schema
  ✅ Step 2.2: Email Verification & Cryptographic OTP via Resend
  ✅ Step 2.3: Screen 10 (Login) & Screen 11 (Register) Candidate Porting
  ✅ Step 2.4: Screen 12 (Verify Email) & Screen 13 (Forgot Password)
  ✅ Step 2.5: Backend RBAC Middleware & Integration Test Suite
  ✅ Step 2.6: Better Auth Official Skills Integration
  ✅ Step 2.7: Frontend Route Authorization Middleware (`middleware.ts`)
  ✅ Step 2.8: Shared Impeccable UI Primitives (`components/ui/`)
  ✅ Step 3.1: Public Catalog & Market Intelligence API Endpoints (`compare`, `insights`, `market-pulse`, `agents`)
  ✅ Step 3.2: Screen 04 — Compare Properties (`/compare`)
  ✅ Step 3.3: Screen 05 — Area List Directory (`/areas`)

NEXT PHASE:
Phase 03 — Public Discovery Completion & Market Intelligence (IN PROGRESS)

NEXT STEP:
Step 3.4 — Screen 06: Area Detail Guide (`/areas/[slug]`)
  • Port corridor deep-dive guide from `docs/design/candidates/settly-landing/public/area-detail.html` into Next.js App Router under `frontend/src/app/(public)/areas/[slug]/` with historical price trends, master plan telemetry, top compound rankings, and area broker contacts.
```

---

## 3. Master Project Phase Roadmap

| Phase | Phase Name | Primary Milestone Goal | Frontend Scope | Backend Scope | Database Scope | Status | Phase Document |
|---|---|---|---|---|---|---|---|
| **01** | **Catalog & Discovery Foundation** | Public portal discovery, listings showcase, and interactive GIS search | Screens 1–3 (Landing, Search, Detail) | Catalog module, Area routes, Property routes, RFC 9457 errors | 6 Catalog tables, PostGIS seed, 8 luxury properties | ✅ Completed | [PHASE_01_PUBLIC_FOUNDATION.md](phases/PHASE_01_PUBLIC_FOUNDATION.md) |
| **02** | **Identity, Auth & Fiduciary RBAC** | Better Auth integration, email OTP, role routing, and agent verification | Screens 10–13 (Login, Register, OTP, Reset) | Identity module, Better Auth mounting, Resend email worker | 4 Better Auth tables, 2 Identity tables, Verification | ✅ Completed | [PHASE_02_AUTH_IDENTITY.md](phases/PHASE_02_AUTH_IDENTITY.md) |
| **03** | **Public Discovery Completion & Market Intelligence** | Complete all 9 public screens with area guides, market analytics, and broker directory | Screens 4–9 (Compare, Areas, Area Detail, Insights, Agents, Agent Profile) | Area statistics APIs, Agent directory APIs, Compare aggregation, Market indices | Area hierarchy indexes, Aggregate materialization queries | ✅ Completed | [PHASE_03_PUBLIC_DISCOVERY.md](phases/PHASE_03_PUBLIC_DISCOVERY.md) |
| **04** | **Buyer Portal & Engagement Lifecycle** | Complete 9 buyer screens: saved homes, searches, viewing bookings, and document vault | Screens 14–22 (Overview, Favorites, Saved Searches, Viewings, Offers, Messages, Vault, Settings) | Engagement module, Pipeline module, Viewing request workflow, Document management | Collections, SavedSearches, Leads, Viewings, Documents | ⬜ Not Started (ACTIVE NEXT PHASE) | [PHASE_04_BUYER_PORTAL.md](phases/PHASE_04_BUYER_PORTAL.md) |
| **05** | **Agent Advisory & Listing Management** | Complete 7 agent screens: portfolio management, listing creator, pipeline CRM, and calendar | Screens 23–29 (Overview, Listings, Create Listing, Edit Listing, Leads, Calendar, Analytics) | Agent listing management, 2-tier moderation submission, Cloudinary direct upload, Availability slots | AgentAvailability, PriceHistory tracking, Moderation triggers | ⬜ Not Started | [PHASE_05_AGENT_PORTAL.md](phases/PHASE_05_AGENT_PORTAL.md) |
| **06** | **Real-Time Comms, Notifications & Worker Infrastructure** | Instant WebSocket chat, SSE notification streams, and BullMQ worker queue engine | Live chat window, unread counters, notification center, Web Push subscription | `ioredis` + `bullmq` setup, WebSocket session auth, SSE notification stream, 9 worker schedulers | UserDevice (FCM), Notification table, Idempotency tracking | ⬜ Not Started | [PHASE_06_REALTIME_WORKERS.md](phases/PHASE_06_REALTIME_WORKERS.md) |
| **07** | **Financial Escrow, Paymob & Concurrency Controls** | 15-min reservation checkout hold, Paymob gateway integration, and atomic deposit processing | Checkout modal, payment status screens, deposit refund request, cooling-off banner | Payments module, Paymob HMAC webhook, Checkout hold state machine, Atomic transaction bundle | Payments, PaymentAttempts, Refunds, IdempotencyKey | ⬜ Not Started | [PHASE_07_PAYMENTS_ESCROW.md](phases/PHASE_07_PAYMENTS_ESCROW.md) |
| **08** | **Search Intelligence, pgvector & Shortlist AI Agent** | 4-arm hybrid search (FTS + vector + geo + filters) and conversational Shortlist AI assistant | Assistant chat widget, semantic search bar, AI property recommendation cards | Search module (pgvector 1536d + tsvector), AI module, Gemini tool-calling agent | Property embeddings, DocumentChunk, AiConversation, AgentRun | ⬜ Not Started | [PHASE_08_AI_HYBRID_SEARCH.md](phases/PHASE_08_AI_HYBRID_SEARCH.md) |
| **09** | **Governance, Trust & Administration** | Complete 4 admin screens: moderation queue, broker verification, dispute resolution, and audit | Screens 30–33 (Moderation, Verification, Reports, Audit Log) | Admin moderation APIs, Report investigation workflow, Immutable audit trail logger | AuditLog append-only triggers, Report status machine | ⬜ Not Started | [PHASE_09_ADMIN_GOVERNANCE.md](phases/PHASE_09_ADMIN_GOVERNANCE.md) |
| **10** | **Production Hardening, Performance & Deployment** | Security hardening, cache component optimization, Docker multi-stage builds, and CI/CD | Cache components, partial prefetching, responsive QA, accessibility audit | Rate limiting, CORS tightening, helmet security headers, healthcheck telemetry | Connection pooling, Prisma read-replicas, index optimization | ⬜ Not Started | [PHASE_10_HARDENING_DEPLOYMENT.md](phases/PHASE_10_HARDENING_DEPLOYMENT.md) |

---

## 4. Master Execution Steps Table

| Phase | Step | Task Name | Frontend | Backend | Database | Swagger | Status |
|---|---|---|---|---|---|---|---|
| **P1** | **1.1** | Express REST Foundation & RFC 9457 Errors | — | ✅ | ✅ | ✅ | ✅ Completed |
| **P1** | **1.2** | Catalog Schema, PostGIS & Seed Migration | — | ✅ | ✅ | — | ✅ Completed |
| **P1** | **1.3** | Screen 01: Landing Page (`/`) | ✅ | ✅ | — | — | ✅ Completed |
| **P1** | **1.4** | Screen 02: Search & Interactive Leaflet GIS (`/search`) | ✅ | ✅ | — | — | ✅ Completed |
| **P1** | **1.5** | Screen 03: Property Detail Page (`/properties/[slug]`) | ✅ | ✅ | — | — | ✅ Completed |
| **P2** | **2.1** | Better Auth Core Engine & PostgreSQL Schema | — | ✅ | ✅ | ✅ | ✅ Completed |
| **P2** | **2.2** | Email Verification & Cryptographic OTP via Resend | ✅ | ✅ | ✅ | ✅ | ✅ Completed |
| **P2** | **2.3** | Screen 10 (Login) & Screen 11 (Register) Candidate Porting | ✅ | ✅ | — | — | ✅ Completed |
| **P2** | **2.4** | Screen 12 (Verify Email) & Screen 13 (Forgot Password) | ✅ | ✅ | — | — | ✅ Completed |
| **P2** | **2.5** | Backend RBAC Middleware & Integration Test Suite | — | ✅ | — | — | ✅ Completed |
| **P2** | **2.6** | Official Better Auth Skills Integration | — | — | — | — | ✅ Completed |
| **P2** | **2.7** | Frontend Route Authorization Middleware (`middleware.ts`) | ✅ | — | — | — | ✅ Completed |
| **P2** | **2.8** | Shared Impeccable UI Primitives (`components/ui/`) | ✅ | — | — | — | ✅ Completed |
| **P3** | **3.1** | Public Catalog & Market Intelligence API Endpoints | — | ✅ | ✅ | ✅ | ✅ Completed |
| **P3** | **3.2** | Screen 04: Compare Properties (`/compare`) | ✅ | ✅ | — | — | ✅ Completed |
| **P3** | **3.3** | Screen 05: Area List Directory (`/areas`) | ✅ | ✅ | — | — | ✅ Completed |
| **P3** | **3.4** | Screen 06: Area Detail Guide (`/areas/[slug]`) | ✅ | ✅ | — | — | ✅ Completed |
| **P3** | **3.5** | Screen 07: Market Insights & Telemetry (`/market-insights`) | ✅ | ✅ | — | — | ✅ Completed |
| **P3** | **3.6** | Screen 08 (Agent Directory) & Screen 09 (Agent Public Profile) | ✅ | ✅ | — | — | ✅ Completed |
| **P3** | **3.7** | Public Discovery Automated Test Suite & OpenAPI Drift Check | — | ✅ | — | ✅ | ✅ Completed |
| **P4** | **4.1** | Shared Buyer Dashboard Layout & Navigation Shell | ⬜ | — | — | — | ⬜ Not Started |
| **P4** | **4.2** | Screen 14: Buyer Overview (`/buyer/overview`) & Metrics API | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.3** | Screen 15: Favorites & Curated Collections (`/buyer/favorites`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.4** | Screen 16: Saved Searches & Alert Cadences (`/buyer/saved-searches`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.5** | Screen 17: Viewing Request Booking Flow (`/buyer/viewings`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.6** | Screen 18: Offer Negotiation Table (`/buyer/offers`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.7** | Screen 19: Buyer Messages Desk & Screen 20: Notification Center | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.8** | Screen 21: Encrypted Document Vault & Screen 22: Account Settings | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P4** | **4.9** | Buyer Portal End-to-End Test Suite & Verification | ⬜ | ⬜ | — | ⬜ | ⬜ Not Started |
| **P5** | **5.1** | Shared Agent Advisory Layout & Shell | ⬜ | — | — | — | ⬜ Not Started |
| **P5** | **5.2** | Screen 23: Agent Overview (`/agent/overview`) & Metrics API | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.3** | Screen 24: My Listings Management Table (`/agent/listings`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.4** | Screen 25: Create Listing Multi-Step Wizard (`/agent/listings/new`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.5** | Screen 26: Edit Listing & 2-Tier Moderation Triggers | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.6** | Screen 27: Leads Pipeline CRM Kanban (`/agent/leads`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.7** | Screen 28: Viewings Calendar & Availability Slots (`/agent/calendar`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.8** | Screen 29: Agent Analytics & Telemetry (`/agent/analytics`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P5** | **5.9** | Agent Portal Integration Test Suite & Verification | ⬜ | ⬜ | — | ⬜ | ⬜ Not Started |
| **P6** | **6.1** | Redis & BullMQ Queue Worker Infrastructure | — | ⬜ | ⬜ | — | ⬜ Not Started |
| **P6** | **6.2** | 9 Scheduled Background Jobs Implementation | — | ⬜ | ⬜ | — | ⬜ Not Started |
| **P6** | **6.3** | WebSocket Direct 1-on-1 Chat Server & Client Handshake | ⬜ | ⬜ | ⬜ | — | ⬜ Not Started |
| **P6** | **6.4** | Server-Sent Events (SSE) Live Notification Stream | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P6** | **6.5** | Web Push Notification (FCM) Integration | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P7** | **7.1** | 15-Minute Reservation Checkout Hold State Machine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P7** | **7.2** | Paymob Payment Gateway Integration & Intent Dispatch | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P7** | **7.3** | Paymob Webhook Processing & Cryptographic HMAC Verification | — | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P7** | **7.4** | Atomic State Transition Bundle on Successful Deposit | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P7** | **7.5** | Cooling-Off Refund Flow (48h Full / 20% Post-Window Fee) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P8** | **8.1** | pgvector 1536-Dimensional Embedding Pipeline | — | ⬜ | ⬜ | — | ⬜ Not Started |
| **P8** | **8.2** | 4-Arm Hybrid Search Engine (Filters + Geo + FTS + Vector) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P8** | **8.3** | Gemini Shortlist AI Agent & Tool Execution Boundary | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P8** | **8.4** | Floating Assistant Chat Widget (`settly-assistant-widget.css`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P9** | **9.1** | Shared Admin Command Center Layout | ⬜ | — | — | — | ⬜ Not Started |
| **P9** | **9.2** | Screen 30: Property Moderation Queue (`/admin/moderation`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P9** | **9.3** | Screen 31: Agent Verification Console (`/admin/verification`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P9** | **9.4** | Screen 32: Reports & Dispute Resolution (`/admin/reports`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P9** | **9.5** | Screen 33: Immutable Audit Log Viewer (`/admin/audit-log`) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |
| **P10**| **10.1**| Frontend Next.js Cache Components & Partial Prefetching | ✅ | — | — | — | ⬜ Not Started |
| **P10**| **10.2**| Backend Security Hardening (Helmet, Rate Limiting, CSP) | — | ⬜ | — | — | ⬜ Not Started |
| **P10**| **10.3**| Docker Multi-Stage Production Containers & Health Checks | — | ⬜ | — | — | ⬜ Not Started |
| **P10**| **10.4**| GitHub Actions CI/CD Pipeline & Automated Quality Gates | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Not Started |

---

## 5. Controlled Execution Workflow

For all implementation work in Settly:
1. **PLAN**: Inspect current state and document dependencies.
2. **EXPLAIN**: Detail exactly what files are modified or created.
3. **SHOW DETAILS**: Provide schema, backend logic, frontend components, and tests.
4. **ASK FOR APPROVAL**: Stop and wait for explicit user confirmation.
5. **IMPLEMENT**: Execute only the approved step.
6. **VERIFY**: Run endpoint tests, linting, and build verification.
7. **UPDATE DOCUMENTATION**: Update the relevant Phase MD file and this Master Plan.
8. **MOVE TO NEXT STEP**: Present the next sequential step.
