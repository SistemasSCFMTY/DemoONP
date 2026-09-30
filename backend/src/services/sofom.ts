import type { SupabaseClient } from '@supabase/supabase-js';
import { internal, notFound } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import type { Sofom } from '../schemas/sofom';

/**
 * La identidad de la SOFOM (CP-S6 / Ajustes).
 *
 * Cinco columnas de `sofoms`, y solo cinco. La marca visual —logo,
 * color— **no se toca desde aquí**: vive en
 * `web-app/src/app/brand.config.ts` (desviación D3). Que la tabla
 * tenga `color_primario` y `logo_url` es herencia de la etapa
 * multi-tenant; exponerlas volvería a meter la configuración de marca
 * en la base, que es exactamente lo que se decidió no hacer.
 *
 * El renglón se direcciona siempre por `DEMO_SOFOM_ID`. El id nunca
 * viene del cliente — ver `lib/tenant.ts`.
 */

const COLUMNAS = 'razon_social, rfc, domicilio, telefono, correo_contacto';

export async function leerSofom(sb: SupabaseClient, sofomId: string): Promise<Sofom> {
  const { data, error } = await sb.from('sofoms').select(COLUMNAS).eq('id', sofomId).maybeSingle();

  if (error) {
    log.error('fallo al leer la sofom', detalleSupabase(error));
    throw internal('select sofoms');
  }
  if (!data) {
    // El secreto apunta a un renglón que no existe. Es un error de
    // configuración, no del usuario.
    log.error('DEMO_SOFOM_ID no corresponde a ninguna fila', { sofomId });
    throw notFound('No encontramos los datos de la institución.');
  }

  return data as unknown as Sofom;
}

/**
 * Actualiza las cinco columnas y nada más.
 *
 * `nombre_corto` es NOT NULL y no está en el esquema de entrada, así
 * que no se envía y sobrevive intacta. Un `update` parcial es lo
 * correcto aquí precisamente por eso: un `upsert` con el objeto
 * completo la pondría en NULL y reventaría.
 */
export async function guardarSofom(
  sb: SupabaseClient,
  sofomId: string,
  datos: Sofom,
): Promise<Sofom> {
  const { data, error } = await sb
    .from('sofoms')
    .update({ ...datos, actualizado_en: new Date().toISOString() })
    .eq('id', sofomId)
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    log.error('fallo al guardar la sofom', detalleSupabase(error));
    throw internal('update sofoms');
  }
  if (!data) throw notFound('No encontramos los datos de la institución.');

  // La razón social es pública —va en el pie de cada correo—, así que
  // registrarla no filtra nada. El resto no se registra.
  log.info('sofom actualizada', { razonSocial: datos.razon_social });

  return data as unknown as Sofom;
}
