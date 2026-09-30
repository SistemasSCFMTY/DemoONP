# ONP FER — master plan

**Demo for stakeholders on 2026-10-01. Written 2026-09-30. This is a one-day plan.**

Port `../ONP/onp_fer_etapa2_pf.html` (6,052 lines, single file) into three projects,
rewritten and deployed:

| Project           | Stack                                                | Deploys to         |
| ----------------- | ---------------------------------------------------- | ------------------ |
| `web-app/`        | Angular 21 + NGXS 21 + Tailwind 4, no PrimeNG        | Cloudflare Pages   |
| `superadmin-app/` | Angular 21 + NGXS 21 + Tailwind 4 + PrimeNG 21       | Cloudflare Pages   |
| `backend/`        | Hono 4 on **Cloudflare Workers** + Supabase + Resend | Cloudflare Workers |

Single tenant. One whitelabel, expressed as one config file — no `sofoms` table, no
tenant switcher, no admin UI for branding. Copy and screen structure of the prospect
flow are preserved verbatim. Conventions: `01-conventions.md`.

---

## Read this before you plan your day

The owner chose the full rewrite knowing the timeline. Two things follow.

**1. The order below is the order to build in.** It is sorted so that if you run out of
hours, what is missing is the least damaging thing. Do not work ahead into P2 because
it is more interesting.

| Tier   | Meaning                                  |
| ------ | ---------------------------------------- |
| **P0** | The demo does not happen without it.     |
| **P1** | The demo is materially worse without it. |
| **P2** | Cut first, without discussion.           |

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

| Agent            | Owns                                                   | Model  |
| ---------------- | ------------------------------------------------------ | ------ |
| `onp-backend`    | `backend/`, Supabase schema, Resend, the Worker deploy | Sonnet |
| `onp-frontend`   | `web-app/` — the 28-step prospect wizard and its `ui/` | Sonnet |
| `onp-superadmin` | `superadmin-app/` — the single-tenant staff panel      | Sonnet |

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

- [x] **CP-B1 · P0 — Worker scaffold.** Hono 4.13.11 on Workers, `wrangler.jsonc`,
      TypeScript, `/health`, CORS for both Pages origins, the
      `{ error: { code, message } }` envelope. Secrets via `wrangler secret put`:
      `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `JWT_SECRET`,
      `RESEND_API_KEY`, `DEMO_SOFOM_ID`. `DEMO_MODE` is a plain var.
      **No secret in source, no secret in `wrangler.jsonc`.**
      _Done 2026-09-30. `SUPABASE_SERVICE_KEY` renamed to `SUPABASE_SECRET_KEY`;
      `SUPABASE_PUBLISHABLE_KEY` and `DEMO_SOFOM_ID` added — see CP-B2 and CP-B7._
- [x] **CP-B2 · P0 — Supabase schema.** _Changed in flight, 2026-09-30: the owner is
      **reusing the existing Supabase project**, not creating one. A read-only probe
      found the schema already complete — all nine tables, `expedientes` with 106
      columns (a superset of the contract), the `expedientes` bucket private. So this
      became a verification script plus the three tables that were genuinely missing
      (`prospectos`, `otp_codigos`, `producto`). Nothing is created that exists and no
      column is added; none was missing._
      **The RLS lockdown is now optional and separate** (`0002_cerrar_acceso_publico.sql`).
      `../ONP/arreglo_permisos_final.sql` opens `SELECT` on the whole bucket to `public`
      and `INSERT with check (true)` on five tables, which with the publishable key in a
      browser means anyone can read every INE photo. But **the original single-file app
      still runs against this database and depends on those policies**, and our Worker
      does not need them gone — `service_role` bypasses RLS either way. So the migration
      exists, it is documented as breaking that app, and **the owner decides when to run
      it**.
      Three vocabulary corrections came out of the probe and are applied to
      `02-api-contract.md`: `estado` is `revision` not `en_revision`; none of the eight
      `doc_*` file names exist in the `tipo_archivo` enum (the Worker translates); and
      `rol_usuario` is `administrador | analista | consulta`.
- [x] **CP-B3 · P0 — `POST /solicitudes`.** Accepts the whole expediente. Generates the
      folio **server-side** (the source does it client-side at `:3422`, guessable and
      racy). Uploads `id_frente`, `id_reverso`, `firma` and the eight document files to
      the bucket at `{folio}/{tipo}.{ext}`, computing **SHA-256 per file** — that hash
      is the evidentiary point of the whole exercise, do not drop it. Inserts the
      expediente, the propietario real if present, the `archivos` rows and the signed
      `documentos` row. Returns the folio.
- [x] **CP-B4 · P0 — Panel read API.** `GET /expedientes` (list for the table),
      `GET /expedientes/:id` (detail), `GET /expedientes/:id/archivos/:tipo` (a
      short-lived signed URL), `PATCH /expedientes/:id` (estado).
- [x] **CP-B5 · P0 — OTP.** `POST /otp/enviar`, `POST /otp/validar`. Server-generated
      6-digit code, 120-second TTL matching the source, single-use. Returns the code in
      the body **only** when `DEMO_MODE=true`, so the UI keeps its "Modo demostración"
      label honest. No SMS provider.
- [x] **CP-B6 · P0 — Resend welcome email.** Sent when the prospect registers. An HTML
      template built from `brand.config` — Charis SIL heading, Archivo body, the navy
      and cream palette, the razón social in the footer. **From `onboarding@resend.dev`
      (Resend's sandbox sender), which delivers only to the address that owns the Resend
      account.** That is the owner's deliberate choice: during the demo they will type
      their own email at the registro step. Put this constraint in a comment at the top
      of the mailer so nobody debugs a silent 403 tomorrow. Email failure must **never**
      fail the request — log it and move on.
- [x] **CP-B7 · P0 — Admin login.** _Changed in flight, 2026-09-30: authentication goes
      through **Supabase Auth**, not a password column. `usuarios_panel` has none and
      never had one — the source called `signInWithPassword` (`:5291`) and read the
      profile from that table (`:5300`). Adding our own hash would require knowing the
      existing users' passwords._ The Worker calls `signInWithPassword` server-side with
      `SUPABASE_PUBLISHABLE_KEY`, checks `activo` and `rol` with the secret key, mints
      **our own** httpOnly session JWT signed with `JWT_SECRET`, and discards the
      Supabase session. This API never validates a Supabase-issued token, so there is no
      JWKS. `GET /admin/me`, `POST /admin/logout`, `requireAuth` on the panel routes. The
      source's hardcoded `PASS_ADMIN` does not survive.
- [x] **CP-B8 · P0 — Deploy.** _Deploy-ready, not deployed — the owner holds the
      Cloudflare and Supabase accounts and deploys on their own signal._
      `wrangler deploy --dry-run` is clean (299 KiB gzipped, well under the 3MB cap),
      `wrangler check startup` measures 20ms, both rate-limit bindings resolve, and the
      README documents every secret with the exact commands and what breaks without
      each. **Still to do at deploy time:** run the secrets, then replace the two
      placeholder Pages origins in `src/app.ts` with the real URLs and redeploy.
- [x] **CP-B9 · P1 — Producto endpoint.** The simulator parameters (`:2340`) read and
      written, so CP-S4 can edit what the prospect sees.
- [x] **CP-B10 · P1 — Confirmation email.** A second Resend template on submission,
      carrying the folio. Same sandbox-sender constraint.
- [x] **CP-B11 · P2 — Plantillas. Done by another road, 2026-09-30.** The owner un-cut
      CP-S6, so the panel needs template storage after all — but the `.docx` parsing
      stays in the browser for the same reason the OCR does: JSZip plus the unzip does
      not fit the Worker bundle (deviation D7). So the panel extracts the HTML and the
      Worker stores it: `GET/POST /plantillas`, `GET /plantillas/:id`,
      `DELETE /plantillas/:id` (soft). **No `POST /solicitud/render`** — nothing renders
      server-side, and `web-app/` keeps rendering the solicitud from its constant.
- [ ] **CP-B12 · P2 — Bitácora.** Append-only audit rows per mutation. Still open, but
      partly overtaken: `PATCH /expedientes/:id` already writes `historial_estados` on
      every estado change (CP-B4), which is the audit trail the panel actually shows.
      What is missing is the generic `bitacora` row per mutation.

## Prospect app — `onp-frontend`

- [x] **CP-F1 · P0 — Shell, routing, NGXS.** The 390px shell (topbar, progress, body),
      `provideStore`, the step-order guard, the route map for the 28 screens, back
      navigation on router history, `brand.config` wired into the shell.
- [x] **CP-F2 · P0 — UI primitives.** `onp-field`, `onp-card`, `onp-alert`,
      `onp-button`, `onp-checkbox-group`, `onp-radio-group`, `onp-status`,
      `onp-leyenda`, `onp-modal`, `onp-progress`, `onp-topbar`, `onp-otp-input`,
      `onp-fecha-trio`, `onp-preview-box`, `onp-pep-section`.
- [x] **CP-F3 · P0 — Portada + informativas.** `bienvenida`, `catalogo`, `privacidad`,
      `terminos`, `ayuda`. Text comes from `brand.config`, as `pintarDatosSofom`
      (`:2197`) does in the source.
- [x] **CP-F4 · P0 — Simulador.** `es-cliente`, `simulador`, `requisitos`. Port and
      **unit-test** `pagoMensual` (`:2380`), `comisionDe` (`:2386`), `calcularCAT`
      (`:2395`, bisection), `pesos`/`pesosCent`. The owner named live CAT math as a
      thing stakeholders will poke at — if a credit person is in the room, this is the
      screen they will test. It is the one place tonight where tests are not optional.
- [x] **CP-F5 · P0 — Registro + OTP.** `registro`, `verificar-cliente`, `otp`. Password
      meter (`:2522`), phone formatting (`:2515`), the six-box OTP input with paste and
      the 120-second countdown, against CP-B5. **Registration triggers CP-B6's email.**
- [x] **CP-F6 · P0 — Geolocalización.** Permission flow (`:2288`), capture at the four
      evidentiary moments (`:2263`), `auth-location`. Denial must not dead-end.
- [x] **CP-F7 · P0 — Formulario.** `form-generales`, `form-domicilio`, `form-contacto`,
      `form-laborales`, `envio-formulario`. CURP generation (`:4102`) with check digit
      (`:4171`), CURP/RFC cross-checking against name and birth date (`:4205`), CP and
      phone validators. Conditional required-ness declared per §8, not inferred from DOM
      visibility. **Largest piece of work in this track.**
- [x] **CP-F8 · P0 — PEP + declaratoria.** `pep-propio`, `pep-familia`, `declaratoria`
      (290 lines of legal copy, verbatim, set in Archivo), plus the propietario real /
      tercero branch and its `pr_*` fields.
- [x] **CP-F9 · P0 — Identificación + documentos.** `auth-buro`, `id-photos`,
      `documents`. `getUserMedia` capture front and back with a file-upload fallback,
      quality feedback (`:4686`), **Tesseract 7 in the browser** from npm with the
      parsers at `:4886` and `:4929`, and the eight document uploads **actually wired**
      to CP-B3 — the source declares those inputs and never reads them.
      **If the night runs short, mock the OCR autofill and keep the capture.**
- [x] **CP-F10 · P0 — Biometría + video.** `biometrics`, `video`, both mocked behind
      named service interfaces. The `"98%"` / `"95%"` figures stay verbatim — owner's
      call, it is a demo, and they sit behind the "Modo demostración" label.
- [x] **CP-F11 · P0 — Solicitud, firma, envío.** `solicitud` rendered from the template
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

- [x] **CP-S1 · P0 — Scaffold, shell, login.** The `superadmin-app/` project wired up:
      tokens from CP-0.2, PrimeNG 21.1.10 + `@angular/cdk@21.2.14`, stock Aura plus an
      ONP preset built from the §3 tokens, login against CP-B7, the session guard,
      `PanelState`, the nav shell. Desktop-first — do not apply the 390px shell.
- [x] **CP-S2 · P0 — Expedientes list.** A `p-table` with header/body templates,
      `rowHover`, whole-row click into detail, `[scrollable]` + `scrollHeight`,
      `emptymessage` — never a hand-rolled row list. Search per `pintarExpedientes`
      (`:5426`). Filters persist as URL query params.
- [ ] **CP-S3 · P0 — Expediente detail.** The field rows from `verExpediente` (`:5471`),
      INE photos and signature via CP-B4 signed URLs, estado changes (`:5640`), PDF
      download. **This is the payoff shot of the demo** — the submission the audience
      just watched being made, arriving with its photos. Make it look finished.
- [x] **CP-S4 · P0 — Deploy to Pages.** Build, deploy, confirm login works against the
      deployed Worker and the detail view renders real uploaded images.
      **Config and documentation only — not deployed.** The Cloudflare account is the
      owner's and is not the one `wrangler` is authenticated against here; they run it
      on their own signal. Landed: `wrangler@^4` as a devDependency, the `deploy`
      script (`wrangler pages deploy dist/superadmin-app/browser
    --project-name=onp-panel`), `public/_redirects` with `/*  /index.html  200` so a
      reload on the detail view is not a CDN 404, and `superadmin-app/README.md` with
      the build and deploy steps. Confirming login against the deployed Worker waits
      on CP-B8.
- [x] **CP-S5 · P1 — Producto.** The simulator parameters (`:5354`) against CP-B9, with
      a preview of the catálogo copy they generate. Built against the contract's
      `GET`/`PUT /producto` and the in-memory API until CP-B9 lands. `monto_paso`,
      `plazo_paso`, `nombre` and `iva` are in `PRODUCTO` (`:2340`) but **not** in
      `02-api-contract.md`; the source's screen edits two of them, so either the
      contract grows or the simulator's step size stops being configurable —
      `onp-backend` and the owner to decide.
- [x] **CP-S6 · P2 — Formatos and Ajustes.** `.docx` upload and the sofom identity
      editor. Uncut: the owner asked for both tabs back.
      **Formatos** — the active formato, upload, "Ver cómo queda" and the searchable
      catálogo de claves. The `.docx` is parsed in the browser with JSZip and only the
      resulting HTML is sent (same platform constraint as the OCR — see the Cloudflare
      section above). **Ajustes** — datos de la SOFOM and the export, two cards only.
      **Not ported, by the owner's decision:** the "Dónde se guarda la información"
      card (`:2048`), whose Project URL and anon key fields would put a Supabase
      credential in a browser, and "Borrar todos los datos" (`:6025`), an unguarded
      mass delete against a live database.

---

## Videograbación real — `03-videograbacion.md`

Owner, 2026-09-30: the identity recording stops being simulated. Five checkpoints
(CP-V1 … CP-V5), P0 → P2, in `03-videograbacion.md`. The short version: the Postgres
enum already has `video_identificacion` so there is no migration, and the upload loop
already treats a failed part as non-fatal, so "the video never fails the submission" is
the existing behaviour rather than new work. What is missing is the MIME allowlist, the
part→enum mapping, and a `MediaRecorder`. Biometrics stay simulated.

## Progress board

| CP  | Title                       | Tier | Agent      | Depends on | Status                                    |
| --- | --------------------------- | ---- | ---------- | ---------- | ----------------------------------------- |
| 0.1 | Restructure + brand config  | P0   | —          | —          | ☑                                         |
| 0.2 | Design tokens               | P0   | —          | 0.1        | ☑                                         |
| 0.3 | API contract                | P0   | —          | 0.1        | ☑                                         |
| B1  | Worker scaffold             | P0   | backend    | 0.1        | ☑                                         |
| B2  | Supabase schema             | P0   | backend    | B1         | ☑                                         |
| B3  | POST /solicitudes           | P0   | backend    | B2, 0.3    | ☑                                         |
| B4  | Panel read API              | P0   | backend    | B2, 0.3    | ☑                                         |
| B5  | OTP                         | P0   | backend    | B1         | ☑                                         |
| B6  | Resend welcome email        | P0   | backend    | B1         | ☑                                         |
| B7  | Admin login                 | P0   | backend    | B2         | ☑                                         |
| B8  | Deploy Worker               | P0   | backend    | B3–B7      | ☑                                         |
| B9  | Producto endpoint           | P1   | backend    | B2         | ☑                                         |
| B10 | Confirmation email          | P1   | backend    | B6, B3     | ☑                                         |
| B11 | Plantillas                  | P2   | backend    | B2         | ☑                                         |
| B12 | Bitácora                    | P2   | backend    | B2         | ☐                                         |
| F1  | Shell, routing, NGXS        | P0   | frontend   | 0.2        | ☑                                         |
| F2  | UI primitives               | P0   | frontend   | 0.2        | ☑                                         |
| F3  | Portada + informativas      | P0   | frontend   | F1, F2     | ☑                                         |
| F4  | Simulador                   | P0   | frontend   | F2         | ☑                                         |
| F5  | Registro + OTP              | P0   | frontend   | F2, B5, B6 | ☑                                         |
| F6  | Geolocalización             | P0   | frontend   | F1         | ☑                                         |
| F7  | Formulario                  | P0   | frontend   | F2         | ☑                                         |
| F8  | PEP + declaratoria          | P0   | frontend   | F7         | ☑                                         |
| F9  | Identificación + documentos | P0   | frontend   | F2, B3     | ☑                                         |
| F10 | Biometría + video           | P0   | frontend   | F2         | ☑                                         |
| F11 | Solicitud, firma, envío     | P0   | frontend   | F8, B3     | ☑                                         |
| F12 | Deploy to Pages             | P0   | frontend   | F1–F11, B8 | ◐ build listo, deploy pendiente del owner |
| F13 | QA pass                     | P2   | frontend   | F12        | ☐                                         |
| S1  | Scaffold, shell, login      | P0   | superadmin | 0.2, B7    | ☑                                         |
| S2  | Expedientes list            | P0   | superadmin | S1, B4     | ☑                                         |
| S3  | Expediente detail           | P0   | superadmin | S2, B4     | ☑                                         |
| S4  | Deploy to Pages             | P0   | superadmin | S3, B8     | ◐                                         |
| S5  | Producto                    | P1   | superadmin | S1, B9     | ☑                                         |
| S6  | Formatos and Ajustes        | P2   | superadmin | S1         | ☑                                         |

**26 P0 · 4 P1 · 5 P2.** ◐ = built and documented, waiting on a dependency to close.

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

| #   | Screen            | %   | Line |     | #   | Screen           | %   | Line |
| --- | ----------------- | --- | ---- | --- | --- | ---------------- | --- | ---- |
| 1   | bienvenida        | 0   | 274  |     | 15  | form-contacto    | 24  | 1004 |
| 2   | catalogo          | 0   | 305  |     | 16  | form-laborales   | 29  | 1029 |
| 3   | privacidad        | 0   | 343  |     | 17  | envio-formulario | 32  | 1074 |
| 4   | terminos          | 0   | 402  |     | 18  | pep-propio       | 36  | 1101 |
| 5   | ayuda             | 0   | 445  |     | 19  | pep-familia      | 39  | 1181 |
| 6   | es-cliente        | 2   | 522  |     | 20  | declaratoria     | 44  | 1278 |
| 7   | simulador         | 4   | 542  |     | 21  | auth-buro        | 50  | 1567 |
| 8   | requisitos        | 5   | 592  |     | 22  | id-photos        | 60  | 1589 |
| 9   | registro          | 6   | 623  |     | 23  | documents        | 68  | 1716 |
| 10  | verificar-cliente | 6   | 654  |     | 24  | biometrics       | 75  | 1773 |
| 11  | otp               | 7   | 686  |     | 25  | video            | 82  | 1799 |
| 12  | auth-location     | 10  | 718  |     | 26  | solicitud        | 90  | 1832 |
| 13  | form-generales    | 14  | 774  |     | 27  | signature        | 96  | 1853 |
| 14  | form-domicilio    | 19  | 884  |     | 28  | complete         | 100 | 1871 |

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

13. **The panel's estado chip shows an unrecognised estado instead of relabelling
    it.** The source falls back to `pendiente` (`:5444`), which puts a record in a
    state it is not in. (The slug itself is _not_ a departure: `revision` is the
    Postgres enum value and the panel transmits it verbatim. An earlier version of
    `02-api-contract.md` said `en_revision`, the panel followed it, and the deployed
    Worker rejected every estado change — corrected here and in PR #4.)
14. **The panel's "Eliminar expediente" (`:5652`) is not built.** There is no delete
    endpoint in `02-api-contract.md`, and what an operator may destroy on a regulated
    KYC file is the owner's call. Recorded as the open question in
    `01-conventions.md` §12.
15. **The detail view drops the Producto, Comisión de apertura, Total estimado and
    CAT estimado rows** (`:5497`). The source printed them from its flattened
    template data; the contract's expediente does not carry them and they cannot be
    recomputed without live product parameters. §11 bans a figure with no source, and
    in a credit UI that is a compliance problem rather than a design one. They return
    with CP-S5.
16. **The panel's "Descargar PDF" opens a print view rather than rasterising with
    `html2pdf`** (`:5661`). Half a megabyte in a staff tool to do worse than the
    browser's own Save as PDF, which keeps the document as selectable text.
17. **The panel's login drops "Volver a la solicitud"** (`:1912`). It is a separate
    deployment now; there is no prospect flow behind it to go back to.
18. **The Supabase project is reused, not created.** Its schema turned out to be
    complete and a superset of the contract — 106 columns on `expedientes`, nine
    tables, the bucket already private. Where the database and `02-api-contract.md`
    disagreed, the database won: `estado` is `revision`, not `en_revision`, and none of
    the eight `doc_*` file names exist in the `tipo_archivo` enum. Both corrected in
    the contract; the Worker maps the part names. Deviation D9.
19. **Panel passwords stay in Supabase Auth.** `usuarios_panel` has no password column
    and adding one would require knowing the existing users' passwords. The Worker
    calls `signInWithPassword` server-side and still mints its own session JWT.
    Deviation D10.
20. **The RLS lockdown is optional and the owner's call**, because the original
    single-file app still runs against this database and depends on the open policies.
    It is not a prerequisite for the Worker — `service_role` bypasses RLS either way.
    Revises departure 11 above.
21. `documento_html` added to the `POST /solicitudes` payload; the contract required
    the signed `documentos` row but carried no field for the HTML. Deviation D12.

### Found while porting, 2026-09-30 — `onp-frontend`, CP-F4 to CP-F11

Six more defects. Each is a bug, not a decision, so none is reproduced; all six are
flagged in the CP-F1–F12 pull request for the owner to confirm.

18. **The CURP generator produces a 17-character CURP.** `generarCURPPF` (`:4102`)
    concatenates 16 characters and appends a check digit; position 17, the homonym
    differentiator, is missing. Its own `validarCURPLocal` (`:4185`) demands 18 and
    _hides the status line_ below that length rather than complaining, so every
    generated CURP is invalid and nothing says so. Position 17 is restored per the
    published rule: `0` for births before 2000, `A` from 2000 on. The cross-check
    ignores that position, since RENAPO may have assigned a differentiator no generator
    can predict.
19. **The CURP generator does not fold accents.** It uppercases and nothing else, so
    `PÉREZ` yields a CURP containing `É` and `PEÑA` one containing `Ñ`. RENAPO folds
    diacritics and maps `Ñ` to `X`. Both are extremely common in Mexican surnames.
20. **The demo CURP fails its own check digit.** The "Modo demostración" tip on
    `verificar-cliente` (`:661`) instructs the presenter to type
    `RASL910714MNLMLR04`; the correct final digit is `1`. In local mode
    `verificarCliente` (`:2575`) runs `validarCURPLocal`, so the demo as documented is
    rejected. **The copy is the owner's call, so the string is kept verbatim** and
    `verificar-cliente` accepts that fixture by identity as well as by validation.
    _The owner may prefer the digit corrected to `1` — that is a copy change and it is
    theirs to make._
21. **The "entre calles" hint is misspelt on one of its two copies.** `Indícalas
vialidades perpendiculares` on `form-domicilio` (`:926`), `Indica las vialidades
perpendiculares` on the propietario real's copy of the same block (`:1430`). Ported
    as the correct "Indica las". A predictable consequence of the two blocks being
    duplicated markup; in the port they share one component.
22. **The OCR front parser destroys the accents it then looks for.**
    `parsearFrente` (`:4887`) sanitises with `[^A-Z0-9\n ]`, which is ASCII-only, so
    `AÑO` becomes `A O` and `EMISIÓN` becomes `EMISI N` — and the patterns that run
    next are `A[NÑ]O\s*DE\s*REGISTRO` and `EMISI[OÓ]N`. Both accented alternatives are
    dead code, and año de registro, número de emisión and año de emisión only parse
    when Tesseract drops the accent, which its own whitelist (`:4848`) tells it not to
    do. The accented letters are preserved. Found by a unit test.
23. **The solicitud template interpolates form values into HTML unescaped.**
    `llenarPlantilla` (`:3716`) substitutes `{{clave}}` raw, so a surname containing
    `<` breaks the document and one containing a `<script>` tag executes in the page
    rendering it — including the staff panel's detail view, where the same stored HTML
    is displayed. Every value in that template comes from a form a stranger filled in.
    Values are escaped in the port; `firma` is exempt because it is an `<img>` the app
    itself builds.

Also not ported, though not a defect: the OCR text is logged to the console in full
(`:4864`). That text is the contents of an identity document, and §1 forbids logging a
field value.

**Reviewed and deliberately kept:** the mocked `"98%"` / `"95%"` biometric confidence
(`:5004`). Owner's call — it is a demo and the figure sits behind the "Modo
demostración" label. Recorded as deviation D6 in `01-conventions.md`.
