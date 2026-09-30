# ONP FER — master plan

**Demo for stakeholders on 2026-10-01. Written 2026-09-30. This is a one-day plan.**

Port `../ONP/onp_fer_etapa2_pf.html` (6,052 lines, single file) into three projects,
rewritten and deployed:

| Project | Stack | Deploys to |
|---|---|---|
| `web-app/` | Angular 21 + NGXS 21 + Tailwind 4, no PrimeNG | Cloudflare Pages |
| `superadmin-app/` | Angular 21 + NGXS 21 + Tailwind 4 + PrimeNG 21 | Cloudflare Pages |
| `backend/` | Hono 4 on **Cloudflare Workers** + Supabase + Resend | Cloudflare Workers |

Single tenant. One whitelabel, expressed as one config file — no `sofoms` table, no
tenant switcher, no admin UI for branding. Copy and screen structure of the prospect
flow are preserved verbatim. Conventions: `01-conventions.md`.

---

## Read this before you plan your day

The owner chose the full rewrite knowing the timeline. Two things follow.

**1. The order below is the order to build in.** It is sorted so that if you run out of
hours, what is missing is the least damaging thing. Do not work ahead into P2 because
it is more interesting.

| Tier | Meaning |
|---|---|
| **P0** | The demo does not happen without it. |
| **P1** | The demo is materially worse without it. |
| **P2** | Cut first, without discussion. |

**2. The realistic risks, named now rather than at 3am.** CP-F7 (four form screens,
CURP generation with check digit, RFC and CP validators) and CP-F9 (camera, OCR, eight
document uploads) are the two largest pieces of work in the frontend track and the most
likely to slip. If one must be reduced, reduce CP-F9: mock the OCR autofill and keep the
capture working. The camera and the photo preview are what sell on stage; the OCR
reading the CURP off the INE is a bonus nobody will ask you to prove.

---

## The Cloudflare constraint — OCR moves back to the browser

**This reverses an earlier decision, and not by preference.** The owner previously chose
to run Tesseract OCR server-side. That is not possible on Cloudflare Workers:

- Tesseract.js needs a multi-MB WASM core plus a ~15MB `traineddata` file. A Worker
  bundle is capped at 3MB compressed on the free tier, 10MB on paid.
- Workers give 128MB of memory and a CPU-time budget per request. OCR of a photographed
  INE exceeds both.

So OCR runs in the browser, as the source already does it (`:4818`), installed from npm
instead of CDN. `html2pdf` was already staying in the browser. **JSZip `.docx` parsing
is P2 and probably gets cut**, so the Worker stays small.

If OCR server-side ever matters, the answer is Workers AI or a container — not Tesseract
in a Worker. Out of scope for tomorrow.

---

## Checkpoint protocol

1. A checkpoint is one branch, one PR, reviewed by the owner.
2. Branch naming: `cp/b3-solicitudes`, `cp/f7-form-screens`, `cp/s2-expedientes-list`.
3. Closeable when: the project builds, the box below is ticked **in the same PR**, and
   any convention that changed is written into `01-conventions.md` in that same PR.
4. **Tonight only:** if a checkpoint is blocked, skip it and move to the next rather
   than stalling. Note the skip in the PR. The dependency table says what that breaks.
5. If a decision is missing, **ask the owner** — do not infer. They are available today.

## Agents

| Agent | Owns | Model |
|---|---|---|
| `onp-backend` | `backend/`, Supabase schema, Resend, the Worker deploy | Sonnet |
| `onp-frontend` | `web-app/` — the 28-step prospect wizard and its `ui/` | Sonnet |
| `onp-superadmin` | `superadmin-app/` — the single-tenant staff panel | Sonnet |

Each owns one directory. Cross-project needs go in the PR description.

**Load the `cloudflare`, `wrangler` and `workers-best-practices` skills before touching
the Worker.** They are installed and they are current; guessing at `wrangler.jsonc` will
cost more time than reading them.

## The duplication policy

Three projects, no shared package — the owner's call. Design tokens live in two
`styles.css` files; API types live in two Angular apps plus the Worker. **They drift
silently.** `01-conventions.md` §3 and `02-api-contract.md` are the referees; a PR
changing one copy changes the other.

---

## Phase 0 — foundations · P0 · do these first, nothing works without them

- [x] **CP-0.1 — Restructure + brand config.** `git mv` the Angular app into `web-app/`.
      Scaffold `superadmin-app/` (`ng new`, Angular 21, Tailwind 4) and `backend/`
      (Hono + wrangler). Root keeps `CLAUDE.md`, `.claude/`, `README.md`.
      **`web-app/src/app/brand.config.ts`** holds razón social, nombre comercial,
      domicilio, logo path and the palette — the whole whitelabel story in one file,
      swappable in a commit. Verify all three build.
- [x] **CP-0.2 — Design tokens.** Charis SIL + Archivo `@import`; the §3 colour table
      and §4 ladders as Tailwind 4 `@theme`. Authored once, **copied verbatim into both
      Angular apps** with a comment naming `01-conventions.md` §3 as the source of
      truth. `web-app/` gets the 390px shell; `superadmin-app/` does not.
- [x] **CP-0.3 — API contract.** `02-api-contract.md`: every endpoint, its shape, its
      errors. Derived from `mapearExpediente` (`:2851`), `mapearPropietario` (`:2948`),
      `subirArchivo` (`:2998`). Keep it short — it exists so three agents agree, not as
      documentation.

## Backend — `onp-backend`

- [ ] **CP-B1 · P0 — Worker scaffold.** Hono 4.13.11 on Workers, `wrangler.jsonc`,
      TypeScript, `/health`, CORS for both Pages origins, the
      `{ error: { code, message } }` envelope. Secrets via `wrangler secret put`:
      `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `RESEND_API_KEY`,
      `DEMO_MODE`. **No secret in source, no secret in `wrangler.jsonc`.**
- [ ] **CP-B2 · P0 — Supabase schema.** Migrations for `expedientes`,
      `propietarios_reales`, `archivos`, `documentos`, `usuarios_panel`, plus the
      `expedientes` bucket. **No `sofoms` table** — single tenant. `plantillas` and
      `bitacora` only if P2 survives.
      **Lock the RLS down.** `../ONP/arreglo_permisos_final.sql` opens `SELECT` on the
      whole bucket to `public` and `INSERT with check (true)` on five tables. That was
      written to unblock the browser client. The browser no longer talks to Supabase —
      the Worker does, with the service key — so revoke public access entirely rather
      than porting those policies.
- [ ] **CP-B3 · P0 — `POST /solicitudes`.** Accepts the whole expediente. Generates the
      folio **server-side** (the source does it client-side at `:3422`, guessable and
      racy). Uploads `id_frente`, `id_reverso`, `firma` and the eight document files to
      the bucket at `{folio}/{tipo}.{ext}`, computing **SHA-256 per file** — that hash
      is the evidentiary point of the whole exercise, do not drop it. Inserts the
      expediente, the propietario real if present, the `archivos` rows and the signed
      `documentos` row. Returns the folio.
- [ ] **CP-B4 · P0 — Panel read API.** `GET /expedientes` (list for the table),
      `GET /expedientes/:id` (detail), `GET /expedientes/:id/archivos/:tipo` (a
      short-lived signed URL), `PATCH /expedientes/:id` (estado).
- [ ] **CP-B5 · P0 — OTP.** `POST /otp/enviar`, `POST /otp/validar`. Server-generated
      6-digit code, 120-second TTL matching the source, single-use. Returns the code in
      the body **only** when `DEMO_MODE=true`, so the UI keeps its "Modo demostración"
      label honest. No SMS provider.
- [ ] **CP-B6 · P0 — Resend welcome email.** Sent when the prospect registers. An HTML
      template built from `brand.config` — Charis SIL heading, Archivo body, the navy
      and cream palette, the razón social in the footer. **From `onboarding@resend.dev`
      (Resend's sandbox sender), which delivers only to the address that owns the Resend
      account.** That is the owner's deliberate choice: during the demo they will type
      their own email at the registro step. Put this constraint in a comment at the top
      of the mailer so nobody debugs a silent 403 tomorrow. Email failure must **never**
      fail the request — log it and move on.
- [ ] **CP-B7 · P0 — Admin login.** `POST /admin/login` against `usuarios_panel`,
      returning an httpOnly session JWT. `GET /admin/me`, `POST /admin/logout`,
      `requireAuth` middleware on the panel routes. The source's hardcoded `PASS_ADMIN`
      does not survive.
- [ ] **CP-B8 · P0 — Deploy.** `wrangler deploy`, secrets set, CORS verified against
      both Pages URLs, `/health` green from a browser.
- [ ] **CP-B9 · P1 — Producto endpoint.** The simulator parameters (`:2340`) read and
      written, so CP-S4 can edit what the prospect sees.
- [ ] **CP-B10 · P1 — Confirmation email.** A second Resend template on submission,
      carrying the folio. Same sandbox-sender constraint.
- [ ] **CP-B11 · P2 — Plantillas.** `.docx` parsing with JSZip (port `leerDocx`
      `:3756`) and `POST /solicitud/render`. **Expected to be cut.** Until it is,
      `PLANTILLA_BASE` (`:3861`) is seeded as a constant and the solicitud renders from
      that.
- [ ] **CP-B12 · P2 — Bitácora.** Append-only audit rows per mutation.

## Prospect app — `onp-frontend`

- [ ] **CP-F1 · P0 — Shell, routing, NGXS.** The 390px shell (topbar, progress, body),
      `provideStore`, the step-order guard, the route map for the 28 screens, back
      navigation on router history, `brand.config` wired into the shell.
- [ ] **CP-F2 · P0 — UI primitives.** `onp-field`, `onp-card`, `onp-alert`,
      `onp-button`, `onp-checkbox-group`, `onp-radio-group`, `onp-status`,
      `onp-leyenda`, `onp-modal`, `onp-progress`, `onp-topbar`, `onp-otp-input`,
      `onp-fecha-trio`, `onp-preview-box`, `onp-pep-section`.
- [ ] **CP-F3 · P0 — Portada + informativas.** `bienvenida`, `catalogo`, `privacidad`,
      `terminos`, `ayuda`. Text comes from `brand.config`, as `pintarDatosSofom`
      (`:2197`) does in the source.
- [ ] **CP-F4 · P0 — Simulador.** `es-cliente`, `simulador`, `requisitos`. Port and
      **unit-test** `pagoMensual` (`:2380`), `comisionDe` (`:2386`), `calcularCAT`
      (`:2395`, bisection), `pesos`/`pesosCent`. The owner named live CAT math as a
      thing stakeholders will poke at — if a credit person is in the room, this is the
      screen they will test. It is the one place tonight where tests are not optional.
- [ ] **CP-F5 · P0 — Registro + OTP.** `registro`, `verificar-cliente`, `otp`. Password
      meter (`:2522`), phone formatting (`:2515`), the six-box OTP input with paste and
      the 120-second countdown, against CP-B5. **Registration triggers CP-B6's email.**
- [ ] **CP-F6 · P0 — Geolocalización.** Permission flow (`:2288`), capture at the four
      evidentiary moments (`:2263`), `auth-location`. Denial must not dead-end.
- [ ] **CP-F7 · P0 — Formulario.** `form-generales`, `form-domicilio`, `form-contacto`,
      `form-laborales`, `envio-formulario`. CURP generation (`:4102`) with check digit
      (`:4171`), CURP/RFC cross-checking against name and birth date (`:4205`), CP and
      phone validators. Conditional required-ness declared per §8, not inferred from DOM
      visibility. **Largest piece of work in this track.**
- [ ] **CP-F8 · P0 — PEP + declaratoria.** `pep-propio`, `pep-familia`, `declaratoria`
      (290 lines of legal copy, verbatim, set in Archivo), plus the propietario real /
      tercero branch and its `pr_*` fields.
- [ ] **CP-F9 · P0 — Identificación + documentos.** `auth-buro`, `id-photos`,
      `documents`. `getUserMedia` capture front and back with a file-upload fallback,
      quality feedback (`:4686`), **Tesseract 7 in the browser** from npm with the
      parsers at `:4886` and `:4929`, and the eight document uploads **actually wired**
      to CP-B3 — the source declares those inputs and never reads them.
      **If the night runs short, mock the OCR autofill and keep the capture.**
- [ ] **CP-F10 · P0 — Biometría + video.** `biometrics`, `video`, both mocked behind
      named service interfaces. The `"98%"` / `"95%"` figures stay verbatim — owner's
      call, it is a demo, and they sit behind the "Modo demostración" label.
- [ ] **CP-F11 · P0 — Solicitud, firma, envío.** `solicitud` rendered from the template
      constant, `signature` (canvas, pointer events, clear), `complete`. Submits the
      whole expediente to CP-B3 and shows the returned folio. PDF stays in the browser
      with `html2pdf.js@0.14.0` from npm.
- [ ] **CP-F12 · P0 — Deploy to Pages.** Build, deploy, confirm the API origin resolves
      and a full run-through submits successfully **from a phone**, not just a desktop
      browser with a narrow window.
- [ ] **CP-F13 · P2 — QA pass.** Keyboard traversal, screen-reader pass,
      `prefers-reduced-motion`, tap-target audit. Cut tonight; schedule it after.

## Staff panel — `onp-superadmin`

Single tenant. The folder keeps its name; the cross-SOFOM tier is gone with the
descope — no SOFOM management, no panel-user management, no cross-tenant search.

- [ ] **CP-S1 · P0 — Scaffold, shell, login.** The `superadmin-app/` project wired up:
      tokens from CP-0.2, PrimeNG 21.1.10 + `@angular/cdk@21.2.14`, stock Aura plus an
      ONP preset built from the §3 tokens, login against CP-B7, the session guard,
      `PanelState`, the nav shell. Desktop-first — do not apply the 390px shell.
- [ ] **CP-S2 · P0 — Expedientes list.** A `p-table` with header/body templates,
      `rowHover`, whole-row click into detail, `[scrollable]` + `scrollHeight`,
      `emptymessage` — never a hand-rolled row list. Search per `pintarExpedientes`
      (`:5426`). Filters persist as URL query params.
- [ ] **CP-S3 · P0 — Expediente detail.** The field rows from `verExpediente` (`:5471`),
      INE photos and signature via CP-B4 signed URLs, estado changes (`:5640`), PDF
      download. **This is the payoff shot of the demo** — the submission the audience
      just watched being made, arriving with its photos. Make it look finished.
- [ ] **CP-S4 · P0 — Deploy to Pages.** Build, deploy, confirm login works against the
      deployed Worker and the detail view renders real uploaded images.
- [ ] **CP-S5 · P1 — Producto.** The simulator parameters (`:5354`) against CP-B9, with
      a preview of the catálogo copy they generate.
- [ ] **CP-S6 · P2 — Formatos and Ajustes.** `.docx` upload and the sofom identity
      editor. **Expected to be cut** — branding is `brand.config.ts` now, and the
      Ajustes tab's connection-string fields are gone with the Worker owning the
      credentials.

---

## Progress board

| CP | Title | Tier | Agent | Depends on | Status |
|---|---|---|---|---|---|
| 0.1 | Restructure + brand config | P0 | — | — | ☑ |
| 0.2 | Design tokens | P0 | — | 0.1 | ☑ |
| 0.3 | API contract | P0 | — | 0.1 | ☑ |
| B1 | Worker scaffold | P0 | backend | 0.1 | ☐ |
| B2 | Supabase schema | P0 | backend | B1 | ☐ |
| B3 | POST /solicitudes | P0 | backend | B2, 0.3 | ☐ |
| B4 | Panel read API | P0 | backend | B2, 0.3 | ☐ |
| B5 | OTP | P0 | backend | B1 | ☐ |
| B6 | Resend welcome email | P0 | backend | B1 | ☐ |
| B7 | Admin login | P0 | backend | B2 | ☐ |
| B8 | Deploy Worker | P0 | backend | B3–B7 | ☐ |
| B9 | Producto endpoint | P1 | backend | B2 | ☐ |
| B10 | Confirmation email | P1 | backend | B6, B3 | ☐ |
| B11 | Plantillas | P2 | backend | B2 | ☐ |
| B12 | Bitácora | P2 | backend | B2 | ☐ |
| F1 | Shell, routing, NGXS | P0 | frontend | 0.2 | ☐ |
| F2 | UI primitives | P0 | frontend | 0.2 | ☐ |
| F3 | Portada + informativas | P0 | frontend | F1, F2 | ☐ |
| F4 | Simulador | P0 | frontend | F2 | ☐ |
| F5 | Registro + OTP | P0 | frontend | F2, B5, B6 | ☐ |
| F6 | Geolocalización | P0 | frontend | F1 | ☐ |
| F7 | Formulario | P0 | frontend | F2 | ☐ |
| F8 | PEP + declaratoria | P0 | frontend | F7 | ☐ |
| F9 | Identificación + documentos | P0 | frontend | F2, B3 | ☐ |
| F10 | Biometría + video | P0 | frontend | F2 | ☐ |
| F11 | Solicitud, firma, envío | P0 | frontend | F8, B3 | ☐ |
| F12 | Deploy to Pages | P0 | frontend | F1–F11, B8 | ☐ |
| F13 | QA pass | P2 | frontend | F12 | ☐ |
| S1 | Scaffold, shell, login | P0 | superadmin | 0.2, B7 | ☐ |
| S2 | Expedientes list | P0 | superadmin | S1, B4 | ☐ |
| S3 | Expediente detail | P0 | superadmin | S2, B4 | ☐ |
| S4 | Deploy to Pages | P0 | superadmin | S3, B8 | ☐ |
| S5 | Producto | P1 | superadmin | S1, B9 | ☐ |
| S6 | Formatos and Ajustes | P2 | superadmin | S1 | ☐ |

**26 P0 · 4 P1 · 5 P2.**

---

## Demo-day runbook

Write this down before you sleep, not at 8am.

1. The Resend sender is `onboarding@resend.dev` and it **only delivers to the address
   that owns the Resend account.** At the registro step, type that address — not a
   made-up prospect email. Nothing visibly fails otherwise; the email just never
   arrives.
2. Geolocation and camera need **HTTPS** and a permission grant. Pages gives you HTTPS.
   Grant both before the audience is watching, and do not use an incognito window,
   which re-prompts for everything.
3. The OTP appears on screen under "Modo demostración". That is deliberate and it is
   labelled — say so out loud before someone asks.
4. Have one expediente already submitted and visible in the panel, so CP-S3 has
   something to show even if the live run stumbles.
5. Know which P2 items were cut, so you can answer "does it do X?" with "not in this
   build" rather than hunting for a button.

---

## Screen inventory

| # | Screen | % | Line | | # | Screen | % | Line |
|---|---|---|---|---|---|---|---|---|
| 1 | bienvenida | 0 | 274 | | 15 | form-contacto | 24 | 1004 |
| 2 | catalogo | 0 | 305 | | 16 | form-laborales | 29 | 1029 |
| 3 | privacidad | 0 | 343 | | 17 | envio-formulario | 32 | 1074 |
| 4 | terminos | 0 | 402 | | 18 | pep-propio | 36 | 1101 |
| 5 | ayuda | 0 | 445 | | 19 | pep-familia | 39 | 1181 |
| 6 | es-cliente | 2 | 522 | | 20 | declaratoria | 44 | 1278 |
| 7 | simulador | 4 | 542 | | 21 | auth-buro | 50 | 1567 |
| 8 | requisitos | 5 | 592 | | 22 | id-photos | 60 | 1589 |
| 9 | registro | 6 | 623 | | 23 | documents | 68 | 1716 |
| 10 | verificar-cliente | 6 | 654 | | 24 | biometrics | 75 | 1773 |
| 11 | otp | 7 | 686 | | 25 | video | 82 | 1799 |
| 12 | auth-location | 10 | 718 | | 26 | solicitud | 90 | 1832 |
| 13 | form-generales | 14 | 774 | | 27 | signature | 96 | 1853 |
| 14 | form-domicilio | 19 | 884 | | 28 | complete | 100 | 1871 |

Panel source: `admin-login` (1896), `admin-home` (1917), `admin-detalle` (2087), panel
logic (5252–6049).

---

## Pinned versions

`@ngxs/store` + plugins **21.0.0** · `@lucide/angular` **1.49.0** · `primeng`
**21.1.10** · `@angular/cdk` **21.2.14** · `hono` **4.13.11** · `tesseract.js` **7.0.0**
(browser) · `html2pdf.js` **0.14.0** (browser) · `jszip` **3.10.2** (P2 only) ·
`@supabase/supabase-js` **2.117.2** (Worker only) · `wrangler` **4.144** with
`@cloudflare/workers-types` **^5.20260926.1** — v4 of the types conflicts with current
wrangler's peer range.

**Do not install `@ngxs/store@22`** — it requires `@angular/core >=22.0.0 <23.0.0` and
these apps are Angular 21.2.

---

## Departures from the source

Cleared with the owner, or following directly from a decision they made.

1. The eight `doc_*` file inputs (`:1728`–`:1765`) are read by no JS. Wired in CP-F9.
2. Base64 INE photos were written into IndexedDB. Dropped; the Worker is the only store.
3. The OTP was generated in the browser and printed on screen. Moves to CP-B5, echoed
   only under `DEMO_MODE`.
4. Supabase URL and anon key were entered in the admin panel and shipped to the browser.
   Now Worker secrets via `wrangler secret put`.
5. `PASS_ADMIN`, a hardcoded string comparison, authenticated the panel in local mode.
   Gone with CP-B7.
6. Supabase RLS error text was shown to the end user (`:3013`). Logged server-side.
7. The folio was generated client-side (`:3422`), guessable and collidable.
   Server-side in CP-B3.
8. `100vh` on the app shell breaks under mobile Safari's collapsing toolbar. `100dvh`.
9. 32px tap targets and 16px checkboxes are below the 44px minimum.
10. Required-ness was inferred by walking the DOM (`:3987`, `:4009`). Declared per §8.
11. **The RLS in `arreglo_permisos_final.sql` is not ported.** It opens `SELECT` on the
    whole `expedientes` bucket to `public` and `INSERT with check (true)` on five
    tables — meaning anyone holding the anon key could read every INE photo and
    signature. It existed because the browser talked to Supabase directly. The browser
    no longer does, so CP-B2 revokes public access instead of reproducing it.
12. `sofoms`, multi-tenancy and the whole superadmin tier are dropped. One whitelabel,
    one config file — owner's call, 2026-09-30.

**Reviewed and deliberately kept:** the mocked `"98%"` / `"95%"` biometric confidence
(`:5004`). Owner's call — it is a demo and the figure sits behind the "Modo
demostración" label. Recorded as deviation D6 in `01-conventions.md`.
