import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import type { GrupoContacto } from '../../../services/domain/formularios-expediente';
import { formatearTelefono } from '../../../services/domain/telefono';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpFila } from '../../../ui/onp-fila/onp-fila';

/**
 * Phone numbers and email. Shared by `form-contacto` and `declaratoria`.
 *
 * The two phones pair — both are exactly ten digits and the formatter keeps
 * them that width. The correo keeps the whole row: an address is long, and
 * halving the field means watching it scroll while you type.
 *
 * Formatting is applied on the container's `input` event rather than per
 * field, so both numbers go through `formatearTelefono` (`:2515`) without
 * two identical handlers.
 */
@Component({
  selector: 'onp-bloque-contacto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpField, OnpFila],
  templateUrl: './bloque-contacto.html',
})
export class BloqueContacto {
  readonly grupo = input.required<GrupoContacto>();
  readonly idPrefijo = input.required<string>();

  protected id(sufijo: string): string {
    return `${this.idPrefijo()}-${sufijo}`;
  }

  protected formatear(): void {
    for (const campo of ['telefonoCelular', 'telefonoFijo'] as const) {
      const control = this.grupo().controls[campo];
      const formateado = formatearTelefono(control.value);
      if (formateado !== control.value) control.setValue(formateado, { emitEvent: false });
    }
  }
}
