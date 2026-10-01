import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import type { PasoId } from '../../../model/interfaces/paso';
import { RegistrarVideo } from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { NavegacionState } from '../../../state/navegacion/navegacion.state';
import { SesionState } from '../../../state/sesion/sesion.state';
import { SimuladorState } from '../../../state/simulador/simulador.state';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { Signature } from './signature';

/**
 * CP-V4 seen from the screen the prospect is looking at.
 *
 * `solicitudes-http.spec.ts` proves the transport: one retry, no `video`
 * part, nothing retried that the Worker answered. This file proves the other
 * half of 01-conventions.md §11 — that the retry is *visible*. The second
 * attempt roughly doubles the wait on the slowest click in the flow, and a
 * silent extra minute there reads as a frozen app.
 *
 * jsdom has no 2D canvas, so the context and `toBlob` are stubbed. They are
 * scaffolding for reaching `completar()`, not the subject: what is asserted
 * is rendered markup and dispatched state.
 */

class ErrorHandlerEspia extends ErrorHandler {
  readonly vistos: unknown[] = [];
  override handleError(error: unknown): void {
    this.vistos.push(error);
  }
}

class NavegacionDoble {
  readonly puedeRegresar = { set: () => undefined };
  destinos: PasoId[] = [];
  async avanzar(destino: PasoId): Promise<void> {
    this.destinos.push(destino);
  }
}

/** A 2D context that records nothing: jsdom supplies none, and the drawing
 *  is only the precondition for the button becoming enabled. */
function contextoFalso(): CanvasRenderingContext2D {
  const nada = () => undefined;
  return {
    scale: nada,
    fillRect: nada,
    beginPath: nada,
    moveTo: nada,
    lineTo: nada,
    stroke: nada,
    fillStyle: '',
    strokeStyle: '',
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 2,
  } as unknown as CanvasRenderingContext2D;
}

function instalarLienzoFalso(): () => void {
  const proto = HTMLCanvasElement.prototype as unknown as Record<string, unknown>;
  const original = {
    getContext: proto['getContext'],
    toBlob: proto['toBlob'],
    setPointerCapture: (Element.prototype as unknown as Record<string, unknown>)[
      'setPointerCapture'
    ],
    createObjectURL: (URL as unknown as Record<string, unknown>)['createObjectURL'],
  };

  proto['getContext'] = () => contextoFalso();
  proto['toBlob'] = (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' }));
  (Element.prototype as unknown as Record<string, unknown>)['setPointerCapture'] = () => undefined;
  (URL as unknown as Record<string, unknown>)['createObjectURL'] = () => 'blob:firma';

  return () => {
    proto['getContext'] = original.getContext;
    proto['toBlob'] = original.toBlob;
    (Element.prototype as unknown as Record<string, unknown>)['setPointerCapture'] =
      original.setPointerCapture;
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = original.createObjectURL;
  };
}

function montar() {
  const espia = new ErrorHandlerEspia();
  const navegacion = new NavegacionDoble();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideStore([NavegacionState, SimuladorState, SesionState, SolicitudState, IdentidadState]),
      { provide: ErrorHandler, useValue: espia },
      { provide: NavegacionService, useValue: navegacion },
    ],
  });
  return {
    fixture: TestBed.createComponent(Signature),
    store: TestBed.inject(Store),
    http: TestBed.inject(HttpTestingController),
    espia,
    navegacion,
  };
}

function texto(fixture: ComponentFixture<Signature>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function boton(fixture: ComponentFixture<Signature>, etiqueta: string): HTMLButtonElement | null {
  const botones = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
  return botones.find((b) => (b.textContent ?? '').includes(etiqueta)) ?? null;
}

/** jsdom has no `PointerEvent`; a `MouseEvent` under the pointer type names
 *  carries the two coordinates the handlers read. */
function firmar(fixture: ComponentFixture<Signature>): void {
  const lienzo = (fixture.nativeElement as HTMLElement).querySelector('canvas');
  if (!lienzo) throw new Error('No se encontró el lienzo de la firma');
  for (const [tipo, x] of [
    ['pointerdown', 10],
    ['pointermove', 40],
    ['pointerup', 40],
  ] as const) {
    lienzo.dispatchEvent(new MouseEvent(tipo, { clientX: x, clientY: 20, bubbles: true }));
  }
}

const ES_ENVIO = (req: { url: string }) => req.url.endsWith('/solicitudes');

function morirEnLaRed(req: TestRequest): void {
  req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
}

describe('la pantalla de firma, cuando el vídeo no cabe por la red', () => {
  let restaurar: () => void;

  beforeEach(() => (restaurar = instalarLienzoFalso()));
  afterEach(() => {
    restaurar();
    TestBed.resetTestingModule();
  });

  it('dice que está reintentando sin el vídeo, y lo dice mientras espera', async () => {
    const { fixture, store, http, espia, navegacion } = montar();
    await fixture.whenStable();
    store.dispatch(
      new RegistrarVideo({
        blob: new Blob(['mp4'], { type: 'video/mp4' }),
        mime: 'video/mp4',
        mimeSolicitado: 'video/mp4;codecs=avc1',
      }),
    );

    firmar(fixture);
    await fixture.whenStable();
    expect(boton(fixture, 'Completar Etapa 2')?.disabled).toBe(false);

    boton(fixture, 'Completar Etapa 2')?.click();
    await fixture.whenStable();

    morirEnLaRed(http.expectOne(ES_ENVIO));
    await fixture.whenStable();

    // El segundo intento está en vuelo y la pantalla lo dice en voz alta.
    const enVuelo = texto(fixture);
    expect(enVuelo).toContain('No pudimos enviar tu videograbación');
    expect(enVuelo).toContain('Reintentando sin la videograbación…');

    const segundo = http.expectOne(ES_ENVIO);
    expect((segundo.request.body as FormData).has('video')).toBe(false);
    segundo.flush({ folio: 'ONP-260930-6659', id: 'exp-1' });
    await fixture.whenStable();

    // Y la admisión viaja con el folio a la pantalla 28.
    expect(store.selectSnapshot(SesionState.folio)).toBe('ONP-260930-6659');
    expect(store.selectSnapshot(SesionState.videoNoAdjuntado)).toBe(true);
    expect(navegacion.destinos).toEqual(['complete']);
    expect(espia.vistos.map((e) => String(e)).join('\n')).toBe('');
    http.verify();
  });

  it('no marca nada cuando el primer envío pasa a la primera', async () => {
    const { fixture, store, http, navegacion } = montar();
    await fixture.whenStable();
    store.dispatch(
      new RegistrarVideo({
        blob: new Blob(['mp4'], { type: 'video/mp4' }),
        mime: 'video/mp4',
        mimeSolicitado: 'video/mp4;codecs=avc1',
      }),
    );

    firmar(fixture);
    await fixture.whenStable();
    boton(fixture, 'Completar Etapa 2')?.click();
    await fixture.whenStable();

    const req = http.expectOne(ES_ENVIO);
    expect((req.request.body as FormData).has('video')).toBe(true);
    req.flush({ folio: 'ONP-260930-6659', id: 'exp-1' });
    await fixture.whenStable();

    expect(texto(fixture)).not.toContain('No pudimos enviar tu videograbación');
    expect(store.selectSnapshot(SesionState.videoNoAdjuntado)).toBe(false);
    expect(navegacion.destinos).toEqual(['complete']);
    http.verify();
  });
});
