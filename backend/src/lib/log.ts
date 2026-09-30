import type { Context } from 'hono';

/**
 * Registro estructurado.
 *
 * **Nunca se registra un cuerpo de petición.** Cada campo que pasa por
 * esta API es dato personal regulado — CURP, RFC, INE, domicilio,
 * ingresos, geolocalización, firma (01-conventions.md §1). Se registra
 * el id de petición, la ruta, el estado y la duración; nada más.
 *
 * Los errores de Supabase se registran **aquí** y nunca se devuelven al
 * cliente: la fuente los pintaba en la UI y filtraba el texto de las
 * políticas RLS (onp_fer_etapa2_pf.html:3013).
 */
type Campos = Record<string, string | number | boolean | null | undefined>;

function emitir(nivel: 'info' | 'warn' | 'error', mensaje: string, campos: Campos): void {
  const linea = JSON.stringify({ nivel, mensaje, ...campos });
  if (nivel === 'error') console.error(linea);
  else if (nivel === 'warn') console.warn(linea);
  else console.log(linea);
}

export const log = {
  info: (mensaje: string, campos: Campos = {}) => emitir('info', mensaje, campos),
  warn: (mensaje: string, campos: Campos = {}) => emitir('warn', mensaje, campos),
  error: (mensaje: string, campos: Campos = {}) => emitir('error', mensaje, campos),
};

/**
 * El detalle de un error de Supabase, aplanado para el log del
 * servidor. Lo que devuelve esta función **no sale nunca al cliente**.
 */
export function detalleSupabase(error: unknown): Campos {
  if (!error || typeof error !== 'object') return { causa: String(error ?? '') };
  const e = error as { message?: string; code?: string; details?: string; hint?: string };
  return {
    causa: e.message ?? String(error),
    codigoPg: e.code ?? null,
    detalles: e.details ?? null,
    pista: e.hint ?? null,
  };
}

/** El id de petición que pone el middleware `requestId()` de Hono. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const idDe = (c: Context<any>): string => (c.get('requestId') as string) ?? 'sin-id';
