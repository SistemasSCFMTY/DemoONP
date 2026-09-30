import type { Opcion } from '../../interfaces/opcion';

/**
 * Entidad federativa de nacimiento — the CURP's two-letter entity codes.
 * Ported verbatim from onp_fer_etapa2_pf.html:833. `NE` (nacido en el
 * extranjero) exists only here, not in the residence list.
 */
export const ESTADOS_NACIMIENTO: readonly Opcion[] = [
  { valor: 'AG', texto: 'Aguascalientes' },
  { valor: 'BC', texto: 'Baja California' },
  { valor: 'BS', texto: 'Baja California Sur' },
  { valor: 'CM', texto: 'Campeche' },
  { valor: 'CS', texto: 'Chiapas' },
  { valor: 'CH', texto: 'Chihuahua' },
  { valor: 'DF', texto: 'Ciudad de México' },
  { valor: 'CL', texto: 'Coahuila' },
  { valor: 'CO', texto: 'Colima' },
  { valor: 'DG', texto: 'Durango' },
  { valor: 'GT', texto: 'Guanajuato' },
  { valor: 'GR', texto: 'Guerrero' },
  { valor: 'HG', texto: 'Hidalgo' },
  { valor: 'JC', texto: 'Jalisco' },
  { valor: 'MC', texto: 'Estado de México' },
  { valor: 'MN', texto: 'Michoacán' },
  { valor: 'MS', texto: 'Morelos' },
  { valor: 'NT', texto: 'Nayarit' },
  { valor: 'NL', texto: 'Nuevo León' },
  { valor: 'OC', texto: 'Oaxaca' },
  { valor: 'PL', texto: 'Puebla' },
  { valor: 'QT', texto: 'Querétaro' },
  { valor: 'QR', texto: 'Quintana Roo' },
  { valor: 'SL', texto: 'San Luis Potosí' },
  { valor: 'SI', texto: 'Sinaloa' },
  { valor: 'SO', texto: 'Sonora' },
  { valor: 'TB', texto: 'Tabasco' },
  { valor: 'TM', texto: 'Tamaulipas' },
  { valor: 'TL', texto: 'Tlaxcala' },
  { valor: 'VZ', texto: 'Veracruz' },
  { valor: 'YN', texto: 'Yucatán' },
  { valor: 'ZS', texto: 'Zacatecas' },
  { valor: 'NE', texto: 'Nacido en el Extranjero' },
];
