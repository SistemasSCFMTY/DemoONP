import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, of, tap } from 'rxjs';

import { ErrorApi } from '../../model/interfaces/error-api';
import { DatosSofom } from '../../model/interfaces/sofom';
import { DescargaArchivo } from '../../services/domain/descarga-archivo.service';
import { PanelApi } from '../../services/http/panel-api';
import {
  CargarSofom,
  ExportarExpedientes,
  GuardarSofom,
  LimpiarAvisoSofom,
} from './sofom.actions';

export interface ModeloSofom {
  readonly datos: DatosSofom | null;
  readonly cargando: boolean;
  readonly guardando: boolean;
  readonly error: string | null;
  readonly guardado: boolean;

  readonly exportando: boolean;
  readonly errorExportar: string | null;
}

/**
 * The SOFOM's identity, and the export.
 *
 * The export is here rather than in a component because §7 says components do
 * not call http services — and because the guarantee worth enforcing in one
 * place is that the response never becomes state. It is a `Blob` from the
 * network to the disk; nothing in this file stores or logs it.
 */
@State<ModeloSofom>({
  name: 'sofom',
  defaults: {
    datos: null,
    cargando: false,
    guardando: false,
    error: null,
    guardado: false,
    exportando: false,
    errorExportar: null,
  },
})
@Injectable()
export class SofomState {
  readonly #api = inject(PanelApi);
  readonly #descarga = inject(DescargaArchivo);

  @Selector()
  static datos(estado: ModeloSofom): DatosSofom | null {
    return estado.datos;
  }

  @Selector()
  static cargando(estado: ModeloSofom): boolean {
    return estado.cargando;
  }

  @Selector()
  static guardando(estado: ModeloSofom): boolean {
    return estado.guardando;
  }

  @Selector()
  static error(estado: ModeloSofom): string | null {
    return estado.error;
  }

  @Selector()
  static guardado(estado: ModeloSofom): boolean {
    return estado.guardado;
  }

  @Selector()
  static exportando(estado: ModeloSofom): boolean {
    return estado.exportando;
  }

  @Selector()
  static errorExportar(estado: ModeloSofom): string | null {
    return estado.errorExportar;
  }

  @Action(CargarSofom)
  cargar(ctx: StateContext<ModeloSofom>) {
    ctx.patchState({ cargando: true, error: null });

    return this.#api.obtenerSofom().pipe(
      tap((datos) => ctx.patchState({ datos, cargando: false })),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ cargando: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(GuardarSofom)
  guardar(ctx: StateContext<ModeloSofom>, { datos }: GuardarSofom) {
    ctx.patchState({ guardando: true, error: null, guardado: false });

    return this.#api.guardarSofom(datos).pipe(
      tap((guardados) =>
        ctx.patchState({ datos: guardados, guardando: false, guardado: true }),
      ),
      catchError((fallo: ErrorApi) => {
        // A 403 lands here when the account is not `administrador`. The
        // message is already the Spanish one from the interceptor, and the
        // form stays exactly as the operator left it — no dead end, nothing
        // lost, and they can hand it to someone who can save it.
        ctx.patchState({ guardando: false, error: fallo.message });
        return of(null);
      }),
    );
  }

  @Action(LimpiarAvisoSofom)
  limpiarAviso(ctx: StateContext<ModeloSofom>) {
    const { guardado, error } = ctx.getState();
    if (guardado || error) ctx.patchState({ guardado: false, error: null });
  }

  @Action(ExportarExpedientes)
  exportar(ctx: StateContext<ModeloSofom>) {
    ctx.patchState({ exportando: true, errorExportar: null });

    return this.#api.exportarExpedientes().pipe(
      tap((contenido) => {
        // Straight to the disk. The blob is not read, not parsed into state,
        // and not logged — it is every expediente in the database.
        this.#descarga.descargar(contenido, this.#descarga.nombreConFecha('expedientes', 'json'));
        ctx.patchState({ exportando: false });
      }),
      catchError((fallo: ErrorApi) => {
        ctx.patchState({ exportando: false, errorExportar: fallo.message });
        return of(null);
      }),
    );
  }
}
