# AI Architecture

    Status:       LOCKED · provider evaluation items PENDING
    Last Updated: 2026-09-05
    Derived From: Decisions #17, #24, #33, #39, #42
    Related:      RAG.md, AGENT.md, SEARCH.md, ../product/BUSINESS_RULES.md Section 9

## 1. Purpose

The LLM/embedding provider, orchestration boundary, tool-calling security model, and cost
controls. AI is strictly additive in Settly — nothing in the transactional core depends on it.

## 2. Provider

**Google Gemini** — LLM generation, structured output, tool calling, streaming, **and embeddings**
(one vendor, reduced integration surface). Two-tier model strategy: a small/fast model for query
parsing (<400ms budget), a mid-tier model for the assistant. The saving is modest at this scale
(#33) — the architecture stays model-per-task configurable rather than optimized.

**Embeddings**: **`gemini-embedding-001`** (**VERIFIED V1**; `text-embedding-004` is deprecated/404).
Native dimensions: **3072**. Truncated to **1536 dimensions** via Matryoshka Representation Learning
(`outputDimensionality: 1536`), with **mandatory manual $L_2$ re-normalization after truncation**
(empirically verified: truncated vector norm is ~0.701, not unit length). 1536 dimensions fits comfortably
under pgvector's 2,000-dimension HNSW ceiling (`vector(1536)`). Pricing: \$0.15 / 1M input tokens.

## 3. Orchestration — Vercel AI SDK as the port, nothing more

The AI SDK is the provider abstraction — swapping models is a config change. **No second generic
`AiProvider` wrapper** was built on top of it (rejected as duplication, #24). A narrow
Settly-owned embedding service handles domain concerns only: property/chunk embedding
construction, model/version metadata, dimension validation, normalization, retry.

LangChain and LangGraph are rejected — see `AGENT.md` for the specific reasoning on LangGraph.

## 4. Model boundary — the LLM never touches the database

```
  LLM proposes a tool call
        → registry: is this tool allowed for THIS ROLE?
        → Zod validation of arguments (closed schema, no free-form filters)
        → the SAME service function a controller would call
        → policy check, actor = the USER
        → transaction/idempotency/concurrency — identical rules to any endpoint
        → result serialized back to the model
```

Tools: 8 read + exactly 1 write (`createViewingRequest`). **Write tools require explicit user
confirmation** — the model proposes, a human commits. Max ~5 tool iterations per turn.

## 5. Language behaviour

Detect language per message; `preferredLocale`/UI locale is a **tiebreaker only**; respond in the
detected language; **no conversation-level language state** — code-switching mid-conversation is
common and a locked language would be wrong within three messages. An Arabic query legitimately
retrieves English sources and the assistant answers in Arabic citing them — correct, not a bug.

## 6. Cost and quota controls

AI is the **only unbounded cost** in the system. Per-user rate limits are mandatory:
~30 assistant messages/day, ~10 agent runs/day, plus a **Postgres-backed global daily spend cap**
(#42 — must be Postgres, not Redis, so it fails *closed* during a Redis outage). Prompt caching
for the stable system prompt and tool definitions. Streaming for perceived latency.

## 7. The AI data-access boundary (Decision #42)

> **The AI's data-access surface is exactly the tool allowlist plus the RAG corpus, executed as
> the user. There is no other path.**

| May reach Gemini | Never |
|---|---|
| Public property content, published KnowledgeArticle | Messages, payments, refunds, offers |
| Document chunks passing the actor's visibility filter | AuditLog, admin data |
| The user's own favourites/viewings/preferences via tools | Any other user's data |
| The user's message text | Emails, phone numbers, session tokens |

Outbound payloads are minimised. **Training**: the paid Gemini tier must be in use before any real
user content reaches a prompt (synthetic seed data has no such constraint) — V9.

## 8. Prompt injection defence — architecture, not prompt text

The attack surface is agent-written property descriptions fed into embeddings/RAG. Defence is
**capability containment** (the model can do nothing the user couldn't) plus **no
outward-transmitting tool** — no email/HTTP/messaging tool in v1, so even a fully successful
injection has nowhere to send anything. Prompt framing (delimited untrusted content) is secondary.

## 9. Failure behaviour

LLM down → assistant shows a clear error; search falls back to deterministic parsing; listings,
payments, viewings, messaging all unaffected. Embedding provider down → new content not yet
searchable, existing corpus unaffected, backlog drains on recovery.

## 10. Relationship to the Agent

The bounded tool-calling loop (this document) handles single-to-few-step requests. The **Property
Shortlist Agent** (`AGENT.md`) is the one case requiring multi-step adaptive planning. A router
decides which path a request takes — see `AGENT.md` Section on the router.

## 11. Pending verification

**V1** (Gemini embedding model/dimensions) · **V2** (pgvector/halfvec limits) · **V9** (Gemini
data-use terms) · **V23** (AR<->EN retrieval quality — see SEARCH.md) · V28 (Zod→OpenAPI for
structured output/streaming). None verified — do not implement as final.

## 12. Rejected / do not add

LangChain, LangGraph (see AGENT.md) · a generic `AiProvider` abstraction duplicating the AI SDK ·
a dedicated reranker in v1 (#24) · RAG-ing property facts (they come from tools) · an
outward-transmitting tool · an autonomous or multi-agent system.

## 13. Related documents

`RAG.md` for retrieval and grounding · `AGENT.md` for the bounded agent · `SEARCH.md` for the
query-understanding/embedding pipeline shared with search.
