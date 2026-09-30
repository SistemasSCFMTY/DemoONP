import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import type { MomentoUbicacion, Ubicacion } from '../../model/interfaces/ubicacion';
import { RegistrarUbicacion } from '../../state/identidad/identidad.actions';
import { IdentidadState } from '../../state/identidad/identidad.state';

/**
 * Geolocation capture.
 *
 * Ported from `capturarUbicacion` (onp_fer_etapa2_pf.html:2263), including
 * the reasoning the source wrote down: the permission is asked once, but the
 * capture happens at four moments, because what carries evidentiary weight is
 * where the person was during each act — authorising, photographing the ID,
 * recording the video and, above all, signing.
 *
 * A failed capture resolves to `null` rather than rejecting. A denied
 * permission must not dead-end the prospect: the authorisation screen offers
 * a retry, and the three later captures fail quietly, because a person who
 * has already been asked once should not be blocked mid-signature by a GPS
 * that cannot see the sky.
 */
@Injectable({ providedIn: 'root' })
export class Geolocalizacion {
  private readonly store = inject(Store);

  /** Whether the browser can do this at all. Checked before offering it. */
  readonly disponible = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  /**
   * Capture one moment and file it in the expediente.
   *
   * @returns the capture, or `null` when the permission was denied, the
   *          position timed out, or the device has no geolocation.
   */
  async capturar(etiqueta: MomentoUbicacion): Promise<Ubicacion | null> {
    if (!this.disponible) return null;

    const posicion = await new Promise<GeolocationPosition | null>((resolver) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolver(p),
        (err) => {
          // The message, never the coordinates: §1 forbids logging a field
          // value, and a coordinate pair is one.
          console.warn(`Ubicación (${etiqueta}): ${err.message}`);
          resolver(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });

    if (!posicion) return null;

    const ubicacion: Ubicacion = {
      etiqueta,
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      precision_metros: posicion.coords.accuracy,
      capturado_en: new Date().toISOString(),
    };
    this.store.dispatch(new RegistrarUbicacion(ubicacion));
    return ubicacion;
  }

  /**
   * Capture a later moment, but only if the prospect granted the permission.
   * Never prompts; never throws. This is what `id-photos`, `video` and
   * `signature` call.
   */
  async capturarSiHayPermiso(etiqueta: MomentoUbicacion): Promise<void> {
    if (!this.store.selectSnapshot(IdentidadState.permisoUbicacion)) return;
    await this.capturar(etiqueta);
  }
}
