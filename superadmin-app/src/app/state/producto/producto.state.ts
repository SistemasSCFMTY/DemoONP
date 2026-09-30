import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, of, tap } from 'rxjs';

import { ErrorApi } from '../../model/interfaces/error-api';
import { Producto } from '../../model/interfaces/producto';
import { PanelApi } from '../../services/http/panel-api';
import { CargarProducto, GuardarProducto, LimpiarAvisoProducto } from './producto.actions';

export interface ModeloProducto {
  readonly producto: Producto | null;
  readonly cargando: boolean;
  readonly guardando: boolean;
  readonly error: string | null;
  /** The source's post-save confirmation (`:5407`), shown inline. */
  readonly guardado: boolean;
}

/**
 * The simulator's parameters, as the panel edits them.
 *
 * What lands here is what the prospect's simulator will offer, so the state
 * holds exactly the contract's eight fields and nothing the UI invented.
 */
@State<ModeloProducto>({
  name: 'producto',
  defaults: {
    producto: null,
    cargando: false,
    guardando: false,
    error: null,
    guardado: false,
  },
})
@Injectable()
export class ProductoState {
  readonly #api = inject(PanelApi);

  @Selector()
  static producto(estado: ModeloProducto): Producto | null {
    return estado.producto;
  }

  @Selector()
  static cargando(estado: ModeloProducto): boolean {
    return estado.cargando;
  }

  @Selector()
  static guardando(estado: ModeloProducto): boolean {
    return estado.guardando;
  }

  @Selector()
  static error(estado: ModeloProducto): string | null {
    return estado.error;
  }

  @Selector()
  static guardado(estado: ModeloProducto): boolean {
    return estado.guardado;
  }

  @Action(CargarProducto)
  cargar(ctx: StateContext<ModeloProducto>) {
    ctx.patchState({ cargando: true, error: null });

    return this.#api.obtenerProducto().pipe(
      tap((producto) => ctx.patchState({ producto, cargando: false })),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ cargando: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(GuardarProducto)
  guardar(ctx: StateContext<ModeloProducto>, { producto }: GuardarProducto) {
    ctx.patchState({ guardando: true, error: null, guardado: false });

    return this.#api.guardarProducto(producto).pipe(
      tap((guardado) =>
        ctx.patchState({ producto: guardado, guardando: false, guardado: true }),
      ),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ guardando: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(LimpiarAvisoProducto)
  limpiarAviso(ctx: StateContext<ModeloProducto>) {
    const { guardado, error } = ctx.getState();
    if (guardado || error) ctx.patchState({ guardado: false, error: null });
  }
}
