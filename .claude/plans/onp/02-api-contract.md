# ONP FER — API contract

The referee. Three projects, no shared package, so this shape exists in three places:
Zod schemas in `backend/src/schemas/`, TypeScript interfaces in
`web-app/src/app/model/interfaces/`, and again in `superadmin-app/`. **They drift
silently.** A PR changing one changes the others.

Base URL is the Worker. All bodies JSON unless noted. All errors:

```json
{ "error": { "code": "VALIDACION", "message": "Escribe tu CURP a 18 caracteres." } }
```

`code` ∈ `VALIDACION | NO_AUTORIZADO | NO_ENCONTRADO | OTP_INVALIDO | OTP_EXPIRADO |
DEMASIADAS_SOLICITUDES | ERROR_INTERNO`. `message` is Spanish and safe to show a
prospect — never a Supabase or Postgres error verbatim.

---

## Public — the prospect flow

### `GET /health`
`200 → { ok: true, at: ISO8601 }`

### `POST /otp/enviar`
`{ telefono: string }` — 10 digits.
`200 → { enviado: true, expiraEn: ISO8601, codigo?: string }`

`codigo` is present **only** when `DEMO_MODE=true`, so the UI can render it under its
"Modo demostración" label exactly as the source does (`:2650`). TTL 120 s, matching the
source. Rate-limited per phone and per IP → `DEMASIADAS_SOLICITUDES`.

### `POST /otp/validar`
`{ telefono: string, codigo: string }` — 6 digits.
`200 → { valido: true }` · `400 → OTP_INVALIDO | OTP_EXPIRADO`
Single use: a second validate of the same code fails.

### `POST /prospectos`
`{ nombres, apellidoPaterno, apellidoMaterno, correo, telefono, password }`
`201 → { id: string }`

Triggers the Resend welcome email (CP-B6). **The email must never fail this request** —
log the failure and return 201 anyway.

### `POST /solicitudes`
`multipart/form-data`:

| Part | Type | Notes |
|---|---|---|
| `expediente` | JSON | the whole payload, shape below |
| `id_frente` | file | jpg |
| `id_reverso` | file | jpg |
| `firma` | file | png, from the signature canvas |
| `doc_id`, `doc_curp`, `doc_fiscal`, `doc_fea`, `doc_domicilio` | file | pdf/jpg/png |
| `doc_poder`, `doc_id_propietario`, `doc_domicilio_propietario` | file | only when tercero |

**Part name ≠ stored `tipo`.** `archivos.tipo` is the Postgres enum `tipo_archivo`,
which already exists in the reused project and contains **none** of the eight `doc_*`
names — an insert with `doc_curp` fails with a 500, not a validation error. The Worker
translates; the part names above are unchanged because `web-app/` is built against them.

| Part | Stored `tipo` |
|---|---|
| `id_frente` · `id_reverso` · `firma` | same |
| `doc_curp` | `constancia_curp` |
| `doc_fiscal` | `constancia_fiscal` |
| `doc_fea` | `constancia_fea` |
| `doc_domicilio` | `comprobante_domicilio` |
| `doc_poder` | `poder_notarial` |
| `doc_id_propietario` | `id_propietario_real` |
| `doc_domicilio_propietario` | `domicilio_propietario_real` |
| `doc_id` | `otro` |

`doc_id` → `otro` because `id_frente`/`id_reverso` are taken by the camera captures;
reusing them would have the uploaded PDF overwrite the photo at the same
`{folio}/{tipo}.{ext}` path. The full enum also has `video_identificacion`, `huella`
and `rostro`, which this backend does not write yet — the panel may still meet them on
older expedientes.

`201 → { folio: string, id: string }`

The **folio is generated server-side**. The source generates it in the browser
(`:3422`) from a date plus a short random — guessable and collidable.

Per file: uploaded to bucket `expedientes` at `{folio}/{tipo}.{ext}`, **SHA-256
computed server-side**, one `archivos` row written with `tipo, ruta, nombre_original,
tipo_mime, tamano_bytes, hash_sha256, capturado_en`. The hash is the evidentiary point
of the product — do not drop it.

#### `expediente` payload

Field-for-field from `mapearExpediente` (`onp_fer_etapa2_pf.html:2851`) and
`mapearPropietario` (`:2948`). Grouped here; flat on the wire, `snake_case`.

- **Identidad** — `apellido_paterno, apellido_materno, nombres, nombre_completo,
  genero, fecha_nacimiento` (ISO date), `entidad_nacimiento, pais_nacimiento,
  nacionalidad, curp, rfc, serie_fea`
- **Domicilio** — `tipo_vialidad, nombre_vialidad, numero_exterior, numero_interior,
  entre_calles, codigo_postal, colonia, municipio, ciudad, entidad_federativa, pais,
  domicilio_completo`
- **Contacto** — `telefono_celular, telefono_fijo, correo`
- **Laborales** — `empleo, puesto, empresa, giro_empresa, antiguedad,
  ingreso_mensual` (number), `otros_ingresos`
- **PEP propio** — `pep_propio` (bool), `pep_propio_ambito, pep_propio_institucion,
  pep_propio_puesto, pep_propio_inicio, pep_propio_fin, pep_propio_vigente` (bool)
- **PEP familia** — `pep_familia` (bool), `pep_familia_parentesco, pep_familia_ambito,
  pep_familia_institucion, pep_familia_puesto, pep_familia_inicio, pep_familia_fin,
  pep_familia_vigente` (bool)
- **Identificación** — `tipo_identificacion, ine_clave_elector, ine_anio_registro,
  ine_num_emision, ine_anio_emision, ine_cic, ine_ocr`
- **Autorizaciones** — `autoriza_grabacion, autoriza_geolocalizacion, autoriza_buro`
  (bools), `buro_nip`
- **Evidencias** — `biometria_huella, biometria_rostro, video_grabado, firmado` (bools)
- **Geo** — `geo_latitud, geo_longitud, geo_precision_metros` (numbers), `ubicaciones`
  (array of `{ etiqueta, latitud, longitud, precision_metros, capturado_en }` — the
  four evidentiary moments: autorización, fotos, video, firma)
- **Solicitud** — `monto_solicitado, plazo_solicitado_meses, tasa_solicitada,
  pago_estimado` (numbers), `es_cliente_existente` (bool), `numero_cliente`
- **Meta** — `dispositivo, version_app`
- **Documento** — `documento_html`: the rendered solicitud exactly as the prospect saw
  and signed it, from CP-F11. It becomes the `documentos` row that
  `GET /expedientes/:id` returns as `documento.contenido_html`. **Added 2026-09-30 by
  `onp-backend`** — CP-B3 requires the signed `documentos` row and the detail endpoint
  returns it, but no field in this list carried the HTML. The source sent it from the
  browser (`exp.documento`, `:3130`) and that is still the only source: the Worker
  renders no templates (CP-B11 is P2 and expected to be cut). Optional, so a submission
  that omits it still succeeds, just without a `documentos` row.
- **Propietario real** — present only when a tercero is declared. Same shape prefixed
  `pr_`: `pr_apellido_paterno, pr_apellido_materno, pr_nombres, pr_nombre_completo,
  pr_genero, pr_fecha_nacimiento, pr_entidad_nacimiento, pr_nacionalidad, pr_curp,
  pr_rfc, pr_domicilio_completo, pr_codigo_postal, pr_colonia, pr_municipio,
  pr_entidad_federativa, pr_telefono, pr_correo, pr_empleo, pr_puesto, pr_empresa,
  pr_ingreso_mensual`

Empty strings normalise to `null` server-side (the source's `oNulo`, `:2846`).
Dates arrive as `dd/mm/yyyy` trios from the UI and are converted to ISO by the client
before sending — the Worker validates ISO only.

### `GET /producto`
Public — the simulator reads it.
`200 → { monto_min, monto_max, plazo_min, plazo_max, tasa_anual, comision_apertura:
boolean, comision_pct, comision_desde }`

Shape from `PRODUCTO` (`:2340`). CAT, pago mensual and comisión are computed **in the
browser** from these; the backend never sends a precomputed figure the UI would have to
trust.

---

## Authenticated — the staff panel

Session is an httpOnly cookie carrying a JWT. Every route below returns
`401 NO_AUTORIZADO` without it.

### `POST /admin/login`
`{ correo, password }` → `200 → { nombre_completo }` + `Set-Cookie`.

**Passwords live in Supabase Auth, not in `usuarios_panel`.** That table has no password
column and never had one — it is the profile (`rol`, `activo`, `nombre_completo`), which
is how the source used it (`:5300`) after calling `signInWithPassword` (`:5291`). So the
Worker calls `signInWithPassword` server-side with the publishable key, looks the profile
up with the secret key, and requires `activo = true` and a `rol` in
`administrador | analista | consulta` (the `rol_usuario` enum — there is no `superadmin`).
The Supabase session is then discarded: the cookie carries **our own** HS256 JWT signed
with `JWT_SECRET`, and this API never validates a Supabase-issued token. Corrected
2026-09-30 by `onp-backend`.

### `GET /admin/me` → `200 → { correo, nombre_completo }`
### `POST /admin/logout` → `204`

### `GET /expedientes`
Query: `q` (search across folio, nombre, curp), `estado`, `limit`, `offset`.
`200 → { items: ExpedienteResumen[], total: number }`

`ExpedienteResumen = { id, folio, nombre_completo, curp, estado, monto_solicitado,
creado_en }`

### `GET /expedientes/:id`
`200 →` the full expediente row plus `{ propietario_real: {...} | null, archivos:
[{ tipo, tamano_bytes, hash_sha256, capturado_en }], documento: { contenido_html,
firmado_en } }`

**No signed URLs in this payload** — fetch them one at a time below, so a list view
never mints URLs it does not render.

### `GET /expedientes/:id/archivos/:tipo`
`tipo` ∈ the eleven upload types.
`200 → { url: string, expiraEn: ISO8601 }` — short-lived signed URL, 5 minutes.

### `PATCH /expedientes/:id`
`{ estado: 'pendiente' | 'revision' | 'aprobado' | 'rechazado', motivo?: string }`
`200 → { estado }`

**It is `revision`, not `en_revision`.** The Postgres enum `estado_expediente` already
exists and reads
`borrador | pendiente | revision | aprobado | rechazado | cancelado`. `en_revision` is
not in it, so that value fails as a 500 from the database rather than a validation
error. Corrected 2026-09-30 by `onp-backend` after probing the real project;
`superadmin-app/` must send `revision`. `borrador` and `cancelado` read back fine but
the panel does not set them.

`motivo` is optional and not in the original contract. It fills
`historial_estados.motivo` — that table already exists (`expediente_id`,
`estado_anterior`, `estado_nuevo`, `motivo`, `usuario_id`, `creado_en`) and the Worker
writes a row on every estado change. A rejection with no reason recorded makes the
audit trail useless.


### `PUT /producto` *(P1)*
Same shape as `GET /producto`. Edits what the prospect's simulator shows.

---

## Formatos and Ajustes — CP-S6

Un-cut by the owner, 2026-09-30. All behind the session cookie; **writes additionally
require `rol === 'administrador'`**, and `analista`/`consulta` get `403` with code
`NO_AUTORIZADO` — same code as the 401 because the code list is frozen, different status
because "log in again" fixes one and not the other.

`requireAdmin` re-reads `usuarios_panel` rather than trusting the token's `rol`. The
token lives eight hours; demoting someone should not take eight hours to bite.

**Single tenant throughout.** Every query is scoped to the `DEMO_SOFOM_ID` secret and
**no endpoint accepts a sofom id from the client** — not in a path, a body or a header.

### `GET /sofom`
`200 → { razon_social, rfc, domicilio, telefono, correo_contacto }`

Five columns only. `nombre_corto`, `color_primario`, `logo_url` and `activa` exist in the
table and are deliberately not exposed: visual branding is
`web-app/src/app/brand.config.ts` (deviation D3).

### `PUT /sofom` *(administrador)*
Same body → same shape. `razon_social` is required; the rest normalise empty to `null`.
A partial `update`, so `nombre_corto` (NOT NULL) survives untouched.

### `GET /plantillas`
`200 → [{ id, clave, nombre, archivo_original, version, activa, creado_en }]`

**No `contenido_html`** — hundreds of KB a row that the Formatos table does not paint.

### `GET /plantillas/:id`
`200 →` the row **including** `contenido_html`.

### `POST /plantillas` *(administrador)*
`{ clave, nombre, contenido_html, archivo_original? }` → `201` with the created row.

Deactivates any active row with the same `clave`, then inserts with
`version = max(version for that clave) + 1` and `activa = true`. The deactivate happens
first: if the second step fails you are left with no active template, which is visible,
rather than two, which silently makes the renderer pick one.

`clave` is `[a-z0-9_]+`. The solicitud template's is `solicitud_credito` (`:3129`).

**`contenido_html` is untrusted and it is a stored-XSS carrier.** It originates in a
browser — the panel unzips the `.docx` client-side — and lands in a column the panel
later renders. The Worker checks two things: that it is a string, and that it is under
1,000,000 characters. **It is stored verbatim and deliberately not sanitised**: a
half-sanitiser on the write path is worse than none, because it invites the next reader
to trust the column. Sanitising belongs to whoever renders. Corollary: nothing in this
backend renders it, mails it, or serves it as `text/html`.

### `DELETE /plantillas/:id` *(administrador)*
`204`. **Soft** — sets `activa = false`. This is the source's "Quitar y usar el
predeterminado" (`:2015`). The row is the record of which text each expediente was
signed against; deleting version 2 leaves every solicitud signed with it unexplainable.

### `GET /expedientes/exportar`
`200 → { generado_en, total, truncado, expedientes: [...] }`

Every expediente for the tenant, each with its `propietario_real`, its `archivos`
metadata and its `documento`. Registered before `/:id` so "exportar" is not read as a
uuid.

Three deliberate limits, because this is the most sensitive read in the product — one
object holding every applicant's CURP, RFC, address, income and INE hashes:

- **No signed URLs.** `archivos` carries metadata and hashes; seeing a file still means
  asking for it one at a time, which leaves a log line.
- **`documento.contenido_html` is omitted** unless `?incluir_documento=true`.
- **Capped at 2,000 expedientes**, paged 200 at a time. A Worker has 128MB and this is
  assembled in memory. `truncado: true` says so in the envelope rather than returning an
  incomplete set that looks complete.

`GET` only, so by the rule above it needs a session but not `administrador`. **Worth a
second look** — it is a full data extract, and the owner may want it admin-only.

---

## Not in this contract

Deliberately absent, so nobody builds against them: SOFOM management, panel-user
management, cross-tenant search, storage-mode switching, connection-string
configuration, and branding endpoints. Single tenant; branding is
`web-app/src/app/brand.config.ts`.
