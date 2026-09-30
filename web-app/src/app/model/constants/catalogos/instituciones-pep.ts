import type { Opcion } from '../../interfaces/opcion';

/** Institución de la que forma parte. Ported from onp_fer_etapa2_pf.html:1126. */
export const INSTITUCIONES_PEP: readonly Opcion[] = [
  { valor: 'poder_ejecutivo', texto: 'Poder Ejecutivo' },
  { valor: 'poder_legislativo', texto: 'Poder Legislativo' },
  { valor: 'poder_judicial', texto: 'Poder Judicial' },
  { valor: 'organismos_autonomos', texto: 'Organismos Autónomos e Independientes' },
];
