import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { AMBITOS_PEP } from '../../../model/constants/catalogos/ambitos-pep';
import { INSTITUCIONES_PEP } from '../../../model/constants/catalogos/instituciones-pep';
import { PARENTESCOS } from '../../../model/constants/catalogos/parentescos';
import { aplicarReglasPep, grupoPep, limpiarPep } from '../../../services/domain/formulario-pep';
import { GuardarPepFamilia } from '../../../state/solicitud/solicitud.actions';
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
 * Funciones públicas de familiares. Screen 19 (onp_fer_etapa2_pf.html:1181).
 *
 * The same rules as `pep-propio`, plus parentesco — which is required only
 * here, and `aplicarReglasPep` knows that from its `tipo` argument rather
 * than from which screen happens to be rendered.
 */
@Component({
  selector: 'onp-pep-familia',
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
      texto="Funciones públicas de familiares"
      lede="Indica si algún familiar cercano desempeña o ha desempeñado funciones públicas destacadas."
    />

    <onp-pep-section>
      <p>
        <strong>¿Algún familiar de usted de hasta segundo grado de consanguinidad o afinidad</strong>
        se encuentra en el supuesto antes mencionado?
      </p>
    </onp-pep-section>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <div class="mb-3" role="radiogroup" aria-labelledby="pep-familia-pregunta">
        <p id="pep-familia-pregunta" class="sr-only">
          ¿Algún familiar hasta segundo grado se encuentra en ese supuesto?
        </p>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 text-label text-text">
          <input
            type="radio"
            name="pep-familia"
            class="size-5 accent-navy"
            [checked]="!aplica()"
            (change)="responder(false)"
          />
          <span>No</span>
        </label>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 text-label text-text">
          <input
            type="radio"
            name="pep-familia"
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
            idCampo="pep-familia-ambito"
            etiqueta="Ámbito"
            [opciones]="ambitos"
            [obligatorio]="true"
            [control]="formulario.controls.ambito"
          />
          <onp-select
            idCampo="pep-familia-institucion"
            etiqueta="Institución de la que forma parte"
            [opciones]="instituciones"
            [obligatorio]="true"
            [control]="formulario.controls.institucion"
          />
          <onp-field
            idCampo="pep-familia-puesto"
            etiqueta="Puesto desempeñado por el familiar"
            marcador="Ej: Diputado Federal, Juez, Gobernador"
            [obligatorio]="true"
            [control]="formulario.controls.puesto"
          />
          <onp-select
            idCampo="pep-familia-parentesco"
            etiqueta="Parentesco"
            [opciones]="parentescos"
            [obligatorio]="true"
            [control]="formulario.controls.parentesco"
          />
          <onp-fecha-trio
            idBase="pep-familia-inicio"
            etiqueta="Fecha de inicio (DD/MM/AAAA)"
            [obligatorio]="true"
            [grupo]="formulario.controls.inicio"
          />

          <div (change)="cambioVigencia()">
            <onp-checkbox idCampo="pep-familia-vigente" [control]="formulario.controls.vigente">
              Aún vigente (actualmente en funciones)
            </onp-checkbox>
          </div>

          @if (formulario.controls.vigente.value) {
            <onp-status tono="aviso">
              Marcaste que el cargo sigue vigente, por lo que no se requiere fecha de terminación.
            </onp-status>
          } @else {
            <onp-fecha-trio
              idBase="pep-familia-fin"
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
export class PepFamilia {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly ambitos = AMBITOS_PEP;
  protected readonly instituciones = INSTITUCIONES_PEP;
  protected readonly parentescos = PARENTESCOS;

  private readonly guardado = this.store.selectSnapshot(SolicitudState.pepFamilia);
  protected readonly formulario = grupoPep(this.fb, this.guardado, 'familia');

  protected readonly aplica = signal(this.guardado.aplica);

  protected responder(valor: boolean): void {
    this.aplica.set(valor);
    this.formulario.controls.aplica.setValue(valor);
    if (!valor) limpiarPep(this.formulario);
    aplicarReglasPep(this.formulario, 'familia');
  }

  protected cambioVigencia(): void {
    aplicarReglasPep(this.formulario, 'familia');
  }

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.store.dispatch(new GuardarPepFamilia(this.formulario.getRawValue()));
    void this.navegacion.avanzar('declaratoria', 'pep-familia');
  }
}
