import type { Context } from 'hono';
import { demasiadasSolicitudes } from '../lib/errors';
import { log } from '../lib/log';

/**
 * El tope de peticiones, con el rate limiter nativo de Workers.
 *
 * Un endpoint de OTP sin tope es la cuenta de SMS de alguien más
 * (01-conventions.md §10). Hoy no hay proveedor de SMS, pero la
 * protección se pone ahora: el día que se conecte uno, nadie se va a
 * acordar de volver a ponerla.
 *
 * Se usa el binding y no una cuenta en la tabla porque frena la
 * avalancha **antes** de tocar Supabase. Quien dispara mil peticiones
 * por segundo no debería costar mil consultas.
 *
 * Los bindings se declaran en wrangler.jsonc y no aprovisionan nada:
 * `namespace_id` es un número que solo tiene que ser único dentro de
 * este Worker.
 */

/**
 * La IP del cliente.
 *
 * `CF-Connecting-IP` la pone el borde de Cloudflare y no se puede
 * falsificar desde fuera; `X-Forwarded-For` sí, y por eso no se usa.
 * En `wrangler dev` no viene y todo cae en una cubeta — está bien, en
 * local no hay a quién limitar.
 */
export const ipDe = (c: Context): string => c.req.header('CF-Connecting-IP') ?? 'local';

/**
 * Consume una unidad del límite. Lanza `DEMASIADAS_SOLICITUDES` si se
 * pasó.
 *
 * La llave **no debe ser un dato personal en claro**: para limitar por
 * teléfono se pasa su hash, no el número. Quien llama se encarga.
 *
 * Un fallo del limitador mismo **deja pasar**. Quedarse sin poder pedir
 * un OTP porque el limitador tuvo un mal momento es peor que servir una
 * petición de más, y de los dos límites que hay, el otro sigue puesto.
 */
export async function consumirLimite(
  limitador: RateLimit,
  llave: string,
  mensaje: string,
): Promise<void> {
  let permitido: boolean;
  try {
    ({ success: permitido } = await limitador.limit({ key: llave }));
  } catch (error) {
    log.warn('el limitador falló; se deja pasar', {
      causa: error instanceof Error ? error.message : 'desconocida',
    });
    return;
  }

  if (!permitido) throw demasiadasSolicitudes(mensaje);
}
