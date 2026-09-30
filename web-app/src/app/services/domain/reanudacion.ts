import { PASOS, indicePaso, pasoPorId } from '../../model/constants/pasos/pasos';
import type { PasoId } from '../../model/interfaces/paso';

/**
 * Where a resumed application picks up.
 *
 * The backend stores `paso` as an opaque slug and deliberately does not know
 * the list — `model/constants/pasos/pasos.ts` stays the only definition of
 * what a step is and what order they come in. That means the slug coming back
 * is untrusted input: it may name a step this build no longer has, or a step
 * a future build added, or nothing at all.
 *
 * So this is a pure function over a string, and it is tested. Deciding where
 * someone lands after an interrupted application is not something to find out
 * against a live Worker.
 */

export interface DestinoReanudacion {
  readonly paso: PasoId;
  /** Router path, with its leading slash. */
  readonly ruta: string;
  /** Every step to mark reached, so the guard lets them back in. */
  readonly alcanzados: readonly PasoId[];
  /** False when the slug was missing or unrecognised and we fell back. */
  readonly reconocido: boolean;
}

/** The step a resume falls back to when the slug means nothing to this build. */
const PRIMER_PASO: PasoId = PASOS[0].id;

export function esPasoConocido(valor: unknown): valor is PasoId {
  return typeof valor === 'string' && indicePaso(valor as PasoId) !== -1;
}

/**
 * Every step up to and including `paso`, in wizard order.
 *
 * The guard only lets someone into a step they have reached, so resuming
 * halfway means marking the whole path behind them — otherwise they land on
 * `form-laborales` and the guard bounces them straight back to the portada.
 */
export function pasosHasta(paso: PasoId): readonly PasoId[] {
  const hasta = indicePaso(paso);
  return PASOS.slice(0, hasta + 1).map((p) => p.id);
}

/**
 * @param slug whatever the backend returned for `paso` — a `PasoId`, null, or
 *             something this build does not recognise
 */
export function destinoDeReanudacion(slug: unknown): DestinoReanudacion {
  const reconocido = esPasoConocido(slug);
  const paso: PasoId = reconocido ? slug : PRIMER_PASO;
  return {
    paso,
    ruta: '/' + pasoPorId(paso).ruta,
    alcanzados: pasosHasta(paso),
    reconocido,
  };
}
