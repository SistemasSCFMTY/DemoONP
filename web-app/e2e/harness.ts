/**
 * The page under test for `videograbacion.mjs`.
 *
 * It loads the real `GrabacionReal` — the same module the app ships — into a
 * real Chromium with `--use-fake-device-for-media-stream`, so the assertions
 * land on the browser's own `MediaRecorder` and its own `MediaStreamTrack`.
 * A stub cannot prove that Chromium produces bytes, and it certainly cannot
 * prove that a track really ended.
 *
 * `getUserMedia` is wrapped, not replaced: the wrapper only keeps a
 * reference to each stream the service opens, because the service owns the
 * stream privately and the point of the run is to check what it did with it
 * after it was finished.
 *
 * Not part of the application build — `tsconfig.app.json` includes `src/`
 * only, and nothing in `src/` imports this file.
 */
import { GrabacionReal } from '../src/app/services/domain/grabacion-real';
import {
  MIMES_VIDEO,
  type MimeVideo,
  seleccionarMimeVideo,
} from '../src/app/services/domain/videograbacion';

interface Informe {
  readonly mimeElegido: MimeVideo | null;
  /**
   * The first of `MIMES_VIDEO` this browser really accepts, computed here
   * from `MediaRecorder.isTypeSupported` directly rather than through the
   * module under test. Without this the run cannot tell a detection that
   * consults the browser from one that hardcodes a mime, because Chromium
   * happens to support all four — which is precisely how a test ends up
   * passing against the bug that kills Safari.
   */
  readonly mimeEsperado: string | null;
  readonly mimesConocidos: readonly string[];
  readonly grabado: boolean;
  readonly simulado: boolean;
  readonly bytes: number;
  readonly mime: string | null;
  readonly mimeSolicitado: string | null;
  readonly tipoDelBlob: string | null;
  readonly pistas: readonly { kind: string; readyState: string }[];
  readonly visorSuelto: boolean;
}

declare global {
  interface Window {
    correrGrabacion(duracionMs: number): Promise<Informe>;
  }
}

const abiertos: MediaStream[] = [];
const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
navigator.mediaDevices.getUserMedia = async (restricciones?: MediaStreamConstraints) => {
  const stream = await original(restricciones);
  abiertos.push(stream);
  return stream;
};

window.correrGrabacion = async (duracionMs: number): Promise<Informe> => {
  abiertos.length = 0;

  const mimeEsperado = MIMES_VIDEO.find((tipo) => MediaRecorder.isTypeSupported(tipo)) ?? null;
  const mimeElegido = seleccionarMimeVideo();
  if (!mimeElegido) {
    throw new Error('Este Chromium no soporta ninguno de los cuatro mimes.');
  }

  const visor = document.querySelector('video');
  if (!visor) throw new Error('Falta el <video> del visor.');

  // The 45-second cap is unit-tested with fake timers; here the recording is
  // ended early so the run costs seconds, and the cleanup path exercised is
  // the same `finally`.
  const grabacion = new GrabacionReal(mimeElegido);
  const promesa = grabacion.grabar({ vista: visor });
  setTimeout(() => grabacion.detener(), duracionMs);
  const resultado = await promesa;

  return {
    mimeElegido,
    mimeEsperado,
    mimesConocidos: [...MIMES_VIDEO],
    grabado: resultado.grabado,
    simulado: resultado.simulado,
    bytes: resultado.video?.blob.size ?? 0,
    mime: resultado.video?.mime ?? null,
    mimeSolicitado: resultado.video?.mimeSolicitado ?? null,
    tipoDelBlob: resultado.video?.blob.type ?? null,
    pistas: abiertos.flatMap((s) =>
      s.getTracks().map((p) => ({ kind: p.kind, readyState: p.readyState })),
    ),
    visorSuelto: visor.srcObject === null,
  };
};
