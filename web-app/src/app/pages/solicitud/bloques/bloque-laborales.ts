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
  templateUrl: './bloque-laborales.html',
})
export class BloqueLaborales {
  readonly grupo = input.required<GrupoLaborales>();
  readonly idPrefijo = input.required<string>();

  protected id(sufijo: string): string {
    return `${this.idPrefijo()}-${sufijo}`;
  }
}
