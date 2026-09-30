/**
 * The template engine, for the Formatos preview only.
 *
 * Ported from `llenarPlantilla` (`onp_fer_etapa2_pf.html:3716`). The Worker
 * owns the real rendering — what is signed by a prospect is produced
 * server-side (CP-B11). This copy exists so "Ver cómo queda" can show the
 * operator their uploaded document filled in, without a round trip and
 * without a real expediente.
 *
 * **The output is sanitised before it is displayed**, like every other HTML
 * string in this app (`01-conventions.md` §12). Both halves of the input are
 * attacker-influenced: the template came out of a `.docx` somebody uploaded,
 * and in the real render the values come out of a prospect's form. Escaping
 * happened once at conversion (`escapar` in `lector-docx.ts`); the display
 * side sanitises anyway, because two independent passes is the only
 * arrangement that survives someone editing one of them.
 */

/** Which conditional blocks are on, for the preview's example applicant. */
export interface BanderasPlantilla {
  readonly si_pep_propio: boolean;
  readonly si_pep_familia: boolean;
  readonly si_tercero: boolean;
  readonly si_ine: boolean;
}

/**
 * Marks a clave with no value, or one that is not in the catalogue.
 *
 * The source highlights these so the operator can see, in the preview, that
 * they mistyped something — rather than finding `{{curpp}}` printed on a
 * signed solicitud. `surface-warning` is the §3 wash for exactly this.
 */
function sinValor(texto: string): string {
  return `<span class="sin-valor">${texto}</span>`;
}

export function llenarPlantilla(
  plantilla: string,
  datos: Readonly<Record<string, string>>,
  banderas: BanderasPlantilla,
): string {
  let salida = plantilla;

  // Conditional blocks first: a clave inside a block that is switched off
  // must not be substituted, or a `[sin dato]` would appear for a section
  // that is not being printed at all.
  for (const [nombre, activo] of Object.entries(banderas)) {
    const re = new RegExp(`\\{\\{#${nombre}\\}\\}([\\s\\S]*?)\\{\\{\\/${nombre}\\}\\}`, 'g');
    salida = salida.replace(re, (_todo, dentro: string) => (activo ? dentro : ''));
  }

  return salida.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_todo, clave: string) => {
    if (!(clave in datos)) return sinValor(`[clave desconocida: ${clave}]`);
    const valor = datos[clave];
    return valor === '' ? sinValor('[sin dato]') : valor;
  });
}
