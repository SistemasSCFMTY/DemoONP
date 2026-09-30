import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { provideStore } from '@ngxs/store';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { errorApiInterceptor } from './core/error-api.interceptor';
import { PanelApi } from './services/http/panel-api';
import { PanelApiHttp } from './services/http/panel-api-http.service';
import { PanelApiSimulada } from './services/http/panel-api-simulada.service';
import { ExpedientesState } from './state/expedientes/expedientes.state';
import { PanelState } from './state/panel/panel.state';
import { ProductoState } from './state/producto/producto.state';
import { SofomState } from './state/sofom/sofom.state';
import { ONP_PRESET } from './theme/onp-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([errorApiInterceptor])),

    providePrimeNG({
      theme: {
        preset: ONP_PRESET,
        options: {
          // §3: light mode only. `false` stops Aura from ever applying its
          // dark block — an untested dark palette drifts, and the source has
          // no dark mode to port.
          darkModeSelector: false,
          // Must stay in step with the `@layer` statement at the top of
          // src/styles.css: `primeng` sits below Tailwind's `components` and
          // `utilities`, so a utility class wins without `!important`.
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, components, utilities',
          },
        },
      },
      // The panel is Spanish end to end; PrimeNG's own strings are not.
      translation: {
        emptyMessage: 'No hay resultados',
        emptyFilterMessage: 'No hay resultados',
        clear: 'Limpiar',
        apply: 'Aplicar',
        choose: 'Elegir',
        upload: 'Subir',
        cancel: 'Cancelar',
        accept: 'Aceptar',
        reject: 'Rechazar',
      },
    }),

    provideStore([PanelState, ExpedientesState, ProductoState, SofomState]),

    // The seam between the mock and the Worker. `PanelApiSimulada` exists
    // because the backend track (CP-B4, CP-B7) is being built in parallel;
    // flipping `usarApiSimulada` in the environment file is the whole switch.
    //
    // NOTE (§7): there is deliberately no `@ngxs/storage-plugin` here. An
    // expediente must never reach localStorage or IndexedDB, and the short-lived
    // signed URLs in `ExpedientesState` must never be written anywhere at all.
    {
      provide: PanelApi,
      useClass: environment.usarApiSimulada ? PanelApiSimulada : PanelApiHttp,
    },
  ],
};
