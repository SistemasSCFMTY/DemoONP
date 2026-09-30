import type { SupabaseClient } from '@supabase/supabase-js';
import { internal } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import type { Prospecto } from '../schemas/prospecto';
import { conFolioLibre, esChoqueDeFolio } from './folio';

/**
 * El registro previo a la solicitud.
 *
 * **No es una entidad aparte: es un `expedientes` en `borrador`.**
 * Hubo una tabla `prospectos` y el dueño la quitó (2026-09-30), con
 * razón: `expedientes` ya tiene `nombres`, `apellido_paterno`,
 * `apellido_materno`, `correo` y `telefono_celular`, y de sus 106
 * columnas solo `folio` y `sofom_id` son obligatorias sin default. Una
 * tabla propia duplicaba columnas y dejaba al prospecto invisible en
 * el panel hasta que enviara.
 *
 * `estado` es `borrador` porque es el valor que el enum
 * `estado_expediente` ya tiene para «empezado, sin enviar». No se
 * agregó uno nuevo: `alter type` toca un tipo que la app original
 * todavía lee, y su panel reetiqueta como `pendiente` todo valor que
 * no conoce (`onp_fer_etapa2_pf.html:5444`).
 *
 * El folio se reserva aquí, no al enviar. Es la consecuencia de que
 * `folio` sea NOT NULL sin default, y sale a favor: el número existe
 * desde el registro y no cambia, así que el correo de bienvenida y el
 * de confirmación hablan del mismo expediente.
 *
 * **La contraseña no se guarda.** Se valida en ocho caracteres, como en
 * la fuente (`:2552`), y se descarta. La fuente tampoco la guardaba
 * —`registrarProspecto` (`:2539`) solo la medía y avanzaba de
 * pantalla— y `expedientes` no tiene dónde ponerla. Guardar un hash
 * que nada verifica sería inventar una credencial: el prospecto no
 * inicia sesión en ningún lado, y quien sí lo hace —el personal del
 * panel— vive en Supabase Auth (CP-B7).
 */
export async function registrarProspecto(
  sb: SupabaseClient,
  datos: Prospecto,
  sofomId: string | undefined,
): Promise<{ id: string; folio: string }> {
  const base: Record<string, unknown> = {
    estado: 'borrador',
    nombres: datos.nombres,
    apellido_paterno: datos.apellidoPaterno,
    apellido_materno: datos.apellidoMaterno ?? null,
    nombre_completo: [datos.nombres, datos.apellidoPaterno, datos.apellidoMaterno]
      .filter(Boolean)
      .join(' '),
    correo: datos.correo,
    telefono_celular: datos.telefono,
  };
  // Misma herencia multi-tenant que en el envío: `sofom_id` es NOT NULL
  // con llave foránea, así que sin el secreto no hay registro posible.
  if (sofomId) base['sofom_id'] = sofomId;

  return conFolioLibre(async (candidato) => {
    const { data, error } = await sb
      .from('expedientes')
      .insert({ ...base, folio: candidato })
      .select('id, folio')
      .single();

    if (error) {
      if (esChoqueDeFolio(error)) throw error; // lo reintenta conFolioLibre
      log.error('fallo al registrar prospecto', detalleSupabase(error));
      throw internal('insert expedientes (borrador)');
    }
    return { id: data.id as string, folio: data.folio as string };
  }, esChoqueDeFolio);
}
