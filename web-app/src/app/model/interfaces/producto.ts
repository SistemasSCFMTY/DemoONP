/**
 * Simulator parameters. `GET /producto` (02-api-contract.md).
 *
 * Shape from `PRODUCTO` (onp_fer_etapa2_pf.html:2340). CAT, pago mensual and
 * comisión are computed in the browser from these — the backend never sends a
 * precomputed figure the UI would have to trust.
 *
 * DUPLICATION: this interface also exists as a Zod schema in `backend/` and
 * again in `superadmin-app/`. They drift silently; 02-api-contract.md is the
 * referee (01-conventions.md §12).
 */
export interface Producto {
  readonly nombre: string;
  readonly monto_min: number;
  readonly monto_max: number;
  readonly monto_paso: number;
  readonly plazo_min: number;
  readonly plazo_max: number;
  readonly plazo_paso: number;
  /** Annual rate as a percentage, e.g. 36 for 36%. */
  readonly tasa_anual: number;
  readonly comision_apertura: boolean;
  /** Percentage of the amount, e.g. 2 for 2%. */
  readonly comision_pct: number;
  /** Below this amount no comisión is charged. */
  readonly comision_desde: number;
}
