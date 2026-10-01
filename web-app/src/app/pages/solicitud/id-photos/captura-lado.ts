import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideCamera, LucideCheck, LucideUpload, LucideX } from '@lucide/angular';
import { Camara } from '../../../services/domain/camara';
import { analizarCalidad } from '../../../services/domain/calidad-imagen';
import type { LadoFoto, ResultadoCalidad } from '../../../state/identidad/identidad.model';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpPreviewBox } from '../../../ui/onp-preview-box/onp-preview-box';
import { OnpStatus } from '../../../ui/onp-status/onp-status';

export interface FotoLista {
  readonly lado: LadoFoto;
  readonly lienzo: HTMLCanvasElement;
  readonly imagen: Blob;
  readonly vistaPrevia: string;
  readonly calidad: ResultadoCalidad;
}

/**
 * One side of the identity document: camera, capture, preview, quality.
 *
 * Front and back are the same interaction with different copy, so they are
 * one component used twice rather than the source's two copies of the same
 * markup (`:1608` and `:1664`).
 *
 * **Two ways in, always.** `getUserMedia` needs a permission and a secure
 * context; the file input needs neither. Both land on a canvas, so quality
 * analysis and OCR never learn which was used. If the camera is unavailable
 * the screen says so and the upload button carries the flow.
 */
@Component({
  selector: 'onp-captura-lado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpButton, OnpPreviewBox, OnpStatus, LucideCamera, LucideUpload, LucideCheck, LucideX],
  templateUrl: './captura-lado.html',
})
export class CapturaLado {
  readonly lado = input.required<LadoFoto>();
  readonly titulo = input.required<string>();
  readonly pista = input.required<string>();
  readonly habilitado = input.required<boolean>();
  /** Null when no read is running; 0–100 while Tesseract works. */
  readonly progresoOcr = input<number | null>(null);

  readonly capturada = output<FotoLista>();
  readonly descartada = output<LadoFoto>();

  protected readonly camara = inject(Camara);

  private readonly flujo = signal<MediaStream | null>(null);
  protected readonly camaraAbierta = computed(() => this.flujo() !== null);
  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly calidad = signal<ResultadoCalidad | null>(null);

  protected readonly descripcionFoto = computed(() =>
    this.lado() === 'front'
      ? 'Frente de tu identificación'
      : 'Reverso de tu identificación',
  );

  private readonly visor = viewChild<ElementRef<HTMLVideoElement>>('visor');
  private readonly archivo = viewChild.required<ElementRef<HTMLInputElement>>('archivo');

  constructor() {
    // The <video> only exists once @if has rendered it, and the app is
    // zoneless: a microtask queued after opening the camera runs before that
    // render, finds no element and leaves the viewfinder a blank navy box.
    // The effect re-runs when the `viewChild` resolves, whenever that is.
    effect(() => {
      const elemento = this.visor()?.nativeElement;
      const flujo = this.flujo();
      if (!elemento || !flujo) return;
      elemento.srcObject = flujo;
      elemento.muted = true;
      // Autoplay can be refused; "Capturar" stays inert until there is a frame.
      void elemento.play()?.catch(() => undefined);
    });
  }

  protected async abrirCamara(): Promise<void> {
    this.flujo.set(await this.camara.abrir(this.lado()));
  }

  protected cerrarCamara(): void {
    this.camara.cerrar(this.lado());
    this.flujo.set(null);
  }

  protected async capturar(): Promise<void> {
    const video = this.visor()?.nativeElement;
    // No frame yet: a 0×0 canvas makes `getImageData` throw.
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const lienzo = this.camara.capturar(video);
    this.cerrarCamara();
    await this.procesar(lienzo);
  }

  protected elegirArchivo(): void {
    this.archivo().nativeElement.click();
  }

  protected async archivoElegido(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    const lienzo = await this.camara.desdeArchivo(archivo);
    input.value = '';
    if (!lienzo) return;
    await this.procesar(lienzo);
  }

  protected repetir(): void {
    const anterior = this.vistaPrevia();
    if (anterior) URL.revokeObjectURL(anterior);
    this.vistaPrevia.set(null);
    this.calidad.set(null);
    this.descartada.emit(this.lado());
  }

  private async procesar(lienzo: HTMLCanvasElement): Promise<void> {
    const imagen = await this.camara.aBlob(lienzo);
    const vistaPrevia = URL.createObjectURL(imagen);
    const calidad = analizarCalidad(lienzo);

    const anterior = this.vistaPrevia();
    if (anterior) URL.revokeObjectURL(anterior);

    this.vistaPrevia.set(vistaPrevia);
    this.calidad.set(calidad);
    this.capturada.emit({ lado: this.lado(), lienzo, imagen, vistaPrevia, calidad });
  }
}
