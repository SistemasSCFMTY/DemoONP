import type { Opcion } from '../../interfaces/opcion';

/** Tipo de identificación oficial. Ported from onp_fer_etapa2_pf.html:1600. */
export const TIPOS_IDENTIFICACION: readonly Opcion[] = [
  { valor: 'ine', texto: 'Credencial para votar (INE)' },
  { valor: 'pasaporte', texto: 'Pasaporte mexicano' },
  { valor: 'matricula', texto: 'Matrícula consular' },
];
