import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { AMBITOS_PEP } from '../../../model/constants/catalogos/ambitos-pep';
import { INSTITUCIONES_PEP } from '../../../model/constants/catalogos/instituciones-pep';
import { aplicarReglasPep, grupoPep, limpiarPep } from '../../../services/domain/formulario-pep';
import { GuardarPepPropio } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpFechaTrio } from '../../../ui/onp-fecha-trio/onp-fecha-trio';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpPepSection } from '../../../ui/onp-pep-section/onp-pep-section';
import { OnpSelect } from '../../../ui/onp-select/onp-select';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Declaratoria de funciones públicas. Screen 18 (onp_fer_etapa2_pf.html:1101).
 *
 * The question is quoted verbatim — it is the regulatory text, and the list
 * of who counts as a PEP is the operative part of it.
 *
 * Required-ness comes from `aplicarReglasPep`, driven by the two answers and
 * nothing else (§8, departure 10). Answering "No" clears what was typed under
 * "Sí", so an office nobody declared cannot reach the expediente.
 */
@Component({
  selector: 'onp-pep-propio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpPepSection,
    OnpCard,
    OnpField,
    OnpSelect,
    OnpFechaTrio,
    OnpCheckbox,
    OnpButton,
    OnpStatus,
  ],
  template: `
    <onp-titulo
      texto="Declaratoria de Funciones Públicas"
      lede="Indica si desempeñas o has desempeñado funciones públicas destacadas."
    />

    <onp-pep-section>
      <p>
        <strong>¿Usted desempeña o ha desempeñado funciones públicas destacadas</strong> en un país
        extranjero o en territorio nacional, considerando entre otros, a los jefes de estado o de
        gobierno, líderes políticos, funcionarios gubernamentales, judiciales o militares de alta
        jerarquía, altos ejecutivos de empresas estatales o funcionarios o miembros Importantes de
        partidos políticos?
      </p>
    </onp-pep-section>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <div class="mb-3" role="radiogroup" aria-labelledby="pep-propio-pregunta">
        <p id="pep-propio-pregunta" class="sr-only">
          ¿Desempeña o ha desempeñado funciones públicas destacadas?
        </p>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 text-label text-text">
          <input
            type="radio"
            name="pep-propio"
            class="size-5 accent-navy"
            [checked]="!aplica()"
            (change)="responder(false)"
          />
          <span>No</span>
        </label>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 text-label text-text">
          <input
            type="radio"
            name="pep-propio"
            class="size-5 accent-navy"
            [checked]="aplica()"
            (change)="responder(true)"
          />
          <span>Sí</span>
        </label>
      </div>

      @if (aplica()) {
        <onp-card>
          <onp-select
            idCampo="pep-propio-ambito"
            etiqueta="Ámbito"
            [opciones]="ambitos"
            [obligatorio]="true"
            [control]="formulario.controls.ambito"
          />
          <onp-select
            idCampo="pep-propio-institucion"
            etiqueta="Institución de la que forma parte"
            [opciones]="instituciones"
            [obligatorio]="true"
            [control]="formulario.controls.institucion"
          />
          <onp-field
            idCampo="pep-propio-puesto"
            etiqueta="Puesto desempeñado"
            marcador="Ej: Diputado Federal, Juez, Gobernador"
            [obligatorio]="true"
            [control]="formulario.controls.puesto"
          />
          <onp-fecha-trio
            idBase="pep-propio-inicio"
            etiqueta="Fecha de inicio (DD/MM/AAAA)"
            [obligatorio]="true"
            [grupo]="formulario.controls.inicio"
          />

          <div (change)="cambioVigencia()">
            <onp-checkbox idCampo="pep-propio-vigente" [control]="formulario.controls.vigente">
              Aún vigente (actualmente en funciones)
            </onp-checkbox>
          </div>

          @if (formulario.controls.vigente.value) {
            <onp-status tono="aviso">
              Marcaste que el cargo sigue vigente, por lo que no se requiere fecha de terminación.
            </onp-status>
          } @else {
            <onp-fecha-trio
              idBase="pep-propio-fin"
              etiqueta="Fecha de terminación (DD/MM/AAAA)"
              [obligatorio]="true"
              [grupo]="formulario.controls.fin"
            />
          }
        </onp-card>
      }

      <onp-button tipo="submit">Continuar</onp-button>
    </form>
  `,
})
export class PepPropio {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly ambitos = AMBITOS_PEP;
  protected readonly instituciones = INSTITUCIONES_PEP;

  private readonly guardado = this.store.selectSnapshot(SolicitudState.pepPropio);
  protected readonly formulario = grupoPep(this.fb, this.guardado, 'propio');

  protected readonly aplica = signal(this.guardado.aplica);

  protected responder(valor: boolean): void {
    this.aplica.set(valor);
    this.formulario.controls.aplica.setValue(valor);
    if (!valor) limpiarPep(this.formulario);
    aplicarReglasPep(this.formulario, 'propio');
  }

  protected cambioVigencia(): void {
    aplicarReglasPep(this.formulario, 'propio');
  }

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarPepPropio(this.formulario.getRawValue()));
    void this.navegacion.avanzar('pep-familia', 'pep-propio');
  }
}
