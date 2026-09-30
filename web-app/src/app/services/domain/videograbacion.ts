import { Injectable } from '@angular/core';

export interface ResultadoVideo {
  readonly grabado: boolean;
  readonly simulado: boolean;
}

/**
 * The identity videograbación.
 *
 * **Mocked, behind this interface.** A real recording means `MediaRecorder`,
 * a 45-second cap, a liveness prompt and an upload of tens of megabytes —
 * and the API contract has no video part in `POST /solicitudes`, so there is
 * nowhere to put it. Wiring the camera without a place to send the bytes
 * would look finished and be worse than a labelled simulation.
 *
 * Swapping in a real recorder is a new implementation of `Grabacion` plus a
 * `video` part in the contract, which is a cross-project change and belongs
 * in a PR description, not in this file.
 */
export abstract class Grabacion {
  abstract grabar(): Promise<ResultadoVideo>;
  abstract readonly simulada: boolean;
}

@Injectable({ providedIn: 'root', useFactory: () => new GrabacionSimulada() })
export class GrabacionSimulada extends Grabacion {
  override readonly simulada = true;

  override async grabar(): Promise<ResultadoVideo> {
    await new Promise((r) => setTimeout(r, 1200));
    return { grabado: true, simulado: true };
  }
}
