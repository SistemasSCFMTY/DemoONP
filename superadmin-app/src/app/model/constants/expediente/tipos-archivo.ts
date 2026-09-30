import { TipoArchivo } from '../../interfaces/expediente-detalle';

/**
 * A human name for each of the eleven upload slots, for the list of received
 * files in the detail view.
 *
 * The `doc_*` labels come from the source's own file inputs
 * (`onp_fer_etapa2_pf.html:1728`–`:1765`) — the eight the source declared and
 * never read, wired for real in CP-F9 and CP-B3.
 */
export const NOMBRE_ARCHIVO: Readonly<Record<TipoArchivo, string>> = {
  id_frente: 'Identificación, frente',
  id_reverso: 'Identificación, reverso',
  firma: 'Firma del solicitante',
  doc_id: 'Identificación oficial',
  doc_curp: 'Constancia de CURP',
  doc_fiscal: 'Constancia de situación fiscal',
  doc_fea: 'Certificado de firma electrónica avanzada',
  doc_domicilio: 'Comprobante de domicilio',
  doc_poder: 'Poder notarial',
  doc_id_propietario: 'Identificación del propietario real',
  doc_domicilio_propietario: 'Comprobante de domicilio del propietario real',
};
