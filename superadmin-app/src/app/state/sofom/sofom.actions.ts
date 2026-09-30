import { DatosSofom } from '../../model/interfaces/sofom';

export class CargarSofom {
  static readonly type = '[Sofom] Cargar';
}

export class GuardarSofom {
  static readonly type = '[Sofom] Guardar';
  constructor(readonly datos: DatosSofom) {}
}

export class LimpiarAvisoSofom {
  static readonly type = '[Sofom] Limpiar aviso';
}

/**
 * Downloads every expediente as a file.
 *
 * An action rather than a component calling the service (§7), even though
 * nothing lands in the store: the response is bulk PII and the one thing this
 * handler must guarantee is that it goes from the network straight to the
 * disk without being parsed, stored or logged.
 */
export class ExportarExpedientes {
  static readonly type = '[Sofom] Exportar expedientes';
}
