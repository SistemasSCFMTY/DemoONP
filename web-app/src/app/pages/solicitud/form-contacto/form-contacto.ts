import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { grupoContacto } from '../../../services/domain/formularios-expediente';
import { GuardarContacto } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';
import { BloqueContacto } from '../bloques/bloque-contacto';

/**
 * Datos de contacto. Screen 15 (onp_fer_etapa2_pf.html:1004).
 *
 * The celular and correo arrive pre-filled from registro
 * (`PrellenarDesdeRegistro`), so the prospect is not asked twice for what
 * they just typed — the source does the same at `:2568`.
 */
@Component({
  selector: 'onp-form-contacto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpButton, BloqueContacto],
  templateUrl: './form-contacto.html',
})
export class FormContacto {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly formulario = grupoContacto(
    this.fb,
    this.store.selectSnapshot(SolicitudState.contacto),
  );

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarContacto(this.formulario.getRawValue()));
    void this.navegacion.avanzar('form-laborales', 'form-contacto');
  }
}
