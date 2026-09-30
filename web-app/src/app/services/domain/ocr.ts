import { Injectable } from '@angular/core';
import type { LadoFoto } from '../../state/identidad/identidad.model';
import { parsearFrente, parsearReverso, type DatosFrente, type DatosReverso } from './ocr-ine';

/**
 * Reading a credencial para votar with Tesseract, **in the browser**.
 *
 * It cannot run in a Cloudflare Worker: the WASM core plus a ~15MB
 * `traineddata` blow past the bundle cap and the CPU budget per request.
 * That is a platform constraint, not a preference — deviation D7 in
 * 01-conventions.md, and the reason this file exists at all.
 *
 * Tesseract 7 comes from npm rather than a CDN, so the build owns the
 * version. The library itself is imported dynamically: it is roughly a
 * megabyte of JavaScript before the language data, and a prospect who never
 * reaches `id-photos` should never pay for it.
 *
 * The first read downloads the Spanish model and can take most of a minute.
 * The screen says so, out loud, in the source's own words.
 */
export type ProgresoOcr = (porcentaje: number) => void;

@Injectable({ providedIn: 'root' })
export class Ocr {
  /**
   * Read one side of a credencial.
   *
   * @returns the fields it could find. An empty object is a normal outcome —
   *          every field lands in an editable box and the prospect can type
   *          what the camera could not read.
   */
  async leerCredencial(
    lado: LadoFoto,
    lienzo: HTMLCanvasElement,
    progreso?: ProgresoOcr,
  ): Promise<Partial<DatosFrente & DatosReverso>> {
    let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | null = null;
    try {
      const { createWorker } = await import('tesseract.js');

      const escala = lienzo.width < 1400 ? 2 : 1.3;
      const imagen = this.prepararParaOcr(lienzo, escala);

      worker = await createWorker('spa', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') progreso?.(Math.round(m.progress * 100));
        },
      });

      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<ÑÁÉÍÓÚ .',
      });

      const { data } = await worker.recognize(imagen);
      let texto = data.text;

      // The back gets a second pass over the bottom third, where the MRZ is.
      // It is small, dense and set in OCR-B; at the full frame's scale
      // Tesseract reliably misreads it.
      if (lado === 'back') {
        const mrz = this.prepararParaOcr(this.recortar(lienzo, 0, 0.62, 1, 0.38), 2.2);
        const segunda = await worker.recognize(mrz);
        texto += '\n' + segunda.data.text;
      }

      // NOTE: the source logs the whole OCR text to the console (`:4864`).
      // That text is the contents of an identity document — §1 forbids
      // logging a field value, so it is not logged here.
      return lado === 'front' ? parsearFrente(texto) : parsearReverso(texto);
    } catch (err) {
      console.error('OCR:', err instanceof Error ? err.message : 'falló');
      return {};
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          /* a worker that will not close is not worth failing the capture over */
        }
      }
    }
  }

  /**
   * Upscale and convert to high-contrast greyscale.
   *
   * Tesseract reads printed text far better at 2× than at native phone
   * resolution, and the colour of a credencial is noise to it.
   */
  private prepararParaOcr(origen: HTMLCanvasElement, escala: number): HTMLCanvasElement {
    const destino = document.createElement('canvas');
    destino.width = Math.round(origen.width * escala);
    destino.height = Math.round(origen.height * escala);
    const ctx = destino.getContext('2d');
    if (!ctx) return origen;

    ctx.filter = 'grayscale(1) contrast(1.35)';
    ctx.drawImage(origen, 0, 0, destino.width, destino.height);
    return destino;
  }

  /** Crop by fractions of the source, so it works at any resolution. */
  private recortar(
    origen: HTMLCanvasElement,
    x: number,
    y: number,
    ancho: number,
    alto: number,
  ): HTMLCanvasElement {
    const destino = document.createElement('canvas');
    destino.width = Math.round(origen.width * ancho);
    destino.height = Math.round(origen.height * alto);
    destino
      .getContext('2d')
      ?.drawImage(
        origen,
        Math.round(origen.width * x),
        Math.round(origen.height * y),
        destino.width,
        destino.height,
        0,
        0,
        destino.width,
        destino.height,
      );
    return destino;
  }
}
