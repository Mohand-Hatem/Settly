# Phase 08: Search Intelligence, pgvector & Shortlist AI Agent

> **⚠️ Non-authoritative (Decision #48, 2026-09-17).** V1 order and scope are defined by
> `../process/ROADMAP.md` and `../process/IMPLEMENTATION_PLAN.md`. This file is kept as a screen
> inventory and progress record; where it disagrees with those documents or with
> `../DECISIONS.md`, they win. Its "luxury / escrow" framing is superseded by #45 and #47.


> **Status**: ⬜ Not Started  
> **Milestone**: 4-Arm Hybrid Search Engine & Gemini Shortlist AI Agent  
> **Governing Specifications**: `docs/architecture/SEARCH.md`, `docs/architecture/AGENT.md`, `docs/architecture/RAG.md`  

---

## 1. Phase Goal
Implement 4-arm hybrid search combining structured filters, PostGIS spatial queries, PostgreSQL full-text search (`tsvector`), and pgvector 1536-dimensional embeddings with Reciprocal Rank Fusion (RRF), alongside a bounded Gemini Shortlist AI Agent.

---

## 2. Scope Breakdown

### Backend
- **pgvector Embedding Pipeline**: Generate 1536-dimensional embeddings for properties via Gemini (`gemini-embedding-001`).
- **4-Arm Hybrid Search Engine**:
  - Arm 1: Structured filters (propertyType, price, bedrooms).
  - Arm 2: PostGIS spatial queries (`ST_DWithin`).
  - Arm 3: Lexical FTS via `searchVectorEn` and `searchVectorAr`.
  - Arm 4: Vector cosine similarity via `pgvector` (`<=>`).
  - Reciprocal Rank Fusion (RRF) scoring algorithm.
- **Shortlist AI Agent**:
  - Bounded agent equipped with tools: `search_catalog`, `get_property_specs`, `check_viewing_availability`.
  - Conversational context stored in `AiConversation` and `AiMessage`.

### Frontend
- Floating Settly Assistant chat widget (`settly-assistant-widget.css`).
- Natural language search input and AI recommendation carousel.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **8.1** | pgvector 1536-Dimensional Pipeline | Implement property embedding generation and vector storage | ⬜ Not Started |
| **8.2** | 4-Arm Hybrid Search Engine | Build SQL query combining filters, PostGIS, FTS, and vector RRF | ⬜ Not Started |
| **8.3** | Gemini Shortlist AI Agent & Tools | Implement tool-calling agent with strict grounding | ⬜ Not Started |
| **8.4** | Floating Assistant Chat Widget UI | Integrate widget across public and dashboard layouts | ⬜ Not Started |
