import { Hono } from 'hono';
import type { Env } from '../env';
import { cuerpoJson, responder } from '../lib/respuesta';
import type { Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
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
producto.put('/', requireAuth, async (c) => {
  const entrada = await cuerpoJson(c, ProductoEntradaSchema);
  const guardado = await guardarProducto(supabaseDe(c.env), entrada);
  return responder(c, ProductoSchema, guardado);
});
