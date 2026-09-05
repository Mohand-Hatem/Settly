# Seed Data & Retrieval Evaluation

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #27, #32, #39
    Related:      ../architecture/SEARCH.md, ../architecture/RAG.md, TESTING.md

## 1. Purpose

The synthetic demo corpus and the pre-committed retrieval evaluation gate — a first-class
deliverable, not demo decoration. Hybrid search, RAG and the Shortlist Agent are all invisible on
a handful of listings.

## 2. Corpus scope

~500-1,000 realistic Egyptian properties across real areas (New Cairo, Sheikh Zayed, Maadi, North
Coast, ...) with plausible prices correlated to area/size, realistic amenities, and **genuinely
bilingual descriptions** — the Arabic must be real Arabic, not translated word salad, or the
bilingual design (`FRONTEND.md`, `SEARCH.md`) is untested. Real area hierarchy, real
price-per-square-metre bands per area; content is synthetic, structure is real.

Also: 10-20 trusted `KnowledgeArticle` sources for RAG · demo accounts (buyer/agent/admin) with
pre-populated favourites, saved searches, a viewing, an offer mid-negotiation, a completed
payment · a safe demo-reset job so a public demo cannot be permanently vandalised.

## 3. Deliberate hard cases

Near-duplicate listings · a listing whose description contradicts its structured fields ·
Arabic-only listings · English-only listings · areas with no `KnowledgeArticle` guide · ambiguous
semantic queries. These are what prove hybrid search works rather than merely runs.

## 4. Retrieval evaluation gate — pre-committed thresholds (Decision #32)

| Metric | Threshold |
|---|---|
| Recall@10, same-language (EN→EN, AR→AR) | >= 0.80 |
| Recall@10, cross-language (EN→AR, AR→EN) | >= 0.65 |
| Zero-result rate | <= 10% |
| Relevant result in top 3 | >= 0.70 |

**Fixed before the corpus is built; not tuned after seeing results.** If cross-language Recall@10
falls below ~0.50, the bilingual semantic-search assumption is materially unsuccessful and the
embedding decision (#24) must be revisited — "the API returns 200" is not success.

20-30 benchmark queries: Arabic, English, cross-language, difficult semantic queries,
terminology/area synonyms — each with expected relevant results.

## 5. Script requirements

**Idempotent, resumable, safe to rerun, skips already-completed embedding work, backs off on
Gemini rate limits.** ~4,000 embedding calls at full corpus size will meet free-tier quota limits
— batching and resumability are not optional.

## 6. Separation from tests

**Tests never use this corpus** (`TESTING.md` Section 6) — factories only. The evaluation corpus
is consumed exclusively by the offline retrieval-evaluation report (`TESTING.md` Section 5), run
as a report, never a CI gate.

## 7. Pending verification

**V23** (Gemini AR<->EN retrieval quality — this corpus is what it's measured against) · **V24**
(Arabic normalisation quality) · V1/V2 (embedding model/dimensions, affecting corpus regeneration
cost if changed).

## 8. Rejected / do not add

Treating seed data as optional decoration · testing against production/demo data · tuning
thresholds after seeing results · a live-Gemini requirement for ordinary CI.

## 9. Related documents

`../architecture/SEARCH.md` for what this corpus exercises · `../architecture/RAG.md` for the
knowledge-article half of the corpus · `TESTING.md` for the gate-vs-report distinction.
