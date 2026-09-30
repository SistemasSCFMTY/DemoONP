import { NuevaPlantilla } from '../../model/interfaces/plantilla';

export class CargarPlantillas {
  static readonly type = '[Plantillas] Cargar';
}

/**
 * Stores an already-converted document.
 *
 * The `.docx` never reaches this action: it is parsed in the browser by
 * `leerDocx` before dispatch, and only the resulting HTML is sent (JSZip
 * cannot ride in a Worker — the same platform constraint as the OCR).
 */
export class SubirPlantilla {
  static readonly type = '[Plantillas] Subir';
  constructor(
    readonly plantilla: NuevaPlantilla,
    /** Claves in the document that are not in the catalogue. */
    readonly clavesDesconocidas: readonly string[],
  ) {}
}

export class QuitarPlantilla {
  static readonly type = '[Plantillas] Quitar';
  constructor(readonly id: string) {}
}

/** Fetches the active template's body for "Ver cómo queda". */
export class CargarVistaPrevia {
  static readonly type = '[Plantillas] Cargar vista previa';
  constructor(readonly id: string) {}
}

export class CerrarVistaPrevia {
  static readonly type = '[Plantillas] Cerrar vista previa';
}

export class LimpiarAvisoPlantilla {
  static readonly type = '[Plantillas] Limpiar aviso';
}
