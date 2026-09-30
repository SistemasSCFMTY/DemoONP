/**
 * One error envelope for the whole API: { error: { code, message } }.
 *
 * `message` is Spanish and safe to show a prospect. It never carries a
 * Supabase or Postgres error verbatim — the source did that
 * (onp_fer_etapa2_pf.html:3013) and leaked RLS policy text into the UI.
 * Log the real cause; return one of these.
 */
export type ErrorCode =
  | 'VALIDACION'
  | 'NO_AUTORIZADO'
  | 'NO_ENCONTRADO'
  | 'OTP_INVALIDO'
  | 'OTP_EXPIRADO'
  | 'DEMASIADAS_SOLICITUDES'
  | 'ERROR_INTERNO';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (m: string, cause?: unknown) => new ApiError('VALIDACION', m, 400, cause);
export const unauthorized = (m = 'No tienes acceso.') => new ApiError('NO_AUTORIZADO', m, 401);
export const notFound = (m = 'No encontramos lo que buscas.') => new ApiError('NO_ENCONTRADO', m, 404);
export const internal = (cause?: unknown) =>
  new ApiError('ERROR_INTERNO', 'Algo salió mal de nuestro lado. Inténtalo de nuevo.', 500, cause);
