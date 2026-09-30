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
  templateUrl: './onp-radio-group.html',
})
export class OnpRadioGroup {
  readonly idGrupo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<readonly Opcion[]>();
  readonly control = input.required<FormControl>();
  readonly obligatorio = input(false);
}
