import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideStore } from '@ngxs/store';
import { routes } from './app.routes';
import { crearGrabacion } from './services/domain/grabacion-real';
import { Grabacion } from './services/domain/videograbacion';
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
    /**
     * The videograbación recorder, chosen once at bootstrap.
     *
     * `crearGrabacion` reads the `grabarVideo` kill switch and then this
     * browser's capabilities, and returns `GrabacionSimulada` for any answer
     * short of "yes, and with a codec I can name". Wiring it here rather
     * than with `providedIn: 'root'` keeps `grabacion-real.ts` free to
     * import the abstract class without a module cycle, and puts the one
     * decision a stakeholder may ask about where the app is wired up.
     */
    { provide: Grabacion, useFactory: crearGrabacion },
  ],
};
