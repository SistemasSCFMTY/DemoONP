import { Pipe, PipeTransform } from '@angular/core';

/**
 * A file size an operator can read, es-MX.
 *
 * Decimal units (kB, MB), because that is what a file manager reports and the
 * number here only has to tell someone whether a photograph of an INE arrived
 * or a 2 kB failure did.
 */
@Pipe({ name: 'tamanoArchivo' })
export class TamanoArchivoPipe implements PipeTransform {
  transform(bytes: number | null | undefined): string | null {
    if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return null;
    if (bytes < 1000) return `${bytes} B`;

    if (bytes < 1_000_000) {
      return `${(bytes / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kB`;
    }
    return `${(bytes / 1_000_000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} MB`;
  }
}
