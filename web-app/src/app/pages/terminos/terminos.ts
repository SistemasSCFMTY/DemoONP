import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND } from '../../brand.config';
import { NavegacionService } from '../../core/navegacion-service';
import { OnpAlert } from '../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../ui/onp-button/onp-button';
import { OnpDocumentoLegal } from '../../ui/onp-documento-legal/onp-documento-legal';
import { OnpTitulo } from '../../ui/onp-titulo/onp-titulo';

/**
 * Términos y Condiciones. Screen 4 (onp_fer_etapa2_pf.html:402).
 *
 * Verbatim, machote warning included. `[PLAZA]` stays a placeholder because
 * the forum clause names a city the SOFOM has not told us, and inventing one
 * in a jurisdiction clause would be worse than leaving the bracket visible.
 */
@Component({
  selector: 'onp-terminos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpAlert, OnpButton, OnpDocumentoLegal],
  templateUrl: './terminos.html',
})
export class Terminos {
  protected readonly marca = BRAND;
  private readonly navegacion = inject(NavegacionService);

  protected volver(): void {
    void this.navegacion.regresar();
  }
}
