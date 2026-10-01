import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Camara } from '../../../services/domain/camara';
import { CapturaLado } from './captura-lado';

/**
 * Mounted, because the bug this guards against lived between the class and
 * its template: the camera opened, the `<video>` rendered, and the stream
 * was never attached to it — the microtask that did so ran before the
 * zoneless render had created the element. The viewfinder stayed a blank
 * navy box and "Capturar" threw on a 0×0 canvas.
 */

const flujo = { getTracks: () => [] } as unknown as MediaStream;

class CamaraDoble {
  readonly disponible = true;
  capturas = 0;

  async abrir(): Promise<MediaStream | null> {
    return flujo;
  }

  cerrar(): void {}

  capturar(): HTMLCanvasElement {
    this.capturas++;
    return document.createElement('canvas');
  }
}

class ErrorHandlerEspia extends ErrorHandler {
  readonly vistos: unknown[] = [];
  override handleError(error: unknown): void {
    this.vistos.push(error);
  }
}

function montar() {
  const camara = new CamaraDoble();
  const espia = new ErrorHandlerEspia();
  TestBed.configureTestingModule({
    providers: [
      { provide: Camara, useValue: camara },
      { provide: ErrorHandler, useValue: espia },
    ],
  });
  const fixture = TestBed.createComponent(CapturaLado);
  fixture.componentRef.setInput('lado', 'front');
  fixture.componentRef.setInput('titulo', 'Frente');
  fixture.componentRef.setInput('pista', 'Coloca tu identificación dentro del marco.');
  fixture.componentRef.setInput('habilitado', true);
  return { fixture, camara, espia };
}

function pulsar(fixture: { nativeElement: HTMLElement }, etiqueta: string): void {
  const botones = [...fixture.nativeElement.querySelectorAll('button')];
  const boton = botones.find((b) => (b.textContent ?? '').includes(etiqueta));
  if (!boton) throw new Error(`No hay botón «${etiqueta}»`);
  boton.click();
}

describe('la captura de un lado de la identificación', () => {
  beforeEach(() => {
    // jsdom does not implement playback.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('conecta el flujo de la cámara al visor al pulsar «Tomar foto»', async () => {
    const { fixture, espia } = montar();
    await fixture.whenStable();

    pulsar(fixture, 'Tomar foto');
    await fixture.whenStable();

    const visor = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
    expect(visor).not.toBeNull();
    expect(visor.srcObject).toBe(flujo);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(espia.vistos).toEqual([]);
  });

  it('no captura mientras el visor no tiene un cuadro', async () => {
    const { fixture, camara, espia } = montar();
    await fixture.whenStable();

    pulsar(fixture, 'Tomar foto');
    await fixture.whenStable();
    // jsdom's <video> reports videoWidth 0, which is the no-frame case.
    pulsar(fixture, 'Capturar');
    await fixture.whenStable();

    expect(camara.capturas).toBe(0);
    expect(fixture.nativeElement.querySelector('video')).not.toBeNull();
    expect(espia.vistos).toEqual([]);
  });
});
