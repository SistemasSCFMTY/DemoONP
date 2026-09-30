import type { SupabaseClient } from '@supabase/supabase-js';
import { badRequest } from '../lib/errors';
import { sha256Hex } from '../lib/hash';
import { detalleSupabase, log } from '../lib/log';
import type { ParteArchivo, TipoArchivo } from '../schemas/comunes';
import { TIPO_ARCHIVO_POR_PARTE } from '../schemas/comunes';

export const BUCKET = 'expedientes';

/** 10 MB por archivo. Una foto de INE pesa ~2 MB; un PDF escaneado, menos. */
const MAX_BYTES = 10 * 1024 * 1024;

const EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

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

  const mime = archivo.type || 'application/octet-stream';
  const extension = EXTENSION_POR_MIME[mime.toLowerCase()];
  if (!extension) {
    throw badRequest(
      `El archivo «${parte}» debe ser JPG, PNG, WEBP o PDF.`,
      `mime rechazado: ${mime}`,
    );
  }
  if (archivo.size === 0) {
    throw badRequest(`El archivo «${parte}» llegó vacío. Vuelve a cargarlo.`);
  }
  if (archivo.size > MAX_BYTES) {
    throw badRequest(`El archivo «${parte}» pesa más de 10 MB. Cárgalo más ligero.`);
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
