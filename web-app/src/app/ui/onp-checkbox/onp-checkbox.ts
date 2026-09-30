import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/**
 * A single checkbox with wrapping copy beside it.
 *
 * Half this flow's screens gate "Continuar" behind one of these — the
 * privacy consent, the recording authorisation, the buró authorisation. They
 * carry legal weight, so the copy is a real `<label for>` and the whole label
 * is the hit area.
 *
 * The box itself is 18px in the source (:53), below the 44px minimum
 * (departure 9). The input stays visually 18px and the label row takes the
 * 44px, so the target is the row and the control still looks right.
 */
@Component({
  selector: 'onp-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './onp-checkbox.html',
})
export class OnpCheckbox {
  readonly idCampo = input.required<string>();
  readonly control = input.required<FormControl>();
  readonly obligatorio = input(false);
}
