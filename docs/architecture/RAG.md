# RAG Architecture

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #17, #24, #39, #42
    Related:      AI.md, SEARCH.md, STORAGE.md, ../process/SEED_DATA.md

## 1. Purpose

The trusted-knowledge retrieval pipeline, its authorization boundary, and the embedding lifecycle
that keeps it safe as documents change.

## 2. Corpus scope — the decision that prevents the most common RAG mistake

> **Property facts (price, bedrooms, status, availability) come from tools, never from RAG.**
> Documents go stale and can contradict the live database.

The corpus is **only**: area guides, FAQs, help content (`KnowledgeArticle`), and approved
property documents (`Document`) within the actor's visibility scope.

## 3. Ingestion pipeline

```
  Upload → storage → extract text → clean/normalize → detect language
        → chunk (structure-aware, ~500 tokens, ~15% overlap, TOKEN-based not character-based —
                  Arabic is markedly more token-dense)
        → contextual prefix ("From the New Cairo area guide, section: Schools")
        → metadata (source, title, section, language, visibility scope, model version)
        → embed → store → mark READY
```

Every stage writes a durable status on `Document`; a sweeper re-drives failures. Known gap: no
OCR — scanned/image-only PDFs unsupported in v1.

`KnowledgeArticle` uses the same parallel-language pattern as `Property` (titleEn/Ar, bodyEn/Ar).
**In V1 the RAG corpus and all RAG answers are English only (#99)**; only English content is chunked
and embedded. The Arabic columns stay for future compatibility but are optional and unused in V1;
no Arabic content is required (#101). Arabic RAG retrieval is deferred.

## 4. Retrieval

```
  Question → detect language → embed (multilingual, shared space)
        → hybrid retrieve top ~20
        → ⚠️ VISIBILITY FILTER, applied IN-QUERY, for THIS actor    ← SECURITY, never post-filtered
        → optional language filter (relevance, not security — usually not applied)
        → relevance floor → abstain if nothing survives
```

**No dedicated reranker in v1** (Decision #24 — the Cohere Rerank recommendation was removed with
the Gemini switch; Vertex AI Ranking and external rerankers rejected). Retrieval is structured +
lexical + semantic + RRF + relevance floor + abstention. LLM-as-reranker is a future experiment,
gated on evaluation evidence showing a real quality problem.

## 5. Visibility scopes (Decision #12/#39)

| Scope | Retrieve | Download | In RAG |
|---|---|---|---|
| `PUBLIC` | Anyone who can view the property | Same | Every actor |
| `PARTY` | Owning agent + buyer with a **live offer** | Same, audited | Those actors only |
| `PRIVATE` | Uploader only | Uploader; admin via audited path | Uploader only |

Admin access is an **audited path, never a scope** — documents never enter an admin's RAG
context.

## 6. Embedding lifecycle (Decision #42)

> **A change to a document's `visibilityScope`, or its deletion, updates or deletes its
> `Embedding` rows in the SAME transaction.**

`Embedding` carries `visibilityScope` **denormalised** so the security filter is a predicate on
the chunk, never a join — the same reasoning that put the property vector on `Property` (avoiding
the filtered-ANN problem). Without this rule, a document downgraded from `PARTY` to `PRIVATE`
would remain retrievable by the former counterparty. A **drift sweeper** compares
`Embedding.visibilityScope` against its source nightly; **any non-zero drift count is a security
incident, not a data-quality warning.**

Re-embedding: triggered on content change, language addition, or model-version bump. Stale
embeddings from a prior model version are distinguishable via `modelVersion` and migrated
incrementally.

## 7. Grounding and hallucination control

Explicit "answer only from provided context" instruction · delimited, labelled context blocks ·
**citations required**, mechanically validated against the retrieved set (a fabricated citation
is caught, not trusted) · live facts (price, availability) never stated from documents · **"I
don't have information on that" is a success state, not a failure**.

## 8. Failure behaviour

Vector arm fails → structured + lexical continue, response flagged `degraded`. LLM parse fails →
deterministic fallback. Embedding provider down → new documents not yet searchable; existing
corpus and RAG unaffected.

## 9. Pending verification

V1/V2 (embedding model/dimensions, pgvector limits). None verified. V23 and V24 (Arabic) are
deferred by #99.

## 10. Rejected / do not add

RAG-ing property facts · a dedicated reranker in v1 · Vertex AI Ranking · a canonical-English
translation step for RAG content · post-filtering visibility after retrieval.

## 11. Related documents

`AI.md` for the model/provider boundary · `STORAGE.md` for where documents physically live and
how upload authorization works · `../process/SEED_DATA.md` for the trusted-source corpus and
evaluation set.
