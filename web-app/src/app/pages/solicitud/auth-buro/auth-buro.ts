import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { BRAND } from '../../../brand.config';
import { NavegacionService } from '../../../core/navegacion-service';
import { GuardarAutorizaciones } from '../../../state/solicitud/solicitud.actions';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpLeyenda } from '../../../ui/onp-leyenda/onp-leyenda';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Autorización Buró de Crédito. Screen 21 (onp_fer_etapa2_pf.html:1567).
 *
 * The Art. 28 LRSIC authorisation, verbatim. The source has
 * `[SOFOM / FINANCIERA]` as a literal placeholder in the legal text; the
 * razón social from `brand.config` goes there instead, because a credit-
 * bureau authorisation that does not name who is authorised to pull the
 * report authorises nobody.
 */
@Component({
  selector: 'onp-auth-buro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpLeyenda, OnpField, OnpCheckbox, OnpButton],
  template: `
    <onp-titulo
      texto="Autorización Buró de Crédito"
      lede="Debes autorizar la consulta a tu historial crediticio."
    />

    <onp-leyenda>
      Autorizo a {{ marca.razonSocial }} lleve a cabo investigaciones sobre mi comportamiento
      Crediticio o, en su caso, el de la empresa a la que represento. Conozco la naturaleza y
      alcance de la información que se solicitará y del uso que se dará. Acepto que este documento
      quede bajo propiedad de {{ marca.razonSocial }} para efectos del control y cumplimiento del
      artículo 28 de la Ley para Regular a las Sociedades de Información Crediticia.
    </onp-leyenda>

    <form [formGroup]="formulario" (ngSubmit)="continuar()">
      <onp-field
        idCampo="buro-nip"
        etiqueta="NIP de confirmación"
        marcador="Ingresa el NIP proporcionado"
        modoEntrada="numeric"
        [maxlength]="6"
        [obligatorio]="true"
        [control]="formulario.controls.nip"
      />

      <onp-checkbox idCampo="auth-buro" [obligatorio]="true" [control]="formulario.controls.autorizo">
        Autorizo la consulta a mi expediente de Buró de Crédito conforme al Artículo 28 LRSIC
      </onp-checkbox>

      <onp-button tipo="submit" [deshabilitado]="!formulario.controls.autorizo.value">
        Continuar
      </onp-button>
    </form>
  `,
})
export class AuthBuro {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly marca = BRAND;

  private readonly guardado = this.store.selectSnapshot(SolicitudState.autorizaciones);

  protected readonly formulario = this.fb.nonNullable.group({
    nip: [this.guardado.buroNip, [Validators.required]],
    autorizo: [this.guardado.buro],
  });

  protected continuar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || !this.formulario.controls.autorizo.value) return;
    this.store.dispatch(
      new GuardarAutorizaciones({ buro: true, buroNip: this.formulario.controls.nip.value }),
    );
    void this.navegacion.avanzar('id-photos', 'auth-buro');
  }
}
