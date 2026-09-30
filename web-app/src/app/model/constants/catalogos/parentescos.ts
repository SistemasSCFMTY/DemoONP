import type { Opcion } from '../../interfaces/opcion';

/** Parentesco con el familiar PEP. Ported from onp_fer_etapa2_pf.html:1220. */
export const PARENTESCOS: readonly Opcion[] = [
  { valor: 'conyuge', texto: 'Cónyuge' },
  { valor: 'padre', texto: 'Padre' },
  { valor: 'madre', texto: 'Madre' },
  { valor: 'hijo', texto: 'Hijo/a' },
  { valor: 'hermano', texto: 'Hermano/a' },
  { valor: 'abuelo', texto: 'Abuelo/a' },
  { valor: 'tio', texto: 'Tío/a' },
  { valor: 'primo', texto: 'Primo/a' },
  { valor: 'cuñado', texto: 'Cuñado/a' },
  { valor: 'suegro', texto: 'Suegro/a' },
  { valor: 'yerno', texto: 'Yerno/a' },
];
