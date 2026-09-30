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
  template: `
    <onp-titulo
      texto="Información General"
      lede="Completa todos los campos. Los campos marcados con * son obligatorios."
    />

    <h2 class="mt-4 mb-2 font-heading text-h3 font-bold text-navy-deep">Domicilio de Residencia</h2>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <onp-bloque-domicilio [grupo]="formulario" idPrefijo="pf" />
      <onp-button tipo="submit">Continuar</onp-button>
    </form>
  `,
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
