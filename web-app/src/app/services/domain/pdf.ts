import { Injectable } from '@angular/core';

/**
 * The prospect's PDF copy of the solicitud they signed.
 *
 * `html2pdf.js` renders an element to a PDF in the browser. It stays in the
 * browser — it was never a candidate for the Worker, and the element it
 * renders is already on screen, so what the prospect downloads is what they
 * read.
 *
 * Imported dynamically: it pulls in html2canvas and jsPDF, which together
 * are larger than the rest of this app, and only one screen in twenty-eight
 * offers the download.
 */
@Injectable({ providedIn: 'root' })
export class Pdf {
  /**
   * @param elemento the rendered document
   * @param nombre the file name, without extension
   * @returns false when the library failed to load or render, so the caller
   *          can say so rather than leaving a button that does nothing
   */
  async descargar(elemento: HTMLElement, nombre: string): Promise<boolean> {
    try {
      const modulo = await import('html2pdf.js');
      const html2pdf = (modulo.default ?? modulo) as (...args: unknown[]) => {
        set: (opciones: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } };
      };

      await html2pdf()
        .set({
          margin: [10, 10, 12, 10],
          filename: `${nombre}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          // 2× so the signature and the small print survive the raster.
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(elemento)
        .save();
      return true;
    } catch (err) {
      console.error('PDF:', err instanceof Error ? err.message : 'falló');
      return false;
    }
  }
}
