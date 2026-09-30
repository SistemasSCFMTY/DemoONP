import { z } from 'zod';
import { booleano, entero, fechaIso, numero, texto } from './comunes';

/**
 * El expediente, campo por campo.
 *
 * Sale de `mapearExpediente` (onp_fer_etapa2_pf.html:2851) y de
 * `mapearPropietario` (:2948), y es la sección «expediente payload» de
 * 02-api-contract.md. Viaja plano y en snake_case, como la parte
 * `expediente` del multipart.
 *
 * Todo campo es opcional salvo lo que la base exige: el prospecto puede
 * quedarse a medias en cualquier pantalla y el expediente debe poder
 * guardarse igual. Quién tiene que llenar qué lo decide el asistente en
 * `web-app/`, declarado por paso (01-conventions.md §8), no este
 * esquema.
 */

/** Uno de los cuatro momentos probatorios: autorización, fotos, video, firma. */
export const UbicacionSchema = z.object({
  etiqueta: z.string().max(60),
  latitud: z.number(),
  longitud: z.number(),
  precision_metros: z.number().nullable().optional(),
  capturado_en: z.string().max(40),
});

export const ExpedientePayloadSchema = z.object({
  // ---- Identidad ----
  apellido_paterno: texto(120),
  apellido_materno: texto(120),
  nombres: texto(120),
  nombre_completo: texto(300),
  genero: texto(30),
  fecha_nacimiento: fechaIso,
  entidad_nacimiento: texto(80),
  pais_nacimiento: texto(80),
  nacionalidad: texto(80),
  curp: texto(18),
  rfc: texto(13),
  serie_fea: texto(120),

  // ---- Domicilio ----
  tipo_vialidad: texto(60),
  nombre_vialidad: texto(200),
  numero_exterior: texto(30),
  numero_interior: texto(30),
  entre_calles: texto(200),
  codigo_postal: texto(10),
  colonia: texto(150),
  municipio: texto(150),
  ciudad: texto(150),
  entidad_federativa: texto(80),
  pais: texto(80),
  domicilio_completo: texto(500),

  // ---- Contacto ----
  telefono_celular: texto(20),
  telefono_fijo: texto(20),
  correo: texto(200),

  // ---- Laborales ----
  empleo: texto(120),
  puesto: texto(120),
  empresa: texto(200),
  giro_empresa: texto(200),
  antiguedad: texto(60),
  ingreso_mensual: numero,
  otros_ingresos: texto(200),

  // ---- PEP propio ----
  pep_propio: booleano,
  pep_propio_ambito: texto(80),
  pep_propio_institucion: texto(200),
  pep_propio_puesto: texto(150),
  pep_propio_inicio: fechaIso,
  pep_propio_fin: fechaIso,
  pep_propio_vigente: booleano,

  // ---- PEP familia ----
  pep_familia: booleano,
  pep_familia_parentesco: texto(60),
  pep_familia_ambito: texto(80),
  pep_familia_institucion: texto(200),
  pep_familia_puesto: texto(150),
  pep_familia_inicio: fechaIso,
  pep_familia_fin: fechaIso,
  pep_familia_vigente: booleano,

  // ---- Identificación ----
  tipo_identificacion: texto(60),
  ine_clave_elector: texto(30),
  ine_anio_registro: texto(4),
  ine_num_emision: texto(4),
  ine_anio_emision: texto(4),
  ine_cic: texto(20),
  ine_ocr: texto(20),

  // ---- Autorizaciones ----
  autoriza_grabacion: booleano,
  autoriza_geolocalizacion: booleano,
  autoriza_buro: booleano,
  buro_nip: texto(20),

  // ---- Evidencias ----
  biometria_huella: booleano,
  biometria_rostro: booleano,
  video_grabado: booleano,
  firmado: booleano,

  // ---- Geolocalización ----
  geo_latitud: numero,
  geo_longitud: numero,
  geo_precision_metros: numero,
  ubicaciones: z.preprocess(
    (v) => (v === undefined || v === '' ? null : v),
    z.array(UbicacionSchema).nullable(),
  ),

  // ---- Solicitud ----
  monto_solicitado: numero,
  plazo_solicitado_meses: entero,
  tasa_solicitada: numero,
  pago_estimado: numero,
  es_cliente_existente: booleano,
  numero_cliente: texto(60),

  // ---- Meta ----
  dispositivo: texto(250),
  version_app: texto(20),

  /**
   * La solicitud renderizada que el prospecto firmó, tal cual la vio.
   *
   * NO ESTABA EN EL CONTRATO. CP-B3 pide insertar «el renglón firmado de
   * `documentos`» y el contrato describe `GET /expedientes/:id`
   * devolviendo `documento: { contenido_html, firmado_en }`, pero la
   * lista de campos del payload no decía de dónde sale ese HTML. La
   * fuente lo mandaba desde el navegador (`exp.documento`,
   * onp_fer_etapa2_pf.html:3130) y esa sigue siendo la única fuente
   * posible: el Worker no renderiza plantillas (CP-B11 es P2 y se
   * espera que se corte). Añadido aquí y a 02-api-contract.md en el
   * mismo PR — `web-app/` tiene que mandarlo desde CP-F11.
   */
  documento_html: texto(200_000),

  /**
   * El expediente en `borrador` que creó `POST /prospectos`.
   *
   * Cuando viene, el envío **actualiza ese renglón** en vez de insertar
   * otro: el registro y la solicitud son el mismo expediente en dos
   * momentos, no dos filas. Opcional a propósito — una sesión que
   * perdió el id todavía puede enviar, y es preferible un expediente
   * sin su borrador que una solicitud rechazada.
   *
   * No es una columna: se quita antes de armar el renglón.
   */
  expedienteId: z.string().uuid().optional(),

  // ---- Propietario real: solo cuando se declara un tercero ----
  pr_apellido_paterno: texto(120),
  pr_apellido_materno: texto(120),
  pr_nombres: texto(120),
  pr_nombre_completo: texto(300),
  pr_genero: texto(30),
  pr_fecha_nacimiento: fechaIso,
  pr_entidad_nacimiento: texto(80),
  pr_nacionalidad: texto(80),
  pr_curp: texto(18),
  pr_rfc: texto(13),
  pr_domicilio_completo: texto(500),
  pr_codigo_postal: texto(10),
  pr_colonia: texto(150),
  pr_municipio: texto(150),
  pr_entidad_federativa: texto(80),
  pr_telefono: texto(20),
  pr_correo: texto(200),
  pr_empleo: texto(120),
  pr_puesto: texto(120),
  pr_empresa: texto(200),
  pr_ingreso_mensual: numero,
});

export type ExpedientePayload = z.infer<typeof ExpedientePayloadSchema>;

/** `POST /solicitudes` → 201 */
export const SolicitudCreadaSchema = z.object({
  folio: z.string(),
  id: z.string().uuid(),
});
