/**
 * The identity videograbación — the contract, the simulation, and the codec
 * detection both implementations share.
 *
 * The real recorder lives in `grabacion-real.ts`, together with the factory
 * that decides which of the two this browser gets. Keeping the abstract
 * class here means `grabacion-real.ts` imports this file and not the other
 * way round, so there is no module cycle to reason about.
 *
 * The video is **a file in the expediente**, exactly like the INE photos and
 * the comprobante de domicilio: same `expedientes/{folio}/` folder, same
 * `archivos` table, same SHA-256. It is not a separate biometric artifact.
 * Biometrics (`huella`, `rostro`) stay simulated — see `biometria.ts`.
 */

/** Hard cap. 45 s is the source's own promise on the screen (`:1801`). */
export const DURACION_MAXIMA_MS = 45_000;
export const DURACION_MAXIMA_S = DURACION_MAXIMA_MS / 1000;

/**
 * Roughly 3 MB for 45 s at 640×480. The caps are not a nicety: the upload
 * lands on "Completar Etapa 2", already the slowest click in the flow, and
 * 45 s at a default 720p bitrate blows past any sane size.
 */
export const BITRATE_VIDEO = 500_000;

/**
 * What `MediaRecorder` may be asked for, best first.
 *
 * **Order matters and the list is the whole reason this screen does not die
 * on stage.** Safari/iOS has had `MediaRecorder` since 14.1 but does not do
 * WebM and *throws* when asked for it, so mp4/avc1 is tried first and every
 * entry is checked with `isTypeSupported` before it is used. Nothing
 * supported at all means the simulation, not a crash.
 */
export const MIMES_VIDEO = [
  'video/mp4;codecs=avc1',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const;

export type MimeVideo = (typeof MIMES_VIDEO)[number];

export interface VideoGrabado {
  readonly blob: Blob;
  /**
   * The mime that goes on the wire — `video/webm` or `video/mp4`, with the
   * `codecs=` parameter stripped.
   *
   * The Worker maps a part's mime to a file extension with an exact-match
   * lookup (`EXTENSION_POR_MIME`, CP-V1), and it keys on the base type. A
   * part announced as `video/webm;codecs=vp9` misses that lookup and is
   * rejected. So the `Blob` carries the base type and so does this.
   */
  readonly mime: string;
  /**
   * The full string handed to `MediaRecorder`, codecs parameter and all —
   * one of `MIMES_VIDEO`. Kept apart from `mime` because it is the evidence
   * that the codec detection actually ran, and it is what a bug report about
   * an unplayable file needs to name.
   */
  readonly mimeSolicitado: MimeVideo;
}

/** Why a real recording produced nothing. Drives the copy on the screen. */
export type MotivoFalloVideo = 'permiso' | 'sin-camara' | 'error';

export interface ResultadoVideo {
  readonly grabado: boolean;
  /**
   * True when no camera was involved. The screen's "Modo demostración" note
   * is bound to this and to nothing else: a simulation that stops admitting
   * it is the failure mode 01-conventions.md §11 exists to prevent.
   */
  readonly simulado: boolean;
  /** `null` for a simulated recording — a simulation ships no bytes. */
  readonly video: VideoGrabado | null;
  readonly motivo?: MotivoFalloVideo;
}

export interface OpcionesGrabacion {
  /**
   * Where to mirror the camera while it records. The element must already be
   * in the DOM when `grabar` is called; the screen keeps it mounted and
   * hides it with a class rather than an `@if`, so there is no race between
   * the signal write and the view update.
   */
  readonly vista?: HTMLVideoElement | null;
  /** Called with whole seconds left, only when the number changes. */
  readonly restante?: (segundos: number) => void;
}

export abstract class Grabacion {
  abstract grabar(opciones?: OpcionesGrabacion): Promise<ResultadoVideo>;
  /** Ends a recording in flight. Safe to call when nothing is running. */
  abstract detener(): void;
  abstract readonly simulada: boolean;
}

/**
 * The stand-in. Reached three ways: the `grabarVideo` kill switch is off,
 * the browser cannot record (no `MediaRecorder`, no secure context, no
 * supported mime), or the prospect declined the camera and chose to carry on
 * without it.
 *
 * It produces **no bytes**. Nothing is uploaded, nothing is invented, and the
 * screen says so.
 */
export class GrabacionSimulada extends Grabacion {
  override readonly simulada = true;

  override async grabar(): Promise<ResultadoVideo> {
    await new Promise((r) => setTimeout(r, 1200));
    return { grabado: true, simulado: true, video: null };
  }

  override detener(): void {
    // Nothing is running.
  }
}

/**
 * The first entry of `MIMES_VIDEO` this browser admits to supporting, or
 * `null`.
 *
 * `soportado` is injected so the order can be tested without a browser; in
 * the app it is `MediaRecorder.isTypeSupported`, which does not exist at all
 * on a browser without `MediaRecorder` and must not be reached for blindly.
 */
export function seleccionarMimeVideo(soportado = soporteNativo()): MimeVideo | null {
  if (!soportado) return null;
  for (const mime of MIMES_VIDEO) {
    if (soportado(mime)) return mime;
  }
  return null;
}

function soporteNativo(): ((tipo: string) => boolean) | null {
  if (typeof MediaRecorder === 'undefined') return null;
  if (typeof MediaRecorder.isTypeSupported !== 'function') return null;
  return (tipo) => MediaRecorder.isTypeSupported(tipo);
}

/** `video/webm;codecs=vp9` → `video/webm`. See `VideoGrabado.mime`. */
export function mimeBase(mime: string): string {
  return mime.split(';')[0].trim();
}
