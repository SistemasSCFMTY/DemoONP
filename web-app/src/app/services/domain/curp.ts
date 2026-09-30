/**
 * CURP generation and validation. Pure functions, unit-tested.
 *
 * Ported from onp_fer_etapa2_pf.html: `obtenerVocalInterna` (:4079),
 * `obtenerConsonanteInterna` (:4090), `generarCURPPF` (:4102),
 * `calcularDigitoVerificador` (:4171), `validarCURPLocal` (:4185) and
 * `validarCoincidenciaCURP` (:4205).
 *
 * This is a local generator, not RENAPO. It reproduces the published algorithm
 * closely enough to pre-fill the field and catch a typo; it does not implement
 * the homonym differentiator, the compound-name rules (MARÍA / JOSÉ), the
 * particle rules (DE, LA, LOS) or the inconvenient-word table. That is why the
 * field stays editable and the cross-check reports a mismatch rather than
 * refusing input — exactly as the source behaves.
 *
 * TWO DEPARTURES FROM THE SOURCE, both recorded in 00-master-plan.md
 * "Departures from the source" (13 and 14):
 *
 *  1. The source builds only 16 characters and appends a check digit, so the
 *     CURP it writes into the field is 17 long. Its own `validarCURPLocal`
 *     demands 18 and silently hides the status line instead of complaining, so
 *     every generated CURP is invalid and nothing says so. Position 17 — the
 *     differentiator — is restored here: `0` for births before 2000, `A` from
 *     2000 on, which is the published rule.
 *  2. The source uppercases but does not fold accents, so `PÉREZ` yields a
 *     CURP containing `É`. RENAPO folds diacritics and maps `Ñ` to `X`;
 *     `normalizar` does the same.
 */

export interface DatosCURP {
  readonly apellidoPaterno: string;
  readonly apellidoMaterno: string;
  readonly nombres: string;
  /** dd, as typed. Padded here. */
  readonly dia: string;
  /** mm, as typed. Padded here. */
  readonly mes: string;
  /** yyyy, as typed. The last two digits reach the CURP; all four pick the
   *  differentiator. */
  readonly anio: string;
  /** `H` | `M` | `X` — position 11. */
  readonly genero: string;
  /** Two-letter entity code — positions 12–13. */
  readonly entidadNacimiento: string;
}

const VOCALES = ['A', 'E', 'I', 'O', 'U'];

/**
 * Uppercase, fold diacritics, map `Ñ` to `X`, drop everything that is not a
 * letter. `Peña` becomes `PEXA`, `Pérez` becomes `PEREZ`.
 */
export function normalizar(palabra: string): string {
  // Order matters. `Ñ` must become `X` BEFORE the NFD pass, because NFD
  // decomposes it into `N` + a combining tilde and the diacritic strip then
  // leaves a bare `N` — turning PEÑA into PENA instead of PEXA, and quietly
  // producing the wrong CURP for one of the commonest letters in Mexican
  // surnames. A unit test holds this order in place.
  return palabra
    .toUpperCase()
    .replace(/Ñ/g, 'X')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z]/g, '');
}

/** First internal vowel of a word (position 2 onward), or `X`. */
export function vocalInterna(palabra: string): string {
  if (!palabra) return '';
  for (let i = 1; i < palabra.length; i++) {
    if (VOCALES.includes(palabra[i])) return palabra[i];
  }
  return 'X';
}

/** First internal consonant of a word (position 2 onward), or `X`. */
export function consonanteInterna(palabra: string): string {
  if (!palabra) return '';
  for (let i = 1; i < palabra.length; i++) {
    if (!VOCALES.includes(palabra[i])) return palabra[i];
  }
  return 'X';
}

/**
 * Position 17, the homonym differentiator.
 *
 * RENAPO assigns it, and for a homonym it is not `0`/`A` at all. The published
 * default — `0` for births before 2000, `A` from 2000 on — is what a generator
 * can know, and it is what every CURP without a homonym carries.
 */
export function diferenciador(anio: string): string {
  const n = Number.parseInt(anio, 10);
  return Number.isFinite(n) && n >= 2000 ? 'A' : '0';
}

/**
 * The 17 characters before the check digit, or `null` when a required input is
 * missing. Returning null rather than a partial string is deliberate: a
 * half-built CURP written into the field looks like a real one.
 */
export function curp17(d: DatosCURP): string | null {
  const apellidoP = normalizar(d.apellidoPaterno);
  const apellidoM = normalizar(d.apellidoMaterno);
  const nombres = normalizar(d.nombres);
  const mes = d.mes.padStart(2, '0');
  const dia = d.dia.padStart(2, '0');
  const anio2 = d.anio.slice(-2);

  if (
    !apellidoP ||
    !apellidoM ||
    !nombres ||
    !d.mes ||
    !d.dia ||
    !d.anio ||
    !d.genero ||
    !d.entidadNacimiento
  ) {
    return null;
  }

  return (
    apellidoP[0] +
    vocalInterna(apellidoP) +
    apellidoM[0] +
    nombres[0] +
    anio2 +
    mes +
    dia +
    d.genero +
    d.entidadNacimiento +
    consonanteInterna(apellidoP) +
    consonanteInterna(apellidoM) +
    consonanteInterna(nombres) +
    diferenciador(d.anio)
  );
}

/**
 * Check digit, position 18.
 *
 * Each character's index in the 36-symbol base is weighted by its distance
 * from the end, and the sum's complement mod 10 is the digit.
 */
export function digitoVerificador(base17: string): string {
  const base = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let peso = 0;
  for (let i = 0; i < 17; i++) {
    let indice = base.indexOf(base17[i] ?? '');
    if (indice === -1) indice = 0;
    peso += (indice * (18 - i)) % 10;
  }
  return ((10 - (peso % 10)) % 10).toString();
}

/** The full 18-character CURP, or `null` when a required input is missing. */
export function generarCURP(d: DatosCURP): string | null {
  const base = curp17(d);
  if (!base) return null;
  return base + digitoVerificador(base);
}

export type ResultadoCURP =
  | { readonly valido: true }
  | { readonly valido: false; readonly error: string };

/** Structural validation: length, alphabet and check digit. */
export function validarCURP(curp: string): ResultadoCURP {
  if (curp.length !== 18) {
    return { valido: false, error: 'La CURP debe tener 18 caracteres' };
  }
  if (!/^[A-Z0-9]+$/.test(curp)) {
    return { valido: false, error: 'Caracteres inválidos' };
  }
  if (digitoVerificador(curp.substring(0, 17)) !== curp[17]) {
    return { valido: false, error: 'Dígito verificador incorrecto' };
  }
  return { valido: true };
}

export type ResultadoCoincidencia =
  | { readonly coincide: true }
  | { readonly coincide: false; readonly error: string };

/**
 * Cross-check: does the CURP the prospect typed describe the name and birth
 * date they typed? Catches a different person's CURP pasted into the field.
 *
 * Position 17 is excluded from the comparison — RENAPO may have issued a
 * homonym differentiator this generator cannot predict, and refusing a real
 * CURP is worse than accepting one whose 17th character we cannot derive.
 */
export function coincideConDatos(curp: string, d: DatosCURP): ResultadoCoincidencia {
  const esperada = curp17(d);
  if (!esperada) return { coincide: false, error: 'Faltan datos para validar' };
  if (esperada.substring(0, 16) !== curp.substring(0, 16)) {
    return { coincide: false, error: 'CURP no coincide con datos' };
  }
  return { coincide: true };
}
