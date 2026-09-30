import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';

import { PanelApi } from '../../services/http/panel-api';
import { PanelApiSimulada } from '../../services/http/panel-api-simulada.service';
import { ProductoState } from '../../state/producto/producto.state';
import { ProductoVista } from './producto';

/**
 * The preview on this screen is the figure a credit person in the room will
 * check, so the test asserts the number and not just that something rendered.
 */
describe('ProductoVista', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore([ProductoState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
  });

  it('previews three worked examples amortised from the loaded parameters', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ProductoVista);
    await fixture.whenStable();
    await esperarA(() => store.selectSnapshot(ProductoState.producto) !== null);
    await fixture.whenStable();

    const texto: string = fixture.nativeElement.textContent;

    // PRODUCTO's defaults: 5,000–200,000 · 6–72 months · 36% · 2% from 10,000.
    expect(texto).toContain('$5,000 a 6 meses');
    expect(texto).toContain('$103,000 a 24 meses');
    expect(texto).toContain('$200,000 a 72 meses');

    // $200,000 over 72 months at 36%, less the 2% commission ($4,000):
    // pago $6,811/mes, CAT 44.0%. Computed, never illustrated (§11).
    expect(texto).toContain('$6,811/mes');
    expect(texto).toContain('CAT 44.0%');
  });

  it('refuses to save an inverted monto range, with the source message', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ProductoVista);
    await fixture.whenStable();
    await esperarA(() => store.selectSnapshot(ProductoState.producto) !== null);
    await fixture.whenStable();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const montoMax: HTMLInputElement = fixture.nativeElement.querySelector('#monto-max');
    montoMax.value = '1000';
    montoMax.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'El monto máximo debe ser mayor al mínimo, y ambos mayores a cero.',
    );
  });
});

/**
 * Polls until `condicion` holds, so the test waits on the real timers.
 *
 * It waits for the *result*, never for a `cargando` flag: every loading flag
 * in this app starts false, so polling one can pass before the load has even
 * been dispatched. That race made this suite fail about one run in ten.
 */
async function esperarA(condicion: () => boolean, msMaximo = 3000): Promise<void> {
  const limite = Date.now() + msMaximo;
  while (!condicion()) {
    if (Date.now() > limite) throw new Error('La condición no se cumplió a tiempo.');
    await new Promise((listo) => setTimeout(listo, 25));
  }
}
