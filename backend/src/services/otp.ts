import type { SupabaseClient } from '@supabase/supabase-js';
import { internal, otpExpirado, otpInvalido } from '../lib/errors';
import { sha256Texto } from '../lib/hash';
import { detalleSupabase, log } from '../lib/log';

/**
 * El código de un solo uso.
 *
 * No hay proveedor de SMS: el código no se envía a ningún lado. Bajo
 * `DEMO_MODE` vuelve en la respuesta y la UI lo pinta con su etiqueta
 * «Modo demostración», como hacía la fuente
 * (onp_fer_etapa2_pf.html:2650). Lo que cambia es dónde se genera.
 *
 * Tres propiedades que no se negocian:
 *
 *  · **120 segundos**, igual que la fuente (:2640).
 *  · **Un solo uso.** Validar dos veces el mismo código falla la
 *    segunda.
 *  · **Nunca se guarda en claro.** En la tabla vive el SHA-256 de
 *    `telefono:codigo`. Si alguien lee `otp_codigos` no se lleva
 *    códigos vivos, y el teléfono en el hash impide que un código
 *    valga para otro número.
 */

export const VIGENCIA_SEGUNDOS = 120;

const hashDe = (telefono: string, codigo: string) => sha256Texto(`${telefono}:${codigo}`);

/**
 * Seis dígitos con `crypto.getRandomValues`.
 *
 * `Math.random()` —lo que usaba la fuente (:2637)— no es
 * criptográfico: su estado se puede reconstruir a partir de unas pocas
 * salidas, y esto es el segundo factor de una solicitud de crédito.
 *
 * Se descarta el residuo en vez de tomar el módulo, para que los
 * primeros valores no salgan más seguido que los últimos.
 */
export function generarCodigo(): string {
  let n: number;
  do {
    n = crypto.getRandomValues(new Uint32Array(1))[0]!;
  } while (n >= 4_294_000_000);
  return (n % 1_000_000).toString().padStart(6, '0');
}

export interface OtpEmitido {
  readonly codigo: string;
  readonly expiraEn: string;
}

export async function emitirCodigo(sb: SupabaseClient, telefono: string): Promise<OtpEmitido> {
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + VIGENCIA_SEGUNDOS * 1000);

  // Reenviar invalida el anterior. Si no, un «reenviar» dejaría dos
  // códigos vivos y el usuario no sabría cuál de los dos le sirve.
  const { error: errorPrevios } = await sb
    .from('otp_codigos')
    .update({ usado_en: ahora.toISOString() })
    .eq('telefono', telefono)
    .is('usado_en', null);

  if (errorPrevios) {
    log.warn('no se pudieron invalidar códigos previos', detalleSupabase(errorPrevios));
  }

  const codigo = generarCodigo();
  const { error } = await sb.from('otp_codigos').insert({
    telefono,
    codigo_hash: await hashDe(telefono, codigo),
    expira_en: expira.toISOString(),
  });

  if (error) {
    log.error('fallo al guardar el código', detalleSupabase(error));
    throw internal('insert otp');
  }

  // El código no se registra. Es una credencial, y el teléfono con el
  // que va es dato personal (01-conventions.md §1).
  log.info('otp emitido', { vigenciaSegundos: VIGENCIA_SEGUNDOS });

  return { codigo, expiraEn: expira.toISOString() };
}

/**
 * Consume el código. Lanza `OTP_INVALIDO` u `OTP_EXPIRADO`.
 *
 * El consumo es un `update ... where usado_en is null` que devuelve el
 * renglón: es el propio Postgres quien decide quién llegó primero. Leer
 * y después marcar dejaría una ventana en la que dos peticiones
 * simultáneas validan el mismo código, que es exactamente lo que «un
 * solo uso» tiene que impedir.
 */
export async function validarCodigo(
  sb: SupabaseClient,
  telefono: string,
  codigo: string,
): Promise<void> {
  const hash = await hashDe(telefono, codigo);

  const { data, error } = await sb
    .from('otp_codigos')
    .update({ usado_en: new Date().toISOString() })
    .eq('telefono', telefono)
    .eq('codigo_hash', hash)
    .is('usado_en', null)
    .select('expira_en')
    .maybeSingle();

  if (error) {
    log.error('fallo al validar el código', detalleSupabase(error));
    throw internal('update otp');
  }

  // No existe, no es de este teléfono, o ya se usó. Los tres salen
  // igual: decir cuál fue le diría a quien prueba códigos por dónde va.
  if (!data) throw otpInvalido();

  if (new Date(data.expira_en as string).getTime() < Date.now()) {
    // Ya quedó marcado como usado, y está bien: un código vencido no se
    // reintenta, se pide uno nuevo.
    throw otpExpirado();
  }
}
