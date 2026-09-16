# Settly Decision Record

    Status:       LOCKED (entries #0–#31) · living document
    Last Updated: 2026-09-05
    Decisions:    all
    Related:      README.md, GLOSSARY.md, product/BUSINESS_RULES.md

Append-oriented history of every architectural, product and process decision.

**Entries are never edited except to mark them superseded.** Topic documents describe the
*current* state; this document explains *why* it is that way, and what was rejected.

**Size note:** this file is the one deliberate exception to the ~400–500 line guideline
(Decision #30). Sections 1–3 are designed to be scannable without reading section 4.

---

## 1. Current decision summary

| # | Category | Decision | Status |
|---|---|---|---|
| 0 | Process | Data platform decided before frontend; payment object treated as product scope | LOCKED |
| 1 | Product | **Package B** — discovery → viewing → offer → reservation deposit. Sale-first; rent is discovery/viewing only; independent agents, no agency entity | LOCKED |
| 2 | Product | Market **Egypt**, currency **EGP** | LOCKED |
| 3 | Domain | 8 core journeys; 36 models in 8 modules | **AMENDED by #39** |
| 4 | Product | ~~English-only UI~~ -> **full bilingual UI (/en + /ar) with RTL** | **REVERSED by #39** |
| 5 | Domain | Four lifecycle state machines: Property 8 · Viewing 8 · Offer 10 · Payment 7 states | LOCKED |
| 6 | Data | **PostgreSQL 17** + PostGIS + pgvector + pg_trgm + FTS | **AMENDED by #39** (FTS) |
| 7 | Data | **Prisma** ORM; custom SQL for PostGIS / pgvector / exclusion constraints / hybrid ranking | LOCKED |
| 8 | Backend | Separate API + frontend; **Express 5** + Node 22 LTS + TS; 11 modules; REST `/api/v1`; Zod | LOCKED · **extended by #40** |
| 9 | Auth | **Better Auth** owns authentication and sessions; Settly owns all authorization | LOCKED |
| 10 | Reliability | READ COMMITTED + conditional updates; constraints over locks; Redis for BullMQ + rate limiting only | LOCKED |
| 11 | Reliability | **15-minute exclusive checkout hold**; deposit remains the commitment point *(amends #5)* | LOCKED |
| 12 | Reliability | Three-tier rate-limit degradation; sensitive endpoints never lose shared protection | LOCKED |
| 13 | Payments | **Paymob**, hosted redirect checkout; synchronous methods only in v1 | LOCKED · **refined by #42** |
| 14 | Search | Three execution paths; hard constraints always structured; RRF fusion | LOCKED · **refined by #40** (HTTP projection) |
| 15 | Search | ~~Canonical English description~~ | ❌ **REVERSED by #39** |
| 16 | Data | **`SearchEvent`** added as model #37 | LOCKED |
| 17 | AI | Two-tier models; AI SDK orchestration; RAG scope; tool boundary; recommendations | LOCKED |
| 18 | Process | **Separate projects**, one repo; OpenAPI as the contract | LOCKED |
| 19 | AI | Exactly one bounded, read-only **Property Shortlist Agent** | LOCKED · **generalised by #41** |
| 20 | Data | **`AgentRun`** added as model #38 | LOCKED |
| 21 | Frontend | Next.js App Router; SEO server-rendered, dashboards CSR; SSE realtime | **AMENDED by #39** (RTL) & **#43** (WebSocket chat) |
| 22 | Infra | Vercel + Railway (2 services) + Supabase; backend must be always-on | LOCKED · **refined by #44** |
| 23 | Frontend | Five distinct rendering modes; only `/properties` is SSR | **AMENDED by #39** (locales) |
| 24 | AI | **Google Gemini** primary ecosystem; **no reranker in v1** *(amends #17)* | LOCKED · strengthened by #39 |
| 25 | Storage | Cloudinary = public images; **Supabase Storage = private RAG documents** | LOCKED |
| 26 | Reliability | Redis caching narrowed to the hybrid-search result list only *(clarifies #10)* | LOCKED · **refined by #44** |
| 27 | Process | Seed data + retrieval evaluation as one first-class deliverable, with a pre-committed gate | LOCKED · **extended by #39** |
| 28 | Product | Admin scope reduced; no analytics dashboards in v1 | LOCKED |
| 29 | Process | Reduce scope by **sequencing**, never by weakening architecture | LOCKED |
| 30 | Process | Three-tier documentation lifecycle | LOCKED |
| 31 | Process | Business constants have a single authoritative code definition | LOCKED |
| 32 | Process | Pre-committed retrieval evaluation thresholds *(part of #27)* | LOCKED |
| 33 | Security | Security & operations model — layered, proportionate, no security theater | LOCKED · **refined by #42** |
| 34 | Ops | **Pino** for all logging — Morgan and Winston removed | LOCKED |
| 35 | Domain | Email-verification guards + invariants **I11** and **I12** *(amends #5)* | LOCKED |
| 36 | Ops | Email provider: **Resend** (all environments, Mailpit eliminated) | **LOCKED by #44** *(was provisional)* |
| 37 | Process | Local-vs-production environment model + the substitution rule | LOCKED · **refined by #44** |
| 38 | Domain | **The verification boundary** — a principle replacing the guard list; adds O3 and O5 *(amends #35)* | LOCKED |
| 39 | Domain | **Domain model reconciliation** — Better Auth identity, document visibility, multilingual content. **39 tables** | LOCKED · **refined by #42** |
| 40 | API | **API contract shape** — bare resources, action endpoints, error taxonomy, cursor contract | LOCKED |
| 41 | Testing | **Testing architecture** — six layers, real Postgres/Redis, gates vs reports | LOCKED |
| 42 | Privacy | **Privacy, retention & data lifecycle** — deletion model, retention windows, AI boundary | LOCKED |
| 43 | Communication | **Real-time communication** — native **WebSocket** for 1-on-1 Chat, **SSE** for In-app notifications *(amends #21)* | LOCKED |
| 44 | Infra | **Managed services** — **Upstash Redis** (BullMQ, rate limit, cache, WS pub/sub) & **Resend** (real email) *(locks #36)* | LOCKED |

**Model count: 39 tables — 4 Better Auth-managed, 35 Settly-owned (#39).**
**No application code exists yet.**
**✅ ARCHITECTURE CLOSED at #44.** Next phase: Tier-B Documentation.
**Current phase: local development only — no deployment exists.**

---

## 2. Pending verification checklist

Active checklist, not notes. Nothing here may be implemented as though final.
Lifecycle: `PENDING VERIFICATION → Verified → Decision updated → Related docs updated`.

| # | Item | Blocks | Status |
|---|---|---|---|
| V1 | Gemini embedding model: **`gemini-embedding-001`** (native 3072 dims; MRL `outputDimensionality: 1536`; mandatory post-truncation $L_2$ re-normalization; \$0.15/1M tokens; `text-embedding-004` deprecated/404) | **First migration** — it is a schema decision | ✅ **Verified** (2026-09-14) |
| V2 | pgvector on Supabase: v0.7.0+; HNSW ceiling is 2,000 dims for standard `vector`; `vector(1536)` fits natively with `vector_cosine_ops`; `halfvec` (float16) verified up to 4,000 dims as 3072 fallback | First migration | ✅ **Verified** (2026-09-14) |
| V3 | **Arabic retrieval quality** against the evaluation set and the thresholds in §Decision 27 | The entire bilingual search design (#14, #15) | ☐ Open |
| V4 | Paymob: HMAC field list and ordering, partial-refund availability on the account tier, current fee schedule | Webhook verification (#13) | ☐ Open |
| V5 | Better Auth: `bearer` plugin built-in; `advanced.database.generateId` overrides IDs with UUIDv7 cleanly for all models (`user`, `session`, `account`, `verification`); Expo plugin not required for web | First auth migration (#9) | ✅ **Verified** (2026-09-14) |
| V6 | Prisma over Neon's PgBouncer pooler: Neon supports protocol-level prepared statements (`max_prepared_statements`); removing `pgbouncer=true` eliminates 4–5 round trips and repeated `DEALLOCATE ALL`, reducing statement latency from ~494ms to ~85ms | Connection configuration | ✅ **Verified** (2026-09-16) |
| V7 | Next.js fetch-caching semantics for the installed major version | ISR behaviour (#23) | ☐ Open |
| V8 | Supabase tier before the public demo — free-tier inactivity suspension | Demo reliability (#22) | ☐ Open |
| V9 | Gemini data-use terms if real user content ever reaches a prompt | Privacy posture (#24) | ☐ Open |
| V10 | Partial Prerendering stability, only if used on `/` | Optional (#23) | ☐ Open |
| V11 | **`btree_gist` availability and version on Supabase** — a *fifth* required extension, needed by the viewing exclusion constraint. Trivially available in the local Docker image | Deployment (#33) | ☐ Open |
| V12 | Better Auth session lifetime: sliding expiry supported natively (`session.expiresIn = 7d`, `session.updateAge = 1d`); absolute 30-day cap enforced by clamping `expiresAt` against immutable `session.createdAt` | Session config (#33) | ✅ **Verified** (2026-09-14) |
| V13 | **Vercel stable preview-domain aliasing** for the CORS allowlist. ⚠️ Regex-matching `*.vercel.app` would let any Vercel deployment make credentialed requests | Deployment (#33) | ☐ Open |
| V14 | **Sentry Crons** capability and free-tier quota — the primary replacement for a metrics stack | Deployment (#33) | ☐ Open |
| V15 | Supabase Storage signed-URL expiry and single-use semantics | Deployment (#33) | ☐ Open |
| V16 | **Cloudinary signed upload preset constraints** — needed *now*, since Cloudinary is real in local development | Current (#33) | ☐ Open |
| V17 | Railway healthcheck path and restart configuration | Deployment (#33) | ☐ Open |
| V18 | **Resend** — domain verification, SPF/DKIM/DMARC, pricing, free-tier limits, bounce/complaint webhooks, React Email compatibility | Production email (#36) | ☐ Open |
| V19 | Better Auth `additionalFields` — supported types, **specifically JSON/object support** for notification preferences | Where preferences live (#39) | ☐ Open |
| V20 | Better Auth admin plugin: exact columns are `role` (mapped to native PG `Role` enum `USER`/`AGENT`/`ADMIN`), `banned` (bool), `banReason` (text), `banExpires` (timestamp); immediate ban block verified | **First migration** (#39) | ✅ **Verified** (2026-09-14) |
| V21 | Better Auth Prisma coexistence: CLI generation risks overwriting custom relations; resolution is maintaining Better Auth models explicitly in Settly's primary `schema.prisma` via `prismaAdapter` | **Migration workflow** (#39) | ✅ **Verified** (2026-09-14) |
| V22 | Better Auth token hashing: default stores plaintext tokens; mandatory `verification: { storeIdentifier: "hashed" }` verified to store SHA-256 digests in `verification.identifier` at rest | Security posture (#39) | ✅ **Verified** (2026-09-14) |
| **V23** ⭐ | **Gemini AR↔EN cross-lingual retrieval quality specifically** — not merely "handles Arabic". With canonical English removed, the model is *solely* responsible for cross-language retrieval | **The entire retrieval design** (#39) | ☐ Open |
| **V24** ⭐ | **Arabic normalisation function** validated against the evaluation set — measure recall with and without | Arabic FTS quality (#39) | ☐ Open |
| V25 | Next.js App Router i18n routing and its interaction with ISR + `generateStaticParams` across locales | Rendering (#39) | ☐ Open |
| V26 | RTL maturity of shadcn/Radix, MapLibre controls and Arabic tile labels, Recharts axis orientation | Frontend components (#39) | ☐ Open |
| V27 | Numeral convention for the Arabic UI — Western (`123`) vs Arabic-Indic (`١٢٣`). **Explicitly NOT an architectural blocker** — a product/design decision during Stitch | Design (#39) | ☐ Deferred |
| **V28** ⭐ | **Zod → OpenAPI generator capability**: `@asteasolutions/zod-to-openapi` (v7 for Zod 3) empirically verified (`backend/test/spikes/v28-openapi.test.mjs`). Correctly expresses discriminated unions, `application/problem+json` oneOf error schemas, required header parameters (`idempotency-key`), and `text/event-stream` SSE endpoints | **The whole contract workflow** (#40) | ✅ **Verified** (2026-09-14) |
| V29 | `openapi-typescript` / `openapi-fetch` handling of `application/problem+json` — does the generated client surface non-2xx bodies as a typed error union? | Frontend error handling (#40) | ☐ Open |
| **V30** ⚠️ | **Express 5 + SSE vs compression middleware**: Empirically verified (`backend/test/spikes/v30-sse.test.mjs`) that Express 5 streams SSE chunks immediately without buffering. Compression middleware is explicitly omitted from streaming routes | SSE contract (#40) | ✅ **Verified** (2026-09-14) |
| V31 | Better Auth mount-prefix flexibility: In Express 5 (`path-to-regexp` v8), mounting Better Auth via `app.use('/api/auth', toNodeHandler(auth))` correctly handles all subroutes without `path-to-regexp` wildcard errors, isolating library auth routes from `/api/v1/*` | Auth surface (#40) | ✅ **Verified** (2026-09-14) |
| V32 | GitHub Actions CI Postgres with **PostGIS + pgvector + pg_trgm + btree_gist**: Stock `postgres` image lacks PostGIS and pgvector. Running `docker compose up -d postgres redis` on GitHub Actions runners builds `docker/Dockerfile.postgres` (`postgis/postgis:16-3.4` + `postgresql-16-pgvector`) and initializes all 5 extensions via `init-db.sql` in ~8s, providing 100% dev/CI parity without external registry rate limits or supply-chain drift | **CI setup** (#41) | ✅ **Verified** (2026-09-14) |
| **V33** ⭐ | Prisma migrate custom triggers & rules: hand-written SQL migrations (AuditLog append-only trigger, Viewing exclusion constraints, custom tsvector expressions) persist untouched across subsequent migrations; Prisma migrate diffs only schema-defined objects and does not drop unmanaged triggers or rules | **First migration** (#41, #42) | ✅ **Verified** (2026-09-14) |

### 2.1 When each item actually blocks

| When | Items |
|---|---|
| **Before the first migration** | V1 · V2 · V5 · V12 · **V20 · V21 · V22 · V33** |
| **Before the first endpoint** | **V28 · V30 · V31** |
| **Before CI is wired** | **V32** |
| **Now, as Cloudinary is wired** | V16 |
| **Before the seed / AI phase** | **V3 — the retrieval gate** · **V23 · V24** |
| **Before payment work is complete** | V4 (requires a sandbox test) |
| **During frontend work** | V7 · **V29** |
| **Before deployment only** | V8 · V9 · V10 · V11 · V13 · V14 · V15 · V17 · V18 |

Four items gate the first migration. Everything else waits for the phase that needs it.

**An implementation must never silently settle a pending item.** Verify against current
documentation or an integration test, update the decision, update the affected documents, then
implement. **"It sounds plausible" is not verification.**

---

## 3. Decision index

- **Product & domain:** #1, #2, #3, #4, #5, #28, **#35, #38, #39**
- **API contract:** **#40**
- **Testing:** **#41**
- **Privacy & retention:** **#42**
- **Data & persistence:** #6, #7, #16, #20, #25
- **Backend & auth:** #8, #9
- **Reliability & concurrency:** #10, #11, #12, #26
- **Payments:** #13
- **Search & AI:** #14, #15, #17, #19, #24
- **Frontend:** #21, #23
- **Infrastructure:** #22, **#37**
- **Security & operations:** **#33, #34, #36**
- **Process:** #0, #18, #27, #29, #30, #31, #32

---

## 4. Detailed entries

Entries are weighted by consequence. High-impact decisions carry the full record; settled or
minor decisions are compact.

---

### #0 — Decision ordering
`2026-09-05` · **LOCKED** · Process

Data platform decided before frontend, because the Postgres-extensions choice determines
infrastructure, local development, and whether filtered semantic search is one query or two
systems. "What is the user paying for" was moved from the payments phase into product scope,
because it determines the payment state machine, refund rules and several models.

---

### #1 — Product scope: Package B (high impact)
`2026-09-05` · **LOCKED** · Product · Affects: `product/OVERVIEW.md`, `product/REQUIREMENTS.md`

**Context.** Scope failure in projects this size comes from too many *lifecycles*, not too many
features. Each lifecycle carries a state machine, notification rules, permissions, edge cases,
screens and tests.

**Options.**
- **A — Discovery & Intelligence:** search/AI/RAG, viewings, messaging. No offers. Payments limited to listing promotion. ~24 models.
- **B — Full Buyer Journey:** A plus a real offer lifecycle on sale listings plus a reservation deposit tied to an accepted offer. ~31 models, later 38.
- **C — Complete Marketplace:** B plus rental applications, leases, recurring rent, agencies, agent subscriptions, mortgage partners. ~55 models.

**Decision. Package B.** Sale-first. Rent exists as a listing type for discovery, viewings and
inquiries but has **no** offer or application lifecycle. Independent agents only — **no agency
entity**. The payment object is a **reservation deposit against an accepted offer**.

**Rationale.** Without offers the payment system has nothing to be coupled to, so transaction
atomicity, race conditions and idempotency become academic rather than real. "Accept offer plus
supersede competing offers plus create a deposit obligation plus notify" is a genuine multi-write
atomicity problem with a genuine concurrency problem on top. Rent-as-discovery-only buys real
product surface at near-zero domain cost. An agency entity would add a permission dimension to
every authorization check in the system, permanently, for no new capability.

**Trade-offs.** The offer-to-deposit coupling is the hardest part of the build. No rental
transactional story, which a real portal would have.

**Rejected payment objects.** Viewing reservation fee — uncommon in the real market, reads as
invented. Listing promotion — realistic, but sits in a corner touching nothing; kept as an
optional post-v1 addition since it exercises entitlements and expiry.

---

### #2 — Market and currency
`2026-09-05` · **LOCKED** · Product

**Egypt, EGP.** Consequences carried forward: Stripe cannot onboard Egyptian entities for payouts,
so the provider field is Paymob/Kashier/Fawry (#13); the timezone is Africa/Cairo with DST observed
again since 2023, so viewing slots are never stored as naive local time (#6); listing content may
be Arabic, affecting FTS configuration and embedding-model choice (#6, #24); money is stored in
integer minor units, piastres.

---

### #3 — Core journeys and entity skeleton
`2026-09-05` · **LOCKED · identity + Area/KnowledgeArticle overlaps corrected by #39** · Domain · Affects: `architecture/DOMAIN_MODEL.md`

8 journeys: buyer primary path, passive discovery, AI-assisted discovery, agent onboarding,
listing lifecycle, agent pipeline, admin, notification fan-out. **36 models** across Identity,
Catalog, Engagement, Pipeline, Payments, Communication, Knowledge and AI, Analytics. Later grew to
**38** via #16 and #20.

**Key modelling calls.** `Area` is a **self-referencing hierarchy** — governorate, city, district,
compound — so there is deliberately **no `City` or `District` model**. `Lead` is the pipeline
anchor, unique per buyer-property pair. `Offer` is stateful; `OfferRevision` is append-only
history. `Payment` is the obligation and `PaymentAttempt` is one try, so failure is an attribute of
an attempt rather than of the obligation. `Conversation` is strictly two-party, so there is no
participant table. Notification *preferences* are a JSON column on `User`.

**Deliberately not modelled.** A double-entry ledger — with one provider, one currency and one
payment type, `Payment` plus `PaymentAttempt` plus `Refund` plus `WebhookEvent` plus `AuditLog`
already give a fully reconstructable history. `AiToolCall`, which would be a 1:1 satellite of
`AiMessage`. Daily stat rollups, which are materialized views. A generic outbox table, see #8.

**User ruling:** models are justified by requirements, never trimmed to hit a target count.

---

### #4 — UI and content language
`2026-09-05` · ❌ **REVERSED BY #39** · Product

English-only UI. Content is language-agnostic: Arabic or English listings are both first-class. AI
is bilingual where practical. UI chrome stays LTR; user-generated content requires `dir="auto"`, an
Arabic-capable font, and bidi isolation (#21).

---

### #5 — Lifecycle state machines (high impact)
`2026-09-05` · **LOCKED** · Domain · Amended by #11 · Affects: `product/BUSINESS_RULES.md`

Property 8 states, Viewing 8, Offer 10, Payment 7 plus PaymentAttempt 6 and Refund 4. Full
transition tables live in `product/BUSINESS_RULES.md`.

**Defining decisions.**
- **The paid deposit, not offer acceptance, is the commitment point.** Multiple offers may sit in
  `ACCEPTED` simultaneously and race to fund. *User ruling, reflecting Egyptian practice.*
- **Viewing exclusivity attaches at `CONFIRMED`, not `REQUESTED`**, moving contention off the
  high-volume buyer path onto the low-volume agent path.
- **Failure belongs to `PaymentAttempt`, not `Payment`.** A declined card fails one attempt; the
  obligation returns to `PENDING` for retry.
- **Two offline escape hatches**, because not every Egyptian deal walks the in-app path:
  agent-initiated offers, and a direct `PUBLISHED` to `SOLD` transition.
- **Two-tier edit moderation.** Structural fields — address, geo, type, area, images, title —
  trigger blocking re-review. Content fields — price, description, amenities — stay live with a
  non-blocking recheck flag. Instant price edits matter: stale prices are the top complaint on
  every property portal.

**Correction recorded.** Viewing exclusivity is enforced by an **exclusion constraint over a
`tstzrange`**, not a unique index on the start instant — viewings have duration, and a 14:00–15:00
booking must block a 14:30 request.

---

### #6 — Data platform (high impact)
`2026-09-05` · **LOCKED · FTS approach amended by #39** · Data · Affects: `architecture/DATABASE.md`

**PostgreSQL 17** with **PostGIS**, **pgvector**, **pg_trgm** and FTS.

**Why Postgres specifically.** Four capabilities we had already committed to needing are
Postgres-only: partial indexes, exclusion constraints, PostGIS and pgvector. In MySQL each would
have become application code, which is to say each would have become a bug.

**pgvector over Pinecone, Qdrant and Weaviate.** The decisive factor is not scale but
**filtering**. Every semantic query in Settly carries hard predicates — status, price, bedrooms,
area. An external vector store means replicating price into a second system, creating a second
source of truth for the field users filter on most. With pgvector the filter and the vector search
are one planned query. It also removes an entire failure domain: there is no "the vector database
is down" state independent of "the database is down".

**Vector placement.** The property vector is a **column on `Property`** with a partial HNSW index
`WHERE status = 'PUBLISHED'`; the `Embedding` table holds document and article chunks. One vector
per row means a column; many vectors per source means a table.

**Arabic and FTS.** Postgres ships no Arabic text-search configuration. Rather than add Meilisearch
or Typesense — a third stateful system and a second source of truth for listings — we use
`english`/`simple` per row language plus `pg_trgm`, and let the **multilingual embedding model
carry Arabic recall**. Because the configuration varies per row, the `tsvector` cannot be a
generated column and must be trigger-maintained.

**Also locked.** Money as `BIGINT` piastres plus an explicit currency column. `timestamptz` UTC
plus IANA zone, with availability stored as local wall-clock and resolved per date so DST cannot
shift a booking. UUIDv7 everywhere plus an SEO slug on `Property`. Native PG enums for the locked
state machines. **No global soft-delete** — lifecycle states already express withdrawal, and a
blanket `deleted_at` poisons every query and silently breaks unique constraints.

---

### #7 — ORM: Prisma
`2026-09-05` · **LOCKED** · Data · *User decision, against the standing recommendation*

**The recommendation was Drizzle**, on the grounds that Settly's hardest queries — filtered vector
search, geospatial ranking, hybrid fusion — are ones Prisma cannot express, so the difficult 30%
would fall out of the type system into raw SQL.

**The user chose Prisma** for developer experience, type safety, relational modelling, migrations
and productivity across the majority of the application, with **Prisma migrations carrying custom
SQL** for PostGIS, pgvector, exclusion constraints and triggers, and **TypedSQL or raw SQL** for
the limited set of complex queries.

**User ruling.** Using raw SQL for these cases is **not** an architectural failure. The goal is
Prisma for the application and data-access layer while allowing PostgreSQL-specific capabilities
where they provide real value.

**Containment.** Raw SQL lives only in `sql/`, each query a named, individually tested function
with an explicit return type (#8). That containment is what makes the split healthy rather than
leaky.

---

### #8 — Backend core (high impact)
`2026-09-05` · **LOCKED · contract shape specified by #40** · Backend · Affects: `architecture/BACKEND.md`, `architecture/API.md`

Separate API service and Next.js frontend, deployed as `app.settly.com` and `api.settly.com` so
the session cookie is **same-site** and `SameSite=Lax` suffices — one DNS decision that removes a
class of CSRF work. **Express 5** with Node 22 LTS, TypeScript strict, ESM.

**11 modules:** identity, catalog, engagement, pipeline, payments, messaging, notifications,
knowledge, ai, search, analytics. There is deliberately **no `admin` module** — admin operations
belong to whichever module owns the data, otherwise an admin module becomes a god-object.

**Three boundary rules, ESLint-enforced.** Modules call each other only through exported service
interfaces. **Prisma is imported only in `repository/`.** **Raw SQL lives only in `sql/`.**

**No outbox model.** Enqueueing to BullMQ is a Redis write and cannot be atomic with Postgres.
Rather than add a generic outbox, **every async workload gets a durable status column that a
sweeper re-drives** — the `Notification` row is written inside the transaction and a 60-second
sweeper re-enqueues anything still pending. Each table is its own outbox.

**Authorization lives in the service layer**, not HTTP middleware, which is what lets AI tools and
the agent inherit policy checks structurally — there is no middleware to bypass.

**Rejected.** Fastify, which was recommended and overridden by the user in favour of Express 5.
NestJS, whose DI and decorators abstract away exactly the wiring the project exists to teach. Hono.
GraphQL — one client, and it discards HTTP caching. tRPC — welds the frontend to backend TypeScript
and produces no inspectable contract. Next.js full-stack — cannot host long-running workers.

---

### #9 — Authentication: Better Auth (high impact)
`2026-09-05` · **LOCKED** · Auth · *User-initiated, evaluated then adopted*

**Boundary.** Better Auth owns credential verification, sessions, logout and revocation, email
verification, password reset, and the `user`, `session`, `account` and `verification` tables.
**Settly owns all authorization**, roles as business data, resource policies, and the immutable
AuditLog fed by Better Auth hooks.

**Rationale.** Not code reduction — a custom bearer path would be about twenty lines. The argument
is **security maintenance and future extensibility**: authentication is the one subsystem where the
cost is not the initial write but the indefinite obligation to keep it correct, and where the
plausible next features — OAuth, 2FA, passkeys, mobile — each cost days custom and minutes
configured.

**Eight non-negotiable configuration items.**
1. **Cookie cache DISABLED.** Otherwise a suspended user stays authenticated for the cache TTL,
   reintroducing exactly the staleness problem that disqualified stateless JWTs.
2. UUIDv7 id generation wired in **before the first migration**.
3. Argon2id overriding the default scrypt.
4. Cross-subdomain cookies on `.settly.com` plus a trusted-origin allow-list.
5. Audit hooks on login, logout, password reset, session revocation and ban.
6. Auth handler mounted **before** `express.json()`; webhook routes keep raw body.
7. Declared exception to the repository rule: Better Auth **is** the identity module's repository
   for auth tables.
8. Known seam: user creation in Better Auth and `AgentProfile` creation in Settly are **not one
   transaction**. Handled by an after-create hook plus a reconciliation path on the first
   agent-scoped request.

**Plugins used.** `admin` for ban and revocation mechanics only — **not** its access-control DSL;
`bearer`, which keeps React Native possible later; built-in rate limiting.
**Later if justified.** `expo`, `twoFactor` for agents and admins, Google OAuth.
**Not used.** `organization`, `multiSession`, `username`, `passkey`, `magicLink`, `emailOTP`,
`phoneNumber`, **`jwt`** which reintroduces the revocation problem, `apiKey`, `sso`,
`oidcProvider`, payments plugins.

**Rejected alternatives.** Custom sessions, the original design — secure, but trades future
extensibility and ongoing security maintenance. **Supabase Auth** — JWT sessions fail the
immediate-suspension requirement, and `auth.users` lives in a schema Prisma cannot migrate, forcing
a `profiles` mirror and a second source of truth for identity. Auth.js, which is Next-shaped and
weak on credentials. Lucia, sunset as a library. Clerk, Auth0 and WorkOS — per-MAU pricing, user
data off-platform, and every foreign key becomes a foreign identifier needing webhook sync.

---

### #10 — Reliability (high impact)
`2026-09-05` · **LOCKED** · Reliability · Affects: `architecture/CONCURRENCY_AND_IDEMPOTENCY.md`

**Governing principle: correctness lives in database constraints and conditional updates.
Isolation levels and locks are escalations, used only where constraints cannot express the rule.**

**`READ COMMITTED` default.** Under Read Committed a blocked `UPDATE` re-evaluates its `WHERE`
clause against the new row version, which makes a conditional update a genuine atomic
compare-and-swap. Since every transition in #5 changes a status column, **the state machines give
us optimistic concurrency for free** — no version column, no retry loop.

**Exactly two escalations.** A transaction-scoped **advisory lock** for the open-viewing-request
cap, because write skew applies and "at most N rows matching a predicate" is not expressible as a
constraint — and locking the `user` row would contend with Better Auth. And **`SELECT … FOR
UPDATE`** on `Payment` for the refund-sum invariant, because money must be exact and refunds are
rare. **`SERIALIZABLE` is used nowhere**: it would force retry handling on every transaction to
solve two problems that two targeted mechanisms already solve.

**Nine of eleven races are solved by a constraint or a conditional update** — the deposit race by a
partial unique index, duplicate webhooks by a unique constraint on the provider event id, viewing
overlap by an exclusion constraint, concurrent offer edits by status-as-CAS.

**Idempotency.** An `Idempotency-Key` header on four endpoints only: create payment attempt,
request refund, create viewing request, submit offer. Keys live in **Postgres, not Redis** — they
must be durable and must commit atomically with the operation they protect. The payload hash is
compared, and the **original status code** is replayed on retry. Webhooks use a different key
source, the provider event id; jobs use a third, deterministic job ids.

**Redis is justified for BullMQ and distributed rate limiting, and rejected as a cache.** Property
detail is already cached at the edge by ISR; area statistics belong in materialized views, which
keep them in Postgres, joinable, with no invalidation logic. See #26 for the final narrow scope.

**Every external dependency except Postgres is non-critical.** Redis, Cloudinary, Paymob, FCM, the
LLM and the embedding provider can each fail without taking the product down, because durable state
lives in Postgres and a sweeper re-drives the work.

---

### #11 — Deposit race: the checkout hold
`2026-09-05` · **LOCKED** · Reliability · *Amends #5*

**Problem.** Because the deposit is the commitment point, two buyers holding `ACCEPTED` offers can
both pay before either webhook lands. The loser's money is already captured — correct engineering
producing a terrible experience, plus provider fees on both legs.

**Options.** (a) allow the race and auto-refund the loser; (b) a short exclusive checkout hold.

**Decision: (b), a 15-minute exclusive hold**, taken by conditional update when checkout starts.
The hold reserves nothing legally and grants no rights; **the deposit remains the commitment
point**. The automatic full-refund path is kept as the fallback for residual races and for holds
that expire mid-payment.

**Rationale.** It moves contention from *after* money moves to *before* it — onto an operation that
is free, instant and reversible. It also constrains payment methods; see #13.

---

### #12 — Rate-limit degradation
`2026-09-05` · **LOCKED** · Reliability · *User amendment to a weaker proposal*

The original proposal was to fail open on a Redis outage. **The user required that sensitive
endpoints never lose protection.** The resulting three-tier degradation:

| Tier | Redis healthy | **Redis down** | Both down |
|---|---|---|---|
| **A** — login, password reset, verification, payment operations | Redis counters | **Postgres-backed counters, limits tightened ~50%** | In-memory, hard floor |
| **B** — authenticated writes | Redis counters | In-memory, divided by instance count | In-memory |
| **C** — public reads | Redis counters | Fail open, generous cap | Fail open |

Postgres counters stay **shared across instances**, which is the property in-memory limiting loses
and the only one that matters against an attacker. Always on regardless of Redis health: per-account
exponential lockout independent of IP. Entering fallback raises an immediate alert.

---

### #13 — Payments: Paymob (high impact)
`2026-09-05` · **LOCKED · webhook payload retention refined by #42** · Payments · Affects: `architecture/PAYMENTS.md`

**Provider: Paymob**, chosen for payment-method breadth, the best developer documentation in the
Egyptian market, sandbox access without commercial registration, and HMAC-signed callbacks.
Rejected: Kashier as smaller; Fawry, strongest on cash but with heavy onboarding and worth adding
later *specifically for cash*; PayTabs, Geidea and APS for enterprise onboarding; Stripe, which
cannot onboard Egyptian entities.

**Hosted redirect checkout, never embedded card fields.** Settly never accepts, transmits, logs or
stores a card number, CVV or expiry — not in the database, not in logs, not in an error report.
This keeps PCI scope at its lightest.

**v1 accepts synchronous methods only** — card, wallet, instalments. **Kiosk, cash and manual bank
transfer are deferred to v2** because they complete in *hours* and cannot fit inside the 15-minute
hold from #11. When they are added the rule is already set: holds are granted only to synchronous
methods.

**Deposit rule: 5% of property price, capped at 50,000 EGP.**

**Webhook verification, in strict order** — nothing before step 3 is trusted: read the raw body,
verify the HMAC, parse, map to a known Payment, **assert amount and currency match exactly**,
insert `WebhookEvent` with its unique provider event id so a duplicate returns 200 immediately,
interpret the provider flags, apply the transaction, return 200. Return 5xx only on genuine
failure, so that Paymob retries.

**Two Paymob specifics.** Its HMAC is computed over a **specific ordered concatenation of
transaction fields**, not over the raw request body — the usual "HMAC the raw bytes" instinct
produces a signature that never matches. And its callbacks carry several boolean flags whose
meaning lives in the **combination**; never branch on `success` alone.

**Refunds.** A single `reverse(attempt, amount)` operation choosing void or refund by settlement
window, using the recoverable three-step pattern — record intent, call the provider, record the
result — with a durable state in between. **The provider generally does not return the processing
fee on a refund**, so gross, fee and net are modelled explicitly on `Payment`, and `fee_returned`
on `Refund`. Without them, financial reporting silently overstates revenue.

**Provider port.** Four methods, one adapter, justified primarily by **testability**: a fake
adapter makes the entire payment state machine and every race testable in CI without touching
Paymob.

**Five invariants.** The frontend can never mark a payment successful. Webhooks may arrive any
number of times, in any order, with the same outcome. **If webhooks stop entirely, reconciliation
still settles every payment** — webhooks are latency, not correctness. Captured money is always
either applied or refunded, never neither. Every transition is audited.

---

### #14 — Search architecture (high impact)
`2026-09-05` · **LOCKED · HTTP projection refined by #40** · Search · Affects: `architecture/SEARCH.md`

**Three execution paths behind one endpoint**, because routing all traffic through one pipeline
makes the common case pay for the rare one:

| Path | Composition | Share |
|---|---|---|
| Filter search | Structured SQL plus PostGIS. No vector, no LLM | ~70% |
| Map viewport | PostGIS plus server-side clustering | Very high frequency |
| Natural language | Query understanding, then four arms, then fusion | ~25% |

**Hard constraints are always structured filters, never the vector arm.** Embeddings encode
"affordable" as a fuzzy direction, not as an inequality: a semantic search for "under 5 million"
will return a 12M villa whose description says "affordable luxury". Query understanding extracts
constraints into SQL and hands the vector arm only residual intent text.

**Query understanding.** Deterministic extraction first — price patterns, bedroom patterns, an
Area gazetteer matched against real rows, amenity synonyms — with the **LLM invoked only on
residual intent text**. The model **proposes and the backend disposes**: every returned filter
value is Zod-validated *and* checked against real `Area` and `Amenity` rows, so it can never
introduce a value that does not exist. Parses are cached. Parsed filters are surfaced to the user
as **removable chips**, which turns an opaque AI into a correctable one.

**Selectivity switch.** Below roughly 1,000 candidates, compute exact distances over the candidate
set — faster *and* more accurate than approximate search. Above that, use the HNSW index with
iterative scan. Do not approximate what you can compute exactly.

**Fusion: Reciprocal Rank Fusion**, k around 60. Not weighted score fusion: `ts_rank` and cosine
distance live on incomparable scales and any invented normalization drifts as the corpus changes,
a well-known source of "search got worse and nobody knows why". Business boosts — freshness,
completeness, agent responsiveness — are applied afterwards, additively and **capped**, so they can
reorder near-equivalent results but never float an irrelevant listing above a relevant one.

**Map.** Server-side clustering; the semantic result set is computed **once per query** and then
geo-filtered on pan, so panning never re-runs the LLM parse or the vector search.

**Pagination.** Keyset for filter search. For hybrid, the fused ranking has no stable SQL sort key,
so the top ~500 are materialized once and cached, and pagination happens within that list. *This
amends #10: Redis search caching is justified — for hybrid text queries only, never for viewports.*

**Degradation: every arm is optional except the structured one.**

**SEO correction.** Indexing arbitrary filter combinations creates infinite crawl space and
duplicate content. Filtered search pages are `noindex`; organic discovery comes from a curated set
of ISR facet landing pages.

---

### #15 — Canonical English description
`2026-09-05` · ❌ **REVERSED BY #39** · Search · *User-constrained*

At publish time a canonical English description is generated from whatever language the agent
wrote in, and used for the lexical index and the embedding. This makes cross-language **lexical**
search work and keeps embeddings stylistically consistent.

**User constraint, strict.** It must be a **faithful translation and normalization only** — never
inventing, inferring, embellishing or adding facts absent from the original. It is **never a
business source of truth** and is **never displayed to users**. The original remains the display
source of truth.

That containment is what makes it safe: a hallucination degrades ranking slightly; it cannot show
a buyer a false claim about a property.

---

### #16 — `SearchEvent` as model #37
`2026-09-05` · **LOCKED** · Data

Captures normalized query, parsed filters, per-arm timings, result count, **zero-result flag** and
clicked position. Zero-result queries are the highest-value dataset the product generates: they say
exactly what buyers want and cannot find, in their own words. Search quality is Settly's
differentiator and cannot be improved without this data. Per #28, the data is captured but **no
analytics dashboard is built in v1**.

---

### #17 — AI architecture (high impact)
`2026-09-05` · **LOCKED, amended by #24** · AI · Affects: `architecture/AI.md`, `architecture/RAG.md`

**Two-tier models.** Query understanding is high-volume and latency-critical, under ~400 ms, and
trivially easy; the assistant is low-volume, latency-tolerant and hard. Using one model for both is
a large cost mistake. *(#28 notes the saving is small at portfolio scale; the architecture stays
model-per-task configurable.)*

**Orchestration: the Vercel AI SDK plus our own logic.** LangChain rejected — heavy abstraction
over things done once, frequent breaking changes, and it obscures the exact prompt and tool payload,
which is precisely what you need visibility into when RAG misbehaves. LangGraph rejected — built for
stateful graphs with cycles, which #19 concluded we do not need.

**RAG scope, the decision that prevents the most common RAG mistake.** Price, bedrooms, area,
status and availability are **structured fields**; retrieving a chunk that mentions the price is
strictly worse than injecting the live record, because chunks go stale and can contradict the
database. So the RAG corpus is **only** area guides, FAQs, approved documents and help content.
**Property facts come from tools, never from RAG.**

**Chunking.** Structure-aware recursive splitting, target ~500 tokens with ~15% overlap, chunked by
**tokens rather than characters** because Arabic is markedly more token-dense, with a contextual
provenance prefix added before embedding.

**Retrieval.** Hybrid top-20, then a **mandatory visibility filter applied in-query** — this is a
security control, not a ranking feature; post-filtering leaks through timing and result counts —
then a relevance floor, then abstention if nothing survives.

**Grounding.** Citations required and **mechanically validated** against the retrieved set, so a
fabricated citation is caught rather than trusted. Live facts never come from RAG. Abstention is a
success state.

**Tool calling.** Eight read tools and exactly one write tool, `createViewingRequest`. Tools
execute **as the user**, through the same service and policy layer a controller would use — the
whole security model. Write tools require explicit user confirmation. Maximum around five
iterations per turn.

**Recommendations.** Weighted scoring over a preference profile, ranked partly by semantic
similarity to the **centroid of favourited property vectors** — no training, no labels, works from
about three favourites, and reuses vectors already stored. No ML in v1: there is no interaction
data, no labels and no evaluation set.

**Prompt injection.** The attack arrives through agent-written property descriptions that we
deliberately feed into embeddings. Defence is architectural, not prompt-level: **capability
containment** — the model can do nothing the user could not already do — and **no
outward-transmitting tool**, so even a fully successful injection has nowhere to send anything.
This is why "let the AI message the agent for you" is not a v1 feature.

**Cost.** AI is the only unbounded cost in Settly. **Per-user rate limits are mandatory.**

**Known gap.** No OCR; scanned or image-only PDFs are unsupported in v1.

---

### #18 — Repository topology: separate projects
`2026-09-05` · **LOCKED** · Process · *User-initiated, evaluated and endorsed*

One git repository containing `frontend/` and `backend/` as **fully independent applications** —
separate `package.json`, lockfiles, environment, builds and deployments. No monorepo tooling, no
workspaces, no shared-code dependency.

**Rationale, and it favours separation on the merits.** A monorepo with directly-imported shared
types produces compile-time safety that **hides a production truth**: deployed frontend and
deployed backend are always different versions for some window. Separation forces API versioning to
be a real discipline. The team-coordination benefit that justifies most monorepos does not exist for
a solo developer, and the two sides have genuinely different runtime shapes.

**The contract.** OpenAPI **generated from the same Zod schemas that perform runtime validation**,
so the spec cannot drift from behaviour. The spec snapshot is **committed into `frontend/`**, so
contract changes appear as reviewable diffs and the frontend build never depends on a running
backend. A **CI drift gate** in the backend fails the build if the regenerated spec differs.
Generated types via `openapi-typescript` plus `openapi-fetch`.

**Ownership split.** Wire-contract validation is generated and backend-owned; UI-only validation —
password confirmation, multi-step form state — is hand-written and frontend-owned. These are
genuinely different concerns and duplicating them is correct.

**Tier-B requirement recorded:** `architecture/API.md` must contain a "Changing the contract"
section documenting the end-to-end workflow.

---

### #19 — One bounded AI agent (high impact)
`2026-09-05` · **LOCKED · report-not-gate rule generalised by #41** · AI · Affects: `architecture/AGENT.md`

**The Property Shortlist Agent**, and exactly one.

**The test used to decide.** *Can you draw the complete call graph before seeing any results?*
Yes means tool calling; no means an agent. Option B, the "Property Research Agent" — get property,
get area, retrieve knowledge, analyse — **fails this test and is a fixed pipeline**; calling it an
agent would be self-deception. The Shortlist Agent passes on two mechanisms: **adaptive constraint
relaxation** when a result set comes back too thin, and **content-dependent shortlisting** when
forty results must be narrowed to five under a finite enrichment budget.

**Honest accounting, recorded because it was asked for.** The learning value is high; the *product*
value is real but modest — a better front door to search. This is bought primarily with learning
value, which is a legitimate reason as long as it stays the stated one.

**Architecture.** A hand-written bounded controller, **not LangGraph** — LangGraph's strongest
argument is checkpointing with mid-run human interrupts, but our writes happen *after* the run, so
that feature goes unused; and writing the loop is what teaches what LangGraph does.

**Safety, in order of importance.**
1. **The loop is read-only.** All state changes are proposals confirmed by a human, then routed
   through the normal write path. This collapses nearly the entire risk surface.
2. **The planner chooses from a closed action enum**, not free-form text, so the worst outcome of a
   successful injection is a wasted step.
3. **State is a typed scratchpad**, not a message transcript — which keeps context flat, cost
   bounded, and the run assertable in tests.
4. **Five independent caps:** 8 steps, 60 seconds, token budget, cost budget, and a **no-progress
   detector** — a step that does not change the scratchpad costs double, and two consecutive
   no-ops terminate the run.
5. Actor context is captured at run start and **immutable**, never re-derived from model output.

**Tools:** `searchProperties`, `getPropertyDetails`, `compareProperties`, `getAreaInsights`,
`checkViewingAvailability`, `retrieveKnowledge`, `getMyPreferences`. All read-only. **No web
access** — it would reintroduce the exfiltration path #17 deliberately closed.

**Router.** Simple question goes to RAG; a single lookup goes to tool calling; only a
multi-constraint adaptive discovery goal reaches the agent. **The agent must not become the default
path**, or the product has a slow, expensive search box.

**Testing.** Deterministic controller tests with a scripted planner stub — budgets, no-progress
detection, termination and failure handling, where the risky logic lives — plus record/replay
fixtures, plus a non-deterministic evaluation suite run as a **CI report, never a pass/fail gate**.

**Three standing conditions.** The loop stays read-only. One agent, not two. The router stays.

---

### #20 — `AgentRun` as model #38
`2026-09-05` · **LOCKED** · Data

Persists goal, actor, status, budgets consumed, typed scratchpad, step trace as JSONB, and result.
Steps are deliberately **not** a separate model: a bounded 8-step run fits in JSONB and Postgres
queries it fine.

---

### #21 — Frontend architecture (high impact)
`2026-09-05` · **LOCKED · LTR-only stance REVERSED by #39** · Frontend · Affects: `architecture/FRONTEND.md`

Next.js App Router. **SEO pages are server-rendered or static; dashboards are pure client-side**,
which means the Next server **never forwards cookies** and that entire class of bug disappears.
Dashboards genuinely do not want SSR — they are interactive, unindexed, and server-rendering them
would add a hop for nothing. The browser talks to `api.settly.com` **directly**; no Next proxy.

**Locked rule.** Public ISR pages must not read per-user cookies or session data in Server
Components. Favourites, viewed state and saved-search state are **client-side only**, or the route
becomes dynamic and ISR is lost — along with the argument in #10 that ISR removes the need for a
Redis property cache.

**State ownership.** TanStack Query owns all server state including the current user. `nuqs` owns
URL state — filters, sort, map bounds — because a property search is something people bookmark and
share, which only works if the filter set *is* the URL. Zustand holds four pieces of UI state.
React Hook Form owns form state. **No server data in Zustand, ever.**

**Realtime: SSE only.** *Sending* a message already goes over REST for validation, persistence and
authorization; only *receiving* needs a push, so the traffic is server-to-client and SSE is exactly
that. One authenticated stream per user session. **Rejected:** WebSockets and Socket.IO as
bidirectional infrastructure for a unidirectional problem; **Firestore for chat**, which would put
business-critical messages in a second database with authorization rules re-expressed there. Redis
pub/sub fan-out is designed but inactive at one instance. FCM stays separate for closed-tab push.

**Libraries.** Tailwind, shadcn/ui on Radix, TanStack Query, TanStack Table, Recharts — chosen
partly because shadcn ships chart components built on it — Motion, `date-fns`. **Maps: MapLibre
plus MapTiler for display, with Google Geocoding server-side at listing creation only**, because
Google's geocoder is materially better for Egypt and being honest about that beats ideological
consistency.

**Dates.** All scheduling arithmetic happens **server-side**; the frontend only formats. Egypt's DST
transitions are exactly where a booking silently shifts by an hour, and duplicating that logic in
the browser gives it a second place to be wrong.

**Bilingual content in an English UI.** `dir="auto"` on all user-generated content, an
Arabic-capable font in the stack, and bidi isolation. Not full RTL support — correct rendering of
bidirectional content, which is a smaller and entirely necessary job.

**Auth UX boundary.** Next middleware checks only whether a session cookie **exists**, for a fast
redirect. **It is not the authorization boundary** and must never be treated as one; the API is.

---

### #22 — Deployment topology
`2026-09-05` · **LOCKED** · Infrastructure · Affects: `architecture/INFRASTRUCTURE.md`

Vercel for the frontend; Railway running **two services**, `settly-api` and `settly-worker`, from
one `backend/` codebase; managed Redis; Supabase PostgreSQL.

**Hard constraint: the backend must be always-on.** A backend that sleeps stops reconciling
payments and stops every expiry job, silently invalidating the #10 recovery story. Any
scale-to-zero host is disqualified.

**Two services rather than one**, for about $5/month more: it matches the architecture rather than
a diagram that quietly differs from reality, it makes a real property demonstrable — kill the
worker, watch the API keep serving and the sweepers catch up — and it keeps CPU-bound image work
away from request latency.

**Kept:** Docker Compose for local development, a backend Dockerfile for local/production parity,
GitHub Actions CI with lint, typecheck, test, the OpenAPI drift gate and migration validation, a
health endpoint, Sentry plus structured logs. Local and production only; no staging, with Vercel
previews and one-click Railway rollback as mitigation. Colocate in EU/Frankfurt.

**Rejected:** Kubernetes, Terraform, ECS, service mesh, multi-region, staging infrastructure.

**Recorded risk & Neon Migration (2026-09-14):**
Per user directive, the project database is hosted directly on **Neon Serverless PostgreSQL (PostgreSQL 18 on aarch64)** rather than local Docker or Supabase.
- Both pooled `DATABASE_URL` and direct `DIRECT_URL` configured for runtime queries and Prisma migrations.
- Full parity confirmed on Neon for all 5 extensions (`postgis` 3.6.4, `vector` 0.8.6, `pg_trgm` 1.6, `btree_gist` 1.8, `uuid-ossp` 1.1).
- Complete 39-table schema and all constraints (AuditLog append-only trigger, Viewing exclusion constraint, Invariant I1 deposit race partial unique index, bilingual FTS generated columns, and PostGIS location sync trigger) migrated and verified in production.
- Neon PgBouncer transaction pooler verified to support protocol-level prepared statements (`max_prepared_statements`). Removing `pgbouncer=true` eliminates artificial `DEALLOCATE ALL` statements and disables Prisma's fallback round-trip mode, lowering warm per-statement latency from ~494ms to ~85ms.

---

### #23 — Rendering matrix
`2026-09-05` · **LOCKED · localized routes added by #39** · Frontend · *Corrects an earlier over-simplification*

Five modes, never to be collapsed again: true SSG, time-based ISR, **on-demand ISR**, SSR, and
static shell plus client-side fetching.

| Mode | Routes |
|---|---|
| **SSG**, no revalidation | `/about`, `/contact`, `/how-it-works`, `/privacy`, `/terms`, auth shells, 404/500 |
| **Static plus on-demand** | `/areas`, `/areas/[slug]`, `/insights` — the latter revalidated by the nightly matview refresh job, so page and data source stay aligned by construction |
| **ISR plus on-demand** | `/properties/[slug]` on publish, price and status change, with `generateStaticParams` for the top ~100; `/properties/[facet]`; `/agents`; `/agents/[slug]`; `/` |
| **SSR** | **`/properties` only** — it reads `searchParams`, so it is dynamic automatically; `noindex` when filters are present |
| **Static shell plus CSR** | `/map`, `/compare`, `/dashboard/*`, `/agent/*`, `/admin/*`, `/assistant` |

**On-demand revalidation is the preferred mode**, because we control the backend and know exactly
when a listing publishes or a price changes. Time-based revalidation regenerates pages that did not
change and still serves stale prices in between.

**How App Router decides.** A route is static by default and becomes dynamic the moment it touches
`cookies()`, `headers()`, `searchParams` or an uncached fetch. Hence dashboards are automatically
static shells, `/properties` is automatically SSR, and the client-only-personalization rule in #21
is a structural requirement rather than a style preference.

**`/properties` SSR was reconsidered and kept.** The three-hop path — Vercel function, Railway,
Supabase — is the worst latency profile in the system, but it is the highest-intent page and
populated first paint is worth it. Mitigation is colocated regions and real measurement, explicitly
**not** a Redis page cache to compensate for deployment topology.

---

### #24 — AI provider: Google Gemini
`2026-09-05` · **LOCKED, amends #17 · multilingual requirement strengthened by #39** · AI · *User decision*

**Google Gemini** as the primary ecosystem: generation, structured output, tool calling, streaming
**and embeddings**. Cohere removed. Provider choice had been deliberately left open pending
evaluation of pricing, Arabic quality, structured output, tool calling, streaming and reliability.

**Embeddings target 1,536 dimensions** via official dimensionality reduction where the selected
model supports it, with **mandatory re-normalization after truncation**. Exact model, native
dimensions and reduction mechanism are **PENDING VERIFICATION** (V1, V2) because Gemini embeddings
are natively 3,072-dimensional while pgvector's HNSW index has a ceiling around 2,000 — so the
approved configuration does not work without either truncation or `halfvec`.

**No dedicated reranker in v1.** The Gemini switch silently removed Cohere Rerank, which #17 had
approved. Rather than leave an approved requirement unimplemented, this is now an explicit
decision: retrieval is structured plus lexical plus semantic plus RRF plus a relevance floor plus
abstention. **Vertex AI Ranking and all external reranking vendors are rejected.** LLM-as-reranker
remains a future experiment, gated on evaluation evidence.

**The AI SDK is the provider port.** A generic `AiProvider` wrapper on top of it would duplicate
what already exists. A narrow Settly-owned embedding service handles domain concerns only —
property embedding construction, chunk embedding, model and version metadata, dimension validation,
normalization, retry.

**Recorded risk.** Bilingual search now rests on an **unverified assumption** about Gemini's Arabic
quality. This is why #27 makes retrieval evaluation a gate.

---

### #25 — Storage split
`2026-09-05` · **LOCKED** · Storage · Affects: `architecture/STORAGE.md`

**Cloudinary** for public property images and media. **Supabase Storage** for private RAG documents
— contracts, floor plans, authorized property documents. PostgreSQL remains the metadata source of
truth. Private access goes through Settly authorization issuing a short-lived signed URL. **No
Supabase RLS.** No third object-storage provider.

Cloudinary was chosen by the user, superseding an earlier Cloudflare R2 recommendation. It is right
for images and wrong for authorization-gated documents, which is why the split exists.

**Upload security, unchanged.** Signed direct upload with the backend issuing the signature; the
API secret never reaches the browser. Magic-byte verification, because a declared content type is
not evidence. Mandatory re-encode, which neutralizes polyglot files and — non-obviously — **strips
EXIF GPS data**, since phone photos of properties carry exact coordinates for listings whose
addresses are deliberately approximate. User content is served from a separate domain, never the
API origin, so an uploaded SVG cannot become stored XSS with access to the session cookie.

**Known gap.** No malware scanning on document uploads in v1.

---

### #26 — Redis scope clarification
`2026-09-05` · **LOCKED, clarifies #10** · Reliability

Redis caching is **not** a general application caching strategy. The **only** approved cache is the
short-lived hybrid-search ranked ID list — roughly the top 500 for natural-language search, TTL
around five minutes.

Explicitly **not** cached in Redis: property pages, arbitrary API responses, user profiles,
dashboards, database entities. On-demand ISR owns public property-page caching.

Redis's other approved roles stand: BullMQ backing store, distributed rate limiting, and future SSE
fan-out once there is more than one instance.

---

### #27 — Seed data and retrieval evaluation
`2026-09-05` · **LOCKED · evaluation scope extended by #39** · Process · Affects: `process/SEED_DATA.md`

One first-class deliverable, roughly 1–2 weeks of real work — **not optional demo decoration**.
Hybrid search, semantic retrieval, RAG and the agent are all invisible on forty listings.

**Corpus.** 500–1,000 realistic Egyptian properties, real area hierarchy, realistic price-to-area
correlation, **genuinely bilingual descriptions** — the Arabic must be real Arabic or the bilingual
design is untested — agents and users, favourites and saved searches, representative viewing, offer
and payment states, 10–20 trusted RAG sources, demo accounts for buyer/agent/admin, and a safe demo
reset. Structure real, content synthetic.

**Deliberate hard cases**, because these are what prove hybrid search works rather than merely
runs: near-duplicate listings, descriptions contradicting structured fields, Arabic-only listings,
English-only listings, areas without guides, ambiguous semantic queries.

**Pre-committed evaluation gate.** 20–30 bilingual benchmark queries with expected results.

| Metric | Threshold |
|---|---|
| Recall@10, same-language (EN→EN, AR→AR) | **≥ 0.80** |
| Recall@10, cross-language (EN→AR, AR→EN) | **≥ 0.65** |
| Zero-result rate | **≤ 10%** |
| Relevant result in top 3 | **≥ 0.70** |

**Interpretation, locked:** if cross-language Recall@10 falls below approximately **0.50**, the
bilingual semantic-search assumption is considered materially unsuccessful and the embedding
decision (#24) must be revisited.

**These numbers are fixed before the corpus is built and must not be tuned after seeing results.**
"The API returns 200" is not success. Cross-language is set lower deliberately because it is
genuinely harder; holding it to the same bar would fail a usable model.

**Script requirements.** Idempotent, resumable, safe to rerun, skips completed embedding work, and
backs off on Gemini rate limits — around 4,000 embedding calls will meet free-tier quota limits.

---

### #28 — Admin scope reduction
`2026-09-05` · **LOCKED** · Product

**Kept, because load-bearing:** property moderation, moderation actions, audit-log viewer,
reports and moderation workflow, essential operational dashboard information.
**Reduced to minimal or stub:** advanced admin analytics, extensive admin user management.

Rationale: six admin routes is roughly 20% of the frontend for a role that, in a demo, has exactly
one user. Moderation is load-bearing because the property lifecycle depends on it; admin analytics
and user management are decoration. `SearchEvent` data is still captured; **no search-analytics
dashboard in v1**.

---

### #29 — Sequencing principle
`2026-09-05` · **LOCKED** · Process · Affects: `process/ROADMAP.md`

**Do not reduce architecture because the project is portfolio-only. Reduce scope by sequencing.**

Recorded estimate: 38 models, ~27 screens, a real payment state machine, four-arm hybrid search,
RAG, a bounded agent, two worker classes, nine scheduled jobs and a seed corpus is **4–8 months of
solo part-time work**. The failure mode for a project this size is not bad architecture; it is four
months of foundation with nothing to show and motivation running out before the interesting parts
are built.

**Target an early end-to-end vertical slice**, roughly six weeks:
`auth → properties → search → property detail → viewing request`.
Then layer: offers, payments, messaging, notifications, hybrid search, RAG, AI assistant, Shortlist
Agent, advanced operations.

---

### #30 — Documentation lifecycle
`2026-09-05` · **LOCKED** · Process · Affects: `README.md`, all documentation

Three tiers. **Tier A now** — `CLAUDE.md`, `docs/README.md`, `DECISIONS.md`, `GLOSSARY.md`,
`product/BUSINESS_RULES.md` — because their content is already locked and highly perishable.
**Tier B after all architecture is locked**, in a dedicated Documentation Phase. **Tier C after
Stitch**, with design documents holding intent and constraints only beforehand — no invented
colours, type scales, spacing tokens, radii, shadows or animation timings.

**Governing principle: documentation leads on *why* and *what must be true*; code leads on *what
exactly exists*, and those documents are generated.** Hand-writing an API reference before
implementation is drift on day one.

**Rejected.** A separate formal SRS — it would duplicate the PRD, business rules, API and database
docs across ~60 pages nobody reads; only the traceability matrix survives, folded into
`product/REQUIREMENTS.md`. A `CHANGELOG.md` before there are releases. A flat 30-file layout.
Per-decision ADR files, which force many reads to answer "what is already decided".

**`DECISIONS.md` is the one deliberate size exception**, structured as summary table, pending
checklist, index, then entries weighted by consequence.

**The Documentation Phase must be artifact-driven** — from `DECISIONS.md` and the Architecture
Record, not from reconstructing the conversation. Conversation recall is exactly where "documentation
describes an idealized version of the system" comes from.

**`CLAUDE.md` is the real entry point**, because it is auto-loaded while `docs/README.md` is only
read if an agent chooses to look. Stack-specific `frontend/CLAUDE.md` and `backend/CLAUDE.md` are
reserved for the implementation phase.

**Anything mechanically enforceable becomes a lint rule or CI gate, not prose.** An agent will
violate a document; it will not get past a failing build.

---

### #31 — Business constants have one authoritative definition
`2026-09-05` · **LOCKED** · Process · Affects: `product/BUSINESS_RULES.md`

Numeric business constants are defined **once** in a backend configuration module. The constants
table in `product/BUSINESS_RULES.md` is **generated from it** where practical.

**Rationale.** Unlike a stale architecture description, which merely misleads, a stale *constant*
means the documented refund policy is not the one users experience. This applies the "generated
where practical" principle to the highest-consequence drift surface.

**The prose stays hand-written**, because it explains what the generated table cannot: why the rule
exists, what happens when it triggers, who is affected, what state transitions follow, and what
notifications result. **The generated table must never be the only documentation of a rule.**

**Business constants and AI/technical operational limits are separate.** They are not to be merged
into one undifferentiated table: business constants belong in `product/BUSINESS_RULES.md`;
technical and AI limits belong in the relevant architecture documents.

---

### #32 — Retrieval evaluation thresholds
`2026-09-05` · **LOCKED** · Process · *Part of #27*

Pre-committed and **not to be tuned after seeing results**: same-language Recall@10 ≥ 0.80;
cross-language Recall@10 ≥ 0.65; zero-result rate ≤ 10%; relevant result in top 3 ≥ 0.70. If
cross-language Recall@10 falls below approximately **0.50**, the bilingual semantic-search
assumption is materially unsuccessful and the embedding decision (#24) must be revisited. Full
context in #27.

---

### #33 — Security and operations (high impact)
`2026-09-05` · **LOCKED · AuditLog metadata rule refined by #42** · Security · Affects: `architecture/SECURITY.md`, `OBSERVABILITY.md`, `FAILURE_MODES.md` *(all Tier B)*

**Governing test applied to every mechanism: what threat, failure mode, or correctness problem does
this actually solve?** Anything that failed it was cut.

**Layering — controls sit once, at the cheapest correct layer.**
Vercel/edge owns TLS, HSTS and **all browser security headers**, because only Vercel serves
documents. Express owns CORS, Origin validation, body limits, timeouts, request ids and rate
limiting. The service layer owns authorization and invariants. Postgres constraints are the last
line.

**Helmet is kept but configured deliberately.** On a JSON API most of what Helmet sets is inert —
CSP and `X-Frame-Options` on a JSON response accomplish nothing, because no browser renders it as a
document. What earns its place is `nosniff`, HSTS and removing `X-Powered-By`. **The failure mode is
not Helmet; it is believing Helmet on the API secured the browser.**

**CORS: an exact allowlist with `credentials: true`.** ⚠️ Never reflect arbitrary origins, and never
regex-match `*.vercel.app` — that would let *anyone's* Vercel deployment make credentialed requests
with a victim's cookies (V13).

**CSRF: `SameSite=Lax` plus Origin validation. No token system**, which would be a third layer over
two that already hold. **Rule (E2): no state-changing GET that relies on ambient session authority.**
Capability-token GETs — verification and reset links — are exempt, because the token *is* the
authorization and cannot be forged.

**Authorization confirmed unchanged**, with two admin boundaries made explicit: admins do not read
buyer↔agent conversations by default, and admins never act as a party to an offer or payment.
Refunds are system- or admin-initiated per policy, never buyer self-service. CASL/Casbin and RLS
remain rejected.

**Rate limiting — simplified from the earlier three-tier design.** Tier A keeps its Postgres
fallback; **Tier B drops the instance-divided arithmetic** and falls open to a coarse cap, because
**business invariants already bound it** (I9, I11, I12, O1) — and an invariant is strictly better
than a limiter, being permanent rather than per-window. **(E6)** The in-memory check runs *before*
the Postgres counter, or the fallback becomes a write-amplification vector under attack.
Account-based **exponential delay**, not hard lockout, because a hard lock is a denial-of-service
primitive; responses stay enumeration-resistant.
**(E5) The global AI spend cap is Postgres-backed** — it is the one limit that must fail *closed*.

**AuditLog boundary.** Business and security history only: lifecycle transitions, moderation, agent
verification, admin actions on users, Better Auth security events, **private-document access**, **AI
state-changing tool executions**, audit exports. Never ordinary reads, search queries, application
logs, request bodies, secrets or AI conversation content. Actor types include `SYSTEM` and
**`AI_TOOL`**, so "what did the AI do on this user's behalf?" is answerable as a distinct question.
**(E4) Strictly immutable** — database-enforced, and the earlier 90-day IP-nulling proposal is
dropped because nulling a field *is* an `UPDATE` and the two cannot both hold.

**Secrets.** Platform-managed; no Vault. The `NEXT_PUBLIC_` boundary is absolute — **the Gemini API
key, Paymob secrets, Cloudinary secrets, Firebase service credentials and Supabase service-role keys
must never reach the browser.** A leaked LLM key is a direct, unbounded bill.

**Database.** Pooled Supavisor for the app, direct for migrations, TLS, forward-only migrations,
expand/contract for destructive changes with a CI gate. SQL injection risk lives **entirely** in
`sql/`: parameterized placeholders always, and **dynamic identifiers from a closed allowlist** —
sorting is where injection sneaks back in, because parameters cannot be identifiers. The
`settly_app` least-privilege role is **optional hardening**, not a dependency.

**File upload.** ⚠️ The two paths verify at different points: **Cloudinary validates image formats
server-side; Supabase Storage inspects nothing**, so magic-byte verification is *ours* on the
document path and must complete before a document is retrievable or indexed. UUID storage keys make
extension spoofing irrelevant. **Never serve the original image asset** — only a transformed
derivative, because originals retain EXIF, and property photos carry exact coordinates for listings
whose addresses are deliberately approximate.

**Malware scanning: deliberately absent in v1.** ClamAV's detection rate against targeted or novel
malware is poor; deploying it would produce a *feeling* of protection larger than the protection —
security theater. **And it defends the wrong threat.** The real exposure is our own parser being
exploited during extraction. Containment addresses that directly: PDF/DOCX allowlist, **structural
rejection of PDFs containing `/JavaScript`, `/OpenAction` or `/EmbeddedFile`**, hard time and memory
limits on extraction, worker-only extraction so a parser crash takes a job rather than a request,
`attachment` disposition, separate serving domain. **Documented as a known v1 limitation.**

**Payments.** Nine-step verification, nothing trusted before the HMAC check. The **amount and
currency assertion is a fraud control, not a sanity check** — a forger would set the amount to one
piastre. **Replay protection is the unique provider-event-id constraint, not a timestamp check**:
rejecting old events would strand legitimate retries. Paymob IPs are logged, never gated on. Log the
event id and a payload **hash**, never the payload.

**SSE.** Two decisions dissolve most of the security surface: **events are thin signals**
(`{type, entityId}`) so authorization is never duplicated into a payload and backpressure is a
non-issue; and **no `Last-Event-ID` replay** — reconnect triggers a refetch, because the database is
the source of truth and the stream is only a hint. Fetch-based streaming, not `EventSource`, since
`EventSource` cannot set headers the future bearer path needs. ~3 streams per user; heartbeat;
finite lifetime.

**Observability — no OpenTelemetry, no Grafana, and here is what replaces them.** Sentry is the
**alerting** surface; a small Postgres-backed admin operational panel is the **metrics** surface.
**Sentry Crons** monitors the nine scheduled jobs, answering "did reconciliation quietly die?" with
zero new infrastructure (V14). Performance tracing **sampled ~10%**, with payment and AI paths always
traced — full tracing would exhaust the free tier in days. **(E9) Session Replay disabled**: it would
capture private messages, offer amounts and PII, contradicting the logging boundary. **(E8)
`bull-board` is development-only and never mounted in production.**

**Eight alerts, everything else is a dashboard:** failed refund · payment `PROCESSING` > 30 min ·
webhook signature failures above threshold · missed scheduled-job check-in · rate-limit fallback
engaged · AI spend over threshold · stale worker heartbeat · exception-rate spike.

**Health.** `/health` liveness with **no dependency checks** — a Redis blip must never restart the
API. `/ready` checks **Postgres only**, the sole readiness-critical dependency. `/health/detail` is
admin-only and reports per-dependency status with an overall `degraded`, so a non-critical provider
outage never makes the API look down. **(E7) Never actively probe paid providers** — report the last
observed outcome from real traffic. A health check that calls Gemini spends money.

**(E10)** `SearchEvent` must not block the search response path. **Ops endpoints** live in a small
application-level ops surface, not a new module — they own no domain data, consistent with there
being no admin module.

**CI/CD and supply chain.** All gates from the first commit: lint, strict `tsc`, tests, OpenAPI drift,
migration validation, destructive-migration detection, module boundaries, `npm audit` on **critical
only** (failing on `high` in a large transitive tree produces CI paralysis, and a gate everyone
bypasses protects nothing), gitleaks, generated-client freshness. Protected `main`, least-privilege
workflow permissions, **third-party actions pinned to commit SHAs** — a tag can be re-pointed at
malicious code. Dependabot with **grouped weekly** routine updates and immediate security updates;
the weekly grouping is itself the practical anti-supply-chain control, since most malicious publishes
are caught within hours to days.

**Browser policy.** CSP belongs on Vercel-served documents. Asymmetric rollout: **enforced locally
from day one** for fast feedback, **Report-Only for the first production week** because production
exercises paths local development never hits, then enforced. `frame-src 'none'` is available to us
**because we chose hosted redirect checkout** and never embed the provider.

**Rejected:** Kubernetes · Terraform · ECS · service mesh · OpenTelemetry collector · Grafana ·
Prometheus · enterprise SIEM · WAF product · CASL/Casbin · RLS · CSRF token system · WebSockets ·
ClamAV · Morgan · Winston · `bull-board` in production · active health probes of paid providers.

---

### #34 — Logging: Pino
`2026-09-05` · **LOCKED** · Ops · *Replaces the previously stated Morgan + Winston*

**`pino` + `pino-http`**, structured JSON to stdout, `pino-pretty` in development only.
**Morgan and Winston are both removed.**

**The decisive argument is correlation, not redundancy.** Morgan emits a text access line knowing
nothing about the request id; Winston emits JSON knowing nothing about the request unless context is
threaded manually. So when a payment fails at 03:14 you have an access line and five application
lines with **no shared key**, and you reconstruct the request by timestamp — exactly the debugging
logging exists to avoid. With `pino-http` plus AsyncLocalStorage, **every line inside a request
automatically carries `requestId`, `userId` and `route`.**

Secondary: JSON by default (Winston's API nudges toward unqueryable string concatenation), built-in
`redact` paths, lower overhead. Railway and Vercel ingest stdout, so no transports are needed.

**What is genuinely lost:** Morgan's `dev` one-liner (replaced by `pino-pretty`), Winston's
transports (unneeded — `pino-roll` exists if rotation is ever required), and some ecosystem
familiarity. **Nothing structural.** Sentry integrates with both equally.

**Attached implementation requirement:** the AsyncLocalStorage context must be established once,
correctly, at the request boundary. Done wrong, correlation is absent and nothing has been gained.

**Redaction is not a production feature** — local logs reach terminal scrollback, screenshots and
gists. Redact `authorization`, `cookie`, `*.password`, `*.token`, `*.secret`, `*.hmac`, `*.apiKey`.

---

### #35 — Email-verification guards and invariants I11 / I12
`2026-09-05` · **LOCKED** · Domain · *Amends #5* · **Guard list superseded in part by #38** · Affects: `product/BUSINESS_RULES.md`

**Context.** Two gaps surfaced during the security review. First, Decision #11 proposed gating
transactions on email verification — but the locked V1, O1 and Y2 guards contained no such
requirement, so a security decision was silently contradicting a business rule. Second, tracing
Tier B fail-open against the invariants showed **saved searches and offers had no business bound at
all**.

**Decision.**
- **`emailVerified = true`** is now a guard on **V1** (viewing request), **O1** (submit offer) and
  **Y2** (initiate deposit payment). Unverified users may still browse, search, view, favourite and
  save searches. **This is a business rule enforced in the service layer, not middleware** — which is
  why the AI tool `createViewingRequest` inherits it automatically.
- **I11 — max 25 saved searches per user.**
- **I12 — max 5 live offers per buyer across all properties**, with **live** defined exactly as
  `{PENDING_AGENT, PENDING_BUYER, ACCEPTED, RESERVED}` (`BUSINESS_RULES.md` §4.1). `RESERVED` counts
  deliberately: a buyer holding a reservation while negotiating five more properties is precisely the
  over-extension the rule bounds.

**Rationale for I11 specifically.** Every saved search is evaluated against every newly published
property. Ten thousand saved searches don't merely consume storage — they multiply the work of a job
that runs on every publish. **A rate limiter is the wrong tool**: limits are per-window, and this
damage persists after the window closes. An invariant is permanent.

**Concurrency consequence.** I9, I11 and I12 share a shape — *"at most N rows for this user"* — and
all three are **write-skew** vulnerable, which `READ COMMITTED` cannot prevent and no unique
constraint can express. All three are enforced by a **transaction-scoped advisory lock keyed on the
user id**, in one shared namespace. **This extends Decision #10**, which identified two lock
escalations; I11 and I12 join the viewing-request cap under the same mechanism.

**Left open, deliberately:** **O5** (buyer accepts an agent-initiated offer) carries no verification
guard. It is covered transitively because Y2 blocks the resulting payment, but the failure surfaces
later than ideal. Not changed without approval.

---

### #36 — Email provider: Resend
`2026-09-05` · ⚠️ **PROVISIONAL — pending verification (V18)** · Ops

**Context.** Email had been referenced repeatedly but never decided, while verification, password
reset, notifications and saved-search digests all depend on it.

**Compared:** Resend · Postmark · AWS SES · SendGrid.

**Selected: Resend**, on three Settly-specific grounds. **React Email is the same stack** — templating
bilingual transactional email as React components with the same `dir="auto"` considerations as the UI
is a genuine fit. **No onboarding friction** — AWS SES accounts start in a sandbox requiring manual
approval before sending to unverified addresses, potentially days, which blocks a working signup flow.
And **bounce/complaint webhooks without extra infrastructure**, treated as a **v1 requirement**: a
hard-bounced address that keeps receiving verification emails degrades sending reputation.

**Honest counter, recorded:** **Postmark is genuinely better on deliverability**, the axis that
matters most for a product whose signup depends on email arriving. Its free tier is simply thin for
a portfolio. If deliverability is prioritised over developer experience, Postmark is the right call.

**Rejected:** SES (sandbox friction, IAM/SNS overhead, reputation warmup you own — disproportionate
here despite being cheapest at scale); SendGrid (dated DX, weakest free-tier shared-IP
deliverability).

**Two rules regardless of provider:** local development previously proposed Mailpit, but by **Decision #44 Resend is locked across all environments** (development, testing, and production) to deliver real emails to real test inboxes (Gmail/Outlook). Bounce and complaint webhooks are wired in v1.

**Status: LOCKED by Decision #44** (formerly provisional). Mailpit eliminated from the project.

---

### #37 — Environment model and the substitution rule
`2026-09-05` · **LOCKED** · Process · Affects: `process/ENVIRONMENT.md` *(Tier B)*

**The project is in local development. No deployment exists.** The Vercel/Railway/Supabase topology
(#22) is the intended future target and is **not a current requirement**.

| | Local (now) | Production (future) |
|---|---|---|
| Frontend | `localhost:3000` | Vercel, `app.settly.com` |
| API | `localhost:4000` | Railway, `api.settly.com` |
| Worker | Local process | Railway service |
| Postgres | Docker + PostGIS + pgvector + pg_trgm + btree_gist | Supabase |
| Redis | Docker or Upstash Redis | Upstash Redis (managed, #44) |
| Email | **Resend** (real inbox delivery, #44) | Resend (locked, #44) |
| Sentry | Off | On |

**A custom domain is a deployment prerequisite, not a development blocker** — correcting an earlier
over-weighting. And the local model is a faithful rehearsal rather than a compromise: **`localhost:3000`
and `localhost:4000` are same-site**, because `SameSite` is evaluated on the registrable domain and
ports are not part of it. `SameSite=Lax` therefore behaves locally exactly as it will across
production subdomains.

**Governing rule: every environment difference is a configuration value, never a code branch.
No `if (isProduction)` around a security control.**

**Identical across environments:** authorization · business rules · state machines · transactions ·
idempotency · database constraints · Zod validation · audit behaviour · rate limits · request ids ·
**log redaction**.

**Legitimately different:** cookie `secure` and `domain` · CORS origins · HSTS · CSP enforcement mode ·
log format and level · Sentry on/off · `bull-board` presence.

**The one sanctioned weakening:** Argon2id parameters may be reduced **in the automated test suite
only**, behind an explicit flag — not in local development, where the real login cost should be felt.

## The substitution rule

> **Substitute where the security or behavioural control belongs to Settly. Use the real external
> service where the service itself owns a behaviour we need to exercise.**

| Service | Local | Why |
|---|---|---|
| **Cloudinary** | **Real**, `dev/` folder | **EXIF/GPS stripping and re-encoding are theirs.** A local substitute means the control protecting property locations is never once executed before production |
| Supabase Storage | Local adapter | Magic bytes, authorization and audit are **ours**; only signed-URL issuance is theirs |
| **Paymob** | **Fake adapter** + local webhook signer | HMAC verification, amount assertion and the state machine are **ours**. The four-method port from #13 pays off exactly as justified: the full state machine, every race and the atomic bundle run locally with no network. ⚠️ **One sandbox test remains mandatory** to confirm the real HMAC field ordering (V4) |
| Gemini | Real, **prompt-hash response cache** | Quality is theirs. The cache makes iterating on a RAG prompt twenty times free |
| **Email** | **Resend** (real delivery to developer inbox) | Delivery is theirs; eliminates dev/prod divergence and verifies real DKIM/SPF and rendering (#44) |
| FCM | No-op adapter, logs payload | Delivery is theirs; the decision to send is ours and still runs |
| Google Geocoding | Fixtures | Called once per listing, deterministic |
| Sentry | Off | — |

**Rate limiting is not disabled locally.** Disabling it means never exercising the 429 path or the
client's handling of it, and first seeing it in production. A per-test bypass token covers tests that
must exceed a limit.

---

### #38 — The verification boundary
`2026-09-05` · **LOCKED** · Domain · *Amends #5, supersedes the guard list in #35* · Affects: `product/BUSINESS_RULES.md` §9.1, `GLOSSARY.md`

**Context.** #35 guarded V1, O1 and Y2 on `emailVerified`, and explicitly left **O5** open. Reviewing
that gap surfaced a defect rather than an inelegance, and a second gap alongside it.

**The O5 defect.** O5 (`PENDING_BUYER` → `ACCEPTED`) *creates a `Payment` obligation and starts the
72-hour deposit clock*. An unverified buyer accepting therefore produced: a payment row, a running
countdown, an agent notified that a deal was progressing, and a consumed I12 live-offer slot — for
an actor structurally unable to reach Y2. **The only downstream path was expiry.** The design was
"technically safe" solely in the sense that no money moved.

> **A state machine must not permit a transition whose sole outcome is an obligation the actor
> cannot fulfil.**

**The O3 gap.** With O1 guarded, the only route to `PENDING_BUYER` while unverified is **O1b**, the
agent-initiated offline offer. From there an unverified buyer could counter-offer (O3) indefinitely —
generating `OfferRevision` rows and agent notifications — while permanently unable to accept. A
counter-offer *is* an offer submission.

**Options.**
- **(a)** Guard O5 only, and record O3 as a deliberate exception
- **(b)** Guard O3 and O5, and **replace the list with a principle** ← chosen

**Decision — the verification boundary:**

> **Email verification is required for any buyer transition that creates or advances a financial
> obligation or a scheduled commitment. It is never required to withdraw, cancel, or read.**

Applied: **V1, O1, O3, O5, Y2** guarded. Withdrawal (O7, O8), cancellation (V6, V7), browsing,
search, property views, favourites and saved searches are not.

**Rationale for a principle over a list.** A list of transition ids must be remembered and extended
by hand every time the state machines grow, and the O5 gap is precisely what happens when someone
forgets. A principle answers the question for transitions that do not exist yet, without
re-litigating this decision.

**Exit is never guarded — and this is load-bearing, not politeness.** Blocking withdrawal would trap
an unverified buyer inside a live offer, consuming an I12 slot and holding an agent's attention, with
no way out. **A verification requirement must never become a state a user cannot escape.**

**Resulting behaviour for O1b.** An agent may record offline-agreed terms against a buyer regardless
of that buyer's verification state — the agent is the actor and cannot be expected to know it. The
unverified buyer may then review or withdraw, but may not counter, accept or pay. **Two paths:
verify, or withdraw.**

**Unchanged.** #35's invariants I11 and I12, its write-skew analysis, and the shared advisory-lock
mechanism all stand. The AI path is unaffected — `createViewingRequest` routes through V1 and
inherits the guard automatically. Nothing else from Decision #11 (#33, #34, #36, #37) changes.

**Noted, not decided.** For the Egyptian market, email as the *sole* verification channel is worth
revisiting later given mobile penetration versus email engagement. #9 chose email links over SMS OTP
primarily on cost. A separate decision, deliberately not opened here.

---

### #39 — Domain Model Reconciliation (high impact)
`2026-09-05` · **LOCKED · embedding lifecycle sync refined by #42** · Domain · *Amends #3, #6, #21, #23, #24, #27 · Reverses #4, #15 · Completes #9*
Affects: `GLOSSARY.md`, `product/BUSINESS_RULES.md`, and every Tier-B architecture document

**Context.** Decision #3 named 36 models. Decisions #9, #14, #15, #24 and #33 then changed what those
models must contain, and **nothing closed the loop** — leaving the data model as the last blocker on
the first migration. Mid-decision, a new product requirement arrived: **the UI must be fully
bilingual (`/en` + `/ar`) with RTL**, which reversed #4 and forced the content model to be
re-derived from scratch.

---

#### 1. Better Auth identity reconciliation

**`user` is Better Auth's table, extended via `additionalFields`. There is no parallel Settly `User`
or `UserProfile`.**

The deciding constraint is not taste: **`role` and `banned` must live on Better Auth's `user`**,
because the admin plugin's ban check runs inside session validation — and that mechanism *is* the
immediate-suspension requirement from #9. A Settly-owned status column would not be read by Better
Auth, and suspension would stop being immediate, reintroducing exactly the staleness that
disqualified stateless JWTs. With the two most important identity attributes pinned there by the
architecture, a second table would split identity semantics across two places for three leftovers.

| Resolution | |
|---|---|
| `User` | → Better Auth's `user`, extended |
| `Session` | → Better Auth's `session` (reclassified, not removed) |
| **`AuthToken`** | ❌ **REMOVED** — duplicates Better Auth's `verification` |
| ➕ **`account`** | **Holds the password hash.** Was absent from the 38-model inventory entirely |
| ➕ **`verification`** | Replaces `AuthToken` |
| `AgentProfile`, `UserDevice` | ✅ Settly-owned |
| `BuyerProfile` | **Not created** — the #17 preference profile is *derived* from saved searches and favourites |

**FK root: `user.id`, UUIDv7 (V5).**
⚠️ **No `ON DELETE CASCADE` from `user` to any business table** — we anonymise rather than delete
(§7 below), and a cascade would be a loaded gun for anyone who later ran one.

**`preferredLocale` added as a Settly `additionalField`** — and this reverses an earlier "no locale
field" position. Under an English-only UI it was speculative. Under a bilingual UI it is **required
by the notification architecture**: a worker rendering an email or push has no cookie and no request
context, so the recipient's locale must be persisted. A cookie also fails to follow the user across
devices. One scalar column, load-bearing. Exact `additionalFields` capability is **V19**.

---

#### 2. Document visibility

| Scope | Retrieve | Download | RAG |
|---|---|---|---|
| **`PUBLIC`** | Anyone who can view the property | Same | Every actor |
| **`PARTY`** | Owning agent + any buyer with a **live offer** (`BUSINESS_RULES.md` §4.1) | Same, audited | Those actors only |
| **`PRIVATE`** | Uploader only | Uploader; **admins via a separate audited path** | Uploader only |

Three, not six: `AUTHENTICATED` has no use case distinct from `PUBLIC`; `AGENT_ONLY` and
`ADMIN_ONLY` collapse into `PRIVATE` plus the admin path that exists for every scope. **Admin access
is a path, not a scope** — consistent with #33's admin boundaries.

⚠️ **`Embedding` carries `visibilityScope` denormalised**, so the RAG security filter is a predicate
on the chunk rather than a join. If visibility lived only on `Document`, every RAG query would join
inside a vector search — the filtered-ANN problem #6 avoided. **A security filter that costs recall
is one someone eventually moves after retrieval**, which leaks through result counts and timing.

---

#### 3. Multilingual content model

**The requirement that decided it:** content may be Arabic-only, English-only, **or both**. A single
`language` column with one title/description pair **cannot represent a bilingual listing** — so the
model originally proposed in this decision was rejected on its own terms.

**Chosen: parallel nullable columns** — `titleEn`, `descriptionEn`, `titleAr`, `descriptionAr`, with
a check constraint requiring at least one pair. **No `language` column** (it would contradict itself
on a bilingual listing).

| Rejected | Why |
|---|---|
| **`PropertyTranslation`** | Puts a **join in the hottest query in the product, permanently**, for a third language with no stated requirement. It would also split content from the vector, which #6 pins to the `Property` row |
| JSONB content blob | You cannot build a per-language **ranked `tsvector`** from JSONB in a generated column. Trades away the search system to save a migration |
| Hybrid primary + variants | The same concept in two places; every read checks both |

**Honest trade recorded:** a third content language would require a migration. Judged unlikely for an
Egypt-focused product (#1 excluded multi-country), and a one-time cost against a permanent daily one.
`PropertyTranslation` would win if N languages or per-language moderation were real requirements.

**Same parallel pattern for `KnowledgeArticle`** (our editorial content, intended in both languages).
**`Document` is deliberately different** — a single detected `language`, because you do not translate
a PDF.

**Bilingual reference data:** `Area` gains `nameEn`, `nameAr` and **`aliases text[]`** (GIN-indexed),
so the query-understanding gazetteer resolves `التجمع الخامس`, `التجمع`, `5th Settlement` and
`New Cairo` to one area. **No `AreaAlias` model** — aliases are admin-maintained reference data.
`Amenity` gains `nameEn`, `nameAr`.

**Second #3 overlap corrected:** #3 gave `Area` *"guide content"* **and** gave `KnowledgeArticle`
*"area guides"* — the same content described twice. **`Area` now owns identity and geometry only**
(names, aliases, slug, parent, level, boundary, centroid); **long-form guides move to
`KnowledgeArticle`**, linked by `areaId`. `Area` is touched by every search filter; it should not
also carry RAG-chunked prose.

---

#### 4. Canonical English — REVERSED (#15)

Both of #15's justifications collapse under a multilingual embedding model:

- *"Cross-language lexical search starts working"* → superseded. Two FTS vectors handle same-language;
  **the semantic arm handles cross-language**, which is what it exists for
- *"Consistent embedding space"* → **normalising language before embedding partially defeats the
  point of choosing a multilingual model**

And the costs were real: an **LLM call in the property publish path** (cost, latency, a new failure
mode), translation drift, an extra pipeline stage with its own status and sweeper, and —
strongest — **hallucination silently affecting ranking**. The earlier containment argument ("never
displayed") was weaker than claimed: a hallucinated feature makes a property match queries it should
not, a relevance bug with no user-visible symptom. It also became redundant whenever an agent
authored English themselves.

**What is given up:** cross-language *lexical* precision. Accepted — that is what the semantic arm is
for, and RRF means one firing arm suffices.

---

#### 5. FTS architecture — amends #6

**Two GENERATED tsvector columns**: `searchVectorEn` (`english` config) and `searchVectorAr`
(`simple` + deterministic Arabic normalisation), each GIN-indexed. Plus `pg_trgm` on both title
columns, `Area` names and aliases, and agent names.

**Both can be generated columns because each configuration is fixed — so #6's trigger requirement
disappears.** It existed only because the config varied per row.

**Query both vectors, take the better rank, feed RRF.** This is not a fallback but the common case:
Egyptian users **code-switch inside a single query** (`شقة 3 غرف في New Cairo`), and a single vector
would silently discard half of it.

**Arabic normalisation** (alef unification, yeh, teh marbuta, tatweel/diacritic stripping, leading
`ال` removal) is applied identically to indexed text and to the query. Postgres ships no Arabic
stemmer, and without normalisation `الشقة` cannot match `شقة`. Deterministic and immutable, so the
column stays generated. Quality is **V24**.

---

#### 6. Embedding architecture

**One multilingual vector per `Property`**, as a **column**, partial HNSW `WHERE status='PUBLISHED'` —
#6 preserved intact. Composed from whichever authored content exists (both languages when both are
present) plus the structured attributes from #17.

One-vector-per-language and one-per-translation were both rejected: semantically equivalent AR and EN
text maps to **near-identical vectors**, so storing both means **the same property retrieved twice,
requiring dedup**, at roughly double the index size and with the partial-index predicate lost.

**Consequence:** with canonical English gone, the multilingual model is **solely** responsible for
cross-language retrieval, making **V23** the highest-stakes verification item in the project.

---

#### 7. Privacy and account lifecycle — structural implications only

**Deletion is anonymisation, not deletion**, because payments, refunds, offers and audit entries must
survive. Structurally: `user.anonymizedAt`; PII overwritten in place; **`account`, `session` and
`UserDevice` rows genuinely deleted**; `banned = true`; the unique email constraint preserved via a
**non-routable placeholder** rather than a null. Messages survive with an anonymised author, or the
counterparty's conversation becomes incoherent. `AuditLog.actorId` points at a surviving row, so the
trail stays intact by construction. Retention windows for `SearchEvent`, `PropertyViewEvent` and
`AiMessage` are **policy for a later decision**; the model only needs an indexed `createdAt`.

---

#### 8. AI and frontend language behaviour

**Detect language per message**; `preferredLocale` / UI locale is a tiebreaker only; **respond in the
detected language**; **no conversation-level language state and no language model**. Egyptian users
code-switch constantly, so a locked conversation language would be wrong within three messages —
per-message detection supports switching for free because there is no state to switch. Detected
language stored as a field on `AiMessage`.

**An Arabic query legitimately retrieves English sources and the assistant answers in Arabic citing
them.** Correct behaviour, not a bug.

**Localized routes (amends #23):** every public route gains a locale segment. SSG pages 9 → 18;
`generateStaticParams` becomes locale × params; ⚠️ **publish, price and status changes must
invalidate BOTH locales** — miss this and half your users see stale prices. Middleware now carries
locale resolution alongside the auth cookie-presence check, and auth redirects must preserve the
locale.

**RTL is first-class (amends #21):** `dir` on `<html>`; **logical CSS properties throughout**;
mirrored directional icons; reversed table and form order; chart axis orientation and map control
placement (**V26**). **`dir="auto"` on user content survives and generalises** — an English
description inside an RTL page needs LTR rendering, and vice versa.

**SEO:** one shared Latin slug in v1 (percent-encoded Arabic URLs look broken on WhatsApp, the
dominant sharing channel in Egypt); `hreflang` `en`/`ar`/`x-default`; **each locale canonical to
itself**; localized metadata and `inLanguage`; one sitemap with alternates.

**No `Translation` model for UI strings** — static message catalogs versioned with code. **No
`NotificationTemplate`** — `Notification` stores a `type` + `params` JSON and renders at display
time, so a user switching locale sees their existing notifications in the new language. That is also
why `Notification` needs no language field.

**Language metadata goes only where it carries information:** `Document` (detected), `Embedding`
(chunk), `AiMessage` (detected), `SearchEvent` (**zero-result rate per language is a direct product
signal**). **Not** on `Property`, `KnowledgeArticle`, `Area`, `Amenity`, `Message` or `Notification`.

---

#### 9. Final inventory — **39 tables · 4 Better Auth-managed · 35 Settly-owned**

Identity 6 · Catalog 6 · Engagement 4 · Pipeline 5 · Payments 5 · Communication 3 ·
Knowledge & AI 6 · Analytics & governance 4.

Derived, not targeted: 38 − 1 (`AuthToken`) + 2 (`account`, `verification`) = 39.
**The bilingual reversal added zero models** — parallel columns are fields, message catalogs are
code, and `preferredLocale` is one scalar.

---

#### 10. Why this is still minimum sufficient

**The architecture became simpler under a harder requirement.** Bilingual UI, bilingual content and
four-direction retrieval, yet we **removed** a pipeline stage (canonicalisation), **removed** a
trigger, and added **no models** — because the multilingual embedding model does the work
canonicalisation was invented to fake.

> ⚠️ **Explicitly evaluated and rejected. Implementation must not reintroduce these because the
> patterns are familiar:** `PropertyTranslation` · `AreaAlias` · `BuyerProfile` · `UserProfile` ·
> a canonical-English pipeline · `Translation` (UI strings) · `NotificationTemplate` ·
> `CheckoutHold` · `NotificationDelivery` · `PropertyStatusHistory` · `PropertyRevision` ·
> `AiToolCall` · `AgentStep` · `DailyPropertyStat` · `OutboxEvent` · `City`/`District` ·
> `Favorite` · `ConversationParticipant` · a double-entry ledger · agency/organization models.

Roughly twenty tables not built, each with a stated reason. Every model in the 39 traces to a locked
journey, state machine, invariant or security control — and the two additions exist because **an
authentication library needs somewhere to put a password hash and a verification token.**

**No business rules changed.** State machines, invariants and the verification boundary are untouched.

---

### #40 — API Contract Shape (high impact)
`2026-09-05` · **LOCKED** · API · *Extends #8 · Refines #14's HTTP projection · Closes an #8 flag*
Affects: `architecture/API.md` (Tier B), `GLOSSARY.md`

**Context.** #8 locked the API *style* — REST, `/api/v1`, OpenAPI generated from Zod, RFC 9457,
cursor pagination, SSE. It did not lock the *shape*, and the frontend's generated client (#18) is
derived from that shape. Retrofitting an envelope or an error taxonomy across a finished API and a
generated client is mechanical but miserable, so it is cheap now and expensive later.

---

#### 1. Response envelope — bare resources, wrapped collections

Single resources, and the results of `POST`/`PATCH`, are returned **bare**. `DELETE` returns `204`.
Collections return `{ items, pageInfo }`. Search additionally returns a `search` member carrying the
interpreted-filter chips, the degraded-arm list and the applied sort (#14 requirements).

**A universal `{ data, meta }` envelope was rejected on two concrete grounds.** `openapi-fetch`
already returns `{ data, error, response }` at the transport layer, so an envelope produces
`result.data?.data.title` on **every call site, forever**, in a codebase where the generated client is
the only way the frontend reaches the API. And the usual extensibility argument — being able to attach
per-viewer `meta` later — **does not apply here**, because #39 forbids reading per-user state on
public pages at all: it destroys ISR. Viewer state is fetched separately by design.

**The wrapper key is `items`, not `data`**, chosen specifically so it can never collide with the
transport layer's `data`.

⚠️ **Chips carry `kind` + machine `value`, never a label.** The frontend renders the wording in the
active locale — the same language-neutrality rule as the error taxonomy. **The backend never emits
user-facing prose in either language** (#39).

---

#### 2. ⭐ State transitions are action endpoints, not `PATCH status`

```
  ❌  PATCH /offers/:id { status: "ACCEPTED" }
  ✅  POST  /offers/:id/accept · /counter · /withdraw · /reject
  ✅  POST  /properties/:id/submit · /publish · /reject · /archive
```

**The most consequential naming decision in this contract.** A `status` field in a PATCH body invites
arbitrary state-setting and forces authorization to become per-field — which is precisely how state
machines get bypassed. An action endpoint maps to **exactly one transition**, with its own guard,
Zod schema, authorization, side effects, idempotency semantics and concurrency behaviour.

**The payoff is legibility:** the endpoint list becomes a **direct mirror of the transition tables in
`product/BUSINESS_RULES.md` §2–§5**. An implementer can read the two side by side.

`PATCH` remains for genuine mutable attributes — title, price, description.

---

#### 3. Pagination

**Cursor** for search, feeds, messages and notifications: `?cursor=<opaque>&limit=<n>` →
`{ items, pageInfo: { nextCursor, hasNextPage } }`. Default 20, max 100.

| Rule | |
|---|---|
| **Opaque cursors** | Base64url, version-prefixed — so the internal keyset can change without a contract break, and clients cannot construct cursors that break ordering |
| Contents | Sort key + `id` tiebreaker + sort token. **Never filters, never authorization** |
| ⚠️ **Sort-change guard** | The cursor encodes its sort token; a mismatched request `sort` → **400**. Changing sort mid-pagination silently produces duplicates and gaps |
| ⚠️ **Total ordering required** | **Every cursor endpoint sorts on a column *plus* `id`.** Without a tiebreaker, rows are skipped and repeated |
| No `totalItems` | An exact count on a filtered search costs a full scan for a number nobody acts on |
| Malformed cursor | **400** `/errors/invalid-cursor` |
| **Expired search context** | **410** `/errors/search-context-expired` |

**`410` is a real case, not a hypothetical:** #26 caches the top-500 ranked list for ~5 minutes, so
paginating past that window means the context is genuinely gone. A distinct status lets the client
silently re-run the search — whereas restarting at page 1 produces an **infinite scroll loop**.

**Offset** for admin tables only: `?page=1&pageSize=50` with totals. Page numbers are the point there,
and the `COUNT` is affordable at admin volumes.

---

#### 4. Error taxonomy

RFC 9457 `application/problem+json`. **`type` *is* the application error code** — there is no second
`code` field, because two identifiers means two sources of truth and inevitable drift.

**`type` uses relative URIs (`/errors/…`).** RFC 9457 permits a URI *reference*, and absolute URIs
would embed a domain into the wire contract that isn't yet established.

Extension members: `requestId` · `params` (localization inputs) · `errors[]` for field validation as
`{ path, code, params }`.

> **Governing rule: the backend is language-neutral. `title` and `detail` are developer-facing English,
> logged and never rendered. The frontend maps `type` + `params` + `errors[].code` to localized
> strings.**

This is why **validation errors carry a code and parameters, never a message**. `{ path: "price",
code: "too_small", params: { min: 0 } }` renders in either language; English prose does not. With
`/en` and `/ar` both live (#39), any user-facing English crossing the wire is a defect.

**~16 types: 8 generic** (validation-failed, unauthenticated, forbidden, not-found, conflict,
rate-limited, internal, service-degraded) **and 8 domain-specific**, each existing only because the
frontend must behave differently: `email-not-verified` (#38 CTA) · `account-suspended` ·
`quota-exceeded` (I11/I12, with limits in `params`) · `state-conflict` · `checkout-hold-unavailable`
(#11) · `idempotency-key-reused` · `idempotency-in-progress` · `search-context-expired`.

> **The rule that prevents hundreds of types: add one only when the frontend must render or behave
> differently. Otherwise use a generic type and put specifics in `detail`.**

`state-conflict` carries `params: { entity, currentState, attemptedTransition }` — **one type covering
roughly forty state-machine transitions** rather than forty types.

---

#### 5. Resource naming, nesting, and the leak rule

**Nest only when the child cannot exist without the parent *and* the parent scopes authorization.
Maximum one level.** `/properties/:id/images` and `/offers/:id/revisions` qualify;
`/properties/:id/offers` does not — an offer belongs to a buyer *and* a property, so nesting would
create two canonical URLs for one collection. Use `/offers?propertyId=`.

**`/me/*` for self-scoped collections**, not `/users/:id/…` — it makes the scoping visible and
**removes the IDOR surface entirely, because there is no id to tamper with**.

**`/admin/*` for admin-only collections and views** (moderation queue, users, audit log, reports).
**Admin actions on domain resources stay on the resource** — `POST /properties/:id/publish` with a
role guard — because duplicating transition endpoints under an admin prefix would mean two paths into
one state machine.

**The information-leak rule:**

> **`404` when the actor may not know the resource exists. `403` when they may know it exists but may
> not act on it.**

A buyer requesting another buyer's offer, or a `DRAFT` property, gets **404**. A verified-email guard
on a property the buyer *can* see gets **403 `email-not-verified`** — hiding it would confuse and
leaks nothing. Wrong turn in a state machine gets **409 `state-conflict`**.

⚠️ **A "doesn't exist" 404 and a "not yours" 404 must be byte-identical**, and must not differ
meaningfully in latency — an authorization check measurably slower than a primary-key miss
reconstructs the leak the status code was chosen to prevent.

**HTTP status is the observable contract, not the security boundary.** Enforcement lives in the
service-layer policy functions (#33); OpenAPI documents what a caller observes.

**Closes an #8 flag:** Better Auth's routes sit at **`/api/auth/*`, outside `/api/v1`, and are
excluded from our OpenAPI spec** — deliberately, because that surface is a library-owned contract with
its own client, and versioning it under `/v1` would imply we control its evolution. *(Mount-prefix
flexibility is V31.)*

---

#### 6. Search — the HTTP projection of #14

```
  GET /api/v1/search/properties            → items    (filter · NL · map at high zoom)
  GET /api/v1/search/properties/clusters   → clusters (aggregate map view)
```

**This refines #14 rather than reversing it.** #14's *"three execution paths, one endpoint"* remains
true of the **search service and pipeline**: filter, map and natural-language all execute inside one
service, and the clusters endpoint **must not duplicate any search business logic**. It reuses the
same filters and the same authorization semantics.

The reason for a second endpoint is that **clusters are aggregates, not entities** — `{ lat, lng,
count }` is a different kind of thing from a property. Serving both from one endpoint would require a
discriminated response union, which generates awkwardly in OpenAPI and forces every caller to narrow a
type it already knows statically from the zoom level.

**Request:** `q` · structured filters · `bounds` or `near`+`radiusKm` · repeatable `areaId`/`amenityId`
· optional `contentLang` (#39) · closed `sort` enum (`relevance` · `price_asc` · `price_desc` ·
`newest` · `distance`) · `cursor` · `limit`.

**`sort=relevance` is rejected with 400 when `q` is absent** — there is no relevance without a query,
and silently substituting another order is a lie the client cannot detect.

**Never exposed:** arm timings, RRF scores, ranking internals. Those go to `SearchEvent` and logs.

---

#### 7. Idempotency HTTP semantics

**`Idempotency-Key` is REQUIRED** on the four locked operations (#10) — create payment attempt,
request refund, create viewing request, submit offer. **Required, not optional**, because an optional
protection is the one clients forget precisely when it matters; OpenAPI declares it a required header
so the generated client cannot omit it. Missing → **400**.

Opaque URL-safe string, 16–128 chars. Scoped **per (user, endpoint, key)**.

| Case | Response |
|---|---|
| Same key, same payload | **Stored response with its original status code** (`201` stays `201`) + **`Idempotent-Replay: true`** |
| Same key, different payload | **422** `/errors/idempotency-key-reused` |
| First request still running | **409** `/errors/idempotency-in-progress` + `Retry-After` |
| Expired (24h) | Treated as a new operation — documented and accepted |

**Keys stay in Postgres** (#10). `Idempotent-Replay` exists because without it a replay is
indistinguishable from a fresh success, which makes the mechanism untestable end to end.

---

#### 8. Query conventions

**A single `sort` token from a closed enum** — `price_asc`, **not** `sort=price&order=asc`. Two params
permit combinations that do not exist (`sort=relevance&order=desc`) and cannot be expressed as an
allowlist. One enum becomes a Zod literal union → a TypeScript union in the generated client, so
**invalid sorts are a compile error rather than a runtime 400**.

Ranges as `minPrice`/`maxPrice`. Repeatable filters as `?areaId=a&areaId=b`. Dates ISO 8601 UTC.
Shared parameter names across every endpoint.

⚠️ **No generic filter DSL** — no `?filter[price][gte]=`, no RSQL, no arbitrary operators. This is the
contract-level expression of #33's rule that **dynamic SQL identifiers come from a closed allowlist**;
a filter DSL is exactly the door that rule closes.

---

#### 9. Versioning

**Breaking** (needs `/v2`): removing or renaming a response field · changing a type · tightening
validation · changing a success status · changing a `type` value's meaning · ⚠️ **adding a value to a
*response* enum**, which breaks strictly-typed generated clients — ours included.

**Additive**: new optional request fields · new response fields · new endpoints · new optional query
params · **new error types**.

**Two contract obligations that make additive change safe:** clients must **ignore unknown response
fields**, and must have a **default branch for unknown error types**.

**Deprecation** via OpenAPI `deprecated: true` plus `Deprecation`/`Sunset` headers. **A field may only
be removed after the frontend using it is retired** — which matters precisely because the two deploy
independently (#18), so a live frontend always outlives a backend change for some window.

No per-endpoint versioning, no query-string versioning, no vendor media types.

---

#### 10. OpenAPI workflow

```
  Zod schemas (runtime validation) → openapi.json (committed, CI drift gate)
        → copied to frontend/ (committed) → openapi-typescript → generated client (CI freshness gate)
```

**The backend owns the contract unilaterally.** The frontend never invents a schema; it requests a
change. The spec cannot drift from behaviour because it is generated from **the same Zod schemas that
validate at runtime** (#18) — the property that makes separate projects safe.

**Each project's gate is self-contained. Nothing gates the frontend snapshot against the backend's —
deliberately**, because in production they legitimately differ during every deploy window. A
**non-blocking** CI job diffs them and warns.

---

#### 11. SSE, uploads, observability, bulk

**SSE** — `GET /api/v1/events`: authenticated, user-scoped, **thin events** (`{ entityType, entityId,
at }`) with the client refetching through the normal API; closed event-type enum; heartbeat ~25 s;
3 connections per user; ~30-minute lifetime. ⚠️ **No `id:` field is emitted, deliberately, so clients
never send `Last-Event-ID`** — making the absence of a replay buffer structural rather than merely
documented. AI uses **streamed POST responses** (`/ai/messages`, `/ai/agent-runs`) — one round trip
instead of create-then-connect. No WebSockets.

**Uploads** — `POST /uploads/authorize` → direct client upload to Cloudinary or Supabase Storage →
`POST /uploads/:assetId/complete`. **No multipart endpoint exists anywhere**; bytes never traverse
Express (#33). The finalize step is required for both providers — uniform contract, immediate
feedback, and it is where the provider reference binds to our record. A sweeper re-checks assets stuck
in `PENDING`.

**Observability headers** — `X-Request-Id` (accepted inbound if well-formed, else generated,
**always echoed**) · `RateLimit-*` on Tiers B and C only · `Retry-After` (Tier A returns *only* this,
per #33) · `Deprecation`/`Sunset` · `Idempotent-Replay`. ⚠️ **All must appear in
`Access-Control-Expose-Headers`** — cross-origin responses hide non-safelisted headers by default, so
`X-Request-Id` would be **silently unreadable** from `app.settly.com`. No other custom `X-` headers.

**Bulk operations: none in v1.** Authorization becomes per-item, partial failure needs `207
Multi-Status` (which clients handle badly), and idempotency becomes ambiguous. Where batching has real
product meaning, use an **explicit domain operation** — `POST /me/notifications/read-all` — never
`PATCH /resources { ids: [...] }`.

---

#### 12. Why this is the minimum sufficient contract

Every convention traces to something already locked: action endpoints to the state machines (#5) ·
machine codes to the bilingual UI (#39) · closed `sort` enum and no filter DSL to allowlisted SQL
identifiers (#33) · required `Idempotency-Key` to the four idempotent operations (#10) · `410` to the
search cache (#26) · thin SSE events with no `id:` to the no-replay design (#21) · relative `type`
URIs to not owning a domain · bare resources to `openapi-fetch` ergonomics and #39's client-only
personalization rule · the 404/403 rule to resource-scoped authorization (#33).

> ⚠️ **Explicitly evaluated and rejected — do not reintroduce because the pattern is common:**
> a universal `{ data, meta }` envelope · a separate `code` beside `type` · a generic filter DSL or
> RSQL · `sort` + `order` as two params · HATEOAS/`_links` · field selection `?fields=` · relation
> expansion `?include=` · `207 Multi-Status` · generic bulk CRUD · ETag/`If-None-Match` (a later
> optimization, not v1) · per-endpoint or query-string versioning · vendor media types · API keys.

**Eleven common conventions rejected**, and the error taxonomy is bounded by a stated rule rather than
by discipline alone. **No business rules changed, no models changed** — the 39-table inventory is
untouched.

---

### #41 — Testing Architecture (high impact)
`2026-09-05` · **LOCKED** · Testing · *Extends #8, #10, #13, #27, #37 · Generalises #19*
Affects: `process/TESTING.md`, `process/CONVENTIONS.md`, `process/ENVIRONMENT.md` (Tier B)

**Context.** Testing was decided piecemeal across four decisions — Vitest/RTL/Playwright/MSW (#21),
agent controller tests and the eval suite (#19), the fake payment adapter (#13), concurrency tests
against real Postgres (#13) — and never assembled. That matters more here than in a typical project,
because **the concurrency and idempotency work of #10 is only valuable if it is verifiable**, and
verification has infrastructure consequences.

#### Six layers with hard boundaries

| Layer | Environment | Contains | Must NOT contain |
|---|---|---|---|
| **1 Unit** | none | RRF, Arabic normalisation, cursor codec, guard predicates, chunking, prompt composition, money arithmetic | Anything touching Prisma, HTTP or wall-clock time |
| **2 Service** | **Real Postgres** | Every transition, guard, invariant, policy function, transaction boundary — **all 45 transitions in `product/BUSINESS_RULES.md` §2–§5** | HTTP concerns, response shapes, external calls |
| **3 Database** | **Real Postgres** | Raw SQL in `sql/`, PostGIS, pgvector recall, FTS + trigram, generated columns, every constraint, migrations up/down | Business logic |
| **4 Concurrency** ⭐ | **Real Postgres, serial, no wrapping transaction** | I9/I11/I12 advisory locks, viewing overlap, deposit race, idempotency races, offer CAS | Anything not racing |
| **5 API/contract** | Postgres + Redis | Status codes, RFC 9457 shapes, idempotency semantics, cursor round-trip, rate-limit headers, SSE framing, **the 404-vs-403 leak rule** | Business rules already covered at layer 2 |
| **6 E2E** | Full local stack | ~12 journeys, happy path plus two critical failures | Exhaustive permutations |

**Business logic is tested at the service layer, not through HTTP.** This follows directly from #8:
authorization lives in services, so testing it through HTTP would exercise the wrong boundary and be
an order of magnitude slower.

**Layer 4 is separate for a structural reason:** concurrency tests need genuinely concurrent
transactions, so they **cannot run inside a wrapping transaction** and cannot run in parallel with one
another. Folding them into layer 2 would force the whole suite onto the slowest isolation strategy.
Layers 1–3 and 5 use transaction-rollback isolation and run in parallel; **layer 4 uses truncate and
runs serially.**

#### Real Postgres, never a substitute

> Exclusion constraints over `tstzrange`, partial unique indexes, advisory locks, `READ COMMITTED`
> re-evaluation semantics, PostGIS, pgvector and trigram **do not exist, or behave differently, in
> SQLite or any in-memory substitute.**

A substitute would produce **false confidence in exactly the mechanisms Decision #10 depends on** —
which is worse than having no test at all.

**No Testcontainers.** Docker Compose provides Postgres and Redis locally (#37) and GitHub Actions
service containers provide them in CI. Testcontainers would add a dependency and startup cost to
replicate what both environments already have. *(Service-container extension support is **V32** — a
stock `postgres` image will not suffice.)*

#### Proving the concurrency invariants

This is what makes #10 real rather than asserted. Each runs against real Postgres, serially, **and is
never retried**:

| Invariant | Test |
|---|---|
| I9 / I11 / I12 | N concurrent requests at the limit − 1 → exactly the limit persists, N−1 rejected |
| Viewing overlap | Two confirmations overlapping by one minute → exactly one succeeds |
| **Deposit race** | Two rival webhooks concurrently → one `RESERVED`; **the loser `SUPERSEDED` with a full refund issued** |
| Idempotency | Two identical requests, one key → one execution, one `409` or one replay |
| AuditLog immutability | `UPDATE` and `DELETE` both rejected by the database |

#### Gates versus reports

**Generalising #19's rule from the agent suite to all AI evaluation:**

| CI gate | CI report |
|---|---|
| Layers 1–5 · OpenAPI drift · generated-client freshness · migration validation · destructive-migration detection · module boundaries · `npm audit` critical · gitleaks | **Retrieval evaluation** against the #27 thresholds · agent eval suite · backend↔frontend snapshot skew |

**Evaluation of a non-deterministic system must never gate a deterministic pipeline.** A gate that
fails intermittently is a gate people learn to bypass.

#### Environment and substitution — inheriting #37 and #44

Resend for email locally (real delivery to developer's inbox; Mailpit eliminated per #44; faked in CI) · **fake Paymob adapter with a local webhook signer** (sandbox is a *manual
pre-release check*, never CI) · **Gemini never in gated CI**; evaluation runs separately · Cloudinary
real locally, faked in CI · MSW driven by the **committed OpenAPI snapshot**, so frontend mocks cannot
drift from the contract.

⚠️ **Tests never use the demo seed corpus (#27).** Factories only. Coupling tests to demo data makes
both fragile, and the seed exists to demonstrate the product, not to fixture it.

**Argon2id may be weakened in the automated test suite only** (#33), behind an explicit flag.

#### Determinism

Fixed clock for expiry logic · seeded randomness · deterministic fixture ids · Playwright traces and
database snapshots captured on failure.

> ⚠️ **Retries are permitted only for genuinely external flake in the manual pre-release sandbox check
> — never for layers 1–5. A flaky concurrency test is a finding, not a nuisance.**

#### Rejected

SQLite or in-memory Postgres · Testcontainers · mocking Prisma · a shared long-lived CI database ·
**coverage thresholds** (a number that gets gamed; layer 4 passing is the real signal) · retrying
concurrency or E2E tests · duplicating E2E coverage at component level.

**No models, no fields, no business rules changed.**

---

### #42 — Privacy, Retention & Data Lifecycle (high impact)
`2026-09-05` · **LOCKED** · Privacy · *Refines #33, #13/#3, #39, #17*
Affects: `architecture/SECURITY.md`, `DOMAIN_MODEL.md`, `AI.md`, `RAG.md`, `PAYMENTS.md` (Tier B)
**Adds two business rules to `product/BUSINESS_RULES.md`**

**Context.** #39 established the *structural* implications of anonymisation but deferred policy.
Reconciling that policy against the locked model surfaced **three gaps that would have become defects
in implementation** — all security-relevant.

#### Three gap-closing rules

**① Embedding lifecycle is transactional, not eventual.** *(refines #39)*

> **A change to a document's `visibilityScope`, or its deletion, updates or deletes its `Embedding`
> rows in the same transaction.** A reconciliation sweeper detects drift and alerts on any non-zero
> count.

#39 denormalised `visibilityScope` onto `Embedding` for in-query security filtering but never said
what happens when the source changes. **Without this rule, a document downgraded from `PARTY` to
`PRIVATE` would remain retrievable by the counterparty through RAG** — a live security hole. Both are
Postgres rows, so atomicity is free. **Drift is a security incident, not a data-quality warning.**

**② `AuditLog.metadata` carries ids and enums only — never PII.** *(refines #33)*

Because the table is immutable, anything written there is permanent and **anonymisation cannot reach
it**. An email in a moderation reason would outlive the account it belongs to. Enforced by a test
asserting metadata keys against a closed allowlist.

**③ `WebhookEvent` raw payload is purged after 90 days; the event id is kept forever.** *(refines #13/#3)*

#3 said "stored raw"; #13 said never log the full payload — the *table* was never covered, meaning
cardholder metadata would persist indefinitely. **Dedup correctness needs only the id**, so the
payload can be nulled once the dispute window closes.

#### Deletion model — five mechanisms, no global soft-delete (#6 preserved)

```
  HARD DELETE      sessions · tokens · idempotency keys · expired analytics ·
                   AI conversations (user-initiated) · read+aged notifications ·
                   failed ingestion artifacts · devices · never-published DRAFTs
  ANONYMISE        user  ← the ONLY anonymised entity
  IMMUTABLE        AuditLog
  RETAIN           Payment · PaymentAttempt · Refund · Offer · OfferRevision ·
                   Viewing · WebhookEvent (id) · published property history
  LIFECYCLE-BOUND  Embedding — bound to its source, never time-bound
```

#### Retention — configuration with defaults

Defaults live in the same backend constants module as the business constants (#31), because these are
operational values that will be tuned.

| Data | Default | Rationale |
|---|---|---|
| Sessions, tokens | Delete 7d past expiry | Already TTL'd; cleanup is hygiene |
| Idempotency keys | 24h | Locked (#10) |
| **WebhookEvent payload** | **Null after 90d; id forever** | Dispute window, then purge |
| Payments, refunds, offers, viewings | **Indefinite** | Financial and contractual history |
| AuditLog | **Indefinite** | The evidence layer |
| Notifications | Delete **read** after 180d | Transient UI state; unread never auto-deleted |
| PropertyViewEvent, SearchEvent | **365d, delete rows** | Year-over-year is the longest useful window. **Deletion, not anonymisation** — simpler and stronger than nulling a user id on the highest-volume tables |
| AI conversations, AgentRun | **User-deletable anytime; auto-delete after 365d inactivity** | Most personal, least business-critical |
| Failed ingestion artifacts | 30d | Triage window |
| BullMQ job metadata | Last 1,000 failures | Triage without unbounded growth |
| Logs | Platform-managed | Railway/Vercel/Sentry retention |

#### The AI privacy boundary *(refines #17)*

> **The AI's data-access surface is exactly the tool allowlist plus the RAG corpus, executed as the
> user. There is no other path.**

| May reach Gemini | **Never** |
|---|---|
| Public property content · published `KnowledgeArticle` · `Document` chunks **passing the actor's visibility filter** · the user's **own** favourites, viewings and preferences via tools · the user's message text | Messages · payments · refunds · offers · AuditLog · admin data · any other user's data · emails, phone numbers, session tokens |

Outbound payloads are minimised to retrieved chunks, the composed property summary and the user's
message. **The paid Gemini tier must be in use before any real user content reaches a prompt** (V9);
synthetic seed data carries no such constraint.

#### User and agent deletion

| | Deleted | Anonymised | Retained |
|---|---|---|---|
| **User** | `account`, `session`, `UserDevice`, AI conversations, saved searches, collections | `user` PII in place; email → unique non-routable placeholder; `banned = true`; `anonymizedAt` set | Offers, viewings, payments, refunds, audit entries, **messages** |
| **Agent** | Same, plus `AgentProfile` licence details | Same | **Property ownership and attribution** — listings show "Former agent" |

**Messages are retained with an anonymised author, deliberately:** the counterparty is a legitimate
party to that conversation, and removing half of it would corrupt their record.

**Three tiers of agent removal**, distinguished because they are routinely conflated:
`suspend` (banned, reversible) → `deactivate` (listings archived, login intact) → `anonymise`
(irreversible, attribution preserved).

#### Backups

**Backups are operational recovery, not an application deletion surface.** Deleted data persists until
backup expiry. ⚠️ **A restore must not resurrect access:** the post-restore runbook re-applies
anonymisation and re-runs the embedding-drift sweeper.

#### Ten testable invariants

`PR1` authorization precedes AI retrieval · `PR2` private documents cannot become public via
embeddings · `PR3` an anonymised user cannot authenticate · `PR4` a deleted private asset is
unretrievable · `PR5` AuditLog is append-only · `PR6` audit metadata has no PII · `PR7` payment
records cannot be deleted · `PR8` logs never contain credentials · `PR9` AI cannot read messages,
payments, audit or admin data · `PR10` outbound AI payloads are minimised.

Each has a corresponding test in layer 2 or 5 of #41.

#### Rejected

Global `deletedAt` (#6 already rejected it) · anonymising analytics instead of deleting (an UPDATE
over the highest-volume tables to preserve rows nobody queries) · a `PrivacyRequest` model (one admin
operation, not a workflow) · deleting AuditLog entries on user deletion (destroys the evidence layer).

#### Model impact

**None. 39 tables stand.** Two fields only: `WebhookEvent.payloadPurgedAt`, `Notification.readAt`.
`anonymizedAt` was already locked in #39.

---

### #43 — Real-Time Communication Architecture: WebSocket for 1-on-1 Chat, SSE for In-App Notifications
`2026-09-14` · **LOCKED** · Communication · *Amends #21* · Affects: `architecture/COMMUNICATION.md`, `architecture/FRONTEND.md`, `architecture/OVERVIEW.md`

**Context.** Decision #21 originally rejected WebSockets and Socket.IO on the grounds that in-app notifications are a unidirectional server-to-client event stream. However, Settly’s product scope includes real-time 1-on-1 messaging between Buyers and Agents, which requires low-latency bidirectional messaging, instant delivery confirmation, and future capabilities such as typing indicators, presence, and read receipts.

**Decision.**
1. **1-on-1 Chat uses native WebSocket (`/ws/chat`).** The Buyer ↔ Agent conversation stream uses WebSocket connections authenticated via the active user session.
2. **In-App Notifications retain Server-Sent Events (SSE, `/api/v1/events`).** Server-to-client events (offer status updates, viewing confirmations, payment alerts, new message indicators) remain thin SSE events that trigger TanStack Query cache invalidations on the client.
3. **PostgreSQL remains the source of truth for all chat messages and notifications.** WebSocket is strictly an ephemeral transport layer. Messages are never stored solely in memory or Redis. Every message is validated and persisted to PostgreSQL before or concurrently with real-time broadcast.
4. **Serverless & Multi-Instance Coordination:** Because client connections may land on different backend instances, cross-instance messaging and presence coordination is handled via **Redis Pub/Sub** (backed by Upstash Redis). No in-memory state is assumed to be shared across processes.
5. **Rejection maintained:** Socket.IO remains **rejected**. Native WebSockets (`ws` protocol) provide all required capabilities without proprietary framing, client bundle bloat, or fallback polling complexity.

---

### #44 — Infrastructure & Managed Services: Upstash Redis and Resend Email
`2026-09-14` · **LOCKED** · Infra / Ops · *Locks #36, refines #22 and #37* · Affects: `architecture/INFRASTRUCTURE.md`, `architecture/BACKEND.md`, `process/ENVIRONMENT.md`

**Context.** Infrastructure choices refined to support managed cloud deployment, serverless compatibility for caching, and real email verification during both development and production.

**Decision.**
1. **Email Provider — Resend Locked Everywhere.** Resend is locked across all environments (development, testing, production). **Mailpit is eliminated.** All transactional emails (email verification OTP, password reset, notifications) are delivered to real inboxes (e.g., Gmail, Outlook). Business logic interacts exclusively with an application-level `EmailService` abstraction so domain code is not coupled to Resend's SDK.
2. **Redis Provider — Upstash Redis.** Settly adopts Upstash Redis as its managed Redis provider for BullMQ background queues, rate limiting (`express-rate-limit`), hybrid search result caching (top-500 candidate lists), and WebSocket cross-instance coordination. Redis remains strictly ephemeral; PostgreSQL is the sole source of truth for business data.
3. **Serverless Runtime Boundary Constraint:** While the Next.js frontend is deployed serverless on Vercel, the backend API (`settly-api`) and background workers (`settly-worker`) require a persistent, always-on container environment (such as Railway or containerized host). Native WebSockets, long-lived SSE streams, and BullMQ worker event loops cannot execute inside stateless, ephemeral serverless functions (like Vercel functions) due to execution timeouts and lack of persistent TCP listeners.

---

> ## ✅ ARCHITECTURE CLOSED at #44
>
> Forty-four decisions locked, zero provisional, 39 tables, 33 pending verifications,
> zero application code. **Next phase: Tier-B Documentation update & verification spikes.**

---
