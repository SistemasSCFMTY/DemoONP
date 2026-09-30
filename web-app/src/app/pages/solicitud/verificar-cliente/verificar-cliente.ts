import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { CURP_DEMO_CLIENTE } from '../../../model/constants/sesion/curp-demo';
import { validarCURP } from '../../../services/domain/curp';
import { curp as validadorCurp } from '../../../services/domain/validadores';
import { EnviarOtp, VerificarCliente as AccionVerificar } from '../../../state/sesion/sesion.actions';
import { PrellenarCurp } from '../../../state/solicitud/solicitud.actions';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Verifica tu identidad. Screen 10 (onp_fer_etapa2_pf.html:654).
 *
 * Art. 7 fracc. IV: an existing client confirms their data and then gets a
 * category-3 factor (the OTP). There is no verification endpoint in
 * 02-api-contract.md, so this stays local, as the source's non-server mode
 * is (`verificarCliente`, `:2575`): a structurally valid CURP passes.
 *
 * The "Modo demostración" tip stays verbatim — and see `CURP_DEMO_CLIENTE`
 * for why the CURP it names has to be accepted by identity as well as by
 * validation.
 */
@Component({
  selector: 'onp-verificar-cliente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpButton, OnpStatus],
  template: `
    <onp-titulo texto="Verifica tu identidad" lede="Confirma tus datos para localizar tu expediente." />

    <p
      class="mb-3.5 rounded-control border border-dashed border-gold-light bg-surface-warning px-3 py-2.5 text-status leading-relaxed text-warning"
    >
      <strong>Modo demostración:</strong> escribe cualquier número de cliente y la CURP
      <code class="font-mono">{{ curpDemo }}</code> para simular un cliente registrado.
    </p>

    <form [formGroup]="formulario" (ngSubmit)="verificar()">
      <onp-field
        idCampo="ver-num-cliente"
        etiqueta="Número de cliente"
        marcador="Aparece en tu contrato o estado de cuenta"
        [obligatorio]="true"
        [control]="formulario.controls.numeroCliente"
      />

      <onp-field
        idCampo="ver-nombre"
        etiqueta="Nombre completo"
        marcador="Como aparece en tu contrato"
        [obligatorio]="true"
        [control]="formulario.controls.nombre"
      />

      <div (input)="mayusculas()">
        <onp-field
          idCampo="ver-curp"
          etiqueta="CURP"
          marcador="18 caracteres"
          [maxlength]="18"
          [obligatorio]="true"
          [control]="formulario.controls.curp"
        />
      </div>

      <p class="mb-2.5 text-status leading-relaxed text-text-soft">
        Al verificar tus datos te enviaremos un código de un solo uso a tu teléfono registrado,
        conforme a las Disposiciones de Carácter General aplicables.
      </p>

      @if (error()) {
        <onp-status tono="error">{{ error() }}</onp-status>
      }

      <onp-button tipo="submit" [deshabilitado]="verificando()">
        {{ verificando() ? 'Verificando…' : 'Verificar' }}
      </onp-button>
      <onp-button variante="secondary" (pulsar)="noSoyCliente()">No soy cliente</onp-button>
    </form>
  `,
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
    const { curp, numeroCliente, nombre } = this.formulario.getRawValue();

    if (curp.length !== 18) {
      this.error.set('La CURP debe tener 18 caracteres.');
      return;
    }

    // The demo fixture is accepted by identity because it fails its own
    // check digit — see CURP_DEMO_CLIENTE. Everything else must validate.
    const encontrado = curp === CURP_DEMO_CLIENTE || validarCURP(curp).valido;
    if (!encontrado) {
      this.error.set(
        'No encontramos un expediente con esos datos. Verifícalos o continúa como cliente nuevo.',
      );
      return;
    }

    this.error.set('');
    this.verificando.set(true);
    this.store.dispatch([
      new AccionVerificar(numeroCliente, nombre, curp),
      new PrellenarCurp(curp),
      new EnviarOtp(),
    ]);
    void this.navegacion.avanzar('otp', 'verificar-cliente');
  }

  protected noSoyCliente(): void {
    void this.navegacion.avanzar('es-cliente', 'verificar-cliente');
  }
}
