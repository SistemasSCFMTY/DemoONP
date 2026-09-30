import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Opcion } from '../../model/interfaces/opcion';
import { mensajeDeError } from '../../services/domain/validadores';

/**
 * A labelled `<select>`.
 *
 * Same contract as `onp-field`: real label, asterisk plus `aria-required`,
 * inline Spanish error. The empty option keeps the source's wording —
 * "Selecciona..." — so the control reads the same as it did.
 */
@Component({
  selector: 'onp-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './onp-select.html',
  // Three children, same shape as `onp-field`, so the two can share a row.
  host: { class: 'mb-4 block' },
})
export class OnpSelect {
  readonly idCampo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl>();
  readonly opciones = input.required<readonly Opcion[]>();
  readonly obligatorio = input(false);

  protected readonly muestraError = computed(() => {
    const c = this.control();
    return c.invalid && (c.touched || c.dirty);
  });

  protected readonly textoError = computed(() => mensajeDeError(this.control().errors));

  protected readonly clases = computed(() => {
    const base =
      'block min-h-11 w-full rounded-control border bg-surface px-3 py-2.5 text-base focus:border-navy focus:outline-none';
    return this.muestraError() ? `${base} border-error` : `${base} border-border`;
  });
}
