import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { contrasena, telefono as validadorTelefono } from '../../../services/domain/validadores';
import { formatearTelefono, soloDigitosTelefono } from '../../../services/domain/telefono';
import { EnviarOtp, RegistrarProspecto } from '../../../state/sesion/sesion.actions';
import { PrellenarDesdeRegistro } from '../../../state/solicitud/solicitud.actions';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpFila } from '../../../ui/onp-fila/onp-fila';
import { OnpStatus, type TonoEstado } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Crea tu cuenta. Screen 9 (onp_fer_etapa2_pf.html:623).
 *
 * The name is captured as nombres / apellido paterno / apellido materno, the
 * same three fields `form-generales` has, so that screen arrives prefilled.
 * The source asks for one "Nombre completo" and guesses the split
 * (`registrarProspecto`, `:2560`); a two-word name left `apellidoPaterno`
 * empty and `POST /prospectos` rejected it, so the owner split the field
 * (2026-09-30). The prefill never overwrites something already typed.
 *
 * Registration is what triggers the Resend welcome email (CP-B6).
 * DEMO-DAY: that email only reaches the address owning the Resend account
 * (deviation D8) — type that address on stage.
 */
@Component({
  selector: 'onp-registro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpFila, OnpCheckbox, OnpButton, OnpStatus],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidoPaterno: ['', [Validators.required]],
    apellidoMaterno: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    celular: ['', [Validators.required, validadorTelefono()]],
    password: ['', [Validators.required, contrasena()]],
    acepto: [false, [Validators.requiredTrue]],
  });

  /**
   * The password meter, ported from `medirPassword` (`:2522`) — length first,
   * then the letters-and-digits nudge. It is advice, not a gate: the only
   * hard rule is eight characters, and that lives in the validator.
   */
  protected readonly medidaPassword = computed<{ tono: TonoEstado; texto: string } | null>(() => {
    const valor = this.valorPassword();
    if (!valor) return null;
    if (valor.length < 8) {
      return { tono: 'error', texto: `Muy corta: faltan ${8 - valor.length} caracteres` };
    }
    if (!/[0-9]/.test(valor) || !/[a-zA-Z]/.test(valor)) {
      return { tono: 'aviso', texto: 'Combina letras y números para mayor seguridad' };
    }
    return { tono: 'exito', texto: 'Contraseña aceptable' };
  });

  private readonly valorPassword = signal('');

  constructor() {
    this.formulario.controls.password.valueChanges.subscribe((v) => this.valorPassword.set(v));
  }

  protected formatear(): void {
    const control = this.formulario.controls.celular;
    const formateado = formatearTelefono(control.value);
    if (formateado !== control.value) control.setValue(formateado, { emitEvent: false });
  }

  protected enviar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.enviando()) return;

    const { correo, celular, password } = this.formulario.getRawValue();
    const nombres = this.formulario.controls.nombres.value.trim();
    const apellidoPaterno = this.formulario.controls.apellidoPaterno.value.trim();
    const apellidoMaterno = this.formulario.controls.apellidoMaterno.value.trim();

    this.enviando.set(true);
    this.error.set('');

    this.store
      .dispatch(
        new RegistrarProspecto({
          nombres,
          apellidoPaterno,
          apellidoMaterno,
          correo,
          telefono: soloDigitosTelefono(celular),
          password,
        }),
      )
      .subscribe({
        next: () => {
          this.store.dispatch([
            new PrellenarDesdeRegistro(nombres, apellidoPaterno, apellidoMaterno, correo, celular),
            new EnviarOtp(),
          ]);
          void this.navegacion.avanzar('otp', 'registro');
        },
        error: () => {
          this.enviando.set(false);
          this.error.set('No pudimos crear tu cuenta. Inténtalo de nuevo en un momento.');
        },
      });
  }
}
