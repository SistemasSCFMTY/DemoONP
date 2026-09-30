import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { grupoDomicilio } from '../../../services/domain/formularios-expediente';
import { GuardarDomicilio } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';
import { BloqueDomicilio } from '../bloques/bloque-domicilio';

/**
 * Domicilio de residencia. Screen 14 (onp_fer_etapa2_pf.html:884).
 *
 * The fields live in `BloqueDomicilio`, which `declaratoria` renders too —
 * in the source these are two copies of the same markup, and the typo in one
 * of them (departure 16) is what that costs.
 */
@Component({
  selector: 'onp-form-domicilio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpButton, BloqueDomicilio],
  templateUrl: './form-domicilio.html',
})
export class FormDomicilio {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly formulario = grupoDomicilio(
    this.fb,
    this.store.selectSnapshot(SolicitudState.domicilio),
  );

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarDomicilio(this.formulario.getRawValue()));
    void this.navegacion.avanzar('form-contacto', 'form-domicilio');
  }
}
