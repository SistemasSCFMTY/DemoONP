---
name: onp-design
description: Design and UI rules for the ONP FER loan application (DemoONP) — mobile-first at 390px, Charis SIL + Archivo typography, the navy/gold/cream palette, radius and elevation by role, Spanish es-MX copy, and the accessibility contract for a 28-step KYC wizard. Use when writing or reviewing any UI in web-app/, when styling a wizard step or the admin panel, or when a reviewer asks "does this match the rest of the app?".
---

# ONP FER design rules

A loan application a stranger fills out on a phone, handing over their CURP, their
income, photographs of their ID and their signature. Every rule below serves one of two
things: that they can finish it on a 390px screen with one thumb, and that what they see
is honest about what is happening to their data.

`.claude/plans/onp/01-conventions.md` is authoritative. Where this skill and that file
disagree, **the plan file wins** — and fix this file in the same commit.

## Mobile first, 390px

The design width is 390px. Build there, let it breathe upward. Never design at desktop
and squeeze down. The shell is `max-width: 390px` centered on a cream ground, a column:
sticky topbar → progress → scrolling body.

Use `100dvh`, never `100vh`. Tap targets are at least 44×44px. Focusable inputs never
compute below 16px, or iOS zooms the viewport on focus and the user loses their place.

## Typography

**Charis SIL** (serif, 400/700) for `h1`/`h2`/`h3`. **Archivo** (variable) for body, UI,
labels and numerals. Weight ladder: 400 body · 500 labels · 600 headings and buttons ·
700 wordmark. `font-synthesis-weight: none` on headings.

Scale, deliberately small for the viewport: topbar 14 · h2 18 · h3 14 · lede 13 ·
body 13 · label 12 · status 11.

**No uppercase kicker above a heading.** No eyebrows, no
`text-xs uppercase tracking-wide` line announcing what the title already says. It is the
single most reliable tell of a template, and the ban covers section `h2`s too.

**Never `text-transform` legal text.** The declaratoria, the aviso de privacidad and the
términos render exactly as authored.

## Colour

ONP FER's own, as `@theme` tokens — never a hex in a template:

`navy #1c3352` · `navy-deep #0e2036` · `gold #9c7a3c` · `gold-light #c6a866` ·
`bg #f6f4ef` · `surface #ffffff` · `text #1a1c1f` · `text-soft #525a66` ·
`border #e8e4d9` · `success #1e6b45` · `error #8a2a2a` · `warning #8a5a1c`

The ground is warm cream, not white. Cards are white *on* it — that contrast is the
whole visual system, and painting the page white collapses it.

Light mode only. Do not add `prefers-color-scheme` blocks; untested, they will drift.

## Shape and elevation

Radius by what the element *is*: `control 6px` (inputs, buttons, alerts) · `card 8px`
(cards, modal, preview boxes) · full `999px` for the topbar back button and chrome
icon-circles **only**. Buttons are rounded rectangles, not pills.

Elevation encodes height, it is not decoration: `e1` in-flow card · `e2` raised ·
`e3` modal over content · `ring` hairline. This app leans almost entirely on `ring` —
1px borders on cream. Keep that restraint; the same shadow everywhere means nothing.

## Copy

Spanish es-MX, **accents not optional**: `Identificación`, `crédito`, `teléfono`,
`próximo`, `declaración`, `domicilio`. A missing tilde on a loan application reads as
carelessness about people's money.

Port the source's strings verbatim — they are well written. Do not "improve" the legal
text.

**No invented numbers.** The CAT, the pago mensual and the comisión are computed from
live product parameters. A figure with no source is worse than no figure, and in a
regulated credit UI it is a compliance problem, not a design one. This is why the
source's hardcoded "98%" biometric confidence was removed rather than ported.

Where something is simulated, it says so — *"Modo demostración"* stays, and stays true.

## Validation and errors

Inline, under the field, in Spanish, naming the field and what is wrong:
*"Escribe tu CURP a 18 caracteres."* Never "Campo inválido."

The required marker is the label's `::after` asterisk in `error` **plus**
`[attr.aria-required]` — the asterisk alone is invisible to a screen reader.

Conditional required-ness is declared with `setValidators`, never inferred by asking the
DOM what is visible.

## Accessibility contract

Every input has a real `<label for>`; a placeholder is never a label. The step title is
an `<h1>` that takes focus on navigation. The progress bar is a `role="progressbar"`
with `aria-valuenow`. The modal traps focus, closes on Escape, and restores focus to its
trigger. Status lines are `aria-live="polite"`; error summaries are `role="alert"`.
Colour never carries meaning alone — pair it with an icon. Visible focus ring on
everything; never `outline: none` without a replacement.

## Icons and motion

Lucide outlined only, via **`@lucide/angular@1.49.0`** (not `lucide-angular`, which is
the retired package name). Stroke-2, `size-4` inline and `size-5` in nav.

**No emojis.** The source's `✓` status glyphs become `Check` icons, and the `✗` become
`X` — an emoji renders differently on every platform and is announced as prose by a
screen reader.

Import icons individually and register them per component; never pull the whole set.

Motion is Angular `animate.enter` / `animate.leave` plus the tokens in
`src/animations.scss`. No ad-hoc keyframes in components. Everything collapses under
`prefers-reduced-motion`.

## PrimeNG

Admin panel only. The prospect flow is headless Tailwind — a 390px consumer wizard uses
nothing PrimeNG is good at. In the admin panel, tabular data is a `p-table` with
header/body templates, `rowHover`, whole-row click into detail, `[scrollable]` +
`scrollHeight`, and an `emptymessage` — never a hand-rolled `<div>` row list.

## Anti-slop

The `design-anti-slop` and `avoid-ai-design` skills carry the full catalogs. The layers,
deepest first: conceptual beats structural beats visual. Fixing a colour while the claim
is hollow is wasted work.

The gates that matter most here: a radius system used by role and a shadow ladder that
encodes depth are the *not-slop* variants — this app has both, so do not flatten them
into one token. And a number on screen must come from a calculation, not a designer's
sense of what looks credible.
