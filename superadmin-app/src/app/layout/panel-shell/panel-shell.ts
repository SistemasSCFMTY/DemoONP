import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideFolderOpen, LucideLogOut, LucideSlidersHorizontal } from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { CerrarSesion } from '../../state/panel/panel.actions';
import { PanelState } from '../../state/panel/panel.state';

interface SeccionNav {
  readonly ruta: string;
  readonly etiqueta: string;
  readonly icono: 'expedientes' | 'producto';
}

/**
 * The signed-in chrome: nav rail, the operator's identity, logout.
 *
 * The source's four tabs (`onp_fer_etapa2_pf.html:1918`) are down to two.
 * *Formatos* and *Ajustes* are CP-S6 and expected to be cut: branding lives in
 * `brand.config.ts` now, and the Ajustes tab's connection-string fields went
 * with the Worker taking ownership of the credentials.
 */
@Component({
  selector: 'panel-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideFolderOpen,
    LucideSlidersHorizontal,
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
  ];

  protected salir(): void {
    // Route away first: the operator asked to be signed out, and they should
    // not keep looking at a list of CURPs while a request is in flight.
    void this.#router.navigate(['/acceso']);
    this.#store.dispatch(new CerrarSesion());
  }
}
