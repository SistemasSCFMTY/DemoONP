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
  template: `
    <onp-titulo texto="¿Cuánto necesitas?" lede="Mueve las barras y mira cómo cambia tu pago mensual." />

    <section class="mb-4 rounded-card border border-border bg-surface p-4">
      <div class="mb-2 flex items-baseline justify-between">
        <label for="sim-monto" class="text-label font-semibold text-text">Monto</label>
        <output for="sim-monto" class="font-heading text-lg font-bold tabular-nums text-navy-deep">
          {{ sim().monto | pesos }}
        </output>
      </div>
      <input
        id="sim-monto"
        type="range"
        class="onp-rango"
        [min]="producto().monto_min"
        [max]="producto().monto_max"
        [step]="producto().monto_paso"
        [value]="sim().monto"
        (input)="cambiarMonto($event)"
      />
      <div class="mt-1.5 flex justify-between text-status text-text-soft">
        <span>{{ producto().monto_min | pesos }}</span>
        <span>{{ producto().monto_max | pesos }}</span>
      </div>
    </section>

    <section class="mb-4 rounded-card border border-border bg-surface p-4">
      <div class="mb-2 flex items-baseline justify-between">
        <label for="sim-plazo" class="text-label font-semibold text-text">Plazo</label>
        <output for="sim-plazo" class="font-heading text-lg font-bold tabular-nums text-navy-deep">
          {{ sim().plazo }} <span class="text-label font-normal">meses</span>
        </output>
      </div>
      <input
        id="sim-plazo"
        type="range"
        class="onp-rango"
        [min]="producto().plazo_min"
        [max]="producto().plazo_max"
        [step]="producto().plazo_paso"
        [value]="sim().plazo"
        (input)="cambiarPlazo($event)"
      />
      <div class="mt-1.5 flex justify-between text-status text-text-soft">
        <span>{{ producto().plazo_min }} meses</span>
        <span>{{ producto().plazo_max }} meses</span>
      </div>

      <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Plazos frecuentes">
        @for (plazo of atajos(); track plazo) {
          <button
            type="button"
            [class]="claseAtajo(plazo)"
            [attr.aria-pressed]="plazo === sim().plazo"
            (click)="fijarPlazo(plazo)"
          >
            {{ plazo }}
          </button>
        }
      </div>
    </section>

    <section class="mb-4 rounded-card bg-navy p-4 text-white">
      <p class="text-label text-white/70">Pago mensual estimado</p>
      <p class="mt-1 font-heading text-3xl font-bold tabular-nums">
        {{ sim().pagoMensual | pesos }}<span class="text-label font-normal text-white/70"> / mes</span>
      </p>

      <dl class="mt-4 space-y-1.5 text-label">
        <div class="flex justify-between gap-3">
          <dt class="text-white/70">Monto solicitado</dt>
          <dd class="tabular-nums">{{ sim().monto | pesos }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-white/70">Plazo</dt>
          <dd class="tabular-nums">{{ sim().plazo }} meses</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-white/70">Tasa anual fija</dt>
          <dd class="tabular-nums">{{ producto().tasa_anual }}%</dd>
        </div>
        @if (sim().comision > 0) {
          <div class="flex justify-between gap-3">
            <dt class="text-white/70">Comisión de apertura</dt>
            <dd class="tabular-nums">{{ sim().comision | pesos }}</dd>
          </div>
        }
        <div class="flex justify-between gap-3">
          <dt class="text-white/70">Total a pagar</dt>
          <dd class="tabular-nums">{{ sim().total | pesos }}</dd>
        </div>
        <div class="mt-1.5 flex justify-between gap-3 border-t border-white/20 pt-2">
          <dt class="text-white/70">CAT estimado <span class="text-white/50">sin IVA</span></dt>
          <dd class="tabular-nums">{{ sim().cat | porcentaje }}</dd>
        </div>
      </dl>
    </section>

    <p class="mb-2 text-status leading-relaxed text-text-soft">
      <strong>Esto es una estimación, no una oferta.</strong> Las condiciones definitivas dependen
      del resultado de la evaluación de tu solicitud y pueden diferir de las aquí mostradas. El CAT
      es informativo y se calcula para fines de comparación.
    </p>

    <onp-button (pulsar)="aceptar()">Continuar con esta cantidad</onp-button>
  `,
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
