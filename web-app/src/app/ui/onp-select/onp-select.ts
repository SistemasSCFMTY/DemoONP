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
  template: `
    <div class="mb-4">
      <label [for]="idCampo()" class="mb-1 block text-label font-semibold text-text">
        {{ etiqueta() }}@if (obligatorio()) {<span class="text-error" aria-hidden="true"> *</span>}
      </label>

      <select
        [id]="idCampo()"
        [formControl]="control()"
        [attr.aria-required]="obligatorio() ? 'true' : null"
        [attr.aria-invalid]="muestraError() ? 'true' : null"
        [attr.aria-describedby]="muestraError() ? idCampo() + '-error' : null"
        [class]="clases()"
      >
        <option value="">Selecciona...</option>
        @for (opcion of opciones(); track opcion.valor) {
          <option [value]="opcion.valor">{{ opcion.texto }}</option>
        }
      </select>

      @if (muestraError()) {
        <p [id]="idCampo() + '-error'" class="mt-1 text-status font-medium text-error" role="alert">
          {{ textoError() }}
        </p>
      }
    </div>
  `,
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
