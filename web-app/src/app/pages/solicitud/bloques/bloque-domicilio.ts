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
  template: `
    <div [formGroup]="grupo()">
      <onp-select
        [idCampo]="id('tipo-vialidad')"
        etiqueta="Tipo de vialidad"
        [opciones]="vialidades"
        [obligatorio]="true"
        [control]="grupo().controls.tipoVialidad"
      />
      <onp-field
        [idCampo]="id('nombre-vialidad')"
        etiqueta="Nombre de la vialidad"
        marcador="Ej: Benito Juárez, Paseo de la Reforma"
        autocompletar="address-line1"
        [obligatorio]="true"
        [control]="grupo().controls.nombreVialidad"
      />

      <onp-fila>
        <onp-field
          [idCampo]="id('numero-exterior')"
          etiqueta="Número exterior"
          marcador="Ej: 123"
          [obligatorio]="true"
          [control]="grupo().controls.numeroExterior"
        />
        <onp-field
          [idCampo]="id('numero-interior')"
          etiqueta="Número interior (Opcional)"
          marcador="Ej: Apto 5B"
          [control]="grupo().controls.numeroInterior"
        />
      </onp-fila>

      <fieldset class="mb-3.5 rounded-control border-0 bg-surface-muted p-3">
        <legend class="mb-2.5 text-status text-text-soft">
          <strong>Entre (Opcional)</strong> — Indica las vialidades perpendiculares
        </legend>
        <onp-field
          [idCampo]="id('entre-1')"
          etiqueta="Entre:"
          marcador="Ej: Avenida Paseo"
          [control]="grupo().controls.entre1"
        />
        <onp-field
          [idCampo]="id('entre-2')"
          etiqueta="y:"
          marcador="Ej: Calle Benito"
          [control]="grupo().controls.entre2"
        />
      </fieldset>

      <onp-fila>
        <onp-field
          [idCampo]="id('codigo-postal')"
          etiqueta="Código postal"
          marcador="Ej: 64000"
          modoEntrada="numeric"
          autocompletar="postal-code"
          [maxlength]="5"
          [obligatorio]="true"
          [control]="grupo().controls.codigoPostal"
        />
      </onp-fila>

      <onp-field
        [idCampo]="id('colonia')"
        etiqueta="Colonia"
        marcador="Ej: Centro, Del Valle"
        [obligatorio]="true"
        [control]="grupo().controls.colonia"
      />
      <onp-field
        [idCampo]="id('municipio')"
        etiqueta="Municipio o alcaldía"
        marcador="Ej: Monterrey"
        [obligatorio]="true"
        [control]="grupo().controls.municipio"
      />
      <onp-field
        [idCampo]="id('ciudad')"
        etiqueta="Ciudad"
        marcador="Ej: Monterrey"
        [obligatorio]="true"
        [control]="grupo().controls.ciudad"
      />

      <onp-fila>
        <onp-select
          [idCampo]="id('estado')"
          etiqueta="Entidad Federativa"
          [opciones]="estados"
          [obligatorio]="true"
          [control]="grupo().controls.entidadFederativa"
        />
        <onp-field
          [idCampo]="id('pais')"
          etiqueta="País"
          [soloLectura]="true"
          [obligatorio]="true"
          [control]="grupo().controls.pais"
        />
      </onp-fila>
    </div>
  `,
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
