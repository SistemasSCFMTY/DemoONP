import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Env } from './env';
import { ApiError, internal } from './lib/errors';
import { log } from './lib/log';
import { admin } from './routes/admin';
import { clientes } from './routes/clientes';
import { expedientes } from './routes/expedientes';
import { otp } from './routes/otp';
import { plantillas } from './routes/plantillas';
import { producto } from './routes/producto';
import { prospectos } from './routes/prospectos';
import { sofom } from './routes/sofom';
import { solicitudes } from './routes/solicitudes';

export const app = new Hono<{ Bindings: Env }>();

app.use('*', requestId());

/**
 * Los orígenes reales de Pages, más localhost para desarrollo. Nunca
 * `*`: con `credentials: true` el navegador lo rechaza, y aun sin eso,
 * una API que devuelve fotos de INE no anuncia que cualquiera puede
 * llamarla.
 *
 * Decía `onp-web.pages.dev` y `onp-panel.pages.dev`. Ninguno de los dos
 * existe: la cuenta tiene un solo proyecto de Pages, `demo-onp`. Con los
 * nombres inventados, cada llamada del front desplegado moría en el
 * preflight — y curl no lo habría visto nunca, porque curl no manda
 * preflight ni respeta CORS.
 */
app.use(
  '*',
  cors({
    origin: [
      // 4200 el prospecto, 4201 el panel. Ambos en las dos formas del
      // loopback: `ng serve` escucha en 127.0.0.1 y el navegador manda como
      // Origin exactamente lo que se tecleó en la barra, así que
      // `localhost:4201` y `127.0.0.1:4201` son orígenes distintos y hacen
      // falta los dos. Faltaba 4201 entero: el panel no podía hablarle al
      // Worker desde un navegador, aunque con curl pasara.
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'http://localhost:4201',
      'http://127.0.0.1:4201',
      // El proyecto de Pages que existe hoy; sirve `web-app`.
      'https://demo-onp.pages.dev',
      // El panel todavía no tiene proyecto propio. Cuando lo tenga, su
      // dominio va aquí, o no podrá hablarle al Worker desde un navegador.
      //
      // Los despliegues de vista previa salen en `<hash>.demo-onp.pages.dev`
      // y NO entran por esta lista, que compara texto exacto. Es a
      // propósito: producción es la que importa mañana.
    ],
    credentials: true,
    // DELETE está aquí por `DELETE /plantillas/:id` («Quitar y usar el
    // predeterminado»). Sin él la ruta funciona con curl y falla en el
    // navegador: curl no manda preflight y el navegador sí.
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
);

/**
 * Traza de la petición.
 *
 * Id, ruta, método, estado y duración. **Nunca el cuerpo**: cada campo
 * que pasa por esta API es dato personal regulado — CURP, RFC, INE,
 * domicilio, ingresos, geolocalización, firma (01-conventions.md §1).
 * Tampoco la query string, por la misma razón: `?q=` del panel lleva
 * nombres y CURP.
 */
app.use('*', async (c, next) => {
  const inicio = Date.now();
  await next();
  log.info('peticion', {
    id: c.get('requestId'),
    metodo: c.req.method,
    ruta: c.req.routePath,
    estado: c.res.status,
    ms: Date.now() - inicio,
  });
});

app.get('/health', (c) => c.json({ ok: true, at: new Date().toISOString() }));

app.route('/admin', admin);
app.route('/solicitudes', solicitudes);
app.route('/expedientes', expedientes);
app.route('/otp', otp);
app.route('/prospectos', prospectos);
app.route('/producto', producto);
app.route('/clientes', clientes);
app.route('/sofom', sofom);
app.route('/plantillas', plantillas);

/**
 * Un solo sobre de salida: `{ error: { code, message } }`.
 *
 * La causa real —incluido cualquier texto de Supabase— se queda en el
 * log. La fuente pintaba el mensaje de Supabase en la UI y filtraba el
 * contenido de las políticas RLS (onp_fer_etapa2_pf.html:3013).
 */
app.onError((err, c) => {
  const e = err instanceof ApiError ? err : internal(err);
  log.error('peticion fallida', {
    id: c.get('requestId'),
    metodo: c.req.method,
    ruta: c.req.routePath,
    codigo: e.code,
    estado: e.status,
    causa: e.cause instanceof Error ? e.cause.message : String(e.cause ?? ''),
  });
  return c.json(
    { error: { code: e.code, message: e.message } },
    e.status as ContentfulStatusCode,
  );
});

app.notFound((c) =>
  c.json({ error: { code: 'NO_ENCONTRADO', message: 'Ruta no encontrada.' } }, 404),
);
