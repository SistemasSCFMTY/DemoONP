# ONP FER — conventions

Authoritative. Where this file and `.claude/skills/onp-design` disagree, **this file
wins** and the skill is corrected in the same commit.

Lineage: these rules descend from the `manttio-whitelabeled/superadmin` conventions and
the `manttio-design` skill. Deviations are listed at the bottom with an owner and a
date, per that skill's own rule — *an undocumented divergence is drift; a documented one
is a decision.*

---

## 1. The product

A loan application (`solicitud de crédito`) for Mexican SOFOMs. A prospect completes
28 screens on a phone: simulator, registration, OTP, four form screens, PEP
declarations, a legal declaratoria, INE photo capture with OCR, document uploads,
biometrics, video, and a drawn signature.

**A demo, presented 2026-10-01.** Built in a day, deployed, single tenant. That is
context for every trade-off below, not an excuse for the ones marked non-negotiable —
the PII rules hold regardless of how long the thing lives.

**Three independent projects**, no shared package:

| Project | Stack | Deploys to |
|---|---|---|
| `web-app/` | Angular 21 + NGXS 21 + Tailwind 4, no PrimeNG | Cloudflare Pages |
| `superadmin-app/` | Angular 21 + NGXS 21 + Tailwind 4 + PrimeNG 21 | Cloudflare Pages |
| `backend/` | Hono 4 on Cloudflare Workers + Supabase + Resend | Cloudflare Workers |

**One whitelabel, one config file.** `web-app/src/app/brand.config.ts` holds razón
social, nombre comercial, domicilio, logo and the palette. No `sofoms` table, no tenant
switcher, no admin UI for branding, no multi-tenancy. Swapping client means editing one
file — which is the whitelabel story, told without building the machinery.

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
| `wordmark` | 27px / 700 Charis | the portada wordmark, **and nowhere else** |
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

Tinted grounds, added in CP-F2. The source paints alerts with raw hex, and its info
blue (`#e3f2fd` on `#1565c0`) is Material's — a colour from a different company. Each
of these is a low-chroma wash of a palette colour, so an alert reads as this product
rather than as a framework default:

| Token | Value | Role |
|---|---|---|
| `surface-warning` | `#fdf6e3` | `alert.warning`, the "Modo demostración" tips, a filled OTP box |
| `surface-info` | `#eef2f7` | `alert.info` |
| `surface-success` | `#eef6f1` | a field the OCR filled |
| `surface-muted` | `#f9f8f5` | `leyenda`, `pep-section`, the "entre calles" fieldset |

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

## 5. Layout (`web-app/`)

`superadmin-app/` is desktop-first and does not use this shell — see §12.

- The app shell is `width: 100%; max-width: 390px; margin: 0 auto; min-height: 100dvh`,
  a column: sticky topbar → progress bar → scrolling body. Use `100dvh`, not `100vh` —
  the source's `100vh` breaks under mobile Safari's collapsing toolbar.
- Body padding `24px 20px 40px`. Cards `16px`. Fields `14px` apart.
- **Tap targets are at least 44×44px.** The source's 32px back button and 16px
  checkboxes fail this; fix them in the port rather than reproducing the defect.
- **Short fields pair two-per-row; long ones keep the row.** A 28-screen form at
  390px is a lot of scrolling, and pairing the genuinely short fields — código
  postal, número exterior/interior, the two teléfonos, país, the INE year and
  emission number — takes a visible bite out of it. Anything long or variable keeps
  the full width: domicilio, nombre completo, CURP, RFC, correo, colonia, municipio,
  ciudad, empresa, puesto, referencias, entre calles. Halving one of those only means
  the text scrolls out of sight while it is being typed.
  Pairing goes through `ui/onp-fila`, never hand-rolled per screen — there are four
  form screens plus the propietario real's copy of the same blocks, and hand-paired
  rows drift. The threshold is `--breakpoint-xs` (360px): 390 and 375 get two
  columns, **320 collapses to one**, because a two-column row that overflows on a
  small phone is worse than the column it replaced. This is a density change inside
  the 390px shell, not a desktop layout.
- **Field blocks shared between screens live in `pages/solicitud/bloques/`.** The
  applicant and the propietario real fill the same four groups; the source has two
  copies of that markup and they have already drifted (departure 16). One component,
  two `idPrefijo` values.
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
- **Markup lives in a `.html` file beside the class — `templateUrl: './x.html'`, never
  an inline `template:`.** Named for the `.ts`, so `topbar.ts` has `topbar.html`. A
  template literal buried in a decorator gets no HTML tooling: no formatter, no
  Angular language service on some setups, no clean diff when one attribute changes.
  It also hides the size of a screen behind a class that looks small. The rule is
  every component, including the one-line `<ng-content />` wrappers, because "some of
  them have a file" means nobody knows where to look. Owner, 2026-09-30.
  The exception is a **test host** inside a `.spec.ts`: it is a fixture, it belongs
  with the assertions it serves, and a second file would be indirection for nothing.
  `styles:` stays inline — the amount is small and it is not what was asked for.
- Lazy-load every route with `loadComponent`.
- **A `computed` derives; it never writes.** No `signal.set()` / `.update()` inside a
  `computed` — not directly and not through a helper it calls. Angular throws NG0600
  and, because the template reads the computed during the update pass, the throw
  aborts that pass *mid-traversal*: the static markup from the create pass is already
  in the DOM, so the screen renders with blank interpolations and unapplied `[class]`
  bindings and looks like a stylesheet that failed to load. It cost an afternoon on
  `bloque-generales` — `estadoCurp` called a one-time initialiser that set a signal,
  and `form-generales` and `declaratoria` both shipped to Pages broken. One-time setup
  that needs the inputs goes in `ngOnInit`; anything reacting to a change goes in an
  `effect`. Owner, 2026-09-30.
- **An element a `viewChild` must reach before an `await` stays mounted, hidden with
  a class.** Not `@if`. Zoneless Angular gives no guarantee that a view created by a
  signal write exists by the next statement, so `grabando.set(true)` followed by
  `this.visor()` is a race that passes locally and fails on a slower phone. The
  videograbación's live preview keeps its `<video>` in the DOM and toggles
  `[class.hidden]`; `captura-lado` gets away with `@if` only because it awaits
  `getUserMedia` first and then uses `queueMicrotask`, which is luck, not design.
  Established in CP-V2, 2026-09-30.
- **A component whose markup is real gets a render test**, not only unit tests of the
  functions behind it. The CURP logic had full coverage and every test passed while
  the screen was unrenderable, because nothing ever mounted the component. Assert that
  nothing reached the `ErrorHandler` *and* that a binding resolved — Angular reports a
  template error and leaves the half-updated DOM standing, so "it did not throw" on
  its own proves nothing.

### Folder layout (`web-app/src/app/`; `superadmin-app/` mirrors it)

```
core/            app-wide singletons: interceptors, error handling, config
guards/          one guard per file
layout/          app shell, topbar, progress bar
model/
  constants/<entity>/    one constant per file (estados, vialidades, ambitos-pep…)
  interfaces/            Expediente, Solicitud, Producto, Ajustes…
pages/
  solicitud/<step>/      one folder per wizard step
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


`superadmin-app/` has its own store — `PanelState` (session) and `ExpedientesState`.
It does not share a state file with `web-app/`; they are separate applications.

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
  *"Escribe tu CURP a 18 caracteres."* Never "Campo inválido." The message lives on the
  validator's own error object and `onp-field` renders it, so adding a rule is not also
  editing a lookup table somewhere else.

Two more, established in CP-F7/F8 and worth stating because both are easy to get wrong
the other way:

- **A conditional block that does not apply is not rendered, and its form does not
  exist.** The propietario real's four groups are built when "tercero" is chosen and
  discarded when it is not. A form behind a hidden div still holds values, still
  reaches the payload, and still needs someone to remember to clear it — which is how
  an expediente ends up recording a public office for a person who declared they hold
  none. Where a block must stay mounted (the PEP details), answering "No" clears it.
- **A generated field only overwrites itself.** `form-generales` fills the CURP from
  the name and birth date, and stops the moment the prospect edits it. The source
  regenerates on every keystroke and silently undoes their correction.

---

## 9. Accessibility

- Every input has a real `<label for>`. Placeholders are never labels.
- The step title is an `<h1>` per route and receives focus on navigation, so a screen
  reader announces the new step. It is the **screen** title, inside the body, set at
  the `h2` size token — the topbar's text is chrome and must not be a second `<h1>`.
  `ui/onp-titulo` is that element and handles the focus, so no page implements it.
- The modal is the native `<dialog>`, which supplies the focus trap, the inert
  background and Escape-to-close. Do not hand-roll one.
- Progress bar carries `role="progressbar"` with `aria-valuenow`/`min`/`max`.
- The modal traps focus, closes on Escape, restores focus to its trigger, and is
  `role="dialog" aria-modal="true"` with `aria-labelledby`.
- Error summaries are `role="alert"`; status lines are `aria-live="polite"`.
- The OTP inputs are six controls with one accessible group label, and accept a pasted
  six-digit code — the source already does this well (`:2753`), keep it.
- **A button waiting on the network says so, and keeps saying it.** `onp-button` has
  `cargando` for a request in flight and `deshabilitado` for a gate the prospect has
  not met. They render the same grey button and mean opposite things — "wait" versus
  "do something first" — so never OR them into one input; `cargando` disables on its
  own. `cargando` adds the spinner, `aria-busy="true"`, and blocks a second click,
  which on the submit is not cosmetic: two clicks are two expedientes for one person.
- **The spinner is the enhancement, the label is the signal.** The global
  `prefers-reduced-motion` floor sets `animation-iteration-count: 1`, so an infinite
  spinner would stop after one turn, and a stopped spinner reads as a hung request —
  the exact thing it exists to deny. Under reduced motion it is hidden outright and
  the label ("Enviando tu solicitud…") carries the state. Any future busy indicator
  obeys the same rule: never ship motion as the only way to tell that something is
  still happening.
- Colour never carries meaning alone — the status lines pair colour with an icon.
- Visible focus ring on everything focusable. Never `outline: none` without a
  replacement.
- The hidden admin entry (2-second long-press on the title) is a demo affordance, not a
  control — it must not be in the tab order, and the admin panel must also be reachable
  at `/admin` directly.

---

## 10. Backend (`backend/`)

Hono **4.13.11** on **Cloudflare Workers**. TypeScript, ESM. Load the `cloudflare`,
`wrangler` and `workers-best-practices` skills before touching it.

- **Every secret is a Worker secret**, set with `wrangler secret put`:
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `JWT_SECRET`,
  `RESEND_API_KEY`, `DEMO_SOFOM_ID`. `DEMO_MODE` is the one plain `var`.
  **Never in `wrangler.jsonc`** — that file is committed. Ship a `.dev.vars.example`
  listing every key with no value; `.dev.vars` is gitignored (that exact filename —
  wrangler reads no other). No credential literal in source, ever; the source HTML's
  admin-panel-configured connection string is gone.
  **Both Supabase keys are server-side.** The publishable one too: it exists for a
  single `signInWithPassword` call and never leaves the Worker. "Publishable" is
  Supabase's name for it, not an instruction.
- **What cannot run in a Worker.** Tesseract OCR cannot: the WASM core plus a ~15MB
  `traineddata` blow past the 3MB/10MB bundle cap and the CPU budget. OCR therefore
  runs in the browser, as the source already does it. `html2pdf` likewise. This
  reverses an earlier decision and is forced by the platform, not preferred.
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
- CORS allows exactly the two Pages origins. Not `*`.
- **Email never fails a request.** Resend is called after the write succeeds; a failure
  is logged and swallowed. A prospect whose application was accepted must not see an
  error because a mail API was slow.
- Structured logging with request ids. **Never log a request body** — see §1.

### Data model (ported from the source's Supabase usage)

Tables: `expedientes`, `propietarios_reales`, `archivos`, `documentos`,
`usuarios_panel`. Storage bucket `expedientes`, path `{folio}/{tipo}.{ext}`.
**No `sofoms` table** — single tenant. `plantillas` and `bitacora` only if the P2
checkpoints survive.

`archivos` rows carry `tipo`, `ruta`, `nombre_original`, `tipo_mime`, `tamano_bytes`,
`hash_sha256`, `capturado_en`. **Keep the SHA-256.** It is the evidentiary value of the
whole exercise and it costs one function call.

Migrations live in `backend/supabase/migrations/`, numbered and forward-only — and
**idempotent and additive**, because they run against a database that already exists
and whose exact state we cannot see. `create table if not exists`,
`add column if not exists`, `drop policy if exists` before each create. Never drop,
never recreate. `backend/supabase/verificacion.sql` reads and nothing else; run it
first.

**The database was already there.** Probed read-only 2026-09-30: nine tables,
`expedientes` with 106 columns, the `expedientes` bucket private, one active SOFOM and
one active panel user. Our job is to write against it, not to create it.

**Three Postgres enums, and the contract had two of them wrong.** A value outside an
enum is not a validation error — it is a 500 from the insert, halfway through a
submission whose photos already uploaded.

| Enum | Values |
|---|---|
| `estado_expediente` | `borrador · pendiente · revision · aprobado · rechazado · cancelado` |
| `rol_usuario` | `administrador · analista · consulta` |
| `tipo_archivo` | `id_frente · id_reverso · firma · video_identificacion · huella · rostro · comprobante_domicilio · constancia_curp · constancia_fiscal · constancia_fea · poder_notarial · id_propietario_real · domicilio_propietario_real · otro` |

It is **`revision`**, not `en_revision`. And **none of the contract's eight `doc_*`
part names exist in `tipo_archivo`** — the Worker maps them on the way in
(`src/schemas/comunes.ts`); the multipart part names stay as the contract has them,
because `web-app/` is built against those.

**`expedientes.sofom_id` is NOT NULL with an FK** and is a leftover of the multi-tenant
stage. We are single-tenant and do not manage `sofoms`, so the Worker fills it from the
`DEMO_SOFOM_ID` secret. **Without that secret no submission works at all.**

**Staff passwords live in Supabase Auth**, not in `usuarios_panel` — that table is the
profile (`rol`, `activo`, `nombre_completo`) and has no password column. The Worker
calls `signInWithPassword` with the publishable key, checks the profile with the secret
key, mints **its own** HS256 JWT signed with `JWT_SECRET`, and discards the Supabase
session. **This API never validates a Supabase-issued token — no JWKS anywhere.**

**Scope every tenant query to `DEMO_SOFOM_ID`, and never take a sofom id from the
client** — not from a path, a body or a header. `lib/tenant.ts` is the single place it
comes from. We are single-tenant, but the tables kept `sofom_id` from when we were not:
if that value could arrive from outside, anyone with a session could read another
SOFOM's expedientes by changing a uuid. That only one row exists today is a property of
the data, which changes; scoping makes it a property of the code, which does not.

**Untrusted HTML is stored verbatim, never half-cleaned.** `plantillas.contenido_html`
arrives from a browser (the panel unzips the `.docx`) and is rendered by the panel
later. The Worker checks it is a string and caps its size, and stores exactly what it
got. A partial sanitiser on the write path is worse than none: it misses things *and*
it persuades the next reader that the column is safe. Sanitising belongs to whoever
renders. Nothing in the backend may render such a column, put it in an email, or serve
it as `text/html`.

**Writes on the panel's Formatos and Ajustes need `rol === 'administrador'`, re-read
from the database** — not taken from the token. The session lives eight hours;
deactivating an account or demoting a role has to bite immediately. The token's `rol`
is for deciding which buttons to paint, which is interface convenience, not
authorisation. 403 uses code `NO_AUTORIZADO`, same as 401: the code list in
`02-api-contract.md` is frozen, and the HTTP status is what separates "log in again"
from "logging in again will not help".

**Write `historial_estados` on every estado change.** The table already exists
(`expediente_id`, `estado_anterior`, `estado_nuevo`, `motivo`, `usuario_id`,
`creado_en`). An audit table nobody fills is worse than no audit table: it looks like
there is a record.

**Do not port `../ONP/arreglo_permisos_final.sql`.** It grants `SELECT` on the whole
`expedientes` bucket to `public` and `INSERT with check (true)` on five tables — so
anyone holding the publishable key can read every INE photo and signature in the
bucket. It was written to unblock a browser client talking to Supabase directly, and
none of our three projects is one.

**But the original single-file app still is, and it still runs against this database.**
So the revocation is its own migration, `0002_cerrar_acceso_publico.sql`, clearly
marked as breaking that app, and **the owner decides when to run it**. It is not a
prerequisite for us: `service_role` bypasses RLS, so the Worker works either way. What
it buys is closing the read hole, not unblocking us.

Read that file for the trap it documents — `storage.prefixes` needs a policy per folder
level, which is why the storage path stays one level deep, `{folio}/{tipo}.{ext}` —
then supersede it.

---

## 11. Spanish copy

es-MX. **Accents are not optional.** The source is well-written — port its strings
verbatim, including the legal text, and do not "improve" them.

No invented numbers. The CAT, the pago mensual and the comisión are computed, never
illustrated with a made-up figure. The catálogo's worked example is derived from the
live product parameters (`:2220`) — keep it that way.

Where the source labels something *"Modo demostración"*, that label stays and stays
honest.

**The label describes this run, not the build.** Where a capability can fall back at
runtime — the videograbación records for real, but not on a browser without a codec,
not with the `grabarVideo` kill switch off, and not when the prospect declines the
camera — the note is bound to what actually happened on the attempt, and to nothing
else. Before the first attempt it reflects the injected implementation; after one it
reflects the result. Binding it to a build flag alone makes it lie in exactly the case
it exists for. And the reasons get their own sentence: "no pudimos usar la cámara" and
"este navegador no puede grabar" are different facts, and a prospect can act on only
one of them. Established in CP-V2, 2026-09-30.

**A runtime fallback is never silent and never a dead end.** A denied camera permission
on a screen whose `Continuar` is gated on the capture would strand someone on step 25
of 28. The failure is stated in words they can act on, and an explicit second control
carries them on without the artifact — their choice, visible, rather than a fallback
that quietly fakes the thing.

**A degraded submission says what it dropped, and says it where the person will read
it.** `POST /solicitudes` retries once without the `video` part when the first attempt
dies on the wire — the recording is ~97% of that request (1,665,296 bytes against 4–7 KB
per file, measured on folio `ONP-260930-6659`), so dropping it is the difference between
an expediente and none. The prospect is told while the second attempt is in flight *and*
on screen 28, which is the screen they keep: the application was received, the recording
was not attached. Never wording that lets them believe the video is there.

**And a write is retried only on a failure that proves it never landed.** Only
`status === 0` — a transport failure the browser itself reported. Any status the Worker
answered with, 5xx included, is refused: a 500 raised after the `expedientes` row was
written is indistinguishable from one raised before it, and a blind second attempt
leaves two folios, two sets of KYC files and an analyst who cannot tell which is real.
No client-side timeout either — aborting a slow-but-working upload manufactures that
same duplicate. The clean fix is an idempotency key the Worker honours; until `backend/`
has one, this is the safe subset. Established in CP-V4, 2026-09-30.

---

## 12. The staff panel (`superadmin-app/`)

A separate deployable application, not a route inside `web-app/`. The folder keeps its
name; the cross-SOFOM tier it was briefly planned as is gone with the single-tenant
descope. No SOFOM management, no panel-user management, no cross-tenant search.

**Desktop-first, but it must not break on a phone.** Owner, 2026-09-30, reversing the
earlier "the one surface that is not mobile-first". Stakeholders open the panel on
their own phones, so a rail pinned at 15rem leaving 150px of table is not a defensible
answer. Desktop stays the surface the design is decided at — desktop reading sizes,
desktop density, no 390px shell and no pretending this is a consumer flow — and below
`lg` the layout has to hold.

What that means concretely:

- **The nav rail collapses below `lg` (64rem).** At `lg` and up it is a column of the
  shell grid, exactly as before. Below it, a top bar with a menu button and an
  off-canvas drawer: backdrop, Escape, closes on navigation, focus moves in and back
  out. `visibility` carries the open state and not the transform alone — a drawer only
  translated off-screen keeps its links in the tab order.
- **The geometry lives in `styles.css`**, under "The shell, and the rail that
  collapses", so the rail width and the breakpoint have one definition each and the
  drawer cannot disagree with the `lg:hidden` top bar. It also keeps
  `grid-cols-[15rem_1fr]` out of the markup, which CLAUDE.md forbids.
- **Tables are the only thing allowed to scroll sideways**, and they scroll because
  `.p-datatable-table` has a `min-width` floor. Without one a table just compresses its
  columns into ellipses and nothing ever overflows. Everything else reflows: gutters
  are `px-4 sm:px-8`, and no page may scroll horizontally at any width.
- **The bar to clear is measured, not eyeballed:** at 320, 360, 390, 414, 768, 1024 and
  1280, `scrollingElement.scrollWidth` equals `clientWidth` on every route, and the
  only element in the document with `overflow-x: auto` and real overflow is the table
  container.

Everything else about the design language is shared and unchanged: Charis SIL headings,
Archivo body, the §3 tokens, the §4 ladders, Lucide icons, Spanish copy with accents. A
different component library is not permission to look like a different company.

PrimeNG lives here and only here, preset-first: stock Aura plus an ONP preset built from
the §3 tokens. Never a `theme/` override sheet for looks; a sheet is only for layout
integration, and every one opens with a comment saying why it exists. Tabular data is a
`p-table` — header/body templates, `rowHover`, whole-row click into detail,
`[scrollable]` + `scrollHeight`, `emptymessage`. Filters persist as URL query params,
`queryParamMap` the single load path.

**The expediente detail view is the payoff shot of the demo** — the submission the
audience just watched being made, arriving with its photos and signature. It is also
the screen that displays the most PII in the product: no field value in a URL, none in
a log, none in an analytics event, and signed URLs short-lived and never persisted.

### Settled in CP-S1 – CP-S3

These were decided while building the panel. They are conventions now, not choices to
revisit per screen.

**Type size.** The §2 scale is the *390px* scale. The panel reads body at 14px and
uses Tailwind's standard scale for desktop headings — page `h1` at `text-2xl`, section
headings at `text-base`, rows at `text-sm`, chips and hashes at `text-status`. Same
faces, same weights, same tokens; a desktop reading distance is not a different design
language. The `@theme` token block stays byte-identical to `web-app/`'s — panel-only
rules go **below** it in `styles.css`, under a banner saying so.

**PrimeNG cascade layers.** `styles.css` opens, above the imports, with
`@layer theme, base, primeng, components, utilities;` and `providePrimeNG` passes the
same order as its `cssLayer`. That puts PrimeNG below Tailwind's utilities, so a
utility class wins without `!important`. The two must be changed together.

**Estado slugs.** `borrador | pendiente | revision | aprobado | rechazado |
cancelado` — the Postgres enum `public.estado_expediente`, verbatim. Labels are Spanish
for a human and need not match the slug: "En revisión" reads better than "Revisión" and
transmits as `revision`. Short form in the table badge, long form in the detail
selector; the four the source defines keep its wording.

**The database is the referee over the contract.** The first
`02-api-contract.md` listed four estados and spelled the third `en_revision`; the panel
followed it, and the deployed Worker rejected every estado change. Nothing in either
type system could catch it — both sides type-checked against a wrong agreement. The
contract was corrected from the live database in PR #4, and
`estados-expediente.spec.ts` now writes the enum out as a literal and compares what the
app transmits against it. **Where a value crosses into Postgres, pin it in a test.**

**An unknown estado degrades visibly.** The source falls back to `pendiente` for an
unrecognised value (`:5444`), which labels a record with a state it is not in. The
panel shows the raw value in a neutral chip instead — legible, and obviously unhandled.
The enum gained two values between the contract being written and the database being
read; this is what stops the next one from quietly mislabelling a KYC file.

**What an operator may assign is narrower than what exists.** The detail selector
offers the four the source offers. `borrador` is the prospect's own unsent draft;
`cancelado` may belong there, but an estado transition is the owner's call and the
source does not answer it. An expediente that arrives in a non-assignable estado shows
it first and disabled, so the control never claims the record is somewhere it is not.

**Estado colour.** Each estado tints a §3 token and pairs it with a Lucide icon, since
colour must not carry meaning alone (§9): `borrador` muted + `PencilLine`, `pendiente`
warning + `Clock`, `revision` navy + `Search`, `aprobado` success + `Check`,
`rechazado` error + `X`, `cancelado` muted + `Ban`. The source's badge palette used
five hexes that are not in §3 — rather than widen a shared palette for one chip, each
estado tints a §3 token, and `revision` reads navy where the source read blue.

**The list's URL contract.** `q`, `estado`, `desde`. `queryParamMap` is the single
load path: a control writes to the URL and nothing else dispatches. `q` is an
operator's own search term and is the only value this app puts in a URL — **no
expediente field value ever is**, and the detail route carries the opaque id alone.

**One API seam.** `PanelApi` is an abstract class with two implementations, chosen in
`app.config.ts` from `environment.usarApiSimulada`. No service holds a base-URL
literal. The mock is a full stand-in, not a happy path: it fails with the same
`{ error: { code, message } }` shape and the same latency.

**No storage plugin in this app, at all.** Not for the expediente, and not for the
signed URLs, which live in `ExpedientesState` for the life of the detail view and are
dropped on destroy.

**"Descargar PDF" in the panel is a print view**, not `html2pdf`. The prospect app
rasterises because it must; a staff tool should not take half a megabyte to do worse
than the browser's own Save as PDF, which keeps the document as selectable text.

**Stored HTML is untrusted on display.** `documentos.contenido_html` is rendered by
the panel's detail view inside an authenticated staff session that can read every
expediente. The source's `llenarPlantilla` (`:3716`) interpolates form values into the
solicitud template without escaping, so a prospect who types `<script>` into a surname
has it stored verbatim — a stored XSS with a payload written by an anonymous stranger.

`web-app/` escapes at generation now, and that is the right fix, but it does not clear
the rows the original single-file app already wrote. So the display side sanitises too,
independently: `DomSanitizer.sanitize(SecurityContext.HTML, …)`, **never**
`bypassSecurityTrustHtml`. One sanitisation point per view, feeding every sink —
including `window.open` + `document.write`, which lands on `about:blank` and therefore
inherits the app's origin. A service that writes HTML it did not sanitise states that
contract at the top of the file, and the caller honours it.

Two properties worth knowing when asserting on this: the sanitiser keeps `class` (so
the `doc-hoja` sheet still styles the document) and returns accented characters as
numeric entities, which the HTML parser decodes on the way back in — the printed
solicitud keeps its accents.

**The `.docx` is parsed in the browser.** JSZip plus a DOM parser is not what a 3 MB
Worker bundle is for, and it is the same platform constraint that keeps Tesseract
client-side (deviation D7). The panel converts the file and sends only the resulting
HTML; the Worker never receives a `.docx`. Both halves of the result are untrusted on
display — the template came out of an uploaded file, the values out of a prospect's
form — so the preview sanitises like every other stored HTML in this app.

**A template cannot contain `{{` as literal text**, and escaping it as `&#123;&#123;`
does not help: Angular decodes HTML entities before it parses interpolation, so the
braces come back and the expression fails to compile. The catalogue of claves builds
those strings in TypeScript, through the `llaves` pipe.

**Evidence media is one element per medium, never one component with a `@switch`.**
`panel-archivo-imagen` paints an `<img>`, `panel-archivo-video` a `<video>`; they share
the signed-URL path through `CargarArchivo` and nothing else. A `<video>` in an
evidence column carries three rules of its own:

- `preload="metadata"`, **never `auto`** — opening an expediente must not pull the
  whole recording. A 25 MB file per expediente an analyst merely glances at is a bill
  and a stall, not a feature.
- `playsinline`, so iOS does not take the player fullscreen on tap.
- `w-full max-w-full` on the element. A replaced element with an intrinsic width is the
  classic way to make a page scroll sideways, and the expedientes table is the only
  thing in this panel allowed to do that.

**Never point the panel at `wrangler dev` and press a write button.** That Worker
talks to the owner's live production Supabase, not a local database: `PUT /sofom`
overwrites the single tenant row whose razón social is printed in every email footer,
and `POST /plantillas` writes rows the panel cannot clean up. Reads and login are
safe and are how the session work was verified. Write paths are unit-tested against
`PanelApiSimulada` — which is the reason to keep it now that the app runs on the real
API — and confirmed against the backend once, deliberately, with the owner's say-so.

### Open question for the owner

**May an operator delete an expediente?** The source offers "Eliminar expediente"
(`:5652`) behind a `confirm()`. There is no delete endpoint in `02-api-contract.md`,
and destroying a KYC file with its evidentiary hashes is not a call to infer. The
button is **not built** until the owner says otherwise. If the answer is yes, it needs
a backend endpoint, a decision on soft versus hard delete, and a bitácora row (CP-B12).

### The duplication policy

Three independent projects, no shared package — the owner's call. The design tokens
exist in two `styles.css` files and the API types in two Angular apps plus the Worker.

**These drift silently; the compiler will not catch it.** §3 and `02-api-contract.md`
are the referees. A PR that changes one copy must change the others in the same PR, and
a reviewer who sees a token changed in one place only should block it.

**Copying a shape is not copying a spelling.** `TipoArchivo` exists in both apps and
means two different lists on purpose:

- In `web-app/` it is the **multipart part name** — what `POST /solicitudes` sends
  (`doc_curp`, `doc_domicilio`, and `video` from CP-V2).
- In `superadmin-app/` it is the **Postgres `tipo_archivo` enum** — what an `archivos`
  row stores and what `GET /expedientes/:id` returns (`constancia_curp`,
  `comprobante_domicilio`, `video_identificacion`). The Worker translates between them
  on the way in, in `TIPO_ARCHIVO_POR_PARTE`.

The panel's copy was the part names until CP-V3, so `NOMBRE_ARCHIVO` was keyed on a
vocabulary the API never sends and eight of the eleven rows in "Archivos recibidos"
rendered with no name at all. The mock spoke the part names too, which is why nothing
caught it: **a mock that is more convenient than the API it stands in for hides exactly
the bug it should expose.** `superadmin-app/`'s
`model/constants/expediente/tipos-archivo.spec.ts` now holds a hand-copy of the enum
and fails when the two lists part company.

---

## 13. Deviations from `manttio-design`

| # | Deviation | Reason | Owner | Date |
|---|---|---|---|---|
| D1 | Fonts load by Google Fonts CDN `@import`, not self-hosted `@fontsource` | Owner's explicit call; this is a demo with no offline requirement. `@fontsource/charis-sil@5.3.0` exists if this is ever revisited | owner | 2026-09-30 |
| D2 | Headings are Charis SIL, not Instrument Sans | Different company. ONP FER's identity is a serif heading over a cream ground; Instrument Sans is Manttio's | owner | 2026-09-30 |
| D3 | Colour lives in one `brand.config.ts` rather than a `--brand-*` branding module | Single tenant, one whitelabel. Swapping client is a one-file edit; the full indirection has no second tenant to serve | owner | 2026-09-30 |
| D4 | Tailwind 4, not 3.4 | The repo was scaffolded on 4 and nothing in the ruleset depends on 3.4 | owner | 2026-09-30 |
| D5 | PrimeNG only in `superadmin-app/`, not the prospect flow | A 390px consumer wizard uses nothing PrimeNG is good at; the admin `p-table` does | owner | 2026-09-30 |
| D6 | The mocked biometric confidence (`"98%"` / `"95%"`) is kept verbatim | Owner's call: this is a demo, and the figure sits behind a "Modo demostración" label. It is the one carve-out from "no invented numbers" — everything financial stays computed | owner | 2026-09-30 |
| D7 | OCR runs in the browser, not server-side | Forced by Cloudflare Workers: Tesseract's WASM and traineddata exceed the bundle cap and CPU budget. Reverses an earlier decision, by platform constraint not preference | platform | 2026-09-30 |
| D8 | Resend sends from the sandbox sender `onboarding@resend.dev` | Owner's call: no verified domain before the demo. It delivers **only** to the Resend account owner's address, so the demo registers with that address | owner | 2026-09-30 |
| D9 | The Supabase project is reused, not created, and its schema is authoritative over the contract | Owner's call. A read-only probe found the schema already complete and a superset of what we specified. Where the two disagreed, the database won and `02-api-contract.md` was corrected: `revision` not `en_revision`, and the eight `doc_*` names mapped onto the real `tipo_archivo` enum | owner | 2026-09-30 |
| D10 | Panel auth goes through Supabase Auth; `usuarios_panel` keeps no password | Forced by the reused project. That table has no password column and adding one would require knowing the existing users' passwords. The Worker still mints its own session JWT and never forwards a Supabase token | owner | 2026-09-30 |
| D11 | Three tables added beyond the plan's list — `prospectos`, `otp_codigos`, `producto` | The contract promises `POST /prospectos → { id }`, so the id must point at something; the OTP needs a store and Supabase is already a hard dependency while a KV namespace would be one more thing to provision; CP-B9 needs a row to read and write | `onp-backend` | 2026-09-30 |
| D12 | `documento_html` added to the `POST /solicitudes` payload | CP-B3 must insert the signed `documentos` row and `GET /expedientes/:id` returns it, but no contract field carried the HTML. The source sent it from the browser (`:3130`) and the Worker renders no templates (CP-B11 is P2) | `onp-backend` | 2026-09-30 |
| D13 | Prospect passwords are PBKDF2-SHA256, not argon2id | PBKDF2 is what Web Crypto gives a Worker natively; an argon2 WASM build costs bundle size and startup. Adequate for a one-day demo, and the first debt to pay if it outlives that | `onp-backend` | 2026-09-30 |

No open questions. The Charis SIL / Archivo split was confirmed by the owner on
2026-09-30 and is recorded in §2.
