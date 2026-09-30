import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { PesosPipe } from '../../../pipes/pesos-pipe';
import { PorcentajePipe } from '../../../pipes/porcentaje-pipe';
import { AceptarSimulacion, CargarProducto, Simular } from '../../../state/simulador/simulador.actions';
import { SimuladorState } from '../../../state/simulador/simulador.state';
import { SesionState } from '../../../state/sesion/sesion.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/** The plazo shortcuts the source offers (`prepararSimulador`, :2469). */
const ATAJOS_PLAZO = [12, 24, 36, 48, 60];

/**
 * The simulator. Screen 7 (onp_fer_etapa2_pf.html:542).
 *
 * **This is the screen a credit person will test.** Every figure it shows —
 * pago mensual, comisión, total, CAT — is computed by `SimuladorState` from
 * the product parameters through `pagoMensual`, `comisionDe` and
 * `calcularCAT`, all of them unit-tested (`services/domain/*.spec.ts`). No
 * number on this screen is written by hand, and none is rounded before the
 * arithmetic is done.
 *
 * The disclaimer under the figures stays verbatim, and it stays true: an
 * estimate, not an offer.
 */
@Component({
  selector: 'onp-simulador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpButton, PesosPipe, PorcentajePipe],
  templateUrl: './simulador.html',
  styles: `
    /* The range input has no Tailwind surface: its thumb and track are
       pseudo-elements. Kept here rather than in styles.css because only this
       screen has a slider. 26px thumb, as the source (:183) — comfortably
       over the 44px tap target once the touch slop is counted. */
    .onp-rango {
      appearance: none;
      width: 100%;
      height: 5px;
      border-radius: 3px;
      background: var(--color-border);
      outline: none;
      margin: 0;
    }

    .onp-rango::-webkit-slider-thumb {
      appearance: none;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--color-navy);
      border: 3px solid #fff;
      box-shadow: var(--shadow-e2);
      cursor: pointer;
    }

    .onp-rango::-moz-range-thumb {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--color-navy);
      border: 3px solid #fff;
      box-shadow: var(--shadow-e2);
      cursor: pointer;
    }

    .onp-rango:focus-visible {
      outline: 2px solid var(--color-navy);
      outline-offset: 4px;
    }
  `,
})
export class Simulador {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly sim = this.store.selectSignal(SimuladorState.estado);
  protected readonly producto = this.store.selectSignal(SimuladorState.producto);
  private readonly esCliente = this.store.selectSignal(SesionState.esCliente);

  /** The shortcuts the current product actually allows — the source filters
   *  the same way (`:2472`) so a 72-month-max product never offers 60 twice. */
  protected readonly atajos = computed(() => {
    const p = this.producto();
    const dentro = ATAJOS_PLAZO.filter((m) => m >= p.plazo_min && m <= p.plazo_max);
    const conTopes = new Set([p.plazo_min, ...dentro, p.plazo_max]);
    return [...conTopes].sort((a, b) => a - b);
  });

  constructor() {
    this.store.dispatch(new CargarProducto());
  }

  protected claseAtajo(plazo: number): string {
    const base =
      'min-h-11 min-w-11 cursor-pointer rounded-control border px-3 text-label font-semibold tabular-nums transition-colors';
    return plazo === this.sim().plazo
      ? `${base} border-navy bg-navy text-white`
      : `${base} border-border bg-surface text-navy hover:border-navy`;
  }

  protected cambiarMonto(evento: Event): void {
    const monto = Number.parseInt((evento.target as HTMLInputElement).value, 10);
    this.store.dispatch(new Simular(monto, this.sim().plazo));
  }

  protected cambiarPlazo(evento: Event): void {
    const plazo = Number.parseInt((evento.target as HTMLInputElement).value, 10);
    this.store.dispatch(new Simular(this.sim().monto, plazo));
  }

  protected fijarPlazo(plazo: number): void {
    this.store.dispatch(new Simular(this.sim().monto, plazo));
  }

  /**
   * An existing client is already identified under Art. 7 fracc. IV, so they
   * skip registration and go straight to the identity stage (`:2491`).
   */
  protected aceptar(): void {
    this.store.dispatch(new AceptarSimulacion());
    const destino = this.esCliente() ? 'auth-location' : 'requisitos';
    void this.navegacion.avanzar(destino, 'simulador');
  }
}
