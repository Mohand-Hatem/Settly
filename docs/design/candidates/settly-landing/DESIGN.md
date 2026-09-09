---
name: Settly — Navy & Brass
status: Candidate — recorded from the built landing page, pending approval into docs/design/DESIGN_SYSTEM.md
colors:
  navy-900: '#131D36'
  navy-800: '#1E2A4A'
  navy-700: '#2B3A61'
  navy-600: '#3D4E7A'
  brass: '#C69749'
  brass-600: '#AE8033'
  brass-200: '#E7D3AB'
  brass-050: '#F6EEDE'
  canvas: '#F7F6F3'
  canvas-2: '#EFEDE6'
  white: '#FFFFFF'
  ink: '#16203A'
  ink-2: '#4C5878'
  ink-3: '#646D88'
  line: 'rgba(30, 42, 74, 0.10)'
  line-2: 'rgba(30, 42, 74, 0.18)'
  sage: '#3D5A4C'
  sage-bg: '#EAF0EC'
  error: '#991B1B'
  warning: '#B45309'
  primary: '#1E2A4A'
  on-primary: '#FFFFFF'
  secondary: '#C69749'
  on-secondary: '#241A06'
  tertiary: '#3D5A4C'
  background: '#F7F6F3'
  surface: '#FFFFFF'
  on-surface: '#16203A'
  outline: '#646D88'
fonts:
  display: 'Spectral, "Noto Naskh Arabic", Georgia, serif'
  sans: '"Plus Jakarta Sans", "IBM Plex Sans Arabic", system-ui, sans-serif'
  mono: '"JetBrains Mono", "IBM Plex Sans Arabic", ui-monospace, monospace'
typography:
  display-xl: { fontFamily: Spectral, fontSize: 70px, fontWeight: '700', lineHeight: 74px, letterSpacing: '-0.021em' }
  display-lg: { fontFamily: Spectral, fontSize: 43px, fontWeight: '600', lineHeight: 49px, letterSpacing: '-0.012em' }
  display-md: { fontFamily: Spectral, fontSize: 32px, fontWeight: '600', lineHeight: 37px, letterSpacing: '-0.012em' }
  title-lg:   { fontFamily: Spectral, fontSize: 21px, fontWeight: '600', lineHeight: 27px, letterSpacing: '-0.012em' }
  title-ui:   { fontFamily: Plus Jakarta Sans, fontSize: 16px, fontWeight: '700', lineHeight: 20px, letterSpacing: '-0.015em' }
  body-lg:    { fontFamily: Plus Jakarta Sans, fontSize: 17px, fontWeight: '400', lineHeight: 28px }
  body-md:    { fontFamily: Plus Jakarta Sans, fontSize: 15px, fontWeight: '400', lineHeight: 24px }
  body-sm:    { fontFamily: Plus Jakarta Sans, fontSize: 13.5px, fontWeight: '400', lineHeight: 20px }
  mono-value: { fontFamily: JetBrains Mono, fontSize: 18.5px, fontWeight: '700', lineHeight: 24px, letterSpacing: '-0.02em' }
  mono-meta:  { fontFamily: JetBrains Mono, fontSize: 12px, fontWeight: '500', lineHeight: 17px }
  mono-label: { fontFamily: JetBrains Mono, fontSize: 11.5px, fontWeight: '600', lineHeight: 16px, letterSpacing: '0.062em' }
rounded:
  DEFAULT: 0.5rem
  md: 0.5625rem
  lg: 0.875rem
  xl: 1.125rem
  full: 9999px
spacing:
  wrapper: 1320px
  gutter: 'clamp(1rem, 4vw, 3.5rem)'
  section: 'clamp(4rem, 8vw, 7.5rem)'
---

# Settly design system

Recorded from a built and audited landing page, not written ahead of it. Ground truth for
every new Settly screen. Do not invent alternative colours, fonts, radii or component shapes.

## Fonts — read this first

The display face is **Spectral** (serif). Some font pickers have no Spectral entry; where that
is the case, choose Source Serif 4 or Literata as the nearest screen serif, but **generated code
must load `Spectral` from Google Fonts**.

Three families, three jobs:

- **Display — Spectral (serif).** All h1/h2/h3 and content titles. Weight 600; 700 for a hero.
  Tracking **-0.012em**, hero **-0.021em**. Never tighter — negative tracking closes a serif's
  counters and muddies it at size.
- **Sans — Plus Jakarta Sans.** Body, UI, buttons, nav, small h4-level list labels, marketing
  pills. Chosen for its Arabic companion, not for fashion.
- **Mono — JetBrains Mono.** **Only for measured or catalogued values**: prices, EGP/m², areas,
  bed and bath counts, dates, times, read-times, currency, map scale bars, and the small
  uppercase labels attached directly to those values. Always `font-variant-numeric: tabular-nums`.
  **Never** mono for prose, marketing copy or badge text — that is costume, not measurement.
- Uppercase mono labels track at **0.062em**, not wider. Mono already has broad sidebearings.
- **Arabic**: Spectral and JetBrains Mono have no Arabic coverage. Display falls back to
  **Noto Naskh Arabic**; sans and mono fall back to **IBM Plex Sans Arabic**.

## What Settly is, so screens carry the right content

An AI-assisted real estate platform for the **Egyptian market**, priced in **EGP only**. Buyers
search, request viewings, negotiate offers and pay a **reservation deposit against an accepted
offer**. Agents are independent — there is no agency or brokerage model. Admins moderate.

- Sale-first. Rent supports discovery, viewings and inquiries but **never offers or payments**.
- **Fully bilingual EN + AR**, first-class RTL, not a translation layer.
- **Responsive web only.** No native app in v1 — never draw App Store or Google Play badges.
- Districts: New Cairo / Fifth Settlement, Golden Square, Katameya, Mivida, Villette,
  Sheikh Zayed, 6th of October, Karmell, North Coast (Sahel), Sidi Abd El Rahman,
  New Administrative Capital.
- Developers: Palm Hills, SODIC, Emaar Misr, Ora Developers.

### Claims discipline

Settly has not launched. **Never invent counters** ("14,800 listings", "20K happy clients",
"EGP 42B transacted"), testimonials, star ratings or press logos. Where a stats band is wanted,
use capability statements instead: Verified listings · Map & semantic search · Secure
reservation · Built bilingual. Illustrative listing data is fine and must be labelled as a mockup.

## Brand

The palette is taken from the Settly mark: a deep navy monogram with one brass roof accent.
Navy carries structure and authority; brass is the only warm note and is spent solely on the
single highest-intent action. The register is an editorial property broadsheet crossed with an
instrument panel.

Refuse the regional portal defaults — gold filigree, marble gradients, walls of identical
thumbnails, glowing badges. Settly sells on verified structure, so architecture runs large and
every measured value is set in the mono face.

## Colour roles

- **Navy `#1E2A4A`** — body text, header chrome, primary buttons, dark bands, footer.
- **Brass `#C69749`** — primary conversion action, active tab underline, accents on dark
  grounds. Never a large field, never body text.
- **Sage `#3D5A4C`** — **semantic only**: verified badges, positive metrics. Never decorative.
- **Warm bone `#F7F6F3`** — the page ground. White `#FFFFFF` is for raised plates.

**Contrast**: WCAG 2.2 AA everywhere. Muted ink is `#646D88` — 5.14:1 on white, 4.76:1 on bone.
Never use a lighter grey for small text. On the brass wash `#F6EEDE`, muted ink darkens to
`#5A6280`, because `#646D88` lands at 4.46:1 there and fails.

## Layout

4px grid. Wrapper **1320px**, gutters `clamp(1rem, 4vw, 3.5rem)`, section padding
`clamp(4rem, 8vw, 7.5rem)`.

- **< 600px** single column; the search console stacks to full-width fields.
- **600–1080px** two-column property and footer grids.
- **1080px** the primary nav collapses to a menu button — before it can wrap, not after.
- **> 1080px** four-up property cards, three-up workflow and article cards.

All spacing uses **CSS logical properties** (`margin-inline`, `inset-inline-start`) so Arabic
mirrors cleanly rather than needing a patched stylesheet. More space above a heading than below it.

**Critical layout rule learned the hard way**: a hero's inner measure must live on a child
element, never on the same element that carries the centred page wrapper. A smaller `max-width`
there beats the wrapper's and `margin-inline: auto` then silently centres the whole block.

## Elevation

Declare elevation once — a border **or** a shadow, never both.

- **L0** bone canvas `#F7F6F3`
- **L1** white plate with a `rgba(30,42,74,.10)` hairline, no shadow
- **L2** cards: `0 1px 2px rgba(19,29,54,.04), 0 8px 24px -12px rgba(19,29,54,.14)`
- **L3** hover and floating console: `0 2px 4px rgba(19,29,54,.05), 0 24px 48px -20px rgba(19,29,54,.24)`

Glass only where something genuinely overlays a photograph — hero badges, price chips on card
imagery. Never as decoration on a flat ground.

## Shape

8–9px controls · 14px cards and media · 18px the hero search console · full pill only for small
chips and filter tokens. Media corners match their container exactly.

## Components

### Header
White, sticky, 76px. Transparent-PNG logo (38px) inline-start, nav centre, EN/ع toggle plus a
ghost "Sign in" and a navy "Get started" inline-end. `white-space: nowrap` on every nav item and
button, or they wrap and blow the header height.

### Hero
Full-bleed architectural photograph. Navy scrim raked from the inline-start edge:
`linear-gradient(100deg, rgba(13,20,38,.94), rgba(15,23,43,.86) 34%, rgba(17,26,48,.42) 62%, rgba(19,29,54,.16))`
plus a bottom lift. Headline, sub and console **pinned inline-start, flush with the header logo** —
never centred. Inner measure 940px.

### Search console
White plate lifted onto the photograph, 18px radius, max 940px. Type tabs across the top
(Buy / Rent / New launches) with a brass underline on the active tab, then a row of divided
fields (Location, Property type, Price) closed by a brass Search button. Field labels are
11.5px mono uppercase.

### Property card
16:11 media. Developer tag (navy glass) and a sage "Verified" badge pinned top; the
**EGP x/m² chip pinned bottom-start over the image**. Body carries a mono location line, a
Spectral title, the price in mono navy 700, then a hairline-divided mono specs row
(beds · baths · m²). Image scales 1.055 over 0.7s on hover.

### Map surface
Sand basemap `#EDE9DF`, block-pattern urban grain, white roads over `#DCD5C4` casings,
`#D9E3D4` parkland, `#C7D6E3` water. The search boundary is a **brass dashed polygon** filled
`rgba(198,151,73,.13)`. Price pins are white mono pills with a tail; the active pin is brass.
A left rail carries the result count, filter chips and result rows. Zoom control and scale bar
sit in the corners.

### Viewing scheduler
White card. Month header with prev/next. Seven-column grid; available days carry a small brass
dot, the selected day is a filled navy square, past days are dimmed. Time slots are mono chips;
taken slots are struck through and disabled. Closes with a brass full-width action and a
verified-agent line.

### Buttons
**Primary** navy with white text · **Accent** brass `#C69749` with `#241A06` text, one per
surface and highest intent only · **Line** white ground with a `rgba(30,42,74,.18)` border ·
**Ghost** transparent navy with a warm hover wash.

### Inputs
`rgba(255,255,255,.8)` ground, `rgba(30,42,74,.14)` border, 44px desktop / 48px touch. Focus is
a navy border plus a 3px `rgba(30,42,74,.09)` ring. Errors are a 1px crimson border with an
inline caption naming the problem and the recovery.

### Browser surfaces
Theme them, never leave defaults: brass-200 text selection, navy scrollbar thumb on a canvas
track, a 2px brass focus ring at 3px offset, brass caret.

### Motion
**One authored moment per surface.** On the landing page it is the hero settling in — a
four-step stagger on an exponential ease-out, from an already-visible default. Everything else
is hover and state transition only. Honour `prefers-reduced-motion` everywhere.

### Data visualisation
Thin unbordered bars in navy or brass, hairline dotted gridlines `rgba(30,42,74,.06)`, frosted
tooltips carrying tabular bilingual figures. No sparklines or progress rings standing in for
content.

## Anti-patterns — do not produce

Kickers or eyebrows above headings · section numbers (01 / 02 / 03) · gradient text · glass as
decoration · coloured left borders on cards · hard offset shadows · emoji or unicode standing in
for icons (icons are drawn SVG on one consistent stroke) · nested cards · a 1px border under a
wide soft shadow · monospace as a "technical" costume · invented statistics or testimonials ·
app-store badges.
