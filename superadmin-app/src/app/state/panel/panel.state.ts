import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, of, switchMap, tap, throwError } from 'rxjs';

import { ErrorApi } from '../../model/interfaces/error-api';
import { SesionPanel } from '../../model/interfaces/sesion-panel';
import { PanelApi } from '../../services/http/panel-api';
import {
  CerrarSesion,
  IniciarSesion,
  LimpiarErrorSesion,
  RestaurarSesion,
} from './panel.actions';

export interface ModeloPanel {
  readonly sesion: SesionPanel | null;
  /** True while a login or a session restore is in flight. */
  readonly cargando: boolean;
  /** The Spanish message from the last failed login, shown under the field. */
  readonly error: string | null;
  /** False until the first `RestaurarSesion` settles, so the guard waits once. */
  readonly resuelta: boolean;
}

/**
 * Who is signed in.
 *
 * It holds a name and an email and nothing else — the session itself is an
 * httpOnly cookie the browser cannot read, which is the point of it being
 * httpOnly. There is no storage plugin in this application (§7: never persist
 * PII), so none of this survives a reload; `RestaurarSesion` asks the Worker
 * instead.
 */
@State<ModeloPanel>({
  name: 'panel',
  defaults: {
    sesion: null,
    cargando: false,
    error: null,
    resuelta: false,
  },
})
@Injectable()
export class PanelState {
  readonly #api = inject(PanelApi);

  @Selector()
  static sesion(estado: ModeloPanel): SesionPanel | null {
    return estado.sesion;
  }

  @Selector()
  static autenticado(estado: ModeloPanel): boolean {
    return estado.sesion !== null;
  }

  @Selector()
  static cargando(estado: ModeloPanel): boolean {
    return estado.cargando;
  }

  @Selector()
  static error(estado: ModeloPanel): string | null {
    return estado.error;
  }

  @Selector()
  static resuelta(estado: ModeloPanel): boolean {
    return estado.resuelta;
  }

  @Action(IniciarSesion)
  iniciarSesion(ctx: StateContext<ModeloPanel>, { credenciales }: IniciarSesion) {
    ctx.patchState({ cargando: true, error: null });

    return this.#api.iniciarSesion(credenciales).pipe(
      // `POST /admin/login` answers with the name and a `Set-Cookie`, nothing
      // else — verified against the running Worker. `GET /admin/me` is what
      // returns the profile, so the session is built from one place whether
      // it came from a login or from a reload. It also proves the cookie was
      // accepted before the operator is let in: if the browser dropped it,
      // this second call 401s here rather than on the first table load.
      switchMap(() =>
        this.#api.sesionActual().pipe(
          catchError(() =>
            // Login was accepted and this still failed, so the credentials
            // were right and the cookie did not stick. The generic "tu sesión
            // terminó" would send someone to re-type a password that was
            // never the problem. The session cookie is `Secure; SameSite=None`
            // and the panel is on a different origin from the Worker, so this
            // is what blocked third-party cookies looks like.
            throwError(
              (): ErrorApi => ({
                code: 'NO_AUTORIZADO',
                message:
                  'Tu correo y contraseña son correctos, pero el navegador no conservó la sesión. Revisa que no estés bloqueando las cookies de este sitio e inténtalo de nuevo.',
              }),
            ),
          ),
        ),
      ),
      tap((sesion) => ctx.patchState({ sesion, cargando: false, resuelta: true })),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ sesion: null, cargando: false, resuelta: true, error: fallo.message });
        // Swallowed on purpose: the message is in the state and the form
        // renders it. Rethrowing would only reach the global error handler.
        return of(null);
      }),
    );
  }

  @Action(RestaurarSesion)
  restaurarSesion(ctx: StateContext<ModeloPanel>) {
    ctx.patchState({ cargando: true });

    return this.#api.sesionActual().pipe(
      tap((sesion) => ctx.patchState({ sesion, cargando: false, resuelta: true })),
      catchError(() => {
        // A 401 here is the normal cold-load answer, not a failure worth
        // showing: there is simply no session yet and the guard will route to
        // the login screen.
        ctx.patchState({ sesion: null, cargando: false, resuelta: true });
        return of(null);
      }),
    );
  }

  @Action(CerrarSesion)
  cerrarSesion(ctx: StateContext<ModeloPanel>) {
    return this.#api.cerrarSesion().pipe(
      tap(() => ctx.patchState({ sesion: null, error: null, resuelta: true })),
      catchError(() => {
        // Drop the local session regardless: an operator who pressed "Cerrar
        // sesión" on a shared machine must not stay signed in because a
        // network call failed. Swallowed rather than rethrown for the same
        // reason — there is no useful thing to tell them, and the cookie is
        // the Worker's to invalidate.
        ctx.patchState({ sesion: null, error: null, resuelta: true });
        return of(null);
      }),
    );
  }

  @Action(LimpiarErrorSesion)
  limpiarError(ctx: StateContext<ModeloPanel>) {
    if (ctx.getState().error !== null) ctx.patchState({ error: null });
  }
}
