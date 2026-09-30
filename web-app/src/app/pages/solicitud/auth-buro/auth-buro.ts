import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { BRAND } from '../../../brand.config';
import { NavegacionService } from '../../../core/navegacion-service';
import { GuardarAutorizaciones } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpLeyenda } from '../../../ui/onp-leyenda/onp-leyenda';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Autorización Buró de Crédito. Screen 21 (onp_fer_etapa2_pf.html:1567).
 *
 * The Art. 28 LRSIC authorisation, verbatim. The source has
 * `[SOFOM / FINANCIERA]` as a literal placeholder in the legal text; the
 * razón social from `brand.config` goes there instead, because a credit-
 * bureau authorisation that does not name who is authorised to pull the
 * report authorises nobody.
 */
@Component({
  selector: 'onp-auth-buro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpLeyenda, OnpField, OnpCheckbox, OnpButton],
  templateUrl: './auth-buro.html',
})
export class AuthBuro {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly marca = BRAND;

  private readonly guardado = this.store.selectSnapshot(SolicitudState.autorizaciones);

  protected readonly formulario = this.fb.nonNullable.group({
    nip: [this.guardado.buroNip, [Validators.required]],
    autorizo: [this.guardado.buro],
  });

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || !this.formulario.controls.autorizo.value) return;
    this.store.dispatch(
      new GuardarAutorizaciones({ buro: true, buroNip: this.formulario.controls.nip.value }),
    );
    void this.navegacion.avanzar('id-photos', 'auth-buro');
  }
}
