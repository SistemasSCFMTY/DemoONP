import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { ElegirSiEsCliente } from '../../../state/sesion/sesion.actions';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * ¿Ya eres cliente? Screen 6 (onp_fer_etapa2_pf.html:522).
 *
 * Art. 7 fracc. II — the branch that decides the whole first stage: an
 * existing client verifies and skips identification; a new prospect goes to
 * the simulator and then registers (`elegirCliente`, `:2505`).
 *
 * The source makes each option a `<div onclick>`, which is not reachable by
 * keyboard and is not announced as a control. They are `<button>`s here.
 */
@Component({
  selector: 'onp-es-cliente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo],
  template: `
    <onp-titulo
      texto="Antes de empezar"
      lede="Necesitamos saber si ya tienes una relación contractual con nosotros."
    />

    <button type="button" class="mb-3 w-full text-left" (click)="elegir(false)">
      <span
        class="block rounded-card border border-border bg-surface p-4 transition-colors hover:border-navy"
      >
        <span class="block font-heading text-h3 font-bold text-navy-deep">
          No, es mi primera vez
        </span>
        <span class="mt-1 block text-label leading-relaxed text-text-soft">
          Nunca he contratado un crédito con esta institución.
        </span>
      </span>
    </button>

    <button type="button" class="mb-3 w-full text-left" (click)="elegir(true)">
      <span
        class="block rounded-card border border-border bg-surface p-4 transition-colors hover:border-navy"
      >
        <span class="block font-heading text-h3 font-bold text-navy-deep">Sí, ya soy cliente</span>
        <span class="mt-1 block text-label leading-relaxed text-text-soft">
          Ya tengo o he tenido un crédito contratado con esta institución.
        </span>
      </span>
    </button>

    <p class="mt-3.5 text-status leading-relaxed text-text-soft">
      Esta declaración es requerida por las Disposiciones de Carácter General aplicables. Con
      independencia de tu respuesta, se completará tu expediente conforme al producto que
      contrates.
    </p>
  `,
})
export class EsCliente {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected elegir(esCliente: boolean): void {
    this.store.dispatch(new ElegirSiEsCliente(esCliente));
    void this.navegacion.avanzar(esCliente ? 'verificar-cliente' : 'simulador', 'es-cliente');
  }
}
