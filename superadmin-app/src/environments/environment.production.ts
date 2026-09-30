/**
 * Production environment for the staff panel.
 *
 * Substituted for `environment.ts` by the `fileReplacements` entry in
 * angular.json's production configuration.
 *
 * `apiBaseUrl` is the deployed Worker. It used to read
 * `onp-fer-api.workers.dev`, a host that never existed.
 */
export const environment = {
  produccion: true,

  apiBaseUrl: 'https://demo-onp-api.emnsistemas.workers.dev',

  /**
   * Never true in a production build. The mock accepts any password and
   * serves three fabricated expedientes; shipping that to Pages would put a
   * panel with no authentication and invented data in front of stakeholders.
   */
  usarApiSimulada: false,
};
