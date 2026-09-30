import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../env';
import { badRequest, internal } from '../lib/errors';
import { sha256Texto } from '../lib/hash';
import { detalleSupabase, log } from '../lib/log';
import { PARTES_ARCHIVO, type ParteArchivo } from '../schemas/comunes';
import { ExpedientePayloadSchema, type ExpedientePayload } from '../schemas/expediente';
import { subirArchivo, type RenglonArchivo } from './archivos';
import { conFolioLibre, esChoqueDeFolio } from './folio';

/**
 * Arma el renglón de `expedientes` a partir del payload validado.
 *
 * Es el `mapearExpediente` de la fuente (onp_fer_etapa2_pf.html:2851)
 * movido al servidor, con dos cambios: el folio y el estado los pone el
 * Worker, no el cliente, y los campos `pr_*` y `documento_html` se van
 * a sus propias tablas.
 */
function renglonExpediente(
  d: ExpedientePayload,
  /** `undefined` al completar un borrador: el folio ya está puesto y no se toca. */
  folio: string | undefined,
  sofomId: string | undefined,
): Record<string, unknown> {
  const { documento_html: _html, expedienteId: _id, ...campos } = d;
  const renglon: Record<string, unknown> = { estado: 'pendiente' };
  if (folio) renglon['folio'] = folio;

  for (const [clave, valor] of Object.entries(campos)) {
    if (clave.startsWith('pr_')) continue;
    renglon[clave] = valor;
  }

  const ahora = new Date().toISOString();
  renglon['enviado_en'] = ahora;
  renglon['actualizado_en'] = ahora;

  // Dos booleanos NOT NULL que la fuente nunca ponía porque escribía
  // contra una base más vieja. Son banderas de verificación contra
  // RENAPO y contra el padrón del INE: trámites que esta demo no hace,
  // así que entran en falso. Ponerlos en verdadero sería afirmar una
  // verificación que no ocurrió, en un expediente regulado.
  renglon['curp_verificada_renapo'] = false;
  renglon['ine_verificada'] = false;

  // Herencia de la etapa multi-tenant. La columna existe y es NOT NULL
  // con llave foránea a `sofoms`, así que **sin DEMO_SOFOM_ID no hay
  // envío que funcione**: el insert falla con un 23502. Somos un solo
  // tenant y no administramos `sofoms`, de modo que el uuid de la fila
  // que ya existe entra como secreto. Si el secreto no está, no se
  // manda la columna y el error de Postgres queda en el log — la
  // alternativa, inventar un uuid, sería peor.
  if (sofomId) renglon['sofom_id'] = sofomId;

  return renglon;
}

/** El propietario real, sin el prefijo `pr_` con el que viaja. */
function renglonPropietario(d: ExpedientePayload, expedienteId: string): Record<string, unknown> {
  const renglon: Record<string, unknown> = { expediente_id: expedienteId };
  for (const [clave, valor] of Object.entries(d)) {
    if (clave.startsWith('pr_')) renglon[clave.slice(3)] = valor;
  }
  return renglon;
}

/**
 * ¿Se declaró un tercero?
 *
 * El contrato dice que el bloque `pr_*` viaja «solo cuando es tercero»,
 * pero un formulario que se llenó y luego se vació manda las claves con
 * `null`. Así que la señal es que haya algo identificable dentro, no
 * que las claves existan.
 */
const hayPropietarioReal = (d: ExpedientePayload): boolean =>
  Boolean(d.pr_nombres || d.pr_nombre_completo || d.pr_curp || d.pr_apellido_paterno);

export interface SolicitudCreada {
  readonly folio: string;
  readonly id: string;
  /** Partes que no se pudieron subir. El 201 sale igual; ver el comentario abajo. */
  readonly archivosFallidos: readonly ParteArchivo[];
  /** A dónde mandar la confirmación (CP-B10). `null` si no vino correo. */
  readonly correo: string | null;
}

/**
 * Deja el expediente escrito y devuelve su id y su folio.
 *
 * Dos caminos, y cuál se toma lo decide el payload:
 *
 * **Con `expedienteId`** —el caso normal— el registro ya creó un
 * renglón en `borrador` con su folio (`services/prospectos.ts`), así
 * que esto lo completa y lo pasa a `pendiente`. El folio es el que ya
 * tenía: el prospecto pudo haberlo visto en el correo de bienvenida y
 * cambiarlo ahora sería cambiarle el número de su trámite.
 *
 * El `eq('estado', 'borrador')` no es decoración. Es lo que hace que un
 * segundo envío —un doble clic, un reintento tras un timeout— no
 * sobreescriba un expediente que ya está en revisión o aprobado. Si no
 * actualizó ningún renglón, se distingue entre «no existe» y «ya no es
 * borrador» con una segunda lectura, porque son dos respuestas
 * distintas para quien envía.
 *
 * **Sin `expedienteId`** se inserta como antes, reservando folio a
 * reintentos. Sigue vivo porque el id es opcional en el contrato y
 * porque es lo que corre si alguien llama al endpoint directo.
 */
export async function guardarExpediente(
  sb: SupabaseClient,
  datos: ExpedientePayload,
  sofomId: string | undefined,
): Promise<{ folio: string; id: string }> {
  const borradorId = datos.expedienteId;

  if (borradorId) {
    const { data, error } = await sb
      .from('expedientes')
      .update(renglonExpediente(datos, undefined, sofomId))
      .eq('id', borradorId)
      .eq('estado', 'borrador')
      .select('id, folio')
      .maybeSingle();

    if (error) {
      log.error('fallo al completar el borrador', detalleSupabase(error));
      throw internal('update expedientes');
    }
    if (data) return { folio: data.folio as string, id: data.id as string };

    // Nada actualizado: o el renglón no existe, o ya no es borrador.
    const { data: actual } = await sb
      .from('expedientes')
      .select('estado')
      .eq('id', borradorId)
      .maybeSingle();

    if (actual) {
      throw badRequest(
        'Esta solicitud ya fue enviada. Revisa tu correo: ahí está tu folio.',
        `estado=${String(actual.estado)}`,
      );
    }
    // El borrador se perdió. Insertar es mejor que rechazar a alguien
    // que acaba de llenar veintiocho pantallas.
    log.warn('borrador no encontrado, se inserta expediente nuevo', { borradorId });
  }

  return conFolioLibre(async (candidato) => {
    const { data, error } = await sb
      .from('expedientes')
      .insert(renglonExpediente(datos, candidato, sofomId))
      .select('id, folio')
      .single();

    if (error) {
      if (esChoqueDeFolio(error)) throw error; // lo reintenta conFolioLibre
      log.error('fallo al insertar expediente', detalleSupabase(error));
      throw internal('insert expedientes');
    }
    return { folio: data.folio as string, id: data.id as string };
  }, esChoqueDeFolio);
}

/**
 * Recibe una solicitud completa.
 *
 * Orden: **expediente primero, archivos después.** La fuente lo hacía al
 * revés (:3078) porque el folio venía del navegador y ya existía antes
 * de subir nada. Aquí el folio lo genera el servidor, así que insertar
 * primero es lo que lo reserva: si dos solicitudes chocan en el mismo
 * folio, el índice único lo rechaza y se reintenta con otro **antes** de
 * haber escrito un solo archivo en `{folio}/`. Al revés, el perdedor
 * dejaría archivos huérfanos bajo un folio que acabó siendo de alguien
 * más — y esos archivos son fotos de INE.
 *
 * Si un archivo falla, se anota y se sigue, igual que la fuente
 * (`archivosFallidos`, :3095). Una solicitud que llegó completa salvo un
 * PDF vale más que un 500: el personal ve cuál falta y lo pide. Lo que
 * no se hace es mentir — el renglón de `archivos` solo existe si el
 * archivo está en el bucket.
 */
export async function recibirSolicitud(
  sb: SupabaseClient,
  env: Env,
  form: FormData,
): Promise<SolicitudCreada> {
  // ---- 1. El payload ----
  const parteExpediente = form.get('expediente');
  if (typeof parteExpediente !== 'string') {
    throw badRequest('Falta la parte «expediente» de la solicitud.');
  }

  let crudo: unknown;
  try {
    crudo = JSON.parse(parteExpediente);
  } catch {
    throw badRequest('La parte «expediente» no es JSON válido.');
  }

  const parsed = ExpedientePayloadSchema.safeParse(crudo);
  if (!parsed.success) {
    const campo = parsed.error.issues[0]?.path.join('.') ?? '';
    throw badRequest(
      campo
        ? `Revisa el campo «${campo}» de tu solicitud.`
        : 'Los datos de la solicitud no tienen el formato esperado.',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.code}`).join('; '),
    );
  }
  const datos = parsed.data;

  // ---- 2. Expediente ----
  const { folio, id } = await guardarExpediente(sb, datos, env.DEMO_SOFOM_ID);

  // ---- 3. Archivos ----
  //
  // Uno por uno, a propósito. Cada archivo se materializa completo en
  // memoria para poder sellarlo, y un Worker tiene 128 MB: en paralelo,
  // once archivos de 10 MB son un pico de 110 MB por el simple gusto de
  // terminar antes.
  const renglones: RenglonArchivo[] = [];
  const fallidos: ParteArchivo[] = [];

  for (const parte of PARTES_ARCHIVO) {
    const archivo = form.get(parte);
    if (!(archivo instanceof File) || archivo.size === 0) continue;
    try {
      renglones.push(await subirArchivo(sb, folio, parte, archivo));
    } catch (error) {
      fallidos.push(parte);
      log.warn('archivo no subido', {
        folio,
        parte,
        causa: error instanceof Error ? error.message : 'desconocida',
      });
    }
  }

  if (renglones.length > 0) {
    const { error } = await sb
      .from('archivos')
      .insert(renglones.map((r) => ({ expediente_id: id, ...r })));
    if (error) log.error('fallo al registrar archivos', { folio, ...detalleSupabase(error) });
  }

  // ---- 4. Propietario real ----
  if (hayPropietarioReal(datos)) {
    const { error } = await sb.from('propietarios_reales').insert(renglonPropietario(datos, id));
    if (error) log.error('fallo al insertar propietario real', { folio, ...detalleSupabase(error) });
  }

  // ---- 5. El documento firmado ----
  //
  // `documentos.contenido_html` es NOT NULL, así que sin HTML no hay
  // renglón — no uno vacío. Se sella igual que los archivos: la
  // columna `hash_sha256` ya existía en la tabla y es el mismo
  // argumento probatorio, sobre el documento que la persona firmó.
  if (datos.documento_html) {
    const { error } = await sb.from('documentos').insert({
      expediente_id: id,
      clave: 'solicitud_credito',
      contenido_html: datos.documento_html,
      hash_sha256: await sha256Texto(datos.documento_html),
      firmado: true,
      firmado_en: new Date().toISOString(),
    });
    if (error) log.error('fallo al insertar documento', { folio, ...detalleSupabase(error) });
  }

  log.info('solicitud recibida', {
    folio,
    archivos: renglones.length,
    fallidos: fallidos.length,
    tercero: hayPropietarioReal(datos),
  });

  return { folio, id, archivosFallidos: fallidos, correo: datos.correo };
}
