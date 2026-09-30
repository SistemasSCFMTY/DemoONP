import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import type { Ubicacion } from '../../../model/interfaces/ubicacion';
import { Geolocalizacion } from '../../../services/domain/geolocalizacion';
import { PermisoUbicacion } from '../../../state/identidad/identidad.actions';
import { GuardarAutorizaciones } from '../../../state/solicitud/solicitud.actions';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

type EstadoGps = 'inicial' | 'pidiendo' | 'concedido' | 'rechazado';

/**
 * Autorización de geolocalización. Screen 12 (onp_fer_etapa2_pf.html:718).
 *
 * The consent checkbox gates the request button, and only a successful
 * capture unlocks "Continuar" — the source's behaviour (`:2288`), and the
 * copy says outright that the permission is indispensable.
 *
 * **Denial does not dead-end.** A refusal shows what to change in the device
 * settings and offers a retry, and the request button comes back enabled.
 * The prospect can loop as many times as they need.
 */
@Component({
  selector: 'onp-auth-location',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpCard,
    OnpAlert,
    OnpCheckbox,
    OnpButton,
    OnpStatus,
  ],
  template: `
    <onp-titulo
      texto="Autorización de geolocalización"
      lede="Necesitamos conocer tu ubicación durante el proceso de identificación."
    />

    <onp-card>
      <p class="mb-2.5 text-body font-semibold text-text">¿Para qué la usamos?</p>
      <p class="mb-2 text-label leading-relaxed text-text-soft">
        Se registrará tu ubicación en los momentos clave del proceso: al autorizar, al fotografiar
        tu identificación, al grabar el video y al firmar.
      </p>
      <p class="text-label leading-relaxed text-text-soft">
        Forma parte de las evidencias del expediente y es necesaria para la celebración de las
        operaciones que realices.
      </p>
    </onp-card>

    <onp-alert tono="warning">
      <strong>Este permiso es indispensable.</strong> Sin él no es posible continuar con tu
      solicitud de crédito de manera no presencial.
    </onp-alert>

    <onp-checkbox idCampo="auth-location" [obligatorio]="true" [control]="autorizo">
      Autorizo el acceso a mi ubicación para validar los datos que he proporcionado y como parte de
      las evidencias del proceso de identificación.
    </onp-checkbox>

    @if (estado() !== 'concedido') {
      <onp-button
        variante="secondary"
        [deshabilitado]="!autorizo.value || estado() === 'pidiendo'"
        (pulsar)="pedirPermiso()"
      >
        {{ estado() === 'rechazado' ? 'Intentar de nuevo' : 'Permitir ubicación' }}
      </onp-button>
    }

    @switch (estado()) {
      @case ('pidiendo') {
        <onp-status tono="pendiente">Obteniendo tu ubicación…</onp-status>
      }
      @case ('concedido') {
        <onp-status tono="exito">Ubicación registrada correctamente</onp-status>
      }
      @case ('rechazado') {
        <onp-status tono="error">No fue posible obtener tu ubicación</onp-status>
      }
    }

    @if (ubicacion(); as u) {
      <onp-card>
        <p class="mb-1.5 text-status font-semibold text-gold">Ubicación registrada</p>
        <p class="text-label tabular-nums text-text-soft">{{ coordenadas() }}</p>
      </onp-card>
    }

    @if (estado() === 'rechazado') {
      <onp-alert tono="warning">
        <strong>No pudimos obtener tu ubicación.</strong>
        <span class="mt-2 block leading-relaxed">
          Si negaste el permiso, actívalo desde los ajustes de tu dispositivo y vuelve a intentarlo.
          Busca la sección de permisos de esta aplicación y habilita "Ubicación".
        </span>
      </onp-alert>
    }

    <onp-alert tono="info">
      <strong>Más adelante te pediremos autorización para grabarte.</strong>
      <span class="mt-1.5 block leading-relaxed">
        El proceso de identificación incluye una videograbación de tu imagen y voz. Te lo
        recordaremos al terminar de capturar tus datos, y ahí otorgarás tu autorización expresa.
      </span>
    </onp-alert>

    <onp-button [deshabilitado]="estado() !== 'concedido'" (pulsar)="continuar()">
      Continuar
    </onp-button>
  `,
})
export class AuthLocation {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly geo = inject(Geolocalizacion);
  private readonly navegacion = inject(NavegacionService);

  protected readonly autorizo = this.fb.nonNullable.control(false);
  protected readonly estado = signal<EstadoGps>('inicial');
  protected readonly ubicacion = signal<Ubicacion | null>(null);

  protected readonly coordenadas = computed(() => {
    const u = this.ubicacion();
    if (!u) return '';
    return `${u.latitud.toFixed(6)}, ${u.longitud.toFixed(6)}  ·  precisión ${Math.round(
      u.precision_metros,
    )} m`;
  });

  protected async pedirPermiso(): Promise<void> {
    this.estado.set('pidiendo');
    const u = await this.geo.capturar('autorizacion');
    if (!u) {
      this.ubicacion.set(null);
      this.estado.set('rechazado');
      this.store.dispatch(new PermisoUbicacion(false));
      return;
    }
    this.ubicacion.set(u);
    this.estado.set('concedido');
    this.store.dispatch([
      new PermisoUbicacion(true),
      new GuardarAutorizaciones({ geolocalizacion: true }),
    ]);
  }

  protected continuar(): void {
    void this.navegacion.avanzar('form-generales', 'auth-location');
  }
}
