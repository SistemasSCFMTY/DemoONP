import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngxs/store';
import {
  Grabacion,
  type OpcionesGrabacion,
  type ResultadoVideo,
} from '../../../services/domain/videograbacion';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { NavegacionState } from '../../../state/navegacion/navegacion.state';
import { SesionState } from '../../../state/sesion/sesion.state';
import { SimuladorState } from '../../../state/simulador/simulador.state';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import { Video } from './video';

/**
 * The screen is mounted, not just its functions called.
 *
 * Two reasons. One is the NG0600 class of bug that shipped to Pages from
 * `bloque-generales`: a template error leaves the half-updated DOM standing
 * and reads as "the styles did not load", and no amount of unit-testing the
 * logic behind a screen catches it.
 *
 * The other is 01-conventions.md §11, which is the point of this checkpoint:
 * the "Modo demostración" note must appear exactly when the recording is
 * simulated and not otherwise. That is a statement about rendered markup, so
 * it is asserted against rendered markup.
 */

class GrabacionDoble extends Grabacion {
  resultado: ResultadoVideo = { grabado: true, simulado: false, video: null };
  ultimasOpciones: OpcionesGrabacion | undefined;
  detenida = false;

  constructor(override readonly simulada: boolean) {
    super();
  }

  override async grabar(opciones?: OpcionesGrabacion): Promise<ResultadoVideo> {
    this.ultimasOpciones = opciones;
    return this.resultado;
  }

  override detener(): void {
    this.detenida = true;
  }
}

class ErrorHandlerEspia extends ErrorHandler {
  readonly vistos: unknown[] = [];
  override handleError(error: unknown): void {
    this.vistos.push(error);
  }
}

function montar(grabacion: GrabacionDoble) {
  const espia = new ErrorHandlerEspia();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideStore([NavegacionState, SimuladorState, SesionState, SolicitudState, IdentidadState]),
      { provide: Grabacion, useValue: grabacion },
      { provide: ErrorHandler, useValue: espia },
    ],
  });
  return { fixture: TestBed.createComponent(Video), espia };
}

function texto(fixture: { nativeElement: HTMLElement }): string {
  return fixture.nativeElement.textContent ?? '';
}

/** `grabar()` and `continuarSinCamara()` are protected; the template is the
 *  only legitimate caller, so the test goes through the template too. */
function pulsar(fixture: { nativeElement: HTMLElement }, etiqueta: string): boolean {
  const botones = [...fixture.nativeElement.querySelectorAll('button')];
  const boton = botones.find((b) => (b.textContent ?? '').includes(etiqueta));
  if (!boton || boton.disabled) return false;
  boton.click();
  return true;
}

describe('la pantalla de videograbación', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renderiza sin que nada llegue al ErrorHandler y con los textos resueltos', async () => {
    const { fixture, espia } = montar(new GrabacionDoble(false));
    await fixture.whenStable();

    const mensajes = espia.vistos.map((e) => String(e)).join('\n');
    expect(mensajes).not.toContain('NG0600');
    expect(mensajes).toBe('');

    // Bindings resolved, not just static markup left over from the create pass.
    expect(texto(fixture)).toContain('Grabación de vídeo');
    expect(texto(fixture)).toContain('Iniciar grabación');
    expect(texto(fixture)).toContain('No grabado');
  });

  it('no dice "Modo demostración" cuando la grabación es real', async () => {
    const { fixture } = montar(new GrabacionDoble(false));
    await fixture.whenStable();
    expect(texto(fixture)).not.toContain('Modo demostración');
  });

  it('dice "Modo demostración" cuando la implementación es la simulada', async () => {
    const { fixture } = montar(new GrabacionDoble(true));
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Modo demostración');
  });

  it('mantiene el <video> montado para que el visor exista antes de grabar', async () => {
    const { fixture } = montar(new GrabacionDoble(false));
    await fixture.whenStable();

    const visor = fixture.nativeElement.querySelector('video');
    expect(visor).not.toBeNull();
    // Oculto por clase, no por @if: un @if lo crearía después del set de la
    // señal y viewChild llegaría tarde.
    expect(visor?.closest('.hidden')).not.toBeNull();
  });

  it('exige los 6 dígitos del OTP antes de encender la cámara', async () => {
    const doble = new GrabacionDoble(false);
    const { fixture } = montar(doble);
    await fixture.whenStable();

    expect(pulsar(fixture, 'Iniciar grabación')).toBe(true);
    await fixture.whenStable();

    expect(doble.ultimasOpciones).toBeUndefined();
    expect(texto(fixture)).toContain('Ingresa los 6 dígitos del código.');
  });

  it('un permiso denegado deja una salida usable, no un botón muerto', async () => {
    const doble = new GrabacionDoble(false);
    doble.resultado = { grabado: false, simulado: false, video: null, motivo: 'permiso' };
    const { fixture } = montar(doble);
    await fixture.whenStable();

    escribirOtp(fixture);
    expect(pulsar(fixture, 'Iniciar grabación')).toBe(true);
    await fixture.whenStable();

    expect(texto(fixture)).toContain('No autorizaste el acceso a la cámara');
    expect(texto(fixture)).toContain('Continuar sin grabación de vídeo');
    // Y esa salida marca el paso y lo admite en la nota.
    expect(pulsar(fixture, 'Continuar sin grabación de vídeo')).toBe(true);
    await fixture.whenStable();

    expect(texto(fixture)).toContain('Modo demostración');
    expect(texto(fixture)).toContain('Grabado');
    const continuar = [...fixture.nativeElement.querySelectorAll('button')].find(
      (b: HTMLButtonElement) => (b.textContent ?? '').trim() === 'Continuar',
    );
    expect(continuar?.disabled).toBe(false);
  });

  it('una grabación real pasa el visor y el contador al servicio', async () => {
    const doble = new GrabacionDoble(false);
    doble.resultado = {
      grabado: true,
      simulado: false,
      video: {
        blob: new Blob(['x'], { type: 'video/webm' }),
        mime: 'video/webm',
        mimeSolicitado: 'video/webm;codecs=vp9',
      },
    };
    const { fixture } = montar(doble);
    await fixture.whenStable();

    escribirOtp(fixture);
    pulsar(fixture, 'Iniciar grabación');
    await fixture.whenStable();

    expect(doble.ultimasOpciones?.vista).toBeInstanceOf(HTMLVideoElement);
    expect(typeof doble.ultimasOpciones?.restante).toBe('function');
    expect(texto(fixture)).not.toContain('Modo demostración');
    expect(texto(fixture)).toContain('Grabado');
  });

  it('al destruirse detiene la grabadora, para no dejar la cámara encendida', async () => {
    const doble = new GrabacionDoble(false);
    const { fixture } = montar(doble);
    await fixture.whenStable();

    fixture.destroy();
    expect(doble.detenida).toBe(true);
  });
});

function escribirOtp(fixture: { nativeElement: HTMLElement }): void {
  const entrada = fixture.nativeElement.querySelector<HTMLInputElement>('#video-otp');
  if (!entrada) throw new Error('No se encontró el campo OTP');
  entrada.value = '123456';
  entrada.dispatchEvent(new Event('input'));
}
