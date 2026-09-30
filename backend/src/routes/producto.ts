import { Hono } from 'hono';
import type { Env } from '../env';
import { cuerpoJson, responder } from '../lib/respuesta';
import type { Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { ProductoEntradaSchema, ProductoSchema } from '../schemas/producto';
import { guardarProducto, leerProducto } from '../services/producto';

export const producto = new Hono<{ Bindings: Env; Variables: { sesion: Sesion } }>();

/**
 * Público: el simulador del prospecto lo lee antes de que exista
 * cualquier cuenta. Es la oferta anunciada, la misma que el catálogo.
 */
producto.get('/', async (c) => {
  return responder(c, ProductoSchema, await leerProducto(supabaseDe(c.env)));
});

/** Solo el panel (CP-S5). */
/**
 * Los parámetros del simulador — `requireAdmin`.
 *
 * La tasa y el monto máximo son lo que el prospecto ve y sobre lo que
 * decide. Cambiarlos es una decisión de producto. Decisión del dueño,
 * 2026-09-30.
 */
producto.put('/', requireAuth, requireAdmin, async (c) => {
  const entrada = await cuerpoJson(c, ProductoEntradaSchema);
  const guardado = await guardarProducto(supabaseDe(c.env), entrada);
  return responder(c, ProductoSchema, guardado);
});
