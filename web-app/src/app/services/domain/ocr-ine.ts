import type { DatosIne } from '../../state/identidad/identidad.model';

/**
 * Pulling INE fields out of OCR text.
 *
 * Ported from `parsearFrente` (onp_fer_etapa2_pf.html:4886) and
 * `parsearReverso` (`:4929`). Pure string work, no Tesseract — which is what
 * makes it testable, and it is tested, because OCR output is exactly the kind
 * of input where a regex quietly stops matching.
 *
 * Nothing here is authoritative. Every field it finds lands in an editable
 * box the prospect can correct, and `id-photos` will not advance until the
 * lengths are right whether the OCR filled them or a person did.
 */

/** Fix the digit/letter confusions OCR makes on a photographed card. */
export function soloDigitos(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/O|D|Q/g, '0')
    .replace(/I|L|\|/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/[^0-9]/g, '');
}

export type DatosFrente = Pick<DatosIne, 'claveElector' | 'anioRegistro' | 'numEmision' | 'anioEmision'>;
export type DatosReverso = Pick<DatosIne, 'cic' | 'ocr'>;

/**
 * The front: clave de elector, año de registro, número de emisión, año de
 * emisión.
 */
export function parsearFrente(texto: string): Partial<DatosFrente> {
  // DEPARTURE 17 (00-master-plan.md). The source sanitises with
  // `[^A-Z0-9\n ]` (:4887), which is ASCII-only, so it replaces `Ñ` and `Ó`
  // with spaces — and then goes looking for `A[NÑ]O DE REGISTRO` and
  // `EMISI[OÓ]N`. `AÑO` has already become `A O` and `EMISIÓN` has become
  // `EMISI N` by the time those patterns run, so both the `Ñ` and the `Ó`
  // alternatives are dead code and the two fields only parse when Tesseract
  // happens to drop the accent. Since the source explicitly whitelists
  // `ÑÁÉÍÓÚ` for recognition (:4848), it usually does not. The accented
  // letters are kept here so the patterns can match what the OCR actually
  // reads. Found by a unit test.
  const T = texto.toUpperCase().replace(/[^A-ZÑÁÉÍÓÚ0-9\n ]/g, ' ');
  const plano = T.replace(/\s+/g, '');
  const resultado: Partial<DatosFrente> = {};

  // Clave de elector: 6 letters + 8 digits + H/M + 3 digits = 18.
  const porForma = plano.match(/[A-Z]{6}[0-9]{8}[HM][0-9]{3}/);
  if (porForma) {
    resultado.claveElector = porForma[0];
  } else {
    // Fall back to the line labelled CLAVE DE ELECTOR, in case the OCR
    // mangled a character and the shape no longer matches.
    const linea = T.split('\n').find((l) => /CLAVE\s*DE\s*ELECTOR/.test(l.replace(/\s+/g, ' ')));
    if (linea) {
      const resto = linea.replace(/.*ELECTOR/, '').replace(/[^A-Z0-9]/g, '');
      if (resto.length >= 18) resultado.claveElector = resto.substring(0, 18);
    }
  }

  // "AÑO DE REGISTRO 2019 03" — the year, then the emission number.
  const registro = T.match(/A[NÑ]O\s*DE\s*REGISTRO\D{0,12}((?:19|20)\d{2})\D{0,6}(\d{2})?/);
  if (registro) {
    resultado.anioRegistro = registro[1];
    if (registro[2]) resultado.numEmision = registro[2];
  } else {
    const suelto = plano.match(/(?:19|20)\d{2}/);
    if (suelto) resultado.anioRegistro = suelto[0];
  }

  const emision = T.match(/EMISI[OÓ]N\D{0,10}((?:19|20)\d{2})/);
  if (emision) {
    resultado.anioEmision = emision[1];
  } else {
    const vigencia = T.match(/VIGENCIA\D{0,10}((?:19|20)\d{2})/);
    if (vigencia) resultado.anioEmision = vigencia[1];
  }

  return resultado;
}

/** The back: CIC and OCR, both out of the MRZ. */
export function parsearReverso(texto: string): Partial<DatosReverso> {
  const T = texto.toUpperCase();
  const plano = T.replace(/\s+/g, '');
  const resultado: Partial<DatosReverso> = {};

  // CIC: the 9 digits right after IDMEX in the MRZ. Allow the usual
  // letter-for-digit confusions and repair them.
  let cic: string | null = null;
  const conRuido = plano.match(/IDMEX([O0-9DILZSBG]{9})/);
  if (conRuido) {
    const limpio = soloDigitos(conRuido[1]);
    if (limpio.length === 9) cic = limpio;
  }
  if (!cic) {
    const limpio = plano.match(/IDMEX\D{0,3}(\d{9})/);
    if (limpio) cic = limpio[1];
  }
  if (cic) resultado.cic = cic;

  // OCR: a run of exactly 13 digits.
  let ocr: string | null = null;
  const trece = plano.match(/(?<!\d)\d{13}(?!\d)/);
  if (trece) {
    ocr = trece[0];
  } else {
    for (const linea of T.split('\n')) {
      const candidato = soloDigitos(linea.replace(/</g, ''));
      if (candidato.length >= 13 && candidato.length <= 16) {
        ocr = candidato.substring(0, 13);
        break;
      }
    }
  }
  // If the two came out identical, one of them is the other misread.
  if (ocr && cic && ocr === cic) ocr = null;
  if (ocr) resultado.ocr = ocr;

  return resultado;
}
