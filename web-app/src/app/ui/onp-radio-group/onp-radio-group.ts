import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Opcion } from '../../model/interfaces/opcion';

/**
 * A set of radios under one group label.
 *
 * `role="radiogroup"` with `aria-labelledby` so a screen reader announces
 * what the choice is about before reading the options — the PEP questions in
 * particular are long, and "Sí / No" on its own means nothing.
 *
 * Each row is 44px tall, which the source's 16px radios are not
 * (departure 9).
 */
@Component({
  selector: 'onp-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mb-3" role="radiogroup" [attr.aria-labelledby]="idGrupo() + '-etiqueta'">
      <p [id]="idGrupo() + '-etiqueta'" class="mb-1 text-label font-semibold text-text">
        {{ etiqueta() }}@if (obligatorio()) {<span class="text-error" aria-hidden="true"> *</span>}
      </p>
      @for (opcion of opciones(); track opcion.valor) {
        <label
          class="flex min-h-11 cursor-pointer items-center gap-2 py-1 text-label leading-relaxed text-text"
        >
          <input
            type="radio"
            class="size-5 shrink-0 accent-navy"
            [name]="idGrupo()"
            [value]="opcion.valor"
            [formControl]="control()"
          />
          <span>{{ opcion.texto }}</span>
        </label>
      }
    </div>
  `,
})
export class OnpRadioGroup {
  readonly idGrupo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<readonly Opcion[]>();
  readonly control = input.required<FormControl>();
  readonly obligatorio = input(false);
}
