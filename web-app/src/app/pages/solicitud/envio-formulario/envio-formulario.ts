import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { GuardarAutorizaciones } from '../../../state/solicitud/solicitud.actions';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Envío del formulario. Screen 17 (onp_fer_etapa2_pf.html:1074).
 *
 * Art. 7 fracc. III: submitting the data is itself the authorisation to
 * record the prospect's voice and image later. The quoted manifestación is
 * verbatim, quotation marks included, because it is the operative text.
 *
 * "Enviar y continuar" is gated on the checkbox, as in the source.
 */
@Component({
  selector: 'onp-envio-formulario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpCard, OnpAlert, OnpCheckbox, OnpButton],
  template: `
    <onp-titulo
      texto="Envío de tu información"
      lede="Terminaste de capturar tus datos de identificación. Antes de enviarlos, lee lo siguiente."
    />

    <onp-card>
      <p class="text-body leading-loose text-text">
        "El envío de la presente información constituye una autorización para que tu voz, imagen o,
        en su caso, ambas sean grabadas para concluir con el proceso de identificación".
      </p>
    </onp-card>

    <onp-alert tono="info">
      <strong>¿Qué significa esto?</strong>
      <span class="mt-1.5 block leading-relaxed">
        Al enviar tus datos autorizas que, más adelante en este mismo proceso, se grabe tu imagen y
        tu voz. Esa grabación forma parte del expediente de identificación y se conserva conforme a
        la normativa aplicable.
      </span>
    </onp-alert>

    <onp-checkbox idCampo="auth-recording" [obligatorio]="true" [control]="autorizo">
      He leído la manifestación anterior y autorizo el envío de mi información en los términos
      señalados.
    </onp-checkbox>

    <onp-button [deshabilitado]="!autorizo.value" (pulsar)="continuar()">
      Enviar y continuar
    </onp-button>
    <onp-button variante="secondary" (pulsar)="regresar()">
      Regresar y revisar mis datos
    </onp-button>
  `,
})
export class EnvioFormulario {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly autorizo = this.fb.nonNullable.control(false);

  protected continuar(): void {
    if (!this.autorizo.value) return;
    this.store.dispatch(new GuardarAutorizaciones({ grabacion: true }));
    void this.navegacion.avanzar('pep-propio', 'envio-formulario');
  }

  protected regresar(): void {
    void this.navegacion.regresar();
  }
}
