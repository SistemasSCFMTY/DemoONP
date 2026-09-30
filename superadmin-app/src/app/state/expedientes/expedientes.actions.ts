import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import { TipoArchivo } from '../../model/interfaces/expediente-detalle';
import { FiltrosExpedientes } from '../../model/interfaces/expediente-resumen';

/**
 * Load the table for exactly these filters.
 *
 * Dispatched only from `queryParamMap` — §12 makes the URL the single load
 * path, so a reloaded panel shows the same rows and a pasted link opens the
 * same view.
 */
export class CargarExpedientes {
  static readonly type = '[Expedientes] Cargar lista';
  constructor(readonly filtros: FiltrosExpedientes) {}
}

export class CargarExpediente {
  static readonly type = '[Expedientes] Cargar detalle';
  constructor(readonly id: string) {}
}

/** Drops the open expediente and every signed URL minted for it. */
export class LimpiarExpediente {
  static readonly type = '[Expedientes] Limpiar detalle';
}

/**
 * Mints one short-lived signed URL, for a file the view is about to paint.
 * Five-minute expiry, never persisted (§12).
 */
export class CargarArchivo {
  static readonly type = '[Expedientes] Cargar archivo';
  constructor(
    readonly id: string,
    readonly tipo: TipoArchivo,
  ) {}
}

/** The estado selector from `verExpediente` (`:5640`). */
export class CambiarEstado {
  static readonly type = '[Expedientes] Cambiar estado';
  constructor(
    readonly id: string,
    readonly estado: EstadoExpediente,
  ) {}
}
