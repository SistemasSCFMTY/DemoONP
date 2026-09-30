import type { Ubicacion } from './ubicacion';

/**
 * The expediente payload of `POST /solicitudes` — flat on the wire, snake_case,
 * field-for-field from `mapearExpediente` (onp_fer_etapa2_pf.html:2851) and
 * `mapearPropietario` (:2948). Grouped here only for reading.
 *
 * DUPLICATION: the same shape is a Zod schema in `backend/src/schemas/` and an
 * interface again in `superadmin-app/`. They drift silently and the compiler
 * will not catch it — 02-api-contract.md is the referee (01-conventions.md §12).
 *
 * Every field below is PII under the LFPDPPP. Never log one, never put one in
 * a URL, never write one to localStorage (§1, §7).
 */
export interface Expediente {
  // Identidad
  apellido_paterno: string | null;
  apellido_materno: string | null;
  nombres: string | null;
  nombre_completo: string | null;
  genero: string | null;
  /** ISO date, converted from the dd/mm/yyyy trio by the client. */
  fecha_nacimiento: string | null;
  entidad_nacimiento: string | null;
  pais_nacimiento: string | null;
  nacionalidad: string | null;
  curp: string | null;
  rfc: string | null;
  serie_fea: string | null;

  // Domicilio
  tipo_vialidad: string | null;
  nombre_vialidad: string | null;
  numero_exterior: string | null;
  numero_interior: string | null;
  entre_calles: string | null;
  codigo_postal: string | null;
  colonia: string | null;
  municipio: string | null;
  ciudad: string | null;
  entidad_federativa: string | null;
  pais: string | null;
  domicilio_completo: string | null;

  // Contacto
  telefono_celular: string | null;
  telefono_fijo: string | null;
  correo: string | null;

  // Laborales
  empleo: string | null;
  puesto: string | null;
  empresa: string | null;
  giro_empresa: string | null;
  antiguedad: string | null;
  ingreso_mensual: number | null;
  otros_ingresos: string | null;

  // PEP propio
  pep_propio: boolean;
  pep_propio_ambito: string | null;
  pep_propio_institucion: string | null;
  pep_propio_puesto: string | null;
  pep_propio_inicio: string | null;
  pep_propio_fin: string | null;
  pep_propio_vigente: boolean;

  // PEP familia
  pep_familia: boolean;
  pep_familia_parentesco: string | null;
  pep_familia_ambito: string | null;
  pep_familia_institucion: string | null;
  pep_familia_puesto: string | null;
  pep_familia_inicio: string | null;
  pep_familia_fin: string | null;
  pep_familia_vigente: boolean;

  // Identificación
  tipo_identificacion: string | null;
  ine_clave_elector: string | null;
  ine_anio_registro: string | null;
  ine_num_emision: string | null;
  ine_anio_emision: string | null;
  ine_cic: string | null;
  ine_ocr: string | null;

  // Autorizaciones
  autoriza_grabacion: boolean;
  autoriza_geolocalizacion: boolean;
  autoriza_buro: boolean;
  buro_nip: string | null;

  // Evidencias
  biometria_huella: boolean;
  biometria_rostro: boolean;
  video_grabado: boolean;
  firmado: boolean;

  // Geo
  geo_latitud: number | null;
  geo_longitud: number | null;
  geo_precision_metros: number | null;
  ubicaciones: readonly Ubicacion[];

  // Solicitud
  monto_solicitado: number | null;
  plazo_solicitado_meses: number | null;
  tasa_solicitada: number | null;
  pago_estimado: number | null;
  es_cliente_existente: boolean;
  numero_cliente: string | null;

  // Meta
  /**
   * The draft this submission completes.
   *
   * `POST /prospectos` no longer creates a `prospectos` row — that table is
   * gone (owner's call). It creates an `expedientes` row with
   * `estado = 'borrador'` and reserves its folio, and the `id` it returns is
   * that expediente's. Sending it back is what turns the draft into the
   * submission instead of inserting a second row beside it: without this
   * field, every applicant leaves an orphan draft behind.
   *
   * Optional on the wire, so a run that skipped registration — an existing
   * client who came in through `verificar-cliente` — still submits.
   */
  expedienteId?: string | null;
  dispositivo: string | null;
  version_app: string | null;

  // Propietario real — present only when a tercero is declared
  pr_apellido_paterno?: string | null;
  pr_apellido_materno?: string | null;
  pr_nombres?: string | null;
  pr_nombre_completo?: string | null;
  pr_genero?: string | null;
  pr_fecha_nacimiento?: string | null;
  pr_entidad_nacimiento?: string | null;
  pr_nacionalidad?: string | null;
  pr_curp?: string | null;
  pr_rfc?: string | null;
  pr_domicilio_completo?: string | null;
  pr_codigo_postal?: string | null;
  pr_colonia?: string | null;
  pr_municipio?: string | null;
  pr_entidad_federativa?: string | null;
  pr_telefono?: string | null;
  pr_correo?: string | null;
  pr_empleo?: string | null;
  pr_puesto?: string | null;
  pr_empresa?: string | null;
  pr_ingreso_mensual?: number | null;
}

/** `201` from `POST /solicitudes`. The folio is generated server-side. */
export interface RespuestaSolicitud {
  readonly folio: string;
  readonly id: string;
}
