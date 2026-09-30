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
  templateUrl: './es-cliente.html',
})
export class EsCliente {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected elegir(esCliente: boolean): void {
    this.store.dispatch(new ElegirSiEsCliente(esCliente));
    void this.navegacion.avanzar(esCliente ? 'verificar-cliente' : 'simulador', 'es-cliente');
  }
}
