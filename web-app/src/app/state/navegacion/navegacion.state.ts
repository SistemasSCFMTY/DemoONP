import { Injectable } from '@angular/core';
import { Action, Selector, State, type StateContext } from '@ngxs/store';
import { PASOS, indicePaso, pasoPorId } from '../../model/constants/pasos/pasos';
import type { PasoId } from '../../model/interfaces/paso';
import { EntrarAPaso, MarcarPasoAlcanzado, ReiniciarNavegacion } from './navegacion.actions';

export interface NavegacionModel {
  /** Every step the prospect actually reached. The guard reads this. */
  readonly alcanzados: readonly PasoId[];
  readonly actual: PasoId;
}

const INICIAL: NavegacionModel = {
  alcanzados: ['bienvenida'],
  actual: 'bienvenida',
};

/**
 * Where the prospect is and how far they got.
 *
 * This state holds no PII — it is a list of step names — which is why it is the
 * one state 01-conventions.md §7 would allow to be persisted. Nothing else is.
 */
@State<NavegacionModel>({ name: 'navegacion', defaults: INICIAL })
@Injectable()
export class NavegacionState {
  @Selector()
  static actual(estado: NavegacionModel): PasoId {
    return estado.actual;
  }

  @Selector()
  static alcanzados(estado: NavegacionModel): readonly PasoId[] {
    return estado.alcanzados;
  }

  /** Progress percentage for the bar. Informational screens keep the last
   *  wizard value rather than dropping to zero mid-flow. */
  @Selector()
  static progreso(estado: NavegacionModel): number {
    return pasoPorId(estado.actual).progreso;
  }

  @Selector()
  static titulo(estado: NavegacionModel): string {
    return pasoPorId(estado.actual).titulo;
  }

  /** The furthest step reached, by wizard order — where the guard sends
   *  someone who tried to jump ahead. */
  @Selector()
  static ultimoAlcanzado(estado: NavegacionModel): PasoId {
    return estado.alcanzados.reduce(
      (mayor, paso) => (indicePaso(paso) > indicePaso(mayor) ? paso : mayor),
      'bienvenida' as PasoId,
    );
  }

  @Action(MarcarPasoAlcanzado)
  marcar(ctx: StateContext<NavegacionModel>, { paso }: MarcarPasoAlcanzado): void {
    const estado = ctx.getState();
    if (estado.alcanzados.includes(paso)) return;
    ctx.patchState({ alcanzados: [...estado.alcanzados, paso] });
  }

  @Action(EntrarAPaso)
  entrar(ctx: StateContext<NavegacionModel>, { paso }: EntrarAPaso): void {
    const estado = ctx.getState();
    ctx.patchState({
      actual: paso,
      alcanzados: estado.alcanzados.includes(paso)
        ? estado.alcanzados
        : [...estado.alcanzados, paso],
    });
  }

  @Action(ReiniciarNavegacion)
  reiniciar(ctx: StateContext<NavegacionModel>): void {
    ctx.setState({ ...INICIAL });
  }
}

/** Every step id, for the router map. */
export const TODOS_LOS_PASOS = PASOS;
