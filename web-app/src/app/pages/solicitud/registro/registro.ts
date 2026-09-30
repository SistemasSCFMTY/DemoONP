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
import { OnpStatus, type TonoEstado } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Crea tu cuenta. Screen 9 (onp_fer_etapa2_pf.html:623).
 *
 * The name is captured as one field here, as the source does, and split into
 * nombres / apellido paterno / apellido materno on submit so `form-generales`
 * does not ask for it again (`registrarProspecto`, `:2560`). The split assumes
 * the last two words are the surnames, which is the source's assumption and is
 * right for most Mexican names; `form-generales` is where it gets corrected,
 * and the prefill never overwrites something already typed.
 *
 * Registration is what triggers the Resend welcome email (CP-B6).
 * DEMO-DAY: that email only reaches the address owning the Resend account
 * (deviation D8) — type that address on stage.
 */
@Component({
  selector: 'onp-registro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, OnpTitulo, OnpField, OnpCheckbox, OnpButton, OnpStatus],
  template: `
    <onp-titulo
      texto="Crea tu cuenta"
      lede="Con estos datos podrás retomar tu solicitud si algo se interrumpe."
    />

    <form [formGroup]="formulario" (ngSubmit)="enviar()">
      <onp-field
        idCampo="reg-nombre"
        etiqueta="Nombre completo"
        marcador="Como aparece en tu identificación"
        autocompletar="name"
        [obligatorio]="true"
        [control]="formulario.controls.nombre"
      />

      <onp-field
        idCampo="reg-correo"
        etiqueta="Correo electrónico"
        tipo="email"
        marcador="tucorreo@ejemplo.com"
        autocompletar="email"
        [obligatorio]="true"
        [control]="formulario.controls.correo"
      />

      <div (input)="formatear()">
        <onp-field
          idCampo="reg-celular"
          etiqueta="Teléfono celular"
          tipo="tel"
          marcador="81 1234 5678"
          modoEntrada="numeric"
          autocompletar="tel-national"
          [maxlength]="14"
          [obligatorio]="true"
          [control]="formulario.controls.celular"
        />
      </div>

      <onp-field
        idCampo="reg-pass"
        etiqueta="Contraseña"
        tipo="password"
        marcador="Mínimo 8 caracteres"
        autocompletar="new-password"
        [obligatorio]="true"
        [control]="formulario.controls.password"
      />

      @if (medidaPassword(); as medida) {
        <onp-status [tono]="medida.tono">{{ medida.texto }}</onp-status>
      }

      <onp-checkbox
        idCampo="reg-acepto"
        [obligatorio]="true"
        [control]="formulario.controls.acepto"
      >
        He leído y acepto el <b>Aviso de Privacidad</b> y los <b>Términos y Condiciones</b>.
        Autorizo el tratamiento de mis datos personales, incluidos los biométricos, para los fines
        descritos.
      </onp-checkbox>

      @if (error()) {
        <onp-status tono="error">{{ error() }}</onp-status>
      }

      <onp-button tipo="submit" [deshabilitado]="enviando()">
        {{ enviando() ? 'Creando tu cuenta…' : 'Crear cuenta y continuar' }}
      </onp-button>
    </form>
  `,
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
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

    const { nombre, correo, celular, password } = this.formulario.getRawValue();
    const partes = nombre.trim().split(/\s+/);
    const apellidoMaterno = partes.length >= 3 ? partes[partes.length - 1] : '';
    const apellidoPaterno = partes.length >= 3 ? partes[partes.length - 2] : '';
    const nombres = partes.length >= 3 ? partes.slice(0, partes.length - 2).join(' ') : nombre.trim();

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
