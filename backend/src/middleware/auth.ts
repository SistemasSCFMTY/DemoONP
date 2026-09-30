import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { prohibido, unauthorized } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import { leerSesion, type Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';

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

/**
 * `requireAdmin` — las escrituras de Formatos y Ajustes (CP-S6).
 *
 * `analista` y `consulta` reciben 403. Se aplica **encima** de
 * `requireAuth`, nunca en su lugar.
 *
 * Vuelve a leer `usuarios_panel` en vez de confiar en el `rol` del
 * token, y esa consulta extra es justamente el punto: el token vive
 * ocho horas, y si el dueño desactiva una cuenta o le baja el rol a
 * alguien, tiene que surtir efecto ya y no al final del turno. Son
 * escrituras raras y humanas —editar la razón social, subir una
 * plantilla—, así que el viaje a la base no le cuesta nada a nadie.
 *
 * El `rol` del token sigue sirviendo, pero para otra cosa: que el panel
 * sepa qué botones pintar. Eso es comodidad de interfaz, no
 * autorización.
 */
export const requireAdmin = createMiddleware<{
  Bindings: Env;
  Variables: { sesion: Sesion };
}>(async (c, next) => {
  const sesion = c.get('sesion');
  if (!sesion) throw unauthorized('Tu sesión terminó. Vuelve a entrar.');

  const { data, error } = await supabaseDe(c.env)
    .from('usuarios_panel')
    .select('rol, activo')
    .eq('id', sesion.sub)
    .maybeSingle();

  if (error) {
    log.error('fallo al comprobar el rol', detalleSupabase(error));
    // Ante la duda, no. Un fallo de lectura no autoriza una escritura.
    throw unauthorized('No pudimos confirmar tus permisos. Vuelve a entrar.');
  }

  if (!data || data.activo !== true || data.rol !== 'administrador') {
    log.warn('escritura rechazada por rol', {
      usuario: sesion.sub,
      rol: String(data?.rol ?? 'sin perfil'),
    });
    throw prohibido('Esta acción es solo para administradores.');
  }

  await next();
});
