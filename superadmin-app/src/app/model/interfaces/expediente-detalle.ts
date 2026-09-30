import { EstadoExpediente } from './estado-expediente';

/**
 * What an `archivos` row's `tipo` carries, and what
 * `GET /expedientes/:id/archivos/:tipo` takes.
 *
 * **This is the Postgres `tipo_archivo` enum, not the multipart part names.**
 * The two vocabularies are different lists and the Worker translates between
 * them on the way in (`backend/src/schemas/comunes.ts` →
 * `TIPO_ARCHIVO_POR_PARTE`): the part `doc_curp` is stored as
 * `constancia_curp`, `doc_domicilio` as `comprobante_domicilio`, and `doc_id`
 * as `otro`. `GET /expedientes/:id` returns the *stored* value, so this union
 * has to be the enum.
 *
 * It used to be the eleven part names, which is why eight of the eleven rows
 * in "Archivos recibidos" rendered with no name at all against the real
 * Worker — `NOMBRE_ARCHIVO` was keyed on a vocabulary the API never sends.
 * `PanelApiSimulada` spoke the part names too, so the mock hid it. Found and
 * fixed in CP-V3.
 *
 * `web-app/`'s copy of this name is the *upload* vocabulary and is a
 * different list on purpose (`'video'`, not `'video_identificacion'`) — the
 * duplication policy in `01-conventions.md` §12 keeps the values in step, not
 * the spellings.
 */
export type TipoArchivo =
  | 'id_frente'
  | 'id_reverso'
  | 'firma'
  | 'video_identificacion'
  | 'huella'
  | 'rostro'
  | 'comprobante_domicilio'
  | 'constancia_curp'
  | 'constancia_fiscal'
  | 'constancia_fea'
  | 'poder_notarial'
  | 'id_propietario_real'
  | 'domicilio_propietario_real'
  | 'otro';

/**
 * One stored file's metadata. No URL — `GET /expedientes/:id` deliberately
 * returns none, so a view mints a signed URL only for the file it is about to
 * paint.
 */
export interface ArchivoExpediente {
  readonly tipo: TipoArchivo;
  readonly tamano_bytes: number;
  /** The evidentiary point of the whole exercise (§10). */
  readonly hash_sha256: string;
  readonly capturado_en: string;
}

/**
 * A short-lived signed URL for one stored file.
 *
 * `GET /expedientes/:id/archivos/:tipo`, five-minute expiry. **Never
 * persisted** (§12): it lives in `ExpedientesState` for as long as the detail
 * view is open and is dropped on leaving. There is no storage plugin in this
 * app, so nothing writes it to disk.
 */
export interface UrlFirmada {
  readonly url: string;
  readonly expiraEn: string;
}

/** One of the four evidentiary geolocation captures. */
export interface UbicacionCapturada {
  readonly etiqueta: string;
  readonly latitud: number;
  readonly longitud: number;
  readonly precision_metros: number;
  readonly capturado_en: string;
}

/** The propietario real, present only when the prospect declared a tercero. */
export interface PropietarioReal {
  readonly apellido_paterno: string | null;
  readonly apellido_materno: string | null;
  readonly nombres: string | null;
  readonly nombre_completo: string | null;
  readonly genero: string | null;
  readonly fecha_nacimiento: string | null;
  readonly entidad_nacimiento: string | null;
  readonly nacionalidad: string | null;
  readonly curp: string | null;
  readonly rfc: string | null;
  readonly domicilio_completo: string | null;
  readonly codigo_postal: string | null;
  readonly colonia: string | null;
  readonly municipio: string | null;
  readonly entidad_federativa: string | null;
  readonly telefono: string | null;
  readonly correo: string | null;
  readonly empleo: string | null;
  readonly puesto: string | null;
  readonly empresa: string | null;
  readonly ingreso_mensual: number | null;
}

/** The rendered, signed solicitud. */
export interface DocumentoExpediente {
  readonly contenido_html: string;
  readonly firmado_en: string | null;
}

/**
 * The whole expediente row.
 *
 * Field-for-field from `02-api-contract.md` → `GET /expedientes/:id`, which is
 * itself field-for-field from `mapearExpediente`
 * (`onp_fer_etapa2_pf.html:2851`).
 *
 * **This is the most PII in the product.** Nothing here reaches a URL, a
 * `console` call or an analytics event — see §12 and the note on
 * `PanelApiHttp`.
 */
export interface ExpedienteDetalle {
  readonly id: string;
  readonly folio: string;
  readonly estado: EstadoExpediente;
  readonly creado_en: string;
  readonly enviado_en: string | null;

  // Identidad
  readonly apellido_paterno: string | null;
  readonly apellido_materno: string | null;
  readonly nombres: string | null;
  readonly nombre_completo: string | null;
  readonly genero: string | null;
  readonly fecha_nacimiento: string | null;
  readonly entidad_nacimiento: string | null;
  readonly pais_nacimiento: string | null;
  readonly nacionalidad: string | null;
  readonly curp: string | null;
  readonly rfc: string | null;
  readonly serie_fea: string | null;

  // Domicilio
  readonly tipo_vialidad: string | null;
  readonly nombre_vialidad: string | null;
  readonly numero_exterior: string | null;
  readonly numero_interior: string | null;
  readonly entre_calles: string | null;
  readonly codigo_postal: string | null;
  readonly colonia: string | null;
  readonly municipio: string | null;
  readonly ciudad: string | null;
  readonly entidad_federativa: string | null;
  readonly pais: string | null;
  readonly domicilio_completo: string | null;

  // Contacto
  readonly telefono_celular: string | null;
  readonly telefono_fijo: string | null;
  readonly correo: string | null;

  // Laborales
  readonly empleo: string | null;
  readonly puesto: string | null;
  readonly empresa: string | null;
  readonly giro_empresa: string | null;
  readonly antiguedad: string | null;
  readonly ingreso_mensual: number | null;
  readonly otros_ingresos: string | null;

  // PEP propio
  readonly pep_propio: boolean;
  readonly pep_propio_ambito: string | null;
  readonly pep_propio_institucion: string | null;
  readonly pep_propio_puesto: string | null;
  readonly pep_propio_inicio: string | null;
  readonly pep_propio_fin: string | null;
  readonly pep_propio_vigente: boolean;

  // PEP familia
  readonly pep_familia: boolean;
  readonly pep_familia_parentesco: string | null;
  readonly pep_familia_ambito: string | null;
  readonly pep_familia_institucion: string | null;
  readonly pep_familia_puesto: string | null;
  readonly pep_familia_inicio: string | null;
  readonly pep_familia_fin: string | null;
  readonly pep_familia_vigente: boolean;

  // Identificación
  readonly tipo_identificacion: string | null;
  readonly ine_clave_elector: string | null;
  readonly ine_anio_registro: string | null;
  readonly ine_num_emision: string | null;
  readonly ine_anio_emision: string | null;
  readonly ine_cic: string | null;
  readonly ine_ocr: string | null;

  // Autorizaciones
  readonly autoriza_grabacion: boolean;
  readonly autoriza_geolocalizacion: boolean;
  readonly autoriza_buro: boolean;
  readonly buro_nip: string | null;

  // Evidencias
  readonly biometria_huella: boolean;
  readonly biometria_rostro: boolean;
  readonly video_grabado: boolean;
  readonly firmado: boolean;

  // Geo
  readonly geo_latitud: number | null;
  readonly geo_longitud: number | null;
  readonly geo_precision_metros: number | null;
  readonly ubicaciones: readonly UbicacionCapturada[] | null;

  // Solicitud
  readonly monto_solicitado: number | null;
  readonly plazo_solicitado_meses: number | null;
  readonly tasa_solicitada: number | null;
  readonly pago_estimado: number | null;
  readonly es_cliente_existente: boolean;
  readonly numero_cliente: string | null;

  // Meta
  readonly dispositivo: string | null;
  readonly version_app: string | null;

  // Relaciones
  readonly propietario_real: PropietarioReal | null;
  readonly archivos: readonly ArchivoExpediente[];
  readonly documento: DocumentoExpediente | null;
}
