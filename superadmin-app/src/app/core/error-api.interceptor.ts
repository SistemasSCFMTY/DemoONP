import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { CodigoError, ErrorApi, SobreError } from '../model/interfaces/error-api';

const CODIGOS: readonly CodigoError[] = [
  'VALIDACION',
  'NO_AUTORIZADO',
  'NO_ENCONTRADO',
  'OTP_INVALIDO',
  'OTP_EXPIRADO',
  'DEMASIADAS_SOLICITUDES',
  'ERROR_INTERNO',
];

function esSobreError(cuerpo: unknown): cuerpo is SobreError {
  if (typeof cuerpo !== 'object' || cuerpo === null || !('error' in cuerpo)) return false;
  const e = (cuerpo as SobreError).error;
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof e.message === 'string' &&
    CODIGOS.includes(e.code)
  );
}

/**
 * Normalises every failure into the contract's `ErrorApi`, so a component
 * always has a Spanish sentence it can show a human and never has to reason
 * about `HttpErrorResponse`.
 *
 * Both `PanelApi` implementations therefore fail the same way, which is what
 * makes the mock a real stand-in rather than a happy-path prop.
 *
 * **It logs a status and a URL and nothing else.** These responses carry CURP,
 * RFC, address and income; §1 and §10 forbid a request or response body
 * reaching a log, and a browser console on a demo machine is a log with an
 * audience.
 */
export const errorApiInterceptor: HttpInterceptorFn = (peticion, siguiente) =>
  siguiente(peticion).pipe(
    catchError((fallo: unknown) => {
      if (!(fallo instanceof HttpErrorResponse)) return throwError(() => fallo);

      if (esSobreError(fallo.error)) {
        return throwError((): ErrorApi => fallo.error.error);
      }

      // The Worker is down, CORS rejected us, or something upstream answered
      // with a shape that is not the contract's.
      console.warn(`[panel] ${peticion.method} ${peticion.url} respondió ${fallo.status}`);

      const message =
        fallo.status === 0
          ? 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
          : fallo.status === 401
            ? 'Tu sesión terminó. Vuelve a entrar.'
            : fallo.status === 403
              ? // Writes to /sofom and /plantillas need `rol === 'administrador'`.
                // The panel cannot know the role: `GET /admin/me` does not return
                // it, and adding it would be contract drift — so the attempt is
                // made and the refusal is shown. That is the right shape anyway:
                // authorization is the Worker's, and a UI that hides a button is
                // a convenience, never the boundary (§12).
                'Tu cuenta no tiene permiso para hacer este cambio. Pide a un administrador que lo haga.'
              : 'Ocurrió un error inesperado. Inténtalo de nuevo en un momento.';

      const code: CodigoError =
        fallo.status === 401 || fallo.status === 403 ? 'NO_AUTORIZADO' : 'ERROR_INTERNO';
      return throwError((): ErrorApi => ({ code, message }));
    }),
  );
