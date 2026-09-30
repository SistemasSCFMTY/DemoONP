export type LadoFoto = 'front' | 'back';

/** One quality check on a captured photograph (`analizarCalidad`, :4686). */
export interface RevisionCalidad {
  readonly ok: boolean;
  readonly texto: string;
}

export interface ResultadoCalidad {
  readonly aprobada: boolean;
  readonly revisiones: readonly RevisionCalidad[];
}

/** What the OCR reads off a credencial para votar, and what the prospect can
 *  correct by hand. Both paths write here. */
export interface DatosIne {
  claveElector: string;
  anioRegistro: string;
  numEmision: string;
  anioEmision: string;
  cic: string;
  ocr: string;
}

export const DATOS_INE_VACIOS: DatosIne = {
  claveElector: '',
  anioRegistro: '',
  numEmision: '',
  anioEmision: '',
  cic: '',
  ocr: '',
};

/**
 * A captured photograph.
 *
 * `imagen` is the Blob that will be uploaded; `vistaPrevia` an object URL for
 * the preview box. Neither is ever written to storage — the source put base64
 * INE photos into IndexedDB and that is departure 2.
 */
export interface FotoCapturada {
  readonly imagen: Blob;
  readonly vistaPrevia: string;
  readonly calidad: ResultadoCalidad;
}
