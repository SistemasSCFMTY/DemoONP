import { Producto } from '../../model/interfaces/producto';

export class CargarProducto {
  static readonly type = '[Producto] Cargar';
}

export class GuardarProducto {
  static readonly type = '[Producto] Guardar';
  constructor(readonly producto: Producto) {}
}

/** Clears the saved/failed notice once the operator edits the form again. */
export class LimpiarAvisoProducto {
  static readonly type = '[Producto] Limpiar aviso';
}
