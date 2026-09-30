/**
 * The simulator's parameters — what the prospect's slider is allowed to ask
 * for, and the rate everything is computed from.
 *
 * Shape from `02-api-contract.md` → `GET /producto` and `PUT /producto`,
 * itself from the source's `PRODUCTO` constant
 * (`onp_fer_etapa2_pf.html:2340`).
 *
 * The contract carries eight fields. `PRODUCTO` carries four more —
 * `nombre`, `monto_paso`, `plazo_paso` and `iva` — and the source's Producto
 * screen edits two of them ("Incremento de la barra", "Incremento (meses)",
 * `:1940` and `:1959`). They are **not** in the contract, so they are not
 * edited here; raised for `onp-backend` and the owner rather than added
 * unilaterally, since a field this app invents is a field the Worker will
 * reject.
 */
export interface Producto {
  readonly monto_min: number;
  readonly monto_max: number;
  readonly plazo_min: number;
  readonly plazo_max: number;
  /** Fixed annual rate, as a percentage. */
  readonly tasa_anual: number;
  readonly comision_apertura: boolean;
  /** Percentage of the monto. */
  readonly comision_pct: number;
  /** Below this monto no comisión is charged. */
  readonly comision_desde: number;
}
