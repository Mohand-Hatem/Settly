# Settly Glossary

    Status:       LOCKED
    Last Updated: 2026-09-05
    Decisions:    #1, #3, #5, #6, #11, #13, #14, #19, #24, #33, #34, #35, #36, #37, #38, #39, #40, #41, #42
                  (#15 canonical description REVERSED by #39)
    Related:      product/BUSINESS_RULES.md, DECISIONS.md

Domain vocabulary. Settly's terms are easy to conflate, and conflating them produces wrong
models, wrong queries and wrong business logic.

**Read this before creating any model, service or endpoint.**

---

## 1. The nine distinctions that matter most

If you read nothing else, read these. Each pair is a mistake waiting to happen.

| These are **not** the same thing | | |
|---|---|---|
| **`Lead`** — the pipeline anchor: one per (buyer, property), created on first contact, owns the agent-facing pipeline status | ≠ | **`Conversation`** — a two-party message thread. Messaging is a *channel*; the lead is the *pipeline*. A lead can exist with no messages at all, created by a viewing request |
| **`Offer`** — the stateful negotiation thread for one buyer on one property. Owns the state machine. **One row** | ≠ | **`OfferRevision`** — one proposed set of terms from either side. **Append-only history.** An offer with five counters has one `Offer` row and six `OfferRevision` rows |
| **`Payment`** — the *obligation*: what is owed, for which offer, with a deadline. Survives failures | ≠ | **`PaymentAttempt`** — one try at the provider. **Failure belongs to the attempt, not the obligation.** A declined card fails one attempt; the `Payment` returns to `PENDING` so the buyer can retry |
| **Checkout hold** — a 15-minute *exclusive lock on starting checkout*. Grants **no rights**, reserves nothing legally, expires automatically | ≠ | **Reservation** — the property state after a deposit is **confirmed**. The actual commitment |
| **`Area`** — a **self-referencing hierarchy** node: governorate → city → district → compound | ≠ | A city. **There is deliberately no `City` or `District` model.** Do not create one |
| **UI locale** (`/en` or `/ar`) — chrome, labels, errors, emails | ≠ | **Content language** — what the agent actually authored. An Arabic-locale user viewing an English-only listing sees **English content in Arabic chrome**. Content is **never machine-translated** for display |
| **Tool calling** — the model picks tools; the call graph is predictable from the question | ≠ | **Agent** — the next action depends on what came back. Test: *can you draw the call graph before seeing results?* Yes ⇒ tool calling |
| **Live offer** — a *defined subset* of four states: `PENDING_AGENT`, `PENDING_BUYER`, `ACCEPTED`, `RESERVED` | ≠ | An offer status. "Live" is **not** a value in the enum. Invariant I12 and rule O1 both depend on this exact set — see `product/BUSINESS_RULES.md` §4.1 |

---

## 2. Actors and identity

**`user`** — **Better Auth's table, extended by Settly via `additionalFields`. The canonical FK root
for the entire application.** There is no parallel Settly `User` or `UserProfile`: `role` and
`banned` must live here because the admin plugin's ban check runs inside session validation, which is
what makes suspension immediate.

**`account`** — Better Auth. **Holds the password hash** for credential auth, plus future OAuth links.
Required even with no OAuth provider.

**`verification`** — Better Auth. Email-verification and password-reset tokens. **Replaces the
previously proposed `AuthToken`, which no longer exists.**

**`preferredLocale`** — Settly `additionalField` on `user`. Required by the notification architecture:
a worker rendering an email or push has no cookie and no request context, so the recipient's locale
must be persisted.

**Buyer** — a `User` acting in the buyer role: discovers, saves, requests viewings, makes offers,
pays deposits. The default role. Not a separate model.

**Agent** — a `User` with an `AgentProfile`. Manages listings and a pipeline.

**`AgentProfile`** — 1:1 extension of `User` holding licence details, bio, verification state, and
brokerage name as **free text**. Brokerage is deliberately *not* an entity — there is **no agency
or organization model**.

**Verified agent** — an agent whose credentials an admin has approved. **Only verified agents may
publish listings.** Unverified agents may create drafts.

**Admin** — a `User` with platform privileges: moderation, verification, report triage, suspension,
audit access. Admin operations live in the module that owns the data; there is **no admin module**.

**Actor** — the authenticated identity a request or tool call executes as. **AI tools and the agent
always execute as the user, never as a service account.** Captured at agent-run start and
immutable for the run.

**Role** — `USER` | `AGENT` | `ADMIN`. **Business data owned by Settly**, enforced by service-layer
policy functions. *Not* Better Auth's access-control DSL.

**`session`** — Better Auth. A live authenticated session, one row per device. Revocable immediately —
which is why Better Auth's cookie cache is disabled.

---

## 3. Catalog

**`Property`** — a listing. Owns status, price, geo point, type, listing intent, specs, **parallel
bilingual content** (`titleEn`/`descriptionEn`/`titleAr`/`descriptionAr`, at least one pair required),
**two generated search vectors**, and **the embedding column**. **No `language` field** — it would
contradict itself on a bilingual listing. **No `PropertyTranslation` model** — see §11.

**Listing intent** — `SALE` or `RENT`. **Rent listings support discovery, viewings and inquiries
but never offers or payments.** Enforced as a guard in the offer service.

**`Area`** — see §1. **Identity and geography only**: `nameEn`, `nameAr`, **`aliases[]`**, slug, parent,
level, boundary geometry, centroid. A listing resolves to exactly one `Area` node; ancestors are
reachable through the hierarchy.

⚠️ **`Area` does NOT carry guide content.** Long-form area guides, FAQs and market notes live in
**`KnowledgeArticle`**, linked by `areaId`. `Area` is touched by every search filter and must stay
narrow. (#3 described this content twice; #39 separated it.)

**`Area.aliases`** — a text array powering the bilingual gazetteer: `New Cairo`, `5th Settlement`,
`التجمع`, `التجمع الخامس` all resolve to one area. **There is no `AreaAlias` model.**

**`Amenity`** — controlled vocabulary (pool, parking, security) with `nameEn` and `nameAr`. Reference
data, admin-editable. Feeds both filters and the embedding composition.

**`PropertyPriceHistory`** — append-only price changes. Powers price-drop alerts and market
insights, which would otherwise require scanning the audit log.

**Structural fields** — address/geo, property type, area, images, title. Editing these on a
published listing triggers **blocking re-review**.

**Content fields** — price, description, amenities, availability. Editing these keeps the listing
live and raises a **non-blocking recheck flag**.

**Slug** — the human-readable SEO identifier in public property URLs. Distinct from the UUIDv7 id.

---

## 4. Engagement

**`Collection`** — a named shortlist. A system-created default collection replaces a separate
`Favorite` model.

**`SavedSearch`** — a persisted filter set with an alert cadence.

**`SavedSearchMatch`** — the dedupe ledger: one row per (saved search, property) already notified.
**The unique constraint here is the entire anti-spam mechanism.**

---

## 5. Pipeline and transactions

**`Lead`** — see §1.

**`AgentAvailability`** — recurring weekly availability windows and blackouts, stored as
**local wall-clock** (day of week, local start, local end, timezone) and resolved to UTC instants
per date. Storing instants would break twice a year at DST.

**`Viewing`** — a booked appointment with a start and end instant. **Exclusivity attaches at
`CONFIRMED`, not `REQUESTED`** — many buyers may request the same slot; only one confirmation can
survive, enforced by an exclusion constraint over a time range.

**`Offer`** / **`OfferRevision`** — see §1.

**Superseded** — an offer closed automatically because a rival offer reached `RESERVED`, or the
property sold offline. No fault, distinct from rejection.

---

## 6. Money

**`Payment`** / **`PaymentAttempt`** — see §1.

**Deposit** — the reservation deposit against an accepted offer. **5% of property price, capped at
50,000 EGP.** The **only** payment type in v1.

**Commitment point** — **the paid, confirmed deposit.** Offer acceptance is *not* commitment;
multiple accepted offers may race to fund.

**Checkout hold** — see §1. 15 minutes, granted **only to synchronous payment methods**.

**Reservation** — see §1. Property `RESERVED`, offer `RESERVED`, rivals superseded.

**`Refund`** — a full or partial reversal. States: `REQUESTED → PROCESSING → SUCCEEDED | FAILED`.
A failed refund raises an admin alert; **money never silently disappears.**

**Void vs refund** — void reverses before settlement (usually no fee); refund reverses after
(fee usually not returned). One `reverse()` operation chooses by settlement window.

**`WebhookEvent`** — an inbound provider event, stored raw with its verification outcome.
**Unique on provider event id — this is the duplicate-delivery defence.** *Inbound from the
provider.*

**`IdempotencyKey`** — a client-supplied key on a state-changing request, with the stored response.
*Inbound from our own client.* **Different concern from `WebhookEvent`.** Lives in Postgres, never
Redis.

**Piastres** — EGP minor units. **All money is stored as `BIGINT` piastres.** Never floats.
Paymob also transacts in minor units, so no conversion layer exists.

**Gross / fee / net** — modelled explicitly on `Payment`, with `fee_returned` on `Refund`. A "full
refund" still costs Settly the processing fee.

**Reconciliation** — the scheduled job that polls the provider for payments stuck in `PROCESSING`.
**This is what makes webhooks a latency optimization rather than a correctness dependency.**

---

## 7. Search and retrieval

**Structured search** — SQL predicates. **All hard constraints — price, bedrooms, area, status —
are structured, always.** Never the vector arm.

**Geographic search** — PostGIS: radius, bounding box, polygon containment, nearest-neighbour.

**Lexical search** — Postgres FTS (`english` or `simple` per row language, trigger-maintained) plus
`pg_trgm` trigram similarity for typo tolerance.

**Semantic search** — pgvector cosine similarity over property embeddings.

**Hybrid search** — all four arms combined by RRF. Used **only** on the natural-language path.

**RRF (Reciprocal Rank Fusion)** — rank-based fusion, `1/(k + rank)` summed across arms, k ≈ 60.
Rank-based rather than score-based because `ts_rank` and cosine distance are incomparable scales.

**Query understanding** — deterministic extraction first, LLM **only** on residual intent text,
output validated against real `Area` and `Amenity` rows. **The model proposes; the backend
disposes.**

**Residual intent text** — what remains after hard constraints are extracted. The **only** thing
the vector arm ever sees.

**Selectivity switch** — under ~1,000 candidates use exact distance; above, HNSW with iterative
scan. Do not approximate what you can compute exactly.

**Embedding** — a normalized vector. **Target 1,536 dimensions** *(PENDING VERIFICATION — see
DECISIONS.md V1/V2)*. One per property, stored as a **column on `Property`**.

**`Embedding` (the model)** — the table holding **chunk** vectors for documents and knowledge
articles. One vector per row ⇒ column; many per source ⇒ table.

**Chunk** — a ~500-token segment of a document or article with ~15% overlap, carrying a contextual
provenance prefix and metadata including **visibility scope**.

**`SearchEvent`** — captured search telemetry including the **zero-result flag**. Captured in v1;
no dashboard built.

---

## 8. AI

**RAG** — retrieval-augmented generation over **trusted unstructured knowledge only**: area guides,
FAQs, approved documents, help content. **Property facts come from tools, never from RAG** —
documents go stale and can contradict the database.

**Tool** — a backend function the model may invoke. Eight read tools plus **one** write tool,
`createViewingRequest`. Tools run through the same service and policy layer as any controller.

**Confirm-before-write** — the model *proposes* a state change; a human commits it. Half the
prompt-injection defence.

**Router** — decides the path: simple question ⇒ RAG; single lookup ⇒ tool calling;
multi-constraint adaptive discovery goal ⇒ agent. **The agent is never the default path.**

**Property Shortlist Agent** — Settly's one agent. **Read-only during the run.** Bounded by 8
steps, 60 seconds, token budget, cost budget and a no-progress detector.

**`AgentRun`** — the persisted record of one agent execution: goal, actor, status, budgets
consumed, scratchpad, step trace as JSONB, result.

**Typed scratchpad** — the agent's working state: candidates, rejected with reasons, enriched,
relaxations, notes. **Not a message transcript** — which is what keeps context flat and makes runs
assertable in tests.

**Closed action enum** — the planner selects from a fixed set (`SEARCH`, `RELAX`, `ENRICH`,
`CHECK_AVAIL`, `RETRIEVE_AREA`, `FINALIZE`) with typed arguments. It cannot invent an action.

**No-progress detection** — a step that does not change the scratchpad costs double; two
consecutive no-ops end the run.

**Capability containment** — the model can do nothing the user could not do themselves. The primary
injection defence: the worst outcome of a successful injection is a bad answer, not privilege
escalation.

**Abstention** — answering "I don't have information on that" when retrieval is weak. **A success
state, not a failure.**

---

## 9. Cross-cutting

**`AuditLog`** — immutable record of who did what to what. Written for every property, offer,
payment and refund transition, every moderation action, and Better Auth security events.

**Policy function** — a pure resource-level authorization check (`canViewOffer(actor, offer)`) in
the service layer. **Not HTTP middleware** — which is why AI tools inherit authorization
structurally.

**Sweeper** — a scheduled job that re-drives work from a durable status column. **Each table is its
own outbox**; there is no generic outbox model.

**Conditional update** — `UPDATE … WHERE id = ? AND status = ?`. Zero rows affected means the
transition was lost. **Status is the version** — this is Settly's optimistic concurrency, free from
the state machines.

**Degraded** — a response served with a reduced arm or feature (e.g. semantic search unavailable),
flagged to the client. **The smart part failing must never fail the whole request.**

**LOCKED / PROVISIONAL / PENDING VERIFICATION** — see `README.md` §2. **Pending items must never be
implemented as final.**

---

## 10. Security and operations

**`emailVerified`** — a **business guard**, not a middleware rule. Because it lives in the service
layer, AI tools inherit it automatically. Which transitions require it is determined by the
**verification boundary**, not by a memorised list.

**Verification boundary** — the reusable principle governing where `emailVerified` applies:

> **Email verification is required for any buyer transition that creates or advances a financial
> obligation or a scheduled commitment. It is never required to withdraw, cancel, or read.**

Currently: **V1, O1, O3, O5, Y2** guarded. Withdrawal, cancellation, browsing, search, favourites
and saved searches are not. **Exit is never blocked** — a verification requirement must not become
a state a user cannot escape. New transitions are evaluated against the principle directly. See
`product/BUSINESS_RULES.md` §9.1.

**Capability token** — a single-use, high-entropy token that *is* the authorization, as in an email
verification or password-reset link. The exception to the no-state-changing-GET rule: CSRF is
impossible when the attacker cannot forge the credential.

**Ambient session authority** — authorization derived from a cookie the browser attaches
automatically. **No state-changing GET may rely on it.** This is the rule capability tokens are
exempt from.

**Thin event** — an SSE payload carrying only `{ type, entityId }`. The client refetches
authoritative state through the normal API. Events are **signals, not data carriers** — which is why
there is no replay buffer, no backpressure problem, and no authorization logic duplicated into the
stream.

**Tier A / B / C** — the rate-limiting classes. **A** is sensitive (login, reset, verification,
payment operations) and falls back to Postgres-backed counters when Redis is down, after an
in-memory check. **B** is authenticated writes, bounded primarily by business invariants. **C** is
public reads and may fail open.

**Global AI spend cap** — a **Postgres-backed** daily ceiling on AI cost. Postgres, not Redis,
because it is the one limit that must **fail closed** during a degradation.

**Substitution rule** — *substitute where the security or behavioural control belongs to Settly; use
the real external service where the service itself owns a behaviour we need to exercise.* Cloudinary
is real locally because EXIF stripping is theirs; Supabase Storage may be substituted because
magic-byte verification, authorization and audit are ours.

**Mailpit** — the local email sink. **No transactional email provider is required for local
development.** The production provider (Resend, provisional) is a deployment concern.

**Circuit state** — the last observed outcome of a call to an external provider, reported by
`/health/detail`. **We never actively probe paid providers** — a health check that calls Gemini
spends money and consumes quota.

**Ops surface** — the small application-level home for `/health`, `/ready` and `/health/detail`.
These own no domain data, so they belong to no module — consistent with there being no admin module.

**Environment-driven configuration** — every difference between local and production is a
configuration value. **Never an `if (isProduction)` branch around a security control.**

---

## 11. Multilingual architecture

**Five concepts, deliberately independent** — never force any two to be the same:

```
  UI LOCALE  ⊥  CONTENT LANGUAGE  ⊥  QUERY LANGUAGE  ⊥  AI RESPONSE LANG.  ⊥  EMBEDDING SPACE
```

**Parallel language columns** — `titleEn` / `descriptionEn` / `titleAr` / `descriptionAr` on
`Property` and `KnowledgeArticle`, all nullable, **at least one pair required**. Content may be
Arabic-only, English-only, **or both** — and both are source of truth.

> ⚠️ **`PropertyTranslation` was explicitly evaluated and rejected** (#39). It would place a join in
> the hottest query in the product, permanently, and split content from the vector that #6 pins to
> the `Property` row. **Do not reintroduce it because the pattern is familiar.**

**Display rule** — prefer the UI locale's variant → fall back to the other → **label the fallback**
(*"This listing is in English"*). Offer a toggle when both exist.

**Two search vectors** — `searchVectorEn` (`english`) and `searchVectorAr` (`simple` + Arabic
normalisation), both **GENERATED columns** because each config is fixed. **Query both and take the
better rank**: Egyptian users code-switch within a single query (`شقة 3 غرف في New Cairo`), so a
single vector would silently discard half of it.

**Arabic normalisation** — deterministic, applied identically to indexed text and to the query: alef
unification (`أ إ آ → ا`), yeh (`ى → ي`), teh marbuta (`ة → ه`), tatweel and diacritic stripping, and
**stripping the leading `ال`**. Postgres ships no Arabic stemmer, so without this `الشقة` cannot
match `شقة`.

**Cross-language retrieval is the semantic arm's job.** Lexical search is same-language only, by
design. All four directions (AR→AR, EN→EN, AR→EN, EN→AR) are carried by the multilingual embedding
model — which is why **V23** is the highest-stakes verification item in the project.

**~~Canonical English description~~** — **removed (#39 reverses #15).** A multilingual model makes
language normalisation before embedding self-defeating, and canonicalisation put an LLM call in the
publish path where hallucination would silently affect ranking. **Do not reintroduce it.**

**One embedding per Property** — composed from whichever content exists plus structured attributes.
Never one per language: equivalent AR and EN text produces near-identical vectors, so storing both
means retrieving the same property twice.

**Language metadata belongs only where it carries information:** `Document` (detected), `Embedding`
(chunk), `AiMessage` (detected), `SearchEvent` (zero-result rate per language is a product signal).
**Not** on `Property`, `KnowledgeArticle`, `Area`, `Amenity`, `Message` or `Notification`.

**RTL is first-class** — `dir` on `<html>` from the locale, **logical CSS properties throughout**,
mirrored directional icons, reversed table and form order. **`dir="auto"` on user content still
applies, in both directions**: English content inside an RTL page needs LTR rendering, and vice versa.

**No `Translation` model** for UI strings — static message catalogs versioned with code.
**No `NotificationTemplate`** — `Notification` stores a `type` + `params` JSON and renders at display
time, so switching locale re-renders existing notifications.


---

## 12. API contract

**Bare resource** — a single-resource response returns the resource itself, with no wrapper. There is
**no universal `{ data, meta }` envelope**: `openapi-fetch` already returns `{ data, error }` at the
transport layer, so an envelope would mean `result.data?.data.title` on every call site.

**`items` / `pageInfo`** — the collection wrapper. The key is `items`, not `data`, specifically so it
cannot collide with the transport layer's `data`.

**Action endpoint** — an explicit `POST` for one state-machine transition: `POST /offers/:id/accept`,
`POST /properties/:id/publish`. ⚠️ **State is never mutated through `PATCH /resource/:id { status }`** —
that invites arbitrary state-setting and makes authorization per-field. Each action carries its own
guard, schema, side effects, idempotency and concurrency behaviour. **The endpoint list mirrors the
transition tables in `product/BUSINESS_RULES.md` §2-§5.**

**Opaque cursor** — base64url, version-prefixed, encoding sort key + `id` tiebreaker + sort token.
**Never filters, never authorization.** Opaque so the internal keyset can change without breaking the
contract. A request whose `sort` differs from the cursor's is rejected with 400 — changing sort
mid-pagination silently produces duplicates and gaps.

**Total ordering** — every cursor-paginated query sorts on a column **plus `id`**. Without a
tiebreaker, rows are skipped and repeated.

**`search-context-expired`** — `410 Gone` when a hybrid-search cursor outlives the cached ranked list
(#26, ~5 min). A distinct status lets the client silently re-run the search; restarting at page 1
instead produces an **infinite scroll loop**.

**Error `type`** — the RFC 9457 member, and **the** application error code. A relative URI
(`/errors/email-not-verified`). **There is no second `code` field.** Relative because absolute URIs
would embed a domain into the wire contract that isn't yet established.

**Language-neutral backend** — `title` and `detail` are developer-facing English, logged, never
rendered. The frontend localizes from `type` + `params` + `errors[].code` + `errors[].params`.
**Validation errors carry codes and parameters, never messages.** With `/en` and `/ar` both live,
user-facing English crossing the wire is a defect.

**`state-conflict`** — one error type covering ~40 transitions, carrying
`params: { entity, currentState, attemptedTransition }`. The alternative was forty types.

**The 404/403 rule** — **404 when the actor may not know the resource exists; 403 when they may know
it exists but may not act.** A "doesn't exist" 404 and a "not yours" 404 must be byte-identical and
must not differ meaningfully in latency.

**`Idempotent-Replay: true`** — response header marking a replayed idempotent request. Without it a
replay is indistinguishable from a fresh success, which makes idempotency untestable end to end.

**`/me`** — self-scoped collections (`/me/favorites`, `/me/offers`). Not `/users/:id/...` — **there is
no id to tamper with, so the IDOR surface is removed structurally.**

**Search projections** — `GET /search/properties` returns entities; `GET /search/properties/clusters`
returns aggregates. **Two HTTP projections of ONE search service** (#14). ⚠️ The clusters endpoint
must not duplicate search business logic.

---

## 13. Testing, privacy and retention

**Test layers** — six, with hard boundaries (#41). **Unit** (pure functions, no I/O) · **Service**
(all business rules, real Postgres, faked adapters) · **Database** (raw SQL, constraints, extensions,
migrations) · **Concurrency** (races, serial, no wrapping transaction) · **API/contract** (HTTP shapes
only) · **E2E** (~12 journeys).

> ⚠️ **Business logic is tested at the SERVICE layer, not through HTTP** — authorization lives in
> services (#8), so HTTP tests would exercise the wrong boundary.

**Layer 4 (Concurrency)** — separate because concurrent transactions **cannot run inside a wrapping
transaction**. Truncate isolation, serial execution, **never retried**. A flaky concurrency test is a
finding, not a nuisance.

**Gate vs report** — a **gate** blocks the build (layers 1-5, OpenAPI drift, migrations, lint,
gitleaks). A **report** informs (retrieval evaluation, agent eval, snapshot skew). **Evaluation of a
non-deterministic system never gates a deterministic pipeline** — a gate that fails intermittently is
one people learn to bypass.

**Anonymisation** — the deletion mechanism for `user`, and **the only entity that is anonymised**.
PII overwritten in place, email replaced with a unique non-routable placeholder, credentials and
sessions deleted, `banned = true`, `anonymizedAt` set. **Never a row delete** — financial and audit
records must survive.

**Retention-locked** — data that cannot be deleted by any application path: payments, payment
attempts, refunds, offers, viewings, `AuditLog`, and the `WebhookEvent` id.

**Embedding drift** — an `Embedding` row whose `visibilityScope` no longer matches its source.
⚠️ **Scope changes and deletions update `Embedding` rows in the same transaction**; the sweeper's
drift count must be **zero**, and a non-zero count is a **security incident**, not a data-quality
warning. Without this, a document downgraded from `PARTY` to `PRIVATE` stays retrievable through RAG.

**AuditLog metadata rule** — ids and enums only, **never PII**. The table is immutable (#33), so
anything written there is permanent and **anonymisation cannot reach it**.

**AI data-access surface** — **exactly the tool allowlist plus the RAG corpus, executed as the user.
There is no other path.** Never reachable by AI: messages, payments, refunds, offers, `AuditLog`,
admin data, or any other user's data.

**Backups are recovery, not deletion** — deleted data persists until backup expiry. ⚠️ **A restore
must not resurrect access**: the runbook re-applies anonymisation and re-runs the drift sweeper.
