/**
 * Development environment for the staff panel.
 *
 * The API base URL is never a literal inside a service — it comes from here, so
 * pointing the panel at the deployed Worker (CP-B8) is a one-line change.
 */
export const environment = {
  produccion: false,

  /** The Worker from CP-B1. `wrangler dev` serves it here by default. */
  apiBaseUrl: 'http://127.0.0.1:8787',

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
