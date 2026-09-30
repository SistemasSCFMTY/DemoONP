import type { Producto } from '../../model/interfaces/producto';

export class CargarProducto {
  static readonly type = '[Simulador] Cargar producto';
}

export class EstablecerProducto {
  static readonly type = '[Simulador] Establecer producto';
  constructor(readonly producto: Producto) {}
}

export class Simular {
  static readonly type = '[Simulador] Simular';
  constructor(
    readonly monto: number,
    readonly plazo: number,
  ) {}
}

export class AceptarSimulacion {
  static readonly type = '[Simulador] Aceptar simulación';
}
