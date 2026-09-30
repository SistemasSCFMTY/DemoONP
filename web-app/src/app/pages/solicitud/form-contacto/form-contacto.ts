import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { grupoContacto } from '../../../services/domain/formularios-expediente';
import { formatearTelefono } from '../../../services/domain/telefono';
import { GuardarContacto } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

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
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpButton],
  template: `
    <onp-titulo
      texto="Información General"
      lede="Completa todos los campos. Los campos marcados con * son obligatorios."
    />

    <h2 class="mt-4 mb-2 font-heading text-h3 font-bold text-navy-deep">Datos de Contacto</h2>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <div (input)="formatear('telefonoCelular')">
        <onp-field
          idCampo="pf-telefono"
          etiqueta="Teléfono celular"
          tipo="tel"
          marcador="81 1234 5678"
          modoEntrada="numeric"
          autocompletar="tel-national"
          [maxlength]="14"
          [obligatorio]="true"
          [control]="formulario.controls.telefonoCelular"
        />
      </div>

      <div (input)="formatear('telefonoFijo')">
        <onp-field
          idCampo="pf-telefono-fijo"
          etiqueta="Teléfono fijo (Opcional)"
          tipo="tel"
          marcador="81 5555 5555"
          modoEntrada="numeric"
          [maxlength]="14"
          [control]="formulario.controls.telefonoFijo"
        />
      </div>

      <onp-field
        idCampo="pf-email"
        etiqueta="Correo electrónico"
        tipo="email"
        marcador="fernando@example.com"
        autocompletar="email"
        [obligatorio]="true"
        [control]="formulario.controls.correo"
      />

      <onp-button tipo="submit">Continuar</onp-button>
    </form>
  `,
})
export class FormContacto {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly formulario = grupoContacto(
    this.fb,
    this.store.selectSnapshot(SolicitudState.contacto),
  );

  protected formatear(campo: 'telefonoCelular' | 'telefonoFijo'): void {
    const control = this.formulario.controls[campo];
    const formateado = formatearTelefono(control.value);
    if (formateado !== control.value) control.setValue(formateado, { emitEvent: false });
  }

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarContacto(this.formulario.getRawValue()));
    void this.navegacion.avanzar('form-laborales', 'form-contacto');
  }
}
