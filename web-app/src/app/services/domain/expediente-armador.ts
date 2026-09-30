import { BRAND } from '../../brand.config';
import { ESTADOS } from '../../model/constants/catalogos/estados';
import { ESTADOS_NACIMIENTO } from '../../model/constants/catalogos/estados-nacimiento';
import { GENEROS } from '../../model/constants/catalogos/generos';
import { TIPOS_IDENTIFICACION } from '../../model/constants/catalogos/tipos-identificacion';
import { VIALIDADES } from '../../model/constants/catalogos/vialidades';
import { AMBITOS_PEP } from '../../model/constants/catalogos/ambitos-pep';
import { INSTITUCIONES_PEP } from '../../model/constants/catalogos/instituciones-pep';
import { PARENTESCOS } from '../../model/constants/catalogos/parentescos';
import type { Opcion } from '../../model/interfaces/opcion';
import type { Expediente } from '../../model/interfaces/expediente';
import type { IdentidadModel } from '../../state/identidad/identidad.state';
import type { SesionModel } from '../../state/sesion/sesion.state';
import type { SimuladorModel } from '../../state/simulador/simulador.state';
import type { SolicitudModel } from '../../state/solicitud/solicitud.state';
import type { DatosDomicilio, DatosGenerales, FechaTrio } from '../../state/solicitud/solicitud.model';
import { armarDomicilio, armarEntreCalles } from './formularios-expediente';

/**
 * Assembling the wire payload.
 *
 * The UI stores what the prospect typed, in the shape the screens use; the
 * contract wants one flat snake_case object. This is the only place the two
 * meet, so a rename on either side breaks in one file rather than twenty
 * (02-api-contract.md).
 *
 * Empty strings become `null`, matching the source's `oNulo` (`:2846`) and
 * the contract's note that the Worker normalises them anyway. Dates become
 * ISO here, as the contract requires — the Worker validates ISO only.
 */

function oNulo(v: string | null | undefined): string | null {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
}

/** dd/mm/yyyy trio → `yyyy-mm-dd`, or null when incomplete. */
export function fechaISO(f: FechaTrio): string | null {
  const dia = f.dia.padStart(2, '0');
  const mes = f.mes.padStart(2, '0');
  const anio = f.anio;
  if (!f.dia || !f.mes || anio.length !== 4) return null;
  return `${anio}-${mes}-${dia}`;
}

/** "$15,000" → 15000. Anything unparseable becomes null rather than 0 —
 *  a zero income is a claim, an absent one is an absence. */
export function aNumero(valor: string): number | null {
  const limpio = valor.replace(/[^0-9.]/g, '');
  if (!limpio) return null;
  const n = Number.parseFloat(limpio);
  return Number.isFinite(n) ? n : null;
}

function texto(opciones: readonly Opcion[], valor: string): string {
  return opciones.find((o) => o.valor === valor)?.texto ?? valor;
}

function nombreCompleto(g: DatosGenerales): string {
  return [g.nombres, g.apellidoPaterno, g.apellidoMaterno].filter(Boolean).join(' ');
}

/** "Páez Esquivel Fernando" — surname first, as the document sets it. */
export function nombreInvertido(g: DatosGenerales): string {
  return [g.apellidoPaterno, g.apellidoMaterno, g.nombres].filter(Boolean).join(' ');
}

/**
 * The address as prose, for `domicilio_completo` and the printed solicitud.
 *
 * Both catalogue codes are resolved to their labels — `avenida` to "Avenida"
 * and `NL` to "Nuevo León". The flat `tipo_vialidad` and `entidad_federativa`
 * fields keep the codes, because those are the catalogue values the panel and
 * the database index on; this string is the one a person reads on a document
 * they are about to sign, and "Monterrey, NL" is not how an address is
 * written there.
 */
function domicilioLegible(d: DatosDomicilio): string {
  return armarDomicilio({
    ...d,
    tipoVialidad: texto(VIALIDADES, d.tipoVialidad),
    entidadFederativa: texto(ESTADOS, d.entidadFederativa),
  });
}

export interface FuentesExpediente {
  readonly solicitud: SolicitudModel;
  readonly identidad: IdentidadModel;
  readonly simulador: SimuladorModel;
  readonly sesion: SesionModel;
}

export function armarExpediente({
  solicitud,
  identidad,
  simulador,
  sesion,
}: FuentesExpediente): Expediente {
  const g = solicitud.generales;
  const d = solicitud.domicilio;
  const c = solicitud.contacto;
  const l = solicitud.laborales;
  const principal = identidad.ubicaciones.length ? identidad.ubicaciones[0] : null;
  const pr = solicitud.propietario;

  const base: Expediente = {
    apellido_paterno: oNulo(g.apellidoPaterno),
    apellido_materno: oNulo(g.apellidoMaterno),
    nombres: oNulo(g.nombres),
    nombre_completo: oNulo(nombreCompleto(g)),
    genero: oNulo(g.genero),
    fecha_nacimiento: fechaISO(g.nacimiento),
    entidad_nacimiento: oNulo(g.entidadNacimiento),
    pais_nacimiento: oNulo(g.paisNacimiento),
    nacionalidad: oNulo(g.nacionalidad),
    curp: oNulo(g.curp.toUpperCase()),
    rfc: oNulo(g.rfc.toUpperCase()),
    serie_fea: oNulo(g.serieFea),

    tipo_vialidad: oNulo(d.tipoVialidad),
    nombre_vialidad: oNulo(d.nombreVialidad),
    numero_exterior: oNulo(d.numeroExterior),
    numero_interior: oNulo(d.numeroInterior),
    entre_calles: oNulo(armarEntreCalles(d)),
    codigo_postal: oNulo(d.codigoPostal),
    colonia: oNulo(d.colonia),
    municipio: oNulo(d.municipio),
    ciudad: oNulo(d.ciudad),
    entidad_federativa: oNulo(d.entidadFederativa),
    pais: oNulo(d.pais),
    domicilio_completo: oNulo(domicilioLegible(d)),

    telefono_celular: oNulo(c.telefonoCelular),
    telefono_fijo: oNulo(c.telefonoFijo),
    correo: oNulo(c.correo),

    empleo: oNulo(l.empleo),
    puesto: oNulo(l.puesto),
    empresa: oNulo(l.empresa),
    giro_empresa: oNulo(l.giroEmpresa),
    antiguedad: oNulo(l.antiguedad),
    ingreso_mensual: aNumero(l.ingresoMensual),
    otros_ingresos: oNulo(l.otrosIngresos),

    pep_propio: solicitud.pepPropio.aplica,
    pep_propio_ambito: oNulo(solicitud.pepPropio.ambito),
    pep_propio_institucion: oNulo(solicitud.pepPropio.institucion),
    pep_propio_puesto: oNulo(solicitud.pepPropio.puesto),
    pep_propio_inicio: fechaISO(solicitud.pepPropio.inicio),
    pep_propio_fin: solicitud.pepPropio.vigente ? null : fechaISO(solicitud.pepPropio.fin),
    pep_propio_vigente: solicitud.pepPropio.vigente,

    pep_familia: solicitud.pepFamilia.aplica,
    pep_familia_parentesco: oNulo(solicitud.pepFamilia.parentesco),
    pep_familia_ambito: oNulo(solicitud.pepFamilia.ambito),
    pep_familia_institucion: oNulo(solicitud.pepFamilia.institucion),
    pep_familia_puesto: oNulo(solicitud.pepFamilia.puesto),
    pep_familia_inicio: fechaISO(solicitud.pepFamilia.inicio),
    pep_familia_fin: solicitud.pepFamilia.vigente ? null : fechaISO(solicitud.pepFamilia.fin),
    pep_familia_vigente: solicitud.pepFamilia.vigente,

    tipo_identificacion: oNulo(identidad.tipoIdentificacion),
    ine_clave_elector: oNulo(identidad.ine.claveElector),
    ine_anio_registro: oNulo(identidad.ine.anioRegistro),
    ine_num_emision: oNulo(identidad.ine.numEmision),
    ine_anio_emision: oNulo(identidad.ine.anioEmision),
    ine_cic: oNulo(identidad.ine.cic),
    ine_ocr: oNulo(identidad.ine.ocr),

    autoriza_grabacion: solicitud.autorizaciones.grabacion,
    autoriza_geolocalizacion: solicitud.autorizaciones.geolocalizacion,
    autoriza_buro: solicitud.autorizaciones.buro,
    buro_nip: oNulo(solicitud.autorizaciones.buroNip),

    biometria_huella: identidad.biometriaHuella,
    biometria_rostro: identidad.biometriaRostro,
    video_grabado: identidad.videoGrabado,
    firmado: !!identidad.firma,

    geo_latitud: principal?.latitud ?? null,
    geo_longitud: principal?.longitud ?? null,
    geo_precision_metros: principal?.precision_metros ?? null,
    ubicaciones: identidad.ubicaciones,

    monto_solicitado: simulador.monto,
    plazo_solicitado_meses: simulador.plazo,
    tasa_solicitada: simulador.producto.tasa_anual,
    pago_estimado: simulador.pagoMensual,
    es_cliente_existente: sesion.esCliente === true,
    numero_cliente: oNulo(sesion.numeroCliente),

    // The draft reserved at registro. Null for an existing client who never
    // registered, which the contract allows.
    expedienteId: sesion.prospectoId,
    dispositivo: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    version_app: 'web-app',
  };

  if (!pr) return base;

  // The `pr_*` fields exist only when a tercero was declared — the same
  // condition that made the propietario real form exist at all.
  return {
    ...base,
    pr_apellido_paterno: oNulo(pr.generales.apellidoPaterno),
    pr_apellido_materno: oNulo(pr.generales.apellidoMaterno),
    pr_nombres: oNulo(pr.generales.nombres),
    pr_nombre_completo: oNulo(nombreCompleto(pr.generales)),
    pr_genero: oNulo(pr.generales.genero),
    pr_fecha_nacimiento: fechaISO(pr.generales.nacimiento),
    pr_entidad_nacimiento: oNulo(pr.generales.entidadNacimiento),
    pr_nacionalidad: oNulo(pr.generales.nacionalidad),
    pr_curp: oNulo(pr.generales.curp.toUpperCase()),
    pr_rfc: oNulo(pr.generales.rfc.toUpperCase()),
    pr_domicilio_completo: oNulo(domicilioLegible(pr.domicilio)),
    pr_codigo_postal: oNulo(pr.domicilio.codigoPostal),
    pr_colonia: oNulo(pr.domicilio.colonia),
    pr_municipio: oNulo(pr.domicilio.municipio),
    pr_entidad_federativa: oNulo(pr.domicilio.entidadFederativa),
    pr_telefono: oNulo(pr.contacto.telefonoCelular),
    pr_correo: oNulo(pr.contacto.correo),
    pr_empleo: oNulo(pr.laborales.empleo),
    pr_puesto: oNulo(pr.laborales.puesto),
    pr_empresa: oNulo(pr.laborales.empresa),
    pr_ingreso_mensual: aNumero(pr.laborales.ingresoMensual),
  };
}

/**
 * The values the solicitud template's `{{claves}}` resolve to.
 *
 * Human-readable, unlike the payload: catalogue codes become their labels,
 * amounts carry their peso sign, booleans become "Sí"/"No". A person is
 * about to read this and sign it.
 */
export function clavesDePlantilla(
  fuentes: FuentesExpediente,
  folio: string,
  pesos: (n: number) => string,
): Record<string, string> {
  const { solicitud, identidad, simulador, sesion } = fuentes;
  const g = solicitud.generales;
  const l = solicitud.laborales;
  const ahora = new Date();

  const fechaLarga = (f: FechaTrio) => {
    const iso = fechaISO(f);
    if (!iso) return '';
    return `${f.dia.padStart(2, '0')}/${f.mes.padStart(2, '0')}/${f.anio}`;
  };

  const claves: Record<string, string> = {
    folio,
    fecha_solicitud: ahora.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    hora_solicitud: ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),

    sofom_razon_social: BRAND.razonSocial,
    sofom_domicilio: BRAND.domicilio,

    producto: simulador.producto.nombre,
    monto_solicitado: pesos(simulador.monto),
    plazo_solicitado: `${simulador.plazo} meses`,
    pago_estimado: pesos(simulador.pagoMensual),
    tasa_anual: `${simulador.producto.tasa_anual}%`,
    comision_apertura: simulador.comision > 0 ? pesos(simulador.comision) : 'No aplica',
    total_estimado: pesos(simulador.total),
    cat_estimado: `${simulador.cat.toFixed(1)}%`,

    nombre_invertido: nombreInvertido(g),
    fecha_nacimiento: fechaLarga(g.nacimiento),
    genero: texto(GENEROS, g.genero),
    entidad_nacimiento: texto(ESTADOS_NACIMIENTO, g.entidadNacimiento),
    nacionalidad: g.nacionalidad,
    curp: g.curp.toUpperCase(),
    rfc: g.rfc.toUpperCase(),

    domicilio_completo: domicilioLegible(solicitud.domicilio),
    entre_calles: armarEntreCalles(solicitud.domicilio),

    telefono_celular: solicitud.contacto.telefonoCelular,
    telefono_fijo: solicitud.contacto.telefonoFijo,
    correo: solicitud.contacto.correo,

    empleo: l.empleo,
    puesto: l.puesto,
    empresa: l.empresa,
    giro_empresa: l.giroEmpresa,
    antiguedad: l.antiguedad,
    ingreso_mensual: l.ingresoMensual,
    otros_ingresos: l.otrosIngresos,

    tipo_identificacion: texto(TIPOS_IDENTIFICACION, identidad.tipoIdentificacion),
    ine_clave_elector: identidad.ine.claveElector,
    ine_anio_registro: identidad.ine.anioRegistro,
    ine_num_emision: identidad.ine.numEmision,
    ine_cic: identidad.ine.cic,
    ine_ocr: identidad.ine.ocr,

    pep_propio: solicitud.pepPropio.aplica ? 'Sí' : 'No',
    pep_propio_ambito: texto(AMBITOS_PEP, solicitud.pepPropio.ambito),
    pep_propio_institucion: texto(INSTITUCIONES_PEP, solicitud.pepPropio.institucion),
    pep_propio_puesto: solicitud.pepPropio.puesto,
    pep_propio_inicio: fechaLarga(solicitud.pepPropio.inicio),
    pep_propio_fin: solicitud.pepPropio.vigente ? 'Vigente' : fechaLarga(solicitud.pepPropio.fin),

    pep_familia: solicitud.pepFamilia.aplica ? 'Sí' : 'No',
    pep_familia_parentesco: texto(PARENTESCOS, solicitud.pepFamilia.parentesco),
    pep_familia_ambito: texto(AMBITOS_PEP, solicitud.pepFamilia.ambito),
    pep_familia_institucion: texto(INSTITUCIONES_PEP, solicitud.pepFamilia.institucion),
    pep_familia_puesto: solicitud.pepFamilia.puesto,
    pep_familia_inicio: fechaLarga(solicitud.pepFamilia.inicio),
    pep_familia_fin: solicitud.pepFamilia.vigente
      ? 'Vigente'
      : fechaLarga(solicitud.pepFamilia.fin),

    actua_por_cuenta: solicitud.actuaPorCuenta === 'tercero' ? 'De un tercero' : 'Propia',

    autoriza_buro: solicitud.autorizaciones.buro ? 'Sí' : 'No',
    autoriza_grabacion: solicitud.autorizaciones.grabacion ? 'Sí' : 'No',
    autoriza_geolocalizacion: solicitud.autorizaciones.geolocalizacion ? 'Sí' : 'No',

    tipo_solicitante: sesion.esCliente ? 'Cliente' : 'Prospecto',
    numero_cliente: sesion.numeroCliente ?? '',
  };

  const pr = solicitud.propietario;
  if (pr) {
    claves['pr_nombre_completo'] = nombreCompleto(pr.generales);
    claves['pr_fecha_nacimiento'] = fechaLarga(pr.generales.nacimiento);
    claves['pr_nacionalidad'] = pr.generales.nacionalidad;
    claves['pr_curp'] = pr.generales.curp.toUpperCase();
    claves['pr_rfc'] = pr.generales.rfc.toUpperCase();
    claves['pr_domicilio_completo'] = domicilioLegible(pr.domicilio);
    claves['pr_telefono'] = pr.contacto.telefonoCelular;
    claves['pr_correo'] = pr.contacto.correo;
    claves['pr_empleo'] = pr.laborales.empleo;
    claves['pr_puesto'] = pr.laborales.puesto;
  }

  // The conditional blocks the template opens with `{{#…}}`.
  claves['__si_ine'] = identidad.tipoIdentificacion === 'ine' ? '1' : '';
  claves['__si_pep_propio'] = solicitud.pepPropio.aplica ? '1' : '';
  claves['__si_pep_familia'] = solicitud.pepFamilia.aplica ? '1' : '';
  claves['__si_tercero'] = solicitud.actuaPorCuenta === 'tercero' ? '1' : '';

  return claves;
}
