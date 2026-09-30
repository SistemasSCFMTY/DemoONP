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
   * The backend track (CP-B4, CP-B7) is being built in parallel with this one,
   * so the panel develops against `PanelApiSimulada` — an in-memory service
   * behind the same `PanelApi` interface, seeded with three expedientes.
   *
   * Swapping to the real API is this one line plus `apiBaseUrl` above.
   */
  usarApiSimulada: true,
};
