import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
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
  template: `
    <section class="mb-4 rounded-card border border-border bg-surface p-4">
      <h3 class="font-heading text-h3 font-bold text-navy-deep">{{ titulo() }}</h3>
      <p class="mt-0.5 mb-3 text-label leading-relaxed text-text-soft">{{ pista() }}</p>

      @if (camaraAbierta()) {
        <div class="relative mb-3 overflow-hidden rounded-card bg-navy-deep">
          <video #visor class="block w-full" autoplay playsinline muted></video>
          <div class="pointer-events-none absolute inset-4 rounded-control border-2 border-dashed border-white/70"></div>
        </div>
        <onp-button (pulsar)="capturar()">Capturar</onp-button>
        <onp-button variante="secondary" (pulsar)="cerrarCamara()">Cancelar</onp-button>
      }

      @if (vistaPrevia(); as fuente) {
        <onp-preview-box [fuente]="fuente" [descripcion]="descripcionFoto()" />
      }

      @if (!camaraAbierta() && !vistaPrevia()) {
        @if (camara.disponible) {
          <onp-button variante="secondary" [deshabilitado]="!habilitado()" (pulsar)="abrirCamara()">
            <span class="inline-flex items-center justify-center gap-2">
              <svg lucideCamera class="size-4" aria-hidden="true"></svg>
              Tomar foto
            </span>
          </onp-button>
        }
        <onp-button variante="secondary" [deshabilitado]="!habilitado()" (pulsar)="elegirArchivo()">
          <span class="inline-flex items-center justify-center gap-2">
            <svg lucideUpload class="size-4" aria-hidden="true"></svg>
            Subir archivo
          </span>
        </onp-button>
        @if (!camara.disponible) {
          <onp-status tono="aviso">
            La cámara no está disponible en este dispositivo o navegador. Sube una fotografía desde
            tus archivos.
          </onp-status>
        }
      }

      @if (vistaPrevia()) {
        <onp-button variante="secondary" (pulsar)="repetir()">Repetir</onp-button>
      }

      <input
        #archivo
        type="file"
        accept="image/*"
        capture="environment"
        class="sr-only"
        [attr.aria-label]="'Subir ' + titulo()"
        (change)="archivoElegido($event)"
      />

      @if (calidad(); as c) {
        <onp-status [tono]="c.aprobada ? 'exito' : 'aviso'">
          {{ c.aprobada ? 'Foto capturada correctamente' : 'Calidad insuficiente — se recomienda repetir' }}
        </onp-status>
        <ul class="mt-2 space-y-1">
          @for (revision of c.revisiones; track revision.texto) {
            <li class="flex items-center gap-1.5 text-status" [class]="revision.ok ? 'text-success' : 'text-error'">
              @if (revision.ok) {
                <svg lucideCheck class="size-4 shrink-0" aria-hidden="true"></svg>
              } @else {
                <svg lucideX class="size-4 shrink-0" aria-hidden="true"></svg>
              }
              <span>{{ revision.texto }}</span>
            </li>
          }
        </ul>
      } @else {
        <onp-status tono="pendiente">Sin cargar</onp-status>
      }

      @if (progresoOcr() !== null) {
        <p class="mt-3 text-status text-text-soft" aria-live="polite">
          {{ lado() === 'front' ? 'Leyendo datos de la credencial' : 'Leyendo zona MRZ' }}
          {{ progresoOcr() }}%
        </p>
        <div class="mt-1 h-1 w-full overflow-hidden rounded-control bg-border">
          <div class="h-full bg-gold-light transition-[width]" [style.width.%]="progresoOcr()"></div>
        </div>
      }
    </section>
  `,
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

  protected readonly camaraAbierta = signal(false);
  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly calidad = signal<ResultadoCalidad | null>(null);

  protected readonly descripcionFoto = computed(() =>
    this.lado() === 'front'
      ? 'Frente de tu identificación'
      : 'Reverso de tu identificación',
  );

  private readonly visor = viewChild<ElementRef<HTMLVideoElement>>('visor');
  private readonly archivo = viewChild.required<ElementRef<HTMLInputElement>>('archivo');

  protected async abrirCamara(): Promise<void> {
    const stream = await this.camara.abrir(this.lado());
    if (!stream) {
      this.camaraAbierta.set(false);
      return;
    }
    this.camaraAbierta.set(true);
    // The <video> only exists once @if has rendered it.
    queueMicrotask(() => {
      const elemento = this.visor()?.nativeElement;
      if (elemento) elemento.srcObject = stream;
    });
  }

  protected cerrarCamara(): void {
    this.camara.cerrar(this.lado());
    this.camaraAbierta.set(false);
  }

  protected async capturar(): Promise<void> {
    const video = this.visor()?.nativeElement;
    if (!video) return;
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
