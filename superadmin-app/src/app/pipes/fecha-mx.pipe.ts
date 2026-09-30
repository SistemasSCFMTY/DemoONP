import { Pipe, PipeTransform } from '@angular/core';

/**
 * A date the way the panel shows it, es-MX.
 *
 * `'fecha'` is the plain date the list badge line uses; `'fechaHora'` is the
 * date plus 24-hour time the detail header uses — both ported from
 * `pintarExpedientes` (`onp_fer_etapa2_pf.html:5446`) and `verExpediente`
 * (`:5478`).
 *
 * Input is an ISO 8601 string from the API. An unparseable value renders as
 * null so the caller can show its own empty state rather than "Invalid Date".
 */
@Pipe({ name: 'fechaMx' })
export class FechaMxPipe implements PipeTransform {
  transform(iso: string | null | undefined, formato: 'fecha' | 'fechaHora' = 'fecha'): string | null {
    if (!iso) return null;
    const f = new Date(iso);
    if (Number.isNaN(f.getTime())) return null;

    const fecha = f.toLocaleDateString('es-MX');
    if (formato === 'fecha') return fecha;

    return fecha + ' ' + f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
}
