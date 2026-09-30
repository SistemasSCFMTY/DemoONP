import { Pipe, PipeTransform } from '@angular/core';

/**
 * A clave as it is written in the Word document: `{{curp}}`, or
 * `{{#si_tercero}} … {{/si_tercero}}` for a conditional block.
 *
 * A pipe rather than literal braces in the template, and not for style: a
 * template cannot contain `{{` as text. Escaping it as `&#123;&#123;` does
 * not help either — Angular decodes HTML entities before it parses
 * interpolation, so the braces come back and the expression fails to
 * compile. Building the string in TypeScript is the only way the catalogue
 * can show the operator exactly what to paste.
 */
@Pipe({ name: 'llaves' })
export class LlavesPipe implements PipeTransform {
  transform(clave: string, modo: 'simple' | 'bloque' = 'simple'): string {
    const abre = '{' + '{';
    const cierra = '}' + '}';

    return modo === 'bloque'
      ? `${abre}#${clave}${cierra} … ${abre}/${clave}${cierra}`
      : `${abre}${clave}${cierra}`;
  }
}
