import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideStore } from '@ngxs/store';
import { routes } from './app.routes';
import { IdentidadState } from './state/identidad/identidad.state';
import { NavegacionState } from './state/navegacion/navegacion.state';
import { SesionState } from './state/sesion/sesion.state';
import { SimuladorState } from './state/simulador/simulador.state';
import { SolicitudState } from './state/solicitud/solicitud.state';

/**
 * Application providers.
 *
 * NO storage plugin. `@ngxs/storage-plugin` is not installed and must not be:
 * the expediente holds a CURP, a phone, an income and photographs of an
 * identity document, and 01-conventions.md §7 keeps all of it in memory and
 * in the backend. The source wrote base64 INE photos into IndexedDB; that is
 * departure 2 and it does not come back.
 *
 * NO devtools plugin either — it would mirror the same PII into an extension.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      // Every step is a new screen; landing mid-page after a navigation is
      // disorienting on a 390px viewport.
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideStore([NavegacionState, SimuladorState, SesionState, SolicitudState, IdentidadState]),
  ],
};
