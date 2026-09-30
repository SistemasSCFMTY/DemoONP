import { Hono } from 'hono';
import type { Env } from '../env';
import { cuerpoJson, responder } from '../lib/respuesta';
import type { Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';
import { sofomActual } from '../lib/tenant';
import { requireAdmin, requireAuth } from '../middleware/auth';
import {
  ListaPlantillasSchema,
  PlantillaEntradaSchema,
  PlantillaSchema,
} from '../schemas/plantilla';
import {
  crearPlantilla,
  desactivarPlantilla,
  listarPlantillas,
  obtenerPlantilla,
} from '../services/plantillas';

/** La pestaña Formatos del panel (CP-S6). */
export const plantillas = new Hono<{ Bindings: Env; Variables: { sesion: Sesion } }>();

plantillas.use('*', requireAuth);

plantillas.get('/', async (c) => {
  const lista = await listarPlantillas(supabaseDe(c.env), sofomActual(c.env));
  return responder(c, ListaPlantillasSchema, lista);
});

plantillas.get('/:id', async (c) => {
  const p = await obtenerPlantilla(supabaseDe(c.env), sofomActual(c.env), c.req.param('id'));
  return responder(c, PlantillaSchema, p);
});

plantillas.post('/', requireAdmin, async (c) => {
  const entrada = await cuerpoJson(c, PlantillaEntradaSchema);
  const creada = await crearPlantilla(
    supabaseDe(c.env),
    sofomActual(c.env),
    c.get('sesion').sub,
    entrada,
  );
  return responder(c, PlantillaSchema, creada, 201);
});

/**
 * Baja lógica, no borrado. Devuelve 204.
 *
 * Es el «Quitar y usar el predeterminado» de la fuente (:2015): el
 * renglón queda como historial de con qué texto se firmó cada
 * expediente.
 */
plantillas.delete('/:id', requireAdmin, async (c) => {
  await desactivarPlantilla(supabaseDe(c.env), sofomActual(c.env), c.req.param('id'));
  return c.body(null, 204);
});
