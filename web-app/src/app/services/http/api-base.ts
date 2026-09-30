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
 * The backend is built in parallel and may not exist yet.
 *
 * Every call that has a sensible stand-in falls back to it rather than
 * dead-ending the prospect mid-wizard. The fallback is only taken when
 * `permitirMocks` is on, and every screen that takes one says
 * "Modo demostración" out loud — a simulation that does not admit it is a lie,
 * not a fallback (01-conventions.md §11).
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
