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
  templateUrl: './onp-archivo.html',
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
