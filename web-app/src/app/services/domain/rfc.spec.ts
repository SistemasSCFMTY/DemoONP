import { coincideConCURP, validarFormaRFC } from './rfc';

describe('validarFormaRFC', () => {
  it('acepta un RFC de persona física bien formado', () => {
    expect(validarFormaRFC('PAEF990319AB1')).toEqual({ valido: true });
  });

  it('exige 13 caracteres', () => {
    expect(validarFormaRFC('PAEF990319')).toEqual({
      valido: false,
      error: 'El RFC de persona física tiene 13 caracteres',
    });
  });

  it('rechaza una fecha con letras', () => {
    expect(validarFormaRFC('PAEF99O319AB1')).toEqual({
      valido: false,
      error: 'El RFC no tiene el formato esperado',
    });
  });

  it('admite la Ñ y el & en la parte del nombre', () => {
    expect(validarFormaRFC('PEÑA990319AB1')).toEqual({ valido: true });
  });
});

describe('coincideConCURP', () => {
  const curp = 'PAEF990319HDFZSR09';

  it('acepta un RFC cuyos 10 primeros caracteres son los de la CURP', () => {
    expect(coincideConCURP('PAEF990319AB1', curp)).toEqual({ valido: true });
  });

  it('detecta el RFC de otra persona', () => {
    expect(coincideConCURP('HEGA851105XY2', curp)).toEqual({
      valido: false,
      error: 'RFC no coincide con CURP (primeros 10 caracteres)',
    });
  });

  it('compara desde el décimo carácter, sin esperar la homoclave', () => {
    expect(coincideConCURP('PAEF990319', curp)).toEqual({ valido: true });
  });

  it('calla mientras no haya con qué comparar', () => {
    expect(coincideConCURP('PAEF99', curp)).toEqual({
      valido: false,
      error: 'Faltan datos para comparar',
    });
  });
});
