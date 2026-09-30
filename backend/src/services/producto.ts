import type { SupabaseClient } from '@supabase/supabase-js';
import { internal, notFound } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import type { Producto } from '../schemas/producto';

/**
 * Los parámetros del simulador (CP-B9).
 *
 * Un solo renglón, fijado en `id = 1`: el producto es único. El panel
 * lo edita en su lugar (CP-S5) y el prospecto lo lee sin sesión — es
 * información pública de la oferta, la misma que va en el catálogo.
 *
 * Postgres devuelve `numeric` como cadena en PostgREST, para no perder
 * precisión. Aquí se convierte a número: el contrato dice números, y
 * mandar `"36.00"` haría que el navegador multiplicara cadenas.
 */

const CAMPOS =
  'monto_min, monto_max, plazo_min, plazo_max, tasa_anual, comision_apertura, comision_pct, comision_desde';

const aNumero = (v: unknown): number => (typeof v === 'number' ? v : Number(v));

function normalizar(fila: Record<string, unknown>): Producto {
  return {
    monto_min: aNumero(fila['monto_min']),
    monto_max: aNumero(fila['monto_max']),
    plazo_min: aNumero(fila['plazo_min']),
    plazo_max: aNumero(fila['plazo_max']),
    tasa_anual: aNumero(fila['tasa_anual']),
    comision_apertura: Boolean(fila['comision_apertura']),
    comision_pct: aNumero(fila['comision_pct']),
    comision_desde: aNumero(fila['comision_desde']),
  };
}

export async function leerProducto(sb: SupabaseClient): Promise<Producto> {
  const { data, error } = await sb.from('producto').select(CAMPOS).eq('id', 1).maybeSingle();

  if (error) {
    log.error('fallo al leer producto', detalleSupabase(error));
    throw internal('select producto');
  }
  if (!data) throw notFound('Todavía no hay parámetros de crédito configurados.');

  return normalizar(data as Record<string, unknown>);
}

export async function guardarProducto(sb: SupabaseClient, p: Producto): Promise<Producto> {
  const { data, error } = await sb
    .from('producto')
    .upsert({ id: 1, ...p, actualizado_en: new Date().toISOString() })
    .select(CAMPOS)
    .single();

  if (error) {
    log.error('fallo al guardar producto', detalleSupabase(error));
    throw internal('upsert producto');
  }

  log.info('producto actualizado', { tasaAnual: p.tasa_anual });
  return normalizar(data as Record<string, unknown>);
}
