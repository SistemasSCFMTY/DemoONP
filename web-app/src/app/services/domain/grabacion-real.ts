import { environment } from '../../../environments/environment';
import {
  BITRATE_VIDEO,
  DURACION_MAXIMA_MS,
  Grabacion,
  GrabacionSimulada,
  type MimeVideo,
  type MotivoFalloVideo,
  type OpcionesGrabacion,
  type ResultadoVideo,
  mimeBase,
  seleccionarMimeVideo,
} from './videograbacion';

/**
 * The real recorder: `getUserMedia` + `MediaRecorder`, capped at 45 seconds.
 *
 * Three things here are load-bearing and none of them is decoration.
 *
 * **The mime is chosen, never assumed.** The constructor is handed one of
 * `MIMES_VIDEO` that `isTypeSupported` already accepted. A browser that
 * supports none of them never reaches this class at all — `crearGrabacion`
 * returns the simulation instead. That is Safari/iOS, which throws when
 * asked for WebM.
 *
 * **The caps are the mitigation, not a preference.** 640×480 at 500 kbps for
 * 45 s is roughly 3 MB. The upload rides inside the same multipart POST as
 * the expediente, on "Completar Etapa 2" — the slowest click in the flow —
 * so a default-bitrate 720p recording would be the thing that breaks the
 * demo.
 *
 * **Every track is stopped in a `finally`.** A camera light still on after
 * the screen is gone is exactly what a stakeholder notices, and the `finally`
 * covers the paths that are easy to forget: a `MediaRecorder` constructor
 * that throws on a stream the browser will not encode, and an exception
 * between `start` and `stop`.
 */
export class GrabacionReal extends Grabacion {
  override readonly simulada = false;

  private grabadora: MediaRecorder | null = null;

  constructor(
    private readonly mimeSolicitado: MimeVideo,
    private readonly duracionMs = DURACION_MAXIMA_MS,
  ) {
    super();
  }

  override async grabar(opciones: OpcionesGrabacion = {}): Promise<ResultadoVideo> {
    let stream: MediaStream | null = null;
    let corte: ReturnType<typeof setTimeout> | undefined;
    let cuenta: ReturnType<typeof setInterval> | undefined;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // A bare value is `ideal` by spec. `exact` would throw
        // OverconstrainedError on a machine whose only camera does not
        // report a facing mode — a webcam on a desk, which is what the
        // rehearsal runs on.
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      const grabadora = new MediaRecorder(stream, {
        mimeType: this.mimeSolicitado,
        videoBitsPerSecond: BITRATE_VIDEO,
      });
      this.grabadora = grabadora;

      const trozos: Blob[] = [];
      grabadora.ondataavailable = (evento) => {
        if (evento.data.size > 0) trozos.push(evento.data);
      };

      const terminado = new Promise<void>((resolver) => {
        grabadora.onstop = () => resolver();
        grabadora.onerror = () => {
          if (grabadora.state !== 'inactive') grabadora.stop();
          else resolver();
        };
      });

      this.mostrar(opciones.vista, stream);

      // A timeslice, so an abrupt stop still leaves us the seconds already
      // encoded rather than one unflushed buffer.
      grabadora.start(1000);

      const inicio = Date.now();
      opciones.restante?.(Math.ceil(this.duracionMs / 1000));
      cuenta = setInterval(() => {
        const restan = Math.max(0, Math.ceil((this.duracionMs - (Date.now() - inicio)) / 1000));
        opciones.restante?.(restan);
      }, 250);

      corte = setTimeout(() => {
        if (grabadora.state !== 'inactive') grabadora.stop();
      }, this.duracionMs);

      await terminado;

      const mime = mimeBase(this.mimeSolicitado);
      const blob = new Blob(trozos, { type: mime });
      if (blob.size === 0) {
        return { grabado: false, simulado: false, video: null, motivo: 'error' };
      }
      return {
        grabado: true,
        simulado: false,
        video: { blob, mime, mimeSolicitado: this.mimeSolicitado },
      };
    } catch (err) {
      // The message, never the stream contents. §1 forbids logging a field
      // value and a frame of someone's face is one.
      console.warn('Videograbación:', err instanceof Error ? err.message : 'no disponible');
      return { grabado: false, simulado: false, video: null, motivo: motivoDe(err) };
    } finally {
      clearTimeout(corte);
      clearInterval(cuenta);
      this.grabadora = null;
      if (stream) {
        for (const pista of stream.getTracks()) pista.stop();
      }
      this.ocultar(opciones.vista);
    }
  }

  override detener(): void {
    const grabadora = this.grabadora;
    if (grabadora && grabadora.state !== 'inactive') grabadora.stop();
  }

  private mostrar(vista: HTMLVideoElement | null | undefined, stream: MediaStream): void {
    if (!vista) return;
    vista.srcObject = stream;
    vista.muted = true;
    // Autoplay can be refused; the recording is unaffected and the screen
    // still shows the countdown, so this is not worth failing over.
    void vista.play?.().catch(() => undefined);
  }

  private ocultar(vista: HTMLVideoElement | null | undefined): void {
    if (vista) vista.srcObject = null;
  }
}

function motivoDe(err: unknown): MotivoFalloVideo {
  if (!(err instanceof Error)) return 'error';
  if (err.name === 'NotAllowedError' || err.name === 'SecurityError') return 'permiso';
  if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') return 'sin-camara';
  return 'error';
}

/**
 * Which recorder this browser and this build get.
 *
 * Every fallback below lands on the labelled simulation rather than on a
 * dead screen, and the order is deliberate: the kill switch wins over
 * capability, because its whole purpose is to be obeyed without argument
 * while someone is presenting.
 */
export function crearGrabacion(): Grabacion {
  if (!environment.grabarVideo) return new GrabacionSimulada();
  if (typeof window === 'undefined' || !window.isSecureContext) return new GrabacionSimulada();
  if (typeof navigator === 'undefined') return new GrabacionSimulada();
  if (typeof navigator.mediaDevices?.getUserMedia !== 'function') return new GrabacionSimulada();

  const mime = seleccionarMimeVideo();
  if (!mime) return new GrabacionSimulada();

  return new GrabacionReal(mime);
}
