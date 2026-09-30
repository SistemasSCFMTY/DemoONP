import { Hono } from 'hono';
import type { Env } from '../env';
import { badRequest } from '../lib/errors';
import { responder } from '../lib/respuesta';
import { supabaseDe } from '../lib/supabase';
import { SolicitudCreadaSchema } from '../schemas/expediente';
import { recibirSolicitud } from '../services/solicitudes';

/**
 * `POST /solicitudes` — la solicitud completa, multipart.
 *
 * La ruta es delgada a propósito (01-conventions.md §10): lee el
 * multipart y delega. Toda la lógica vive en `services/solicitudes.ts`.
 */
export const solicitudes = new Hono<{ Bindings: Env }>();

solicitudes.post('/', async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw badRequest('No pudimos leer los archivos que enviaste. Inténtalo de nuevo.');
  }

  const creada = await recibirSolicitud(supabaseDe(c.env), c.env, form);

  // `archivosFallidos` no sale en la respuesta: el contrato dice
  // `201 → { folio, id }` y nada más. Queda en el log del servidor,
  // que es donde el personal lo necesita — el prospecto no puede
  // hacer nada con esa lista salvo asustarse.
  return responder(c, SolicitudCreadaSchema, { folio: creada.folio, id: creada.id }, 201);
});
