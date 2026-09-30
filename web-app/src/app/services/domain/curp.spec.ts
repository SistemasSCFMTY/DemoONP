import {
  coincideConDatos,
  consonanteInterna,
  curp17,
  diferenciador,
  digitoVerificador,
  generarCURP,
  normalizar,
  validarCURP,
  vocalInterna,
  type DatosCURP,
} from './curp';

const FERNANDO: DatosCURP = {
  apellidoPaterno: 'Páez',
  apellidoMaterno: 'Esquivel',
  nombres: 'Fernando',
  dia: '19',
  mes: '03',
  anio: '1999',
  genero: 'H',
  entidadNacimiento: 'DF',
};

describe('normalizar', () => {
  it('pliega acentos', () => {
    expect(normalizar('Pérez')).toBe('PEREZ');
    expect(normalizar('Hernández')).toBe('HERNANDEZ');
  });

  it('convierte Ñ en X, como lo hace RENAPO', () => {
    expect(normalizar('Peña')).toBe('PEXA');
    expect(normalizar('Muñoz')).toBe('MUXOZ');
  });

  it('descarta espacios, guiones y apóstrofos', () => {
    expect(normalizar("O'Higgins")).toBe('OHIGGINS');
    expect(normalizar('De la Cruz')).toBe('DELACRUZ');
  });
});

describe('vocalInterna', () => {
  it('toma la primera vocal a partir de la segunda letra', () => {
    expect(vocalInterna('PAEZ')).toBe('A');
    expect(vocalInterna('HERNANDEZ')).toBe('E');
  });

  it('ignora la vocal inicial', () => {
    expect(vocalInterna('ESQUIVEL')).toBe('U');
  });

  it('devuelve X cuando no hay vocal interna', () => {
    expect(vocalInterna('NG')).toBe('X');
  });
});

describe('consonanteInterna', () => {
  it('toma la primera consonante a partir de la segunda letra', () => {
    expect(consonanteInterna('PAEZ')).toBe('Z');
    expect(consonanteInterna('ESQUIVEL')).toBe('S');
    expect(consonanteInterna('FERNANDO')).toBe('R');
  });

  it('devuelve X cuando no hay consonante interna', () => {
    expect(consonanteInterna('AEI')).toBe('X');
  });
});

describe('diferenciador', () => {
  it('es 0 para nacimientos del siglo XX', () => {
    expect(diferenciador('1999')).toBe('0');
  });

  it('es A a partir del año 2000', () => {
    expect(diferenciador('2000')).toBe('A');
    expect(diferenciador('2014')).toBe('A');
  });
});

describe('digitoVerificador', () => {
  it('cierra la CURP de ejemplo del original en 9', () => {
    expect(digitoVerificador('PAEF990319HDFZSR0')).toBe('9');
  });

  it('siempre devuelve un solo dígito', () => {
    expect(digitoVerificador('HEGA851105MJCRMN0')).toMatch(/^[0-9]$/);
  });
});

describe('generarCURP', () => {
  it('arma las 18 posiciones', () => {
    const curp = generarCURP(FERNANDO);
    expect(curp).toBe('PAEF990319HDFZSR09');
    expect(curp).toHaveLength(18);
  });

  it('es válida ante su propio validador — el original producía 17 y fallaba', () => {
    const curp = generarCURP(FERNANDO);
    expect(validarCURP(curp!)).toEqual({ valido: true });
  });

  it('coloca el género en la posición 11 y la entidad en la 12-13', () => {
    const curp = generarCURP({ ...FERNANDO, genero: 'M', entidadNacimiento: 'NL' })!;
    expect(curp[10]).toBe('M');
    expect(curp.substring(11, 13)).toBe('NL');
  });

  it('rellena día y mes de un solo dígito', () => {
    const curp = generarCURP({ ...FERNANDO, dia: '5', mes: '3' })!;
    expect(curp.substring(4, 10)).toBe('990305');
  });

  it('usa la diferenciadora A para quien nació después del 2000', () => {
    const curp = generarCURP({ ...FERNANDO, anio: '2001' })!;
    expect(curp[16]).toBe('A');
  });

  it('devuelve null mientras falte un dato, en vez de una CURP a medias', () => {
    expect(generarCURP({ ...FERNANDO, nombres: '' })).toBeNull();
    expect(generarCURP({ ...FERNANDO, genero: '' })).toBeNull();
    expect(generarCURP({ ...FERNANDO, entidadNacimiento: '' })).toBeNull();
    expect(generarCURP({ ...FERNANDO, anio: '' })).toBeNull();
  });

  it('pliega el acento en lugar de meterlo en la CURP', () => {
    const curp = generarCURP({
      ...FERNANDO,
      apellidoPaterno: 'Hernández',
      apellidoMaterno: 'Gómez',
      nombres: 'Ana',
      dia: '05',
      mes: '11',
      anio: '1985',
      genero: 'M',
      entidadNacimiento: 'JC',
    })!;
    expect(curp).toBe('HEGA851105MJCRMN02');
    expect(curp).toMatch(/^[A-Z0-9]{18}$/);
  });
});

describe('validarCURP', () => {
  it('exige 18 caracteres', () => {
    expect(validarCURP('PAEF990319HDFZSR')).toEqual({
      valido: false,
      error: 'La CURP debe tener 18 caracteres',
    });
  });

  it('rechaza caracteres fuera de A-Z0-9', () => {
    expect(validarCURP('PAEF990319HDFZSR-9')).toEqual({
      valido: false,
      error: 'Caracteres inválidos',
    });
  });

  it('rechaza un dígito verificador equivocado', () => {
    expect(validarCURP('PAEF990319HDFZSR00')).toEqual({
      valido: false,
      error: 'Dígito verificador incorrecto',
    });
  });

  it('acepta una CURP bien formada', () => {
    expect(validarCURP('PAEF990319HDFZSR09')).toEqual({ valido: true });
  });
});

describe('coincideConDatos', () => {
  it('acepta la CURP generada a partir de esos mismos datos', () => {
    expect(coincideConDatos(generarCURP(FERNANDO)!, FERNANDO)).toEqual({ coincide: true });
  });

  it('detecta la CURP de otra persona', () => {
    expect(coincideConDatos('HEGA851105MJCRMN02', FERNANDO)).toEqual({
      coincide: false,
      error: 'CURP no coincide con datos',
    });
  });

  it('detecta una fecha de nacimiento distinta', () => {
    const otra = generarCURP({ ...FERNANDO, anio: '1998' })!;
    expect(coincideConDatos(otra, FERNANDO).coincide).toBe(false);
  });

  it('tolera una diferenciadora de homonimia que RENAPO haya asignado', () => {
    const base = curp17(FERNANDO)!.substring(0, 16);
    const conHomonimia = base + '1' + digitoVerificador(base + '1');
    expect(coincideConDatos(conHomonimia, FERNANDO)).toEqual({ coincide: true });
  });

  it('avisa cuando aún no hay datos con qué comparar', () => {
    expect(coincideConDatos('PAEF990319HDFZSR09', { ...FERNANDO, nombres: '' })).toEqual({
      coincide: false,
      error: 'Faltan datos para validar',
    });
  });
});
