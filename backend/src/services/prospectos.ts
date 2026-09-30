import type { SupabaseClient } from '@supabase/supabase-js';
import { internal } from '../lib/errors';
import { detalleSupabase, log } from '../lib/log';
import { hashearPassword } from '../lib/password';
import type { Prospecto } from '../schemas/prospecto';

/**
 * El registro previo a la solicitud.
 *
 * La fuente no guardaba nada en este paso: adelantaba los campos al
 * formulario y avanzaba de pantalla (onp_fer_etapa2_pf.html:2539). El
 * contrato, en cambio, pide `201 { id }`, y un id que no apunta a nada
 * sería mentir. Por eso existe la tabla `prospectos`.
 *
 * La contraseña se guarda con PBKDF2 y nunca en claro. El prospecto no
 * es un usuario de Supabase Auth — Auth guarda las contraseñas del
 * personal del panel, que es otra cosa y otro nivel de acceso.
 */
export async function registrarProspecto(
  sb: SupabaseClient,
  datos: Prospecto,
  sofomId: string | undefined,
): Promise<string> {
  const renglon: Record<string, unknown> = {
    nombres: datos.nombres,
    apellido_paterno: datos.apellidoPaterno,
    apellido_materno: datos.apellidoMaterno ?? null,
    correo: datos.correo,
    telefono: datos.telefono,
    password_hash: await hashearPassword(datos.password),
  };
  if (sofomId) renglon['sofom_id'] = sofomId;

  const { data, error } = await sb.from('prospectos').insert(renglon).select('id').single();

  if (error) {
    log.error('fallo al registrar prospecto', detalleSupabase(error));
    throw internal('insert prospectos');
  }

  // Ni el correo ni el teléfono se registran: son dato personal (§1).
  log.info('prospecto registrado', { id: data.id as string });

  return data.id as string;
}
