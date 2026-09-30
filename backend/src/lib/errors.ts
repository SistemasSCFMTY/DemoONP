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
    readonly status: 400 | 401 | 403 | 404 | 429 | 500,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (m: string, cause?: unknown) => new ApiError('VALIDACION', m, 400, cause);
export const unauthorized = (m = 'No tienes acceso.') => new ApiError('NO_AUTORIZADO', m, 401);

/**
 * Hay sesión, pero no alcanza — un `analista` intentando una escritura
 * de administrador.
 *
 * Mismo `code` que el 401 a propósito: la lista de códigos del contrato
 * está congelada y no vale inventarle uno. Lo que separa los dos casos
 * es el estado HTTP, y esa distinción sí importa del lado del panel:
 * con 401 hay que volver a entrar, con 403 volver a entrar no arregla
 * nada.
 */
export const prohibido = (m = 'Esta acción no está permitida para tu cuenta.') =>
  new ApiError('NO_AUTORIZADO', m, 403);
export const notFound = (m = 'No encontramos lo que buscas.') => new ApiError('NO_ENCONTRADO', m, 404);
export const internal = (cause?: unknown) =>
  new ApiError('ERROR_INTERNO', 'Algo salió mal de nuestro lado. Inténtalo de nuevo.', 500, cause);

/**
 * El código no existe, ya se usó, o no es el de este teléfono.
 *
 * Un solo mensaje para los tres casos. Distinguirlos le diría a quien
 * prueba códigos cuáles van por buen camino.
 */
export const otpInvalido = () =>
  new ApiError('OTP_INVALIDO', 'Ese código no es correcto. Revísalo o pide uno nuevo.', 400);

export const otpExpirado = () =>
  new ApiError('OTP_EXPIRADO', 'El código venció. Pide uno nuevo.', 400);

export const demasiadasSolicitudes = (m = 'Espera un momento antes de volver a intentarlo.') =>
  new ApiError('DEMASIADAS_SOLICITUDES', m, 429);
