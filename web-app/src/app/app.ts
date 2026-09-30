import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngxs/store';
import { NavegacionService } from './core/navegacion-service';
import { BarraProgreso } from './layout/barra-progreso/barra-progreso';
import { Topbar } from './layout/topbar/topbar';
import { pasoPorId } from './model/constants/pasos/pasos';
import { NavegacionState } from './state/navegacion/navegacion.state';

/**
 * The 390px shell: sticky topbar → progress bar → scrolling body.
 *
 * The portada carries neither bar — it is the presentation, no trámite has
 * started (`switchScreen`, onp_fer_etapa2_pf.html:4446). The informational
 * screens keep the topbar but hide the progress, because they are not steps.
 *
 * `.app-shell` and its `100dvh` live in `styles.css` (01-conventions.md §5).
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Topbar, BarraProgreso],
  template: `
    <div class="app-shell bg-bg">
      @if (muestraTopbar()) {
        <onp-topbar
          [titulo]="titulo()"
          [puedeRegresar]="puedeRegresar()"
          (regresar)="regresar()"
        />
      }
      @if (muestraProgreso()) {
        <onp-barra-progreso [porcentaje]="progreso()" />
      }
      <main class="flex-1 px-5 pt-6 pb-10">
        <router-outlet />
      </main>
    </div>
  `,
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
