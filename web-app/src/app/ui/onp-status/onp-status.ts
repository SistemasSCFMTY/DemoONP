import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideCheck, LucideCircleDashed, LucideTriangleAlert, LucideX } from '@lucide/angular';

export type TonoEstado = 'pendiente' | 'exito' | 'error' | 'aviso';

/**
 * A one-line status under a control.
 *
 * The source writes these as text glyphs — `✓ Capturado`, `✗ No fue posible`,
 * `⭐ Pendiente`. An emoji renders differently on every platform and a screen
 * reader announces it as prose ("estrella blanca media"), so each becomes a
 * Lucide icon with the colour (CLAUDE.md, §9: colour never alone).
 *
 * `aria-live="polite"` because these lines appear in response to something the
 * prospect just did — granting a permission, capturing a photograph — and the
 * result has to reach them without stealing focus.
 */
@Component({
  selector: 'onp-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCheck, LucideX, LucideTriangleAlert, LucideCircleDashed],
  template: `
    <p class="mt-1.5 flex items-center gap-1.5 text-status font-medium" [class]="color()" aria-live="polite">
      @switch (tono()) {
        @case ('exito') {
          <svg lucideCheck class="size-4 shrink-0" aria-hidden="true"></svg>
        }
        @case ('error') {
          <svg lucideX class="size-4 shrink-0" aria-hidden="true"></svg>
        }
        @case ('aviso') {
          <svg lucideTriangleAlert class="size-4 shrink-0" aria-hidden="true"></svg>
        }
        @default {
          <svg lucideCircleDashed class="size-4 shrink-0" aria-hidden="true"></svg>
        }
      }
      <span><ng-content /></span>
    </p>
  `,
})
export class OnpStatus {
  readonly tono = input<TonoEstado>('pendiente');

  protected readonly color = computed(() => {
    switch (this.tono()) {
      case 'exito':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'aviso':
        return 'text-warning';
      default:
        return 'text-text-soft';
    }
  });
}
