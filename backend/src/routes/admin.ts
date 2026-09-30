import { Hono } from 'hono';
import type { Env } from '../env';
import { cuerpoJson, responder } from '../lib/respuesta';
import { cerrarSesion, emitirSesion, type Sesion } from '../lib/sesion';
import { supabaseAuthDe, supabaseDe } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
import { LoginOkSchema, LoginSchema, YoSchema } from '../schemas/panel';
import { autenticar } from '../services/admin';

/**
 * La sesión del panel (CP-B7).
 *
 * `/login` es público por necesidad; `/me` y `/logout` van detrás de
 * `requireAuth`.
 */
export const admin = new Hono<{ Bindings: Env; Variables: { sesion: Sesion } }>();

admin.post('/login', async (c) => {
  const { correo, password } = await cuerpoJson(c, LoginSchema);

  const usuario = await autenticar(supabaseAuthDe(c.env), supabaseDe(c.env), correo, password);

  // La cookie se pone aquí y el token es nuestro. Lo que Supabase Auth
  // devolvió ya se descartó dentro de `autenticar`.
  await emitirSesion(c, usuario);

  return responder(c, LoginOkSchema, { nombre_completo: usuario.nombre_completo });
});

admin.get('/me', requireAuth, (c) => {
  const sesion = c.get('sesion');
  return responder(c, YoSchema, {
    correo: sesion.correo,
    nombre_completo: sesion.nombre_completo,
  });
});

/**
 * Cerrar sesión borra la cookie y ya.
 *
 * No hay nada que invalidar del lado del servidor: el token es un JWT
 * sin estado y vive ocho horas. Para una demo de un día es la elección
 * correcta; una lista de revocación exigiría almacenamiento y un
 * barrido, y no compra nada aquí. Queda anotado porque es el tipo de
 * cosa que sí importa si esto vive más de una semana.
 */
admin.post('/logout', requireAuth, (c) => {
  cerrarSesion(c);
  return c.body(null, 204);
});
