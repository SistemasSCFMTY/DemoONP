import type { SupabaseClient } from '@supabase/supabase-js';
import { unauthorized } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import { ROLES_PANEL, type Rol } from '../schemas/comunes';

/**
 * El login del panel.
 *
 * **Las contraseñas del personal viven en Supabase Auth**, no en
 * `usuarios_panel`. Esa tabla no tiene columna de contraseña y nunca la
 * tuvo: es el perfil —`rol`, `activo`, `nombre_completo`—, que es
 * exactamente como la fuente la usaba (onp_fer_etapa2_pf.html:5300)
 * después de llamar a `signInWithPassword` (:5291).
 *
 * Lo que cambia respecto de la fuente es quién hace la llamada. Antes
 * el navegador, con la llave publicable y la URL de Supabase
 * embebidas. Ahora el Worker: el navegador no conoce ni la URL ni
 * ninguna llave (01-conventions.md §1).
 *
 * Y la sesión de Supabase se tira en el acto. El panel recibe un JWT
 * **nuestro**, firmado con JWT_SECRET, que es el único que este API
 * valida. Por eso no hay JWKS ni verificación de tokens de Supabase en
 * ningún lado, y no debe haberla.
 *
 * El `PASS_ADMIN` en duro de la fuente no sobrevive (desviación 5 del
 * plan maestro).
 */

export interface UsuarioPanel {
  readonly id: string;
  readonly correo: string;
  readonly nombre_completo: string;
  readonly rol: Rol;
}

/**
 * Autentica y devuelve el perfil.
 *
 * Todos los rechazos salen con el mismo mensaje: contraseña
 * equivocada, correo inexistente, cuenta desactivada o rol
 * desconocido. Distinguirlos convierte el login en un oráculo que dice
 * qué correos existen en el panel de una SOFOM.
 */
export async function autenticar(
  sbAuth: SupabaseClient,
  sbDatos: SupabaseClient,
  correo: string,
  password: string,
): Promise<UsuarioPanel> {
  const rechazo = () => unauthorized('Correo o contraseña incorrectos.');

  const { data, error } = await sbAuth.auth.signInWithPassword({ email: correo, password });

  if (error || !data.user) {
    // El texto de Supabase se queda aquí: distingue «Invalid login
    // credentials» de «Email not confirmed», y eso último le dice a
    // quien prueba que el correo sí existe.
    log.warn('login rechazado por Supabase Auth', detalleSupabase(error));
    throw rechazo();
  }

  // La sesión de Supabase no se guarda, no se refresca y no se
  // reenvía. Se cierra en cuanto sirvió para comprobar la contraseña.
  await sbAuth.auth.signOut().catch(() => undefined);

  // El perfil se lee con la llave secreta, no con la sesión recién
  // creada: no queremos que lo que el panel puede ver dependa de las
  // políticas que Auth le dé a ese usuario.
  const { data: perfil, error: errorPerfil } = await sbDatos
    .from('usuarios_panel')
    .select('id, correo, nombre_completo, rol, activo')
    .eq('correo', correo)
    .maybeSingle();

  if (errorPerfil) {
    log.error('fallo al leer el perfil del panel', detalleSupabase(errorPerfil));
    throw rechazo();
  }

  // Existir en Auth no basta: hay que tener perfil, estar activo y
  // tener un rol conocido. El enum `rol_usuario` es
  // administrador | analista | consulta — no hay superadmin.
  if (!perfil || perfil.activo !== true || !ROLES_PANEL.includes(perfil.rol as Rol)) {
    log.warn('login sin perfil activo', { conPerfil: Boolean(perfil) });
    throw rechazo();
  }

  // Marca de último acceso. Su fallo no impide entrar: es dato de
  // operación, no un control.
  const { error: errorSello } = await sbDatos
    .from('usuarios_panel')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('id', perfil.id);
  if (errorSello) log.warn('no se pudo sellar ultimo_acceso', detalleSupabase(errorSello));

  log.info('login del panel', { usuario: perfil.id as string, rol: perfil.rol as string });

  return {
    id: perfil.id as string,
    correo: perfil.correo as string,
    nombre_completo: (perfil.nombre_completo as string) || (perfil.correo as string),
    rol: perfil.rol as Rol,
  };
}
