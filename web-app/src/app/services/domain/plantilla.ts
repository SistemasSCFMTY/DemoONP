/**
 * The solicitud template's mini-language.
 *
 * Ported from `llenarPlantilla` (onp_fer_etapa2_pf.html:3716): `{{clave}}`
 * substitution plus `{{#bloque}}…{{/bloque}}` conditionals. Kept rather than
 * replaced by an Angular template because CP-B11 would have let a SOFOM
 * upload its own .docx using exactly these keys, and that P2 checkpoint is
 * expected to be cut rather than redesigned.
 *
 * **Values are HTML-escaped on the way in.** The source interpolates them
 * raw, so a name containing `<` breaks the document and a name containing a
 * `<script>` tag is executed by the page that renders it. Everything in this
 * template comes from a form the prospect filled in; escaping it is not
 * optional. Recorded as departure 18.
 */

/** The four conditional blocks the template uses. */
const BLOQUES = ['si_ine', 'si_pep_propio', 'si_pep_familia', 'si_tercero'] as const;

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fill a template.
 *
 * @param plantilla the template, with `{{clave}}` and `{{#bloque}}` markers
 * @param claves the values; `__<bloque>` keys decide the conditionals, and a
 *               falsy one removes the block and its contents
 * @param crudas keys whose value is already HTML and must not be escaped —
 *               only `firma`, which is an `<img>` tag the app itself built
 */
export function llenarPlantilla(
  plantilla: string,
  claves: Readonly<Record<string, string>>,
  crudas: readonly string[] = ['firma'],
): string {
  let salida = plantilla;

  // Conditionals first, so a removed block's placeholders never get filled.
  for (const bloque of BLOQUES) {
    const activo = !!claves[`__${bloque}`];
    const patron = new RegExp(`\\{\\{#${bloque}\\}\\}([\\s\\S]*?)\\{\\{\\/${bloque}\\}\\}`, 'g');
    salida = salida.replace(patron, activo ? '$1' : '');
  }

  salida = salida.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_todo, clave: string) => {
    const valor = claves[clave];
    if (valor === undefined) return '';
    return crudas.includes(clave) ? valor : escapar(valor);
  });

  return salida;
}
