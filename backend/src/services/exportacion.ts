import type { SupabaseClient } from '@supabase/supabase-js';
import { internal } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';

/**
 * `GET /expedientes/exportar` (CP-S6 / Ajustes).
 *
 * Todo el conjunto de expedientes del tenant, en JSON, con su
 * propietario real, la metadata de sus archivos y su documento.
 *
 * **Es la lectura más sensible del producto**: un solo objeto con la
 * CURP, el RFC, el domicilio, el ingreso y los hashes de la INE de
 * cada solicitante. Tres consecuencias, todas presentes en el código:
 *
 *  · Nunca lleva URLs firmadas. La metadata de `archivos` dice qué se
 *    subió y con qué hash; para *ver* un archivo hay que pedirlo uno
 *    por uno, y esa petición queda en el log.
 *  · `contenido_html` del documento no viaja salvo que se pida. Son
 *    decenas de kilobytes por expediente de algo que ya se puede leer
 *    en el detalle.
 *  · Tiene tope. Un Worker tiene 128 MB y esto se arma en memoria;
 *    «todo» sin techo es una respuesta que muere sola el día que haya
 *    volumen.
 */

/**
 * Techo del export.
 *
 * Se pagina de 200 en 200 contra PostgREST —su tope por respuesta es
 * más bajo que esto— y se corta en 2 000 expedientes. Si hay más, el
 * resultado lo dice con `truncado: true` en vez de mentir con un
 * conjunto incompleto que se ve completo.
 */
const TOPE = 2_000;
const PAGINA = 200;

export interface Exportacion {
  readonly generado_en: string;
  readonly total: number;
  readonly truncado: boolean;
  readonly expedientes: readonly Record<string, unknown>[];
}

export async function exportarExpedientes(
  sb: SupabaseClient,
  sofomId: string,
  incluirDocumento: boolean,
): Promise<Exportacion> {
  const columnasDocumento = incluirDocumento
    ? 'clave, firmado, firmado_en, hash_sha256, contenido_html'
    : 'clave, firmado, firmado_en, hash_sha256';

  // Un solo select con las relaciones anidadas. Aquí sí conviene
  // —a diferencia del detalle, donde se separan para que una parte
  // rota no tumbe la pantalla—: son hasta 2 000 expedientes y hacerlo
  // en cuatro consultas por cada uno serían miles de viajes.
  const seleccion = `
    *,
    propietario_real:propietarios_reales(*),
    archivos:archivos(tipo, nombre_original, tipo_mime, tamano_bytes, hash_sha256, capturado_en),
    documento:documentos(${columnasDocumento})
  `;

  const expedientes: Record<string, unknown>[] = [];
  let truncado = false;

  for (let desde = 0; desde < TOPE; desde += PAGINA) {
    const { data, error } = await sb
      .from('expedientes')
      .select(seleccion)
      .eq('sofom_id', sofomId)
      .order('creado_en', { ascending: true })
      .range(desde, desde + PAGINA - 1);

    if (error) {
      log.error('fallo al exportar expedientes', detalleSupabase(error));
      throw internal('select exportacion');
    }

    const pagina = (data ?? []) as unknown as Record<string, unknown>[];
    for (const fila of pagina) {
      // `sofom_id` no sale: es un solo tenant y ese uuid es interno.
      const { sofom_id: _sofom, ...resto } = fila;
      expedientes.push(resto);
    }

    if (pagina.length < PAGINA) break;
    if (expedientes.length >= TOPE) {
      truncado = true;
      break;
    }
  }

  // Cuántos, no quiénes.
  log.info('exportación generada', {
    expedientes: expedientes.length,
    truncado,
    conDocumento: incluirDocumento,
  });

  return {
    generado_en: new Date().toISOString(),
    total: expedientes.length,
    truncado,
    expedientes,
  };
}
