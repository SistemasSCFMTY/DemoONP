import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { pasoPorId } from '../model/constants/pasos/pasos';
import type { PasoId } from '../model/interfaces/paso';
import { SolicitudesHttp } from '../services/http/solicitudes-http';
import {
  EntrarAPaso,
  MarcarPasoAlcanzado,
  ReanudarEn,
} from '../state/navegacion/navegacion.actions';
import type { DestinoReanudacion } from '../services/domain/reanudacion';

/**
 * Moving between screens.
 *
 * Back navigation walks a stack of the screens the prospect actually visited,
 * exactly as the source's `historial` does (onp_fer_etapa2_pf.html:4427) —
 * not the wizard order. The two differ whenever the flow branches: an existing
 * client goes es-cliente → verificar-cliente → otp → simulador, and "back"
 * from simulador must return to otp, not to requisitos.
 *
 * It is deliberately not `Location.back()`: the informational screens open off
 * the portada and are not part of the wizard, and the browser stack mixes
 * them in with reloads and deep links.
 */
@Injectable({ providedIn: 'root' })
export class NavegacionService {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly solicitudes = inject(SolicitudesHttp);

  private readonly pila = signal<readonly PasoId[]>([]);

  /** The topbar's back button reads this. */
  readonly puedeRegresar = signal(false);

  /** Go to a step, remembering where we came from. */
  async avanzar(destino: PasoId, origen: PasoId | null): Promise<void> {
    if (origen && origen !== destino) {
      // The source caps its history at 60 entries; 28 screens plus branches
      // never gets close, but an unbounded stack in a long session is a leak.
      this.pila.update((p) => [...p, origen].slice(-60));
    }
    this.store.dispatch([new MarcarPasoAlcanzado(destino), new EntrarAPaso(destino)]);
    this.puedeRegresar.set(this.pila().length > 0);
    this.recordarPaso(destino);
    await this.router.navigateByUrl(this.ruta(destino));
  }

  /**
   * Tell the backend how far they got, and carry on regardless.
   *
   * Fire and forget, deliberately: this is bookkeeping so the person can
   * come back tomorrow, and if it fails they keep filling the form and
   * nothing is said. A failed write here is not their problem, and a
   * navigation that waited on it would make every step feel slow on a bad
   * connection. `guardarPaso` swallows its own errors; subscribing without
   * a handler is safe.
   */
  private recordarPaso(paso: PasoId): void {
    this.solicitudes.guardarPaso(paso).subscribe();
  }

  /**
   * Drop someone back into an application they left, at the step the backend
   * remembers. Clears the back stack: they did not walk here this session,
   * so there is nothing behind them to walk back to.
   */
  async reanudar(destino: DestinoReanudacion): Promise<void> {
    this.pila.set([]);
    this.puedeRegresar.set(false);
    this.store.dispatch(new ReanudarEn(destino.paso, destino.alcanzados));
    await this.router.navigateByUrl(destino.ruta);
  }

  /** Undo one step. Falls back to the portada when the stack is empty — a
   *  reload mid-flow leaves it empty and the button must still do something. */
  async regresar(): Promise<void> {
    const pila = this.pila();
    const anterior = pila.length ? pila[pila.length - 1] : 'bienvenida';
    this.pila.set(pila.slice(0, -1));
    this.puedeRegresar.set(this.pila().length > 0);
    this.store.dispatch(new EntrarAPaso(anterior));
    await this.router.navigateByUrl(this.ruta(anterior));
  }

  /** Open an informational screen (catálogo, privacidad, términos, ayuda).
   *  They are not wizard steps, so they do not advance the progress bar. */
  async abrirInformativa(destino: PasoId, origen: PasoId): Promise<void> {
    this.pila.update((p) => [...p, origen]);
    this.puedeRegresar.set(true);
    this.store.dispatch(new EntrarAPaso(destino));
    await this.router.navigateByUrl(this.ruta(destino));
  }

  private ruta(paso: PasoId): string {
    const r = pasoPorId(paso).ruta;
    return '/' + r;
  }
}
