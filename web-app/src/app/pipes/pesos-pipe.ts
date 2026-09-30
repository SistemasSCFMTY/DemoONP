import { Pipe, type PipeTransform } from '@angular/core';
import { pesos, pesosCent } from '../services/domain/amortizacion';

/**
 * `{{ monto | pesos }}` → `$50,000`, `{{ monto | pesos: true }}` → `$50,000.00`.
 *
 * A pure pipe rather than a method call in the template: 01-conventions.md §6
 * bans logic in templates, and a pipe memoises where a call re-runs on every
 * check.
 */
@Pipe({ name: 'pesos' })
export class PesosPipe implements PipeTransform {
  transform(valor: number | null | undefined, conCentavos = false): string {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
    return conCentavos ? pesosCent(valor) : pesos(valor);
  }
}
