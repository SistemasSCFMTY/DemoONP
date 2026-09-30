import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngxs/store';
import { NavegacionService } from './core/navegacion-service';
import { BarraProgreso } from './layout/barra-progreso/barra-progreso';
import { Topbar } from './layout/topbar/topbar';
import { pasoPorId } from './model/constants/pasos/pasos';
import { NavegacionState } from './state/navegacion/navegacion.state';

/**
 * The shell: sticky topbar → progress bar → scrolling body.
 *
 * **Full-bleed containers, capped content.** Every band spans the viewport
 * and caps only what is inside it at `max-w-app` (64rem, the `lg`
 * breakpoint). The shell used to pin the whole tree to 390px, which put the
 * navy topbar in a 390px stub on anything wider than a phone — owner's call
 * to change it, 2026-09-30.
 *
 * Mobile first is unaffected: below 64rem the cap does nothing and 390
 * remains where the design is decided.
 *
 * `min-h-dvh`, not `min-h-screen`: `100vh` breaks under mobile Safari's
 * collapsing toolbar (departure 8).
 *
 * The portada carries neither bar — it is the presentation, no trámite has
 * started (`switchScreen`, onp_fer_etapa2_pf.html:4446). The informational
 * screens keep the topbar but hide the progress, because they are not steps.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Topbar, BarraProgreso],
  templateUrl: './app.html',
})
export class App {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  private readonly pasoActual = this.store.selectSignal(NavegacionState.actual);

  protected readonly titulo = computed(() => pasoPorId(this.pasoActual()).titulo);
  protected readonly progreso = computed(() => pasoPorId(this.pasoActual()).progreso);
  protected readonly puedeRegresar = this.navegacion.puedeRegresar;

  protected readonly muestraTopbar = computed(() => this.pasoActual() !== 'bienvenida');

  protected readonly muestraProgreso = computed(() => {
    const paso = pasoPorId(this.pasoActual());
    return paso.id !== 'bienvenida' && !paso.informativa;
  });

  protected regresar(): void {
    void this.navegacion.regresar();
  }
}
