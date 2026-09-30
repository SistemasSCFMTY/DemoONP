import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { unauthorized } from '../lib/errors';
import { leerSesion, type Sesion } from '../lib/sesion';

/**
 * `requireAuth` — todo lo del panel pasa por aquí.
 *
 * Verifica **solo** nuestro propio token (`lib/sesion.ts`). El API no
 * valida tokens de Supabase y no tiene JWKS.
 *
 * Un 401 sale igual si falta la cookie, si la firma no cuadra o si el
 * token venció: decir cuál de las tres fue solo le sirve a quien está
 * probando tokens.
 */
export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: { sesion: Sesion };
}>(async (c, next) => {
  const sesion = await leerSesion(c);
  if (!sesion) throw unauthorized('Tu sesión terminó. Vuelve a entrar.');
  c.set('sesion', sesion);
  await next();
});
