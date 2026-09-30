import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Store, provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';

import { PanelApi } from '../../services/http/panel-api';
import { PanelApiSimulada } from '../../services/http/panel-api-simulada.service';
import { ExpedientesState } from '../../state/expedientes/expedientes.state';
import { PanelState } from '../../state/panel/panel.state';
import { Expedientes } from './expedientes';

/**
 * A tripwire for the table.
 *
 * `p-table` renders through content templates, which type-check whether or
 * not the component wires them up correctly — so the only way to know the
 * rows appear is to render them.
 *
 * Everything here drives the component **through the URL**, because that is
 * the only thing that loads it (§12). An earlier version of the second test
 * dispatched `CargarExpedientes` directly and failed: the empty message reads
 * the filters out of `queryParamMap`, so a load that skipped the URL left it
 * showing the wrong string. The rule held; the test was wrong.
 */
describe('Expedientes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'expedientes', component: Expedientes }]),
        provideStore([PanelState, ExpedientesState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
  });

  it('renders a row per expediente through the p-table body template', async () => {
    const store = TestBed.inject(Store);
    const harness = await RouterTestingHarness.create('/expedientes');

    await esperarA(() => store.selectSnapshot(ExpedientesState.items).length > 0);
    harness.detectChanges();

    const filas = harness.routeNativeElement!.querySelectorAll('tbody tr');
    expect(filas.length).toBe(3);

    const texto = harness.routeNativeElement!.textContent ?? '';
    expect(texto).toContain('ONP-260929-4417');
    expect(texto).toContain('Robles Cantú María Guadalupe');
    // The estado chip renders its label, not only its colour (§9).
    expect(texto).toContain('En revisión');

    // A row is reachable by keyboard, not only by mouse.
    expect(filas[0].getAttribute('tabindex')).toBe('0');
  });

  it('loads from the query string, so a pasted link shows the same rows', async () => {
    const store = TestBed.inject(Store);
    const harness = await RouterTestingHarness.create('/expedientes?q=robles');

    await esperarA(() => store.selectSnapshot(ExpedientesState.items).length > 0);
    harness.detectChanges();

    expect(store.selectSnapshot(ExpedientesState.total)).toBe(1);
    expect(harness.routeNativeElement!.textContent).toContain('Robles Cantú María Guadalupe');
  });

  it('shows the search-specific empty message the source uses', async () => {
    const store = TestBed.inject(Store);
    const harness = await RouterTestingHarness.create('/expedientes?q=no-existe');

    await esperarA(() => store.selectSnapshot(ExpedientesState.filtros).q === 'no-existe');
    await esperarA(() => !store.selectSnapshot(ExpedientesState.cargandoLista));
    harness.detectChanges();

    expect(store.selectSnapshot(ExpedientesState.total)).toBe(0);
    // Verbatim from `pintarExpedientes` (`:5438`) — the source shows a
    // different sentence when a search is active than when the table is
    // simply empty.
    expect(harness.routeNativeElement!.textContent).toContain(
      'Ningún expediente coincide con la búsqueda.',
    );
  });
});

/**
 * Polls until `condicion` holds, so the test waits on the real timers.
 *
 * It waits for the *result* wherever there is one, never for a `cargando`
 * flag alone: every loading flag in this app starts false, so polling one can
 * pass before the load has even been dispatched.
 */
async function esperarA(condicion: () => boolean, msMaximo = 3000): Promise<void> {
  const limite = Date.now() + msMaximo;
  while (!condicion()) {
    if (Date.now() > limite) throw new Error('La condición no se cumplió a tiempo.');
    await new Promise((listo) => setTimeout(listo, 25));
  }
}
