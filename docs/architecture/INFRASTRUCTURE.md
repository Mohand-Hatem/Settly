# Infrastructure

    Status:       LOCKED
    Last Updated: 2026-09-14
    Derived From: Decisions #22, #36, #37, #43, #44
    Related:      OVERVIEW.md, ../process/ENVIRONMENT.md

## 1. Purpose

The approved deployment topology, local and future-production, and the hard constraints that
must not be violated by convenience.

## 2. Local topology (current — this is what exists today)

```
  Local machine
  ├── frontend/          Next.js @ localhost:3000
  ├── backend/
  │     ├── api          Express @ localhost:4000 (REST + SSE + WebSocket)
  │     └── worker        BullMQ consumers + schedulers
  ├── PostgreSQL          Docker: PostGIS + pgvector + pg_trgm + btree_gist
  ├── Redis               Docker or Upstash Redis (dev)
  ├── Resend              REAL email delivery to real inboxes (Decisions #36, #44)
  ├── Cloudinary          REAL, dev/ folder (EXIF-stripping is theirs, must be exercised)
  ├── Paymob              FAKE adapter + local webhook signer (sandbox is a manual pre-release check)
  ├── Gemini               REAL, prompt-hash cached
  ├── FCM                  no-op adapter
  └── Sentry               OFF
```

## 3. Future production topology (not yet deployed)

```
  Vercel                 frontend (Next.js App Router — serverless / edge)
  Railway                settly-api (ALWAYS ON container — REST, SSE, WebSocket)
  Railway                settly-worker (ALWAYS ON container — BullMQ consumers + 9 schedulers)
  Upstash Redis          BullMQ queues + rate limiting + hybrid-search cache + WS pub/sub
  Supabase PostgreSQL    PostGIS + pgvector + pg_trgm + btree_gist
  Cloudinary             public media
  Supabase Storage       private documents
  Paymob                  production payments
  Resend                 production email (LOCKED)
  Google Geocoding       server-side, listing creation only
  MapTiler                map tiles
  FCM                     push
  Sentry                  errors + Crons
```

## 4. Hard constraint: Serverless vs. Always-On Container Boundary

> **The backend API and workers must be always-on containers. They cannot run in stateless serverless functions.**

1. **Native WebSockets (`/ws/chat`)**: require an open, persistent TCP socket connection with in-memory connection handles. Stateless serverless functions (like Vercel functions) terminate immediately after returning an HTTP response and cannot maintain socket connections.
2. **Server-Sent Events (`/api/v1/events`)**: require a persistent HTTP stream. Serverless function timeout limits (e.g. 15s–60s) would forcibly terminate SSE streams and induce perpetual client reconnections.
3. **BullMQ Workers**: require a continuous Node.js event loop listening for Redis jobs. Serverless functions cannot poll or block on Redis queues while idle.
4. **Scheduled reconciliation and expiry jobs** (`CONCURRENCY_AND_IDEMPOTENCY.md` Section 8) are load-bearing. A sleeping backend invalidates the payment reliability design.

**Resolution:** Vercel deploys the frontend; Railway (or an equivalent container runner) runs `settly-api` and `settly-worker` as persistent services. Cross-instance WebSocket messaging is coordinated across containers via **Upstash Redis Pub/Sub**.

## 5. Two Railway services — not one

`settly-api` and `settly-worker`, from one `backend/` codebase, different start commands. A
worker crash cannot take down the API; CPU-bound image/embedding work never competes with request
latency. ~$5/month more than one process, bought for architectural honesty.

## 6. Environment-driven configuration — never a code branch

Every difference between local and production is a configuration value. Identical across both:
authorization, business rules, state machines, transactions, idempotency, database constraints,
Zod validation, audit behaviour, rate limits, request ids, log redaction. Legitimately different:
cookie `secure`/`domain`, CORS origins, HSTS, CSP enforcement mode, log format/level, Sentry
on/off, `bull-board` presence.

`localhost:3000` and `localhost:4000` are **same-site** — `SameSite` is evaluated on the
registrable domain, ports are not part of it — so the local cookie model rehearses production
faithfully rather than approximating it.

## 7. CI/CD

GitHub Actions: lint, strict `tsc`, tests (against ephemeral Postgres/Redis service containers),
OpenAPI drift gate, migration validation, destructive-migration detection, module-boundary
enforcement, `npm audit` (critical only), gitleaks, generated-client freshness. Protected `main`,
least-privilege workflow permissions, third-party actions pinned to commit SHAs. **Credentials in
workflows come only from GitHub Actions secrets** (e.g. `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) — never plaintext in the YAML (#98). No staging
environment — Vercel previews + one-click Railway rollback are the mitigation.

## 8. Explicitly excluded

Kubernetes · Terraform · ECS · service mesh · multi-region deployment · a staging environment ·
any enterprise infrastructure not justified by a stated requirement. Note: Neon was originally declined but subsequently selected for the database per the 2026-09-14 user directive (DECISIONS.md #22).

## 9. Demo reliability risk

Neon Serverless PostgreSQL (PostgreSQL 18, `eu-central-1`) provides the database layer. Inactivity scale-to-zero settings are managed in Neon compute configuration.

## 10. Pending verification

**V8** (revisited for Neon compute sizing) · **V13** (Vercel
stable preview-domain aliasing for CORS) · **V17** (Railway healthcheck/restart config) · **V32**
(GitHub Actions service containers with the required Postgres extensions).

## 11. Rejected / do not add

Kubernetes, Terraform, ECS, service mesh, multi-region, staging infrastructure, any
scale-to-zero host for the API/worker.

## 12. Related documents

`OVERVIEW.md` for how this topology fits the module/request-flow model · `../process/ENVIRONMENT.md`
for environment variables and local setup detail.
