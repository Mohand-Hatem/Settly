# Analytics

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #16, #28, #42
    Related:      ../architecture/SEARCH.md, ../architecture/SECURITY.md Section 12

## 1. Purpose

What is captured, why, and — deliberately — what is not built in v1.

## 2. Captured

| Model | Captures | Purpose |
|---|---|---|
| `PropertyViewEvent` | Raw property view events | Powers price-drop/insight aggregates via a materialized view |
| `SearchEvent` | Normalized query, parsed filters, per-arm timings, result count, **zero-result flag**, clicked position, language | Zero-result queries are the highest-value dataset the product generates — they say exactly what buyers want and cannot find |

`SearchEvent` capture must never block the search response path (`../architecture/API.md`
Section 3) — fire-and-forget or batched, never awaited.

## 3. Explicitly not built in v1

**No dedicated search-analytics dashboard.** No advanced admin analytics dashboard (Decision
#28). The data is captured now so it's available later; the UI to view it is deferred, not
excluded.

## 4. Privacy and retention (Decision #42)

`PropertyViewEvent` and `SearchEvent` retain **365 days, then rows are deleted** — not
anonymised. Deletion (not anonymisation) is correct here because these are high-volume,
low-per-row-value tables where nulling a user id would be more complex than removal for no
retained benefit. See `../architecture/SECURITY.md` Section 12.

**Kept separate from `AuditLog`** — analytics is operational/product signal; AuditLog is
immutable business/security evidence. They must never be merged.

## 5. Instrumentation principle

Capture what a future decision might need; do not build the dashboard until a decision actually
needs it. This mirrors the "documentation leads on why, code leads on what exists" principle
applied to data collection.

## 6. Pending verification

None directly.

## 7. Rejected / do not add

A search-analytics dashboard in v1 · an advanced admin analytics suite in v1 · merging analytics
tables with `AuditLog` · anonymising instead of deleting expired analytics rows.

## 8. Related documents

`../architecture/SEARCH.md` for how `SearchEvent` is produced · `../architecture/SECURITY.md`
Section 12 for the retention rule.
