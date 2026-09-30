# ONP FER — master plan

Port `../ONP/onp_fer_etapa2_pf.html` (6,052 lines, single file) into **three
independent projects**:

| Project | Stack | Audience |
|---|---|---|
| `web-app/` | Angular 21 + NGXS 21 + Tailwind 4, no PrimeNG | a stranger on a 390px phone |
| `superadmin-app/` | Angular 21 + NGXS 21 + Tailwind 4 + PrimeNG 21 | the platform operator, across all SOFOMs |
| `backend/` | Hono 4 + Supabase | both |

Copy and screen structure of the prospect flow are preserved verbatim. Conventions:
`01-conventions.md`.

## The superadmin is a new tier

The source has **one** panel, scoped to a single SOFOM: `usuarios_panel` rows carry a
`sofom_id`, every query filters by it, and a `sofoms` table exists as if multi-tenancy
was anticipated and never built. `superadmin-app/` builds it out — one operator over
all SOFOMs, managing the SOFOMs themselves and their panel users.

**This changes the blast radius.** The source's panel could leak one SOFOM's
expedientes. A superadmin session can reach every SOFOM's. Three things follow, and
they are not optional:

- Authorization is **server-side and role-based**. The JWT carries a role; the backend
  decides what is visible. A frontend that "only shows the right rows" is not security.
- Unscoped queries exist only behind a `superadmin` role check. The default for every
  endpoint is scoped.
- **Every superadmin mutation writes a `bitacora` row.** An operator who can reach all
  tenants must be auditable, and CP-S8 exists to make that log readable.

---

## Checkpoint protocol

1. A checkpoint is one branch, one PR, reviewed by the owner. Nothing merges unreviewed.
2. Branch naming: `cp/b3-expedientes-api`, `cp/f7-form-screens`, `cp/s2-sofoms`.
3. A checkpoint is **closeable** only when all of these hold:
   - `npm run build` is green in the project it touches.
   - `npm run typecheck` is green (backend) / the build has no template errors (Angular).
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
| `onp-backend` | `backend/`, Supabase migrations, the API contract, the role model | Sonnet |
| `onp-frontend` | `web-app/` — the 28-step prospect wizard and its `ui/` | Sonnet |
| `onp-superadmin` | `superadmin-app/` — the cross-SOFOM panel and PrimeNG | Sonnet |

Each agent owns one directory and does not write in another's. Cross-project needs go
in the PR description, not into someone else's folder.

## The duplication policy

Three independent projects, no shared package — the owner's call, twice. So the design
tokens exist in two `styles.css` files and the API types exist in two Angular apps plus
the backend's Zod schemas. **These drift silently; the compiler will not catch it.**

The referees are `01-conventions.md` §3 (tokens) and `02-api-contract.md` (the API).
A PR that changes one copy must change the others in the same PR, and a reviewer who
sees a token or a field changed in one place only should block it.

---

## Phase 0 — foundations (shared, sequential)

- [ ] **CP-0.1 — Repo restructure.** `git mv` `src/ angular.json tsconfig*.json public/
      .postcssrc.json .editorconfig .prettierrc package.json package-lock.json` into
      `web-app/`. Scaffold `backend/` (own `package.json`, `tsconfig.json`,
      `.env.example`, `.gitignore`) and `superadmin-app/` (`ng new`, Angular 21,
      Tailwind 4, own lockfile). Root keeps only `CLAUDE.md`, `.claude/`, `README.md`,
      `.git`. Verify `npm install && npm run build` in each of the three.
- [ ] **CP-0.2 — Design tokens.** Charis SIL + Archivo `@import`; the §3 colour table
      and §4 radius/elevation ladders as Tailwind 4 `@theme` tokens; `animations.scss`.
      Authored once, **copied verbatim into both Angular apps**, with a comment at the
      top of each naming `01-conventions.md` §3 as the source of truth. `web-app/` also
      gets the 390px shell; `superadmin-app/` does not — it is a desktop surface.
- [ ] **CP-0.3 — API contract.** Write `.claude/plans/onp/02-api-contract.md`: every
      endpoint, its Zod shape, its error codes, **and which role may call it**. Derived
      from `mapearExpediente` (`:2851`), `mapearPropietario` (`:2948`) and
      `subirArchivo` (`:2998`). All three agents code against this document.

---

## Backend track — `onp-backend`

- [ ] **CP-B1 — Scaffold.** Hono 4.13.11, Node adapter, TS ESM, env loading with a
      typed config module that throws on a missing key, `/health`, CORS (two origins
      now), structured logging with request ids, the `{ error: { code, message } }`
      envelope, graceful shutdown.
- [ ] **CP-B2 — Schema + migrations.** `backend/supabase/migrations/`: the eight tables,
      `v_lista_expedientes`, the `expedientes` bucket. **`usuarios_panel` gains a `rol`
      of `superadmin | admin`**, and `sofom_id` becomes nullable for a superadmin, who
      belongs to no single SOFOM. Bucket is not publicly writable. Read
      `../ONP/arreglo_permisos_final.sql` for the RLS traps the original hit, then
      supersede it. Seed: one superadmin, two SOFOMs, one admin each.
- [ ] **CP-B3 — Expedientes API.** `POST /expedientes` (folio generated **server-side**;
      the source generates it client-side at `:3422`, guessable and racy), `GET
      /expedientes`, `GET /expedientes/:id`, `PATCH /expedientes/:id` (estado),
      `DELETE /expedientes/:id`, plus `propietarios_reales` on create. **Scoped by
      `sofom_id` by default; a `superadmin` token may pass a `sofom_id` filter or omit
      it to query across tenants. The scoping is enforced here, never in a frontend.**
      Writes a `bitacora` row per mutation.
- [ ] **CP-B4 — Files API.** `POST /expedientes/:id/archivos` (multipart), SHA-256
      computed server-side, `archivos` row written; `GET
      /expedientes/:id/archivos/:tipo` returning a short-lived signed URL. All eleven
      types: `id_frente`, `id_reverso`, `firma`, and the eight document uploads the
      source declares but never reads. Mime and size allowlist.
- [ ] **CP-B5 — OTP.** `POST /otp/enviar`, `POST /otp/validar`. Server-generated
      6-digit code, 120-second TTL matching the source, single-use, rate-limited per
      phone and per IP. Returns the code in the body **only** when `DEMO_MODE=true`, so
      the UI keeps its "Modo demostración" label honest. No SMS provider in scope.
- [ ] **CP-B6 — Auth + roles.** `POST /admin/login` against Supabase Auth plus the
      `usuarios_panel` profile (`activo`, `rol`, `sofom_id`), issuing an httpOnly
      session JWT signed with `JWT_SECRET` **carrying the role**. `POST /admin/logout`,
      `GET /admin/me`. Two middlewares: `requireAuth` and `requireSuperadmin`. The
      source's hardcoded `PASS_ADMIN` does not survive.
- [ ] **CP-B7 — OCR.** `POST /ocr/ine`, Tesseract **7.0.0** server-side, returning
      parsed fields. Port `parsearFrente` (`:4886`), `parsearReverso` (`:4929`) and
      `analizarCalidad` (`:4686`). The source pins Tesseract 5.1.0 — the v7 API differs,
      budget for it. Cap image size; this endpoint is CPU-expensive.
- [ ] **CP-B8 — Plantillas.** `.docx` parsing with JSZip 3.10.2 (port `leerDocx`
      `:3756`, which reads `word/document.xml` and its run styles), plantilla CRUD per
      SOFOM, `PLANTILLA_BASE` (`:3861`) seeded as the default, and `POST
      /solicitud/render` filling a template from an expediente and returning HTML.
- [ ] **CP-B9 — Producto, ajustes, sofom.** Product parameters feeding the simulator
      (`:2340`) and SOFOM identity (razón social, domicilio, logo) — both per SOFOM.
      Everything the source's Ajustes tab edited, minus the connection settings.
- [ ] **CP-B10 — Superadmin API.** `requireSuperadmin` on all of it: SOFOM CRUD
      (create, edit, deactivate), `usuarios_panel` CRUD (invite, set role, activate,
      deactivate), cross-tenant expediente search, and `GET /bitacora` with filters.
      **A superadmin cannot silently delete their own audit trail** — bitácora is
      append-only, enforced in the schema.
- [ ] **CP-B11 — Hardening.** Zod on every route in and out, rate limits, request size
      caps, a smoke test per endpoint asserting **both** the happy path and the
      403 for a wrong-role caller, `.env.example` complete, README with setup.

## Frontend track — `onp-frontend` (prospect flow)

- [ ] **CP-F1 — Shell + routing + NGXS root.** App shell (topbar, progress, body),
      `provideStore` with the five prospect states from §7, the step-order guard, the
      route map for the 28 screens, the `historial` back behavior mapped onto router
      history.
- [ ] **CP-F2 — Design system.** `ui/`: `onp-field`, `onp-card`, `onp-alert`,
      `onp-button`, `onp-checkbox-group`, `onp-radio-group`, `onp-status`,
      `onp-leyenda`, `onp-modal`, `onp-progress`, `onp-topbar`, `onp-otp-input`,
      `onp-fecha-trio`, `onp-preview-box`, `onp-pep-section`. Each meets the §9 a11y
      contract. No page work in this checkpoint.
- [ ] **CP-F3 — Portada + informativas.** `bienvenida`, `catalogo`, `privacidad`,
      `terminos`, `ayuda`.
- [ ] **CP-F4 — Simulador.** `es-cliente`, `simulador`, `requisitos`. Port and
      unit-test `pagoMensual` (`:2380`), `comisionDe` (`:2386`), `calcularCAT` (`:2395`,
      bisection), `pesos`/`pesosCent`. The CAT function is the highest-risk math in the
      product — test it against known values.
- [ ] **CP-F5 — Registro + OTP.** `registro`, `verificar-cliente`, `otp`. Password
      strength meter (`:2522`), phone formatting (`:2515`), the six-box OTP input with
      paste support and the 120-second countdown, against CP-B5.
- [ ] **CP-F6 — Geolocalización.** Permission flow (`:2288`) and capture at the four
      evidentiary moments — autorización, fotos, video, firma (`:2263`) — plus
      `auth-location`. Denial must not dead-end the flow.
- [ ] **CP-F7 — Formulario.** `form-generales`, `form-domicilio`, `form-contacto`,
      `form-laborales`, `envio-formulario`. CURP generation (`:4102`) with check digit
      (`:4171`), CURP/RFC validation and cross-checking against name and birth date
      (`:4205`), CP and phone validators — all unit-tested. Conditional required-ness
      declared per §8, replacing the source's DOM-visibility walk.
- [ ] **CP-F8 — PEP + declaratoria.** `pep-propio`, `pep-familia`, `declaratoria`
      (290 lines of legal copy, verbatim, set in Archivo), including the propietario
      real / tercero branch and its parallel `pr_*` field set.
- [ ] **CP-F9 — Identificación.** `auth-buro`, `id-photos`. `getUserMedia` capture
      front and back, file-upload fallback, quality feedback, OCR through CP-B7 — the
      multi-MB Tesseract bundle never reaches the phone. Three identification types
      (`:4729`).
- [ ] **CP-F10 — Documentos.** `documents`, with all eight uploads **actually wired** to
      CP-B4. Required before advancing, per the owner. Includes the tercero branch.
- [ ] **CP-F11 — Biometría + video.** `biometrics`, `video`. Both stay mocked behind
      named service interfaces (`BiometriaService`, `VideoService`) a real provider can
      replace. The `"98%"` / `"95%"` figures are kept verbatim — owner's call, it is a
      demo, and they sit behind the "Modo demostración" label.
- [ ] **CP-F12 — Solicitud + firma.** `solicitud` (rendered by CP-B8), `signature`
      (canvas, pointer events, clear, 44px-safe controls), `complete`. PDF stays in the
      browser with `html2pdf.js@0.14.0` from npm, not CDN.
- [ ] **CP-F13 — QA pass.** 390px through tablet, keyboard-only traversal of all 28
      steps, screen-reader pass on the form screens, `prefers-reduced-motion`, iOS
      input-zoom check, tap-target audit, Lighthouse.

## Superadmin track — `onp-superadmin`

A separate deployable app. Desktop-first — it is the one surface in this product that
is **not** mobile-first, and it should not pretend otherwise.

- [ ] **CP-S1 — Scaffold, shell, auth.** The `superadmin-app/` Angular 21 project from
      CP-0.1 wired up: tokens from CP-0.2, PrimeNG **21.1.10** + `@angular/cdk@21.2.14`
      with stock Aura plus an ONP preset built from the §3 tokens, login against CP-B6,
      the session guard, a **role guard that rejects a non-`superadmin` token**,
      `SuperadminState`, logout, and the nav shell.
- [ ] **CP-S2 — SOFOMs.** The new tier: list, create, edit and deactivate SOFOMs —
      razón social, domicilio, logo. In the source this was a single SOFOM's Ajustes
      tab (`:5836`); here it is a collection. Deactivation is reversible and never a
      hard delete, because expedientes reference it.
- [ ] **CP-S3 — Usuarios del panel.** Manage `usuarios_panel` across SOFOMs: invite,
      assign `rol`, assign `sofom_id`, activate and deactivate, show `ultimo_acceso`.
      The UI must make it obvious when it is granting cross-tenant reach.
- [ ] **CP-S4 — Expedientes, cross-tenant.** A `p-table` with header/body templates,
      `rowHover`, whole-row click into detail, `[scrollable]` + `scrollHeight`,
      `emptymessage` — never a hand-rolled row list. A SOFOM column and a SOFOM filter,
      plus the search from `pintarExpedientes` (`:5426`). Filters and page persist as
      URL query params with `queryParamMap` as the single load path.
- [ ] **CP-S5 — Expediente detail.** Every field row from `verExpediente` (`:5471`),
      INE images and signature via CP-B4 signed URLs, estado changes (`:5640`), document
      view, PDF download, delete with confirmation. **This screen displays more PII than
      anything else in the product** — no field value in a URL, none in a log.
- [ ] **CP-S6 — Producto.** Per-SOFOM simulator parameters (`:5354`–`:5426`): montos,
      plazos, tasa, comisión, with a live preview of the catálogo copy they generate,
      since these values feed the worked example and the CAT.
- [ ] **CP-S7 — Formatos.** Per-SOFOM `.docx` upload against CP-B8, current-template
      display, preview of the filled solicitud, removal. Port `subirPlantilla` (`:5735`)
      and `verPreviewPlantilla` (`:5817`).
- [ ] **CP-S8 — Bitácora.** The cross-tenant audit log: who did what, to which SOFOM,
      when. Filterable by actor, SOFOM, entity and date. This checkpoint is what makes
      the superadmin tier defensible — an operator who can reach every tenant must leave
      a readable trail. Append-only; the UI offers no delete.
- [ ] **CP-S9 — QA pass.** Desktop and tablet, keyboard-only traversal, table a11y,
      focus management on the detail view and its dialogs, and a check that a non-
      superadmin token is rejected by the backend and not merely hidden by the UI.

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
| B6 | Auth + roles | backend | B2 | ☐ |
| B7 | OCR | backend | B1 | ☐ |
| B8 | Plantillas | backend | B2 | ☐ |
| B9 | Producto/ajustes | backend | B2 | ☐ |
| B10 | Superadmin API | backend | B6, B3 | ☐ |
| B11 | Hardening | backend | B3–B10 | ☐ |
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
| F13 | QA pass | frontend | F1–F12 | ☐ |
| S1 | Scaffold, shell, auth | superadmin | 0.2, B6 | ☐ |
| S2 | SOFOMs | superadmin | S1, B10 | ☐ |
| S3 | Usuarios del panel | superadmin | S1, B10 | ☐ |
| S4 | Expedientes, cross-tenant | superadmin | S1, B3 | ☐ |
| S5 | Expediente detail | superadmin | S4, B4 | ☐ |
| S6 | Producto | superadmin | S2, B9 | ☐ |
| S7 | Formatos | superadmin | S2, B8 | ☐ |
| S8 | Bitácora | superadmin | S1, B10 | ☐ |
| S9 | QA pass | superadmin | S1–S8 | ☐ |

36 checkpoints across three tracks.

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

Panel source, for the superadmin track: `admin-login` (1896), `admin-home` (1917),
`admin-detalle` (2087), panel logic (5252–6049).

---

## Pinned versions

`@ngxs/store` + plugins **21.0.0** · `@lucide/angular` **1.49.0** · `primeng`
**21.1.10** · `@angular/cdk` **21.2.14** · `hono` **4.13.11** · `tesseract.js`
**7.0.0** · `jszip` **3.10.2** · `html2pdf.js` **0.14.0** · `@supabase/supabase-js`
**2.117.2** (backend only).

**Do not install `@ngxs/store@22`** — it requires `@angular/core >=22.0.0 <23.0.0` and
these apps are Angular 21.2. Bumping NGXS means bumping Angular first, which is not in
this plan.

---

## Defects in the source, fixed rather than ported

Each is a deliberate departure from "port verbatim", and each was cleared with the owner
or follows directly from a decision they made.

1. The eight `doc_*` file inputs (`:1728`–`:1765`) are never read by any JS. Wired up in
   CP-F10 — owner's call.
2. Base64 INE photos were written into IndexedDB. Dropped; the backend is the only
   store — owner's call.
3. The OTP was generated in the browser and printed on screen. Moves to CP-B5, echoed
   only under `DEMO_MODE` — owner's call.
4. Supabase URL and anon key were entered in the admin panel and shipped to the browser.
   Now backend env vars — owner's call.
5. `PASS_ADMIN`, a hardcoded string comparison, authenticated the panel whenever the app
   was in local mode. Gone with CP-B6.
6. Supabase RLS error text was shown to the end user (`:3013`). Logged server-side
   instead, per §10.
7. The folio is generated client-side (`:3422`) from a date plus a short random — both
   guessable and collidable. Server-side in CP-B3.
8. `100vh` on the app shell breaks under mobile Safari's collapsing toolbar. `100dvh`.
9. 32px tap targets on the back button and 16px checkboxes are below the 44px minimum.
10. Required-ness was inferred by walking the DOM for visibility (`:3987`, `:4009`).
    Declared explicitly per §8.
11. `sofom_id` scoping was enforced only by the client's own queries. With a superadmin
    tier this becomes a real boundary: enforced in the backend by role, per CP-B3/B6.

**Reviewed and deliberately kept:** the mocked `"98%"` / `"95%"` biometric confidence
(`:5004`). Owner's call, 2026-09-30 — it is a demo and the figure sits behind the
"Modo demostración" label. Recorded as deviation D6 in `01-conventions.md`.
