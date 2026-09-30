import type { Context } from 'hono';
import type { z } from 'zod';
import { badRequest, internal } from './errors';
import { log } from './log';

/**
 * Zod en la entrada y en la salida. Los esquemas de `src/schemas/` son
 * el contrato (01-conventions.md §10), y un contrato que solo se valida
 * de un lado es documentación.
 */

/**
 * Valida un cuerpo ya parseado contra su esquema.
 *
 * El mensaje de error nombra el campo, nunca su valor: el valor es dato
 * personal y no tiene por qué aparecer en una respuesta, un log ni una
 * URL.
 */
export function validar<T extends z.ZodType>(esquema: T, valor: unknown): z.output<T> {
  const r = esquema.safeParse(valor);
  if (r.success) return r.data;

  const primero = r.error.issues[0];
  const campo = primero?.path.join('.') ?? '';
  throw badRequest(
    campo
      ? `Revisa el campo «${campo}»: el dato no tiene el formato esperado.`
      : 'Los datos enviados no tienen el formato esperado.',
    r.error.issues.map((i) => `${i.path.join('.')}: ${i.code}`).join('; '),
  );
}

/** Lee y valida un cuerpo JSON. */
export async function cuerpoJson<T extends z.ZodType>(
  c: Context,
  esquema: T,
): Promise<z.output<T>> {
  let crudo: unknown;
  try {
    crudo = await c.req.json();
  } catch {
    throw badRequest('El cuerpo de la petición no es JSON válido.');
  }
  return validar(esquema, crudo);
}

/**
 * Responde validando contra el esquema de salida.
 *
 * Si la respuesta no cumple su propio contrato es un defecto nuestro, no
 * del cliente: se registra y sale un 500 genérico. Mejor eso que mandarle
 * al panel una forma que no espera.
 */
export function responder<T extends z.ZodType>(
  c: Context,
  esquema: T,
  datos: unknown,
  status: 200 | 201 = 200,
): Response {
  const r = esquema.safeParse(datos);
  if (!r.success) {
    log.error('respuesta fuera de contrato', {
      ruta: c.req.path,
      campos: r.error.issues.map((i) => i.path.join('.')).join(','),
    });
    throw internal('respuesta fuera de contrato');
  }
  return c.json(r.data as object, status);
}
