import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngxs/store';
import { indicePaso, pasoPorId } from '../model/constants/pasos/pasos';
import type { PasoId } from '../model/interfaces/paso';
import { NavegacionState } from '../state/navegacion/navegacion.state';
import { EntrarAPaso } from '../state/navegacion/navegacion.actions';

/**
 * Blocks jumping ahead to a step the prospect has not reached.
 *
 * The source had no such guard — every screen was a div and `switchScreen`
 * would show any of them. A URL is different: someone who reloads on
 * `/solicitud/signature` or types a path must not land past the identity
 * checks with an empty expediente.
 *
 * Reaching *backwards* is always allowed; that is how back-navigation works
 * and the store rehydrates each form.
 *
 * Attach with `canActivate: [pasoAlcanzadoGuard]` and declare the step id in
 * the route's `data.paso`.
 */
export const pasoAlcanzadoGuard: CanActivateFn = (ruta) => {
  const store = inject(Store);
  const router = inject(Router);

  const destino = ruta.data['paso'] as PasoId | undefined;
  if (!destino) return true;

  const alcanzados = store.selectSnapshot(NavegacionState.alcanzados);
  if (alcanzados.includes(destino)) {
    store.dispatch(new EntrarAPaso(destino));
    return true;
  }

  // Not reached. Send them back to the furthest point they did reach, rather
  // than to the portada — losing a half-filled form is its own kind of failure.
  const ultimo = store.selectSnapshot(NavegacionState.ultimoAlcanzado);
  const permitido = indicePaso(destino) <= indicePaso(ultimo);
  if (permitido) {
    store.dispatch(new EntrarAPaso(destino));
    return true;
  }

  return router.createUrlTree(['/' + pasoPorId(ultimo).ruta].filter(Boolean));
};
