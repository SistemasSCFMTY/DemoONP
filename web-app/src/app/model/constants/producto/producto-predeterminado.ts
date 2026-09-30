import type { Producto } from '../../interfaces/producto';

/**
 * The product the simulator falls back to before `GET /producto` answers.
 *
 * Ported verbatim from `PRODUCTO` (onp_fer_etapa2_pf.html:2340), including the
 * source's own reasoning: the ceiling is written in pesos rather than UDIs on
 * purpose — the UDI moves daily and the app does not look it up, so the figure
 * sits comfortably below the real limit and is raised by hand.
 *
 * These are parameters, not results. Nothing here is a number shown to a
 * prospect without being run through `amortizacion` and `cat` first.
 */
export const PRODUCTO_PREDETERMINADO: Producto = {
  nombre: 'Crédito simple',
  monto_min: 5000,
  monto_max: 200000, // ~30,000 UDIs con margen
  monto_paso: 1000,
  plazo_min: 6,
  plazo_max: 72,
  plazo_paso: 6,
  tasa_anual: 36,
  comision_apertura: true,
  comision_pct: 2,
  comision_desde: 10000,
};
