/**
 * CAT — Costo Anual Total.
 *
 * The rate that makes the present value of the payment stream equal what the
 * borrower actually receives: the amount minus the comisión de apertura. There
 * is no closed form, so it is solved by bisection.
 *
 * Ported from `calcularCAT` (onp_fer_etapa2_pf.html:2395), including the
 * bracket and the iteration count — changing either changes the number a
 * prospect is shown, so they are not tuning knobs.
 */

/** Present value of `meses` payments of `pago` discounted at `tasaMensual`. */
function valorPresente(pago: number, meses: number, tasaMensual: number): number {
  if (tasaMensual === 0) return pago * meses;
  return (pago * (1 - Math.pow(1 + tasaMensual, -meses))) / tasaMensual;
}

/**
 * @param montoNeto what the borrower actually receives (monto − comisión)
 * @param pago the fixed monthly payment
 * @param meses the term
 * @returns the CAT as a percentage, e.g. `45.8`. Zero for nonsensical input —
 *          better a visible zero than a NaN rendered as a figure.
 */
export function calcularCAT(montoNeto: number, pago: number, meses: number): number {
  if (montoNeto <= 0 || pago <= 0 || meses <= 0) return 0;

  // 300% monthly is far beyond anything a SOFOM can charge; the bracket only
  // has to contain the root.
  let bajo = 0;
  let alto = 3;
  for (let k = 0; k < 200; k++) {
    const medio = (bajo + alto) / 2;
    if (valorPresente(pago, meses, medio) > montoNeto) bajo = medio;
    else alto = medio;
  }
  const mensual = (bajo + alto) / 2;
  return (Math.pow(1 + mensual, 12) - 1) * 100;
}
