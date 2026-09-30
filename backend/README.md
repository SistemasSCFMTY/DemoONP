# ONP FER — backend

Hono 4 sobre Cloudflare Workers. Supabase para datos y almacén, Resend para correo.

---

## Puesta en marcha, en orden

### 1. La base de datos

**El esquema ya está.** Este backend escribe contra el proyecto de Supabase que ya
existe. Lee `supabase/README.md` — es corto y dice exactamente qué correr.

En resumen, en el SQL Editor de Supabase:

1. `supabase/verificacion.sql` — **solo lee.** Dice si la base es la que el Worker
   espera e imprime el valor de `DEMO_SOFOM_ID`. Empieza por aquí.
2. `supabase/migrations/0001_tablas_nuevas.sql` — crea `prospectos`, `otp_codigos` y
   `producto`. Es lo único que falta; no toca nada más.
3. `supabase/seed.sql` — el renglón de `producto`.
4. `supabase/migrations/0002_cerrar_acceso_publico.sql` — **OPCIONAL, y rompe la app
   original de un solo archivo.** Lee la advertencia antes de correrla. El Worker
   funciona igual con o sin ella.

### 2. Los secretos, en local

```bash
npm install
cp .dev.vars.example .dev.vars   # y llénalo
npm run dev
curl localhost:8787/health
```

`.dev.vars` está en `.gitignore`. El nombre es exacto: wrangler no lee otro.

### 3. Los secretos, en producción

Uno por uno, con el prompt interactivo. **Ninguno va en `wrangler.jsonc`** — ese
archivo se commitea.

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SECRET_KEY
wrangler secret put SUPABASE_PUBLISHABLE_KEY
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put DEMO_SOFOM_ID
```

| Secreto | Qué es | Si falta |
|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co`. Solo el host | Nada funciona |
| `SUPABASE_SECRET_KEY` | Nombre heredado: `service_role`. Esquiva RLS | Nada funciona |
| `SUPABASE_PUBLISHABLE_KEY` | Nombre heredado: `anon`. Solo para el login del panel | El panel no abre |
| `JWT_SECRET` | Firma nuestra cookie de sesión. `openssl rand -base64 48` | El panel no abre |
| `RESEND_API_KEY` | Resend → API Keys | Los correos no salen; **nada más se rompe** |
| `DEMO_SOFOM_ID` | El uuid de la SOFOM activa | **Ningún envío funciona** |

`DEMO_MODE` **no** es secreto: es una `var` en `wrangler.jsonc`. En `"true"` hace que
`/otp/enviar` devuelva el código generado para que la UI lo pinte bajo su etiqueta
«Modo demostración».

**Las dos llaves de Supabase son de servidor.** Ninguna llega a un navegador, ni
siquiera la publicable: `web-app/` y `superadmin-app/` no conocen la URL ni ninguna
llave (`01-conventions.md` §1).

### 4. Desplegar

```bash
npm run typecheck        # tsc --noEmit
npm test                 # vitest run
npx wrangler deploy --dry-run   # valida config y bundle sin subir nada
npm run deploy           # wrangler deploy
```

Después del despliegue, actualiza los orígenes de CORS en `src/app.ts` con las URL
reales de Pages y vuelve a desplegar. Hoy están las dos `*.pages.dev` esperadas más
`localhost:4200` y `:4300`. **Nunca `*`.**

Comprobación: `curl https://<worker>.workers.dev/health` debe devolver
`{"ok":true,"at":"…"}`.

---

## Endpoints

| Ruta | Sesión | Checkpoint |
|---|---|---|
| `GET /health` | — | B1 |
| `POST /otp/enviar` · `POST /otp/validar` | — | B5 |
| `POST /prospectos` | — | B6 |
| `POST /solicitudes` | — | B3 |
| `GET /producto` | — | B9 |
| `POST /admin/login` | — | B7 |
| `GET /admin/me` · `POST /admin/logout` | cookie | B7 |
| `GET /expedientes` · `GET /expedientes/:id` | cookie | B4 |
| `GET /expedientes/:id/archivos/:tipo` | cookie | B4 |
| `PATCH /expedientes/:id` | cookie | B4 |
| `PUT /producto` | cookie | B9 |

La forma exacta está en `.claude/plans/onp/02-api-contract.md` y, en código, en
`src/schemas/`.

---

## Lo que muerde

- **Tesseract OCR no corre aquí.** Su núcleo WASM más unos 15 MB de `traineddata`
  rebasan el tope del bundle y el presupuesto de CPU de un Worker. El OCR corre en el
  navegador y lo dueña `web-app/`. Desviación D7 — restricción de plataforma, no
  preferencia.

- **Resend manda desde `onboarding@resend.dev`**, el remitente de sandbox, que
  **solo entrega a la dirección dueña de la cuenta de Resend**. Cualquier otro
  destinatario recibe un 403 y el correo simplemente no llega; nada falla
  visiblemente. En el escenario, regístrate con esa dirección. Desviación D8, y está
  escrito en un banner arriba de `src/services/correo/mailer.ts`.

- **Sin `DEMO_SOFOM_ID` no hay envío que funcione.** `expedientes.sofom_id` es NOT NULL
  con llave foránea y viene de la etapa multi-tenant. `verificacion.sql` imprime el
  valor.

- **Es `revision`, no `en_revision`.** El enum `estado_expediente` de Postgres ya
  existe. Un valor fuera del enum no da error de validación: da un 500 a media
  operación. Lo mismo con `tipo_archivo`: ninguno de los ocho `doc_*` del contrato
  existe en el enum, y el Worker los traduce al guardar
  (`src/schemas/comunes.ts`). Los nombres de parte del multipart no cambian.

- **Las contraseñas del personal viven en Supabase Auth**, no en `usuarios_panel`. El
  Worker llama a `signInWithPassword` con la llave publicable, comprueba `activo` y
  `rol` con la secreta, y emite **su propio** JWT. La sesión de Supabase se tira. Este
  API no valida ningún token de Supabase y no tiene JWKS.

- **No portes `../ONP/arreglo_permisos_final.sql`.** Abre `SELECT` de todo el bucket a
  `public`; con la llave publicable, cualquiera lee todas las INE. Existía porque el
  navegador hablaba directo con Supabase. Este Worker tiene la llave secreta y nadie
  más entra. Lo que sí vale de ese archivo es la trampa que documenta: `storage.prefixes`
  necesita permisos por cada nivel de carpeta, y por eso la ruta es de un solo nivel.

---

## Cómo está armado

```
src/
  index.ts        el punto de entrada; exporta app
  app.ts          CORS, request-id, traza, sobre de error, montaje de rutas
  env.ts          los bindings
  lib/            errores, log, supabase, hash, password, sesión, respuesta
  middleware/     requireAuth, límite de peticiones
  routes/         una por recurso. Delgadas
  schemas/        Zod en cada entrada y cada salida. Es el contrato
  services/       la lógica
supabase/         verificación, migraciones, semilla
```

Reglas que no se negocian, de `01-conventions.md` §10:

- **Nunca se registra un cuerpo de petición.** Ni la query string: el `?q=` del panel
  lleva nombres y CURP. Se registra id, ruta, estado y duración.
- **Nunca sale un error de Supabase al cliente.** Se registra del lado del servidor y
  sale el sobre `{ error: { code, message } }` con un mensaje en español sobre el que
  un prospecto pueda actuar. La fuente filtraba el texto de las políticas RLS a la UI
  (`:3013`).
- **El correo nunca falla una petición.** Se llama después de que la escritura salió
  bien, dentro de `waitUntil`, y el emisor no lanza.
- **El SHA-256 por archivo se queda.** Es el valor probatorio del producto.
