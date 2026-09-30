import { Hono } from 'hono';
import type { Env } from '../env';
import { badRequest } from '../lib/errors';
import { cuerpoJson, responder, validar } from '../lib/respuesta';
import type { Sesion } from '../lib/sesion';
import { supabaseDe } from '../lib/supabase';
import { sofomActual } from '../lib/tenant';
import { requireAdmin, requireAuth } from '../middleware/auth';
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
/**
 * El extracto completo — `requireAdmin` encima de `requireAuth`.
 *
 * Es el endpoint que más dato personal entrega de una sola vez: todos
 * los expedientes del tenant, con CURP, RFC, domicilio, ingreso y
 * geolocalización. `consulta` existe para mirar un expediente a la vez;
 * bajarlos todos a un archivo es otra cosa. Decisión del dueño,
 * 2026-09-30.
 */
expedientes.get('/exportar', requireAdmin, async (c) => {
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

/**
 * Cambiar el estado de un expediente — `requireAdmin`.
 *
 * Aprobar o rechazar una solicitud de crédito es la decisión del
 * trámite, no una nota al margen. `analista` y `consulta` pueden verla;
 * dictaminarla es del administrador. Decisión del dueño, 2026-09-30.
 */
expedientes.patch('/:id', requireAdmin, async (c) => {
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
