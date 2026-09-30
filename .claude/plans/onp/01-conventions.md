# ONP FER — conventions

Authoritative. Where this file and `.claude/skills/onp-design` disagree, **this file
wins** and the skill is corrected in the same commit.

Lineage: these rules descend from the `manttio-whitelabeled/superadmin` conventions and
the `manttio-design` skill. Deviations are listed at the bottom with an owner and a
date, per that skill's own rule — *an undocumented divergence is drift; a documented one
is a decision.*

---

## 1. The product

A loan application (`solicitud de crédito`) for **ONP FER, S.A. de C.V., SOFOM, E.N.R.**
A prospect completes 28 screens on a phone: simulator, registration, OTP, four form
screens, PEP declarations, a legal declaratoria, INE photo capture with OCR, document
uploads, biometrics, video, and a drawn signature. Staff use a 3-screen admin panel.

It collects CURP, RFC, INE images, geolocation at four moments, income, and a signature.
That is regulated personal data under the LFPDPPP. **Treat every field as PII.** Never
log a form value, never put one in a URL, never send one to a third party.

---

## 2. Typography

| Role | Face | Applies to |
|---|---|---|
| Headings — `h1`, `h2`, `h3` | **Charis SIL** (400/700, serif) | page and section titles, admin panel headings |
| Body, UI, numerals, labels | **Archivo** (variable 100–900) | everything else |

This maps the source 1:1: Charis SIL takes the role Source Serif 4 held, Archivo takes
IBM Plex Sans'. Loaded by CDN `@import` in `web-app/src/styles.css` — see Deviation D1.

**Confirmed by the owner, 2026-09-30:** Charis SIL for main headings, Archivo for the
declaratoria and all body copy. The 290 lines of legal text are set in Archivo.

Weight ladder: **400 body · 500 labels · 600 headings and buttons · 700 wordmark.**
Set `font-synthesis-weight: none` on headings; a browser faking a weight is a defect.

Type scale, ported from the source and kept small because the viewport is 390px:

| Token | Size | Used for |
|---|---|---|
| `topbar` | 14px / 600 Charis | the sticky bar title |
| `h2` | 18px / 700 Charis | screen title |
| `h3` | 14px / 700 Charis | section heading inside a screen |
| `lede` | 13px / 1.6 Archivo | the paragraph under a screen title |
| `body` | 13px Archivo | inputs, list copy |
| `label` | 12px / 600 Archivo | field labels, checkbox and radio copy |
| `status` | 11px / 500 Archivo | inline validation and status lines |

**Never a small uppercase letterspaced label above a heading.** No kickers, no eyebrows.
The ban covers section `h2`s, not just the `h1`.

**Never `text-transform` legal text.** The declaratoria, the aviso de privacidad and the
términos render exactly as authored. `capitalize` is not a softer option.

Still allowed: table `<th>`, footer column headings, and micro-labels inside a data
surface (a stat tile caption in the admin panel).

---

## 3. Colour

ONP FER's own identity, ported verbatim into Tailwind 4 `@theme` as real tokens. Single
tenant — no `--brand-*` indirection, no theming layer.

| Token | Value | Role |
|---|---|---|
| `navy` | `#1c3352` | topbar, primary button, headings |
| `navy-deep` | `#0e2036` | heading text, primary hover |
| `gold` | `#9c7a3c` | accent rule, leyenda border |
| `gold-light` | `#c6a866` | progress fill |
| `bg` | `#f6f4ef` | page ground (warm cream, not white) |
| `surface` | `#ffffff` | cards |
| `text` | `#1a1c1f` | body |
| `text-soft` | `#525a66` | lede, secondary |
| `border` | `#e8e4d9` | hairlines, input borders |
| `success` | `#1e6b45` | |
| `error` | `#8a2a2a` | required marker, validation |
| `warning` | `#8a5a1c` | PEP section, pending status |

**No hex in a template, ever.** Tokens only. If a value is missing from the table, add
it to the table first.

Light mode only — the source has no dark mode and a single-tenant demo does not need
one. Do not add `prefers-color-scheme` blocks; they will drift untested.

---

## 4. Shape and elevation

Radius keyed to what the element *is*, never one token everywhere:

| Token | Value | Applies to |
|---|---|---|
| `control` | `6px` | inputs, buttons, alerts, status chips |
| `card` | `8px` | cards, modal box, preview boxes, camera wrap |
| full | `999px` | the topbar back button and chrome icon-circles **only** |

Buttons are rounded rectangles, not pills.

Elevation ladder, used by meaning: `e1` in-flow card · `e2` raised/hover · `e3` modal
over content · `ring` hairline separation. The source leans almost entirely on `ring`
(1px borders on cream) — keep that restraint. The same shadow on every surface means
nothing.

---

## 5. Layout

- The app shell is `width: 100%; max-width: 390px; margin: 0 auto; min-height: 100dvh`,
  a column: sticky topbar → progress bar → scrolling body. Use `100dvh`, not `100vh` —
  the source's `100vh` breaks under mobile Safari's collapsing toolbar.
- Body padding `24px 20px 40px`. Cards `16px`. Fields `14px` apart.
- **Tap targets are at least 44×44px.** The source's 32px back button and 16px
  checkboxes fail this; fix them in the port rather than reproducing the defect.
- Inputs must not trigger iOS zoom: never below 16px computed font-size on a focusable
  input, even though the visual scale says 13px — use a transform or accept 16px.
- Simple fixed sizing beats layout machinery. Never shell-layout surgery for one
  screen's sizing.

---

## 6. Angular

Angular 21, standalone, signals, **zoneless**. No NgModules.

- `ChangeDetectionStrategy.OnPush` on every component.
- `input()` / `output()` / `model()` functions — never the decorators.
- Control flow `@if` / `@for` / `@switch` — never `*ngIf` / `*ngFor`.
- `inject()` over constructor parameter injection.
- No logic in templates. A computed signal or a pure pipe in `app/pipes/`.
- One component per file, one concern per component. A wizard step is a component;
  the thing it renders is composed of primitives.
- Lazy-load every route with `loadComponent`.

### Folder layout (`web-app/src/app/`)

```
core/            app-wide singletons: interceptors, error handling, config
guards/          one guard per file
layout/          app shell, topbar, progress bar
model/
  constants/<entity>/    one constant per file (estados, vialidades, ambitos-pep…)
  interfaces/            Expediente, Solicitud, Producto, Ajustes…
pages/
  solicitud/<step>/      one folder per wizard step
  admin/<section>/
pipes/           pesos, curp-format, fecha-mx…
services/
  http/          one service per backend resource
  domain/        amortizacion, cat, curp, rfc, geolocalizacion
state/           NGXS states, actions, selectors
ui/              the design-system primitives
```

**Never create `index.ts` barrels.**

---

## 7. NGXS

NGXS **21.0.0** — pinned. `@ngxs/store@22` requires `@angular/core >=22`, and this
project is Angular 21.2. Do not bump NGXS without bumping Angular first.

States, each in `state/<name>/`:

| State | Holds |
|---|---|
| `SolicitudState` | the expediente: generales, domicilio, contacto, laborales, PEP, propietario real |
| `SimuladorState` | monto, plazo, tasa, pago, CAT, comisión, product parameters |
| `SesionState` | prospect session, OTP status, `esCliente`, folio |
| `IdentidadState` | INE photos, OCR results, documents, biometrics, video, signature |
| `NavegacionState` | reached steps, current step, progress — what the guard reads |
| `AdminState` | panel session, expediente list, filters, producto, plantillas |

Rules:

- Actions are classes with a `static readonly type` in `'[Context] Verb'` form.
- **State is immutable.** `patchState` / `setState` with fresh objects; never mutate.
- Selectors are `@Selector()` or `createSelector` — never a component reaching into
  `store.snapshot()` to read.
- Side effects live in the state's action handler, which calls an http service and
  returns the observable. Components dispatch and subscribe to selectors; they do not
  call http services directly.
- **Never persist PII.** `@ngxs/storage-plugin`, if used at all, is restricted to
  `NavegacionState` and `SimuladorState`. The expediente never touches localStorage or
  IndexedDB — the backend is the only place it lands. (This reverses the source, which
  wrote base64 INE photos into IndexedDB.)
- Devtools plugin in development only.

---

## 8. Forms

Reactive Forms, typed, **one `FormGroup` per step**.

- The step builds its `FormGroup` from the store's current value on init, and dispatches
  on valid submit. Back-navigation rehydrates from the store.
- Validators live in `services/domain/` as pure functions and are unit-tested: CURP
  (18 chars + check digit), RFC (13 for PF), código postal (5 digits), teléfono
  (10 digits), fecha as a day/month/year trio.
- **Conditional required-ness is declared, not inferred.** The source walks the DOM
  asking `estaVisible(el)` to decide what is required (`:3987`). Replace it with
  explicit validators toggled by `setValidators` when the controlling answer changes —
  PEP vigente, propietario real / tercero, tipo de identificación.
- The required marker is the label's `::after` asterisk in `error`, plus
  `[attr.aria-required]` — the asterisk alone is not accessible.
- Validation messages appear inline under the field, in Spanish, naming the field:
  *"Escribe tu CURP a 18 caracteres."* Never "Campo inválido."

---

## 9. Accessibility

- Every input has a real `<label for>`. Placeholders are never labels.
- The step title is an `<h1>` per route and receives focus on navigation, so a screen
  reader announces the new step.
- Progress bar carries `role="progressbar"` with `aria-valuenow`/`min`/`max`.
- The modal traps focus, closes on Escape, restores focus to its trigger, and is
  `role="dialog" aria-modal="true"` with `aria-labelledby`.
- Error summaries are `role="alert"`; status lines are `aria-live="polite"`.
- The OTP inputs are six controls with one accessible group label, and accept a pasted
  six-digit code — the source already does this well (`:2753`), keep it.
- Colour never carries meaning alone — the status lines pair colour with an icon.
- Visible focus ring on everything focusable. Never `outline: none` without a
  replacement.
- The hidden admin entry (2-second long-press on the title) is a demo affordance, not a
  control — it must not be in the tab order, and the admin panel must also be reachable
  at `/admin` directly.

---

## 10. Backend (`backend/`)

Hono **4.13.11** on Node. TypeScript, ESM.

- **Every secret comes from an env var.** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
  `JWT_SECRET`, `DEMO_MODE`, `PORT`, `CORS_ORIGIN`. Ship a `.env.example` with every
  key and no value. `.env` is gitignored. No credential literal in source, ever — the
  source HTML's admin-panel-configured connection string is gone.
- One route file per resource in `src/routes/`, mounted in `src/app.ts`.
- **Zod on every request body and every response.** The schemas in `src/schemas/` are
  the API contract.
- Errors return a single envelope: `{ error: { code, message } }`, message in Spanish,
  never echoing a Supabase error verbatim to the client (log it server-side instead —
  the source leaks RLS messages to the UI at `:3013`).
- The Supabase client is constructed once in `src/lib/supabase.ts` with the service
  key and is never exported to a route that does not need it.
- `src/services/` holds the logic (otp, ocr, plantillas, expedientes); routes stay thin.
- Rate-limit the OTP endpoints. An unthrottled OTP endpoint is an SMS-bill attack.
- Structured logging with request ids. **Never log a request body** — see §1.

### Data model (ported from the source's Supabase usage)

Tables: `sofoms`, `usuarios_panel`, `expedientes`, `propietarios_reales`, `archivos`,
`documentos`, `plantillas`, `bitacora`. View: `v_lista_expedientes`. Storage bucket:
`expedientes`, path `{folio}/{tipo}.{ext}`.

`archivos` rows carry `tipo`, `ruta`, `nombre_original`, `tipo_mime`, `tamano_bytes`,
`hash_sha256`, `capturado_en`. **Keep the SHA-256** — it is the evidentiary value of
the whole exercise.

Migrations live in `backend/supabase/migrations/`, numbered and forward-only.
`../ONP/arreglo_permisos_final.sql` documents the storage RLS problems the original hit
(`storage.prefixes` needs its own policies; policies scoped to `anon` break once a panel
session exists) — read it before writing bucket policies, then supersede it: with the
service key server-side, the bucket should not be publicly writable at all.

---

## 11. Spanish copy

es-MX. **Accents are not optional.** The source is well-written — port its strings
verbatim, including the legal text, and do not "improve" them.

No invented numbers. The CAT, the pago mensual and the comisión are computed, never
illustrated with a made-up figure. The catálogo's worked example is derived from the
live product parameters (`:2220`) — keep it that way.

Where the source labels something *"Modo demostración"*, that label stays and stays
honest.

---

## 12. Deviations from `manttio-design`

| # | Deviation | Reason | Owner | Date |
|---|---|---|---|---|
| D1 | Fonts load by Google Fonts CDN `@import`, not self-hosted `@fontsource` | Owner's explicit call; this is a demo with no offline requirement. `@fontsource/charis-sil@5.3.0` exists if this is ever revisited | owner | 2026-09-30 |
| D2 | Headings are Charis SIL, not Instrument Sans | Different company. ONP FER's identity is a serif heading over a cream ground; Instrument Sans is Manttio's | owner | 2026-09-30 |
| D3 | Colour is hard-coded to ONP's navy/gold rather than built from `--brand-*` | Single tenant. The whitelabel indirection has no second tenant to serve | owner | 2026-09-30 |
| D4 | Tailwind 4, not 3.4 | The repo was scaffolded on 4 and nothing in the ruleset depends on 3.4 | owner | 2026-09-30 |
| D5 | PrimeNG only in the admin panel, not the prospect flow | A 390px consumer wizard uses nothing PrimeNG is good at; the admin `p-table` does | owner | 2026-09-30 |
| D6 | The mocked biometric confidence (`"98%"` / `"95%"`) is kept verbatim | Owner's call: this is a demo, and the figure sits behind a "Modo demostración" label. It is the one carve-out from "no invented numbers" — everything financial stays computed | owner | 2026-09-30 |

No open questions. The Charis SIL / Archivo split was confirmed by the owner on
2026-09-30 and is recorded in §2.
