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
  templateUrl: './estado-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoBadge {
  readonly estado = input.required<EstadoExpediente>();

  protected readonly definicion = computed(() => definicionEstado(this.estado()));
}
