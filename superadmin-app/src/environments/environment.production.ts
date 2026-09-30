/**
 * Production environment for the staff panel.
 *
 * Substituted for `environment.ts` by the `fileReplacements` entry in
 * angular.json's production configuration.
 *
 * `apiBaseUrl` is a placeholder and is set to the deployed Worker's URL once
 * the owner deploys it (CP-B8).
 */
export const environment = {
  produccion: true,

  apiBaseUrl: 'https://onp-fer-api.workers.dev',

  /**
   * Never true in a production build. The mock accepts any password and
   * serves three fabricated expedientes; shipping that to Pages would put a
   * panel with no authentication and invented data in front of stakeholders.
   */
  usarApiSimulada: false,
};
