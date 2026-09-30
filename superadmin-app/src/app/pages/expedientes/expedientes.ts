import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The expedientes table.
 *
 * CP-S1 lands the shell and the route; the `p-table`, the search and the
 * URL-backed filters are CP-S2.
 */
@Component({
  selector: 'panel-expedientes',
  template: `
    <div class="px-8 py-7">
      <h1 class="font-heading text-2xl font-bold">Expedientes</h1>
      <p class="mt-1 text-sm text-text-soft">Solicitudes recibidas del flujo del prospecto.</p>
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Expedientes {}
