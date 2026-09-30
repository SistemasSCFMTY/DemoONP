import { describe, expect, it } from 'vitest';
import { ClaveSchema, MAX_CONTENIDO, PlantillaEntradaSchema } from './plantilla';

describe('ClaveSchema', () => {
  it('acepta la clave de la solicitud', () => {
    // onp_fer_etapa2_pf.html:3129 — el documento firmado se guarda con
    // esta clave y el panel la busca por ella.
    expect(ClaveSchema.parse('solicitud_credito')).toBe('solicitud_credito');
  });

  it('rechaza mayúsculas, espacios y acentos', () => {
    // Es un identificador que el código compara, no texto para leer.
    // Sin esto, «Solicitud credito» y «solicitud_credito» serían dos
    // plantillas distintas para la base y la misma para el usuario.
    for (const mala of ['Solicitud_Credito', 'solicitud credito', 'solicitud-crédito', '']) {
      expect(ClaveSchema.safeParse(mala).success).toBe(false);
    }
  });
});

describe('PlantillaEntradaSchema', () => {
  const base = {
    clave: 'solicitud_credito',
    nombre: 'Solicitud de crédito',
    contenido_html: '<h1>Solicitud</h1>',
  };

  it('acepta una plantilla mínima y deja archivo_original en null', () => {
    const p = PlantillaEntradaSchema.parse(base);
    expect(p.contenido_html).toBe('<h1>Solicitud</h1>');
    expect(p.archivo_original).toBeNull();
  });

  it('guarda el HTML verbatim, incluido lo peligroso', () => {
    // NO se sanea en la escritura, y es deliberado: un medio saneador
    // aquí invita a confiar en la columna después. Quien lo pinta es
    // quien la limpia. Este test existe para que nadie "arregle" eso
    // sin darse cuenta de que rompe el contrato de la columna.
    const veneno = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    expect(PlantillaEntradaSchema.parse({ ...base, contenido_html: veneno }).contenido_html)
      .toBe(veneno);
  });

  it('rechaza un contenido que no es cadena', () => {
    for (const malo of [42, null, undefined, { html: 'x' }, ['x']]) {
      expect(PlantillaEntradaSchema.safeParse({ ...base, contenido_html: malo }).success)
        .toBe(false);
    }
  });

  it('pone techo al tamaño', () => {
    expect(
      PlantillaEntradaSchema.safeParse({ ...base, contenido_html: 'x'.repeat(MAX_CONTENIDO) })
        .success,
    ).toBe(true);
    expect(
      PlantillaEntradaSchema.safeParse({ ...base, contenido_html: 'x'.repeat(MAX_CONTENIDO + 1) })
        .success,
    ).toBe(false);
  });

  it('exige un nombre', () => {
    expect(PlantillaEntradaSchema.safeParse({ ...base, nombre: '   ' }).success).toBe(false);
  });
});
