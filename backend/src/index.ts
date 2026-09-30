import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import type { Env } from './env';
import { ApiError, internal } from './lib/errors';

const app = new Hono<{ Bindings: Env }>();

app.use('*', requestId());

/**
 * Exactly the two Pages origins, never "*". Update when the deploys are named.
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
  }),
);

app.get('/health', (c) => c.json({ ok: true, at: new Date().toISOString() }));

/**
 * One envelope out. Never log a request body — every field in this product is
 * regulated PII (01-conventions.md §1).
 */
app.onError((err, c) => {
  const e = err instanceof ApiError ? err : internal(err);
  console.error(
    JSON.stringify({
      requestId: c.get('requestId'),
      path: c.req.path,
      method: c.req.method,
      code: e.code,
      cause: e.cause instanceof Error ? e.cause.message : String(e.cause ?? ''),
    }),
  );
  return c.json({ error: { code: e.code, message: e.message } }, e.status as 400);
});

app.notFound((c) => c.json({ error: { code: 'NO_ENCONTRADO', message: 'Ruta no encontrada.' } }, 404));

export default app;
