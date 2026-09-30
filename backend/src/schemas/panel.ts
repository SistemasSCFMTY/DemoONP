import { z } from 'zod';
import { EstadoSchema, TipoOParteSchema } from './comunes';

/**
 * Las formas del panel (02-api-contract.md, sección «Authenticated»).
 * Esta misma forma existe otra vez en `superadmin-app/`; derivan en
 * silencio y este archivo es el árbitro.
 */

/** Un renglón de la tabla. Lo mínimo para pintarla — nada más. */
export const ExpedienteResumenSchema = z.object({
  id: z.string(),
  folio: z.string(),
  nombre_completo: z.string().nullable(),
  curp: z.string().nullable(),
  estado: z.string(),
  monto_solicitado: z.number().nullable(),
  creado_en: z.string(),
});

export const ListaExpedientesSchema = z.object({
  items: z.array(ExpedienteResumenSchema),
  total: z.number().int(),
});

/**
 * Los parámetros de `GET /expedientes`.
 *
 * `limit` tiene tope de 100: sin él, un `?limit=100000` vacía la tabla
 * de expedientes por el cable en una sola respuesta.
 */
export const ConsultaExpedientesSchema = z.object({
  q: z.string().trim().max(120).optional(),
  estado: EstadoSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Un archivo, como lo ve el panel.
 *
 * **Sin `ruta` y sin URL.** La ruta es una llave del almacén y no tiene
 * por qué viajar; la URL se pide una por una en
 * `GET /expedientes/:id/archivos/:tipo`, para que una vista de lista
 * nunca acuñe URLs firmadas que no va a pintar.
 */
export const ArchivoResumenSchema = z.object({
  tipo: z.string(),
  tamano_bytes: z.number().nullable(),
  hash_sha256: z.string().nullable(),
  capturado_en: z.string().nullable(),
});

export const DocumentoSchema = z.object({
  contenido_html: z.string().nullable(),
  firmado_en: z.string().nullable(),
});

/**
 * El expediente completo.
 *
 * Se declara campo por campo en vez de devolver el renglón tal cual:
 * así una columna que la base tenga y el contrato no —`sofom_id`, por
 * ejemplo, que viene de la etapa multi-tenant— no se filtra al panel
 * sin que nadie lo decida. Zod descarta lo que no está aquí.
 */
export const ExpedienteDetalleSchema = z.object({
  id: z.string(),
  folio: z.string(),
  estado: z.string(),
  creado_en: z.string().nullable(),
  enviado_en: z.string().nullable(),

  apellido_paterno: z.string().nullable(),
  apellido_materno: z.string().nullable(),
  nombres: z.string().nullable(),
  nombre_completo: z.string().nullable(),
  genero: z.string().nullable(),
  fecha_nacimiento: z.string().nullable(),
  entidad_nacimiento: z.string().nullable(),
  pais_nacimiento: z.string().nullable(),
  nacionalidad: z.string().nullable(),
  curp: z.string().nullable(),
  rfc: z.string().nullable(),
  serie_fea: z.string().nullable(),

  tipo_vialidad: z.string().nullable(),
  nombre_vialidad: z.string().nullable(),
  numero_exterior: z.string().nullable(),
  numero_interior: z.string().nullable(),
  entre_calles: z.string().nullable(),
  codigo_postal: z.string().nullable(),
  colonia: z.string().nullable(),
  municipio: z.string().nullable(),
  ciudad: z.string().nullable(),
  entidad_federativa: z.string().nullable(),
  pais: z.string().nullable(),
  domicilio_completo: z.string().nullable(),

  telefono_celular: z.string().nullable(),
  telefono_fijo: z.string().nullable(),
  correo: z.string().nullable(),

  empleo: z.string().nullable(),
  puesto: z.string().nullable(),
  empresa: z.string().nullable(),
  giro_empresa: z.string().nullable(),
  antiguedad: z.string().nullable(),
  ingreso_mensual: z.number().nullable(),
  otros_ingresos: z.string().nullable(),

  pep_propio: z.boolean().nullable(),
  pep_propio_ambito: z.string().nullable(),
  pep_propio_institucion: z.string().nullable(),
  pep_propio_puesto: z.string().nullable(),
  pep_propio_inicio: z.string().nullable(),
  pep_propio_fin: z.string().nullable(),
  pep_propio_vigente: z.boolean().nullable(),

  pep_familia: z.boolean().nullable(),
  pep_familia_parentesco: z.string().nullable(),
  pep_familia_ambito: z.string().nullable(),
  pep_familia_institucion: z.string().nullable(),
  pep_familia_puesto: z.string().nullable(),
  pep_familia_inicio: z.string().nullable(),
  pep_familia_fin: z.string().nullable(),
  pep_familia_vigente: z.boolean().nullable(),

  tipo_identificacion: z.string().nullable(),
  ine_clave_elector: z.string().nullable(),
  ine_anio_registro: z.string().nullable(),
  ine_num_emision: z.string().nullable(),
  ine_anio_emision: z.string().nullable(),
  ine_cic: z.string().nullable(),
  ine_ocr: z.string().nullable(),

  autoriza_grabacion: z.boolean().nullable(),
  autoriza_geolocalizacion: z.boolean().nullable(),
  autoriza_buro: z.boolean().nullable(),
  buro_nip: z.string().nullable(),

  biometria_huella: z.boolean().nullable(),
  biometria_rostro: z.boolean().nullable(),
  video_grabado: z.boolean().nullable(),
  firmado: z.boolean().nullable(),

  geo_latitud: z.number().nullable(),
  geo_longitud: z.number().nullable(),
  geo_precision_metros: z.number().nullable(),
  ubicaciones: z.unknown().nullable(),

  monto_solicitado: z.number().nullable(),
  plazo_solicitado_meses: z.number().nullable(),
  tasa_solicitada: z.number().nullable(),
  pago_estimado: z.number().nullable(),
  es_cliente_existente: z.boolean().nullable(),
  numero_cliente: z.string().nullable(),

  dispositivo: z.string().nullable(),
  version_app: z.string().nullable(),

  propietario_real: z.record(z.string(), z.unknown()).nullable(),
  archivos: z.array(ArchivoResumenSchema),
  documento: DocumentoSchema.nullable(),
});

/** `GET /expedientes/:id/archivos/:tipo` */
export const ArchivoFirmadoSchema = z.object({
  url: z.string(),
  expiraEn: z.string(),
});

/**
 * El `:tipo` de la ruta. Acepta el valor del enum —que es lo que el
 * panel ve en el detalle— y también el nombre de parte del contrato,
 * para que pedir `doc_curp` no devuelva un 404 desconcertante.
 */
export const ParametroTipoSchema = TipoOParteSchema;

/**
 * `PATCH /expedientes/:id`
 *
 * `motivo` no está en el contrato y es opcional: alimenta
 * `historial_estados.motivo`, que ya existe en la base. Un rechazo sin
 * razón anotada es una tabla de auditoría que no sirve de nada.
 */
export const CambioEstadoSchema = z.object({
  estado: EstadoSchema,
  motivo: z.string().trim().max(500).optional(),
});
export const EstadoActualizadoSchema = z.object({ estado: EstadoSchema });

/** `POST /admin/login` */
export const LoginSchema = z.object({
  correo: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export const LoginOkSchema = z.object({ nombre_completo: z.string() });
export const YoSchema = z.object({ correo: z.string(), nombre_completo: z.string() });
