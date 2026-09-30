import type { SupabaseClient } from '@supabase/supabase-js';
import { internal } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';

/**
 * «Verifica tu identidad» — localizar un expediente ya registrado.
 *
 * Portado de `verificarCliente` (onp_fer_etapa2_pf.html:2575). La
 * pantalla pide número de cliente, nombre completo y CURP, **y la
 * fuente sólo busca por CURP**: los otros dos campos se capturan y no
 * entran en la consulta (`.eq('curp', curp)`, `:2597`). Se conserva ese
 * comportamiento; cambiarlo a una coincidencia de tres campos sería
 * rechazar a gente por un segundo apellido mal escrito.
 *
 * Lo que sí cambia es quién busca: la fuente consultaba
 * `v_lista_expedientes` desde el navegador con la llave anon. Aquí lo
 * hace el Worker, y devuelve lo mínimo — si existe y a qué teléfono
 * mandar el código, enmascarado. **Nunca el expediente.** Saber que una
 * CURP es cliente no debe alcanzar para leer su domicilio: para eso
 * está el OTP, y el expediente se entrega después de validarlo.
 */
export interface ClienteLocalizado {
  readonly expedienteId: string;
  readonly telefono: string;
}

export async function localizarPorCurp(
  sb: SupabaseClient,
  curp: string,
  sofomId: string | undefined,
): Promise<ClienteLocalizado | null> {
  let consulta = sb
    .from('expedientes')
    .select('id, telefono_celular')
    .eq('curp', curp.trim().toUpperCase())
    // El más reciente: alguien que ya envió una solicitud y empezó otra
    // debe retomar la que está abierta.
    .order('creado_en', { ascending: false })
    .limit(1);

  if (sofomId) consulta = consulta.eq('sofom_id', sofomId);

  const { data, error } = await consulta;

  if (error) {
    log.error('fallo al localizar cliente', detalleSupabase(error));
    throw internal('select expedientes (curp)');
  }

  const fila = data?.[0];
  if (!fila || !fila.telefono_celular) return null;

  return { expedienteId: fila.id as string, telefono: fila.telefono_celular as string };
}

/**
 * `55 1234 5678` → `•• •••• 5678`.
 *
 * Se enseña para que la persona sepa a qué aparato le llegó el código,
 * que es información que necesita. Los últimos cuatro no sirven para
 * reconstruir el número y son los que la gente reconoce.
 */
export function enmascararTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  const ultimos = digitos.slice(-4);
  return `•• •••• ${ultimos}`;
}

/**
 * Guarda en qué paso del flujo va el expediente.
 *
 * Sólo toca borradores: una solicitud enviada ya no está «en un paso»,
 * y dejar que se le escriba encima sería dar a un token de prospecto
 * poder sobre un expediente en revisión.
 */
export async function guardarPaso(
  sb: SupabaseClient,
  expedienteId: string,
  paso: string,
): Promise<void> {
  const { error } = await sb
    .from('expedientes')
    .update({ paso_actual: paso, actualizado_en: new Date().toISOString() })
    .eq('id', expedienteId)
    .eq('estado', 'borrador');

  if (error) {
    log.error('fallo al guardar el paso', detalleSupabase(error));
    throw internal('update expedientes (paso_actual)');
  }
}

/** El paso donde se quedó, o `null` si nunca guardó uno. */
export async function leerPaso(
  sb: SupabaseClient,
  expedienteId: string,
): Promise<string | null> {
  const { data, error } = await sb
    .from('expedientes')
    .select('paso_actual, estado')
    .eq('id', expedienteId)
    .maybeSingle();

  if (error) {
    log.error('fallo al leer el paso', detalleSupabase(error));
    throw internal('select expedientes (paso_actual)');
  }
  if (!data || data.estado !== 'borrador') return null;
  return (data.paso_actual as string | null) ?? null;
}

/**
 * El borrador de este teléfono, si lo hay.
 *
 * Se usa al validar el OTP: el número ya quedó probado, así que esto es
 * lo que convierte «tu código es correcto» en «retoma donde te
 * quedaste». Sólo borradores — un expediente enviado no se retoma, se
 * consulta, y eso es otra pantalla que esta demo no tiene.
 */
export async function buscarBorradorPorTelefono(
  sb: SupabaseClient,
  telefono: string,
): Promise<{ expedienteId: string; paso: string | null } | null> {
  const { data, error } = await sb
    .from('expedientes')
    .select('id, paso_actual')
    .eq('telefono_celular', telefono)
    .eq('estado', 'borrador')
    .order('creado_en', { ascending: false })
    .limit(1);

  if (error) {
    log.error('fallo al buscar borrador por teléfono', detalleSupabase(error));
    throw internal('select expedientes (telefono)');
  }

  const fila = data?.[0];
  if (!fila) return null;
  return {
    expedienteId: fila.id as string,
    paso: (fila.paso_actual as string | null) ?? null,
  };
}
