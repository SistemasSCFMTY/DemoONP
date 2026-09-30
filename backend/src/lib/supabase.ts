import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../env';
import { requireEnv } from '../env';

/**
 * Los dos clientes de Supabase. Ninguna de las dos llaves sale de aquí.
 *
 * No se guardan en una variable de módulo: en Workers eso sería estado
 * global compartido entre peticiones. Se construyen por petición, y el
 * cliente es barato — es un envoltorio sobre `fetch`.
 */

const opciones = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Client-Info': 'onp-backend' } },
} as const;

/**
 * El cliente de datos, con la llave secreta (nombre heredado:
 * `service_role`).
 *
 * **Esquiva RLS.** Eso es a propósito y es todo el modelo de acceso: el
 * Worker es el único cliente y ningún navegador conoce la URL ni
 * ninguna llave de Supabase (01-conventions.md §1). La migración
 * opcional 0003 cierra RLS por completo; este cliente funciona igual
 * antes y después, porque no pasa por ahí.
 */
export function supabaseDe(env: Env): SupabaseClient {
  return createClient(
    requireEnv(env, 'SUPABASE_URL'),
    requireEnv(env, 'SUPABASE_SECRET_KEY'),
    opciones,
  );
}

/**
 * El cliente de autenticación, con la llave publicable (nombre
 * heredado: `anon`).
 *
 * Existe por una sola llamada: `signInWithPassword` en el login del
 * panel (CP-B7). Es el flujo que la fuente usaba desde el navegador
 * (onp_fer_etapa2_pf.html:5291); lo que cambia es que ahora la llamada
 * la hace el Worker y la sesión de Supabase que devuelve se tira en el
 * acto. El panel recibe un JWT nuestro, firmado con JWT_SECRET.
 *
 * Que la llave se llame «publicable» no significa que se publique. Aquí
 * es un secreto del Worker como cualquier otro.
 */
export function supabaseAuthDe(env: Env): SupabaseClient {
  return createClient(
    requireEnv(env, 'SUPABASE_URL'),
    requireEnv(env, 'SUPABASE_PUBLISHABLE_KEY'),
    opciones,
  );
}
