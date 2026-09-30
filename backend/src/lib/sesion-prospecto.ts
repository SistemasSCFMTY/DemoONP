import type { Context, Env as HonoEnv } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import type { Env } from '../env';
import { requireEnv } from '../env';

/**
 * La sesión del prospecto — la que permite retomar una solicitud.
 *
 * Se emite al validar el OTP y sólo sirve para una cosa: decir «este
 * navegador probó que tiene el teléfono de este expediente». Con ella
 * el front puede guardar el avance y volver al paso donde se quedó.
 *
 * **Es un archivo aparte del panel a propósito, no por orden.** Son dos
 * públicos con privilegios incomparables: el personal lee todos los
 * expedientes, el prospecto toca uno y sólo mientras es borrador.
 * Compartir el módulo invita a compartir el middleware, y de ahí a que
 * un token de prospecto pase por donde se revisan expedientes ajenos.
 *
 * Aun así no basta con la intención: el token lleva `tipo` y se
 * verifica. Un token del panel no trae ese campo y este esquema lo
 * rechaza; uno de prospecto no trae `rol` ni `correo` y el del panel lo
 * rechaza. Los dos lados fallan cerrado.
 */

export const NOMBRE_COOKIE_PROSPECTO = 'onp_prospecto';

const ALGORITMO = 'HS256' as const;

/**
 * Dos horas.
 *
 * El turno de ocho del panel no aplica: esto no es una jornada de
 * trabajo, es una persona llenando un formulario. Dos horas cubren de
 * sobra una sesión larga con interrupciones, y si se vence se vuelve a
 * pedir el OTP, que es un paso que ya conoce.
 */
const VIGENCIA_SEGUNDOS = 2 * 60 * 60;

export const SesionProspectoSchema = z.object({
  /** El id del expediente en borrador. */
  sub: z.string().uuid(),
  tipo: z.literal('prospecto'),
  exp: z.number(),
});

export type SesionProspecto = z.infer<typeof SesionProspectoSchema>;

export async function emitirSesionProspecto<E extends HonoEnv & { Bindings: Env }>(
  c: Context<E>,
  expedienteId: string,
): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + VIGENCIA_SEGUNDOS;
  const token = await sign(
    { sub: expedienteId, tipo: 'prospecto', exp },
    requireEnv(c.env, 'JWT_SECRET'),
    ALGORITMO,
  );

  setCookie(c, NOMBRE_COOKIE_PROSPECTO, token, {
    httpOnly: true,
    // Mismas razones que la del panel: la app vive en pages.dev y el
    // API en workers.dev, así que SameSite=None y, por obligación,
    // Secure. localhost cuenta como origen seguro en desarrollo.
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: VIGENCIA_SEGUNDOS,
  });
}

/** Devuelve la sesión válida del prospecto, o `null`. Nunca lanza. */
export async function leerSesionProspecto<E extends HonoEnv & { Bindings: Env }>(
  c: Context<E>,
): Promise<SesionProspecto | null> {
  const token = getCookie(c, NOMBRE_COOKIE_PROSPECTO);
  if (!token) return null;
  try {
    const carga = await verify(token, requireEnv(c.env, 'JWT_SECRET'), ALGORITMO);
    const r = SesionProspectoSchema.safeParse(carga);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
