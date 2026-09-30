import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideVideo } from '@lucide/angular';
import { Store } from '@ngxs/store';
import { BRAND } from '../../../brand.config';
import { NavegacionService } from '../../../core/navegacion-service';
import { Geolocalizacion } from '../../../services/domain/geolocalizacion';
import {
  DURACION_MAXIMA_S,
  Grabacion,
  type MotivoFalloVideo,
  type ResultadoVideo,
} from '../../../services/domain/videograbacion';
import { RegistrarVideo } from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpLeyenda } from '../../../ui/onp-leyenda/onp-leyenda';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/** What the "Modo demostración" note has to admit to, if anything. */
type NotaDemo = 'ninguna' | 'simulada' | 'sin-camara';

/**
 * Grabación de vídeo. Screen 25 (onp_fer_etapa2_pf.html:1799).
 *
 * The recording is real (03-videograbacion.md, CP-V2): `MediaRecorder` at
 * 640×480 and 500 kbps, capped at 45 seconds, and the resulting file rides
 * the same `POST /solicitudes` multipart as the INE photos and the firma. It
 * is a file in the expediente, not a separate biometric artifact —
 * biometrics stay simulated, see `biometria.ts`.
 *
 * Three things are deliberate on this screen.
 *
 * **The note tells the truth about this run, not about the build.** Before
 * anything is recorded it reflects the injected implementation; afterwards
 * it reflects what actually happened. A prospect who declined the camera and
 * carried on gets a different sentence from one on a browser that cannot
 * encode video, because the two are not the same fact.
 *
 * **A denied camera is not a dead end.** `Continuar` is gated on `grabado()`,
 * so a permission the prospect refuses would otherwise strand them on step
 * 25 of 28. The failure is stated plainly and an explicit second button
 * carries them on without a recording — their choice, made visible, rather
 * than a silent fallback that fakes a video.
 *
 * **The `<video>` stays mounted.** It is hidden with a class instead of an
 * `@if`, so `viewChild` resolves before `grabar()` is ever called and there
 * is no race between a signal write and the view update. Zoneless Angular
 * gives no guarantee about when the element would otherwise appear.
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
    LucideVideo,
  ],
  templateUrl: './video.html',
})
export class Video implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);
  private readonly geo = inject(Geolocalizacion);
  private readonly grabacion = inject(Grabacion);

  private readonly visor = viewChild.required<ElementRef<HTMLVideoElement>>('visor');

  protected readonly marca = BRAND;
  protected readonly duracionMaxima = DURACION_MAXIMA_S;
  protected readonly otp = this.fb.nonNullable.control('', [Validators.required]);
  protected readonly grabando = signal(false);
  protected readonly restante = signal(DURACION_MAXIMA_S);
  protected readonly error = signal('');
  /** Shown only after a real attempt failed. */
  protected readonly ofrecerSinCamara = signal(false);
  /** What the last attempt actually was. `null` before the first one. */
  private readonly simuladoUltimo = signal<boolean | null>(null);
  private readonly declino = signal(false);

  protected readonly grabado = this.store.selectSignal(IdentidadState.videoGrabado);

  protected readonly nota = computed<NotaDemo>(() => {
    if (this.declino()) return 'sin-camara';
    const ultimo = this.simuladoUltimo();
    return (ultimo ?? this.grabacion.simulada) ? 'simulada' : 'ninguna';
  });

  protected readonly etiquetaBoton = computed(() =>
    this.grabando() ? 'Grabando…' : 'Iniciar grabación',
  );

  ngOnDestroy(): void {
    // Leaving mid-recording must not leave the camera light on.
    this.grabacion.detener();
  }

  protected async grabar(): Promise<void> {
    const codigo = this.otp.value.replace(/\D/g, '');
    if (codigo.length !== 6) {
      this.otp.markAsTouched();
      this.error.set('Ingresa los 6 dígitos del código.');
      return;
    }

    this.error.set('');
    this.ofrecerSinCamara.set(false);
    this.grabando.set(true);
    this.restante.set(DURACION_MAXIMA_S);

    try {
      const resultado = await this.grabacion.grabar({
        vista: this.visor().nativeElement,
        restante: (segundos) => this.restante.set(segundos),
      });
      await this.registrar(resultado);
    } finally {
      this.grabando.set(false);
      this.restante.set(DURACION_MAXIMA_S);
    }
  }

  /**
   * The escape hatch after a failed attempt. Marks the step done with no
   * bytes and no camera, and flips the note to say exactly that.
   */
  protected async continuarSinCamara(): Promise<void> {
    this.error.set('');
    this.ofrecerSinCamara.set(false);
    this.declino.set(true);
    await this.geo.capturarSiHayPermiso('videograbacion');
    this.store.dispatch(new RegistrarVideo(null));
  }

  protected continuar(): void {
    void this.navegacion.avanzar('solicitud', 'video');
  }

  private async registrar(resultado: ResultadoVideo): Promise<void> {
    if (!resultado.grabado) {
      this.error.set(MENSAJE_FALLO[resultado.motivo ?? 'error']);
      this.ofrecerSinCamara.set(true);
      return;
    }
    this.simuladoUltimo.set(resultado.simulado);
    // The third of the four evidentiary moments.
    await this.geo.capturarSiHayPermiso('videograbacion');
    this.store.dispatch(new RegistrarVideo(resultado.video));
  }
}

/**
 * Honest copy per failure, named so the prospect can act on it. "No fue
 * posible grabar" on its own tells someone who denied a permission nothing
 * they can do about it.
 */
const MENSAJE_FALLO: Record<MotivoFalloVideo, string> = {
  permiso:
    'No autorizaste el acceso a la cámara y al micrófono. Permítelos en tu navegador e inténtalo de nuevo.',
  'sin-camara': 'No encontramos una cámara disponible en este dispositivo.',
  error: 'No fue posible completar la grabación. Inténtalo de nuevo.',
};
