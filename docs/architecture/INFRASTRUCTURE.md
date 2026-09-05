# Infrastructure

    Status:       LOCKED · Resend PROVISIONAL
    Last Updated: 2026-09-05
    Derived From: Decisions #22, #36, #37
    Related:      OVERVIEW.md, ../process/ENVIRONMENT.md

## 1. Purpose

The approved deployment topology, local and future-production, and the hard constraints that
must not be violated by convenience.

## 2. Local topology (current — this is what exists today)

```
  Local machine
  ├── frontend/          Next.js @ localhost:3000
  ├── backend/
  │     ├── api          Express @ localhost:4000
  │     └── worker        BullMQ consumers + schedulers
  ├── PostgreSQL          Docker: PostGIS + pgvector + pg_trgm + btree_gist
  ├── Redis               Docker
  ├── Mailpit             local inbox — no production email provider needed locally
  ├── Cloudinary          REAL, dev/ folder (EXIF-stripping is theirs, must be exercised)
  ├── Paymob              FAKE adapter + local webhook signer (sandbox is a manual pre-release check)
  ├── Gemini               REAL, prompt-hash cached
  ├── FCM                  no-op adapter
  └── Sentry               OFF
```

## 3. Future production topology (not yet deployed)

```
  Vercel                 frontend
  Railway                settly-api (ALWAYS ON — hard constraint) + settly-worker (2 services)
  Managed Redis          BullMQ + rate limiting + hybrid-search cache
  Supabase PostgreSQL    PostGIS + pgvector + pg_trgm + btree_gist
  Cloudinary             public media
  Supabase Storage       private documents
  Paymob                  production payments
  Resend (PROVISIONAL)   production email — V18 not yet verified
  Google Geocoding       server-side, listing creation only
  MapTiler                map tiles
  FCM                     push
  Sentry                  errors + Crons
```

## 4. Hard constraint

> **The backend must be always-on. It cannot sleep on idle.** Scheduled reconciliation and expiry
> jobs are load-bearing (`CONCURRENCY_AND_IDEMPOTENCY.md` Section 8); a sleeping backend silently
> invalidates the payment reliability design.

Any scale-to-zero host is disqualified for the API/worker.

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
least-privilege workflow permissions, third-party actions pinned to commit SHAs. No staging
environment — Vercel previews + one-click Railway rollback are the mitigation.

## 8. Explicitly excluded

Kubernetes · Terraform · ECS · service mesh · multi-region deployment · a staging environment ·
Neon (declined in favour of Supabase) · any enterprise infrastructure not justified by a stated
requirement.

## 9. Demo reliability risk

Supabase's free tier can suspend an inactive project — the single biggest threat to a portfolio
demo staying reachable. **Resolution deferred to pre-launch**: revisit the Supabase tier (Pro, or
accept a documented resume step) before the public demo — not a current blocker.

## 10. Pending verification

**V8** (Supabase tier decision before demo) · **V11** (btree_gist on Supabase) · **V13** (Vercel
stable preview-domain aliasing for CORS) · **V17** (Railway healthcheck/restart config) · **V32**
(GitHub Actions service containers with the required Postgres extensions).

## 11. Rejected / do not add

Kubernetes, Terraform, ECS, service mesh, multi-region, staging infrastructure, Neon, any
scale-to-zero host for the API/worker.

## 12. Related documents

`OVERVIEW.md` for how this topology fits the module/request-flow model · `../process/ENVIRONMENT.md`
for environment variables and local setup detail.
