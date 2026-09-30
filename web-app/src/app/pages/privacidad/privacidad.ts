import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND } from '../../brand.config';
import { NavegacionService } from '../../core/navegacion-service';
import { OnpAlert } from '../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../ui/onp-button/onp-button';
import { OnpDocumentoLegal } from '../../ui/onp-documento-legal/onp-documento-legal';
import { OnpTitulo } from '../../ui/onp-titulo/onp-titulo';

/**
 * Aviso de Privacidad. Screen 3 (onp_fer_etapa2_pf.html:343).
 *
 * Ported verbatim, including the machote warning at the top — this text has
 * not been through legal review and the screen says so. Do not "improve" the
 * legal copy (01-conventions.md §11), and never `text-transform` it (§2).
 *
 * The razón social and domicilio come from `brand.config`, as
 * `pintarDatosSofom` painted them into `priv_razon` / `priv_domicilio`
 * (`:2205`).
 */
@Component({
  selector: 'onp-privacidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpAlert, OnpButton, OnpDocumentoLegal],
  templateUrl: './privacidad.html',
})
export class Privacidad {
  protected readonly marca = BRAND;
  private readonly navegacion = inject(NavegacionService);

  protected volver(): void {
    void this.navegacion.regresar();
  }
}
