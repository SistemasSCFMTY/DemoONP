/**
 * The Worker's bindings.
 *
 * Secrets are set with `wrangler secret put <NAME>` and never appear in
 * wrangler.jsonc, which is committed. See .dev.vars.example for local dev.
 */
export interface Env {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_KEY: string;
  readonly JWT_SECRET: string;
  readonly RESEND_API_KEY: string;
  /** "true" makes /otp/enviar echo the generated code — demo only. */
  readonly DEMO_MODE: string;
}

/** Throws on a missing secret at the edge of a request, not deep inside a handler. */
export function requireEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (!value) throw new Error(`Falta la variable de entorno ${key}.`);
  return value;
}

export const isDemoMode = (env: Env): boolean => env.DEMO_MODE === 'true';
