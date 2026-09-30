import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { validarCURP } from './curp';
import { coincideConCURP, validarFormaRFC } from './rfc';

/**
 * Reactive Forms validators built on the pure functions in this folder.
 *
 * Every message is Spanish and names the field and what is wrong
 * (01-conventions.md §8) — never "Campo inválido." The message text lives on
 * the error object so the field component renders it without a lookup table.
 */

function mensaje(texto: string): ValidationErrors {
  return { onp: texto };
}

/** Reads the message a validator in this file attached, if any. */
export function mensajeDeError(errores: ValidationErrors | null | undefined): string | null {
  if (!errores) return null;
  if (typeof errores['onp'] === 'string') return errores['onp'];
  if (errores['required']) return 'Este dato es obligatorio.';
  if (errores['email']) return 'Escribe un correo electrónico válido.';
  return 'Revisa este dato.';
}

/** Código postal — five digits. */
export function codigoPostal(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString().trim();
    if (!v) return null;
    return /^[0-9]{5}$/.test(v) ? null : mensaje('El código postal tiene 5 dígitos.');
  };
}

/**
 * Teléfono — ten digits, however the prospect spaced them.
 *
 * `formatearTelefono` (onp_fer_etapa2_pf.html:2515) inserts spaces as you
 * type, so the control's value carries them. Strip before counting.
 */
export function telefono(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString().replace(/\D/g, '');
    if (!v) return null;
    return v.length === 10 ? null : mensaje('El teléfono a 10 dígitos, con la clave de tu ciudad.');
  };
}

/** CURP — 18 characters with a correct check digit. */
export function curp(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString().trim().toUpperCase();
    if (!v) return null;
    if (v.length !== 18) return mensaje('Escribe tu CURP a 18 caracteres.');
    const r = validarCURP(v);
    return r.valido ? null : mensaje(r.error + '.');
  };
}

/** RFC de persona física — 13 characters in the published shape. */
export function rfc(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString().trim().toUpperCase();
    if (!v) return null;
    const r = validarFormaRFC(v);
    return r.valido ? null : mensaje(r.error + '.');
  };
}

/**
 * Group-level: the RFC's first ten characters must match the CURP's.
 *
 * Declared on the group rather than the control because it reads two of them.
 * Silent while either field is too short to compare.
 */
export function rfcConcuerdaConCurp(nombreCurp: string, nombreRfc: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valorCurp = (grupo.get(nombreCurp)?.value ?? '').toString().trim().toUpperCase();
    const valorRfc = (grupo.get(nombreRfc)?.value ?? '').toString().trim().toUpperCase();
    if (!valorRfc || valorRfc.length < 10 || valorCurp.length < 10) return null;
    const r = coincideConCURP(valorRfc, valorCurp);
    return r.valido ? null : mensaje(r.error + '.');
  };
}

/** A dd/mm/yyyy trio that is a real calendar date, not merely three numbers. */
export function fechaTrio(dia: string, mes: string, anio: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const d = Number.parseInt((grupo.get(dia)?.value ?? '').toString(), 10);
    const m = Number.parseInt((grupo.get(mes)?.value ?? '').toString(), 10);
    const a = Number.parseInt((grupo.get(anio)?.value ?? '').toString(), 10);
    if (!Number.isFinite(d) && !Number.isFinite(m) && !Number.isFinite(a)) return null;
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(a)) {
      return mensaje('Completa día, mes y año.');
    }
    if (a < 1900 || a > 2100) return mensaje('Revisa el año.');
    if (m < 1 || m > 12) return mensaje('El mes va de 01 a 12.');
    const diasDelMes = new Date(a, m, 0).getDate();
    if (d < 1 || d > diasDelMes) return mensaje(`Ese mes tiene ${diasDelMes} días.`);
    return null;
  };
}

/** Mayor de edad — the product is not offered to minors. */
export function mayorDeEdad(dia: string, mes: string, anio: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const d = Number.parseInt((grupo.get(dia)?.value ?? '').toString(), 10);
    const m = Number.parseInt((grupo.get(mes)?.value ?? '').toString(), 10);
    const a = Number.parseInt((grupo.get(anio)?.value ?? '').toString(), 10);
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(a)) return null;
    const nacimiento = new Date(a, m - 1, d);
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 18);
    return nacimiento <= limite ? null : mensaje('Debes ser mayor de edad para solicitar un crédito.');
  };
}

/** Contraseña — the registro screen's own rule (:2522). */
export function contrasena(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString();
    if (!v) return null;
    if (v.length < 8) return mensaje(`Muy corta: faltan ${8 - v.length} caracteres`);
    return null;
  };
}
