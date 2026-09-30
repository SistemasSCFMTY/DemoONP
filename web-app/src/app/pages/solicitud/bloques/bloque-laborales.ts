import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import type { GrupoLaborales } from '../../../services/domain/formularios-expediente';
import { OnpField } from '../../../ui/onp-field/onp-field';

/**
 * Employment. Shared by `form-laborales` and `declaratoria`.
 *
 * **Nothing pairs here.** Every field is either long or variable — empleo,
 * puesto, empresa, giro, antigüedad, ingresos — and their labels are the
 * longest in the app ("Ingreso mensual aproximado (Opcional)"). Two columns
 * would wrap every label onto three lines and save no height at all.
 *
 * Only empleo and puesto are required, which is the source's own marking: a
 * person can be independiente or desempleado and still apply, and demanding
 * an employer from someone who has none is how a form loses an applicant it
 * would have approved.
 */
@Component({
  selector: 'onp-bloque-laborales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpField],
  template: `
    <div [formGroup]="grupo()">
      <onp-field
        [idCampo]="id('empleo')"
        etiqueta="Empleo"
        marcador="Ej: Empleado privado, Independiente, Desempleado"
        [obligatorio]="true"
        [control]="grupo().controls.empleo"
      />
      <onp-field
        [idCampo]="id('puesto')"
        etiqueta="Puesto"
        marcador="Ej: Gerente, Ingeniero, Contador"
        [obligatorio]="true"
        [control]="grupo().controls.puesto"
      />
      <onp-field
        [idCampo]="id('empresa')"
        etiqueta="Nombre de la empresa (Opcional)"
        marcador="Ej: Acme Corporation"
        [control]="grupo().controls.empresa"
      />
      <onp-field
        [idCampo]="id('giro-empresa')"
        etiqueta="Giro de la empresa (Opcional)"
        marcador="Ej: Tecnología, Manufactura, Servicios"
        [control]="grupo().controls.giroEmpresa"
      />
      <onp-field
        [idCampo]="id('antiguedad')"
        etiqueta="Antigüedad laboral (Opcional)"
        marcador="Ej: 5 años, 2 meses"
        [control]="grupo().controls.antiguedad"
      />
      <onp-field
        [idCampo]="id('ingreso-mensual')"
        etiqueta="Ingreso mensual aproximado (Opcional)"
        marcador="Ej: $15,000"
        [control]="grupo().controls.ingresoMensual"
      />
      <onp-field
        [idCampo]="id('otros-ingresos')"
        etiqueta="Otros ingresos (Opcional)"
        marcador="Ej: Rentas, inversiones"
        [control]="grupo().controls.otrosIngresos"
      />
    </div>
  `,
})
export class BloqueLaborales {
  readonly grupo = input.required<GrupoLaborales>();
  readonly idPrefijo = input.required<string>();

  protected id(sufijo: string): string {
    return `${this.idPrefijo()}-${sufijo}`;
  }
}
