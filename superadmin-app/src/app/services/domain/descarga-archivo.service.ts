import { Injectable } from '@angular/core';

/**
 * Hands a fetched `Blob` to the browser as a file.
 *
 * Used for the expediente export, which is **bulk PII** — every CURP, RFC,
 * address and income in the database in one file. Three properties follow
 * from that and are the reason this is a service and not three lines inline:
 *
 * - **It is driven by a fetched blob, never by an `<a href>` to the endpoint.**
 *   A link to `/expedientes/exportar` is a URL a browser may prefetch, a
 *   password manager may probe and the history will keep. The request is made
 *   deliberately, once, by code.
 * - **The object URL is revoked immediately.** While it exists it is a
 *   readable handle on the whole dataset from anything running in the page.
 * - **Nothing here logs.** Not the blob, not its size, not the filename.
 *
 * The anchor is never attached to the document: `click()` on a detached
 * element still triggers the download and leaves no node behind for a stray
 * selector to find.
 */
@Injectable({ providedIn: 'root' })
export class DescargaArchivo {
  descargar(contenido: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(contenido);
    try {
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo;
      enlace.rel = 'noopener';
      enlace.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** `expedientes_2026-09-30.json`, as the source names it (`:6020`). */
  nombreConFecha(prefijo: string, extension: string): string {
    return `${prefijo}_${new Date().toISOString().slice(0, 10)}.${extension}`;
  }
}
