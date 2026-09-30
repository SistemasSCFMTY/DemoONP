import { Validators, type FormBuilder } from '@angular/forms';
import type {
  DatosContacto,
  DatosDomicilio,
  DatosGenerales,
  DatosLaborales,
} from '../../state/solicitud/solicitud.model';
import {
  codigoPostal,
  curp as validadorCurp,
  fechaTrio,
  mayorDeEdad,
  rfc as validadorRfc,
  rfcConcuerdaConCurp,
  telefono as validadorTelefono,
} from './validadores';

/**
 * The four expediente form groups, built in one place.
 *
 * The solicitante fills them across four screens; the propietario real fills
 * the same four on one screen (`declaratoria`). Building them from shared
 * factories is what keeps the two in step — in the source they are two
 * near-identical blocks of markup with `pf_` and `pr_` prefixes, and the
 * places where they have already drifted (`Indícalas vialidades` on one,
 * `Indica las vialidades` on the other) are exactly what you would predict.
 *
 * Which fields are required comes straight from the source's `field required`
 * classes. Nothing here asks the DOM what is visible (§8, departure 10).
 */

/**
 * The four group types, exported so the shared blocks in
 * `pages/solicitud/bloques/` can take one as a typed input. Inferred rather
 * than declared: the factory below is the single definition of the shape,
 * and a second hand-written one would be a second thing to keep in step.
 */
export type GrupoGenerales = ReturnType<typeof grupoGenerales>;
export type GrupoDomicilio = ReturnType<typeof grupoDomicilio>;
export type GrupoContacto = ReturnType<typeof grupoContacto>;
export type GrupoLaborales = ReturnType<typeof grupoLaborales>;

/** `nombreFecha` names the nested group so the validators can find it. */
export function grupoGenerales(fb: FormBuilder, valor: DatosGenerales) {
  return fb.nonNullable.group(
    {
      apellidoPaterno: [valor.apellidoPaterno, [Validators.required]],
      apellidoMaterno: [valor.apellidoMaterno, [Validators.required]],
      nombres: [valor.nombres, [Validators.required]],
      genero: [valor.genero, [Validators.required]],
      nacimiento: fb.nonNullable.group(
        {
          dia: [valor.nacimiento.dia, [Validators.required]],
          mes: [valor.nacimiento.mes, [Validators.required]],
          anio: [valor.nacimiento.anio, [Validators.required]],
        },
        { validators: [fechaTrio('dia', 'mes', 'anio'), mayorDeEdad('dia', 'mes', 'anio')] },
      ),
      entidadNacimiento: [valor.entidadNacimiento, [Validators.required]],
      // Readonly in the UI, still part of the payload.
      paisNacimiento: [valor.paisNacimiento, [Validators.required]],
      nacionalidad: [valor.nacionalidad, [Validators.required]],
      curp: [valor.curp, [Validators.required, validadorCurp()]],
      // Optional throughout — the source labels it "(Opcional)".
      rfc: [valor.rfc, [validadorRfc()]],
      serieFea: [valor.serieFea],
    },
    { validators: [rfcConcuerdaConCurp('curp', 'rfc')] },
  );
}

export function grupoDomicilio(fb: FormBuilder, valor: DatosDomicilio) {
  return fb.nonNullable.group({
    tipoVialidad: [valor.tipoVialidad, [Validators.required]],
    nombreVialidad: [valor.nombreVialidad, [Validators.required]],
    numeroExterior: [valor.numeroExterior, [Validators.required]],
    numeroInterior: [valor.numeroInterior],
    entre1: [valor.entre1],
    entre2: [valor.entre2],
    codigoPostal: [valor.codigoPostal, [Validators.required, codigoPostal()]],
    colonia: [valor.colonia, [Validators.required]],
    municipio: [valor.municipio, [Validators.required]],
    ciudad: [valor.ciudad, [Validators.required]],
    entidadFederativa: [valor.entidadFederativa, [Validators.required]],
    pais: [valor.pais, [Validators.required]],
  });
}

export function grupoContacto(fb: FormBuilder, valor: DatosContacto) {
  return fb.nonNullable.group({
    telefonoCelular: [valor.telefonoCelular, [Validators.required, validadorTelefono()]],
    telefonoFijo: [valor.telefonoFijo, [validadorTelefono()]],
    correo: [valor.correo, [Validators.required, Validators.email]],
  });
}

export function grupoLaborales(fb: FormBuilder, valor: DatosLaborales) {
  return fb.nonNullable.group({
    empleo: [valor.empleo, [Validators.required]],
    puesto: [valor.puesto, [Validators.required]],
    empresa: [valor.empresa],
    giroEmpresa: [valor.giroEmpresa],
    antiguedad: [valor.antiguedad],
    ingresoMensual: [valor.ingresoMensual],
    otrosIngresos: [valor.otrosIngresos],
  });
}

/**
 * The full address as one line, for `domicilio_completo` in the payload.
 * Ported from `armarDomicilio` — the same order the source assembles.
 */
export function armarDomicilio(d: DatosDomicilio): string {
  const calle = [d.tipoVialidad, d.nombreVialidad].filter(Boolean).join(' ');
  const numeros = [d.numeroExterior, d.numeroInterior ? `int. ${d.numeroInterior}` : '']
    .filter(Boolean)
    .join(' ');
  const partes = [
    [calle, numeros].filter(Boolean).join(' '),
    d.colonia,
    d.codigoPostal ? `C.P. ${d.codigoPostal}` : '',
    d.municipio,
    d.ciudad && d.ciudad !== d.municipio ? d.ciudad : '',
    d.entidadFederativa,
    d.pais,
  ];
  return partes.filter(Boolean).join(', ');
}

/** "Avenida Paseo y Calle Benito" — the source's `entre_calles` (`:3473`). */
export function armarEntreCalles(d: DatosDomicilio): string {
  return [d.entre1, d.entre2].filter(Boolean).join(' y ');
}
