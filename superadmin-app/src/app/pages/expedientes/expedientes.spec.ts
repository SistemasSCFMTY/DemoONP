import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';

import { PanelApi } from '../../services/http/panel-api';
import { PanelApiSimulada } from '../../services/http/panel-api-simulada.service';
import { CargarExpedientes } from '../../state/expedientes/expedientes.actions';
import { ExpedientesState } from '../../state/expedientes/expedientes.state';
import { PanelState } from '../../state/panel/panel.state';
import { Expedientes } from './expedientes';

/**
 * A tripwire for the table.
 *
 * `p-table` renders through content templates, which type-check whether or
 * not the component wires them up correctly — so the only way to know the
 * rows appear is to render them.
 */
describe('Expedientes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'expedientes', children: [] }]),
        provideStore([PanelState, ExpedientesState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
  });

  it('renders a row per expediente through the p-table body template', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(Expedientes);
    await fixture.whenStable();
    await esperarA(() => !store.selectSnapshot(ExpedientesState.cargandoLista));
    await fixture.whenStable();

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(3);

    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('ONP-260929-4417');
    expect(texto).toContain('Robles Cantú María Guadalupe');
    // The estado chip renders its label, not only its colour (§9).
    expect(texto).toContain('En revisión');

    // A row is reachable by keyboard, not only by mouse.
    expect(filas[0].getAttribute('tabindex')).toBe('0');
  });

  it('shows the search-specific empty message the source uses', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(Expedientes);
    await fixture.whenStable();

    store.dispatch(
      new CargarExpedientes({ q: 'no-existe', estado: null, limit: 25, offset: 0 }),
    );
    await esperarA(() => !store.selectSnapshot(ExpedientesState.cargandoLista));
    await fixture.whenStable();

    expect(store.selectSnapshot(ExpedientesState.total)).toBe(0);
  });
});

/** Polls until `condicion` holds, so the test waits on the real timers. */
async function esperarA(condicion: () => boolean, msMaximo = 3000): Promise<void> {
  const limite = Date.now() + msMaximo;
  while (!condicion()) {
    if (Date.now() > limite) throw new Error('La condición no se cumplió a tiempo.');
    await new Promise((listo) => setTimeout(listo, 25));
  }
}
