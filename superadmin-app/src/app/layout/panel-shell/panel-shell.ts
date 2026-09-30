import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideFileText,
  LucideFolderOpen,
  LucideLogOut,
  LucideSettings,
  LucideSlidersHorizontal,
} from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { CerrarSesion } from '../../state/panel/panel.actions';
import { PanelState } from '../../state/panel/panel.state';

interface SeccionNav {
  readonly ruta: string;
  readonly etiqueta: string;
  readonly icono: 'expedientes' | 'producto' | 'formatos' | 'ajustes';
}

/**
 * The signed-in chrome: nav rail, the operator's identity, logout.
 *
 * All four of the source's tabs (`onp_fer_etapa2_pf.html:1918`), as a rail
 * rather than a tab strip — this is a desktop tool and the nav does not need
 * to fit a phone.
 *
 * Two cards inside those tabs are deliberately gone and are not coming back:
 * the Ajustes storage-mode card with its Supabase URL and anon key
 * (`:2048`), and "Borrar todos los datos" (`:6025`).
 */
@Component({
  selector: 'panel-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideFolderOpen,
    LucideSlidersHorizontal,
    LucideFileText,
    LucideSettings,
    LucideLogOut,
  ],
  templateUrl: './panel-shell.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelShell {
  readonly #store = inject(Store);
  readonly #router = inject(Router);

  protected readonly sesion = select(PanelState.sesion);

  protected readonly secciones: readonly SeccionNav[] = [
    { ruta: '/expedientes', etiqueta: 'Expedientes', icono: 'expedientes' },
    { ruta: '/producto', etiqueta: 'Producto', icono: 'producto' },
    { ruta: '/formatos', etiqueta: 'Formatos', icono: 'formatos' },
    { ruta: '/ajustes', etiqueta: 'Ajustes', icono: 'ajustes' },
  ];

  protected salir(): void {
    // Route away first: the operator asked to be signed out, and they should
    // not keep looking at a list of CURPs while a request is in flight.
    void this.#router.navigate(['/acceso']);
    this.#store.dispatch(new CerrarSesion());
  }
}
