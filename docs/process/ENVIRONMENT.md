# Environment

    Status:       LOCKED
    Last Updated: 2026-09-14
    Derived From: Decisions #22, #33, #37, #44
    Related:      ../architecture/INFRASTRUCTURE.md, TESTING.md

## 1. Purpose

Local environment setup, environment-variable strategy, and the substitution rules that let local
development be a faithful rehearsal of production rather than an approximation.

## 2. Ports and services (local)

```
  frontend/    localhost:3000
  backend/api  localhost:4000
  worker        local process (no port)
  Postgres      Docker (PostGIS + pgvector + pg_trgm + btree_gist)
  Redis         Upstash Redis (cloud instance) or Docker Redis (local)
  Email         Resend (real delivery to inbox, e.g. Gmail; Mailpit eliminated)
```

`localhost:3000` and `localhost:4000` are **same-site** — `SameSite` is evaluated on the
registrable domain, ports are not part of it — so cookies behave locally exactly as they will
across production subdomains.

## 3. `.env` strategy

`.env` per project (`frontend/`, `backend/`), gitignored. **`.env.example` committed** with every
key present, no real values — it doubles as configuration documentation.

## 4. Public vs. server variables

`NEXT_PUBLIC_*` is compiled into the client bundle and is **public** — there is no "slightly
private". Safe as `NEXT_PUBLIC_`: API URL, MapTiler key (domain-restricted at MapTiler), Sentry
DSN, Firebase web config. **Never `NEXT_PUBLIC_`**: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`REDIS_URL`, `CLOUDINARY_API_SECRET`, `PAYMOB_API_KEY`/`PAYMOB_HMAC_SECRET`, **`GEMINI_API_KEY`**,
`RESEND_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `GOOGLE_GEOCODING_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. The Gemini key reaching the browser would be a direct, unbounded
bill — this line matters most.

## 5. Secret rotation

Documented procedure; rotate on suspected exposure. `BETTER_AUTH_SECRET` rotation invalidates all
sessions — never rotate casually. gitleaks + GitHub secret scanning catch accidental commits.

## 6. Docker Compose (local)

Postgres (with the four required extensions), Redis (or Upstash Redis config). Mailpit is eliminated per Decision #44; Resend is used for real email delivery across all environments. A backend Dockerfile gives
local/production parity for Railway's build.

## 7. Substitution rule (Decision #37)

> **Substitute where the security/behavioural control belongs to Settly. Use the real external
> service where the service itself owns a behaviour we need to exercise.**

| Service | Local | Why |
|---|---|---|
| Cloudinary | **Real**, `dev/` folder | EXIF-stripping and re-encoding are theirs — a substitute means that control is never once exercised before production |
| Supabase Storage | Local filesystem adapter | Magic bytes, authorization, audit are ours |
| Paymob | **Fake adapter** + local webhook signer | HMAC verification, amount assertion, the state machine are ours. One sandbox test remains mandatory (V4) |
| Gemini | Real, prompt-hash cached | Quality is theirs; the cache makes repeated iteration free |
| Email | **Resend** (real delivery to developer's inbox) | Delivery is theirs; eliminates dev/prod divergence and verifies real DKIM/SPF and rendering (Decision #44) |
| FCM | No-op adapter | Delivery is theirs |
| Google Geocoding | Fixtures | Deterministic, called once per listing |
| Sentry | Off | — |

**Rate limiting is NOT disabled locally** — disabling it means never exercising the 429 path or
client handling of it. A per-test bypass token covers tests that must exceed a limit.

## 8. No environment-dependent security branches

> **Every environment difference is a configuration value, never an `if (isProduction)` branch
> around a security control.**

The one sanctioned exception: Argon2id parameters may be reduced **in the automated test suite
only**, behind an explicit flag — never in local development, where the real login cost should be
felt.

## 9. Future production environment (not current)

See `../architecture/INFRASTRUCTURE.md` Section 3 — Vercel/Railway/Supabase/Resend. Not a current
setup requirement.

## 10. Pending verification
 
 V32 (CI service-container extension support). V6 verified (2026-09-16, Neon PgBouncer supports protocol-level prepared statements; `pgbouncer=true` omitted).

## 11. Rejected / do not add

Requiring a purchased domain, Vercel deployment, or Railway deployment as a *current* development requirement — these are deployment-phase concerns. Mailpit is rejected/eliminated (Decision #44) in favor of real Resend delivery.

## 12. Related documents

`../architecture/INFRASTRUCTURE.md` for the full topology · `TESTING.md` for how these
environments are exercised in CI.
