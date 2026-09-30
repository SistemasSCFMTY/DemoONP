import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { BRAND } from '../../brand.config';
import { NavegacionService } from '../../core/navegacion-service';
import { ElegirSiEsCliente } from '../../state/sesion/sesion.actions';
import { OnpButton } from '../../ui/onp-button/onp-button';

/**
 * The portada. Screen 1 (onp_fer_etapa2_pf.html:274).
 *
 * No topbar, no progress bar: it is the presentation and no trámite has
 * started yet. Copy ported verbatim.
 *
 * Every brand value comes from `brand.config.ts`, as `pintarDatosSofom`
 * (`:2197`) read them from a `sofoms` row in the source. The nombre comercial
 * is the razón social up to its first comma, which is the rule the source
 * used and which `brand.config` now states outright.
 *
 * "Iniciar sesión" is for someone who already has a relationship with the
 * SOFOM, so it sets `esCliente` before jumping to verificar-cliente (`:2193`).
 */
@Component({
  selector: 'onp-bienvenida',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpButton],
  templateUrl: './bienvenida.html',
})
export class Bienvenida {
  protected readonly marca = BRAND;

  private readonly navegacion = inject(NavegacionService);
  private readonly store = inject(Store);

  protected solicitar(): void {
    void this.navegacion.avanzar('es-cliente', 'bienvenida');
  }

  protected iniciarSesion(): void {
    this.store.dispatch(new ElegirSiEsCliente(true));
    void this.navegacion.avanzar('verificar-cliente', 'bienvenida');
  }

  protected abrir(destino: 'catalogo' | 'privacidad' | 'terminos' | 'ayuda'): void {
    void this.navegacion.abrirInformativa(destino, 'bienvenida');
  }
}
