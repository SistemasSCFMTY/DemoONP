import type { SupabaseClient } from '@supabase/supabase-js';
import { internal, notFound } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import type { Estado, TipoArchivo } from '../schemas/comunes';
import { urlFirmada } from './archivos';

/** Las columnas que la tabla del panel pinta. Nada más viaja. */
const COLUMNAS_RESUMEN = 'id, folio, nombre_completo, curp, estado, monto_solicitado, creado_en';

/** Cinco minutos, como dice el contrato. */
export const VIGENCIA_URL_SEGUNDOS = 300;

/**
 * Toda consulta de expedientes va acotada a `sofom_id`.
 *
 * Somos un solo tenant, pero las tablas heredaron la columna de cuando
 * no lo éramos, y el id sale del secreto y nunca del cliente
 * (`lib/tenant.ts`). Acotar es gratis y convierte «hoy solo hay una
 * SOFOM» —una propiedad de los datos, que cambia— en «este código solo
 * puede ver una» —una propiedad del código, que no.
 */
export interface Consulta {
  readonly q?: string | undefined;
  readonly estado?: Estado | undefined;
  readonly limit: number;
  readonly offset: number;
}

/**
 * Limpia el texto de búsqueda.
 *
 * PostgREST arma `or=(a.ilike.*x*,b.ilike.*x*)` como una cadena, así
 * que una coma o un paréntesis en la búsqueda del usuario cambia la
 * estructura del filtro, no su contenido. Se quita todo lo que no sea
 * letra, dígito, espacio o guion — que es de todos modos todo lo que
 * hay en un folio, un nombre o una CURP.
 */
const limpiarBusqueda = (q: string): string =>
  q.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 80);

/**
 * La lista del panel.
 *
 * Busca en folio, nombre y CURP, como `pintarExpedientes`
 * (onp_fer_etapa2_pf.html:5426).
 */
export async function listarExpedientes(
  sb: SupabaseClient,
  sofomId: string,
  consulta: Consulta,
): Promise<{ items: unknown[]; total: number }> {
  let query = sb
    .from('expedientes')
    .select(COLUMNAS_RESUMEN, { count: 'exact' })
    .eq('sofom_id', sofomId)
    .order('creado_en', { ascending: false })
    .range(consulta.offset, consulta.offset + consulta.limit - 1);

  if (consulta.estado) query = query.eq('estado', consulta.estado);

  if (consulta.q) {
    const q = limpiarBusqueda(consulta.q);
    if (q) {
      query = query.or(
        `folio.ilike.*${q}*,nombre_completo.ilike.*${q}*,curp.ilike.*${q}*`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    log.error('fallo al listar expedientes', detalleSupabase(error));
    throw internal('select expedientes');
  }

  return { items: data ?? [], total: count ?? 0 };
}

/**
 * El expediente completo, con su propietario real, sus archivos y su
 * documento.
 *
 * Cuatro consultas en vez de un `select` anidado de PostgREST: cada una
 * falla por su cuenta, y que no haya documento —o que la tabla
 * `documentos` tenga un renglón raro— no debe dejar al panel sin poder
 * abrir el expediente. Es la pantalla que la demo enseña; que degrade
 * en vez de reventar vale las tres consultas extra.
 *
 * **Aquí no se firman URLs.** Se piden una por una en
 * `GET /expedientes/:id/archivos/:tipo`, para que abrir un expediente
 * no acuñe once URLs de las que se van a ver dos.
 */
export async function obtenerExpediente(
  sb: SupabaseClient,
  sofomId: string,
  id: string,
): Promise<Record<string, unknown>> {
  const { data: expediente, error } = await sb
    .from('expedientes')
    .select('*')
    .eq('sofom_id', sofomId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    log.error('fallo al leer expediente', detalleSupabase(error));
    throw internal('select expediente');
  }
  if (!expediente) throw notFound('No encontramos ese expediente.');

  const [propietario, archivos, documento] = await Promise.all([
    sb.from('propietarios_reales').select('*').eq('expediente_id', id).maybeSingle(),
    sb
      .from('archivos')
      .select('tipo, tamano_bytes, hash_sha256, capturado_en')
      .eq('expediente_id', id)
      .order('capturado_en', { ascending: true }),
    sb
      .from('documentos')
      .select('contenido_html, firmado_en')
      .eq('expediente_id', id)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  for (const r of [propietario, archivos, documento]) {
    if (r.error) log.warn('parte del expediente no cargó', { id, ...detalleSupabase(r.error) });
  }

  return {
    ...expediente,
    propietario_real: propietario.data ?? null,
    archivos: archivos.data ?? [],
    documento: documento.data ?? null,
  };
}

/** La URL firmada de un archivo, válida cinco minutos. */
export async function firmarArchivo(
  sb: SupabaseClient,
  sofomId: string,
  expedienteId: string,
  tipo: TipoArchivo,
): Promise<{ url: string; expiraEn: string }> {
  // `archivos` no lleva `sofom_id`; el acotamiento es el `!inner` sobre
  // el expediente padre. Sin él, un id de expediente de otra SOFOM
  // acuñaría una URL firmada a su foto de INE.
  const { data, error } = await sb
    .from('archivos')
    .select('ruta, expedientes!inner(sofom_id)')
    .eq('expedientes.sofom_id', sofomId)
    .eq('expediente_id', expedienteId)
    .eq('tipo', tipo)
    .maybeSingle();

  if (error) {
    log.error('fallo al buscar archivo', detalleSupabase(error));
    throw internal('select archivo');
  }
  if (!data) throw notFound('Ese expediente no tiene ese archivo.');

  const url = await urlFirmada(sb, data.ruta as string, VIGENCIA_URL_SEGUNDOS);
  if (!url) throw internal('signed url');

  return {
    url,
    expiraEn: new Date(Date.now() + VIGENCIA_URL_SEGUNDOS * 1000).toISOString(),
  };
}

/**
 * Cambia el estado. Es la única escritura que el panel hace (:5640).
 *
 * Y deja rastro. `historial_estados` ya existe en la base
 * —`expediente_id`, `estado_anterior`, `estado_nuevo`, `motivo`,
 * `usuario_id`— y una tabla de auditoría que nadie llena es peor que
 * no tenerla: da la impresión de que hay registro. Cuesta un insert.
 *
 * El renglón de auditoría va **después** del update y su fallo no
 * revierte el cambio: perder una línea de bitácora es peor que dejar
 * un expediente sin dictaminar, pero no tanto como para tirar el
 * dictamen. Queda en el log.
 */
export async function cambiarEstado(
  sb: SupabaseClient,
  sofomId: string,
  id: string,
  estado: Estado,
  usuarioId: string,
  motivo?: string | undefined,
): Promise<Estado> {
  const { data: previo, error: errorPrevio } = await sb
    .from('expedientes')
    .select('estado')
    .eq('sofom_id', sofomId)
    .eq('id', id)
    .maybeSingle();

  if (errorPrevio) {
    log.error('fallo al leer el estado previo', detalleSupabase(errorPrevio));
    throw internal('select estado');
  }
  if (!previo) throw notFound('No encontramos ese expediente.');

  const { data, error } = await sb
    .from('expedientes')
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq('sofom_id', sofomId)
    .eq('id', id)
    .select('estado')
    .maybeSingle();

  if (error) {
    log.error('fallo al cambiar estado', detalleSupabase(error));
    throw internal('update estado');
  }
  if (!data) throw notFound('No encontramos ese expediente.');

  const { error: errorHistorial } = await sb.from('historial_estados').insert({
    expediente_id: id,
    estado_anterior: previo.estado,
    estado_nuevo: estado,
    motivo: motivo ?? null,
    // `usuario_id` apunta a `usuarios_panel.id`, que es exactamente lo
    // que el JWT lleva en `sub` (CP-B7).
    usuario_id: usuarioId,
  });

  if (errorHistorial) {
    log.error('fallo al registrar el historial de estado', {
      id,
      ...detalleSupabase(errorHistorial),
    });
  }

  return data.estado as Estado;
}
