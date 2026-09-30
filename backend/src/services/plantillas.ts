import type { SupabaseClient } from '@supabase/supabase-js';
import { internal, notFound } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import type { PlantillaEntrada } from '../schemas/plantilla';

/**
 * Las plantillas de documentos (CP-S6 / Formatos).
 *
 * El `.docx` lo desarma el navegador —JSZip no cabe en el bundle del
 * Worker, misma razón que el OCR— y el panel manda el HTML extraído.
 * Esto es CP-B11 llegando por otro camino.
 */

const COLUMNAS_RESUMEN = 'id, clave, nombre, archivo_original, version, activa, creado_en';
const COLUMNAS_COMPLETAS = `${COLUMNAS_RESUMEN}, contenido_html`;

/**
 * La lista **no trae `contenido_html`**, y no es una optimización
 * menor: son cientos de kilobytes por renglón de HTML que la tabla de
 * Formatos no pinta. Traerlo convertiría una lista de cinco plantillas
 * en una respuesta de megabytes, y metería el vector de XSS almacenado
 * en una pantalla que no tiene ninguna razón de tocarlo.
 */
export async function listarPlantillas(
  sb: SupabaseClient,
  sofomId: string,
): Promise<unknown[]> {
  const { data, error } = await sb
    .from('plantillas')
    .select(COLUMNAS_RESUMEN)
    .eq('sofom_id', sofomId)
    .order('clave', { ascending: true })
    .order('version', { ascending: false });

  if (error) {
    log.error('fallo al listar plantillas', detalleSupabase(error));
    throw internal('select plantillas');
  }
  return data ?? [];
}

export async function obtenerPlantilla(
  sb: SupabaseClient,
  sofomId: string,
  id: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await sb
    .from('plantillas')
    .select(COLUMNAS_COMPLETAS)
    .eq('sofom_id', sofomId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    log.error('fallo al leer plantilla', detalleSupabase(error));
    throw internal('select plantilla');
  }
  if (!data) throw notFound('No encontramos esa plantilla.');
  return data as Record<string, unknown>;
}

/**
 * Guarda una versión nueva.
 *
 * ============================================================
 *  `contenido_html` ES CONTENIDO NO CONFIABLE Y ES UN VECTOR DE
 *  XSS ALMACENADO.
 *
 *  Sus bytes nacen en un navegador —el panel desarma el `.docx` y
 *  manda el HTML— y aterrizan en una columna que el panel después
 *  renderiza. Cualquiera que pueda subir un formato puede depositar
 *  ahí un `<script>` o un `onerror=`.
 *
 *  Aquí se hacen exactamente dos cosas: comprobar que es cadena y
 *  que no rebasa `MAX_CONTENIDO`. **Se guarda verbatim. No se
 *  limpia.**
 *
 *  Y eso es deliberado. Un medio saneador en la ruta de escritura
 *  es peor que ninguno: no atrapa lo que se le escapa, y sí le da
 *  a quien lea esta columna dentro de seis meses la impresión de
 *  que ya viene limpia. La defensa real es de quien lo pinta, y el
 *  panel sanea al mostrar. Si algún día hace falta sanear aquí
 *  también, que sea una biblioteca completa y que **se sume** a la
 *  del despliegue, no que la reemplace.
 *
 *  Corolario: nada de este backend debe renderizar esta columna, ni
 *  meterla en un correo, ni servirla con `text/html`. Sale como
 *  JSON y quien la pinte se hace cargo.
 * ============================================================
 *
 * Versionado: la anterior activa de la misma clave se apaga y la nueva
 * entra como `max(version) + 1`. No se borra nada — un expediente
 * firmado con la versión 2 tiene que poder explicarse con la versión 2,
 * no con la 5.
 */
export async function crearPlantilla(
  sb: SupabaseClient,
  sofomId: string,
  usuarioId: string,
  entrada: PlantillaEntrada,
): Promise<Record<string, unknown>> {
  // Versión siguiente para esta clave, dentro de este tenant.
  const { data: previas, error: errorPrevias } = await sb
    .from('plantillas')
    .select('version')
    .eq('sofom_id', sofomId)
    .eq('clave', entrada.clave)
    .order('version', { ascending: false })
    .limit(1);

  if (errorPrevias) {
    log.error('fallo al leer versiones de plantilla', detalleSupabase(errorPrevias));
    throw internal('select versiones');
  }

  const version = Number(previas?.[0]?.version ?? 0) + 1;

  // Apagar la activa anterior ANTES de insertar: si se hiciera al
  // revés y la segunda operación fallara, quedarían dos activas con la
  // misma clave y el render tomaría cualquiera de las dos. Así, lo peor
  // que puede pasar es quedarse sin ninguna activa — visible y
  // arreglable subiendo otra vez.
  const { error: errorApagar } = await sb
    .from('plantillas')
    .update({ activa: false })
    .eq('sofom_id', sofomId)
    .eq('clave', entrada.clave)
    .eq('activa', true);

  if (errorApagar) {
    log.error('fallo al desactivar la plantilla previa', detalleSupabase(errorApagar));
    throw internal('update plantillas activa');
  }

  const { data, error } = await sb
    .from('plantillas')
    .insert({
      sofom_id: sofomId,
      clave: entrada.clave,
      nombre: entrada.nombre,
      contenido_html: entrada.contenido_html, // verbatim, ver arriba
      archivo_original: entrada.archivo_original ?? null,
      version,
      activa: true,
      subida_por: usuarioId,
    })
    .select(COLUMNAS_COMPLETAS)
    .single();

  if (error) {
    log.error('fallo al crear plantilla', detalleSupabase(error));
    throw internal('insert plantillas');
  }

  // Ni el nombre del archivo ni el contenido se registran: el primero
  // puede llevar el nombre de una persona, y el segundo es el cuerpo
  // del documento.
  log.info('plantilla creada', {
    clave: entrada.clave,
    version,
    bytes: entrada.contenido_html.length,
    usuario: usuarioId,
  });

  return data as Record<string, unknown>;
}

/**
 * Baja lógica: `activa = false`.
 *
 * Es el «Quitar y usar el predeterminado» de la fuente (:2015). **El
 * renglón no se borra**, y esa es la diferencia que importa: las
 * plantillas son el historial de con qué texto se firmó cada
 * expediente. Borrar la versión 2 deja sin explicación cada solicitud
 * firmada con ella.
 */
export async function desactivarPlantilla(
  sb: SupabaseClient,
  sofomId: string,
  id: string,
): Promise<void> {
  const { data, error } = await sb
    .from('plantillas')
    .update({ activa: false })
    .eq('sofom_id', sofomId)
    .eq('id', id)
    .select('id, clave, version')
    .maybeSingle();

  if (error) {
    log.error('fallo al desactivar plantilla', detalleSupabase(error));
    throw internal('update plantilla');
  }
  if (!data) throw notFound('No encontramos esa plantilla.');

  log.info('plantilla desactivada', {
    clave: data.clave as string,
    version: data.version as number,
  });
}
