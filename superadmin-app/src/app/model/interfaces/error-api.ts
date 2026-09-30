/**
 * The single error envelope every endpoint returns
 * (`02-api-contract.md`): `{ error: { code, message } }`.
 *
 * `message` is Spanish and safe to show a human — the Worker never echoes a
 * Supabase or Postgres error verbatim (§10).
 */
export type CodigoError =
  | 'VALIDACION'
  | 'NO_AUTORIZADO'
  | 'NO_ENCONTRADO'
  | 'OTP_INVALIDO'
  | 'OTP_EXPIRADO'
  | 'DEMASIADAS_SOLICITUDES'
  | 'ERROR_INTERNO';

export interface ErrorApi {
  readonly code: CodigoError;
  readonly message: string;
}

export interface SobreError {
  readonly error: ErrorApi;
}
