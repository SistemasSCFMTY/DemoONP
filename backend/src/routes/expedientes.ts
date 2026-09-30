import { Hono } from 'hono';
import type { Env } from '../env';
import { badRequest } from '../lib/errors';
import { cuerpoJson, responder, validar } from '../lib/respuesta';
import type { Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';
import { sofomActual } from '../lib/tenant';
import { requireAuth } from '../middleware/auth';
import {
  ArchivoFirmadoSchema,
  CambioEstadoSchema,
  ConsultaExpedientesSchema,
  EstadoActualizadoSchema,
  ExpedienteDetalleSchema,
  ExportacionSchema,
  ListaExpedientesSchema,
  ParametroTipoSchema,
} from '../schemas/panel';
import {
  cambiarEstado,
  firmarArchivo,
  listarExpedientes,
  obtenerExpediente,
} from '../services/expedientes';
import { exportarExpedientes } from '../services/exportacion';

/**
 * El API de lectura del panel. Todo pasa por `requireAuth`: sin cookie
 * de sesión, 401 (02-api-contract.md).
 *
 * Rutas delgadas; la lógica está en `services/`.
 */
export const expedientes = new Hono<{ Bindings: Env; Variables: { sesion: Sesion } }>();

expedientes.use('*', requireAuth);

expedientes.get('/', async (c) => {
  const consulta = validar(ConsultaExpedientesSchema, {
    q: c.req.query('q'),
    estado: c.req.query('estado'),
    limit: c.req.query('limit') ?? 25,
    offset: c.req.query('offset') ?? 0,
  });

  const { items, total } = await listarExpedientes(supabaseDe(c.env), sofomActual(c.env), consulta);
  return responder(c, ListaExpedientesSchema, { items, total });
});

/**
 * `GET /expedientes/exportar` — CP-S6, pestaña Ajustes.
 *
 * **Va antes que `/:id` a propósito.** Hono prefiere el segmento
 * estático, pero el orden de registro lo deja fuera de duda: si esta
 * ruta cayera en `/:id`, «exportar» se trataría como un uuid y el
 * botón de exportar devolvería un 404 que costaría un rato entender.
 */
expedientes.get('/exportar', async (c) => {
  const exportacion = await exportarExpedientes(
    supabaseDe(c.env),
    sofomActual(c.env),
    c.req.query('incluir_documento') === 'true',
  );
  return responder(c, ExportacionSchema, exportacion);
});

expedientes.get('/:id', async (c) => {
  const detalle = await obtenerExpediente(supabaseDe(c.env), sofomActual(c.env), c.req.param('id'));
  return responder(c, ExpedienteDetalleSchema, detalle);
});

expedientes.get('/:id/archivos/:tipo', async (c) => {
  const tipo = ParametroTipoSchema.safeParse(c.req.param('tipo'));
  if (!tipo.success) throw badRequest('Ese tipo de archivo no existe.');

  const firmado = await firmarArchivo(
    supabaseDe(c.env),
    sofomActual(c.env),
    c.req.param('id'),
    tipo.data,
  );
  return responder(c, ArchivoFirmadoSchema, firmado);
});

expedientes.patch('/:id', async (c) => {
  const { estado, motivo } = await cuerpoJson(c, CambioEstadoSchema);
  const actual = await cambiarEstado(
    supabaseDe(c.env),
    sofomActual(c.env),
    c.req.param('id'),
    estado,
    c.get('sesion').sub,
    motivo,
  );
  return responder(c, EstadoActualizadoSchema, { estado: actual });
});
