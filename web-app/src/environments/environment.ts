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
  /**
   * The videograbación kill switch (03-videograbacion.md, CP-V2).
   *
   * True asks for the camera and records for real. False forces
   * `GrabacionSimulada`: no `getUserMedia`, no bytes, no `video` part in
   * `POST /solicitudes` — and the screen says "Modo demostración", because a
   * simulation that stops admitting it is the failure mode §11 exists to
   * prevent.
   *
   * This is the stage lever. If the recorder misbehaves in front of
   * stakeholders, flip it in `environment.production.ts`, push, and Pages
   * rebuilds in about two minutes. No revert, no merge.
   *
   * It is not the only path to the simulation: `crearGrabacion` also falls
   * back when there is no `MediaRecorder`, no secure context, or no
   * supported mime — that last one is Safari, which has `MediaRecorder`
   * since 14.1 but throws when asked for WebM.
   */
  grabarVideo: true,
} as const;
