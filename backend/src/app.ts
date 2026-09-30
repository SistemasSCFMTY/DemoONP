import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import type { Env } from './env';
import { ApiError, internal } from './lib/errors';
import { log } from './lib/log';
import { solicitudes } from './routes/solicitudes';

export const app = new Hono<{ Bindings: Env }>();

app.use('*', requestId());

/**
 * Exactamente los dos orígenes de Pages, más localhost para
 * desarrollo. Nunca `*`: con `credentials: true` el navegador lo
 * rechaza, y aun sin eso, una API que devuelve fotos de INE no anuncia
 * que cualquiera puede llamarla.
 *
 * Actualiza los dominios cuando los despliegues tengan nombre
 * definitivo (CP-F12 y CP-S4).
 */
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4300',
      'https://onp-web.pages.dev',
      'https://onp-panel.pages.dev',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
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

app.route('/solicitudes', solicitudes);

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
  return c.json({ error: { code: e.code, message: e.message } }, e.status as 400);
});

app.notFound((c) =>
  c.json({ error: { code: 'NO_ENCONTRADO', message: 'Ruta no encontrada.' } }, 404),
);
