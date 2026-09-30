import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';

import { PanelApi } from '../../services/http/panel-api';
import { PanelApiSimulada } from '../../services/http/panel-api-simulada.service';
import { EXPEDIENTES_SIMULADOS } from '../../services/http/expedientes-simulados';
import { ExpedientesState } from '../../state/expedientes/expedientes.state';
import { PanelState } from '../../state/panel/panel.state';
import { ExpedienteDetalleVista } from './expediente-detalle';

/**
 * A smoke test for the payoff screen.
 *
 * It exists for one reason: this view has the most template in the panel, and
 * a build that type-checks can still throw the first time it renders. The
 * test renders the completed seeded expediente for real — every section, the
 * estado selector, the signed-URL image panes — and asserts the page got as
 * far as painting the folio.
 *
 * Not a substitute for the QA pass (CP-F13's panel equivalent); a tripwire.
 */
describe('ExpedienteDetalleVista', () => {
  const completo = EXPEDIENTES_SIMULADOS[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore([PanelState, ExpedientesState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
  });

  it('paints the expediente it was pointed at', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ExpedienteDetalleVista);
    // The component loads its own data from the route input; nothing is
    // pre-seeded, so this exercises the real path.
    fixture.componentRef.setInput('id', completo.id);
    await fixture.whenStable();

    // PanelApiSimulada answers on a timer, as the Worker will.
    await esperarA(() => !store.selectSnapshot(ExpedientesState.cargandoDetalle));
    await fixture.whenStable();

    const texto: string = fixture.nativeElement.textContent;

    expect(texto).toContain(completo.folio);
    expect(texto).toContain('Páez Esquivel Fernando');
    expect(texto).toContain('PAEF990319HNLZSR09');
    // The source's empty state, on a field this expediente never filled in.
    expect(texto).toContain('No proporcionado');
    // Sections that only render for a complete file.
    expect(texto).toContain('Fotografías de la identificación');
    expect(texto).toContain('Ubicaciones registradas');
    expect(texto).toContain('Al firmar');
    // It got past loading and past the error branch.
    expect(texto).not.toContain('Cargando el expediente…');
    expect(store.selectSnapshot(ExpedientesState.errorDetalle)).toBeNull();
  });

  it('keeps no expediente field value in the route', () => {
    // The detail is addressed by opaque id. Regression guard for §12.
    expect(completo.id).not.toContain(completo.folio);
    expect(completo.id).not.toContain(completo.curp ?? '');
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
