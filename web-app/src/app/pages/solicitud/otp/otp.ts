import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { destinoDeReanudacion } from '../../../services/domain/reanudacion';
import { EnviarOtp, ValidarOtp } from '../../../state/sesion/sesion.actions';
import { SesionState } from '../../../state/sesion/sesion.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpOtpInput } from '../../../ui/onp-otp-input/onp-otp-input';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/** Resend unlocks 30 seconds in, i.e. with 90 s left (`:2692`). */
const MS_PARA_REENVIAR = 90_000;

/**
 * Código de verificación. Screen 11 (onp_fer_etapa2_pf.html:686).
 *
 * The factor of category 3 required by Art. 7 fracc. IV: single use,
 * two-minute life, unknown before it is generated.
 *
 * **The code is generated and burned server-side** (CP-B5). The source minted
 * it in the browser (`:2632`) and compared it there, which is the one thing an
 * OTP must never be — a factor is worthless if the device proving possession
 * also mints the proof. Departure 3.
 *
 * The code still appears on screen, under "Modo demostración", because the
 * Worker echoes it when `DEMO_MODE=true`. That label is deliberate and it is
 * honest; say so out loud before someone asks.
 */
@Component({
  selector: 'onp-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpOtpInput, OnpButton, OnpStatus],
  template: `
    <onp-titulo texto="Código de verificación" [lede]="destino()" />

    @if (codigoDemo()) {
      <p
        class="mb-3.5 rounded-control border border-dashed border-gold-light bg-surface-warning px-3 py-2.5 text-status leading-relaxed text-warning"
      >
        <strong>Modo demostración:</strong> tu código es
        <b class="font-mono text-base tracking-widest">{{ codigoDemo() }}</b>
        <br />En producción llega por mensaje y nunca se muestra en pantalla.
      </p>
    }

    <onp-otp-input (codigo)="capturar($event)" />

    <p class="mb-3.5 text-center text-label text-text-soft" aria-live="polite">
      @if (vencido()) {
        El código <b class="text-error">venció</b>
      } @else {
        Vence en <b class="tabular-nums text-navy-deep">{{ reloj() }}</b>
      }
    </p>

    @if (error()) {
      <p class="mb-2 text-center">
        <onp-status tono="error">{{ error() }}</onp-status>
      </p>
    }

    <div class="mb-1.5 text-center">
      <onp-button variante="enlace" [deshabilitado]="!puedeReenviar()" (pulsar)="reenviar()">
        Reenviar código
      </onp-button>
    </div>

    <p class="text-center text-status leading-relaxed text-text-soft">
      El código es de un solo uso y tiene una vigencia de dos minutos, conforme a las Disposiciones
      de Carácter General.
    </p>

    <onp-button [deshabilitado]="codigo().length !== 6 || validando()" (pulsar)="validar()">
      {{ validando() ? 'Verificando…' : 'Verificar' }}
    </onp-button>
  `,
})
export class Otp {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly codigo = signal('');
  protected readonly error = signal('');
  protected readonly validando = signal(false);

  /** Ticks once a second so the countdown recomputes. */
  private readonly ahora = signal(Date.now());

  private readonly sesion = this.store.selectSignal(SesionState.estado);
  protected readonly codigoDemo = this.store.selectSignal(SesionState.codigoDemo);

  /**
   * Which handset to pick up.
   *
   * A resumed application knows the number from the expediente and sends
   * back a masked form of it — preferred over "tu teléfono registrado",
   * because someone who applied months ago may not remember which number
   * they gave.
   */
  protected readonly destino = computed(() => {
    const s = this.sesion();
    const a = s.telefonoEnmascarado
      ? `tu teléfono ${s.telefonoEnmascarado}`
      : s.esCliente
        ? 'tu teléfono registrado'
        : `tu teléfono ${s.telefono}`.trimEnd();
    return `Enviamos un código de 6 dígitos a ${a}.`;
  });

  private readonly restante = computed(() => {
    const vence = this.sesion().otpExpiraEn;
    if (!vence) return 0;
    return Math.max(0, vence - this.ahora());
  });

  protected readonly vencido = computed(() => this.restante() <= 0);

  protected readonly reloj = computed(() => {
    const segundos = Math.ceil(this.restante() / 1000);
    const mm = String(Math.floor(segundos / 60)).padStart(2, '0');
    const ss = String(segundos % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  });

  protected readonly puedeReenviar = computed(() => this.restante() <= MS_PARA_REENVIAR);

  constructor() {
    const reloj = setInterval(() => this.ahora.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  protected capturar(codigo: string): void {
    this.codigo.set(codigo);
    if (this.error()) this.error.set('');
  }

  protected reenviar(): void {
    this.store.dispatch(new EnviarOtp(true)).subscribe(() => {
      this.codigo.set('');
      this.error.set('');
      this.ahora.set(Date.now());
    });
  }

  protected validar(): void {
    if (this.codigo().length !== 6) {
      this.error.set('Escribe los 6 dígitos.');
      return;
    }
    if (this.vencido()) {
      this.error.set('El código venció. Solicita uno nuevo.');
      return;
    }

    this.validando.set(true);
    this.store.dispatch(new ValidarOtp(this.codigo())).subscribe({
      next: () => {
        this.validando.set(false);
        const sesion = this.sesion();
        if (!sesion.otpValidado) {
          this.error.set('El código no coincide.');
          return;
        }

        // A resume: the Worker matched an expediente and told us where it
        // stopped. `destinoDeReanudacion` copes with a slug this build does
        // not recognise, so a renamed step cannot strand anybody.
        if (sesion.prospectoId && sesion.esCliente) {
          void this.navegacion.reanudar(destinoDeReanudacion(sesion.paso));
          return;
        }

        // An existing client with no draft is identified already and only
        // needs to configure the credit; a new prospect goes on to
        // identification.
        void this.navegacion.avanzar(sesion.esCliente ? 'simulador' : 'auth-location', 'otp');
      },
      error: () => {
        this.validando.set(false);
        this.error.set('El código no coincide.');
      },
    });
  }
}
