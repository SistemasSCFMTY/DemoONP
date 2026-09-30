import type JSZip from 'jszip';

/**
 * Reads a `.docx` and returns the panel's simplified HTML.
 *
 * Ported from `leerDocx` (`onp_fer_etapa2_pf.html:3756`), behaviour for
 * behaviour.
 *
 * **This runs in the browser, and that is a platform constraint, not a
 * preference** — the same one that keeps Tesseract out of the Worker. JSZip
 * plus a full DOM parser is not what a 3 MB Worker bundle is for, and the
 * conversion is a one-shot interactive action with a file the operator
 * already has in memory. The Worker receives the resulting HTML, never the
 * `.docx`.
 *
 * A `.docx` is a zip of XML. `word/document.xml` holds the body; everything
 * else (styles, numbering, media) is dropped, because the solicitud is
 * rendered with the panel's own `doc-hoja` sheet and a Word theme would fight
 * it.
 */

/** Word's main namespace. */
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Escapes text pulled out of the document.
 *
 * The source does the same (`:3752`) and it matters more here than it looks:
 * the output is stored and later rendered as HTML, so a `<` that survives
 * this becomes markup in an authenticated staff session. The display side
 * sanitises as well (§12) — this is the first of the two, not the only one.
 */
export function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Spanish, for the operator, because every one of these is reachable. */
export class ErrorDocx extends Error {}

/**
 * The full text of a paragraph.
 *
 * Word splits a word across several `<w:t>` runs whenever it feels like it —
 * a spell-check mark, a tracked edit, a language switch. Rejoining them is
 * not cosmetic: a clave like `{{curp}}` broken across two runs would never
 * match the template engine's regex, and the operator would be told their
 * clave does not exist.
 */
function textoDe(nodo: Element): string {
  let texto = '';
  for (const n of Array.from(nodo.getElementsByTagNameNS(W, '*'))) {
    if (n.localName === 't') texto += n.textContent ?? '';
    else if (n.localName === 'tab' || n.localName === 'br') texto += ' ';
  }
  return texto;
}

function valorDe(nodo: Element): string {
  return nodo.getAttributeNS(W, 'val') ?? nodo.getAttribute('w:val') ?? '';
}

interface EstiloParrafo {
  readonly clases: readonly string[];
  /** 1–3 for a heading, 0 for body text. */
  readonly nivel: number;
}

/**
 * Alignment, heading level and all-bold, mapped onto the `doc-hoja` classes.
 *
 * The heading pattern matches Spanish style names too (`Ttulo1`, `Titulo1`):
 * a Word running in Spanish names them that way, and this is a Mexican
 * SOFOM's document.
 */
function estiloDe(parrafo: Element): EstiloParrafo {
  const clases: string[] = [];
  let nivel = 0;

  const pPr = parrafo.getElementsByTagNameNS(W, 'pPr')[0];
  if (pPr) {
    const jc = pPr.getElementsByTagNameNS(W, 'jc')[0];
    if (jc) {
      const v = valorDe(jc);
      if (v === 'center') clases.push('c');
      else if (v === 'right') clases.push('r');
      else if (v === 'both') clases.push('j');
    }

    const estilo = pPr.getElementsByTagNameNS(W, 'pStyle')[0];
    if (estilo) {
      const v = valorDe(estilo).toLowerCase();
      const m = v.match(/heading(\d)|ttulo(\d)|titulo(\d)/);
      if (m) nivel = Number.parseInt(m[1] ?? m[2] ?? m[3], 10);
      else if (v === 'title') nivel = 1;
    }
  }

  // A paragraph whose every text run is bold becomes `<p class="b">`.
  const runs = Array.from(parrafo.getElementsByTagNameNS(W, 'r'));
  if (runs.length) {
    let todasNegritas = true;
    let hayTexto = false;

    for (const r of runs) {
      if (!r.getElementsByTagNameNS(W, 't').length) continue;
      hayTexto = true;
      const rPr = r.getElementsByTagNameNS(W, 'rPr')[0];
      if (!rPr || !rPr.getElementsByTagNameNS(W, 'b').length) {
        todasNegritas = false;
        break;
      }
    }

    if (hayTexto && todasNegritas) clases.push('b');
  }

  return { clases, nivel };
}

function parrafoHtml(nodo: Element): string {
  const texto = textoDe(nodo);
  if (!texto.trim()) return '<p>&nbsp;</p>';

  const { clases, nivel } = estiloDe(nodo);
  if (nivel >= 1 && nivel <= 3) {
    return `<h${nivel}>${escapar(texto)}</h${nivel}>`;
  }

  const cls = clases.length ? ` class="${clases.join(' ')}"` : '';
  return `<p${cls}>${escapar(texto)}</p>`;
}

function tablaHtml(tabla: Element): string {
  let html = '<table>';

  for (const fila of Array.from(tabla.children)) {
    if (fila.localName !== 'tr') continue;
    html += '<tr>';

    for (const celda of Array.from(fila.children)) {
      if (celda.localName !== 'tc') continue;

      const parrafos: string[] = [];
      for (const hijo of Array.from(celda.children)) {
        if (hijo.localName !== 'p') continue;
        const texto = textoDe(hijo);
        if (texto.trim()) parrafos.push(escapar(texto));
      }

      html += `<td>${parrafos.join('<br>') || '&nbsp;'}</td>`;
    }

    html += '</tr>';
  }

  return html + '</table>';
}

export async function leerDocx(archivo: Blob): Promise<string> {
  // JSZip is imported here rather than at the top of the file so it does not
  // ride in the Formatos route chunk. It is ~120 kB raw for a library that
  // only runs if the operator actually picks a `.docx`, and most visits to
  // that tab are to read the catalogue of claves. Type-only import above.
  const { default: JSZipLib } = await import('jszip');

  let zip: JSZip;
  try {
    zip = await JSZipLib.loadAsync(archivo);
  } catch {
    throw new ErrorDocx('El archivo no parece un documento de Word válido.');
  }

  const documento = zip.file('word/document.xml');
  if (!documento) throw new ErrorDocx('El archivo no parece un documento de Word válido.');

  const xml = await documento.async('string');
  const dom = new DOMParser().parseFromString(xml, 'application/xml');

  // DOMParser reports malformed XML as a `<parsererror>` element rather than
  // throwing, so a corrupt file would otherwise convert to an empty document.
  if (dom.getElementsByTagName('parsererror').length) {
    throw new ErrorDocx('No se pudo leer el contenido del documento.');
  }

  const body = dom.getElementsByTagNameNS(W, 'body')[0];
  if (!body) throw new ErrorDocx('El documento está vacío.');

  let html = '';
  for (const nodo of Array.from(body.children)) {
    if (nodo.localName === 'p') html += parrafoHtml(nodo);
    else if (nodo.localName === 'tbl') html += tablaHtml(nodo);
  }

  if (!html.trim()) throw new ErrorDocx('El documento está vacío.');

  return html;
}

/**
 * Every `{{clave}}` and `{{#bloque}}` the converted document uses.
 *
 * The upload flow compares these against the catalogue so the operator is
 * told about a misspelling at upload time rather than finding `[clave
 * desconocida]` printed on a signed solicitud (`:5750`).
 */
export function clavesUsadas(html: string): readonly string[] {
  const encontradas = Array.from(html.matchAll(/\{\{\s*[#/]?\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(
    (m) => m[1],
  );
  return [...new Set(encontradas)];
}
