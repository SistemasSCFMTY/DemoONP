import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { grupoGenerales } from '../../../services/domain/formularios-expediente';
import { GuardarGenerales } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';
import { BloqueGenerales } from '../bloques/bloque-generales';

/**
 * Datos generales. Screen 13 (onp_fer_etapa2_pf.html:774).
 *
 * The fields and the CURP behaviour live in `BloqueGenerales`, which
 * `declaratoria` renders too for the propietario real. This screen is the
 * step: build the group from the store, save it, move on.
 */
@Component({
  selector: 'onp-form-generales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpButton, BloqueGenerales],
  templateUrl: './form-generales.html',
})
export class FormGenerales {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  /** Rehydrated from the store, so back-navigation restores what was typed. */
  protected readonly formulario = grupoGenerales(
    this.fb,
    this.store.selectSnapshot(SolicitudState.generales),
  );

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarGenerales(this.formulario.getRawValue()));
    void this.navegacion.avanzar('form-domicilio', 'form-generales');
  }
}
