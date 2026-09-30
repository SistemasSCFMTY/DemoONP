import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  LucideBan,
  LucideCheck,
  LucideCircleHelp,
  LucideClock,
  LucidePencilLine,
  LucideSearch,
  LucideX,
} from '@lucide/angular';

import { definicionEstado } from '../../model/constants/expediente/estados-expediente';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';

/**
 * The estado chip, ported from the source's `.badge` (`:109`–`:113`).
 *
 * §9: colour never carries meaning alone, so the chip always pairs its tint
 * with an icon — the source relied on the tint by itself.
 *
 * §4: `rounded-control`, not a pill. The source used `border-radius: 10px` on
 * a 9px label, which is a pill in everything but name.
 *
 * An estado this build does not know renders as a neutral chip showing the
 * raw value, never blank and never mislabelled — see `definicionEstado`.
 */
@Component({
  selector: 'panel-estado-badge',
  imports: [
    LucidePencilLine,
    LucideClock,
    LucideSearch,
    LucideCheck,
    LucideX,
    LucideBan,
    LucideCircleHelp,
  ],
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-status font-semibold"
      [class]="definicion().clases"
    >
      @switch (definicion().icono) {
        @case ('PencilLine') {
          <svg lucidePencilLine class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
        @case ('Clock') {
          <svg lucideClock class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
        @case ('Search') {
          <svg lucideSearch class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
        @case ('Check') {
          <svg lucideCheck class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
        @case ('X') {
          <svg lucideX class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
        @case ('Ban') {
          <svg lucideBan class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
        @default {
          <svg lucideCircleHelp class="size-3.5 shrink-0" aria-hidden="true"></svg>
        }
      }
      {{ definicion().etiqueta }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoExpediente>();

  protected readonly definicion = computed(() => definicionEstado(this.estado()));
}
