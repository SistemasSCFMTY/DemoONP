/**
 * Local environment. The production build replaces this file with
 * `environment.production.ts` (angular.json → production → fileReplacements).
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
   * Local only — the production build sets this to false.
   *
   * The http services fall back to an in-memory stand-in so the wizard runs
   * with no backend up. Two things to know before trusting it:
   *
   *  - `conRespaldo` catches EVERY `HttpErrorResponse`, not just an
   *    unreachable Worker. A 401, a 500 and a rate-limit all become a
   *    fallback.
   *  - The "Modo demostración" label this used to promise is NOT there.
   *    Checked with the Worker unreachable: the simulador rendered invented
   *    product parameters in silence. Do not read a fallback as visible.
   */
  permitirMocks: true,
} as const;
