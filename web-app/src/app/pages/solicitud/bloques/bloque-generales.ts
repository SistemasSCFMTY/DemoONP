import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ESTADOS_NACIMIENTO } from '../../../model/constants/catalogos/estados-nacimiento';
import { GENEROS } from '../../../model/constants/catalogos/generos';
import {
  coincideConDatos,
  generarCURP,
  validarCURP,
  type DatosCURP,
} from '../../../services/domain/curp';
import type { GrupoGenerales } from '../../../services/domain/formularios-expediente';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpFechaTrio } from '../../../ui/onp-fecha-trio/onp-fecha-trio';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpFila } from '../../../ui/onp-fila/onp-fila';
import { OnpSelect } from '../../../ui/onp-select/onp-select';
import { OnpStatus, type TonoEstado } from '../../../ui/onp-status/onp-status';

/**
 * The identity fields, and the CURP behaviour that goes with them.
 *
 * Used twice: by `form-generales` for the applicant, and by `declaratoria`
 * for the propietario real. In the source those are two near-identical blocks
 * of markup distinguished only by a `pf_` / `pr_` prefix, with two copies of
 * the CURP generator and two copies of its validation — and they have already
 * drifted. One component, two `idPrefijo` values.
 *
 * The CURP generates itself from the name, birth date, sex and birth entity
 * (`generarCURPPF`, onp_fer_etapa2_pf.html:4102) and stays editable, because
 * RENAPO's homonym and inconvenient-word rules are not derivable and the
 * prospect's real CURP may differ by a character. **It only ever overwrites a
 * CURP it generated itself** — the source clobbers the field on every
 * keystroke in the name and silently undoes a manual correction.
 */
@Component({
  selector: 'onp-bloque-generales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpField,
    OnpSelect,
    OnpFechaTrio,
    OnpFila,
    OnpAlert,
    OnpStatus,
  ],
  templateUrl: './bloque-generales.html',
})
export class BloqueGenerales {
  readonly grupo = input.required<GrupoGenerales>();
  /** `pf` for the applicant, `pr` for the propietario real. Keeps the two
   *  sets of element ids distinct when both are on one page. */
  readonly idPrefijo = input.required<string>();

  protected readonly generos = GENEROS;
  protected readonly estados = ESTADOS_NACIMIENTO;

  /** True while the field still holds what the generator put there. */
  protected readonly generadaPorLaApp = signal(false);

  /** Bumped on every edit so the status lines recompute. */
  private readonly version = signal(0);
  private inicializado = false;

  protected id(sufijo: string): string {
    return `${this.idPrefijo()}-${sufijo}`;
  }

  private datos(): DatosCURP {
    const v = this.grupo().getRawValue();
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
  }

  protected readonly estadoCurp = computed<{ tono: TonoEstado; texto: string } | null>(() => {
    this.version();
    const grupo = this.grupo();
    this.sincronizarOrigen();

    const curp = grupo.controls.curp.value.trim().toUpperCase();
    if (curp.length < 18) return null;

    const estructura = validarCURP(curp);
    if (!estructura.valido) return { tono: 'error', texto: estructura.error };

    const coincidencia = coincideConDatos(curp, this.datos());
    if (!coincidencia.coincide) return { tono: 'error', texto: coincidencia.error };

    return { tono: 'exito', texto: 'CURP válida y coincide' };
  });

  protected readonly estadoRfc = computed<{ tono: TonoEstado; texto: string } | null>(() => {
    this.version();
    const v = this.grupo().getRawValue();
    const rfc = v.rfc.trim().toUpperCase();
    const curp = v.curp.trim().toUpperCase();
    if (rfc.length < 10 || curp.length < 10) return null;
    return rfc.substring(0, 10) === curp.substring(0, 10)
      ? { tono: 'exito', texto: 'RFC coincide con CURP' }
      : { tono: 'error', texto: 'RFC no coincide con CURP (primeros 10 caracteres)' };
  });

  /** A CURP restored from the store counts as auto-generated only if it is
   *  exactly what the generator would produce from the same data. */
  private sincronizarOrigen(): void {
    if (this.inicializado) return;
    this.inicializado = true;
    const guardada = this.grupo().controls.curp.value;
    this.generadaPorLaApp.set(!!guardada && guardada === generarCURP(this.datos()));
  }

  /** Called from the name / date / sex / entity block only. */
  protected regenerar(): void {
    const control = this.grupo().controls.curp;
    if (control.value && !this.generadaPorLaApp()) return; // respect a manual edit

    const curp = generarCURP(this.datos());
    if (!curp) return;
    control.setValue(curp);
    this.generadaPorLaApp.set(true);
    this.version.update((n) => n + 1);
  }

  protected curpEditada(): void {
    const control = this.grupo().controls.curp;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
    this.generadaPorLaApp.set(arriba === generarCURP(this.datos()));
    this.version.update((n) => n + 1);
  }

  protected rfcMayusculas(): void {
    const control = this.grupo().controls.rfc;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
    this.version.update((n) => n + 1);
  }
}
