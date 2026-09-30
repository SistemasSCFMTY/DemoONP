import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideFileText, LucideUpload, LucideX } from '@lucide/angular';

/**
 * One document slot.
 *
 * A bare `<input type="file">` renders differently on every platform, is
 * hard to hit with a thumb, and says "Sin archivos seleccionados" in the
 * browser's language rather than the app's. This wraps one: the input keeps
 * the semantics and the accessible name, a styled 44px-tall label is the hit
 * area, and the chosen file is named back in Spanish with its size.
 *
 * Nothing here reads the bytes. The `File` goes to `IdentidadState` and from
 * there into the multipart body — never to storage.
 */
@Component({
  selector: 'onp-archivo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideUpload, LucideFileText, LucideX],
  template: `
    <div class="mb-4">
      <label [for]="idCampo()" class="mb-1 block text-label font-semibold text-text">
        {{ etiqueta() }}@if (obligatorio()) {<span class="text-error" aria-hidden="true"> *</span>}
      </label>

      <input
        #entrada
        type="file"
        class="sr-only"
        [id]="idCampo()"
        [accept]="acepta()"
        [attr.aria-required]="obligatorio() ? 'true' : null"
        [attr.aria-describedby]="seleccionado() ? idCampo() + '-elegido' : idCampo() + '-tipos'"
        (change)="elegido($event)"
      />

      <label
        [for]="idCampo()"
        class="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-dashed border-border bg-surface px-3 py-2.5 text-label text-navy hover:border-navy"
      >
        @if (seleccionado(); as archivo) {
          <svg lucideFileText class="size-4 shrink-0 text-success" aria-hidden="true"></svg>
          <span [id]="idCampo() + '-elegido'" class="min-w-0 flex-1 truncate text-text">
            {{ archivo.name }}
          </span>
          <span class="shrink-0 text-status text-text-soft">{{ tamano() }}</span>
        } @else {
          <svg lucideUpload class="size-4 shrink-0" aria-hidden="true"></svg>
          <span class="flex-1">Elegir archivo</span>
        }
      </label>

      @if (seleccionado()) {
        <button
          type="button"
          class="mt-1 inline-flex min-h-11 cursor-pointer items-center gap-1 text-status font-semibold text-navy underline underline-offset-2"
          (click)="quitar()"
        >
          <svg lucideX class="size-4" aria-hidden="true"></svg>
          Quitar archivo
        </button>
      } @else {
        <p [id]="idCampo() + '-tipos'" class="mt-1 text-status text-text-soft">
          {{ descripcionTipos() }}
        </p>
      }
    </div>
  `,
})
export class OnpArchivo {
  readonly idCampo = input.required<string>();
  readonly etiqueta = input.required<string>();
  /** As the `accept` attribute, e.g. `.pdf,.jpg,.png`. */
  readonly acepta = input('.pdf,.jpg,.png');
  readonly obligatorio = input(false);
  readonly cambio = output<File | null>();

  protected readonly seleccionado = signal<File | null>(null);
  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');

  protected readonly tamano = computed(() => {
    const archivo = this.seleccionado();
    if (!archivo) return '';
    const kb = archivo.size / 1024;
    return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  });

  protected readonly descripcionTipos = computed(() =>
    this.acepta()
      .split(',')
      .map((t) => t.replace('.', '').toUpperCase())
      .join(', '),
  );

  protected elegido(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.seleccionado.set(archivo);
    this.cambio.emit(archivo);
  }

  protected quitar(): void {
    this.entrada().nativeElement.value = '';
    this.seleccionado.set(null);
    this.cambio.emit(null);
  }
}
