import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../core/navegacion-service';
import { PesosPipe } from '../../pipes/pesos-pipe';
import { PorcentajePipe } from '../../pipes/porcentaje-pipe';
import { comisionDe, pagoMensual } from '../../services/domain/amortizacion';
import { calcularCAT } from '../../services/domain/cat';
import { CargarProducto } from '../../state/simulador/simulador.actions';
import { SimuladorState } from '../../state/simulador/simulador.state';
import { OnpButton } from '../../ui/onp-button/onp-button';
import { OnpTitulo } from '../../ui/onp-titulo/onp-titulo';

/** The plazo the worked example is quoted at, as in the source (`:2224`). */
const PLAZO_EJEMPLO = 24;

/**
 * The credit catalogue. Screen 2 (onp_fer_etapa2_pf.html:305).
 *
 * Every figure on this screen is derived from the live product parameters by
 * `pintarCatalogoProductos` (`:2220`) and stays derived here. 01-conventions
 * §11: no invented numbers in anything financial. The worked example — "half
 * the maximum at 24 months costs X a month, CAT Y" — is computed by the same
 * functions the simulator uses, which is why a credit person can check one
 * against the other and find them consistent.
 */
@Component({
  selector: 'onp-catalogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpButton, PesosPipe, PorcentajePipe],
  templateUrl: './catalogo.html',
})
export class Catalogo {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly plazoEjemplo = PLAZO_EJEMPLO;
  protected readonly producto = this.store.selectSignal(SimuladorState.producto);

  protected readonly montoEjemplo = computed(() => this.producto().monto_max / 2);

  protected readonly pagoEjemplo = computed(() =>
    pagoMensual(this.montoEjemplo(), this.producto().tasa_anual, PLAZO_EJEMPLO),
  );

  protected readonly catEjemplo = computed(() => {
    const monto = this.montoEjemplo();
    const comision = comisionDe(monto, this.producto());
    return calcularCAT(monto - comision, this.pagoEjemplo(), PLAZO_EJEMPLO);
  });

  constructor() {
    this.store.dispatch(new CargarProducto());
  }

  protected solicitar(): void {
    void this.navegacion.avanzar('es-cliente', 'catalogo');
  }

  protected volver(): void {
    void this.navegacion.regresar();
  }
}
