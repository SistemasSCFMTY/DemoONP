import { Injectable } from '@angular/core';

/**
 * "Descargar PDF" for the signed solicitud.
 *
 * The prospect app renders its PDF with `html2pdf.js` in the browser. The
 * panel does not take that dependency: it would add roughly half a megabyte
 * to a staff tool to reproduce something every browser already does better
 * than a canvas rasteriser — the print dialog's "Guardar como PDF" keeps the
 * document as selectable text rather than flattening it to an image, which
 * matters for a document somebody may need to search or quote.
 *
 * Departure from the source's `descargarPDFExp` (`:5661`), noted in the PR.
 *
 * The document HTML comes from our own Worker (`documento.contenido_html`),
 * built from the plantilla — it is not operator input and not third-party
 * content.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionDocumento {
  /**
   * Opens the solicitud in its own window, styled for paper, and raises the
   * print dialog. Returns false when the browser blocked the popup, so the
   * caller can say so instead of appearing to do nothing.
   */
  imprimir(folio: string, contenidoHtml: string): boolean {
    const ventana = window.open('', '_blank', 'noopener,noreferrer,width=880,height=1000');
    if (!ventana) return false;

    ventana.document.write(this.#pagina(folio, contenidoHtml));
    ventana.document.close();
    ventana.focus();

    // Let the fonts settle before the dialog freezes the layout.
    ventana.setTimeout(() => ventana.print(), 350);
    return true;
  }

  /**
   * The source's `.doc-hoja` rules (`:136`–`:149`), restated for paper. Typed
   * out here rather than shared with the app stylesheet because the printed
   * solicitud is a legal document with its own measure and rhythm, not a
   * component of the panel.
   */
  #pagina(folio: string, contenidoHtml: string): string {
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Solicitud ${folio}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Charis+SIL:wght@400;700&display=swap">
<style>
  @page { size: letter; margin: 22mm 18mm; }
  body { font-family: 'Archivo', system-ui, sans-serif; font-size: 11.5px; line-height: 1.65;
         color: #111; margin: 0; padding: 26px 22px; }
  h1, h2, h3 { font-family: 'Charis SIL', Georgia, serif; color: #0e2036; margin: 14px 0 7px 0; }
  h1 { font-size: 15px; text-align: center; }
  h2 { font-size: 13px; }
  h3 { font-size: 12px; }
  p { margin: 0 0 9px 0; }
  p.c { text-align: center; }
  p.r { text-align: right; }
  p.j { text-align: justify; }
  p.b { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 9px 0; font-size: 10.5px; }
  td, th { border: 1px solid #ccc; padding: 5px 7px; text-align: left; vertical-align: top; }
  .firma-zona { margin-top: 26px; text-align: center; }
  .firma-zona img { max-width: 190px; display: block; margin: 0 auto 2px; }
</style>
</head>
<body>${contenidoHtml}</body>
</html>`;
  }
}
