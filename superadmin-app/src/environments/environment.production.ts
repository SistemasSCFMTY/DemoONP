/**
 * Production environment for the staff panel.
 *
 * Substituted for `environment.ts` by the `fileReplacements` entry in
 * angular.json's production configuration.
 *
 * ---------------------------------------------------------------------------
 * STILL ON THE MOCK, DELIBERATELY.
 *
 * CP-B8 (deploy the Worker) has not landed. A production build pointing at a
 * dead origin would render an empty panel on demo day, so this build ships the
 * in-memory `PanelApiSimulada` and its three seeded expedientes.
 *
 * To go live: set `apiBaseUrl` to the deployed Worker and flip
 * `usarApiSimulada` to false. Two lines, and no other change anywhere.
 * ---------------------------------------------------------------------------
 */
export const environment = {
  produccion: true,

  apiBaseUrl: 'https://onp-fer-api.workers.dev',

  usarApiSimulada: true,
};
