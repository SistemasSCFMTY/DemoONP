# DemoONP — ONP FER

Solicitud de crédito en línea para una SOFOM mexicana (es-MX). **Demo, se presenta el
2026-10-01.** Un solo whitelabel, en un solo archivo de configuración.

**Tres proyectos independientes**, cada uno con su `package.json` y lockfile:

- **`web-app/`** — el flujo del prospecto, 28 pantallas. Angular 21, standalone +
  signals, zoneless; NGXS 21; Tailwind 4. **Sin PrimeNG.** Mobile first, 390px.
  Despliega a Cloudflare Pages.
- **`superadmin-app/`** — el panel del personal, un solo tenant. Angular 21 + NGXS 21 +
  Tailwind 4 + **PrimeNG 21**. Desktop first. Despliega a Cloudflare Pages.
- **`backend/`** — Hono 4 sobre **Cloudflare Workers**, con Supabase y Resend.

Canonical docs — read these first:

- **`.claude/plans/onp/01-conventions.md`** — the full conventions suite (typography,
  design language, a11y, layout, styling, Angular/NGXS rules, forms, folder layout,
  Hono/backend rules, Spanish copy). If this file and the skill ever disagree, the
  plan file wins.
- **`.claude/plans/onp/00-master-plan.md`** — module map + progress board + checkpoint
  protocol. Every checkpoint closes with a PR the owner reviews.
- **`.claude/skills/onp-design`** — committed skill mirroring the design language so
  module agents auto-load it. Edit it **in the same commit** as plan 01.

Three agents, one directory each: `onp-backend`, `onp-frontend`, `onp-superadmin`.
No agent writes in another's folder.

The port source is `../ONP/onp_fer_etapa2_pf.html` (6,052 lines, single file).
`onp_fer_app_CODIGO_v24.txt` is a byte-identical copy — ignore it.
**Copy and screen structure are preserved verbatim**; only the implementation changes.

## Quick rules (the ones that get missed)

- **`web-app/` is mobile first, 390px is the design width.** The source ships
  `max-width: 390px` centered. Build at 390 and let it breathe upward — never design at
  desktop and squeeze down. **`superadmin-app/` is the exception**: a desktop tool for
  staff, and it should not pretend otherwise.
- **One whitelabel, one file.** `web-app/src/app/brand.config.ts` — razón social,
  nombre comercial, domicilio, logo, palette. No `sofoms` table, no tenant switcher, no
  branding UI. Swapping client is a one-file edit.
- **OCR runs in the browser.** Tesseract cannot run in a Worker — its WASM and
  traineddata exceed the bundle cap and the CPU budget. Platform constraint, not
  preference.
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
- **Nothing Supabase reaches a browser.** No URL, no anon key, no `supabase-js` in
  either Angular app. The Worker owns the credentials, set with `wrangler secret put`
  and never written into the committed `wrangler.jsonc`.
- **Do not port `arreglo_permisos_final.sql`.** It opens `SELECT` on the whole bucket
  to `public`; anyone with the anon key could read every INE photo. It existed because
  the browser talked to Supabase directly. It no longer does.
- **Email never fails a request.** Resend is called after the write succeeds; failures
  are logged and swallowed.
- **Design tokens and API types exist in both Angular apps, by decision.** They drift
  silently; `01-conventions.md` §3 and `02-api-contract.md` are the referees. A PR
  changing one copy must change the other.
- **Spanish (es-MX) with accents — they are not optional.** `Identificación`,
  `crédito`, `teléfono`, `domicilio`, `próximo`. A missing tilde on a loan application
  reads as carelessness about people's money.

## Build + verification

- `npm run build` green in **every project you touched** before closing a checkpoint.
- Backend: `npm run typecheck` passes and `wrangler dev` serves `/health`.
- Load the `cloudflare`, `wrangler` and `workers-best-practices` skills before touching
  the Worker. Guessing at `wrangler.jsonc` costs more time than reading them.
- No screenshots unless asked (the owner watches :4200).

## Tonight

The plan is tiered **P0 / P1 / P2** and sorted so that running out of hours costs the
least. Build in order. Do not work ahead into P2 because it is more interesting. If a
checkpoint is blocked, skip it, note the skip in the PR, and move on.
