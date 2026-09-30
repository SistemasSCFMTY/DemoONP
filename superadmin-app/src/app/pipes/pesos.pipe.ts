import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pesos, exactly as the source formats them
 * (`onp_fer_etapa2_pf.html:2369` — `pesos()`): rounded to the peso, grouped
 * es-MX, prefixed `$`.
 *
 * A pipe rather than a call in a template (§6: no logic in templates), and
 * `toLocaleString` rather than Angular's `CurrencyPipe` so the panel matches
 * the prospect app's output byte-for-byte without registering locale data.
 */
@Pipe({ name: 'pesos' })
export class PesosPipe implements PipeTransform {
  transform(valor: number | null | undefined): string | null {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
    return '$' + Math.round(valor).toLocaleString('es-MX');
  }
}
