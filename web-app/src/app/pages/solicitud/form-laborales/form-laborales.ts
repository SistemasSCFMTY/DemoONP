import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { grupoLaborales } from '../../../services/domain/formularios-expediente';
import { GuardarLaborales } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Datos laborales. Screen 16 (onp_fer_etapa2_pf.html:1029).
 *
 * Only empleo and puesto are required, which is the source's own marking —
 * a person can be independiente or desempleado and still apply, and demanding
 * an employer from someone who has none is how a form loses an applicant it
 * would have approved.
 *
 * `ingresoMensual` stays a free-text field here, as in the source ("Ej:
 * $15,000"), and is parsed to a number when the payload is assembled.
 */
@Component({
  selector: 'onp-form-laborales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpButton],
  template: `
    <onp-titulo
      texto="Información General"
      lede="Completa todos los campos. Los campos marcados con * son obligatorios."
    />

    <h2 class="mt-4 mb-2 font-heading text-h3 font-bold text-navy-deep">Datos Laborales</h2>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <onp-field
        idCampo="pf-empleo"
        etiqueta="Empleo"
        marcador="Ej: Empleado privado, Independiente, Desempleado"
        [obligatorio]="true"
        [control]="formulario.controls.empleo"
      />
      <onp-field
        idCampo="pf-puesto"
        etiqueta="Puesto"
        marcador="Ej: Gerente, Ingeniero, Contador"
        [obligatorio]="true"
        [control]="formulario.controls.puesto"
      />
      <onp-field
        idCampo="pf-empresa"
        etiqueta="Nombre de la empresa (Opcional)"
        marcador="Ej: Acme Corporation"
        [control]="formulario.controls.empresa"
      />
      <onp-field
        idCampo="pf-giro-empresa"
        etiqueta="Giro de la empresa (Opcional)"
        marcador="Ej: Tecnología, Manufactura, Servicios"
        [control]="formulario.controls.giroEmpresa"
      />
      <onp-field
        idCampo="pf-antiguedad"
        etiqueta="Antigüedad laboral (Opcional)"
        marcador="Ej: 5 años, 2 meses"
        [control]="formulario.controls.antiguedad"
      />
      <onp-field
        idCampo="pf-ingreso-mensual"
        etiqueta="Ingreso mensual aproximado (Opcional)"
        marcador="Ej: $15,000"
        [control]="formulario.controls.ingresoMensual"
      />
      <onp-field
        idCampo="pf-otros-ingresos"
        etiqueta="Otros ingresos (Opcional)"
        marcador="Ej: Rentas, inversiones"
        [control]="formulario.controls.otrosIngresos"
      />

      <onp-button tipo="submit">Continuar</onp-button>
    </form>
  `,
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
