/**
 * Production environment for the prospect flow.
 *
 * Substituted for `environment.ts` by the `fileReplacements` entry in
 * angular.json's production configuration — the same wiring
 * `superadmin-app/` already had.
 *
 * ## Why this file exists
 *
 * It did not, and `angular.json` had no `fileReplacements`, so the production
 * build used `environment.ts` with `permitirMocks: true`. The bundle on Pages
 * carried `permitirMocks:!0`.
 *
 * That matters more than it looks. `conRespaldo` swallows *every*
 * `HttpErrorResponse` — not only "the Worker is unreachable", but a 401, a
 * 500, a rate-limit — and serves invented data instead. With mocks on in
 * production a prospect can walk the whole wizard against a dead or
 * misconfigured backend, arrive at "¡Solicitud enviada!", and leave nothing
 * behind: no prospecto, no expediente, nothing in the staff panel. A failure
 * that presents itself as a success is worse than an outage, because nobody
 * goes looking for it.
 *
 * Verified, not assumed: with the Worker unreachable the simulador rendered
 * invented product parameters and said nothing at all — no "Modo
 * demostración" anywhere on the screen.
 *
 * So: off in production. A real failure now shows a real error, and whoever
 * is watching finds out in a rehearsal instead of on stage. The local mocks
 * keep their purpose — `environment.ts` still has them on, so `ng serve`
 * works with no backend running.
 */
export const environment = {
  production: true,
  /** El Worker desplegado. `onp-fer-api.workers.dev` nunca existió. */
  apiBaseUrl: 'https://demo-onp-api.emnsistemas.workers.dev',
  /**
   * Never true in a production build. See the note above: a silent fallback
   * in front of stakeholders turns a backend outage into a fake success.
   */
  permitirMocks: false,
} as const;
