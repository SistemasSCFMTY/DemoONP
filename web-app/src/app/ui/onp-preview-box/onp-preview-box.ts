import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The captured photograph, shown back to the prospect.
 *
 * This is the frame that sells the capture on stage: the photograph they just
 * took of their own credential, at full width on a white card. `card` radius,
 * hairline border (01-conventions.md §4).
 *
 * The `alt` is required rather than defaulted — "Lado frontal de tu
 * identificación" and "Tu firma" are different things and a shared default
 * would describe neither.
 */
@Component({
  selector: 'onp-preview-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onp-preview-box.html',
})
export class OnpPreviewBox {
  readonly fuente = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly pie = input('');
}
