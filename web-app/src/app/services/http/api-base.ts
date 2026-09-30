import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type MonoTypeOperatorFunction, type Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * The single place the API origin is read.
 *
 * Every http service extends or injects this, so pointing the app at a
 * different Worker is one line in `environments/`. No literal origin anywhere
 * else — and nothing Supabase, ever (CLAUDE.md).
 *
 * `withCredentials` is on for every call: the Worker runs on a different
 * origin from Pages and the panel session rides an httpOnly cookie. The
 * Worker's CORS allows exactly the two Pages origins, so this is safe.
 */
@Injectable({ providedIn: 'root' })
export class ApiBase {
  protected readonly http = inject(HttpClient);
  readonly base = environment.apiBaseUrl;

  url(ruta: string): string {
    return `${this.base}${ruta.startsWith('/') ? ruta : '/' + ruta}`;
  }

  get<T>(ruta: string): Observable<T> {
    return this.http.get<T>(this.url(ruta), { withCredentials: true });
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo, { withCredentials: true });
  }

  postForm<T>(ruta: string, cuerpo: FormData): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo, { withCredentials: true });
  }
}

/**
 * A stand-in for a call whose backend was not built yet.
 *
 * **Dead by default since 2026-09-30**: `permitirMocks` is false in every
 * environment, so this rethrows and the screen shows a real error. It exists
 * for a deliberate offline session, nothing else.
 *
 * The comment here used to promise that every screen taking a fallback said
 * "Modo demostración" out loud. It did not: with the Worker unreachable the
 * simulador rendered invented product parameters in silence. Do not restore
 * that claim without restoring the label to go with it (01-conventions.md
 * §11) — and note the catch below is indiscriminate, so a 401, a 500 and a
 * rate-limit all become a fallback, not just an unreachable Worker.
 */
export function conRespaldo<T>(respaldo: () => T): MonoTypeOperatorFunction<T> {
  return catchError<T, Observable<T>>((err: unknown) => {
    if (!environment.permitirMocks) return throwError(() => err);
    if (err instanceof HttpErrorResponse) {
      console.warn(`[ONP] ${err.status || 'sin red'} — se usa el respaldo local.`);
      return of(respaldo());
    }
    return throwError(() => err);
  });
}

/** The error envelope every endpoint returns (02-api-contract.md). */
export interface ErrorApi {
  readonly error: {
    readonly code: string;
    /** Spanish and safe to show a prospect. */
    readonly message: string;
  };
}

/** Pulls the Spanish message out of the envelope, or a safe generic one.
 *  Never echoes a raw transport error at the prospect. */
export function mensajeDeApi(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const cuerpo = err.error as Partial<ErrorApi> | null;
    if (cuerpo?.error?.message) return cuerpo.error.message;
    if (err.status === 0) return 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.';
  }
  return 'Algo salió mal. Inténtalo de nuevo en un momento.';
}
