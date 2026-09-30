import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { ClavesCatalogo } from './claves-catalogo';

/**
 * The catalogue was pulled out of `formatos.html` so `@defer` could split it
 * into its own chunk. These pin the two things that extraction could have
 * broken: that the parent's search text still reaches it, and that the claves
 * still render with their braces — the braces being the entire point of the
 * screen, since the operator pastes them into Word.
 */
describe('ClavesCatalogo', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  async function renderizar(consulta: string) {
    const fixture = TestBed.createComponent(ClavesCatalogo);
    fixture.componentRef.setInput('consulta', consulta);
    await fixture.whenStable();
    return fixture;
  }

  it('renders every group with its claves wrapped in braces', async () => {
    const fixture = await renderizar('');
    const texto: string = fixture.nativeElement.textContent;

    expect(texto).toContain('Datos del solicitante');
    expect(texto).toContain('Datos de la SOFOM');
    expect(texto).toContain('{' + '{curp}' + '}');
  });

  it('narrows to the matching claves when the parent passes a query', async () => {
    const fixture = await renderizar('curp');
    const texto: string = fixture.nativeElement.textContent;

    expect(texto).toContain('{' + '{curp}' + '}');
    expect(texto).not.toContain('Datos de la SOFOM');
  });

  it('says so rather than rendering an empty screen when nothing matches', async () => {
    const fixture = await renderizar('no-existe-esta-clave');

    expect(fixture.nativeElement.textContent).toContain('Ninguna clave coincide.');
  });
});
