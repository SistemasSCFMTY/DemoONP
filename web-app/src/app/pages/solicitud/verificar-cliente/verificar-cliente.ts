import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { CURP_DEMO_CLIENTE } from '../../../model/constants/sesion/curp-demo';
import { curp as validadorCurp } from '../../../services/domain/validadores';
import { VerificarCliente as AccionVerificar } from '../../../state/sesion/sesion.actions';
import { SesionState } from '../../../state/sesion/sesion.state';
import { PrellenarCurp } from '../../../state/solicitud/solicitud.actions';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Verifica tu identidad. Screen 10 (onp_fer_etapa2_pf.html:654).
 *
 * Two jobs on one screen, which is why it did not need a new one:
 *
 *  - Art. 7 fracc. IV — an existing client confirms their data and then gets
 *    a category-3 factor before the flow trusts them.
 *  - **Resume.** Someone who started an application and closed the browser
 *    comes back through here. `POST /clientes/verificar` finds their
 *    expediente, sends a code to the phone already on it, and validating
 *    that code hands back the step they stopped at.
 *
 * The Worker sends the OTP as part of verifying, so this screen does not
 * dispatch `EnviarOtp` afterwards — that would mint a second code and burn
 * the first.
 *
 * The not-found wording is the source's, verbatim (`:2615`).
 */
@Component({
  selector: 'onp-verificar-cliente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpButton, OnpStatus],
  templateUrl: './verificar-cliente.html',
})
export class VerificarCliente {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly curpDemo = CURP_DEMO_CLIENTE;
  protected readonly verificando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    numeroCliente: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    curp: ['', [Validators.required, validadorCurp()]],
  });

  protected mayusculas(): void {
    const control = this.formulario.controls.curp;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
  }

  protected verificar(): void {
    this.formulario.markAllAsTouched();
    if (this.verificando()) return;

    const { curp, numeroCliente, nombre } = this.formulario.getRawValue();

    // Checked before the request rather than after: the CURP is the lookup
    // key, and asking the Worker about a 12-character one is a round trip
    // whose answer we already know.
    if (curp.length !== 18) {
      this.error.set('La CURP debe tener 18 caracteres.');
      return;
    }

    this.error.set('');
    this.verificando.set(true);

    this.store
      .dispatch(
        new AccionVerificar({ numeroCliente, nombreCompleto: nombre.trim(), curp }),
      )
      .subscribe({
        next: () => {
          this.verificando.set(false);
          if (!this.store.selectSnapshot(SesionState.encontrado)) {
            this.error.set(
              'No encontramos un expediente con esos datos. Verifícalos o continúa como cliente nuevo.',
            );
            return;
          }
          // The CURP they just proved is theirs pre-fills form-generales,
          // as the source does at :2617.
          this.store.dispatch(new PrellenarCurp(curp));
          void this.navegacion.avanzar('otp', 'verificar-cliente');
        },
        error: () => {
          this.verificando.set(false);
          this.error.set(
            'No encontramos un expediente con esos datos. Verifícalos o continúa como cliente nuevo.',
          );
        },
      });
  }

  protected noSoyCliente(): void {
    void this.navegacion.avanzar('es-cliente', 'verificar-cliente');
  }
}
