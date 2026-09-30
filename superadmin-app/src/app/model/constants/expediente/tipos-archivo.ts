import { TipoArchivo } from '../../interfaces/expediente-detalle';

/**
 * The one slot that holds a video rather than a still.
 *
 * Named here so the player component and the detail view cannot disagree
 * about the string, and so neither has to carry a `protected readonly` bridge
 * into its template.
 */
export const TIPO_ARCHIVO_VIDEO = 'video_identificacion' satisfies TipoArchivo;

/**
 * A human name for every value of the Postgres `tipo_archivo` enum, for the
 * list of received files in the detail view.
 *
 * Keyed on the enum, **not** on the multipart part names — see the note on
 * `TipoArchivo`. `Record<TipoArchivo, string>` is the point of this shape: a
 * value added to the enum without a label here stops the build instead of
 * rendering a nameless row.
 *
 * The wording comes from the source's own file inputs
 * (`onp_fer_etapa2_pf.html:1728`–`:1765`), mapped through the part → enum
 * translation the Worker does.
 */
export const NOMBRE_ARCHIVO: Readonly<Record<TipoArchivo, string>> = {
  id_frente: 'Identificación, frente',
  id_reverso: 'Identificación, reverso',
  firma: 'Firma del solicitante',
  video_identificacion: 'Videograbación de identificación',
  huella: 'Huella dactilar',
  rostro: 'Fotografía del rostro',
  comprobante_domicilio: 'Comprobante de domicilio',
  constancia_curp: 'Constancia de CURP',
  constancia_fiscal: 'Constancia de situación fiscal',
  constancia_fea: 'Certificado de firma electrónica avanzada',
  poder_notarial: 'Poder notarial',
  id_propietario_real: 'Identificación del propietario real',
  domicilio_propietario_real: 'Comprobante de domicilio del propietario real',
  // `otro` is not a catch-all in practice: the Worker writes it for exactly
  // one part, `doc_id` — the official identity document uploaded as a file,
  // as distinct from the two photographs the camera takes. `id_frente` and
  // `id_reverso` are already those photographs, and reusing one would make
  // the PDF overwrite a face. The reasoning is in `TIPO_ARCHIVO_POR_PARTE`.
  otro: 'Identificación oficial',
};
