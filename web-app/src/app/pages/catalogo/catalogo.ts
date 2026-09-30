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
  template: `
    <onp-titulo texto="Nuestros créditos" lede="Estas son las opciones disponibles actualmente." />

    <article class="mb-3.5 overflow-hidden rounded-card border border-border bg-surface">
      <header class="bg-navy px-4 py-4">
        <h2 class="font-heading text-lg font-bold text-white">{{ producto().nombre }}</h2>
        <p class="mt-1 text-status leading-relaxed text-white/80">
          Monto fijo, pagos mensuales iguales y plazo definido desde el inicio.
        </p>
      </header>

      <div class="p-4">
        <h3 class="mb-2 font-heading text-h3 font-bold text-navy-deep">Características</h3>
        <ul class="mb-4 list-disc space-y-1 pl-5 text-label leading-relaxed text-text-soft">
          <li>
            Monto desde <b class="text-text">{{ producto().monto_min | pesos }}</b> hasta
            <b class="text-text">{{ producto().monto_max | pesos }}</b>
          </li>
          <li>
            Plazo de
            <b class="text-text">{{ producto().plazo_min }} a {{ producto().plazo_max }} meses</b>
          </li>
          <li>Pagos mensuales fijos durante todo el plazo</li>
          <li>Sin garantía ni aval</li>
          <li>Depósito directo a tu cuenta bancaria</li>
          <li>Contratación totalmente en línea</li>
        </ul>

        <h3 class="mb-2 font-heading text-h3 font-bold text-navy-deep">Requisitos</h3>
        <ul class="mb-4 list-disc space-y-1 pl-5 text-label leading-relaxed text-text-soft">
          <li>Ser persona física de nacionalidad mexicana</li>
          <li>Mayor de edad</li>
          <li>
            Identificación oficial vigente: credencial para votar, pasaporte mexicano o matrícula
            consular
          </li>
          <li>CURP</li>
          <li>Comprobante de domicilio no mayor a tres meses</li>
          <li>Cuenta bancaria a tu nombre para recibir el depósito</li>
          <li>Autorizar la consulta a sociedades de información crediticia</li>
        </ul>

        <h3 class="mb-2 font-heading text-h3 font-bold text-navy-deep">Costos</h3>
        <ul class="list-disc space-y-1 pl-5 text-label leading-relaxed text-text-soft">
          <li>
            Tasa de interés anual fija: <b class="text-text">{{ producto().tasa_anual }}%</b>
          </li>
          @if (producto().comision_apertura) {
            <li>
              Comisión de apertura: <b class="text-text">{{ producto().comision_pct }}%</b> sobre el
              monto otorgado@if (producto().comision_desde > 0) {,
                aplicable a partir de {{ producto().comision_desde | pesos }}}
            </li>
          } @else {
            <li>Sin comisión de apertura</li>
          }
          <li>Sin comisión por pago anticipado</li>
          <li>
            Ejemplo: {{ montoEjemplo() | pesos }} a {{ plazoEjemplo }} meses equivale a
            {{ pagoEjemplo() | pesos }} mensuales, con un
            <b class="text-text">CAT de {{ catEjemplo() | porcentaje }}</b> sin IVA
          </li>
        </ul>
      </div>
    </article>

    <p class="mb-2 text-status leading-relaxed text-text-soft">
      Las condiciones aquí mostradas son informativas y están sujetas al resultado de la evaluación
      de cada solicitud. El CAT se calcula para fines informativos y de comparación.
    </p>

    <onp-button (pulsar)="solicitar()">Solicitar este crédito</onp-button>
    <onp-button variante="secondary" (pulsar)="volver()">Volver</onp-button>
  `,
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
