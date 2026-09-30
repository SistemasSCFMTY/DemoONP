import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  filtrarCatalogo,
  filtrarCondicionales,
} from '../../../model/constants/plantilla/catalogo-claves';
import { LlavesPipe } from '../../../pipes/llaves.pipe';

/** How long "Copiado" stays on the button. Matches the source (`:5707`). */
const MS_COPIADO = 1200;

/**
 * "Claves disponibles" — the searchable catalogue, ported from `pintarCatalogo`
 * (`onp_fer_etapa2_pf.html:5673`).
 *
 * **It is its own component so that `@defer` can code-split it.** A `@defer`
 * block only moves a dependency into a separate chunk when that dependency is
 * used nowhere else, so leaving this markup inline in `formatos.html` would
 * have deferred the *rendering* and shipped the bytes anyway. Extracted, the
 * 86-entry catalogue and its markup leave the Formatos route chunk and arrive
 * when the section scrolls into view.
 *
 * The parent keeps the search field: it is above the fold, it must stay
 * interactive while this is still deferred, and typing in it is one of the
 * triggers that brings this in.
 */
@Component({
  selector: 'panel-claves-catalogo',
  imports: [LlavesPipe],
  templateUrl: './claves-catalogo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClavesCatalogo {
  /** The debounced search text, owned by the parent's field. */
  readonly consulta = input.required<string>();

  /**
   * A clipboard failure, in Spanish, for the parent to show beside the upload
   * controls — where every other message on this screen already appears.
   */
  readonly errorCopia = output<string>();

  protected readonly claveCopiada = signal<string | null>(null);

  protected readonly grupos = computed(() => filtrarCatalogo(this.consulta()));
  protected readonly condicionales = computed(() => filtrarCondicionales(this.consulta()));

  protected copiar(clave: string): void {
    void this.#alPortapapeles(`{{${clave}}}`, clave);
  }

  protected copiarBloque(clave: string): void {
    void this.#alPortapapeles(`{{#${clave}}}\n\n{{/${clave}}}`, clave);
  }

  /**
   * Copies, then flips the button to "Copiado" for a moment (`:5701`).
   *
   * `navigator.clipboard` needs a secure context and a user gesture; both
   * hold here. The source keeps a `document.execCommand` fallback — that API
   * is deprecated and the panel is served over HTTPS, so a failure shows a
   * message instead of silently doing nothing.
   */
  async #alPortapapeles(texto: string, clave: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      this.claveCopiada.set(clave);
      setTimeout(() => {
        if (this.claveCopiada() === clave) this.claveCopiada.set(null);
      }, MS_COPIADO);
    } catch {
      this.errorCopia.emit(
        'Tu navegador no dejó copiar al portapapeles. Selecciona la clave y cópiala a mano.',
      );
    }
  }
}
