import { z } from 'zod';

/**
 * Piezas compartidas por los esquemas. `src/schemas/` es el contrato
 * (02-api-contract.md); esta misma forma existe otras dos veces, en
 * `web-app/src/app/model/interfaces/` y en `superadmin-app/`. **Derivan
 * en silencio**: un PR que cambia una copia cambia las tres.
 *
 * Todas las piezas de abajo usan `z.preprocess`, y no es estilo: en
 * Zod 4 una clave solo es opcional si el esquema lo declara, y un
 * `.transform()` encima de una unión pierde esa marca. Con
 * `preprocess` la clave ausente sigue siendo ausente y cae al mismo
 * `null` que la cadena vacía — que es justo lo que hace falta aquí,
 * porque el prospecto puede abandonar en cualquiera de las 28
 * pantallas y el expediente tiene que poder guardarse igual.
 */

/** Normaliza cualquier entrada de texto a `string` limpio o `null`. */
function aTextoONulo(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string' && typeof v !== 'number') return v; // que falle en el esquema
  const limpio = String(v).trim();
  return limpio === '' ? null : limpio;
}

/**
 * Texto opcional que normaliza a `null`.
 *
 * Es el `oNulo` de la fuente (onp_fer_etapa2_pf.html:2846): la cadena
 * vacía de un input que el usuario no llenó es ausencia de dato, no un
 * dato vacío. La columna tiene que quedar en NULL para que el panel
 * pueda distinguir «no contestó» de «contestó nada».
 */
export const texto = (max = 500) => z.preprocess(aTextoONulo, z.string().max(max).nullable());

/**
 * Número opcional. Acepta número o cadena numérica y normaliza a
 * `null`, igual que `aNumero` (onp_fer_etapa2_pf.html:2840), que
 * limpiaba «$12,500.00» a 12500. Los montos llegan de inputs de texto
 * con formato de pesos; ser estrictos aquí solo rompería el envío.
 */
export const numero = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

/** Entero opcional, mismo criterio. */
export const entero = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}, z.number().int().nullable());

/**
 * Fecha ISO `yyyy-mm-dd`, o `null`.
 *
 * La UI captura en tríos dd/mm/aaaa y convierte antes de enviar
 * (02-api-contract.md). Aquí solo se valida ISO: aceptar los dos
 * formatos sería aceptar la ambigüedad de 03/04/2026.
 */
export const fechaIso = z.preprocess(
  aTextoONulo,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe venir como yyyy-mm-dd.')
    .nullable(),
);

/**
 * Booleano tolerante: acepta `true`, `"true"` y el `"Sí"` que la
 * fuente guardaba en sus radios (:2921). Ausente es `false`, porque la
 * columna es NOT NULL y «no contestó» en una autorización es «no».
 */
export const booleano = z.preprocess((v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v !== 'string') return false;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === 'sí' || s === 'si' || s === '1';
}, z.boolean());

/** Diez dígitos. La UI los manda formateados; aquí se quedan en dígitos. */
export const telefono = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v),
  z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos.'),
);

export const correo = z.string().trim().toLowerCase().email().max(200);

/**
 * Los estados que el panel puede fijar.
 *
 * **Es `revision`, no `en_revision`.** El tipo `estado_expediente` de
 * Postgres ya existe en la base y sus valores son
 * `borrador | pendiente | revision | aprobado | rechazado | cancelado`.
 * El contrato decía `en_revision`, que no está en el enum: un `update`
 * con ese valor no falla validando, falla con un 500 de Postgres. Se
 * corrigió 02-api-contract.md.
 *
 * Aquí se exponen solo los cuatro del contrato. `borrador` y
 * `cancelado` existen en la base y se leen sin problema —
 * `EstadoLeidoSchema`—, pero el panel no los fija.
 */
export const EstadoSchema = z.enum(['pendiente', 'revision', 'aprobado', 'rechazado']);
export type Estado = z.infer<typeof EstadoSchema>;

/** Todo lo que la columna puede traer al leerla. */
export const EstadoLeidoSchema = z.enum([
  'borrador',
  'pendiente',
  'revision',
  'aprobado',
  'rechazado',
  'cancelado',
]);

/**
 * Dos vocabularios, un mapa.
 *
 * `POST /solicitudes` recibe las doce partes con los nombres del
 * contrato, que son los `id` de los inputs de la fuente
 * (onp_fer_etapa2_pf.html:1728–1765). La columna `archivos.tipo`, en
 * cambio, es el enum `tipo_archivo` de Postgres, y **ninguno de los
 * ocho `doc_*` está en él**. Un insert con `doc_curp` revienta.
 *
 * Así que la parte del multipart se traduce al valor del enum antes de
 * guardar. El contrato conserva sus nombres —`web-app/` ya está
 * construido contra ellos— y la base conserva los suyos.
 *
 * `doc_id` → `otro` merece explicación. Es la carga del documento
 * oficial de identidad como archivo, distinta de las dos fotos que la
 * cámara toma. `id_frente` e `id_reverso` ya están ocupados por esas
 * fotos, y reusarlos haría que el PDF pisara la foto: misma ruta
 * `{folio}/{tipo}.{ext}` y mismo renglón. `otro` es el único valor del
 * enum que queda libre y no miente.
 *
 * **El orden de las claves es el orden en que se suben.** `PARTES_ARCHIVO`
 * sale de `Object.keys` y el ciclo de `services/solicitudes.ts` lo
 * recorre tal cual, uno por uno. Por eso `video` va al final: es la
 * parte más pesada (hasta 25 MB contra 10 MB) y la única que puede
 * faltar sin que el expediente pierda valor. Si el Worker se queda sin
 * tiempo o sin memoria a media subida, lo que ya aterrizó son las
 * fotos de la INE, la firma y los comprobantes.
 */
export const TIPO_ARCHIVO_POR_PARTE = {
  id_frente: 'id_frente',
  id_reverso: 'id_reverso',
  firma: 'firma',
  doc_id: 'otro',
  doc_curp: 'constancia_curp',
  doc_fiscal: 'constancia_fiscal',
  doc_fea: 'constancia_fea',
  doc_domicilio: 'comprobante_domicilio',
  doc_poder: 'poder_notarial',
  doc_id_propietario: 'id_propietario_real',
  doc_domicilio_propietario: 'domicilio_propietario_real',
  video: 'video_identificacion',
} as const satisfies Record<string, TipoArchivo>;

/** Los nombres de parte del multipart, tal como los nombra el contrato. */
export const PARTES_ARCHIVO = Object.keys(
  TIPO_ARCHIVO_POR_PARTE,
) as (keyof typeof TIPO_ARCHIVO_POR_PARTE)[];

export type ParteArchivo = keyof typeof TIPO_ARCHIVO_POR_PARTE;

/**
 * El enum `tipo_archivo` de Postgres, verbatim.
 *
 * `video_identificacion` sí se escribe desde CP-V1 — la parte `video`
 * del multipart cae en él. Sondeado en solo lectura contra la base el
 * 2026-09-30: el valor ya existía en el enum, así que **no hay
 * migración**. `huella` y `rostro` siguen sin escribirse: la biometría
 * continúa simulada, y el panel puede encontrárselos en expedientes
 * viejos.
 */
export const TIPOS_ARCHIVO = [
  'id_frente',
  'id_reverso',
  'firma',
  'video_identificacion',
  'huella',
  'rostro',
  'comprobante_domicilio',
  'constancia_curp',
  'constancia_fiscal',
  'constancia_fea',
  'poder_notarial',
  'id_propietario_real',
  'domicilio_propietario_real',
  'otro',
] as const;

export const TipoArchivoSchema = z.enum(TIPOS_ARCHIVO);
export type TipoArchivo = z.infer<typeof TipoArchivoSchema>;

/**
 * Acepta un tipo del enum o un nombre de parte del contrato.
 *
 * `GET /expedientes/:id/archivos/:tipo` lo usa: el panel pide con lo
 * que vio en el detalle, que son valores del enum, pero aceptar
 * también el vocabulario del contrato cuesta tres líneas y ahorra un
 * 404 desconcertante.
 */
export const TipoOParteSchema = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  return v in TIPO_ARCHIVO_POR_PARTE
    ? TIPO_ARCHIVO_POR_PARTE[v as ParteArchivo]
    : v;
}, TipoArchivoSchema);

/** Los roles del panel. Enum `rol_usuario` de Postgres. */
export const ROLES_PANEL = ['administrador', 'analista', 'consulta'] as const;
export const RolSchema = z.enum(ROLES_PANEL);
export type Rol = z.infer<typeof RolSchema>;
