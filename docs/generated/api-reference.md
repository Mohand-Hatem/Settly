# API Reference — Generation Contract

    Status:       GENERATION CONTRACT — this file describes how the reference will be produced,
                  it is NOT itself a generated artifact yet (no application code exists)
    Last Updated: 2026-09-05
    Derived From: Decision #40 (workflow), #18 (contract ownership)
    Related:      ../architecture/API.md

## 1. This file is never hand-edited

Once the backend exists, this file's content is **generated from the committed OpenAPI spec** —
never manually written. What follows is the generation contract, so the pipeline is understood
before it exists.

## 2. Source of truth chain

```
  backend/ Zod schemas (runtime validation)
        │  generate
        ▼
  backend/openapi.json                COMMITTED
        │  CI GATE: regenerate, fail if it differs from committed
        │
        │  copy (scripted)
        ▼
  frontend/openapi.json                COMMITTED
        │  openapi-typescript
        ▼
  frontend/generated/api.d.ts          COMMITTED
        │  CI GATE: regenerate, fail if it differs from committed
```

## 3. Update command / process (to be implemented)

1. Change a Zod schema in `backend/`.
2. Run the backend's OpenAPI generation script — regenerates `backend/openapi.json`.
3. Commit the updated spec alongside the code change (reviewable diff).
4. Run the frontend's snapshot-copy script — updates `frontend/openapi.json`.
5. Run `openapi-typescript` — regenerates `frontend/generated/api.d.ts`.
6. Commit both, in the same or a coordinated PR.

## 4. Freshness checks (CI gates)

- **Backend**: regenerate `openapi.json` from current Zod schemas; fail if it differs from the
  committed file.
- **Frontend**: regenerate the typed client from the committed spec; fail if it differs from the
  committed generated file.
- **Non-blocking**: a separate job diffs the backend's and frontend's committed spec snapshots and
  warns on divergence — expected during independent deploys (Decision #18), never gates the build.

## 5. Frontend snapshot relationship

The frontend never invents an endpoint shape. It only ever consumes a spec snapshot copied from
the backend's committed `openapi.json`. See `../architecture/API.md` Section 15.

## 6. Do not fabricate

Until the backend exists, **no rendered endpoint list should be manually authored here** as if it
were generated — that would misrepresent generated content as hand-written fact, which
`../DECISIONS.md` (Decision #30) explicitly warns against. See `../architecture/API.md` for the
full contract shape (envelope, pagination, error taxonomy, action endpoints, etc.) — that document
is the authoritative hand-written description until this one exists as a real artifact.

## 7. Related documents

`../architecture/API.md` for the complete contract shape this reference will document once
generated.
