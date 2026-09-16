# Database Architecture

    Status:       LOCKED · sections marked PENDING VERIFICATION as noted
    Last Updated: 2026-09-05
    Derived From: Decisions #6, #7, #10, #33, #39, #42
    Related:      DOMAIN_MODEL.md, CONCURRENCY_AND_IDEMPOTENCY.md, generated/erd.md

## 1. Purpose

The database technology choices, extensions, indexing strategy, and the boundary between Prisma
and raw SQL. This is the implementation contract for everything DOMAIN_MODEL.md describes.

## 2. Engine and extensions

**PostgreSQL 17**, with:

| Extension | Purpose | Verification |
|---|---|---|
| **PostGIS** | Radius/bbox/polygon geo search, KNN ordering, map clustering | — |
| **pgvector** (>= 0.8 target) | Semantic retrieval — property embedding column + chunk table | PENDING — V2 (HNSW/`halfvec` limits vs. Gemini's native dimensions) |
| **pg_trgm** | Typo tolerance, name matching, script-agnostic fuzzy match | — |
| **btree_gist** | Required by the viewing-overlap exclusion constraint | PENDING — V11 (Supabase availability), V32 (CI service container) |

Why Postgres over MySQL/Mongo, and pgvector over an external vector DB: see Decisions #6 (full
rationale — filtering is the decisive factor, not scale).

## 3. Prisma / raw SQL boundary

**Prisma is the application/data-access layer. Raw SQL is confined to named, tested functions in
`sql/` for what Prisma cannot express**: PostGIS predicates, pgvector distance operators,
exclusion constraints, triggers, hybrid-ranking queries (#7). This is not a failure of the
architecture — it is the explicit, user-approved design.

**Rule:** raw SQL always uses parameterized placeholders. Dynamic sort/filter identifiers come
from a closed server-side allowlist — never string interpolation (#33).

## 4. Connections

| Purpose | Connection |
|---|---|
| Application (Prisma Client) | **Pooled** (Neon pooler, transaction mode, protocol-level prepared statements; no `pgbouncer=true`) |
| Migrations | **Direct** (Neon direct host / port 5432) |
| Local development | Configured to Neon development database (or local Docker Postgres) |

V6 Verified (2026-09-16): Neon PgBouncer transaction pooler supports protocol-level prepared statements (`max_prepared_statements`). `pgbouncer=true` is omitted to avoid prepared-statements-disabled round-trip overhead.

## 5. Generated columns

| Column | Config | Why generated |
|---|---|---|
| `Property.searchVectorEn` | `to_tsvector('english', ...)` | Fixed configuration per column (#39 amendment to #6) |
| `Property.searchVectorAr` | `to_tsvector('simple', ar_normalize(...))` | Fixed configuration; Arabic normalisation applied deterministically inside the expression |

**The original per-row FTS trigger (Decision #6) is removed** — two fixed-config generated
columns replace it (#39). Both must be immutable expressions to remain generated columns.

## 6. Index inventory and query justification

| Index | Serves |
|---|---|
| `(listingIntent, price)` partial WHERE `status='PUBLISHED'` | Default browse: intent + price sort |
| `(areaId)` partial | Area-filtered browse |
| `(propertyType)`, `(bedrooms)` partial | Bitmap-ANDed with the above |
| `(publishedAt DESC)` partial | Newest-first sort |
| GiST on `Property.location` | Radius, bbox, KNN distance ordering |
| **Partial HNSW** on `Property.embedding` WHERE `status='PUBLISHED'` | Semantic search arm |
| GIN on `searchVectorEn`, `searchVectorAr` | Lexical search arm |
| GIN trigram on titles, `Area.nameEn/nameAr/aliases`, agent names | Typo tolerance, autocomplete |
| `(agentId, status, updatedAt DESC)` | Agent dashboard listing table |
| **Partial unique** `(propertyId)` WHERE offer status IN (RESERVED, COMPLETED) | Invariant I1 — the deposit race |
| **Exclusion** `(agentId, tstzrange(startsAt, endsAt))` WHERE CONFIRMED | Viewing overlap |
| Unique `(provider, providerEventId)` on `WebhookEvent` | Webhook dedup |
| Unique `(userId, key)` on `IdempotencyKey` | Idempotency scope |

**Starting position: single-column partial indexes + bitmap AND**, not guessed composites.
Add composites only where `pg_stat_statements` shows a real problem (#14).

## 7. Constraints as the correctness boundary

Per Decision #10's governing principle — correctness lives in constraints and conditional
updates, escalation to locks only where constraints cannot express the rule:

| Mechanism | Enforces |
|---|---|
| Partial unique index | Deposit race (I1) |
| Exclusion constraint | Viewing overlap |
| Conditional update (status-as-CAS) | Every state-machine transition |
| **Transaction-scoped advisory lock** (shared namespace, keyed on `userId`) | I9 (viewing cap), I11 (saved search cap), I12 (live offer cap) — all write-skew, none expressible as a constraint |
| `SELECT ... FOR UPDATE` on `Payment` | Refund-sum invariant (I4) |
| Database rule/trigger rejecting UPDATE/DELETE | AuditLog immutability — PENDING V33 |

`SERIALIZABLE` is used nowhere.

## 8. Transactions

Transactions contain **only the writes that must be atomic**. No external I/O and no BullMQ
enqueue inside a transaction (#8, #10). See `CONCURRENCY_AND_IDEMPOTENCY.md` for the full
transaction inventory (T1-T7).

## 9. Migrations

- Forward-only in production
- **Expand/contract** for destructive changes: add → backfill → switch reads → drop in a later
  release
- CI flags any migration containing `DROP` or a narrowing `ALTER TYPE` for explicit approval
- Better Auth's CLI generates its 4 tables into our schema; regeneration behaviour is PENDING —
  V21

## 10. Local vs. production

| | Local | Production |
|---|---|---|
| Engine | Neon Serverless PostgreSQL 18 or Docker `postgis/postgis` | Neon Serverless PostgreSQL 18 |
| TLS | Required for Neon | Required |
| Backups | None | Neon-managed |

## 11. Least-privilege role — optional

A `settly_app` role with DML-only permissions is a recommended hardening measure, **not a
mandatory dependency** — do not let it block normal development (#33).

## 12. Pending verification

V1, V2, V5, V11, V12, V20, V21, V22, V32, V33 all touch this document. V6 is verified (2026-09-16).
See `../DECISIONS.md` Section 2 for the authoritative tracker — do not treat any as settled here.

## 13. Rejected / do not add

MySQL, MongoDB · earthdistance/cube · external vector databases (Pinecone/Qdrant/Weaviate) ·
Meilisearch/Typesense · PostgreSQL RLS · a global `deletedAt` column · `SERIALIZABLE` as a default
isolation level · guessed composite indexes without a measured query.

## 14. Related documents

`DOMAIN_MODEL.md` for the tables these indexes and constraints protect · `CONCURRENCY_AND_IDEMPOTENCY.md`
for the concurrency mechanisms in detail · `generated/erd.md` for the exact schema.
