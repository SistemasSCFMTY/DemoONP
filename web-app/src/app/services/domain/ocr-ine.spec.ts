import { parsearFrente, parsearReverso, soloDigitos } from './ocr-ine';

describe('soloDigitos', () => {
  it('corrige las confusiones típicas del OCR', () => {
    // O→0 · I→1 · Z→2 · S→5 · B→8 · G→6, intercaladas con dígitos reales.
    expect(soloDigitos('O1I2Z3S4B5G6')).toBe('011223548566');
  });

  it('descarta todo lo que no acabe siendo un dígito', () => {
    expect(soloDigitos('12 34<<56')).toBe('123456');
  });
});

describe('parsearFrente', () => {
  it('lee la clave de elector por su forma', () => {
    const texto = 'NOMBRE PAEZ ESQUIVEL\nCLAVE DE ELECTOR PZESFR99031919H300\nCURP PAEF990319HDFZSR09';
    expect(parsearFrente(texto).claveElector).toBe('PZESFR99031919H300');
  });

  it('cae a la línea etiquetada cuando la forma no calza', () => {
    const texto = 'CLAVE DE ELECTOR ABCDEF12345678H901\n';
    expect(parsearFrente(texto).claveElector).toBe('ABCDEF12345678H901');
  });

  it('lee el año de registro y el número de emisión de la misma línea', () => {
    const r = parsearFrente('AÑO DE REGISTRO 2019 03\n');
    expect(r.anioRegistro).toBe('2019');
    expect(r.numEmision).toBe('03');
  });

  it('tolera que el OCR pierda la tilde de AÑO', () => {
    expect(parsearFrente('ANO DE REGISTRO 2015 01').anioRegistro).toBe('2015');
  });

  it('también lee AÑO y EMISIÓN con acento — el original los destruía', () => {
    // Departure 17: the source's ASCII-only sanitiser turned `AÑO` into
    // `A O` and `EMISIÓN` into `EMISI N` before matching them.
    const r = parsearFrente('AÑO DE REGISTRO 2019 03\nEMISIÓN 2019');
    expect(r.anioRegistro).toBe('2019');
    expect(r.numEmision).toBe('03');
    expect(r.anioEmision).toBe('2019');
  });

  it('lee el año de emisión', () => {
    expect(parsearFrente('EMISIÓN 2019').anioEmision).toBe('2019');
  });

  it('usa la vigencia cuando no encuentra la emisión', () => {
    expect(parsearFrente('VIGENCIA 2029').anioEmision).toBe('2029');
  });

  it('no inventa campos que no están', () => {
    expect(parsearFrente('texto sin nada útil')).toEqual({});
  });
});

describe('parsearReverso', () => {
  it('lee el CIC de la MRZ', () => {
    expect(parsearReverso('IDMEX123456789<<<<').cic).toBe('123456789');
  });

  it('repara las letras que el OCR confundió dentro del CIC', () => {
    // O→0, I→1, S→5 dentro de los nueve caracteres tras IDMEX
    expect(parsearReverso('IDMEXO23456I8S<<<').cic).toBe('023456185');
  });

  it('lee el OCR de 13 dígitos', () => {
    expect(parsearReverso('IDMEX123456789<<<\n1234567890123<<<').ocr).toBe('1234567890123');
  });

  it('no devuelve el mismo número como CIC y como OCR', () => {
    const r = parsearReverso('IDMEX123456789');
    expect(r.cic).toBe('123456789');
    expect(r.ocr).toBeUndefined();
  });

  it('no inventa campos que no están', () => {
    expect(parsearReverso('banda magnética ilegible')).toEqual({});
  });
});
