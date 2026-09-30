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
  templateUrl: './auth-location.html',
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
