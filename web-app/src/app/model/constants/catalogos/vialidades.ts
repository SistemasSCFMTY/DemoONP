import type { Opcion } from '../../interfaces/opcion';

/** Tipo de vialidad. Ported verbatim from onp_fer_etapa2_pf.html:889. */
export const VIALIDADES: readonly Opcion[] = [
  { valor: 'calle', texto: 'Calle' },
  { valor: 'avenida', texto: 'Avenida' },
  { valor: 'boulevard', texto: 'Boulevard' },
  { valor: 'calzada', texto: 'Calzada' },
  { valor: 'plaza', texto: 'Plaza' },
  { valor: 'pasaje', texto: 'Pasaje' },
  { valor: 'carretera', texto: 'Carretera' },
  { valor: 'camino', texto: 'Camino' },
  { valor: 'privada', texto: 'Privada' },
  { valor: 'paseo', texto: 'Paseo' },
  { valor: 'parque', texto: 'Parque' },
  { valor: 'jardín', texto: 'Jardín' },
];
