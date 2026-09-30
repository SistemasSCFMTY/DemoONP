import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { unauthorized } from '../lib/errors';
import { leerSesionProspecto, type SesionProspecto } from '../lib/sesion-prospecto';

/**
 * `requireProspecto` — para retomar una solicitud.
 *
 * El expediente sale del token, **nunca de la URL ni del cuerpo**. Es
 * lo que hace que no exista un IDOR aquí: no hay un id que cambiar,
 * así que no hay expediente ajeno al que apuntar.
 *
 * No se aplica junto con `requireAuth`: son dos públicos distintos y
 * ninguna ruta debería aceptar a los dos.
 */
export const requireProspecto = createMiddleware<{
  Bindings: Env;
  Variables: { prospecto: SesionProspecto };
}>(async (c, next) => {
  const sesion = await leerSesionProspecto(c);
  if (!sesion) {
    throw unauthorized('Vuelve a validar tu teléfono para continuar tu solicitud.');
  }
  c.set('prospecto', sesion);
  await next();
});
