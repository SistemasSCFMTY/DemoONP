/**
 * Production environment.
 *
 * `apiBaseUrl` is the Cloudflare Worker that backs this app. It is the ONLY
 * place the origin is written: every http service in `services/http/` reads it
 * from here, so pointing the app at a different Worker is a one-line change
 * (01-conventions.md §10, 02-api-contract.md).
 *
 * Nothing Supabase belongs in this file, or anywhere else in the browser — no
 * URL, no anon key. The Worker holds the credentials (CLAUDE.md).
 */
export const environment = {
  production: true,
  /** El Worker desplegado. `onp-fer-api.workers.dev` nunca existió. */
  apiBaseUrl: 'https://demo-onp-api.emnsistemas.workers.dev',
  /**
   * When the Worker cannot be reached, the http services fall back to an
   * in-memory stand-in so the wizard still runs end to end on stage. Every
   * fallback surfaces "Modo demostración" in the UI — it never pretends.
   */
  permitirMocks: true,
} as const;
