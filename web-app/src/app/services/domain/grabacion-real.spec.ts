import { GrabacionReal } from './grabacion-real';
import {
  BITRATE_VIDEO,
  DURACION_MAXIMA_MS,
  GrabacionSimulada,
  MIMES_VIDEO,
  mimeBase,
  seleccionarMimeVideo,
} from './videograbacion';

/**
 * These tests stand in for the browser only where a browser cannot be made
 * to answer quickly: the 45-second cap, and the codec order on a device that
 * is not the one running the suite.
 *
 * The parts a stub cannot honestly prove — that Chromium really produces
 * bytes, and that its real `MediaStreamTrack.stop()` really ends the track —
 * are proved by the Playwright run in `e2e/videograbacion.mjs` against the
 * actual `MediaRecorder`. A stub that returns whatever the assertion wants
 * is worth nothing on its own.
 */

class PistaFalsa {
  readyState: 'live' | 'ended' = 'live';
  stop(): void {
    this.readyState = 'ended';
  }
}

class StreamFalso {
  readonly pistas = [new PistaFalsa(), new PistaFalsa()];
  getTracks(): PistaFalsa[] {
    return this.pistas;
  }
}

class GrabadoraFalsa {
  static ultima: GrabadoraFalsa | null = null;
  static lanzaAlConstruir: Error | null = null;

  state: 'inactive' | 'recording' = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  troceoMs: number | undefined;

  constructor(
    readonly stream: unknown,
    readonly opciones: { mimeType: string; videoBitsPerSecond: number },
  ) {
    if (GrabadoraFalsa.lanzaAlConstruir) throw GrabadoraFalsa.lanzaAlConstruir;
    GrabadoraFalsa.ultima = this;
  }

  start(troceoMs?: number): void {
    this.troceoMs = troceoMs;
    this.state = 'recording';
    // One chunk, as a real recorder would deliver on its first timeslice.
    this.ondataavailable?.({ data: new Blob(['0123456789']) });
  }

  stop(): void {
    this.state = 'inactive';
    this.onstop?.();
  }
}

interface Entorno {
  readonly stream: StreamFalso;
  restaurar(): void;
}

function conEntorno(falloGetUserMedia?: Error): Entorno {
  const stream = new StreamFalso();
  const globalCualquiera = globalThis as unknown as Record<string, unknown>;
  const navegadorPrevio = globalCualquiera['navigator'];
  const grabadoraPrevia = globalCualquiera['MediaRecorder'];

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      mediaDevices: {
        getUserMedia: async () => {
          if (falloGetUserMedia) throw falloGetUserMedia;
          return stream;
        },
      },
    },
  });
  globalCualquiera['MediaRecorder'] = GrabadoraFalsa;
  GrabadoraFalsa.ultima = null;
  GrabadoraFalsa.lanzaAlConstruir = null;

  return {
    stream,
    restaurar() {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: navegadorPrevio,
      });
      globalCualquiera['MediaRecorder'] = grabadoraPrevia;
    },
  };
}

function errorLlamado(nombre: string): Error {
  const err = new Error(nombre);
  err.name = nombre;
  return err;
}

describe('seleccionarMimeVideo', () => {
  it('prefiere mp4/avc1 — es lo único que Safari acepta', () => {
    expect(seleccionarMimeVideo(() => true)).toBe('video/mp4;codecs=avc1');
  });

  it('respeta el orden de MIMES_VIDEO cuando mp4 no está', () => {
    const sinMp4 = (tipo: string) => !tipo.startsWith('video/mp4');
    expect(seleccionarMimeVideo(sinMp4)).toBe('video/webm;codecs=vp9');
  });

  it('cae a video/webm a secas cuando no hay códec nombrado', () => {
    expect(seleccionarMimeVideo((tipo) => tipo === 'video/webm')).toBe('video/webm');
  });

  it('devuelve null cuando el navegador no soporta ninguno', () => {
    // Safari antes de que acepte mp4 por MediaRecorder: es el caso que
    // obliga a la simulación en vez de a una excepción.
    expect(seleccionarMimeVideo(() => false)).toBeNull();
  });

  it('devuelve null cuando no hay MediaRecorder en absoluto', () => {
    expect(seleccionarMimeVideo(null)).toBeNull();
  });
});

describe('mimeBase', () => {
  it('quita el parámetro codecs, que el Worker no reconoce', () => {
    expect(mimeBase('video/webm;codecs=vp9')).toBe('video/webm');
    expect(mimeBase('video/mp4;codecs=avc1')).toBe('video/mp4');
    expect(mimeBase('video/webm')).toBe('video/webm');
  });
});

describe('GrabacionReal', () => {
  let entorno: Entorno | null = null;

  afterEach(() => {
    entorno?.restaurar();
    entorno = null;
    vi.useRealTimers();
  });

  it('graba, devuelve el blob y el mime base, y apaga todas las pistas', async () => {
    entorno = conEntorno();
    const grabacion = new GrabacionReal('video/webm;codecs=vp9', 30);
    const resultado = await grabacion.grabar();

    expect(resultado.grabado).toBe(true);
    expect(resultado.simulado).toBe(false);
    expect(resultado.video?.blob.size).toBeGreaterThan(0);
    // El wire lleva el tipo base; el parámetro codecs rompe la búsqueda de
    // extensión del Worker.
    expect(resultado.video?.mime).toBe('video/webm');
    expect(resultado.video?.blob.type).toBe('video/webm');
    expect(resultado.video?.mimeSolicitado).toBe('video/webm;codecs=vp9');
    expect(MIMES_VIDEO).toContain(resultado.video?.mimeSolicitado);

    for (const pista of entorno.stream.getTracks()) {
      expect(pista.readyState).toBe('ended');
    }
  });

  it('pide 500 kbps y trocea, para que 45 s quepan en ~3 MB', async () => {
    entorno = conEntorno();
    await new GrabacionReal('video/webm', 30).grabar();

    expect(GrabadoraFalsa.ultima?.opciones.videoBitsPerSecond).toBe(BITRATE_VIDEO);
    expect(GrabadoraFalsa.ultima?.opciones.mimeType).toBe('video/webm');
    expect(GrabadoraFalsa.ultima?.troceoMs).toBe(1000);
  });

  it('corta a los 45 s por omisión', async () => {
    entorno = conEntorno();
    vi.useFakeTimers();

    const promesa = new GrabacionReal('video/webm').grabar();
    // Deja pasar el await de getUserMedia sin avanzar el reloj.
    await vi.advanceTimersByTimeAsync(0);
    expect(GrabadoraFalsa.ultima?.state).toBe('recording');

    await vi.advanceTimersByTimeAsync(DURACION_MAXIMA_MS - 1);
    expect(GrabadoraFalsa.ultima?.state).toBe('recording');

    await vi.advanceTimersByTimeAsync(1);
    expect(GrabadoraFalsa.ultima?.state).toBe('inactive');

    const resultado = await promesa;
    expect(resultado.grabado).toBe(true);
  });

  it('va contando los segundos que faltan', async () => {
    entorno = conEntorno();
    vi.useFakeTimers();

    const vistos: number[] = [];
    const promesa = new GrabacionReal('video/webm', 2000).grabar({
      restante: (s) => vistos.push(s),
    });
    await vi.advanceTimersByTimeAsync(2000);
    await promesa;

    expect(vistos[0]).toBe(2);
    expect(vistos).toContain(1);
  });

  it('un permiso denegado devuelve motivo "permiso", no una excepción', async () => {
    entorno = conEntorno(errorLlamado('NotAllowedError'));
    const resultado = await new GrabacionReal('video/webm', 30).grabar();

    expect(resultado.grabado).toBe(false);
    expect(resultado.simulado).toBe(false);
    expect(resultado.motivo).toBe('permiso');
    expect(resultado.video).toBeNull();
  });

  it('un dispositivo sin cámara devuelve motivo "sin-camara"', async () => {
    entorno = conEntorno(errorLlamado('NotFoundError'));
    expect((await new GrabacionReal('video/webm', 30).grabar()).motivo).toBe('sin-camara');
  });

  it('apaga las pistas aunque MediaRecorder reviente al construirse', async () => {
    entorno = conEntorno();
    GrabadoraFalsa.lanzaAlConstruir = new Error('codec no soportado');

    const resultado = await new GrabacionReal('video/webm', 30).grabar();

    expect(resultado.grabado).toBe(false);
    // El `finally` es lo único entre esto y una luz de cámara encendida
    // después de que la pantalla ya no está.
    for (const pista of entorno.stream.getTracks()) {
      expect(pista.readyState).toBe('ended');
    }
  });

  it('detener() corta antes del tope', async () => {
    entorno = conEntorno();
    const grabacion = new GrabacionReal('video/webm', DURACION_MAXIMA_MS);
    const promesa = grabacion.grabar();
    await Promise.resolve();
    await Promise.resolve();
    grabacion.detener();

    const resultado = await promesa;
    expect(resultado.grabado).toBe(true);
  });

  it('refleja el visor y lo suelta al terminar', async () => {
    entorno = conEntorno();
    const vista = {
      srcObject: null as unknown,
      muted: false,
      play: () => Promise.resolve(),
    } as unknown as HTMLVideoElement;

    await new GrabacionReal('video/webm', 30).grabar({ vista });

    expect(vista.srcObject).toBeNull();
  });
});

describe('GrabacionSimulada', () => {
  it('no produce bytes y lo admite', async () => {
    const resultado = await new GrabacionSimulada().grabar();
    expect(resultado.grabado).toBe(true);
    expect(resultado.simulado).toBe(true);
    expect(resultado.video).toBeNull();
  });
});
