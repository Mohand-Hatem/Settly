# Entity-Relationship Diagram — Generation Contract

    Status:       GENERATION CONTRACT — not itself a generated artifact yet (no schema exists)
    Last Updated: 2026-09-05
    Derived From: Decision #12/#39 (39-table model), #40 (generation principle)
    Related:      ../architecture/DOMAIN_MODEL.md, ../architecture/DATABASE.md

## 1. This file is never hand-edited

Once `backend/prisma/schema.prisma` exists, this file's content is **generated from that schema**
— never manually drawn or hand-maintained. What follows is the generation contract.

## 2. Source of truth chain

```
  backend/prisma/schema.prisma  (the actual 39-table schema, once written)
        │  prisma-erd-generator (or equivalent) — run as part of the build/CI
        ▼
  docs/generated/erd.md          COMMITTED, or an .svg/.png alongside it
```

## 3. Update process (to be implemented)

1. Change the Prisma schema.
2. Run migration generation (`prisma migrate dev`).
3. Run the ERD generation step.
4. Commit the regenerated ERD alongside the schema/migration change.

## 4. Freshness expectation

A CI check regenerates the ERD from the current schema and fails if it differs from the committed
file — the same freshness-gate pattern used for the OpenAPI spec (see `api-reference.md`).

## 5. Do not fabricate

**No hand-drawn ERD should be authored here** until the actual Prisma schema exists — a manually
invented diagram would misrepresent itself as generated, code-verified fact when it is not.
`../architecture/DOMAIN_MODEL.md` is the authoritative hand-written table inventory (39 tables,
ownership, relationships, lifecycle) until this file exists as a real generated artifact.

## 6. Related documents

`../architecture/DOMAIN_MODEL.md` for the complete table inventory this diagram will visualise ·
`../architecture/DATABASE.md` for indexes, constraints and extensions not shown in a basic ERD.
