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
  templateUrl: './pep-propio.html',
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
