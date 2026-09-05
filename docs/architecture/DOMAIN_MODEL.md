# Domain Model — 39 Tables

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #3, #6, #9, #16, #20, #39, #42
    Related:      DATABASE.md, ../product/BUSINESS_RULES.md, ../GLOSSARY.md, CONCURRENCY_AND_IDEMPOTENCY.md

## 1. Purpose

Complete inventory of the 39 tables, their ownership, lifecycle, relationships, visibility and
deletion behaviour. Field-level types and exact indexes belong to `generated/erd.md` and
`DATABASE.md` — this document answers *what exists, who owns it, and what must never change.*

## 2. Better Auth-managed (4) — not Settly's schema to design freely

| Table | Purpose | Notes |
|---|---|---|
| **`user`** | The canonical FK root for the entire application. Extended via `additionalFields`: `anonymizedAt`, `preferredLocale` | `role` and `banned`/`banReason`/`banExpires` live here (admin plugin) — required for immediate suspension (#9). No parallel `User`/`UserProfile` |
| **`account`** | Credential storage — password hash, future OAuth links | Was missing from the original 38-model inventory entirely (#39) |
| **`session`** | Live sessions, one row per device | Revocable immediately; cookie cache disabled (#9) |
| **`verification`** | Email verification + password-reset tokens | Replaces the removed `AuthToken` concept |

**No `ON DELETE CASCADE` from `user`** to any business table — deletion is anonymisation, never a
row delete (#39, #42).

## 3. Settly identity (2)

| Table | Purpose | Lifecycle | Deletion |
|---|---|---|---|
| `AgentProfile` | 1:1 agent extension — licence, bio, verification state, brokerage (free text) | Created on agent registration; `verified` set by admin | Deleted on user anonymisation; property attribution survives |
| `UserDevice` | FCM registration tokens | Pruned on invalidation | Hard-deleted on anonymisation |

## 4. Catalog (6)

| Table | Purpose | Key fields | Visibility | Deletion |
|---|---|---|---|---|
| **`Property`** | The listing | `titleEn/Ar`, `descriptionEn/Ar` (at least one pair required), `searchVectorEn/Ar` (generated), `embedding` (one multilingual vector), status (8-state machine) | Public when `PUBLISHED`/`RESERVED` | Only DRAFT-and-never-published may be hard-deleted (Section 2.2, BUSINESS_RULES); else ARCHIVED/SUSPENDED |
| `PropertyImage` | Ordered media, cover flag | Cloudinary refs | Follows property | Deleted with never-published DRAFT only |
| `Amenity` | Controlled vocabulary, `nameEn`/`nameAr` | Reference data | Public | Admin-managed |
| `PropertyAmenity` | Join | — | — | Follows Property row lifecycle |
| **`Area`** | Identity + geography only: `nameEn`, `nameAr`, `aliases[]`, slug, parent, level, boundary, centroid | Self-referencing hierarchy — no `City`/`District` model | Public | Reference data. Guide *content* lives in `KnowledgeArticle`, not here (#39) |
| `PropertyPriceHistory` | Append-only price changes | Powers price-drop alerts | Follows property | Retained with property history |

## 5. Engagement (4)

| Table | Purpose | Constraint |
|---|---|---|
| `Collection` | Named shortlist; default collection replaces a `Favorite` model | — |
| `CollectionItem` | Property in a collection + note | — |
| `SavedSearch` | Persisted filter set + alert cadence | Max 25 per user (I11) — advisory-lock enforced |
| `SavedSearchMatch` | Dedupe ledger, one row per (search, property) notified | Unique(searchId, propertyId) — the entire anti-spam mechanism |

## 6. Pipeline (5)

| Table | Purpose | Key constraint |
|---|---|---|
| `Lead` | Pipeline anchor, one per (buyer, property) | Unique(buyerId, propertyId) |
| `AgentAvailability` | Weekly windows + blackouts, local wall-clock | Resolved to UTC per date (DST-safe) |
| `Viewing` | Booked appointment, `startsAt`/`endsAt` | Exclusion constraint over (agentId, tstzrange) WHERE CONFIRMED |
| **`Offer`** | Stateful negotiation, one row, 10-state machine | Partial unique — at most one RESERVED/COMPLETED per property |
| `OfferRevision` | Append-only proposed terms | One per O1/O2/O3/O1b |

## 7. Payments (5)

| Table | Purpose | Notes |
|---|---|---|
| `Payment` | The obligation — gross/fee/net (piastres), deadline | Survives attempt failures |
| `PaymentAttempt` | One try at Paymob | Failure belongs here, never to `Payment` |
| `Refund` | Full/partial + `feeReturned` | Recoverable 3-step pattern (request→provider→result) |
| **`WebhookEvent`** | Inbound provider events, raw | Unique(provider, eventId) — dedup defence. Raw payload purged after 90d; id kept forever (#42) |
| `IdempotencyKey` | Client-supplied keys + stored response | Postgres, never Redis (#10). 24h expiry |

## 8. Communication (3)

| Table | Purpose | Notes |
|---|---|---|
| `Conversation` | Strictly two-party, per property | Unique(buyerId, agentId, propertyId) |
| `Message` | One message + attachments | Retained with anonymised author on user deletion (#42) |
| `Notification` | In-app authoritative + per-channel delivery JSON | `type`+`params`, rendered at display time in the recipient's locale — no template model |

## 9. Knowledge & AI (6)

| Table | Purpose | Visibility |
|---|---|---|
| **`Document`** | Uploaded file (contract, floor plan), single detected `language` | `PUBLIC` / `PARTY` (live-offer holder) / `PRIVATE` (Section 4.1, BUSINESS_RULES) |
| `KnowledgeArticle` | Area guides/FAQs/help — parallel `titleEn/Ar`, `bodyEn/Ar` | Public when `published` |
| **`Embedding`** | Chunk vectors (documents/articles). `visibilityScope` denormalised, in-query security filter, transactionally synced to its source (#42) | Inherits source scope |
| `AiConversation` | Assistant thread, scoped to a user | User-deletable anytime; 365d inactivity auto-delete |
| `AiMessage` | Turn: tool calls, tokens, latency, detected language, retrieval trace | Never enters RAG itself |
| `AgentRun` | Property Shortlist Agent execution: goal, actor, budgets, scratchpad, step trace (JSONB), result | No `AgentStep` model — JSONB is sufficient at 8-step bound |

## 10. Analytics & governance (4)

| Table | Purpose | Retention |
|---|---|---|
| `PropertyViewEvent` | Raw view events | 365d, then deleted (not anonymised) |
| `SearchEvent` | Query, parsed filters, per-arm timings, zero-result flag, language | 365d, then deleted. Never blocks the search response path |
| **`AuditLog`** | Immutable business/security history. `actorType` includes `AI_TOOL`/`SYSTEM`. Metadata: ids and enums only, never PII (#42) | Indefinite. Database-enforced append-only |
| `Report` | Abuse/inaccuracy reports, triage state | Retained |

## 11. Consequences of Decision #42 (privacy/retention)

- **User anonymisation**: `account`/`session`/`UserDevice`/AI conversations/`AgentRun`/saved
  searches/collections deleted; `user` PII overwritten in place; offers, viewings, payments,
  refunds, audit entries, messages retained
- **Property deletion restriction**: hard delete only from never-published `DRAFT`; else
  `ARCHIVED`/`SUSPENDED`
- **`WebhookEvent`** payload purge at 90d, id retained forever
- **`Embedding`** lifecycle is transactional with its source; drift sweeper alerts on any mismatch
- **`AuditLog`** restricted to ids/enums so anonymisation is never blocked by immutability

## 12. Rejected / do not add

`PropertyTranslation` · `AreaAlias` · `BuyerProfile` · a parallel `User`/`UserProfile` ·
`AuthToken` (removed, replaced by `verification`) · canonical-English fields · `Translation` (UI
strings) · `NotificationTemplate` · `CheckoutHold` (columns on `Property` instead) ·
`NotificationDelivery` (JSON instead) · `PropertyStatusHistory`/`PropertyRevision` ·
`AiToolCall`/`AgentStep` (JSON instead) · `DailyPropertyStat` (materialized view instead) ·
`OutboxEvent` (durable status + sweeper instead) · `City`/`District`/`Compound` · `Favorite` ·
`ConversationParticipant` · a double-entry ledger · agency/organization models. All explicitly
evaluated and rejected in Decisions #3, #6, #12, #39 — do not reintroduce because a pattern is
familiar.

## 13. Pending verification affecting this document

V1/V2 (embedding dimensions, pgvector limits) · V5 (UUIDv7 override) · V12 (session cap) · V20
(`role`/`banned` column types) · V21 (Better Auth CLI schema coexistence) · V22 (verification
token hashing) · V33 (does `prisma migrate` preserve the AuditLog append-only rule and generated
tsvector columns). None verified — see `../DECISIONS.md` Section 2.

## 14. Related documents

`DATABASE.md` for extensions, indexes and constraints · `generated/erd.md` for the exact,
code-generated schema · `../product/BUSINESS_RULES.md` for the state machines these tables
implement.
