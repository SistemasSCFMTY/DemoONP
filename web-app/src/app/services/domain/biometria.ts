import { Injectable } from '@angular/core';

export type ClaseBiometrica = 'huella' | 'rostro';

export interface ResultadoBiometrico {
  readonly capturado: boolean;
  /** Confidence as the UI shows it, e.g. `"98%"`. */
  readonly confianza: string;
  /** True while no real provider is wired. Drives the "Modo demostración"
   *  label — a simulation that does not admit it is a lie. */
  readonly simulado: boolean;
}

/**
 * Biometric capture.
 *
 * **Mocked, behind this interface, on purpose.** A real capture means an INE
 * or SRE verification provider with a fingerprint reader and a liveness SDK;
 * none is contracted, and the demo is tomorrow. What this file buys is that
 * swapping in a provider is a new implementation of `CapturaBiometrica` and
 * nothing in `biometrics` changes.
 *
 * The `"98%"` and `"95%"` figures are the source's (`:5004`) and are kept
 * verbatim — the one carve-out from "no invented numbers" (deviation D6,
 * owner's call 2026-09-30), and it holds only because the screen says "Modo
 * demostración" beside them. It is not licence to invent a second one.
 */
export abstract class CapturaBiometrica {
  abstract capturar(clase: ClaseBiometrica): Promise<ResultadoBiometrico>;
  abstract readonly simulada: boolean;
}

@Injectable({ providedIn: 'root', useFactory: () => new CapturaBiometricaSimulada() })
export class CapturaBiometricaSimulada extends CapturaBiometrica {
  override readonly simulada = true;

  override async capturar(clase: ClaseBiometrica): Promise<ResultadoBiometrico> {
    // A short delay, so the button's "Capturando…" state is visible and the
    // interaction reads like a capture rather than a toggle.
    await new Promise((r) => setTimeout(r, 900));
    return {
      capturado: true,
      confianza: clase === 'huella' ? '98%' : '95%',
      simulado: true,
    };
  }
}
