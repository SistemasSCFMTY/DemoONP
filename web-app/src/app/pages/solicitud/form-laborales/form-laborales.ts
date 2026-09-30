import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { grupoLaborales } from '../../../services/domain/formularios-expediente';
import { GuardarLaborales } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';
import { BloqueLaborales } from '../bloques/bloque-laborales';

/**
 * Datos laborales. Screen 16 (onp_fer_etapa2_pf.html:1029).
 *
 * `ingresoMensual` stays a free-text field here, as in the source ("Ej:
 * $15,000"), and is parsed to a number when the payload is assembled.
 */
@Component({
  selector: 'onp-form-laborales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpButton, BloqueLaborales],
  templateUrl: './form-laborales.html',
})
export class FormLaborales {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly formulario = grupoLaborales(
    this.fb,
    this.store.selectSnapshot(SolicitudState.laborales),
  );

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarLaborales(this.formulario.getRawValue()));
    void this.navegacion.avanzar('envio-formulario', 'form-laborales');
  }
}
