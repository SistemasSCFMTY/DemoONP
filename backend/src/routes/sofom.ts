import { Hono } from 'hono';
import type { Env } from '../env';
import { cuerpoJson, responder } from '../lib/respuesta';
import type { Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';
import { sofomActual } from '../lib/tenant';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { SofomEntradaSchema, SofomSchema } from '../schemas/sofom';
import { guardarSofom, leerSofom } from '../services/sofom';

/** La pestaña Ajustes del panel (CP-S6). */
export const sofom = new Hono<{ Bindings: Env; Variables: { sesion: Sesion } }>();

sofom.use('*', requireAuth);

sofom.get('/', async (c) => {
  const datos = await leerSofom(supabaseDe(c.env), sofomActual(c.env));
  return responder(c, SofomSchema, datos);
});

// Escritura: solo `administrador`. `requireAdmin` va encima de
// `requireAuth`, nunca en su lugar.
sofom.put('/', requireAdmin, async (c) => {
  const entrada = await cuerpoJson(c, SofomEntradaSchema);
  const guardada = await guardarSofom(supabaseDe(c.env), sofomActual(c.env), entrada);
  return responder(c, SofomSchema, guardada);
});
