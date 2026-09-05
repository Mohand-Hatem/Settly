# Property Shortlist Agent

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decision #19 (amends the earlier "no agent" position), #41
    Related:      AI.md, ../product/BUSINESS_RULES.md

## 1. Purpose

The one bounded, read-only AI agent in Settly, its safety mechanisms, and why it qualifies as an
agent rather than disguised tool calling.

## 2. Why exactly one agent, and why this one

**The test**: can you draw the complete call graph before seeing any results? If yes, it's tool
calling; if no, it's an agent. The Property Shortlist Agent qualifies on two mechanisms:
**adaptive constraint relaxation** (a thin result set triggers a decision about which constraint
to relax) and **content-dependent shortlisting** (which of 40 results deserve a detail fetch and
an availability check depends on the results themselves). A candidate "Property Research" flow
(get property → get area → retrieve knowledge → analyse) **fails the test** — it's a fixed
pipeline and must be built as an honest chain, never labelled an agent.

**Honest accounting**: the value here is primarily learning value (bounded agent architecture),
not incremental product value over good filters. Recorded, not hidden.

## 3. Architecture

```
  User goal → GOAL PARSER (deterministic extraction, reuses query understanding)
        │
        ▼
  BOUNDED CONTROLLER (hand-written state machine — NOT LangGraph, NOT AI SDK's implicit loop)
        │
        ├─► PLANNER (one model call, CLOSED action enum:
        │     SEARCH | RELAX | ENRICH | CHECK_AVAIL | RETRIEVE_AREA | FINALIZE)
        │
        ├─► TOOL REGISTRY → role allowlist → Zod validation
        │
        ├─► SETTLY SERVICE → policy check, actor = the USER (same path as any endpoint)
        │
        ├─► OBSERVATION REDUCER → raw results → TYPED SCRATCHPAD
        │     (candidates[], rejected[{id,reason}], enriched[], relaxations[], notes[])
        │     — NOT a message transcript. This is what keeps cost bounded and runs testable.
        │
        └─► TERMINATION CHECKS: steps<=8, wallClock<=60s, tokenBudget, costBudget,
              NO-PROGRESS DETECTOR (a step that doesn't change the scratchpad costs double;
              two consecutive no-ops end the run)
        │
        ▼
  SYNTHESIZER → recommendation + reasoning + citations + plan trace
        │
        ▼
  PROPOSALS (e.g. "request a viewing") → HUMAN CONFIRMS → normal write path
        (auth → authz → validation → idempotency/concurrency/transaction → AuditLog)
```

## 4. Why custom orchestration, not LangGraph

LangGraph's strongest feature is checkpointing with mid-run human interrupts — but this agent's
writes happen **after** the run as proposals, never mid-run, so that feature goes unused. At 8
steps with one linear state object, LangGraph's graph model is mostly unused surface. **Writing
the controller by hand is itself the deliverable** — the stated purpose is learning bounded agent
architecture, and a framework would teach the framework instead.

## 5. Tools — 7 read tools, zero write tools

`searchProperties`, `getPropertyDetails`, `compareProperties`, `getAreaInsights`,
`checkViewingAvailability`, `retrieveKnowledge`, `getMyPreferences`. **The loop is entirely
read-only.** No web access — would reintroduce the exfiltration path AI.md Section 8 closes.

## 6. The five safety mechanisms

1. **Read-only loop.** All writes are proposals, confirmed by a human, routed through the normal
   write path. Collapses nearly the entire risk surface — a hijacked plan wastes tokens, it
   cannot book, buy, or change anything
2. **Closed action enum.** The model cannot invent an action
3. **Typed scratchpad**, not a transcript — bounded cost, assertable state
4. **Five independent budget caps** (Section 3)
5. **Actor context captured at run start, immutable** — never re-derived from model output

## 7. `AgentRun`

Persists goal, actor, status, budgets consumed, the scratchpad, a step trace (JSONB), and result.
**No `AgentStep` model, no cross-run memory** — the recommendation system's preference profile
(AI.md) already serves the "remember what the user likes" role.

## 8. Router — the agent is never the default path

```
  Simple factual/knowledge question        → RAG
  Single deterministic lookup               → Tool calling
  Multi-constraint adaptive discovery goal  → Property Shortlist Agent
```

Most AI traffic never reaches the agent — this is what keeps cost and latency sane.

## 9. Streaming and observability

`POST /ai/agent-runs` streams the plan unfolding step by step over SSE — this is the intended UX,
not a fallback. Every step is traced: action, args, latency, tool outcome, scratchpad delta.

## 10. Failure behaviour

Tool failure: transient → one retry (counts against budget); permanent → recorded in the
scratchpad, plan continues degraded (e.g., no availability data, and the agent says so). The
agent must always be able to produce a partial answer. Budget exhaustion → partial result,
labelled as such.

## 11. Testing (Decision #41)

Deterministic controller tests with a scripted planner stub (budget enforcement, no-progress
detection, termination, failure handling — where the risky logic lives) · record/replay against
captured real model outputs · a separate evaluation suite of golden goals, run as a **CI report,
never a gate**.

## 12. Pending verification

V1/V2 (embedding dependency via search tools) · V23 (retrieval quality the agent's tools rely on).

## 13. Rejected / do not add

A second agent · an autonomous/background agent · unrestricted database or tool access · any
write tool · LangGraph · the AI SDK's implicit multi-step loop as the controller · a
"Property Research" flow mislabelled as an agent (build it as a chain).

## 14. Related documents

`AI.md` for the shared model/provider boundary · `../product/BUSINESS_RULES.md` for the
confirm-before-write path this agent's proposals enter.
