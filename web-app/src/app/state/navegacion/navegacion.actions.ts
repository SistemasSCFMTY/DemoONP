import type { PasoId } from '../../model/interfaces/paso';

/**
 * Navigation actions. `'[Context] Verb'` types per 01-conventions.md §7.
 *
 * `NavegacionState` is the only state the step-order guard reads, and the only
 * one that would be safe to persist — it holds no PII.
 */
export class MarcarPasoAlcanzado {
  static readonly type = '[Navegación] Marcar paso alcanzado';
  constructor(readonly paso: PasoId) {}
}

export class EntrarAPaso {
  static readonly type = '[Navegación] Entrar a paso';
  constructor(readonly paso: PasoId) {}
}

export class ReiniciarNavegacion {
  static readonly type = '[Navegación] Reiniciar';
}

/**
 * Drop someone back into an application they left.
 *
 * Unlike `EntrarAPaso`, this marks the whole path behind them reached — the
 * guard only admits a step already visited, so resuming at `form-laborales`
 * without the steps before it would bounce them straight to the portada.
 */
export class ReanudarEn {
  static readonly type = '[Navegación] Reanudar en';
  constructor(
    readonly paso: PasoId,
    readonly alcanzados: readonly PasoId[],
  ) {}
}
