import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { map, of } from 'rxjs';

import { RestaurarSesion } from '../state/panel/panel.actions';
import { PanelState } from '../state/panel/panel.state';

/**
 * Sends an operator without a session to the login screen.
 *
 * **This is a convenience, not a security boundary** (§12). Authorization is
 * the Worker's job and only the Worker's: every panel route requires the
 * session cookie and answers `401 NO_AUTORIZADO` without it. Nothing in this
 * app may be written on the assumption that not rendering a control prevents
 * the call behind it.
 *
 * On a cold load the session is an httpOnly cookie the app cannot read, so the
 * first activation dispatches `RestaurarSesion` and waits for the answer. A
 * guard needs a synchronous verdict, which is the one place `selectSnapshot`
 * is right — §7 bars a *component* from reading the store that way.
 */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const store = inject(Store);
  const router = inject(Router);

  const alLogin = () =>
    router.createUrlTree(['/acceso'], {
      // Where they were headed, so login can put them back there. A route
      // path only — never a field value (§12).
      queryParams: estado.url === '/expedientes' ? {} : { destino: estado.url },
    });

  if (store.selectSnapshot(PanelState.autenticado)) return of(true);
  if (store.selectSnapshot(PanelState.resuelta)) return of(alLogin());

  return store
    .dispatch(new RestaurarSesion())
    .pipe(map(() => (store.selectSnapshot(PanelState.autenticado) ? true : alLogin())));
};
