import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { NavegacionState } from '../../../state/navegacion/navegacion.state';
import { EstablecerFolio, RegistrarVideoNoAdjuntado } from '../../../state/sesion/sesion.actions';
import { SesionState } from '../../../state/sesion/sesion.state';
import { SimuladorState } from '../../../state/simulador/simulador.state';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { Complete } from './complete';

/**
 * Screen 28 is where the prospect reads the outcome and keeps the folio, so
 * it is where the CP-V4 admission has to land: the application was received,
 * the recording was not attached. Saying it only on the signature screen
 * would say it to nobody — the navigation happens in the same tick.
 *
 * Mounted rather than unit-tested, for the NG0600 reason in
 * 01-conventions.md §6: a template error leaves the half-updated DOM
 * standing and reads as "the styles did not load".
 */

class ErrorHandlerEspia extends ErrorHandler {
  readonly vistos: unknown[] = [];
  override handleError(error: unknown): void {
    this.vistos.push(error);
  }
}

function montar() {
  const espia = new ErrorHandlerEspia();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideStore([NavegacionState, SimuladorState, SesionState, SolicitudState, IdentidadState]),
      { provide: ErrorHandler, useValue: espia },
    ],
  });
  return { store: TestBed.inject(Store), espia };
}

function texto(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.textContent ?? '';
}

const ADMISION = 'No pudimos adjuntar tu videograbación';

describe('la pantalla de solicitud enviada', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renderiza el folio sin que nada llegue al ErrorHandler', async () => {
    const { store, espia } = montar();
    store.dispatch(new EstablecerFolio('ONP-260930-6659'));

    const fixture = TestBed.createComponent(Complete);
    await fixture.whenStable();

    expect(espia.vistos.map((e) => String(e)).join('\n')).toBe('');
    expect(texto(fixture)).toContain('ONP-260930-6659');
  });

  it('no dice nada del vídeo cuando el envío salió completo', async () => {
    const { store } = montar();
    store.dispatch(new EstablecerFolio('ONP-260930-6659'));

    const fixture = TestBed.createComponent(Complete);
    await fixture.whenStable();

    expect(texto(fixture)).not.toContain(ADMISION);
  });

  it('admite el vídeo faltante sin insinuar que la solicitud se perdió', async () => {
    const { store } = montar();
    store.dispatch(new EstablecerFolio('ONP-260930-6659'));
    store.dispatch(new RegistrarVideoNoAdjuntado());

    const fixture = TestBed.createComponent(Complete);
    await fixture.whenStable();

    const visible = texto(fixture);
    expect(visible).toContain(ADMISION);
    expect(visible).toContain('se interrumpió la conexión al enviarla');
    // Nombra el hecho bueno y el malo por separado: el expediente existe.
    expect(visible).toContain('sí quedó registrada con este folio');
    expect(visible).toContain('la grabación no forma parte del expediente');
    expect(visible).toContain('ONP-260930-6659');
  });
});
