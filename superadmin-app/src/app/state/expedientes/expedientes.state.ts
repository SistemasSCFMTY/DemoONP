import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, of, tap } from 'rxjs';

import { ErrorApi } from '../../model/interfaces/error-api';
import {
  ExpedienteDetalle,
  TipoArchivo,
  UrlFirmada,
} from '../../model/interfaces/expediente-detalle';
import {
  ExpedienteResumen,
  FiltrosExpedientes,
} from '../../model/interfaces/expediente-resumen';
import { PanelApi } from '../../services/http/panel-api';
import {
  CambiarEstado,
  CargarArchivo,
  CargarExpediente,
  CargarExpedientes,
  LimpiarExpediente,
} from './expedientes.actions';

/** What the media panes need to know about one file slot. */
export interface EstadoArchivo {
  readonly cargando: boolean;
  readonly url: string | null;
  readonly error: string | null;
}

export interface ModeloExpedientes {
  readonly items: readonly ExpedienteResumen[];
  readonly total: number;
  readonly cargandoLista: boolean;
  readonly errorLista: string | null;

  readonly abierto: ExpedienteDetalle | null;
  readonly cargandoDetalle: boolean;
  readonly errorDetalle: string | null;
  readonly guardandoEstado: boolean;

  /**
   * Signed URLs for the open expediente, by file type.
   *
   * **Never persisted** (§12). They live here only while the detail view is
   * open and `LimpiarExpediente` drops them on the way out. This application
   * has no storage plugin, so nothing writes state to disk — see the note in
   * app.config.ts.
   */
  readonly archivos: Readonly<Record<string, EstadoArchivo>>;
}

const SIN_DETALLE = {
  abierto: null,
  cargandoDetalle: false,
  errorDetalle: null,
  guardandoEstado: false,
  archivos: {},
} as const;

/**
 * The expedientes the panel is looking at.
 *
 * State is immutable throughout (§7): every handler patches with a fresh
 * object and no handler mutates what it was given.
 */
@State<ModeloExpedientes>({
  name: 'expedientes',
  defaults: {
    items: [],
    total: 0,
    cargandoLista: false,
    errorLista: null,
    ...SIN_DETALLE,
  },
})
@Injectable()
export class ExpedientesState {
  readonly #api = inject(PanelApi);

  @Selector()
  static items(estado: ModeloExpedientes): readonly ExpedienteResumen[] {
    return estado.items;
  }

  @Selector()
  static total(estado: ModeloExpedientes): number {
    return estado.total;
  }

  @Selector()
  static cargandoLista(estado: ModeloExpedientes): boolean {
    return estado.cargandoLista;
  }

  @Selector()
  static errorLista(estado: ModeloExpedientes): string | null {
    return estado.errorLista;
  }

  @Selector()
  static abierto(estado: ModeloExpedientes): ExpedienteDetalle | null {
    return estado.abierto;
  }

  @Selector()
  static cargandoDetalle(estado: ModeloExpedientes): boolean {
    return estado.cargandoDetalle;
  }

  @Selector()
  static errorDetalle(estado: ModeloExpedientes): string | null {
    return estado.errorDetalle;
  }

  @Selector()
  static guardandoEstado(estado: ModeloExpedientes): boolean {
    return estado.guardandoEstado;
  }

  @Selector()
  static archivos(estado: ModeloExpedientes): Readonly<Record<string, EstadoArchivo>> {
    return estado.archivos;
  }

  @Action(CargarExpedientes)
  cargarLista(ctx: StateContext<ModeloExpedientes>, { filtros }: CargarExpedientes) {
    ctx.patchState({ cargandoLista: true, errorLista: null });

    return this.#api.listarExpedientes(filtros).pipe(
      tap((pagina) =>
        ctx.patchState({
          items: pagina.items,
          total: pagina.total,
          cargandoLista: false,
        }),
      ),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ items: [], total: 0, cargandoLista: false, errorLista: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(CargarExpediente)
  cargarDetalle(ctx: StateContext<ModeloExpedientes>, { id }: CargarExpediente) {
    // Drop the previous expediente's signed URLs before fetching the next one,
    // so no URL ever outlives the record it belongs to.
    ctx.patchState({ ...SIN_DETALLE, cargandoDetalle: true });

    return this.#api.obtenerExpediente(id).pipe(
      tap((abierto) => ctx.patchState({ abierto, cargandoDetalle: false })),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ abierto: null, cargandoDetalle: false, errorDetalle: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(LimpiarExpediente)
  limpiarDetalle(ctx: StateContext<ModeloExpedientes>) {
    ctx.patchState({ ...SIN_DETALLE });
  }

  @Action(CargarArchivo)
  cargarArchivo(ctx: StateContext<ModeloExpedientes>, { id, tipo }: CargarArchivo) {
    const yaEsta = ctx.getState().archivos[tipo];
    if (yaEsta?.cargando || yaEsta?.url) return undefined;

    ctx.patchState({ archivos: conArchivo(ctx.getState(), tipo, { cargando: true, url: null, error: null }) });

    return this.#api.urlArchivo(id, tipo).pipe(
      tap((firmada: UrlFirmada) =>
        ctx.patchState({
          archivos: conArchivo(ctx.getState(), tipo, {
            cargando: false,
            url: firmada.url,
            error: null,
          }),
        }),
      ),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({
          archivos: conArchivo(ctx.getState(), tipo, {
            cargando: false,
            url: null,
            error: fallo.message,
          }),
        });
        return of(null);
      }),
    );
  }

  @Action(CambiarEstado)
  cambiarEstado(ctx: StateContext<ModeloExpedientes>, { id, estado }: CambiarEstado) {
    ctx.patchState({ guardandoEstado: true });

    return this.#api.cambiarEstado(id, estado).pipe(
      tap((confirmado) => {
        const actual = ctx.getState();
        ctx.patchState({
          guardandoEstado: false,
          abierto: actual.abierto ? { ...actual.abierto, estado: confirmado } : null,
          // Keep the table honest without a refetch: the operator will very
          // likely press "Volver a la lista" next.
          items: actual.items.map((i) => (i.id === id ? { ...i, estado: confirmado } : i)),
        });
      }),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ guardandoEstado: false, errorDetalle: fallo.message });
        return of(null);
      }),
    );
  }
}

/** A fresh `archivos` record with one slot replaced. State stays immutable. */
function conArchivo(
  estado: ModeloExpedientes,
  tipo: TipoArchivo,
  valor: EstadoArchivo,
): Readonly<Record<string, EstadoArchivo>> {
  return { ...estado.archivos, [tipo]: valor };
}
