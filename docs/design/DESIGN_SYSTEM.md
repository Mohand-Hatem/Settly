# Design System — Constraints (Pre-Stitch)

    Status:       PROVISIONAL — constraints only, authoritative values pending the Stitch design phase
    Last Updated: 2026-09-05
    Derived From: Decisions #21, #30, #39
    Related:      ../architecture/FRONTEND.md, UX_PATTERNS.md

## 1. Purpose

Approved technical constraints and design intent that must bound the Stitch visual-design
exploration. **Do not invent final visual values here** — colours, type scale, spacing tokens,
radii, shadows, and animation timings are Tier-C work, locked only after Stitch approval
(Decision #30).

## 2. Technical constraints (locked, not negotiable in Stitch)

- **Tailwind CSS** + **shadcn/ui (Radix primitives)**
- **WCAG 2.2 AA** target
- **Full bilingual RTL/LTR** — logical CSS properties throughout, no `margin-left`/`margin-right`
- **Arabic-capable typography** — a font family covering both scripts
- `dir="auto"` on all user-generated content, in both directions
- **Recharts** for data visualization
- **MapLibre** for map display (+ MapTiler tiles)
- `prefers-reduced-motion` respected everywhere animation appears (Motion library)

## 3. Design intent (brand direction, to steer Stitch — not a finished system)

Settly should feel calm, confident, intelligent, trustworthy, modern, decisive, premium without
being flashy, data-informed without feeling overly technical. Avoid: loud luxury aesthetics,
excessive gradients, a generic real-estate-template appearance, visual clutter, dashboard-heavy
styling bleeding onto public marketing/search pages.

## 4. Density expectations

| Surface | Density |
|---|---|
| Public discovery/property pages | Highly visual, clear hierarchy, comfortable density, strong imagery, easy scanability |
| Dashboards/admin | Higher information density, structured tables/cards, efficient workflows |
| AI surfaces | Feels integrated into the property experience, not a generic chatbot pasted on |

## 5. Localized formatting (constraint, not a value)

Numbers, dates, and currency must format per the active locale via `Intl`. **Numeral convention**
(Western `123` vs. Arabic-Indic `١٢٣`) is explicitly **not decided here** — deferred to the Stitch
phase as a product/design call (V27), not an architectural blocker.

## 6. Relationship to Stitch

```
  Architecture locked (this document as constraints)
        ↓
  Stitch visual exploration — steered by Section 3, bounded by Section 2
        ↓
  Approve visual system
        ↓
  Finalize THIS document with authoritative tokens (colours, type, spacing, radii, shadows)
        ↓
  Frontend implementation
```

Stitch output must influence **visual design only** — never the approved architecture, state
ownership, rendering model, or business rules (`../architecture/FRONTEND.md`).

## 7. Pending verification

**V26** (RTL maturity of shadcn/Radix, MapLibre, Recharts) · **V27** (numeral convention —
deferred, not blocking).

## 8. Rejected / do not add

Inventing colours, a type scale, spacing tokens, radii, shadows, or animation timings before
Stitch approval · treating this document's constraints as complete design guidance.

## 9. Related documents

`../architecture/FRONTEND.md` for how these constraints map to rendering and component choices ·
`UX_PATTERNS.md` for behavioural (non-visual) UX contracts.
