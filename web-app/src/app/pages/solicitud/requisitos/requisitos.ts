import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideHouse, LucideIdCard, LucideLightbulb, LucideSignal } from '@lucide/angular';
import { NavegacionService } from '../../../core/navegacion-service';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Ten esto a la mano. Screen 8 (onp_fer_etapa2_pf.html:592).
 *
 * The source's 🪪 💡 📶 🏠 become Lucide icons (CLAUDE.md: no emojis).
 */
@Component({
  selector: 'onp-requisitos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OnpTitulo,
    OnpCard,
    OnpAlert,
    OnpButton,
    LucideIdCard,
    LucideLightbulb,
    LucideSignal,
    LucideHouse,
  ],
  templateUrl: './requisitos.html',
})
export class Requisitos {
  private readonly navegacion = inject(NavegacionService);

  protected continuar(): void {
    void this.navegacion.avanzar('registro', 'requisitos');
  }
}
