import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { LucideLoaderCircle, LucideVideoOff } from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { TIPO_ARCHIVO_VIDEO } from '../../model/constants/expediente/tipos-archivo';
import { CargarArchivo } from '../../state/expedientes/expedientes.actions';
import { EstadoArchivo, ExpedientesState } from '../../state/expedientes/expedientes.state';

/**
 * The videograbación de identificación, played from a short-lived signed URL.
 *
 * A sibling of `ArchivoImagen`, deliberately not a branch inside it: an
 * `<img>` and a `<video>` share a signed URL and nothing else — different
 * element, different attributes, different failure modes, different
 * accessible name. Bending one component into serving both would trade two
 * small templates for one with a `@switch` in it.
 *
 * Two rules this component exists to keep:
 *
 * - **`preload="metadata"`, never `auto`.** The panel must not pull megabytes
 *   for every expediente an analyst merely opens; the browser fetches the
 *   header, learns the duration, and stops until someone presses play.
 * - **The element can never be wider than its column.** A `<video>` carries
 *   an intrinsic size, and an intrinsic size inside a narrow column is the
 *   classic way to make a page scroll sideways. `w-full` plus `max-w-full`
 *   means the layout decides the width and the file never does.
 *
 * As with the images, the URL is minted on demand for a file this component
 * is about to paint, lives in `ExpedientesState` while the detail view is
 * open, and is **never persisted** (§12). The component dispatches and reads
 * a selector; it does not call the http service (§7).
 */
@Component({
  selector: 'panel-archivo-video',
  imports: [LucideLoaderCircle, LucideVideoOff],
  templateUrl: './archivo-video.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivoVideo {
  readonly expedienteId = input.required<string>();
  readonly pie = input.required<string>();

  readonly #store = inject(Store);
  readonly #archivos = select(ExpedientesState.archivos);

  /**
   * Explicitly `| undefined`: the slot is absent until `CargarArchivo`
   * settles, and the state's `Record` type does not say so on its own.
   */
  protected readonly estado = computed<EstadoArchivo | undefined>(
    () => this.#archivos()[TIPO_ARCHIVO_VIDEO],
  );

  constructor() {
    effect(() => {
      this.#store.dispatch(new CargarArchivo(this.expedienteId(), TIPO_ARCHIVO_VIDEO));
    });
  }
}
