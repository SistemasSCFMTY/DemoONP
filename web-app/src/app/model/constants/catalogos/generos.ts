import type { Opcion } from '../../interfaces/opcion';

/**
 * Género. Ported verbatim from onp_fer_etapa2_pf.html:811.
 *
 * The value is position 11 of the CURP, which is why it is a single letter:
 * `H`/`M` are what RENAPO issues. `X` is offered by the source and kept — it
 * will not match a RENAPO-issued CURP, and the cross-check says so rather than
 * refusing the answer.
 */
export const GENEROS: readonly Opcion[] = [
  { valor: 'H', texto: 'Masculino' },
  { valor: 'M', texto: 'Femenino' },
  { valor: 'X', texto: 'No binario' },
];
