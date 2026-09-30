import { Producto } from '../../model/interfaces/producto';

/**
 * The credit maths, ported from the source (`onp_fer_etapa2_pf.html:2379`,
 * `:2386`, `:2395`).
 *
 * **This is a second copy.** The same three functions live in `web-app/`,
 * where CP-F4 owns them and unit-tests them; the two projects share no
 * package by decision (§12). They are pure and small, they are covered by
 * `credito.spec.ts` here as well, and a divergence between the two would mean
 * the panel's preview disagreeing with the simulator the prospect sees — so
 * a change to one is a change to both, in the same pull request.
 *
 * §11: the panel shows no invented figure. Everything the Producto screen
 * prints is computed here from the parameters on screen, which is exactly
 * what makes a live preview worth having — edit the tasa, watch the CAT move.
 */

/** Fixed monthly payment, French amortisation system. */
export function pagoMensual(capital: number, tasaAnual: number, meses: number): number {
  const i = tasaAnual / 100 / 12;
  if (i === 0) return capital / meses;
  return (capital * (i * Math.pow(1 + i, meses))) / (Math.pow(1 + i, meses) - 1);
}

/** The opening commission, or zero when it does not apply. */
export function comisionDe(monto: number, producto: Producto): number {
  if (!producto.comision_apertura) return 0;
  if (monto < producto.comision_desde) return 0;
  return monto * (producto.comision_pct / 100);
}

/**
 * CAT — the rate at which the present value of the payments equals what the
 * client actually receives, which is the monto less the commission.
 *
 * Solved by bisection because it has no closed form. 200 iterations over
 * [0, 3] monthly converges far past the precision anyone reads off a screen.
 */
export function calcularCAT(montoNeto: number, pago: number, meses: number): number {
  if (montoNeto <= 0 || pago <= 0 || meses <= 0) return 0;

  const valorPresente = (tasaMensual: number): number => {
    if (tasaMensual === 0) return pago * meses;
    return (pago * (1 - Math.pow(1 + tasaMensual, -meses))) / tasaMensual;
  };

  let bajo = 0;
  let alto = 3; // 300% monthly — far above anything reachable.

  for (let k = 0; k < 200; k++) {
    const medio = (bajo + alto) / 2;
    if (valorPresente(medio) > montoNeto) bajo = medio;
    else alto = medio;
  }

  const mensual = (bajo + alto) / 2;
  return (Math.pow(1 + mensual, 12) - 1) * 100;
}

/** One worked example of the product, for the "Cómo queda" preview. */
export interface EjemploCredito {
  readonly monto: number;
  readonly meses: number;
  readonly pago: number;
  readonly comision: number;
  readonly cat: number;
}

/**
 * The three examples the source previews (`vistaProducto`, `:5370`): the
 * floor, a round middle at 24 months, and the ceiling.
 */
export function ejemplosDe(producto: Producto): readonly EjemploCredito[] {
  const medio = Math.round((producto.monto_min + producto.monto_max) / 2 / 1000) * 1000;

  return [
    [producto.monto_min, producto.plazo_min],
    [medio, 24],
    [producto.monto_max, producto.plazo_max],
  ].map(([monto, meses]) => {
    const pago = pagoMensual(monto, producto.tasa_anual, meses);
    const comision = comisionDe(monto, producto);
    return {
      monto,
      meses,
      pago,
      comision,
      cat: calcularCAT(monto - comision, pago, meses),
    };
  });
}
