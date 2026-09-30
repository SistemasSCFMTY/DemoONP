import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { pasoPorId } from '../model/constants/pasos/pasos';
import type { PasoId } from '../model/interfaces/paso';
import { EntrarAPaso, MarcarPasoAlcanzado } from '../state/navegacion/navegacion.actions';

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
    await this.router.navigateByUrl(this.ruta(destino));
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
