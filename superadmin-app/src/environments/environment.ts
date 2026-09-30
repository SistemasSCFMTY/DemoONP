/**
 * Development environment for the staff panel.
 *
 * The API base URL is never a literal inside a service — it comes from here, so
 * pointing the panel at the deployed Worker (CP-B8) is a one-line change.
 */
export const environment = {
  produccion: false,

  /**
   * The deployed Worker, not `wrangler dev`.
   *
   * Owner decision (2026-09-30): **datos reales siempre**, también en
   * desarrollo, para que quien corra el panel localmente vea lo mismo que ven
   * los stakeholders. Pointing dev at a local Worker meant a local checkout
   * showed different expedientes than the deployed panel, which makes those
   * conversations useless.
   *
   * Nothing is needed on the backend: the CORS allowlist in `backend/src/app.ts`
   * already admits `localhost:4201` and `127.0.0.1:4201`, both forms, because
   * they are distinct origins.
   *
   * Point it back at `http://127.0.0.1:8787` to work against a local
   * `wrangler dev` — a deliberate edit, not a default.
   */
  apiBaseUrl: 'https://demo-onp-api.emnsistemas.workers.dev',

  /**
   * The panel talks to the Worker.
   *
   * It ran on `PanelApiSimulada` while the backend was being built, and that
   * cost a bug worth remembering: the mock keeps its session in a field on the
   * service instance, so a reload rebuilt the injector, the field was null,
   * and the guard bounced every refresh to `/acceso`. It looked like a cookie
   * problem and there was no cookie involved.
   *
   * Set it to true only to work offline, and expect that behaviour back.
   */
  usarApiSimulada: false,
};
