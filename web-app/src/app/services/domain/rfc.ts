/**
 * RFC checks for a persona física.
 *
 * Ported from `validarRFCPF` (onp_fer_etapa2_pf.html:4310). The source only
 * cross-checks the first ten characters against the CURP; the structural check
 * below is added because "13 characters" is what the field claims and nothing
 * enforced it.
 *
 * The RFC of a persona física is four name characters, six date digits and a
 * three-character homoclave. Its first ten characters are, by construction,
 * the CURP's first ten — which is what makes the cross-check possible and what
 * makes a mismatch worth reporting.
 */

export type ResultadoRFC =
  | { readonly valido: true }
  | { readonly valido: false; readonly error: string };

/** `AAAA######XXX` — four letters, six digits, three alphanumerics. */
const FORMA_RFC_PF = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;

/** Structural check. The RFC is optional throughout the flow; an empty value
 *  is not an error, it is an absence — callers decide. */
export function validarFormaRFC(rfc: string): ResultadoRFC {
  if (rfc.length !== 13) {
    return { valido: false, error: 'El RFC de persona física tiene 13 caracteres' };
  }
  if (!FORMA_RFC_PF.test(rfc)) {
    return { valido: false, error: 'El RFC no tiene el formato esperado' };
  }
  return { valido: true };
}

/**
 * Cross-check against the CURP: the first ten characters must agree.
 *
 * The source runs this from ten characters onward so it can report a mismatch
 * while the prospect is still typing the homoclave. That behaviour is kept.
 */
export function coincideConCURP(rfc: string, curp: string): ResultadoRFC {
  if (rfc.length < 10 || curp.length < 10) {
    return { valido: false, error: 'Faltan datos para comparar' };
  }
  if (rfc.substring(0, 10) !== curp.substring(0, 10)) {
    return { valido: false, error: 'RFC no coincide con CURP (primeros 10 caracteres)' };
  }
  return { valido: true };
}
