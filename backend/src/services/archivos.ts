import type { SupabaseClient } from '@supabase/supabase-js';
import { badRequest } from '../lib/errors';
import { sha256Hex } from '../lib/hash';
import { detalleSupabase, log } from '../lib/log';
import type { ParteArchivo, TipoArchivo } from '../schemas/comunes';
import { TIPO_ARCHIVO_POR_PARTE } from '../schemas/comunes';

export const BUCKET = 'expedientes';

const MB = 1024 * 1024;

/**
 * Lo que se acepta en una parte del multipart.
 *
 * **Un solo límite para todas las partes no sirve.** Con 10 MB la
 * videograbación se queda fuera; con 25 MB una supuesta «foto de INE»
 * de 11 MB entra sin que nadie la mire. Son dos cosas distintas y se
 * miden distinto.
 */
interface ReglaArchivo {
  /** El allowlist y la extensión de la ruta, en un solo mapa. */
  readonly extensionPorMime: Readonly<Record<string, string>>;
  readonly maxBytes: number;
  /** Los formatos, como se le nombran al prospecto en el rechazo. */
  readonly formatos: string;
}

/**
 * Fotos y documentos: 10 MB. Una foto de INE pesa ~2 MB; un PDF
 * escaneado, menos.
 */
const REGLA_DOCUMENTO: ReglaArchivo = {
  extensionPorMime: {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  },
  maxBytes: 10 * MB,
  formatos: 'JPG, PNG, WEBP o PDF',
};

/**
 * La videograbación de identificación: 25 MB.
 *
 * Dos contenedores porque son dos navegadores: Chromium graba WebM y
 * Safari solo MP4 (`MediaRecorder` de iOS no hace WebM). El tope sale
 * de la cota que `web-app/` se impone al grabar —640×480 a ~500 kbps
 * durante 45 s son unos 3 MB—, con holgura para un aparato que ignore
 * el bitrate pedido. No es una comodidad: es lo que evita que el
 * momento más lento del flujo, «Completar Etapa 2», se convierta en un
 * timeout.
 */
const REGLA_VIDEO: ReglaArchivo = {
  extensionPorMime: {
    'video/webm': 'webm',
    'video/mp4': 'mp4',
  },
  maxBytes: 25 * MB,
  formatos: 'WebM o MP4',
};

/** Lo que no esté aquí se mide con `REGLA_DOCUMENTO`. */
const REGLA_POR_PARTE: Partial<Record<ParteArchivo, ReglaArchivo>> = {
  video: REGLA_VIDEO,
};

const reglaDe = (parte: ParteArchivo): ReglaArchivo => REGLA_POR_PARTE[parte] ?? REGLA_DOCUMENTO;

/**
 * El tipo de medio, sin sus parámetros.
 *
 * `MediaRecorder` no entrega `video/webm` a secas: entrega
 * `video/webm;codecs=vp8,opus`, y ese sufijo viaja tal cual en
 * `File.type`. El tipo de medio es lo que va antes del primer `;`
 * (RFC 2045 §5.1), así que los parámetros deciden el `Content-Type`
 * que se guarda pero no el permiso ni la extensión. Sin esto, la
 * grabación real de CP-V2 se rechazaría por su propio códec.
 */
const tipoBase = (mime: string): string => (mime.split(';')[0] ?? '').trim().toLowerCase();

export interface RenglonArchivo {
  readonly tipo: TipoArchivo;
  readonly ruta: string;
  readonly nombre_original: string;
  readonly tipo_mime: string;
  readonly tamano_bytes: number;
  readonly hash_sha256: string;
  readonly capturado_en: string;
}

/**
 * Sube un archivo al bucket y devuelve su renglón de `archivos`.
 *
 * El orden importa: **primero se sella, luego se sube.** El SHA-256 se
 * calcula sobre los bytes que efectivamente se van a escribir, en el
 * servidor, y nunca se acepta uno que mande el cliente. Es el valor
 * probatorio del producto — lo que permite sostener que la INE que el
 * panel muestra es bit por bit la que se capturó (01-conventions.md §10).
 * La fuente lo calculaba en el navegador (:2989), donde no prueba nada.
 *
 * La ruta es de un solo nivel, `{folio}/{tipo}.{ext}`, igual que la
 * fuente (:2998) y por la misma razón: Supabase guarda cada carpeta en
 * `storage.prefixes` con sus propios candados, y menos niveles es menos
 * cosas que se puedan bloquear.
 */
export async function subirArchivo(
  sb: SupabaseClient,
  folio: string,
  parte: ParteArchivo,
  archivo: File,
): Promise<RenglonArchivo> {
  // El nombre de la parte del multipart no es el valor de la columna.
  // `archivos.tipo` es el enum `tipo_archivo` de Postgres y ninguno de
  // los `doc_*` del contrato está en él (src/schemas/comunes.ts).
  const tipo = TIPO_ARCHIVO_POR_PARTE[parte];

  // Cada parte se mide con su propia regla: el video acepta otros
  // formatos y otro peso que una foto, y el rechazo tiene que nombrar
  // los formatos de *esa* parte. Decirle a quien mandó una grabación
  // que «debe ser JPG, PNG, WEBP o PDF» es peor que no decir nada.
  const regla = reglaDe(parte);

  const mime = archivo.type || 'application/octet-stream';
  const extension = regla.extensionPorMime[tipoBase(mime)];
  if (!extension) {
    throw badRequest(
      `El archivo «${parte}» debe ser ${regla.formatos}.`,
      `mime rechazado: ${mime}`,
    );
  }
  if (archivo.size === 0) {
    throw badRequest(`El archivo «${parte}» llegó vacío. Vuelve a cargarlo.`);
  }
  if (archivo.size > regla.maxBytes) {
    throw badRequest(
      `El archivo «${parte}» pesa más de ${Math.round(regla.maxBytes / MB)} MB. Cárgalo más ligero.`,
    );
  }

  const bytes = await archivo.arrayBuffer();
  const hash = await sha256Hex(bytes);
  const ruta = `${folio}/${tipo}.${extension}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(ruta, bytes, { contentType: mime, upsert: true });

  if (error) {
    // El texto de Supabase se queda aquí. La fuente lo pintaba en la UI
    // y filtraba el contenido de las políticas RLS (:3013).
    log.error('fallo al subir archivo', { tipo, ruta, ...detalleSupabase(error) });
    throw new Error(`upload ${tipo}`);
  }

  return {
    tipo,
    ruta,
    nombre_original: archivo.name || `${tipo}.${extension}`,
    tipo_mime: mime,
    tamano_bytes: archivo.size,
    hash_sha256: hash,
    capturado_en: new Date().toISOString(),
  };
}

/** URL firmada de corta vida para que el panel muestre un archivo. */
export async function urlFirmada(
  sb: SupabaseClient,
  ruta: string,
  segundos: number,
): Promise<string | null> {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(ruta, segundos);
  if (error || !data) {
    log.error('fallo al firmar url', { ruta, ...detalleSupabase(error) });
    return null;
  }
  return data.signedUrl;
}
