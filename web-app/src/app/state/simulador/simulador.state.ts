import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, type StateContext } from '@ngxs/store';
import { tap } from 'rxjs';
import { PRODUCTO_PREDETERMINADO } from '../../model/constants/producto/producto-predeterminado';
import type { Producto } from '../../model/interfaces/producto';
import { calcularCAT } from '../../services/domain/cat';
import { comisionDe, pagoMensual } from '../../services/domain/amortizacion';
import { ProductoHttp } from '../../services/http/producto-http';
import { AceptarSimulacion, CargarProducto, EstablecerProducto, Simular } from './simulador.actions';

export interface SimuladorModel {
  readonly producto: Producto;
  readonly monto: number;
  readonly plazo: number;
  readonly pagoMensual: number;
  readonly comision: number;
  readonly total: number;
  readonly cat: number;
  readonly aceptada: boolean;
}

function montoInicial(p: Producto): number {
  return Math.round((p.monto_min + p.monto_max) / 2 / p.monto_paso) * p.monto_paso;
}

/** Recompute every derived figure from the parameters. No figure in this state
 *  is ever set by hand — 01-conventions.md §11, "no invented numbers". */
function recalcular(producto: Producto, monto: number, plazo: number): Omit<SimuladorModel, 'aceptada'> {
  const pago = pagoMensual(monto, producto.tasa_anual, plazo);
  const comision = comisionDe(monto, producto);
  return {
    producto,
    monto,
    plazo,
    pagoMensual: pago,
    comision,
    total: pago * plazo + comision,
    cat: calcularCAT(monto - comision, pago, plazo),
  };
}

const INICIAL: SimuladorModel = {
  ...recalcular(
    PRODUCTO_PREDETERMINADO,
    montoInicial(PRODUCTO_PREDETERMINADO),
    24,
  ),
  aceptada: false,
};

/** The credit the prospect is asking for, and everything derived from it. */
@State<SimuladorModel>({ name: 'simulador', defaults: INICIAL })
@Injectable()
export class SimuladorState {
  private readonly http = inject(ProductoHttp);

  @Selector()
  static estado(s: SimuladorModel): SimuladorModel {
    return s;
  }

  @Selector()
  static producto(s: SimuladorModel): Producto {
    return s.producto;
  }

  @Selector()
  static aceptada(s: SimuladorModel): boolean {
    return s.aceptada;
  }

  @Action(CargarProducto)
  cargar(ctx: StateContext<SimuladorModel>) {
    return this.http.obtener().pipe(
      tap((producto) => {
        const actual = ctx.getState();
        const monto = Math.min(Math.max(actual.monto, producto.monto_min), producto.monto_max);
        const plazo = Math.min(Math.max(actual.plazo, producto.plazo_min), producto.plazo_max);
        ctx.patchState(recalcular(producto, monto, plazo));
      }),
    );
  }

  @Action(EstablecerProducto)
  establecer(ctx: StateContext<SimuladorModel>, { producto }: EstablecerProducto): void {
    const { monto, plazo } = ctx.getState();
    ctx.patchState(recalcular(producto, monto, plazo));
  }

  @Action(Simular)
  simular(ctx: StateContext<SimuladorModel>, { monto, plazo }: Simular): void {
    ctx.patchState(recalcular(ctx.getState().producto, monto, plazo));
  }

  @Action(AceptarSimulacion)
  aceptar(ctx: StateContext<SimuladorModel>): void {
    ctx.patchState({ aceptada: true });
  }
}
