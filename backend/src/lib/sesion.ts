import type { Context, Env as HonoEnv } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import type { Env } from '../env';
import { requireEnv } from '../env';
import { RolSchema, type Rol } from '../schemas/comunes';

/**
 * La sesión del panel.
 *
 * El token es **nuestro**, firmado con JWT_SECRET, y es el único que
 * este API valida. La sesión que Supabase Auth devuelve en el login se
 * tira en el acto (CP-B7): no se guarda, no se reenvía, no se refresca.
 * Por eso aquí no hay JWKS ni verificación de tokens de Supabase, y no
 * debe haberla.
 *
 * Va en cookie httpOnly y no en un header: un token en `localStorage`
 * lo lee cualquier XSS, y esto abre expedientes con fotos de INE.
 */

export const NOMBRE_COOKIE = 'onp_sesion';

/**
 * HS256, nombrado en los dos lados.
 *
 * Firmar y verificar diciendo el algoritmo evita la confusión clásica:
 * un token que llega diciendo `alg: none` o `alg: HS1` se rechaza por
 * no ser el que pedimos, en vez de discutirse.
 */
const ALGORITMO = 'HS256' as const;

/** Ocho horas: un turno. Más que eso es una sesión olvidada abierta. */
const VIGENCIA_SEGUNDOS = 8 * 60 * 60;

export const SesionSchema = z.object({
  sub: z.string(),
  correo: z.string(),
  nombre_completo: z.string(),
  /**
   * El rol al momento de entrar.
   *
   * Sirve para que el panel sepa qué pintar sin preguntar. **No es la
   * autorización de una escritura**: para eso, `requireAdmin` vuelve a
   * leer `usuarios_panel`. Un token vive ocho horas y quitarle el rol a
   * alguien no debería tardar ocho horas en surtir efecto.
   */
  rol: RolSchema,
  exp: z.number(),
});

export type Sesion = z.infer<typeof SesionSchema>;

export async function emitirSesion<E extends HonoEnv & { Bindings: Env }>(
  c: Context<E>,
  usuario: { id: string; correo: string; nombre_completo: string; rol: Rol },
): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + VIGENCIA_SEGUNDOS;
  const token = await sign(
    {
      sub: usuario.id,
      correo: usuario.correo,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
      exp,
    },
    requireEnv(c.env, 'JWT_SECRET'),
    ALGORITMO,
  );

  setCookie(c, NOMBRE_COOKIE, token, {
    httpOnly: true,
    // El panel vive en pages.dev y el API en workers.dev: son sitios
    // distintos, así que la cookie tiene que ser SameSite=None, y eso
    // obliga a Secure. Los navegadores tratan localhost como origen
    // seguro, así que también funciona en desarrollo.
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: VIGENCIA_SEGUNDOS,
  });
}

export function cerrarSesion<E extends HonoEnv & { Bindings: Env }>(c: Context<E>): void {
  deleteCookie(c, NOMBRE_COOKIE, { path: '/', secure: true, sameSite: 'None' });
}

/** Devuelve la sesión válida, o `null`. Nunca lanza. */
export async function leerSesion<E extends HonoEnv & { Bindings: Env }>(
  c: Context<E>,
): Promise<Sesion | null> {
  const token = getCookie(c, NOMBRE_COOKIE);
  if (!token) return null;
  try {
    const carga = await verify(token, requireEnv(c.env, 'JWT_SECRET'), ALGORITMO);
    const r = SesionSchema.safeParse(carga);
    return r.success ? r.data : null;
  } catch {
    // Firma inválida, token vencido o malformado. Todos son «no hay
    // sesión»; distinguirlos en la respuesta solo le diría a quien
    // prueba tokens cuál falló.
    return null;
  }
}
