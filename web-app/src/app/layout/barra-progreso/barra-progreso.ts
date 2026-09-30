import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * How far through the 28 screens the prospect is.
 *
 * `role="progressbar"` with `aria-valuenow` per 01-conventions.md §9 — a bar
 * that only exists visually tells a screen-reader user nothing about how much
 * of a 28-step form is left, which is precisely the thing they most need.
 */
@Component({
  selector: 'onp-barra-progreso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barra-progreso.html',
})
export class BarraProgreso {
  readonly porcentaje = input.required<number>();
}
