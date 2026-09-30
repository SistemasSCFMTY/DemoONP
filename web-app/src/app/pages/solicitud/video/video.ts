import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { BRAND } from '../../../brand.config';
import { NavegacionService } from '../../../core/navegacion-service';
import { Geolocalizacion } from '../../../services/domain/geolocalizacion';
import { GrabacionSimulada } from '../../../services/domain/videograbacion';
import { RegistrarVideo } from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpLeyenda } from '../../../ui/onp-leyenda/onp-leyenda';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Grabación de vídeo. Screen 25 (onp_fer_etapa2_pf.html:1799).
 *
 * Mocked behind `Grabacion`, and labelled. A real recording needs
 * `MediaRecorder`, a 45-second cap and an upload of tens of megabytes — and
 * `POST /solicitudes` has no video part, so there is nowhere to put it.
 * Wiring the camera without somewhere to send the bytes would look finished
 * and be worse than a labelled simulation.
 *
 * The retention leyenda is verbatim; `[NOMBRE DE LA SOFOM/EMPRESA]` becomes
 * the razón social from `brand.config`, because a consent that does not name
 * who is consented to is not one.
 *
 * Geolocation is captured here, the third of the four evidentiary moments.
 */
@Component({
  selector: 'onp-video',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpAlert,
    OnpField,
    OnpLeyenda,
    OnpButton,
    OnpStatus,
  ],
  template: `
    <onp-titulo
      texto="Grabación de vídeo"
      lede="Se grabará tu vídeo de identificación (máximo 45 segundos)."
    />

    <onp-alert tono="warning">
      <strong>Recomendaciones:</strong>
      <ul class="mt-2 list-disc space-y-0.5 pl-5">
        <li>Ubícate en un lugar con buena iluminación</li>
        <li>Procura que tu rostro sea visible completamente</li>
        <li>Evita contraluces, sombras o filtros</li>
        <li>Mantén la cámara estable y limpia</li>
        <li>Verifica que tu conexión a internet sea estable</li>
        <li>Retira lentes oscuros, gorras o accesorios que cubran tu rostro</li>
        <li>Asegúrate de que no haya ruido excesivo</li>
      </ul>
    </onp-alert>

    @if (grabacion.simulada) {
      <p
        class="mb-3.5 rounded-control border border-dashed border-gold-light bg-surface-warning px-3 py-2.5 text-status leading-relaxed text-warning"
      >
        <strong>Modo demostración:</strong> la videograbación está simulada. En producción se graba
        tu imagen y voz y se conserva como parte del expediente.
      </p>
    }

    <onp-field
      idCampo="video-otp"
      etiqueta="Código OTP (enviado a tu correo)"
      marcador="000000"
      modoEntrada="numeric"
      ayuda="Válido por 2 minutos."
      [maxlength]="6"
      [obligatorio]="true"
      [control]="otp"
    />

    <onp-leyenda>
      Al continuar, autorizas a {{ marca.razonSocial }} a recopilar y conservar tu grabación, datos
      biométricos y demás información relacionada, exclusivamente para fines de identificación,
      conforme a las Disposiciones de Carácter General. Esta información se conservará de forma
      segura durante la vigencia del contrato y, al menos, 10 años después.
    </onp-leyenda>

    <onp-button variante="secondary" [deshabilitado]="grabando() || grabado()" (pulsar)="grabar()">
      {{ grabando() ? 'Grabando…' : 'Iniciar grabación' }}
    </onp-button>

    @if (grabado()) {
      <onp-status tono="exito">Grabado</onp-status>
    } @else {
      <onp-status tono="pendiente">No grabado</onp-status>
    }

    @if (error()) {
      <onp-status tono="error">{{ error() }}</onp-status>
    }

    <onp-button [deshabilitado]="!grabado()" (pulsar)="continuar()">Continuar</onp-button>
  `,
})
export class Video {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);
  private readonly geo = inject(Geolocalizacion);
  protected readonly grabacion = inject(GrabacionSimulada);

  protected readonly marca = BRAND;
  protected readonly otp = this.fb.nonNullable.control('', [Validators.required]);
  protected readonly grabando = signal(false);
  protected readonly error = signal('');
  protected readonly grabado = this.store.selectSignal(IdentidadState.videoGrabado);

  protected async grabar(): Promise<void> {
    const codigo = this.otp.value.replace(/\D/g, '');
    if (codigo.length !== 6) {
      this.otp.markAsTouched();
      this.error.set('Ingresa los 6 dígitos del código.');
      return;
    }

    this.error.set('');
    this.grabando.set(true);
    try {
      const resultado = await this.grabacion.grabar();
      if (resultado.grabado) {
        // The third of the four evidentiary moments.
        await this.geo.capturarSiHayPermiso('videograbacion');
        this.store.dispatch(new RegistrarVideo());
      }
    } finally {
      this.grabando.set(false);
    }
  }

  protected continuar(): void {
    void this.navegacion.avanzar('solicitud', 'video');
  }
}
