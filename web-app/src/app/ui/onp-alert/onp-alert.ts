import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideCircleAlert, LucideInfo, LucideTriangleAlert } from '@lucide/angular';

export type TonoAlerta = 'info' | 'warning' | 'error';

/**
 * A boxed notice.
 *
 * Colour never carries the meaning alone (01-conventions.md §9): every tone
 * pairs its wash with a Lucide icon, so the difference between "context" and
 * "careful" survives a colour-blind reader and a black-and-white printout.
 *
 * `error` is `role="alert"`; the quieter tones are not, because a page that
 * interrupts a screen reader to mention something informational is worse than
 * one that stays quiet.
 */
@Component({
  selector: 'onp-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideInfo, LucideTriangleAlert, LucideCircleAlert],
  template: `
    <div
      class="mb-4 flex gap-2 rounded-control border p-3 text-label leading-relaxed"
      [class]="clases()"
      [attr.role]="tono() === 'error' ? 'alert' : null"
    >
      <span class="mt-px shrink-0">
        @switch (tono()) {
          @case ('info') {
            <svg lucideInfo class="size-4" aria-hidden="true"></svg>
          }
          @case ('warning') {
            <svg lucideTriangleAlert class="size-4" aria-hidden="true"></svg>
          }
          @default {
            <svg lucideCircleAlert class="size-4" aria-hidden="true"></svg>
          }
        }
      </span>
      <div class="min-w-0 flex-1"><ng-content /></div>
    </div>
  `,
})
export class OnpAlert {
  readonly tono = input<TonoAlerta>('info');

  protected readonly clases = computed(() => {
    switch (this.tono()) {
      case 'warning':
        return 'border-warning/30 bg-surface-warning text-warning';
      case 'error':
        return 'border-error/30 bg-surface-warning text-error';
      default:
        return 'border-navy/15 bg-surface-info text-navy-deep';
    }
  });
}
