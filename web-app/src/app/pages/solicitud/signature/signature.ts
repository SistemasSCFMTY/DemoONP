import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { BRAND } from '../../../brand.config';
import { NavegacionService } from '../../../core/navegacion-service';
import { Geolocalizacion } from '../../../services/domain/geolocalizacion';
import { armarExpediente } from '../../../services/domain/expediente-armador';
import { mensajeDeApi } from '../../../services/http/api-base';
import {
  SolicitudesHttp,
  type EnvioSolicitud,
  type TipoArchivo,
} from '../../../services/http/solicitudes-http';
import { BorrarFirma, GuardarFirma } from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { EstablecerFolio, RegistrarVideoNoAdjuntado } from '../../../state/sesion/sesion.actions';
import { SesionState } from '../../../state/sesion/sesion.state';
import { SimuladorState } from '../../../state/simulador/simulador.state';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpLeyenda } from '../../../ui/onp-leyenda/onp-leyenda';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Firma electrónica. Screen 27 (onp_fer_etapa2_pf.html:1853).
 *
 * Pointer events rather than the source's two parallel mouse/touch pairs
 * (`:5030`): one set of handlers covers finger, stylus and mouse, and it is
 * the only way a stylus gets pressure-correct behaviour on a tablet.
 *
 * The canvas is sized from its own layout box at device pixel ratio, so the
 * stroke is not a soft rectangle on a phone and the exported PNG is crisp
 * enough to read at print size.
 *
 * Signing is what submits the expediente. Geolocation is captured first —
 * the fourth and most important of the four evidentiary moments, because
 * where the person was when they signed is the one the source singles out.
 *
 * The declaration above the canvas is verbatim; `[NOMBRE DE LA
 * SOFOM/EMPRESA]` becomes the razón social.
 */
@Component({
  selector: 'onp-signature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpLeyenda, OnpButton, OnpStatus],
  templateUrl: './signature.html',
})
export class Signature {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);
  private readonly geo = inject(Geolocalizacion);
  private readonly solicitudes = inject(SolicitudesHttp);

  protected readonly marca = BRAND;
  protected readonly hayTrazo = signal(false);
  protected readonly enviando = signal(false);
  /**
   * The first attempt died on the wire and the second one is in flight
   * without the videograbación (03-videograbacion.md, CP-V4). Visible while
   * it happens: the retry roughly doubles the wait, and a silent second
   * minute on the slowest click in the flow reads as a frozen app.
   */
  protected readonly reintentandoSinVideo = signal(false);
  protected readonly error = signal('');

  protected readonly etiquetaEnvio = computed(() => {
    if (this.reintentandoSinVideo()) return 'Reintentando sin la videograbación…';
    if (this.enviando()) return 'Enviando tu solicitud…';
    return 'Completar Etapa 2';
  });

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private ctx: CanvasRenderingContext2D | null = null;
  private dibujando = false;

  constructor() {
    afterNextRender(() => this.preparar());
  }

  private preparar(): void {
    const canvas = this.lienzo().nativeElement;
    const caja = canvas.getBoundingClientRect();
    const escala = window.devicePixelRatio || 1;

    // Back the canvas at device resolution; CSS keeps it at its layout size.
    canvas.width = Math.round(caja.width * escala);
    canvas.height = Math.round(caja.height * escala);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(escala, escala);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, caja.width, caja.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    // The signature is drawn in navy, the same ink as the rest of the app.
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-navy')
      .trim();
    this.ctx = ctx;
  }

  private punto(evento: PointerEvent): { x: number; y: number } {
    const caja = this.lienzo().nativeElement.getBoundingClientRect();
    return { x: evento.clientX - caja.left, y: evento.clientY - caja.top };
  }

  protected iniciar(evento: PointerEvent): void {
    if (!this.ctx) return;
    evento.preventDefault();
    this.lienzo().nativeElement.setPointerCapture(evento.pointerId);
    const { x, y } = this.punto(evento);
    this.dibujando = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  protected trazar(evento: PointerEvent): void {
    if (!this.dibujando || !this.ctx) return;
    evento.preventDefault();
    const { x, y } = this.punto(evento);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.hayTrazo.set(true);
  }

  protected terminar(): void {
    this.dibujando = false;
  }

  protected borrar(): void {
    const canvas = this.lienzo().nativeElement;
    const caja = canvas.getBoundingClientRect();
    if (this.ctx) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, caja.width, caja.height);
    }
    this.hayTrazo.set(false);
    this.store.dispatch(new BorrarFirma());
  }

  protected async completar(): Promise<void> {
    if (!this.hayTrazo() || this.enviando()) return;
    this.enviando.set(true);
    this.error.set('');

    try {
      // The fourth evidentiary moment, and the one that matters most.
      await this.geo.capturarSiHayPermiso('firma');

      const firma = await this.firmaComoBlob();
      if (!firma) {
        this.error.set('No pudimos guardar tu firma. Inténtalo de nuevo.');
        return;
      }
      this.store.dispatch(new GuardarFirma(firma, URL.createObjectURL(firma)));

      const identidad = this.store.selectSnapshot(IdentidadState.todo);
      const expediente = armarExpediente({
        solicitud: this.store.selectSnapshot(SolicitudState.todo),
        identidad: { ...identidad, firma: identidad.firma },
        simulador: this.store.selectSnapshot(SimuladorState.estado),
        sesion: this.store.selectSnapshot(SesionState.estado),
      });

      const archivos = new Map<TipoArchivo, File | Blob>();
      if (identidad.frente) archivos.set('id_frente', identidad.frente.imagen);
      if (identidad.reverso) archivos.set('id_reverso', identidad.reverso.imagen);
      archivos.set('firma', firma);
      // The videograbación is a file in the expediente like any other, and
      // it rides this same multipart POST. Absent when the recording was
      // simulated — there are no bytes then, and the Worker treats a missing
      // part as a part that was not sent.
      if (identidad.video) archivos.set('video', identidad.video.blob);
      for (const [tipo, archivo] of Object.entries(identidad.documentos)) {
        if (archivo) archivos.set(tipo as TipoArchivo, archivo);
      }

      // A first attempt that dies on the wire is retried once without the
      // `video` part, and only then — the policy and the duplicate-expediente
      // reasoning live in `services/http/reintento-video.ts`.
      const envio = await new Promise<EnvioSolicitud | null>((resolver) => {
        this.solicitudes
          .enviar({ ...expediente, firmado: true }, archivos, {
            alReintentarSinVideo: () => this.reintentandoSinVideo.set(true),
          })
          .subscribe({
            next: (r) => resolver(r),
            error: (err) => {
              this.error.set(mensajeDeApi(err));
              resolver(null);
            },
          });
      });

      if (!envio) return;

      this.store.dispatch(new EstablecerFolio(envio.respuesta.folio));
      // Carried to screen 28, which is where the prospect reads the outcome
      // and keeps the folio. Saying it only on this screen would say it to
      // nobody: the navigation happens in the same tick.
      if (envio.videoOmitido) this.store.dispatch(new RegistrarVideoNoAdjuntado());
      void this.navegacion.avanzar('complete', 'signature');
    } finally {
      this.enviando.set(false);
      this.reintentandoSinVideo.set(false);
    }
  }

  private firmaComoBlob(): Promise<Blob | null> {
    return new Promise((resolver) => {
      this.lienzo().nativeElement.toBlob((blob) => resolver(blob), 'image/png');
    });
  }
}
