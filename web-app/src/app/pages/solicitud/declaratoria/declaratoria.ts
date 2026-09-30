import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import {
  grupoContacto,
  grupoDomicilio,
  grupoGenerales,
  grupoLaborales,
} from '../../../services/domain/formularios-expediente';
import { GuardarDeclaratoria } from '../../../state/solicitud/solicitud.actions';
import { PROPIETARIO_VACIO } from '../../../state/solicitud/solicitud.model';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';
import { BloqueContacto } from '../bloques/bloque-contacto';
import { BloqueDomicilio } from '../bloques/bloque-domicilio';
import { BloqueGenerales } from '../bloques/bloque-generales';
import { BloqueLaborales } from '../bloques/bloque-laborales';

/**
 * Declaratoria de propietario real. Screen 20 (onp_fer_etapa2_pf.html:1278).
 *
 * The longest screen in the flow: declaring you act for a third party opens
 * the whole identity form again for that person — the `pr_*` fields of the
 * payload.
 *
 * **It renders the same four blocks the applicant's own screens do**, with
 * `idPrefijo="pr"`. In the source this is 290 lines of markup duplicated from
 * four other screens, and it has already drifted from them (departure 16).
 * Sharing the blocks is what stops that happening again — including the CURP
 * generation, which the source also has two copies of.
 *
 * **The branch is the conditional-required-ness case that matters most.** In
 * the source the propietario real's twenty-odd required fields are required
 * only while their container is displayed (`estaVisible`, `:3987`). Here the
 * four groups are created when "tercero" is chosen and discarded when it is
 * not, so the validators exist exactly when the declaration says they should
 * — and a propietario real nobody declared cannot reach the payload, because
 * there is no form holding their data (§8, departure 10).
 */
@Component({
  selector: 'onp-declaratoria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OnpTitulo,
    OnpCard,
    OnpAlert,
    OnpButton,
    BloqueGenerales,
    BloqueDomicilio,
    BloqueContacto,
    BloqueLaborales,
  ],
  templateUrl: './declaratoria.html',
})
export class Declaratoria {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly esTercero = signal(
    this.store.selectSnapshot(SolicitudState.actuaPorCuenta) === 'tercero',
  );

  /**
   * The four groups exist only while "tercero" is the answer. Creating and
   * discarding them IS the conditional requirement — there is no hidden form
   * whose validators have to be remembered or whose values could leak into
   * the payload.
   */
  protected readonly grupos = signal(this.construir());

  protected elegir(cuenta: 'propio' | 'tercero'): void {
    this.esTercero.set(cuenta === 'tercero');
    this.grupos.set(this.construir());
  }

  protected continuar(): void {
    const g = this.grupos();

    if (!g) {
      this.store.dispatch(new GuardarDeclaratoria('propio', null));
      void this.navegacion.avanzar('auth-buro', 'declaratoria');
      return;
    }

    const todos = [g.generales, g.domicilio, g.contacto, g.laborales];
    for (const grupo of todos) grupo.markAllAsTouched();
    if (todos.some((grupo) => grupo.invalid)) return;

    this.store.dispatch(
      new GuardarDeclaratoria('tercero', {
        generales: g.generales.getRawValue(),
        domicilio: g.domicilio.getRawValue(),
        contacto: g.contacto.getRawValue(),
        laborales: g.laborales.getRawValue(),
      }),
    );
    void this.navegacion.avanzar('auth-buro', 'declaratoria');
  }

  private construir() {
    if (!this.esTercero()) return null;
    const guardado = this.store.selectSnapshot(SolicitudState.propietario) ?? PROPIETARIO_VACIO;
    return {
      generales: grupoGenerales(this.fb, guardado.generales),
      domicilio: grupoDomicilio(this.fb, guardado.domicilio),
      contacto: grupoContacto(this.fb, guardado.contacto),
      laborales: grupoLaborales(this.fb, guardado.laborales),
    };
  }
}
