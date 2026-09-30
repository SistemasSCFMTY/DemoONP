# ONP FER — master plan

Port `../ONP/onp_fer_etapa2_pf.html` (6,052 lines, single file) into two projects:
`web-app/` (Angular 21 + NGXS 21 + Tailwind 4) and `backend/` (Hono 4 + Supabase).

Copy and screen structure are preserved verbatim. Conventions: `01-conventions.md`.

---

## Checkpoint protocol

1. A checkpoint is one branch, one PR, reviewed by the owner. Nothing merges unreviewed.
2. Branch naming: `cp/b3-expedientes-api`, `cp/f7-form-screens`.
3. A checkpoint is **closeable** only when all of these hold:
   - `npm run build` is green in the project it touches.
   - `npm run typecheck` is green (backend) / the build has no template errors (web-app).
   - Unit tests for anything in `services/domain/` or `backend/src/services/` pass.
   - The box below is ticked **in the same PR** that does the work.
   - Conventions that changed are written into `01-conventions.md` **and** the
     `onp-design` skill in that same PR.
4. If a checkpoint uncovers a decision the plan does not answer, **stop and ask the
   owner** — do not infer. Record the answer in `01-conventions.md`.
5. Do not start a checkpoint whose dependencies are unmerged.

## Agents

| Agent | Owns | Model |
|---|---|---|
| `onp-backend` | `backend/`, Supabase migrations, the API contract | Sonnet |
| `onp-frontend` | `web-app/`, the design system, NGXS, the admin panel | Sonnet |

Phase 0 is done **before** the agents split, because both depend on it.

The two projects are independent — no shared package, by decision. The API contract
therefore exists twice: Zod schemas in `backend/src/schemas/` and TypeScript interfaces
in `web-app/src/app/model/interfaces/`. **They drift silently.** CP-0.3 defines the
contract in this repo as the referee, and any PR changing one side must change both.

---

## Phase 0 — foundations (shared, sequential)

- [ ] **CP-0.1 — Repo restructure.** `git mv` `src/ angular.json tsconfig*.json public/
      .postcssrc.json .editorconfig .prettierrc package.json package-lock.json` into
      `web-app/`. Scaffold `backend/` with its own `package.json`, `tsconfig.json`,
      `.env.example`, `.gitignore`. Root keeps only `CLAUDE.md`, `.claude/`, `README.md`,
      `.git`. Verify `npm install && npm run build` works inside `web-app/` afterwards.
- [ ] **CP-0.2 — Design tokens.** Charis SIL + Archivo `@import` in
      `web-app/src/styles.css`; the §3 colour table and §4 radius/elevation ladders as
      Tailwind 4 `@theme` tokens; `animations.scss` with the motion tokens; the 390px
      app shell. No component work — tokens and shell only.
- [ ] **CP-0.3 — API contract.** Write `.claude/plans/onp/02-api-contract.md`: every
      endpoint, its Zod shape, its error codes. Derived from the source's
      `mapearExpediente` (`:2851`), `mapearPropietario` (`:2948`) and `subirArchivo`
      (`:2998`). Both agents code against this document.

---

## Backend track — `onp-backend`

- [ ] **CP-B1 — Scaffold.** Hono 4.13.11, Node adapter, TS ESM, env loading with a
      typed+validated config module, `/health`, CORS, structured logging with request
      ids, the `{ error: { code, message } }` envelope, graceful shutdown.
- [ ] **CP-B2 — Schema + migrations.** `backend/supabase/migrations/`: the eight tables,
      `v_lista_expedientes`, the `expedientes` bucket. Bucket is **not** publicly
      writable — the service key writes it. Read `../ONP/arreglo_permisos_final.sql`
      first for the RLS traps the original hit, then supersede it. Seed script for one
      sofom + one panel user.
- [ ] **CP-B3 — Expedientes API.** `POST /expedientes` (create from the full wizard
      payload, generating the folio server-side — the source generates it client-side at
      `:3422`, which is guessable and racy), `GET /expedientes` (list + search, the
      `v_lista_expedientes` shape), `GET /expedientes/:id`, `PATCH /expedientes/:id`
      (estado), `DELETE /expedientes/:id`. Plus `propietarios_reales` on create. Writes
      a `bitacora` row per mutation.
- [ ] **CP-B4 — Files API.** `POST /expedientes/:id/archivos` (multipart), computing
      SHA-256 server-side and writing the `archivos` row; `GET
      /expedientes/:id/archivos/:tipo` returning a short-lived signed URL. Accepts all
      eleven types: `id_frente`, `id_reverso`, `firma`, and the eight document uploads
      that the source declares but never reads. Validate mime and size; reject anything
      not in the allowlist.
- [ ] **CP-B5 — OTP.** `POST /otp/enviar`, `POST /otp/validar`. Server-generated
      6-digit code, 120-second TTL matching the source, single-use, rate-limited per
      phone and per IP. Returns the code in the response body **only** when
      `DEMO_MODE=true`, so the UI can keep showing it under its "Modo demostración"
      label. No SMS provider in scope.
- [ ] **CP-B6 — Admin auth.** `POST /admin/login` verifying against Supabase Auth and
      the `usuarios_panel` profile (`activo`, `sofom_id`, `rol`), issuing an httpOnly
      session JWT signed with `JWT_SECRET`. `POST /admin/logout`, `GET /admin/me`.
      Middleware guarding every admin route and scoping queries by `sofom_id`. The
      source's hardcoded `PASS_ADMIN` fallback does not survive.
- [ ] **CP-B7 — OCR.** `POST /ocr/ine` taking an image, running Tesseract **7.0.0**
      server-side, returning the parsed fields. Port the parsers `parsearFrente`
      (`:4886`) and `parsearReverso` (`:4929`) and the quality analysis
      `analizarCalidad` (`:4686`). Note the source pins Tesseract 5.1.0 — the v7 API
      differs, budget for it. Cap image size; this endpoint is CPU-expensive.
- [ ] **CP-B8 — Plantillas.** `.docx` parsing with JSZip 3.10.2 (port `leerDocx`
      `:3756`, which reads `word/document.xml` and its run styles), plantilla CRUD, and
      `PLANTILLA_BASE` (`:3861`) as the seeded default. `POST /solicitud/render` fills
      the template from an expediente and returns HTML — the browser turns it into PDF.
- [ ] **CP-B9 — Producto, ajustes, sofom.** Product parameters that feed the simulator
      (`:2340`), sofom identity (razón social, domicilio, logo), and the bitácora read
      endpoint. Everything the admin Ajustes tab edits, minus the connection settings —
      those are env vars now.
- [ ] **CP-B10 — Hardening.** Zod on every route in and out, rate limits, request size
      caps, a smoke test per endpoint, `.env.example` complete, README with setup.

## Frontend track — `onp-frontend`

- [ ] **CP-F1 — Shell + routing + NGXS root.** App shell (topbar, progress, body),
      `provideStore` with the six states from §7, the step-order guard, the route map
      for all 31 screens, the `historial` back behavior mapped onto router history.
- [ ] **CP-F2 — Design system.** The primitives, in `ui/`: `onp-field`, `onp-card`,
      `onp-alert`, `onp-button`, `onp-checkbox-group`, `onp-radio-group`, `onp-status`,
      `onp-leyenda`, `onp-modal`, `onp-progress`, `onp-topbar`, `onp-otp-input`,
      `onp-fecha-trio`, `onp-preview-box`, `onp-pep-section`. Each with the §9 a11y
      contract met. No page work in this checkpoint.
- [ ] **CP-F3 — Portada + informativas.** `bienvenida`, `catalogo`, `privacidad`,
      `terminos`, `ayuda`. Includes the long-press admin entry as a demo affordance,
      out of the tab order, with `/admin` also reachable directly.
- [ ] **CP-F4 — Simulador.** `es-cliente`, `simulador`, `requisitos`. Port and
      unit-test `pagoMensual` (`:2380`), `comisionDe` (`:2386`), `calcularCAT`
      (`:2395`, bisection), `pesos`/`pesosCent` formatters. The CAT function is the
      highest-risk math in the app — test it against known values.
- [ ] **CP-F5 — Registro + OTP.** `registro`, `verificar-cliente`, `otp`. Password
      strength meter (`:2522`), phone formatting (`:2515`), the six-box OTP input with
      paste support and the 120-second countdown, now talking to CP-B5.
- [ ] **CP-F6 — Geolocalización.** The permission flow (`:2288`) and capture at the
      four evidentiary moments — autorización, fotos, video, firma (`:2263`). Plus
      `auth-location`. Handle denial gracefully; the flow must not dead-end.
- [ ] **CP-F7 — Formulario.** `form-generales`, `form-domicilio`, `form-contacto`,
      `form-laborales`, `envio-formulario`. CURP generation (`:4102`) with check digit
      (`:4171`), CURP/RFC validation and cross-checking against the typed name and
      birth date (`:4205`), CP and phone validators. All unit-tested. Conditional
      required-ness declared per §8, replacing the source's DOM-visibility walk.
- [ ] **CP-F8 — PEP + declaratoria.** `pep-propio`, `pep-familia`, `declaratoria`
      (290 lines of legal copy — verbatim), including the propietario real / tercero
      branch and its parallel `pr_*` field set.
- [ ] **CP-F9 — Identificación.** `auth-buro`, `id-photos`. Camera capture via
      `getUserMedia` with the front/back flow, file-upload fallback, image quality
      feedback, and OCR through CP-B7 — the multi-MB Tesseract bundle never reaches the
      phone. Handles the three identification types (`:4729`).
- [ ] **CP-F10 — Documentos.** `documents`, with all eight uploads **actually wired**
      to CP-B4 — the source declares these inputs and never reads them. Required before
      advancing, per the owner's call. Includes the tercero document branch.
- [ ] **CP-F11 — Biometría + video.** `biometrics`, `video`. Both stay mocked, behind a
      named service interface (`BiometriaService`, `VideoService`) that a real provider
      can replace. The invented "98%" confidence figure is **removed** — a fabricated
      number in a compliance UI is worse than an honest "Capturado (demostración)".
- [ ] **CP-F12 — Solicitud + firma.** `solicitud` (rendered by CP-B8), `signature`
      (canvas, pointer events, clear, 44px-safe controls), `complete`. PDF generation
      stays in the browser with `html2pdf.js@0.14.0` from npm, not CDN.
- [ ] **CP-F13 — Panel administrativo.** `admin-login`, `admin-home` (tabs:
      Expedientes, Producto, Formatos, Ajustes), `admin-detalle`. PrimeNG **21.1.10** +
      `@angular/cdk@21.2.14` enters here and only here. The expediente list is a
      `p-table` with header/body templates, `rowHover`, whole-row click into detail,
      `[scrollable]` + `scrollHeight`, and an `emptymessage` — never a hand-rolled row
      list. Filters and page persist as URL query params. The Ajustes tab loses the
      connection-string fields; they are env vars.
- [ ] **CP-F14 — QA pass.** 390px through tablet, keyboard-only traversal of all 28
      steps, screen-reader pass on the form screens, `prefers-reduced-motion`, iOS
      input-zoom check, tap-target audit, Lighthouse on the prospect flow.

---

## Progress board

| CP | Title | Agent | Depends on | Status |
|---|---|---|---|---|
| 0.1 | Repo restructure | — | — | ☐ |
| 0.2 | Design tokens | — | 0.1 | ☐ |
| 0.3 | API contract | — | 0.1 | ☐ |
| B1 | Hono scaffold | backend | 0.1 | ☐ |
| B2 | Schema + migrations | backend | B1 | ☐ |
| B3 | Expedientes API | backend | B2, 0.3 | ☐ |
| B4 | Files API | backend | B2, 0.3 | ☐ |
| B5 | OTP | backend | B1 | ☐ |
| B6 | Admin auth | backend | B2 | ☐ |
| B7 | OCR | backend | B1 | ☐ |
| B8 | Plantillas | backend | B2 | ☐ |
| B9 | Producto/ajustes | backend | B2 | ☐ |
| B10 | Hardening | backend | B3–B9 | ☐ |
| F1 | Shell + routing + NGXS | frontend | 0.2 | ☐ |
| F2 | Design system | frontend | 0.2 | ☐ |
| F3 | Portada + informativas | frontend | F1, F2 | ☐ |
| F4 | Simulador | frontend | F2 | ☐ |
| F5 | Registro + OTP | frontend | F2, B5 | ☐ |
| F6 | Geolocalización | frontend | F1 | ☐ |
| F7 | Formulario | frontend | F2 | ☐ |
| F8 | PEP + declaratoria | frontend | F7 | ☐ |
| F9 | Identificación | frontend | F2, B7 | ☐ |
| F10 | Documentos | frontend | F9, B4 | ☐ |
| F11 | Biometría + video | frontend | F2 | ☐ |
| F12 | Solicitud + firma | frontend | F8, B8, B3 | ☐ |
| F13 | Panel administrativo | frontend | B3, B6, B9 | ☐ |
| F14 | QA pass | frontend | F1–F13 | ☐ |

---

## Screen inventory

Prospect flow in order, with the source's progress percentage:

| # | Screen | % | Source line |
|---|---|---|---|
| 1 | bienvenida | 0 | 274 |
| 2 | catalogo | 0 | 305 |
| 3 | privacidad | 0 | 343 |
| 4 | terminos | 0 | 402 |
| 5 | ayuda | 0 | 445 |
| 6 | es-cliente | 2 | 522 |
| 7 | simulador | 4 | 542 |
| 8 | requisitos | 5 | 592 |
| 9 | registro | 6 | 623 |
| 10 | verificar-cliente | 6 | 654 |
| 11 | otp | 7 | 686 |
| 12 | auth-location | 10 | 718 |
| 13 | form-generales | 14 | 774 |
| 14 | form-domicilio | 19 | 884 |
| 15 | form-contacto | 24 | 1004 |
| 16 | form-laborales | 29 | 1029 |
| 17 | envio-formulario | 32 | 1074 |
| 18 | pep-propio | 36 | 1101 |
| 19 | pep-familia | 39 | 1181 |
| 20 | declaratoria | 44 | 1278 |
| 21 | auth-buro | 50 | 1567 |
| 22 | id-photos | 60 | 1589 |
| 23 | documents | 68 | 1716 |
| 24 | biometrics | 75 | 1773 |
| 25 | video | 82 | 1799 |
| 26 | solicitud | 90 | 1832 |
| 27 | signature | 96 | 1853 |
| 28 | complete | 100 | 1871 |

Admin: `admin-login` (1896), `admin-home` (1917), `admin-detalle` (2087). Modal (2095).

---

## Pinned versions

`@ngxs/store` + plugins **21.0.0** · `@lucide/angular` **1.49.0** · `primeng` **21.1.10** · `@angular/cdk` **21.2.14**
· `hono` **4.13.11** · `tesseract.js` **7.0.0** · `jszip` **3.10.2** · `html2pdf.js`
**0.14.0** · `@supabase/supabase-js` **2.117.2** (backend only).

**Do not install `@ngxs/store@22`** — it requires `@angular/core >=22.0.0 <23.0.0` and
this project is Angular 21.2. Bumping NGXS means bumping Angular first, which is not in
this plan.

---

## Defects in the source, fixed rather than ported

Each is a deliberate departure from "port verbatim", and each was cleared with the owner
or follows directly from a decision they made.

1. The eight `doc_*` file inputs (`:1728`–`:1765`) are never read by any JS. Wired up in
   CP-F10 — owner's call.
2. Base64 INE photos were written into IndexedDB. Dropped; the backend is the only
   store — owner's call (backend-only, no local mode).
3. The OTP was generated in the browser and printed on screen. Moves to CP-B5, echoed
   only under `DEMO_MODE` — owner's call.
4. Supabase URL and anon key were entered in the admin panel and shipped to the browser.
   Now env vars on the backend — owner's call.
5. `PASS_ADMIN`, a hardcoded string comparison, authenticated the panel whenever the app
   was in local mode. Gone with CP-B6.
6. Supabase RLS error text was shown to the end user (`:3013`). Logged server-side
   instead, per §10.
7. The folio is generated client-side (`:3422`) from a date plus a short random — both
   guessable and collidable. Server-side in CP-B3.
8. Biometric confidence was a hardcoded "98%" / "95%" (`:5004`). Removed in CP-F11.
9. `100vh` on the app shell breaks under mobile Safari's collapsing toolbar. `100dvh`.
10. 32px tap targets on the back button and 16px checkboxes are below the 44px minimum.
11. Required-ness was inferred by walking the DOM for visibility (`:3987`, `:4009`).
    Declared explicitly per §8.
