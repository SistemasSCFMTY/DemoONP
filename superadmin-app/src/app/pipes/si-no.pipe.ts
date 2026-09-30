import { Pipe, PipeTransform } from '@angular/core';

/**
 * A boolean the way the expediente reads it: **Sí** / **No**.
 *
 * The source stored these answers as the strings `'Sí'` and `'No'` and printed
 * them straight through (`mapearExpediente`, `:2921`). They are booleans on
 * the wire now, and this is where they turn back into the words the operator
 * expects to read on a KYC file.
 *
 * A pipe rather than a template call: §6 bans inline function calls.
 */
@Pipe({ name: 'siNo' })
export class SiNoPipe implements PipeTransform {
  transform(valor: boolean | null | undefined): string {
    return valor ? 'Sí' : 'No';
  }
}
