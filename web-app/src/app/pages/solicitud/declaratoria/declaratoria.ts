import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { ESTADOS } from '../../../model/constants/catalogos/estados';
import { ESTADOS_NACIMIENTO } from '../../../model/constants/catalogos/estados-nacimiento';
import { GENEROS } from '../../../model/constants/catalogos/generos';
import { VIALIDADES } from '../../../model/constants/catalogos/vialidades';
import { coincideConDatos, generarCURP, validarCURP, type DatosCURP } from '../../../services/domain/curp';
import {
  grupoContacto,
  grupoDomicilio,
  grupoGenerales,
  grupoLaborales,
} from '../../../services/domain/formularios-expediente';
import { formatearTelefono } from '../../../services/domain/telefono';
import { GuardarDeclaratoria } from '../../../state/solicitud/solicitud.actions';
import { PROPIETARIO_VACIO } from '../../../state/solicitud/solicitud.model';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpFechaTrio } from '../../../ui/onp-fecha-trio/onp-fecha-trio';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpSelect } from '../../../ui/onp-select/onp-select';
import { OnpStatus, type TonoEstado } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Declaratoria de propietario real. Screen 20 (onp_fer_etapa2_pf.html:1278).
 *
 * The longest screen in the flow: declaring you act for a third party opens
 * the whole identity form again for that person — generales, domicilio,
 * contacto and laborales, the `pr_*` fields of the payload.
 *
 * **The branch is the conditional-required-ness case that matters most.** In
 * the source, the propietario real's twenty-odd required fields are required
 * only while their container is displayed (`estaVisible`, `:3987`). Here the
 * four groups are created when "tercero" is chosen and discarded when it is
 * not, so the validators exist exactly when the declaration says they should
 * — and a propietario real nobody declared cannot reach the payload, because
 * there is no form holding their data (§8, departure 10).
 *
 * The four groups are the same factories the solicitante's own screens use,
 * so the two cannot drift.
 */
@Component({
  selector: 'onp-declaratoria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpCard,
    OnpAlert,
    OnpField,
    OnpSelect,
    OnpFechaTrio,
    OnpButton,
    OnpStatus,
  ],
  template: `
    <onp-titulo
      texto="Declaratoria Propietario Real"
      lede="Indica si actúas a nombre propio o si el crédito es para un tercero (propietario real)."
    />

    <onp-card>
      <div role="radiogroup" aria-labelledby="declaratoria-pregunta">
        <p id="declaratoria-pregunta" class="sr-only">¿Por cuenta de quién actúas?</p>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 text-label text-text">
          <input
            type="radio"
            name="declaratoria"
            class="size-5 shrink-0 accent-navy"
            [checked]="!esTercero()"
            (change)="elegir('propio')"
          />
          <span>Actúo a nombre y cuenta propia</span>
        </label>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 text-label text-text">
          <input
            type="radio"
            name="declaratoria"
            class="size-5 shrink-0 accent-navy"
            [checked]="esTercero()"
            (change)="elegir('tercero')"
          />
          <span>Actúo por cuenta de un tercero (propietario real)</span>
        </label>
      </div>
    </onp-card>

    @if (esTercero() && grupos(); as g) {
      <onp-alert tono="info">
        Manifestaste actuar por cuenta de un tercero. Completa la información del propietario real.
        Los campos marcados con * son obligatorios.
      </onp-alert>

      <h2 class="mt-4 mb-2 font-heading text-h3 font-bold text-navy-deep">Datos Generales</h2>

      <form [formGroup]="g.generales">
        <div (input)="regenerarCurp()" (change)="regenerarCurp()">
          <onp-field
            idCampo="pr-apellido-p"
            etiqueta="Apellido paterno"
            marcador="Páez"
            [obligatorio]="true"
            [control]="g.generales.controls.apellidoPaterno"
          />
          <onp-field
            idCampo="pr-apellido-m"
            etiqueta="Apellido materno"
            marcador="Esquivel"
            [obligatorio]="true"
            [control]="g.generales.controls.apellidoMaterno"
          />
          <onp-field
            idCampo="pr-nombres"
            etiqueta="Nombre(s)"
            marcador="Fernando"
            ayuda="Sin abreviaturas."
            [obligatorio]="true"
            [control]="g.generales.controls.nombres"
          />
          <onp-select
            idCampo="pr-genero"
            etiqueta="Género"
            [opciones]="generos"
            [obligatorio]="true"
            [control]="g.generales.controls.genero"
          />
          <onp-fecha-trio
            idBase="pr-nac"
            etiqueta="Fecha de nacimiento (DD/MM/AAAA)"
            [obligatorio]="true"
            [grupo]="g.generales.controls.nacimiento"
          />
          <onp-select
            idCampo="pr-estado-nac"
            etiqueta="Entidad federativa de nacimiento"
            [opciones]="estadosNacimiento"
            [obligatorio]="true"
            [control]="g.generales.controls.entidadNacimiento"
          />
        </div>

        <onp-field
          idCampo="pr-pais-nac"
          etiqueta="País de nacimiento"
          [soloLectura]="true"
          [obligatorio]="true"
          [control]="g.generales.controls.paisNacimiento"
        />
        <onp-field
          idCampo="pr-nacionalidad"
          etiqueta="Nacionalidad"
          [soloLectura]="true"
          [obligatorio]="true"
          [control]="g.generales.controls.nacionalidad"
        />

        <div (input)="curpEditada()">
          <onp-field
            idCampo="pr-curp"
            etiqueta="CURP (Se genera automáticamente)"
            marcador="PAEF990319HDFRND09"
            [maxlength]="18"
            [obligatorio]="true"
            [control]="g.generales.controls.curp"
          />
        </div>

        <onp-alert tono="info">
          La CURP se genera automáticamente conforme a los datos anteriores. Puedes editarla
          manualmente, pero debe coincidir con los datos proporcionados.
        </onp-alert>

        @if (estadoCurp(); as estado) {
          <onp-status [tono]="estado.tono">{{ estado.texto }}</onp-status>
        }

        <div class="mt-4" (input)="rfcMayusculas()">
          <onp-field
            idCampo="pr-rfc"
            etiqueta="RFC (Opcional)"
            marcador="PAEF990319..."
            [maxlength]="13"
            [control]="g.generales.controls.rfc"
          />
        </div>

        <div class="mt-4">
          <onp-field
            idCampo="pr-fea"
            etiqueta="Número de serie de firma electrónica avanzada (Opcional)"
            [control]="g.generales.controls.serieFea"
          />
        </div>
      </form>

      <h2 class="mt-5 mb-2 font-heading text-h3 font-bold text-navy-deep">
        Domicilio de Residencia
      </h2>

      <form [formGroup]="g.domicilio">
        <onp-select
          idCampo="pr-tipo-vialidad"
          etiqueta="Tipo de vialidad"
          [opciones]="vialidades"
          [obligatorio]="true"
          [control]="g.domicilio.controls.tipoVialidad"
        />
        <onp-field
          idCampo="pr-nombre-vialidad"
          etiqueta="Nombre de la vialidad"
          marcador="Ej: Benito Juárez, Paseo de la Reforma"
          [obligatorio]="true"
          [control]="g.domicilio.controls.nombreVialidad"
        />
        <onp-field
          idCampo="pr-numero-exterior"
          etiqueta="Número exterior"
          marcador="Ej: 123"
          [obligatorio]="true"
          [control]="g.domicilio.controls.numeroExterior"
        />
        <onp-field
          idCampo="pr-numero-interior"
          etiqueta="Número interior (Opcional)"
          marcador="Ej: Apto 5B, Depto 301"
          [control]="g.domicilio.controls.numeroInterior"
        />

        <fieldset class="mb-3.5 rounded-control border-0 bg-surface-muted p-3">
          <legend class="mb-2.5 text-status text-text-soft">
            <strong>Entre (Opcional)</strong> — Indica las vialidades perpendiculares
          </legend>
          <onp-field
            idCampo="pr-entre-1"
            etiqueta="Entre:"
            marcador="Ej: Avenida Paseo"
            [control]="g.domicilio.controls.entre1"
          />
          <onp-field
            idCampo="pr-entre-2"
            etiqueta="y:"
            marcador="Ej: Calle Benito"
            [control]="g.domicilio.controls.entre2"
          />
        </fieldset>

        <onp-field
          idCampo="pr-codigo-postal"
          etiqueta="Código postal"
          marcador="Ej: 64000"
          modoEntrada="numeric"
          [maxlength]="5"
          [obligatorio]="true"
          [control]="g.domicilio.controls.codigoPostal"
        />
        <onp-field
          idCampo="pr-colonia"
          etiqueta="Colonia"
          marcador="Ej: Centro, Del Valle"
          [obligatorio]="true"
          [control]="g.domicilio.controls.colonia"
        />
        <onp-field
          idCampo="pr-municipio"
          etiqueta="Municipio o alcaldía"
          marcador="Ej: Monterrey"
          [obligatorio]="true"
          [control]="g.domicilio.controls.municipio"
        />
        <onp-field
          idCampo="pr-ciudad"
          etiqueta="Ciudad"
          marcador="Ej: Monterrey"
          [obligatorio]="true"
          [control]="g.domicilio.controls.ciudad"
        />
        <onp-select
          idCampo="pr-estado"
          etiqueta="Entidad Federativa"
          [opciones]="estados"
          [obligatorio]="true"
          [control]="g.domicilio.controls.entidadFederativa"
        />
        <onp-field
          idCampo="pr-pais"
          etiqueta="País"
          [soloLectura]="true"
          [obligatorio]="true"
          [control]="g.domicilio.controls.pais"
        />
      </form>

      <h2 class="mt-5 mb-2 font-heading text-h3 font-bold text-navy-deep">Datos de Contacto</h2>

      <form [formGroup]="g.contacto">
        <div (input)="formatearTelefonos()">
          <onp-field
            idCampo="pr-telefono"
            etiqueta="Teléfono celular"
            tipo="tel"
            marcador="81 1234 5678"
            modoEntrada="numeric"
            [maxlength]="14"
            [obligatorio]="true"
            [control]="g.contacto.controls.telefonoCelular"
          />
          <onp-field
            idCampo="pr-telefono-fijo"
            etiqueta="Teléfono fijo (Opcional)"
            tipo="tel"
            marcador="81 5555 5555"
            modoEntrada="numeric"
            [maxlength]="14"
            [control]="g.contacto.controls.telefonoFijo"
          />
        </div>
        <onp-field
          idCampo="pr-email"
          etiqueta="Correo electrónico"
          tipo="email"
          marcador="fernando@example.com"
          [obligatorio]="true"
          [control]="g.contacto.controls.correo"
        />
      </form>

      <h2 class="mt-5 mb-2 font-heading text-h3 font-bold text-navy-deep">Datos Laborales</h2>

      <form [formGroup]="g.laborales">
        <onp-field
          idCampo="pr-empleo"
          etiqueta="Empleo"
          marcador="Ej: Empleado privado, Independiente, Desempleado"
          [obligatorio]="true"
          [control]="g.laborales.controls.empleo"
        />
        <onp-field
          idCampo="pr-puesto"
          etiqueta="Puesto"
          marcador="Ej: Gerente, Ingeniero, Contador"
          [obligatorio]="true"
          [control]="g.laborales.controls.puesto"
        />
        <onp-field
          idCampo="pr-empresa"
          etiqueta="Nombre de la empresa (Opcional)"
          marcador="Ej: Acme Corporation"
          [control]="g.laborales.controls.empresa"
        />
        <onp-field
          idCampo="pr-giro-empresa"
          etiqueta="Giro de la empresa (Opcional)"
          marcador="Ej: Tecnología, Manufactura, Servicios"
          [control]="g.laborales.controls.giroEmpresa"
        />
        <onp-field
          idCampo="pr-antiguedad"
          etiqueta="Antigüedad laboral (Opcional)"
          marcador="Ej: 5 años, 2 meses"
          [control]="g.laborales.controls.antiguedad"
        />
        <onp-field
          idCampo="pr-ingreso-mensual"
          etiqueta="Ingreso mensual aproximado (Opcional)"
          marcador="Ej: $15,000"
          [control]="g.laborales.controls.ingresoMensual"
        />
        <onp-field
          idCampo="pr-otros-ingresos"
          etiqueta="Otros ingresos (Opcional)"
          marcador="Ej: Rentas, inversiones"
          [control]="g.laborales.controls.otrosIngresos"
        />
      </form>
    }

    <onp-button (pulsar)="continuar()">Continuar</onp-button>
  `,
})
export class Declaratoria {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly generos = GENEROS;
  protected readonly estadosNacimiento = ESTADOS_NACIMIENTO;
  protected readonly estados = ESTADOS;
  protected readonly vialidades = VIALIDADES;

  protected readonly esTercero = signal(
    this.store.selectSnapshot(SolicitudState.actuaPorCuenta) === 'tercero',
  );

  /**
   * The four groups exist only while "tercero" is the answer. Creating and
   * discarding them IS the conditional requirement — there is no hidden form
   * whose validators have to be remembered or whose values could leak into
   * the payload.
   */
  protected readonly grupos = signal(this.construir());

  private readonly version = signal(0);

  protected readonly estadoCurp = computed<{ tono: TonoEstado; texto: string } | null>(() => {
    this.version();
    const g = this.grupos();
    if (!g) return null;
    const curp = g.generales.controls.curp.value.trim().toUpperCase();
    if (curp.length < 18) return null;

    const estructura = validarCURP(curp);
    if (!estructura.valido) return { tono: 'error', texto: estructura.error };

    const coincidencia = coincideConDatos(curp, this.datosCurp());
    if (!coincidencia.coincide) return { tono: 'error', texto: coincidencia.error };

    return { tono: 'exito', texto: 'CURP válida y coincide' };
  });

  protected elegir(cuenta: 'propio' | 'tercero'): void {
    this.esTercero.set(cuenta === 'tercero');
    this.grupos.set(this.construir());
    this.version.update((n) => n + 1);
  }

  protected regenerarCurp(): void {
    const g = this.grupos();
    if (!g) return;
    const control = g.generales.controls.curp;
    const curp = generarCURP(this.datosCurp());
    if (curp && (!control.value || control.value === curp)) control.setValue(curp);
    this.version.update((n) => n + 1);
  }

  protected curpEditada(): void {
    const g = this.grupos();
    if (!g) return;
    const control = g.generales.controls.curp;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
    this.version.update((n) => n + 1);
  }

  protected rfcMayusculas(): void {
    const g = this.grupos();
    if (!g) return;
    const control = g.generales.controls.rfc;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
  }

  protected formatearTelefonos(): void {
    const g = this.grupos();
    if (!g) return;
    for (const campo of ['telefonoCelular', 'telefonoFijo'] as const) {
      const control = g.contacto.controls[campo];
      const formateado = formatearTelefono(control.value);
      if (formateado !== control.value) control.setValue(formateado, { emitEvent: false });
    }
  }

  protected continuar(): void {
    const g = this.grupos();

    if (!this.esTercero() || !g) {
      this.store.dispatch(new GuardarDeclaratoria('propio', null));
      void this.navegacion.avanzar('auth-buro', 'declaratoria');
      return;
    }

    for (const grupo of [g.generales, g.domicilio, g.contacto, g.laborales]) {
      grupo.markAllAsTouched();
    }
    if (
      g.generales.invalid ||
      g.domicilio.invalid ||
      g.contacto.invalid ||
      g.laborales.invalid
    ) {
      return;
    }

    this.store.dispatch(
      new GuardarDeclaratoria('tercero', {
        generales: g.generales.getRawValue(),
        domicilio: g.domicilio.getRawValue(),
        contacto: g.contacto.getRawValue(),
        laborales: g.laborales.getRawValue(),
      }),
    );
    void this.navegacion.avanzar('auth-buro', 'declaratoria');
  }

  private construir() {
    if (!this.esTercero()) return null;
    const guardado = this.store.selectSnapshot(SolicitudState.propietario) ?? PROPIETARIO_VACIO;
    return {
      generales: grupoGenerales(this.fb, guardado.generales),
      domicilio: grupoDomicilio(this.fb, guardado.domicilio),
      contacto: grupoContacto(this.fb, guardado.contacto),
      laborales: grupoLaborales(this.fb, guardado.laborales),
    };
  }

  private datosCurp(): DatosCURP {
    const g = this.grupos();
    const v = g
      ? g.generales.getRawValue()
      : { ...PROPIETARIO_VACIO.generales, nacimiento: PROPIETARIO_VACIO.generales.nacimiento };
    return {
      apellidoPaterno: v.apellidoPaterno,
      apellidoMaterno: v.apellidoMaterno,
      nombres: v.nombres,
      dia: v.nacimiento.dia,
      mes: v.nacimiento.mes,
      anio: v.nacimiento.anio,
      genero: v.genero,
      entidadNacimiento: v.entidadNacimiento,
    };
  }
}
