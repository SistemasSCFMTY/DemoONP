import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { LucideImageOff, LucideLoaderCircle } from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { TipoArchivo } from '../../model/interfaces/expediente-detalle';
import { CargarArchivo } from '../../state/expedientes/expedientes.actions';
import { EstadoArchivo, ExpedientesState } from '../../state/expedientes/expedientes.state';

/**
 * One stored image, fetched through a short-lived signed URL.
 *
 * The URL is minted on demand, only for a file this component is about to
 * paint — that is why `GET /expedientes/:id` deliberately returns none. It
 * lives in `ExpedientesState` until the detail view is left and is **never
 * persisted** (§12): there is no storage plugin in this application.
 *
 * The component dispatches and reads a selector; it does not call the http
 * service (§7).
 */
@Component({
  selector: 'panel-archivo-imagen',
  imports: [LucideLoaderCircle, LucideImageOff],
  templateUrl: './archivo-imagen.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivoImagen {
  readonly expedienteId = input.required<string>();
  readonly tipo = input.required<TipoArchivo>();
  readonly pie = input.required<string>();
  /** The signature is wider than it is tall; the INE faces are not. */
  readonly contenerAlto = input(false);

  readonly #store = inject(Store);
  readonly #archivos = select(ExpedientesState.archivos);

  /**
   * Explicitly `| undefined`: the slot is absent until `CargarArchivo`
   * settles, and the state's `Record` type does not say so on its own.
   */
  protected readonly estado = computed<EstadoArchivo | undefined>(
    () => this.#archivos()[this.tipo()],
  );

  /**
   * An empty `alt` would be wrong (the image carries information) and a
   * transcription would be worse (it would put the credential's contents into
   * the accessibility tree as text). The caption names what it is.
   */
  protected readonly alt = computed(() => this.pie());

  constructor() {
    effect(() => {
      this.#store.dispatch(new CargarArchivo(this.expedienteId(), this.tipo()));
    });
  }
}
