import { Injectable } from '@angular/core';

/**
 * `getUserMedia` capture, with a file-upload fallback.
 *
 * The camera and the photo preview are what sell this on stage, so the
 * failure modes matter: a denied permission, a device with no rear camera,
 * and a browser on http:// (getUserMedia needs a secure context) all have to
 * land on "usa el botón de subir archivo" rather than on a dead screen.
 *
 * Every stream this opens must be stopped. A phone that keeps recording after
 * the prospect has moved on is both a privacy problem and a hot battery.
 */
@Injectable({ providedIn: 'root' })
export class Camara {
  readonly disponible =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    window.isSecureContext;

  private readonly abiertas = new Map<string, MediaStream>();

  /**
   * Open the rear camera at whatever resolution it will give, up to 1920.
   * `ideal` rather than `exact`: a laptop has no `environment` camera and an
   * exact constraint would fail outright instead of using the one it has.
   */
  async abrir(clave: string): Promise<MediaStream | null> {
    if (!this.disponible) return null;
    this.cerrar(clave);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      this.abiertas.set(clave, stream);
      return stream;
    } catch (err) {
      console.warn('Cámara:', err instanceof Error ? err.message : 'no disponible');
      return null;
    }
  }

  cerrar(clave: string): void {
    const stream = this.abiertas.get(clave);
    if (!stream) return;
    for (const pista of stream.getTracks()) pista.stop();
    this.abiertas.delete(clave);
  }

  cerrarTodas(): void {
    for (const clave of [...this.abiertas.keys()]) this.cerrar(clave);
  }

  /** Grab the current video frame onto a canvas, at the sensor's resolution. */
  capturar(video: HTMLVideoElement): HTMLCanvasElement {
    const lienzo = document.createElement('canvas');
    lienzo.width = video.videoWidth;
    lienzo.height = video.videoHeight;
    lienzo.getContext('2d')?.drawImage(video, 0, 0, lienzo.width, lienzo.height);
    return lienzo;
  }

  /** Decode an uploaded file onto a canvas, so both paths produce the same
   *  thing and quality analysis and OCR do not care which was used. */
  async desdeArchivo(archivo: File): Promise<HTMLCanvasElement | null> {
    const url = URL.createObjectURL(archivo);
    try {
      const imagen = await new Promise<HTMLImageElement | null>((resolver) => {
        const img = new Image();
        img.onload = () => resolver(img);
        img.onerror = () => resolver(null);
        img.src = url;
      });
      if (!imagen) return null;
      const lienzo = document.createElement('canvas');
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      lienzo.getContext('2d')?.drawImage(imagen, 0, 0);
      return lienzo;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** JPEG at 0.92, as the source encodes (`:4603`). */
  aBlob(lienzo: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolver) => {
      lienzo.toBlob(
        (blob) => resolver(blob ?? new Blob([], { type: 'image/jpeg' })),
        'image/jpeg',
        0.92,
      );
    });
  }
}
