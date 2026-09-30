import { Pipe, type PipeTransform } from '@angular/core';

/**
 * `{{ cat | porcentaje }}` → `45.7%`.
 *
 * One decimal, matching the source's `cat.toFixed(1)` (`:2440`). The CAT is a
 * comparison figure; a second decimal implies a precision the bisection does
 * not claim.
 */
@Pipe({ name: 'porcentaje' })
export class PorcentajePipe implements PipeTransform {
  transform(valor: number | null | undefined, decimales = 1): string {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
    return `${valor.toFixed(decimales)}%`;
  }
}
