# DemoONP — ONP FER

Solicitud de crédito en línea para una SOFOM mexicana (es-MX). Dos proyectos
independientes, cada uno con su propio `package.json` y lockfile:

- **`web-app/`** — Angular 21, standalone + signals, zoneless; NGXS 21; Tailwind 4.
  PrimeNG 21 **solo** en el panel administrativo.
- **`backend/`** — Hono 4 sobre Node, Supabase como base de datos y almacén.

Canonical docs — read these first:

- **`.claude/plans/onp/01-conventions.md`** — the full conventions suite (typography,
  design language, a11y, layout, styling, Angular/NGXS rules, forms, folder layout,
  Hono/backend rules, Spanish copy). If this file and the skill ever disagree, the
  plan file wins.
- **`.claude/plans/onp/00-master-plan.md`** — module map + progress board + checkpoint
  protocol. Every checkpoint closes with a PR the owner reviews.
- **`.claude/skills/onp-design`** — committed skill mirroring the design language so
  module agents auto-load it. Edit it **in the same commit** as plan 01.

The port source is `../ONP/onp_fer_etapa2_pf.html` (6,052 lines, single file).
`onp_fer_app_CODIGO_v24.txt` is a byte-identical copy — ignore it.
**Copy and screen structure are preserved verbatim**; only the implementation changes.

## Quick rules (the ones that get missed)

- **Mobile first, 390px is the design width.** The source ships `max-width: 390px`
  centered. Build at 390 and let it breathe upward — never design at desktop and
  squeeze down.
- **No emojis; Lucide outlined icons only** (`@lucide/angular`, stroke-2; `size-4`
  inline, `size-5` nav). The source's `✓` glyphs in status text become icons.
- **No arbitrary Tailwind values in templates** (`h-[235px]`, `w-[390px]`) — standard
  scale utilities only; an exact size belongs in a stylesheet, not inline brackets.
- **No uppercase kickers above a heading**, ever. No `text-transform` on
  tenant-authored or legal text — the declaratoria renders exactly as written.
- **No inline function calls in templates** — computed signals or pure pipes
  (`web-app/src/app/pipes/`); no `protected readonly Enum = Enum` bridges.
- **NGXS is the single source of truth** for the expediente. Each wizard step owns a
  typed `FormGroup` and dispatches on valid submit; steps rehydrate from the store on
  back-navigation.
- **One route per wizard step** (`/solicitud/generales`), lazy, guarded. A guard blocks
  jumping ahead to a step the user has not reached.
- **Constants live in `model/constants/<entity>/`** (one per file); http services in
  `app/services/http/`; guards one-per-file in `app/guards/`; **never create `index.ts`
  barrels**.
- **Motion = Angular `animate.enter`/`animate.leave` + `src/animations.scss` tokens** —
  no ad-hoc keyframes; everything collapses under `prefers-reduced-motion`.
- **Nothing Supabase reaches the browser.** No URL, no anon key, no `supabase-js` in
  `web-app/`. The backend owns the credentials and reads them from env vars.
- **Spanish (es-MX) with accents — they are not optional.** `Identificación`,
  `crédito`, `teléfono`, `domicilio`, `próximo`. A missing tilde on a loan application
  reads as carelessness about people's money.

## Build + verification

- `npm run build` green in **both** projects before closing any checkpoint.
- Backend: `npm run typecheck` and the Zod contract tests must pass.
- No screenshots unless asked (the owner watches :4200).
