import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { CapturaBiometricaSimulada, type ClaseBiometrica } from '../../../services/domain/biometria';
import { RegistrarBiometria } from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Validación biométrica. Screen 24 (onp_fer_etapa2_pf.html:1773).
 *
 * Mocked behind `CapturaBiometrica`, and the screen says so under a "Modo
 * demostración" line — where something is simulated, it says so, and stays
 * true (01-conventions.md §11).
 *
 * The "98%" and "95%" come back from the service verbatim (deviation D6).
 * The 90% threshold in the alert is the source's copy and is left alone; it
 * describes the regulatory minimum, not a computed result.
 */
@Component({
  selector: 'onp-biometrics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpAlert, OnpCard, OnpButton, OnpStatus],
  template: `
    <onp-titulo
      texto="Validación biométrica"
      lede="Captura tu huella dactilar y/o rostro para verificar tu identidad contra bases de datos oficiales (INE, SRE)."
    />

    <onp-alert tono="info">
      <strong>Nota:</strong> Ambos mecanismos (huella y rostro) deben complementarse para otorgar
      créditos de mayor cuantía. El umbral mínimo de aceptación es 90% de coincidencia.
    </onp-alert>

    @if (captura.simulada) {
      <p
        class="mb-3.5 rounded-control border border-dashed border-gold-light bg-surface-warning px-3 py-2.5 text-status leading-relaxed text-warning"
      >
        <strong>Modo demostración:</strong> la captura biométrica está simulada. En producción se
        realiza contra un proveedor de verificación con detección de vitalidad.
      </p>
    }

    <onp-card>
      <h2 class="mb-1 font-heading text-h3 font-bold text-navy-deep">Huella dactilar</h2>
      <p class="mb-3 text-label leading-relaxed text-text-soft">
        Captura con detección de vitalidad (distingue tejido vivo de réplicas).
      </p>
      <onp-button
        variante="secondary"
        [deshabilitado]="capturando() === 'huella' || huellaLista()"
        (pulsar)="capturar('huella')"
      >
        {{ capturando() === 'huella' ? 'Capturando…' : 'Capturar huella' }}
      </onp-button>
      @if (huella(); as confianza) {
        <onp-status tono="exito">Capturado ({{ confianza }})</onp-status>
      } @else {
        <onp-status tono="pendiente">Pendiente</onp-status>
      }
    </onp-card>

    <onp-card>
      <h2 class="mb-1 font-heading text-h3 font-bold text-navy-deep">Rostro</h2>
      <p class="mb-3 text-label leading-relaxed text-text-soft">
        Captura con detección de vitalidad facial (diferencia rostro real de fotos/videos).
      </p>
      <onp-button
        variante="secondary"
        [deshabilitado]="capturando() === 'rostro' || rostroListo()"
        (pulsar)="capturar('rostro')"
      >
        {{ capturando() === 'rostro' ? 'Capturando…' : 'Capturar rostro' }}
      </onp-button>
      @if (rostro(); as confianza) {
        <onp-status tono="exito">Capturado ({{ confianza }})</onp-status>
      } @else {
        <onp-status tono="pendiente">Pendiente</onp-status>
      }
    </onp-card>

    <onp-button [deshabilitado]="!completa()" (pulsar)="continuar()">
      Continuar a grabación de vídeo
    </onp-button>
  `,
})
export class Biometrics {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);
  protected readonly captura = inject(CapturaBiometricaSimulada);

  private readonly identidad = this.store.selectSignal(IdentidadState.todo);

  protected readonly capturando = signal<ClaseBiometrica | null>(null);
  protected readonly huella = computed(() => this.identidad().confianzaHuella);
  protected readonly rostro = computed(() => this.identidad().confianzaRostro);
  protected readonly huellaLista = computed(() => this.identidad().biometriaHuella);
  protected readonly rostroListo = computed(() => this.identidad().biometriaRostro);
  protected readonly completa = this.store.selectSignal(IdentidadState.biometriaCompleta);

  protected async capturar(clase: ClaseBiometrica): Promise<void> {
    this.capturando.set(clase);
    try {
      const resultado = await this.captura.capturar(clase);
      if (resultado.capturado) {
        this.store.dispatch(new RegistrarBiometria(clase, resultado.confianza));
      }
    } finally {
      this.capturando.set(null);
    }
  }

  protected continuar(): void {
    void this.navegacion.avanzar('video', 'biometrics');
  }
}
