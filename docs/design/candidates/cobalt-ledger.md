---
name: "Cobalt Ledger"
description: "A trustworthy, decisive interface for real estate and financial-adjacent products. Deep cobalt blue reserved for the primary CTA and active state, warm copper used sparingly for price and highlight moments, on a cool stone-grey surface — never cream, never green, never glass. Newsreader serif for display headlines with Amiri for Arabic display, IBM Plex Sans / IBM Plex Sans Arabic for body — full bilingual RTL support, not an afterthought. Built for marketplaces and dashboards where money and trust are on the page at the same time."
tags: [trust, editorial, bilingual, rtl, real-estate, finance-adjacent]
colors:
  primary:   "#16202B"
  secondary: "#56636E"
  tertiary:  "#1B4B7A"
  neutral:   "#DDE1E3"
  surface:   "#F4F5F7"
typography:
  display: Newsreader
  display_ar: Amiri
  body: "IBM Plex Sans"
  body_ar: "IBM Plex Sans Arabic"
  mono: "IBM Plex Mono"
  scale:
    hero: "3.4rem / 1.08 / 500 / -0.015em"
    h1:   "2.5rem / 1.15 / 600 / -0.01em"
    h2:   "1.5rem / 1.3 / 600 / -0.005em"
    body: "1rem / 1.65 / 400 / 0"
radius:
  sm: 8px
  md: 12px
  lg: 18px
  pill: 9999px
shadows:
  card:   "rgba(22,32,43,0.04) 0 1px 2px, rgba(22,32,43,0.06) 0 6px 18px -8px"
  button: "rgba(27,75,122,0.18) 0 4px 12px -4px"
borders:
  card:    "1px solid #DDE1E3"
  divider: "#E4E7E9"
buttons:
  primary:
    background: "#1B4B7A"
    color: "#F7FAFC"
    border: none
    shape: rounded
    padding: 11px 22px
    font: 600 / 0.9375rem
  secondary:
    background: "#F4F5F7"
    color: "#16202B"
    border: "1px solid #DDE1E3"
    shape: rounded
    padding: 11px 22px
    font: 500 / 0.9375rem
  outline:
    background: transparent
    color: "#16202B"
    border: "1px solid #C7CDD1"
    shape: rounded
    padding: 11px 22px
    font: 500 / 0.9375rem
  ghost:
    background: transparent
    color: "#56636E"
    border: none
    shape: rounded
    padding: 10px 14px
    font: 500 / 0.9375rem
charts:
  variant: "thin-bars"
  stroke_width: 1.75
  fill_opacity: 0.12
  gridlines: false
  bar_gap: 6px
  highlight: single
  highlight_color: "#B8823F"
  dot_marker: true
fonts_url: "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;1,500&family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
dependencies: ["lucide-react"]
---

# Cobalt Ledger

## AI Build Instructions

> **Read this section before writing any code.** Every value used in the UI must come
> from this file's frontmatter — never substitute, approximate, or invent new colors,
> fonts, radii, or shadows. If a value is missing, ask before adding one.
>
> **This system is bilingual by requirement, not by option.** Every screen must be
> built for both English (LTR) and Arabic (RTL) from the start. Use CSS logical
> properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align:
> start`) — never physical properties (`margin-left`, `text-align: left`). Directional
> icons (arrows, chevrons, back/forward) must mirror under `[dir="rtl"]`; symmetric
> icons (search, heart, pin, close) must not.

### 1 · Your role

You are building UI for a bilingual real estate/marketplace product that has adopted
**Cobalt Ledger** as its design system. Treat this file as the single source of truth.
Translate product requirements into components that read as trustworthy and decisive
first, visually interesting second — never the reverse.

### 2 · Token compliance

- Pull every color, font family, radius, shadow, and spacing value from the frontmatter.
- Use semantic roles (`primary`, `accent`, `muted`) — never hard-code hex values.
- Declare tokens once as CSS custom properties; reference them everywhere downstream.
- Load the Google Fonts `<link>` before any component renders.
- Switch `--font-display` and `--font-body` based on `html[lang]`, not on a hardcoded
  choice — see Typography pairings below.

### 3 · Component recipes

#### Buttons

Four variants. Never blend variants or invent a fifth.

- **Primary** — bg `#1B4B7A`, text `#F7FAFC`, padding `11px 22px`, weight `600`. The
  single dominant CTA per screen — "Search," "Request a viewing," "Submit offer."
- **Secondary** — bg `#F4F5F7`, text `#16202B`, border `1px solid #DDE1E3`. Supporting
  actions — "Save," "Compare."
- **Outline** — transparent, border `1px solid #C7CDD1`. Tertiary actions in toolbars.
- **Ghost** — transparent, text `#56636E`. Inline links, table row actions.

Copper (`#B8823F`) never appears on a button. It is reserved for price figures and a
single chart highlight — see Palette.

#### Cards

```css
background: #FFFFFF;
border: 1px solid #DDE1E3;
border-radius: 12px; /* radius.md */
box-shadow: rgba(22,32,43,0.04) 0 1px 2px, rgba(22,32,43,0.06) 0 6px 18px -8px;
```

No glass, no blur, no translucency. Flat, bordered, quietly elevated — a card should
read as a real object on a desk, not a pane of frosted glass. Property image area sits
above a fixed-height content block so a grid of cards never staggers.

#### Tabs

Underline variant, not pill. Active tab: `#1B4B7A` text + 2px `#1B4B7A` bottom border.
Inactive: `#56636E` text, no border. Reserve pill shape for filter chips, not navigation.

#### Charts

- Thin bars, 6px gap, no gridlines — axis labels and a single copper-highlighted bar or
  point carry the data.
- Line charts: 1.75px stroke in `primary`, 12% fill, ending in a dot marker.
- Use copper (`#B8823F`) for exactly one emphasized data point per chart — a current
  value, a selected area — never as a general series color.

#### Typography pairings

| Context | English | Arabic |
|---|---|---|
| Display (h1, hero, wordmark) | Newsreader, italic for a single emphasized word only | Amiri |
| Body, UI, forms, buttons | IBM Plex Sans | IBM Plex Sans Arabic |
| Tabular numbers, captions | IBM Plex Mono | IBM Plex Sans Arabic (Plex Mono has no Arabic glyphs — do not use it for Arabic numerals or captions) |

Never substitute Newsreader for Arabic text — it has no Arabic glyph coverage and will
silently fall back to the browser's system serif, breaking the type system. This is
the exact failure mode being designed against.

### 4 · Hard constraints

Never do the following without explicit instruction:

- Introduce a new color, font, radius, or shadow not declared above.
- Use `backdrop-filter`, translucency, or any glassmorphism treatment — this system is
  flat and bordered by design; translucent surfaces make contrast unpredictable against
  photography, which this product has a great deal of.
- Use green anywhere as a brand color (reserve green exclusively for a semantic
  "success" state, separate from this palette, if one is ever needed).
- Use copper/`#B8823F` as a background fill, button color, or link color — it is a
  highlight, never a surface.
- Ship an English-only screen and call it done — every screen needs its Arabic/RTL
  counterpart before it is considered complete.
- Use physical CSS properties (`margin-left`, `text-align: left`) anywhere layout
  needs to flip under RTL.

### 5 · Before you finish — verify

- [ ] Every color used appears in the Colors table below.
- [ ] Headlines use the display font **for the active language** (Newsreader for `lang="en"`, Amiri for `lang="ar"`); body copy uses the matching body font.
- [ ] Buttons match one of the four declared variants exactly.
- [ ] Border-radius values come from `radius.sm` / `md` / `lg` / `pill`.
- [ ] No `backdrop-filter`, no translucent surfaces.
- [ ] The screen has been checked in `dir="rtl"` and nothing is physically (not logically) positioned.
- [ ] Muted text passes 4.5:1 against its surface — verify with a contrast checker, not by eye.

---

## 1. Atmosphere

Cobalt Ledger reads like a well-run title office, not a startup dashboard: flat white
cards on a cool stone-grey ground, a single deep cobalt reserved for the one thing you
should do next, and a warm copper that appears exactly where money appears — a price,
a highlighted data point — and nowhere else. Display headlines run in Newsreader, a
literary serif with real weight, with one italic word per headline as the only
ornamental gesture. Body text sits in IBM Plex Sans at a comfortable 1rem/1.65 —
plain, legible, slightly technical without feeling cold. The Arabic system is not a
translation of the English one; it is its own considered pairing — Amiri for display,
IBM Plex Sans Arabic for body — chosen so an Arabic-reading user gets the same
weight and warmth an English-reading user gets, not a mirrored afterthought.

**Signature moves**
- Flat, bordered cards — no shadow theatrics, no glass, no blur
- Cobalt (`#1B4B7A`) exclusively on the primary CTA, active nav state, and links
- Copper (`#B8823F`) exclusively on price figures and one chart highlight per chart
- Newsreader italic on exactly one word per headline — restraint, not decoration
- A genuine, separately-designed Arabic display face (Amiri), not a Latin font stretched over Arabic text

## 2. Palette

### Surfaces
- **Stone** `#F4F5F7` — page background. Cool, not cream; not tinted green or purple.
- **Stone Raised** `#FFFFFF` — card and panel fill.
- **Stone Sunken** `#EAEDEF` — input fields, table stripes, filter chip rest state.

### Ink
- **Ink** `#16202B` — headings, primary text. Deep blue-charcoal, not pure black.
- **Ink Muted** `#56636E` — secondary text, captions, metadata.
- **Ink Faint** `#8993A0` — placeholder text, disabled labels.

### Accent
- **Cobalt** `#1B4B7A` — primary CTA, active state, links, focus ring.
- **Cobalt Soft** `rgba(27,75,122,0.10)` — hover backgrounds, selected-row fill.
- **Copper** `#B8823F` — price figures, single chart highlight. Never a fill, never a button.

### Borders
- **Border** `#DDE1E3` — card edges, dividers.
- **Border Strong** `#C7CDD1` — input borders, outline buttons.

## 3. Typography

| Role | Font (EN) | Font (AR) | Size | Weight | Leading |
|---|---|---|---|---|---|
| Hero | Newsreader | Amiri | 3.4rem | 500 | 1.08 |
| H1 | Newsreader | Amiri | 2.5rem | 600 | 1.15 |
| H2 | Newsreader | Amiri | 1.5rem | 600 | 1.3 |
| Body | IBM Plex Sans | IBM Plex Sans Arabic | 1rem | 400 | 1.65 |
| UI / Button | IBM Plex Sans | IBM Plex Sans Arabic | 0.9375rem | 600 | 1.4 |
| Caption / Meta | IBM Plex Sans | IBM Plex Sans Arabic | 0.8125rem | 500 | 1.4 |
| Tabular number | IBM Plex Mono | IBM Plex Sans Arabic (tabular-nums) | 0.9375rem | 500 | 1.0 |

Newsreader's italic is the one ornamental move — exactly one word per headline
("Search less. *Settle* better."). Amiri has no italic style suited to the same
treatment; the Arabic headline instead gets its emphasis from Amiri's own bold weight
on the equivalent word, never from an invented italic.

## 4. Buttons

### Primary (Cobalt)
```css
background: #1B4B7A;
color: #F7FAFC;
padding: 11px 22px;
border-radius: 12px;
font-weight: 600;
box-shadow: rgba(27,75,122,0.18) 0 4px 12px -4px;
```

### Secondary
```css
background: #F4F5F7;
color: #16202B;
border: 1px solid #DDE1E3;
```

### Outline & Ghost
- Outline: transparent, `1px solid #C7CDD1`, ink text.
- Ghost: no border, `#56636E` text, hovers to `Stone Sunken` background.

## 5. Cards

```css
background: #FFFFFF;
border: 1px solid #DDE1E3;
border-radius: 12px;
box-shadow: rgba(22,32,43,0.04) 0 1px 2px, rgba(22,32,43,0.06) 0 6px 18px -8px;
```

Property image area: 4:3, fixed height, corners matched to the card radius on the top
edge only. Content padding `20px`. On hover: `translateY(-2px)` and the shadow's second
layer deepens to `rgba(22,32,43,0.10)` — a lift, not a glow.

## 6. Charts

Thin bars (5px wide, 6px gap) in `Ink Faint`, with exactly one bar recolored to
`Copper` per chart to mark the current or selected value. Line charts: 1.75px stroke
in `Cobalt`, 12% fill beneath, ending in a `Copper` dot marker at the latest point. No
gridlines — axis ticks and the highlighted mark carry the reading.

## 7. Tabs

Underline style. Active: `Cobalt` text + 2px `Cobalt` bottom border. Inactive:
`Ink Muted`, transparent border. Filter chips (a different pattern) use `pill` radius
with `Stone Sunken` background at rest and `Cobalt Soft` when selected.

## 8. Spacing

- Base unit: 4px
- Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`
- Section padding: 88px desktop, 40px mobile

## 9. Do's & Don'ts

✅ **Do**
- Keep the page flat and bordered — trust comes from clarity, not texture
- Reserve Cobalt for exactly one action per screen
- Reserve Copper for money and exactly one data highlight — nothing else
- Build the Arabic version of every screen alongside the English one, not after it
- Use logical CSS properties everywhere layout could flip

❌ **Don't**
- Add `backdrop-filter` or any translucent surface
- Use green as a brand color anywhere
- Let Copper appear on a button, a background fill, or a link
- Stretch Newsreader or IBM Plex Sans across Arabic text — use the declared Arabic pairing
- Center everything — vary alignment by section to avoid a static, templated feel

---

## Tokens

> Treat the values below as the contract — never substitute approximations.

### Colors

| Role | Value |
|---|---|
| primary | `#16202B` |
| secondary | `#56636E` |
| tertiary | `#1B4B7A` |
| neutral | `#DDE1E3` |
| surface | `#F4F5F7` |

### Typography

- **Display (EN):** Newsreader
- **Display (AR):** Amiri
- **Body (EN):** IBM Plex Sans
- **Body (AR):** IBM Plex Sans Arabic
- **Mono:** IBM Plex Mono (Latin numerals/captions only — never for Arabic text)

| Role | size / leading / weight / tracking |
|---|---|
| Hero | 3.4rem / 1.08 / 500 / -0.015em |
| H1 | 2.5rem / 1.15 / 600 / -0.01em |
| H2 | 1.5rem / 1.3 / 600 / -0.005em |
| Body | 1rem / 1.65 / 400 / 0 |

### Radius
- sm: `8px` · md: `12px` · lg: `18px` · pill: `9999px`

### Shadows
- **card:** `rgba(22,32,43,0.04) 0 1px 2px, rgba(22,32,43,0.06) 0 6px 18px -8px`
- **button:** `rgba(27,75,122,0.18) 0 4px 12px -4px`

### Borders
- **card:** `1px solid #DDE1E3`
- **divider:** `#E4E7E9`

### Charts

| Property | Value |
|---|---|
| variant | `thin-bars` |
| strokeWidth | `1.75` |
| fillOpacity | `0.12` |
| gridlines | `false` |
| barGap | `6px` |
| highlight | `single` |
| highlightColor | `#B8823F` |
| dotMarker | `true` |

---

## Pro tokens

> Production-fidelity tokens — states, density, motion, elevation, content rules, and
> an accessibility contract. Contrast ratios below are calculated estimates from the
> declared hex values; **verify with a contrast-checking tool before implementation**,
> not treated as a certified audit.

### States

#### Button
- **hover (primary)** — bg `#153E64` (darkened 12%), shadow deepens
- **focus** — outline `2px solid #1B4B7A`, outline-offset `2px`
- **active** — `translateY(1px)`, `brightness(0.96)`
- **disabled** — opacity `0.45`

#### Input
- **hover** — border `1px solid #1B4B7A`
- **focus** — border `1px solid #1B4B7A`, shadow `0 0 0 3px rgba(27,75,122,0.12)`
- **error** — border `1px solid #B3261E`, helper text in the same red

#### Card
- **hover** — `translateY(-2px)`, shadow deepens to `rgba(22,32,43,0.10)`
- **selected** — border `1px solid #1B4B7A`, background stays white (no fill wash)

### Density

| Mode | padding × | row × | body | radius × | Use for |
|---|---|---|---|---|---|
| compact | 0.75 | 0.8 | 0.875rem | 0.85 | Agent/admin tables, moderation queues |
| comfortable | 1 | 1 | 1rem | — | Default — property pages, buyer dashboards |
| spacious | 1.3 | 1.25 | 1.0625rem | 1.1 | Landing, editorial area guides |

### Motion

```css
transition: all 200ms cubic-bezier(0.2, 0.7, 0.2, 1);
```

| Token | Value |
|---|---|
| duration.instant | `80ms` |
| duration.fast | `150ms` |
| duration.base | `200ms` |
| duration.slow | `320ms` |
| easing.standard | `cubic-bezier(0.2, 0.7, 0.2, 1)` |

Deliberately quicker than a "page turn" — this product is scanned and compared
(listings, filters, tables), not read like an editorial page. Motion should confirm an
action happened, not perform for its own sake. Always respect
`prefers-reduced-motion: reduce` by disabling non-essential transitions.

### Elevation

| Level | Shadow | Use |
|---|---|---|
| level0 | `none` | Resting page content |
| level1 | `rgba(22,32,43,0.04) 0 1px 2px` | List rows, dividers |
| level2 | `rgba(22,32,43,0.06) 0 6px 18px -8px` | Cards |
| level3 | `rgba(22,32,43,0.12) 0 16px 32px -12px` | Dropdowns, popovers |
| level4 | `rgba(22,32,43,0.22) 0 24px 64px -16px` | Modals, with scrim |

### Content

- **measure:** `65ch` max line length for body prose
- **link:** color `#1B4B7A`, underline on hover only (not always — this is UI-dense, not long-form editorial)
- **Arabic numerals:** Western digits (`123`) in both languages for v1 — deferred product decision, see architecture doc V27

### Accessibility (WCAG 2.2 AA — estimated, verify before ship)

| Pair | Approx. ratio | Target | Notes |
|---|---|---|---|
| Ink on Stone | ~14.5:1 | AA (4.5:1) | Deep charcoal on light stone — comfortably passes |
| Ink Muted on Stone | ~5.9:1 | AA (4.5:1) | Passes normal text, unlike the rejected system's muted color |
| Cobalt on Stone / White | ~7.1:1 | AA (4.5:1) | Passes for text and UI components |
| Copper on White (large text only) | ~3.4:1 | AA-Large (3:1) | **Do not use Copper for body-size text** — large/bold price figures only |
| White on Cobalt (button text) | ~7.1:1 | AA (4.5:1) | Passes |
