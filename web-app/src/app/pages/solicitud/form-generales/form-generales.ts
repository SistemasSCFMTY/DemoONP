import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { ESTADOS_NACIMIENTO } from '../../../model/constants/catalogos/estados-nacimiento';
import { GENEROS } from '../../../model/constants/catalogos/generos';
import { coincideConDatos, generarCURP, validarCURP, type DatosCURP } from '../../../services/domain/curp';
import { grupoGenerales } from '../../../services/domain/formularios-expediente';
import { GuardarGenerales } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpFechaTrio } from '../../../ui/onp-fecha-trio/onp-fecha-trio';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpSelect } from '../../../ui/onp-select/onp-select';
import { OnpStatus, type TonoEstado } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Datos generales. Screen 13 (onp_fer_etapa2_pf.html:774).
 *
 * The CURP generates itself from the name, birth date, sex and birth entity
 * (`generarCURPPF`, `:4102`) and stays editable, because RENAPO's homonym and
 * inconvenient-word rules are not derivable and the prospect's real CURP may
 * differ in one character. What the screen does instead of refusing is tell
 * them whether what they typed agrees with what they declared
 * (`validarCURPPF` `:4234`, `validarCoincidenciaCURP` `:4205`).
 *
 * The generator only overwrites a CURP it generated itself. Once the prospect
 * edits the field, later keystrokes in the name do not silently undo their
 * correction — the source clobbers it on every input event.
 *
 * The RFC cross-check compares its first ten characters with the CURP's
 * (`validarRFCPF` `:4310`); it is a group validator, since it reads two
 * controls.
 */
@Component({
  selector: 'onp-form-generales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpField,
    OnpSelect,
    OnpFechaTrio,
    OnpAlert,
    OnpButton,
    OnpStatus,
  ],
  template: `
    <onp-titulo
      texto="Información General"
      lede="Completa todos los campos. Los campos marcados con * son obligatorios."
    />

    <h2 class="mt-4 mb-2 font-heading text-h3 font-bold text-navy-deep">Datos Generales</h2>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <div (input)="regenerar()" (change)="regenerar()">
        <onp-field
          idCampo="pf-apellido-p"
          etiqueta="Apellido paterno"
          marcador="Páez"
          autocompletar="family-name"
          [obligatorio]="true"
          [control]="formulario.controls.apellidoPaterno"
        />
        <onp-field
          idCampo="pf-apellido-m"
          etiqueta="Apellido materno"
          marcador="Esquivel"
          [obligatorio]="true"
          [control]="formulario.controls.apellidoMaterno"
        />
        <onp-field
          idCampo="pf-nombres"
          etiqueta="Nombre(s)"
          marcador="Fernando"
          ayuda="Sin abreviaturas."
          autocompletar="given-name"
          [obligatorio]="true"
          [control]="formulario.controls.nombres"
        />
        <onp-select
          idCampo="pf-genero"
          etiqueta="Género"
          [opciones]="generos"
          [obligatorio]="true"
          [control]="formulario.controls.genero"
        />
        <onp-fecha-trio
          idBase="pf-nac"
          etiqueta="Fecha de nacimiento (DD/MM/AAAA)"
          [obligatorio]="true"
          [grupo]="formulario.controls.nacimiento"
        />
        <onp-select
          idCampo="pf-estado-nac"
          etiqueta="Entidad federativa de nacimiento"
          [opciones]="estados"
          [obligatorio]="true"
          [control]="formulario.controls.entidadNacimiento"
        />
      </div>

      <onp-field
        idCampo="pf-pais-nac"
        etiqueta="País de nacimiento"
        [soloLectura]="true"
        [obligatorio]="true"
        [control]="formulario.controls.paisNacimiento"
      />
      <onp-field
        idCampo="pf-nacionalidad"
        etiqueta="Nacionalidad"
        [soloLectura]="true"
        [obligatorio]="true"
        [control]="formulario.controls.nacionalidad"
      />

      <div (input)="curpEditada()">
        <onp-field
          idCampo="pf-curp"
          etiqueta="CURP (Se genera automáticamente)"
          marcador="PAEF990319HDFRND09"
          [maxlength]="18"
          [obligatorio]="true"
          [detectado]="generadaPorLaApp()"
          [control]="formulario.controls.curp"
        />
      </div>

      <onp-alert tono="info">
        La CURP se genera automáticamente conforme a los datos anteriores. Puedes editarla
        manualmente, pero debe coincidir con los datos proporcionados.
      </onp-alert>

      @if (estadoCurp(); as estado) {
        <onp-status [tono]="estado.tono">{{ estado.texto }}</onp-status>
      }

      <div class="mt-4" (input)="rfcMayusculas()">
        <onp-field
          idCampo="pf-rfc"
          etiqueta="RFC (Opcional)"
          marcador="PAEF990319..."
          [maxlength]="13"
          [control]="formulario.controls.rfc"
        />
      </div>

      @if (estadoRfc(); as estado) {
        <onp-status [tono]="estado.tono">{{ estado.texto }}</onp-status>
      }

      <div class="mt-4">
        <onp-field
          idCampo="pf-fea"
          etiqueta="Número de serie de firma electrónica avanzada (Opcional)"
          [control]="formulario.controls.serieFea"
        />
      </div>

      <onp-button tipo="submit">Continuar</onp-button>
    </form>
  `,
})
export class FormGenerales {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly generos = GENEROS;
  protected readonly estados = ESTADOS_NACIMIENTO;

  /** Rehydrated from the store, so back-navigation restores what was typed. */
  protected readonly formulario = grupoGenerales(
    this.fb,
    this.store.selectSnapshot(SolicitudState.generales),
  );

  /** True while the field still holds what the generator put there. */
  protected readonly generadaPorLaApp = signal(false);

  /** Re-read on every change so the status lines recompute. */
  private readonly version = signal(0);

  private readonly datos = computed<DatosCURP>(() => {
    this.version();
    const v = this.formulario.getRawValue();
    return {
      apellidoPaterno: v.apellidoPaterno,
      apellidoMaterno: v.apellidoMaterno,
      nombres: v.nombres,
      dia: v.nacimiento.dia,
      mes: v.nacimiento.mes,
      anio: v.nacimiento.anio,
      genero: v.genero,
      entidadNacimiento: v.entidadNacimiento,
    };
  });

  protected readonly estadoCurp = computed<{ tono: TonoEstado; texto: string } | null>(() => {
    this.version();
    const curp = this.formulario.controls.curp.value.trim().toUpperCase();
    if (curp.length < 18) return null;

    const estructura = validarCURP(curp);
    if (!estructura.valido) return { tono: 'error', texto: estructura.error };

    const coincidencia = coincideConDatos(curp, this.datos());
    if (!coincidencia.coincide) return { tono: 'error', texto: coincidencia.error };

    return { tono: 'exito', texto: 'CURP válida y coincide' };
  });

  protected readonly estadoRfc = computed<{ tono: TonoEstado; texto: string } | null>(() => {
    this.version();
    const rfc = this.formulario.controls.rfc.value.trim().toUpperCase();
    const curp = this.formulario.controls.curp.value.trim().toUpperCase();
    if (rfc.length < 10 || curp.length < 10) return null;
    return rfc.substring(0, 10) === curp.substring(0, 10)
      ? { tono: 'exito', texto: 'RFC coincide con CURP' }
      : { tono: 'error', texto: 'RFC no coincide con CURP (primeros 10 caracteres)' };
  });

  constructor() {
    // If the store already holds a CURP the app generated, keep treating it
    // as auto until the prospect edits it.
    const guardada = this.formulario.controls.curp.value;
    this.generadaPorLaApp.set(!!guardada && guardada === generarCURP(this.datos()));
    this.formulario.valueChanges.subscribe(() => this.version.update((n) => n + 1));
  }

  /** Called from the name/date/sex/entity block only. */
  protected regenerar(): void {
    const control = this.formulario.controls.curp;
    if (control.value && !this.generadaPorLaApp()) return; // respect a manual edit

    const curp = generarCURP(this.datos());
    if (!curp) return;
    control.setValue(curp);
    this.generadaPorLaApp.set(true);
  }

  protected curpEditada(): void {
    const control = this.formulario.controls.curp;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
    this.generadaPorLaApp.set(arriba === generarCURP(this.datos()));
    this.version.update((n) => n + 1);
  }

  protected rfcMayusculas(): void {
    const control = this.formulario.controls.rfc;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
    this.version.update((n) => n + 1);
  }

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarGenerales(this.formulario.getRawValue()));
    void this.navegacion.avanzar('form-domicilio', 'form-generales');
  }
}
