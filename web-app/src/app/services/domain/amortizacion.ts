import type { Producto } from '../../model/interfaces/producto';

/**
 * Credit arithmetic. Pure functions, no Angular, unit-tested.
 *
 * These decide what a person is told they will pay. 01-conventions.md §11
 * forbids an invented figure anywhere financial, and the master plan names
 * this as the one place tonight where tests are not optional: a credit person
 * is expected to poke at the simulator on stage.
 *
 * Ported from onp_fer_etapa2_pf.html `pagoMensual` (:2380) and
 * `comisionDe` (:2386).
 */

/**
 * Fixed monthly payment, French amortisation system.
 *
 * `capital` is the amount borrowed, `tasaAnual` a percentage (36 means 36%),
 * `meses` the term. A zero rate divides the capital evenly rather than
 * dividing by zero — the source's own guard, kept.
 */
export function pagoMensual(capital: number, tasaAnual: number, meses: number): number {
  const i = tasaAnual / 100 / 12;
  if (i === 0) return capital / meses;
  return (capital * (i * Math.pow(1 + i, meses))) / (Math.pow(1 + i, meses) - 1);
}

/**
 * Comisión de apertura.
 *
 * Three ways to be zero, all of them the product's decision and none of them
 * this function's: the product charges no comisión, the amount is below the
 * threshold, or the percentage is zero.
 */
export function comisionDe(monto: number, producto: Producto): number {
  if (!producto.comision_apertura) return 0;
  if (monto < producto.comision_desde) return 0;
  return monto * (producto.comision_pct / 100);
}

/**
 * `$50,000` — pesos, no cents. Ported from `pesos` (:2374).
 *
 * `es-MX` grouping, because the audience reads Mexican thousands separators.
 */
export function pesos(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

/** `$1,234.56` — pesos with cents. Ported from `pesosCent` (:2378). */
export function pesosCent(n: number): string {
  return (
    '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
