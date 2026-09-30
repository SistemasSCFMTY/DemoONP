import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { ESTADOS } from '../../../model/constants/catalogos/estados';
import { VIALIDADES } from '../../../model/constants/catalogos/vialidades';
import { grupoDomicilio } from '../../../services/domain/formularios-expediente';
import { GuardarDomicilio } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpSelect } from '../../../ui/onp-select/onp-select';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Domicilio de residencia. Screen 14 (onp_fer_etapa2_pf.html:884).
 *
 * The entity list here is the residence one — the same as the birth list
 * minus `NE`, because you cannot live in "nacido en el extranjero".
 *
 * The "entre calles" pair is optional and grouped visually, as in the source.
 * Its label there reads "Indícalas vialidades perpendiculares" on this screen
 * and "Indica las vialidades perpendiculares" on the propietario real's copy
 * of the same block — a typo from the duplication. Ported as the correct
 * "Indica las", recorded as departure 16.
 */
@Component({
  selector: 'onp-form-domicilio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpSelect, OnpButton],
  template: `
    <onp-titulo
      texto="Información General"
      lede="Completa todos los campos. Los campos marcados con * son obligatorios."
    />

    <h2 class="mt-4 mb-2 font-heading text-h3 font-bold text-navy-deep">Domicilio de Residencia</h2>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <onp-select
        idCampo="pf-tipo-vialidad"
        etiqueta="Tipo de vialidad"
        [opciones]="vialidades"
        [obligatorio]="true"
        [control]="formulario.controls.tipoVialidad"
      />
      <onp-field
        idCampo="pf-nombre-vialidad"
        etiqueta="Nombre de la vialidad"
        marcador="Ej: Benito Juárez, Paseo de la Reforma"
        autocompletar="address-line1"
        [obligatorio]="true"
        [control]="formulario.controls.nombreVialidad"
      />
      <onp-field
        idCampo="pf-numero-exterior"
        etiqueta="Número exterior"
        marcador="Ej: 123"
        [obligatorio]="true"
        [control]="formulario.controls.numeroExterior"
      />
      <onp-field
        idCampo="pf-numero-interior"
        etiqueta="Número interior (Opcional)"
        marcador="Ej: Apto 5B, Depto 301"
        [control]="formulario.controls.numeroInterior"
      />

      <fieldset class="mb-3.5 rounded-control border-0 bg-surface-muted p-3">
        <legend class="mb-2.5 text-status text-text-soft">
          <strong>Entre (Opcional)</strong> — Indica las vialidades perpendiculares
        </legend>
        <onp-field
          idCampo="pf-entre-1"
          etiqueta="Entre:"
          marcador="Ej: Avenida Paseo"
          [control]="formulario.controls.entre1"
        />
        <onp-field
          idCampo="pf-entre-2"
          etiqueta="y:"
          marcador="Ej: Calle Benito"
          [control]="formulario.controls.entre2"
        />
      </fieldset>

      <onp-field
        idCampo="pf-codigo-postal"
        etiqueta="Código postal"
        marcador="Ej: 64000"
        modoEntrada="numeric"
        autocompletar="postal-code"
        [maxlength]="5"
        [obligatorio]="true"
        [control]="formulario.controls.codigoPostal"
      />
      <onp-field
        idCampo="pf-colonia"
        etiqueta="Colonia"
        marcador="Ej: Centro, Del Valle"
        [obligatorio]="true"
        [control]="formulario.controls.colonia"
      />
      <onp-field
        idCampo="pf-municipio"
        etiqueta="Municipio o alcaldía"
        marcador="Ej: Monterrey"
        [obligatorio]="true"
        [control]="formulario.controls.municipio"
      />
      <onp-field
        idCampo="pf-ciudad"
        etiqueta="Ciudad"
        marcador="Ej: Monterrey"
        [obligatorio]="true"
        [control]="formulario.controls.ciudad"
      />
      <onp-select
        idCampo="pf-estado"
        etiqueta="Entidad Federativa"
        [opciones]="estados"
        [obligatorio]="true"
        [control]="formulario.controls.entidadFederativa"
      />
      <onp-field
        idCampo="pf-pais"
        etiqueta="País"
        [soloLectura]="true"
        [obligatorio]="true"
        [control]="formulario.controls.pais"
      />

      <onp-button tipo="submit">Continuar</onp-button>
    </form>
  `,
})
export class FormDomicilio {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly vialidades = VIALIDADES;
  protected readonly estados = ESTADOS;

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
