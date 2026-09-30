import type { Opcion } from '../../interfaces/opcion';

/** Ámbito de la función pública. Ported from onp_fer_etapa2_pf.html:1117. */
export const AMBITOS_PEP: readonly Opcion[] = [
  { valor: 'federal', texto: 'Federal' },
  { valor: 'estatal', texto: 'Estatal' },
  { valor: 'municipal', texto: 'Municipal' },
];
