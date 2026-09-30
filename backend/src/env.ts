/**
 * Los bindings del Worker.
 *
 * Los secretos se ponen con `wrangler secret put <NAME>` y no aparecen
 * nunca en wrangler.jsonc, que se commitea. Para desarrollo local van
 * en `.dev.vars` (ignorado por git); `.dev.vars.example` lista los
 * nombres sin valores.
 *
 * **Las dos llaves de Supabase son de servidor.** Ninguna llega a un
 * navegador, ni siquiera la publicable: `web-app/` y `superadmin-app/`
 * no conocen la URL ni ninguna llave (01-conventions.md §1). La
 * publicable está aquí solo porque `signInWithPassword` la espera.
 */
export interface Env {
  readonly SUPABASE_URL: string;
  /** Nombre heredado: `service_role`. Esquiva RLS — es la identidad del Worker. */
  readonly SUPABASE_SECRET_KEY: string;
  /** Nombre heredado: `anon`. Solo para la llamada de login (CP-B7). Nunca sale de aquí. */
  readonly SUPABASE_PUBLISHABLE_KEY: string;
  /** Firma la cookie de sesión del panel. Nuestra, no de Supabase. */
  readonly JWT_SECRET: string;
  readonly RESEND_API_KEY: string;
  /**
   * El renglón de `sofoms` que ya existe en el proyecto reusado.
   *
   * `expedientes.sofom_id` viene de la etapa multi-tenant y es probable
   * que sea NOT NULL. Nosotros somos un solo tenant y no tenemos tabla
   * `sofoms` propia, así que la columna se llena desde aquí. Si la base
   * no tiene esa columna, deja el secreto sin configurar y el insert no
   * la manda. `supabase/seed.sql` imprime el valor que le toca.
   */
  readonly DEMO_SOFOM_ID?: string;
  /** "true" hace que /otp/enviar devuelva el código — solo para la demo. */
  readonly DEMO_MODE: string;

  /**
   * Límite de envíos de OTP. Un endpoint de OTP sin tope es la cuenta de
   * SMS de alguien más (01-conventions.md §10). Se declaran en
   * wrangler.jsonc; no consumen ningún recurso de la cuenta.
   */
  readonly LIMITE_OTP_TELEFONO: RateLimit;
  readonly LIMITE_OTP_IP: RateLimit;
}

/** Revienta por un secreto faltante en el borde de la petición, no en el fondo de un handler. */
export function requireEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (!value || typeof value !== 'string') {
    throw new Error(`Falta la variable de entorno ${String(key)}.`);
  }
  return value;
}

export const isDemoMode = (env: Env): boolean => env.DEMO_MODE === 'true';
