import { describe, expect, it } from 'vitest';
import { SofomEntradaSchema } from './sofom';

describe('SofomEntradaSchema', () => {
  it('exige razón social', () => {
    // Va en el pie de cada correo y en el aviso de privacidad. Una
    // SOFOM sin razón social es un documento legal sin emisor.
    expect(SofomEntradaSchema.safeParse({ razon_social: '   ' }).success).toBe(false);
  });

  it('normaliza los campos vacíos a null, no a cadena vacía', () => {
    const s = SofomEntradaSchema.parse({ razon_social: 'ONP FER, S.A. de C.V.', rfc: '' });
    expect(s.rfc).toBeNull();
    expect(s.domicilio).toBeNull();
    expect(s.telefono).toBeNull();
    expect(s.correo_contacto).toBeNull();
  });

  it('no deja pasar nombre_corto ni la marca visual', () => {
    // `nombre_corto` es NOT NULL en la tabla: si el update lo incluyera
    // como undefined lo pondría en NULL. Y el color y el logo viven en
    // brand.config.ts (desviación D3), no en la base.
    const s = SofomEntradaSchema.parse({
      razon_social: 'ONP FER',
      nombre_corto: 'otro',
      color_primario: '#ff0000',
      logo_url: 'http://x/y.png',
      activa: false,
    } as Record<string, unknown>);

    expect(Object.keys(s).sort()).toEqual([
      'correo_contacto',
      'domicilio',
      'razon_social',
      'rfc',
      'telefono',
    ]);
  });

  it('recorta el texto que sí llegó', () => {
    const s = SofomEntradaSchema.parse({
      razon_social: '  ONP FER, S.A. de C.V., SOFOM, E.N.R.  ',
      domicilio: '  Av. Ejemplo 100  ',
    });
    expect(s.razon_social).toBe('ONP FER, S.A. de C.V., SOFOM, E.N.R.');
    expect(s.domicilio).toBe('Av. Ejemplo 100');
  });
});
