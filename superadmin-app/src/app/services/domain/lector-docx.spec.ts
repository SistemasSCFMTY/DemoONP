import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { ErrorDocx, clavesUsadas, escapar, leerDocx } from './lector-docx';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

/** Builds a real `.docx` in memory: a zip with `word/document.xml` inside. */
async function comoDocx(cuerpoXml: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body>${cuerpoXml}</w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'blob' });
}

function parrafo(runs: string, pPr = ''): string {
  return `<w:p>${pPr}${runs}</w:p>`;
}

function run(texto: string, rPr = ''): string {
  return `<w:r>${rPr}<w:t>${texto}</w:t></w:r>`;
}

describe('leerDocx', () => {
  it('reads a paragraph', async () => {
    const html = await leerDocx(await comoDocx(parrafo(run('Solicitud de crédito'))));
    expect(html).toBe('<p>Solicitud de crédito</p>');
  });

  it('rejoins a clave Word split across runs', async () => {
    // This is the whole reason `textoDe` exists. Word breaks a word into
    // several <w:t> for its own reasons — a spell-check mark, a tracked
    // edit — and a clave split in two would never match the template
    // engine's regex. The operator would be told their clave does not exist.
    const partido = run('{{cu') + run('rp') + run('}}');
    const html = await leerDocx(await comoDocx(parrafo(partido)));

    expect(html).toBe('<p>{{curp}}</p>');
    expect(clavesUsadas(html)).toEqual(['curp']);
  });

  it('maps alignment onto the doc-hoja classes', async () => {
    const centrado = '<w:pPr><w:jc w:val="center"/></w:pPr>';
    const derecha = '<w:pPr><w:jc w:val="right"/></w:pPr>';
    const justificado = '<w:pPr><w:jc w:val="both"/></w:pPr>';

    expect(await leerDocx(await comoDocx(parrafo(run('a'), centrado)))).toBe(
      '<p class="c">a</p>',
    );
    expect(await leerDocx(await comoDocx(parrafo(run('a'), derecha)))).toBe('<p class="r">a</p>');
    expect(await leerDocx(await comoDocx(parrafo(run('a'), justificado)))).toBe(
      '<p class="j">a</p>',
    );
  });

  it('maps headings, including the Spanish style names Word uses', async () => {
    const h2 = '<w:pPr><w:pStyle w:val="Heading2"/></w:pPr>';
    expect(await leerDocx(await comoDocx(parrafo(run('Datos'), h2)))).toBe('<h2>Datos</h2>');

    // A Word running in Spanish names them "Ttulo1". This is a Mexican
    // SOFOM's document, so that is the common case, not the exotic one.
    const titulo1 = '<w:pPr><w:pStyle w:val="Ttulo1"/></w:pPr>';
    expect(await leerDocx(await comoDocx(parrafo(run('Título'), titulo1)))).toBe(
      '<h1>Título</h1>',
    );
  });

  it('marks a paragraph bold only when every run is bold', async () => {
    const negrita = '<w:rPr><w:b/></w:rPr>';

    const todo = parrafo(run('Muy', negrita) + run(' importante', negrita));
    expect(await leerDocx(await comoDocx(todo))).toBe('<p class="b">Muy importante</p>');

    const parcial = parrafo(run('Muy', negrita) + run(' importante'));
    expect(await leerDocx(await comoDocx(parcial))).toBe('<p>Muy importante</p>');
  });

  it('keeps an empty paragraph as spacing', async () => {
    expect(await leerDocx(await comoDocx(parrafo('')))).toBe('<p>&nbsp;</p>');
  });

  it('converts a table, joining several paragraphs in a cell', async () => {
    const celda = (contenido: string) => `<w:tc>${contenido}</w:tc>`;
    const tabla =
      '<w:tbl><w:tr>' +
      celda(parrafo(run('Monto'))) +
      celda(parrafo(run('$80,000')) + parrafo(run('36 meses'))) +
      celda(parrafo('')) +
      '</w:tr></w:tbl>';

    expect(await leerDocx(await comoDocx(tabla))).toBe(
      '<table><tr><td>Monto</td><td>$80,000<br>36 meses</td><td>&nbsp;</td></tr></table>',
    );
  });

  it('escapes markup someone typed into the document', async () => {
    // The output is stored and later rendered as HTML. A `<` that survives
    // here becomes markup in an authenticated staff session.
    //
    // The fixture entity-encodes, because that is what Word writes: raw `<`
    // inside a `<w:t>` would not be well-formed XML. An earlier version of
    // this test passed unencoded markup and proved nothing — the XML parser
    // read it as elements and `textContent` dropped the tags before `escapar`
    // ever saw them.
    const html = await leerDocx(
      await comoDocx(parrafo(run('&lt;script&gt;alert(1)&lt;/script&gt; &amp; más'))),
    );

    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; más</p>');
    expect(html).not.toContain('<script');
  });

  it('refuses a file that is not a Word document', async () => {
    const noEsZip = new Blob(['esto no es un zip'], { type: 'text/plain' });
    await expect(leerDocx(noEsZip)).rejects.toBeInstanceOf(ErrorDocx);
  });

  it('refuses a zip with no word/document.xml', async () => {
    const zip = new JSZip();
    zip.file('otro.txt', 'nada');
    const blob = await zip.generateAsync({ type: 'blob' });

    await expect(leerDocx(blob)).rejects.toThrow(
      'El archivo no parece un documento de Word válido.',
    );
  });

  it('refuses a document with no content', async () => {
    await expect(leerDocx(await comoDocx(''))).rejects.toThrow('El documento está vacío.');
  });
});

describe('clavesUsadas', () => {
  it('finds simple claves and conditional blocks, without duplicates', () => {
    const html = '<p>{{curp}} {{ rfc }} {{curp}}</p><p>{{#si_tercero}}x{{/si_tercero}}</p>';
    expect(clavesUsadas(html)).toEqual(['curp', 'rfc', 'si_tercero']);
  });

  it('finds nothing in a document with no claves', () => {
    expect(clavesUsadas('<p>Texto plano</p>')).toEqual([]);
  });
});

describe('escapar', () => {
  it('escapes the three characters that make markup', () => {
    expect(escapar('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });
});
