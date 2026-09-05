# Search Architecture

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #14, #15, #24, #26, #27, #39, #40
    Related:      DATABASE.md, AI.md, API.md Section 9, ../process/SEED_DATA.md

## 1. Purpose

The complete search system: three execution paths, one service, two HTTP projections, bilingual
retrieval, and the evaluation gate that governs its quality.

## 2. Three execution paths, one endpoint's worth of logic

| Path | Composition | Share of traffic |
|---|---|---|
| Filter search | Structured SQL + PostGIS. No vector, no LLM | ~70% |
| Map viewport | PostGIS + server-side clustering | High frequency |
| Natural language | Query understanding → 4 arms → RRF fusion | ~25% |

**Hard constraints (price, bedrooms, area, status) are ALWAYS structured filters, never the
vector arm.** Embeddings encode "affordable" as a fuzzy direction, not an inequality.

## 3. HTTP projections (Decision #40 refines #14 — does not reverse it)

```
  GET /search/properties            entities
  GET /search/properties/clusters   aggregates (map, low zoom)
```

Two endpoints exist because clusters (`{lat,lng,count}`) are a different *kind* of thing from a
property — not a second search architecture. The clusters endpoint reuses the same filters and
authorization; **it must never duplicate search business logic.**

## 4. Query understanding

```
  Deterministic extraction (price/bedroom patterns, Area gazetteer incl. aliases, amenity synonyms)
        │  ~2ms, no network — handles most queries fully
        ▼  residual intent text only
  LLM extraction (Gemini) — constrained JSON schema, Zod-validated
        │
        ▼
  VALIDATE against real Area/Amenity rows — invented values dropped
        │
        ▼
  Residual intent text → the vector arm ONLY
```

**The model proposes, the backend disposes** — no filter value can be invented. Parsed filters
are returned as **removable chips** (`{kind, value}` — machine values, frontend renders wording).
Parses are cached.

## 5. The four arms and fusion

| Arm | Technology | When |
|---|---|---|
| Structured | SQL predicates | Always |
| Geographic | PostGIS (`ST_DWithin`, bbox, KNN) | Point/bounds present |
| Lexical | Two generated tsvectors (`searchVectorEn`/`Ar`) + `pg_trgm` | Free text present |
| Semantic | pgvector, one multilingual embedding column | Residual intent text present |

**Selectivity switch:** under ~1000 candidates, exact distance (no index); above, HNSW iterative
scan. Don't approximate what you can compute exactly.

**Fusion: Reciprocal Rank Fusion**, k≈60 — rank-based because `ts_rank` and cosine distance are
incomparable scales. Business boosts (freshness, completeness, agent responsiveness) applied
after, additively, **capped** so they reorder near-equivalents but never surface an irrelevant
result above a relevant one.

## 6. Bilingual retrieval (Decision #39 — supersedes the earlier canonical-English design)

**No canonical English text.** Cross-language retrieval (AR→EN, EN→AR) is carried **entirely by
the multilingual embedding model** — this is the highest-stakes dependency in the system (V23).
Same-language lexical matching uses the matching generated tsvector; **both vectors are queried
on every text search** because Egyptian users code-switch mid-query (`شقة 3 غرف في New Cairo`).

Arabic normalisation (alef unification, yeh, teh marbuta, tatweel/diacritic strip, leading `ال`
strip) is applied identically to indexed text and the query — quality is **V24**, gated against
the evaluation thresholds below.

## 7. Embedding composition

One vector per `Property`, a column, partial HNSW `WHERE status='PUBLISHED'`. Composed from
whichever authored language content exists (both when both present) plus structured attributes
(type, bedrooms as words, area name, amenity names). **Excluded**: price numerals, coordinates,
agent identity, the full area guide (would homogenise same-area listings).

## 8. Map clustering and result reuse

Server-side clustering at low zoom (PostGIS grid snap, centroid + count). **The semantic result
set is computed once per text query and cached** — subsequent pans/zooms filter that cached set
geometrically, never re-running the LLM parse or vector search.

## 9. Pagination

Filter search: keyset/cursor, stable `(sortColumn, id)`. Hybrid search: top-500 materialized once,
cached in **Redis** (~5 min TTL — the one approved Redis cache, Decision #26), paginated within
it. Past 500, prompt refinement rather than deepening. Expired context → `410` (API.md Section 7).

## 10. Retrieval evaluation gate (Decision #27, thresholds locked in #32)

| Metric | Threshold |
|---|---|
| Recall@10, same-language (EN→EN, AR→AR) | >= 0.80 |
| Recall@10, cross-language (EN→AR, AR→EN) | >= 0.65 |
| Zero-result rate | <= 10% |
| Relevant result in top 3 | >= 0.70 |

**Pre-committed, not tuned after seeing results.** If cross-language Recall@10 falls below ~0.50,
the bilingual semantic-search assumption is materially unsuccessful and the embedding decision
(#24) must be revisited. Runs as a CI **report**, never a gate (#41) — evaluated against the
seed corpus, never against production traffic directly.

## 11. Degradation

Every arm is optional except structured. Vector arm fails → structured + lexical, flagged
`degraded: true`. LLM parse fails → deterministic parse + full-text over the whole string.
Lexical fails → semantic + structured continue.

## 12. SEO vs. interactive search — a deliberate separation

`/[locale]/properties` (interactive, SSR, `noindex` when filtered) is a tool, not a landing page.
Organic discovery comes from curated ISR facet pages (`/[locale]/properties/[facet]`) — a finite,
indexed set. See `FRONTEND.md`.

## 13. Never exposed through the public contract

Arm timings, RRF scores, ranking internals — those go to `SearchEvent` and logs, not the response.

## 14. Pending verification

**V23** (Gemini AR<->EN cross-lingual retrieval quality — the highest-stakes item in the project)
· **V24** (Arabic normalisation quality) · V1/V2 (embedding dimensions, pgvector limits).

## 15. Rejected / do not add

A second search architecture for clusters · canonical English text (reversed, #39) · a dedicated
reranker in v1 (#24) · weighted score fusion · client-side clustering · per-pan vector search ·
generic filter DSL.

## 16. Related documents

`AI.md` for the embedding model and provider · `../process/SEED_DATA.md` for the evaluation
corpus and hard cases · `DATABASE.md` for the underlying indexes.
