import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ESTADOS } from '../../../model/constants/catalogos/estados';
import { VIALIDADES } from '../../../model/constants/catalogos/vialidades';
import type { GrupoDomicilio } from '../../../services/domain/formularios-expediente';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpFila } from '../../../ui/onp-fila/onp-fila';
import { OnpSelect } from '../../../ui/onp-select/onp-select';

/**
 * The residence address. Used by `form-domicilio` and by `declaratoria` for
 * the propietario real — one component, two `idPrefijo` values, so the two
 * cannot drift the way the source's duplicated markup already has.
 *
 * What pairs and what does not:
 *
 *  - `numeroExterior` / `numeroInterior` pair. Both are short and bounded,
 *    and they read as one answer.
 *  - `entidadFederativa` / `país` pair. A state name and "México" both fit,
 *    and país is read-only.
 *  - `codigoPostal` takes the left half alone. Five digits do not need a
 *    full row, and its natural partner — colonia — is variable-length.
 *  - Everything else keeps the whole row: the street name, colonia,
 *    municipio and ciudad are all long or variable, and the "entre calles"
 *    pair holds two more street names.
 */
@Component({
  selector: 'onp-bloque-domicilio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpField, OnpSelect, OnpFila],
  templateUrl: './bloque-domicilio.html',
})
export class BloqueDomicilio {
  readonly grupo = input.required<GrupoDomicilio>();
  readonly idPrefijo = input.required<string>();

  protected readonly vialidades = VIALIDADES;
  protected readonly estados = ESTADOS;

  protected id(sufijo: string): string {
    return `${this.idPrefijo()}-${sufijo}`;
  }
}
