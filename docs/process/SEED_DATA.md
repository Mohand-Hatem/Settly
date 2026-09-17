# Seed Data & Retrieval Evaluation

    Status:       LOCKED
    Last Updated: 2026-09-17
    Derived From: Decisions #27, #32, #39, #99
    Related:      ../architecture/SEARCH.md, ../architecture/RAG.md, TESTING.md

## 1. Purpose

The synthetic demo corpus and the pre-committed retrieval evaluation gate — a first-class
deliverable, not demo decoration. Hybrid search, RAG and the Shortlist Agent are all invisible on
a handful of listings.

## 2. Corpus scope

~500-1,000 realistic Egyptian properties across real areas (New Cairo, Sheikh Zayed, Maadi, North
Coast, ...) with plausible prices correlated to area/size, realistic amenities, and **English descriptions** (V1 is
English only, #99). **Arabic fields are left empty — no placeholder Arabic (#101).** Genuinely bilingual descriptions — real Arabic, not translated word salad — are
needed only when the future Arabic phase is built. Real area hierarchy, real
price-per-square-metre bands per area; content is synthetic, structure is real.

Also: 10-20 trusted `KnowledgeArticle` sources for RAG · demo accounts (buyer/agent/admin) with
pre-populated favourites, saved searches, a viewing, an offer mid-negotiation, a completed
payment · a safe demo-reset job so a public demo cannot be permanently vandalised.

## 3. Deliberate hard cases

Near-duplicate listings · a listing whose description contradicts its structured fields · areas
with no `KnowledgeArticle` guide · ambiguous semantic queries. (Arabic-only and mixed-language
listings are deferred with Arabic, #99.) These are what prove hybrid search works rather than merely runs.

## 4. Retrieval evaluation gate — pre-committed thresholds (Decision #32)

| Metric | Threshold | V1 |
|---|---|---|
| Recall@10, EN→EN | >= 0.80 | **Applies** |
| Recall@10, AR→AR | >= 0.80 | Deferred (#99) |
| Recall@10, cross-language (EN→AR, AR→EN) | >= 0.65 | Deferred (#99) |
| Zero-result rate | <= 10% | **Applies** |
| Relevant result in top 3 | >= 0.70 | **Applies** |

**Fixed before the corpus is built; not tuned after seeing results** — "the API returns 200" is not
success. In a future Arabic phase: if cross-language Recall@10 falls below ~0.50, the bilingual
semantic-search assumption is materially unsuccessful and the embedding decision (#24) must be
revisited.

20-30 English benchmark queries in V1: difficult semantic queries and terminology/area synonyms,
each with expected relevant results. Arabic and cross-language queries are added in the future
Arabic phase.

## 5. Script requirements

**Idempotent, resumable, safe to rerun, skips already-completed embedding work, backs off on
Gemini rate limits.** ~4,000 embedding calls at full corpus size will meet free-tier quota limits
— batching and resumability are not optional.

## 6. Separation from tests

**Tests never use this corpus** (`TESTING.md` Section 6) — factories only. The evaluation corpus
is consumed exclusively by the offline retrieval-evaluation report (`TESTING.md` Section 5), run
as a report, never a CI gate.

## 7. Pending verification

V1/V2 (embedding model/dimensions, affecting corpus regeneration cost if changed). V23 and V24
(Arabic retrieval and normalisation) are deferred by #99.

## 8. Rejected / do not add

Treating seed data as optional decoration · testing against production/demo data · tuning
thresholds after seeing results · a live-Gemini requirement for ordinary CI.

## 9. Related documents

`../architecture/SEARCH.md` for what this corpus exercises · `../architecture/RAG.md` for the
knowledge-article half of the corpus · `TESTING.md` for the gate-vs-report distinction.
