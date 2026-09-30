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
  templateUrl: './pep-familia.html',
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
