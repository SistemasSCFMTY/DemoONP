import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideGlobe, LucideMail, LucideMapPin, LucidePhone, LucideUser } from '@lucide/angular';
import { BRAND } from '../../brand.config';
import { NavegacionService } from '../../core/navegacion-service';
import { OnpAlert } from '../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../ui/onp-button/onp-button';
import { OnpCard } from '../../ui/onp-card/onp-card';
import { OnpTitulo } from '../../ui/onp-titulo/onp-titulo';

/**
 * Ayuda y contacto. Screen 5 (onp_fer_etapa2_pf.html:445).
 *
 * The source sets each contact row with an emoji — ☎️ ✉️ 📍 🌐 👤. Those are
 * Lucide icons here: an emoji renders differently on every platform and a
 * screen reader reads it as prose (CLAUDE.md).
 *
 * The CONDUSEF numbers are real public numbers and are ported verbatim. The
 * SOFOM's own contact details come from `brand.config`; the ones it has not
 * supplied stay visibly bracketed rather than being invented.
 */
@Component({
  selector: 'onp-ayuda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OnpTitulo,
    OnpAlert,
    OnpCard,
    OnpButton,
    LucidePhone,
    LucideMail,
    LucideMapPin,
    LucideGlobe,
    LucideUser,
  ],
  templateUrl: './ayuda.html',
})
export class Ayuda {
  protected readonly marca = BRAND;
  private readonly navegacion = inject(NavegacionService);

  protected volver(): void {
    void this.navegacion.regresar();
  }
}
