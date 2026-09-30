import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideFileText,
  LucideFolderOpen,
  LucideLogOut,
  LucideMenu,
  LucideSettings,
  LucideSlidersHorizontal,
  LucideX,
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
 * At `lg` and up the rail is a column of the shell grid and there is no menu
 * to open — the button that opens it is `lg:hidden`, so `menuAbierto` can only
 * become true at a width where the drawer exists. That is why none of the
 * focus handling below needs to ask how wide the viewport is.
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
    LucideMenu,
    LucideX,
  ],
  templateUrl: './panel-shell.html',
  host: {
    class: 'block h-full',
    // Escape closes the drawer wherever focus happens to be inside it (§9).
    '(document:keydown.escape)': 'cerrarMenu()',
  },
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

  protected readonly menuAbierto = signal(false);

  private readonly botonMenu = viewChild<ElementRef<HTMLButtonElement>>('botonMenu');
  private readonly riel = viewChild<ElementRef<HTMLElement>>('riel');

  constructor() {
    // Opening a section must not leave the drawer sitting on top of it.
    this.#router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuAbierto.set(false));

    // Focus follows the drawer, or a keyboard is left behind the veil with
    // nothing to act on (§9). Effects run after the view updates, so by here
    // the rail is already visible and can take focus.
    //
    // The first run is skipped deliberately: an effect fires once on creation
    // with the drawer closed, and without this the panel would yank focus to
    // the hamburger on every page load before the operator has touched
    // anything.
    let arranque = true;
    effect(() => {
      const abierto = this.menuAbierto();
      if (arranque) {
        arranque = false;
        return;
      }
      untracked(() => {
        if (abierto) {
          this.riel()?.nativeElement.querySelector('a')?.focus();
        } else if (this.botonMenu()?.nativeElement.offsetParent) {
          // Only when the button is on screen: at `lg` it is display:none and
          // focusing it would silently drop focus to the body.
          this.botonMenu()?.nativeElement.focus();
        }
      });
    });
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected salir(): void {
    // Route away first: the operator asked to be signed out, and they should
    // not keep looking at a list of CURPs while a request is in flight.
    void this.#router.navigate(['/acceso']);
    this.#store.dispatch(new CerrarSesion());
  }
}
