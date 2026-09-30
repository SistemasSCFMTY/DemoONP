/**
 * Mexican mobile formatting, as you type.
 *
 * Ported from `formatearTelefono` (onp_fer_etapa2_pf.html:2515): ten digits,
 * grouped 2-4-4 — `81 1234 5678`. The grouping appears only once there are
 * enough digits to group, so the field does not insert a space in front of
 * what the prospect is still typing.
 */
export function formatearTelefono(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 10);
  if (digitos.length > 6) {
    return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}`;
  }
  if (digitos.length > 2) {
    return `${digitos.slice(0, 2)} ${digitos.slice(2)}`;
  }
  return digitos;
}

/** Just the digits, which is what the API wants (02-api-contract.md). */
export function soloDigitosTelefono(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 10);
}
