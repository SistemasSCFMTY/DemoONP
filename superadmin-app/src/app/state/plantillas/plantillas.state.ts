import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, of, switchMap, tap } from 'rxjs';

import { ErrorApi } from '../../model/interfaces/error-api';
import { PlantillaResumen, plantillaActiva } from '../../model/interfaces/plantilla';
import { PanelApi } from '../../services/http/panel-api';
import {
  CargarPlantillas,
  CargarVistaPrevia,
  CerrarVistaPrevia,
  LimpiarAvisoPlantilla,
  QuitarPlantilla,
  SubirPlantilla,
} from './plantillas.actions';

export interface ModeloPlantillas {
  readonly lista: readonly PlantillaResumen[];
  readonly cargando: boolean;
  readonly subiendo: boolean;
  readonly error: string | null;
  /** The Spanish confirmation after a successful upload or removal. */
  readonly aviso: string | null;
  /** Claves in the last upload that are not in the catalogue. */
  readonly clavesDesconocidas: readonly string[];

  /** The active template's body, only while the preview is open. */
  readonly htmlVistaPrevia: string | null;
  readonly cargandoVistaPrevia: boolean;
}

const SIN_VISTA = { htmlVistaPrevia: null, cargandoVistaPrevia: false } as const;

/**
 * The solicitud templates.
 *
 * `GET /plantillas` returns every version, active and inactive, so the active
 * one is selected here rather than assumed to be first.
 */
@State<ModeloPlantillas>({
  name: 'plantillas',
  defaults: {
    lista: [],
    cargando: false,
    subiendo: false,
    error: null,
    aviso: null,
    clavesDesconocidas: [],
    ...SIN_VISTA,
  },
})
@Injectable()
export class PlantillasState {
  readonly #api = inject(PanelApi);

  @Selector()
  static activa(estado: ModeloPlantillas): PlantillaResumen | null {
    return plantillaActiva(estado.lista);
  }

  @Selector()
  static cargando(estado: ModeloPlantillas): boolean {
    return estado.cargando;
  }

  @Selector()
  static subiendo(estado: ModeloPlantillas): boolean {
    return estado.subiendo;
  }

  @Selector()
  static error(estado: ModeloPlantillas): string | null {
    return estado.error;
  }

  @Selector()
  static aviso(estado: ModeloPlantillas): string | null {
    return estado.aviso;
  }

  @Selector()
  static clavesDesconocidas(estado: ModeloPlantillas): readonly string[] {
    return estado.clavesDesconocidas;
  }

  @Selector()
  static htmlVistaPrevia(estado: ModeloPlantillas): string | null {
    return estado.htmlVistaPrevia;
  }

  @Selector()
  static cargandoVistaPrevia(estado: ModeloPlantillas): boolean {
    return estado.cargandoVistaPrevia;
  }

  @Action(CargarPlantillas)
  cargar(ctx: StateContext<ModeloPlantillas>) {
    ctx.patchState({ cargando: true, error: null });

    return this.#api.listarPlantillas().pipe(
      tap((lista) => ctx.patchState({ lista, cargando: false })),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ cargando: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(SubirPlantilla)
  subir(ctx: StateContext<ModeloPlantillas>, { plantilla, clavesDesconocidas }: SubirPlantilla) {
    ctx.patchState({ subiendo: true, error: null, aviso: null, clavesDesconocidas: [] });

    return this.#api.crearPlantilla(plantilla).pipe(
      // The upload deactivates the previous version server-side, so the list
      // is refetched rather than patched — the panel does not model the
      // Worker's versioning rules, it reads them.
      switchMap(() => this.#api.listarPlantillas()),
      tap((lista) =>
        ctx.patchState({
          lista,
          subiendo: false,
          clavesDesconocidas,
          aviso: clavesDesconocidas.length
            ? 'Formato guardado, pero hay claves no reconocidas.'
            : 'Formato guardado correctamente.',
          ...SIN_VISTA,
        }),
      ),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ subiendo: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(QuitarPlantilla)
  quitar(ctx: StateContext<ModeloPlantillas>, { id }: QuitarPlantilla) {
    ctx.patchState({ subiendo: true, error: null, aviso: null });

    return this.#api.desactivarPlantilla(id).pipe(
      switchMap(() => this.#api.listarPlantillas()),
      tap((lista) =>
        ctx.patchState({
          lista,
          subiendo: false,
          clavesDesconocidas: [],
          aviso: 'Se volverá a usar el formato predeterminado.',
          ...SIN_VISTA,
        }),
      ),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ subiendo: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(CargarVistaPrevia)
  cargarVistaPrevia(ctx: StateContext<ModeloPlantillas>, { id }: CargarVistaPrevia) {
    ctx.patchState({ cargandoVistaPrevia: true, htmlVistaPrevia: null, error: null });

    return this.#api.obtenerPlantilla(id).pipe(
      tap((plantilla) =>
        ctx.patchState({
          htmlVistaPrevia: plantilla.contenido_html,
          cargandoVistaPrevia: false,
        }),
      ),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ cargandoVistaPrevia: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(CerrarVistaPrevia)
  cerrarVistaPrevia(ctx: StateContext<ModeloPlantillas>) {
    ctx.patchState({ ...SIN_VISTA });
  }

  @Action(LimpiarAvisoPlantilla)
  limpiarAviso(ctx: StateContext<ModeloPlantillas>) {
    const { aviso, error } = ctx.getState();
    if (aviso || error) ctx.patchState({ aviso: null, error: null, clavesDesconocidas: [] });
  }
}
