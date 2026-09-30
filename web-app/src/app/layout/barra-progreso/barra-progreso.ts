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
  template: `
    <div
      class="h-1 w-full bg-border"
      role="progressbar"
      aria-label="Avance de tu solicitud"
      [attr.aria-valuenow]="porcentaje()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuetext]="porcentaje() + ' por ciento'"
    >
      <div class="h-full bg-gold-light transition-[width] duration-300" [style.width.%]="porcentaje()"></div>
    </div>
  `,
})
export class BarraProgreso {
  readonly porcentaje = input.required<number>();
}
