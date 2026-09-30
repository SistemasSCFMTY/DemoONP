import { FormControl, FormGroup } from '@angular/forms';
import {
  codigoPostal,
  contrasena,
  curp,
  fechaTrio,
  mayorDeEdad,
  mensajeDeError,
  rfcConcuerdaConCurp,
  telefono,
} from './validadores';

function control(valor: unknown) {
  return new FormControl(valor);
}

describe('codigoPostal', () => {
  const v = codigoPostal();

  it('acepta cinco dígitos', () => {
    expect(v(control('64000'))).toBeNull();
  });

  it('rechaza cuatro y nombra el error en español', () => {
    expect(mensajeDeError(v(control('6400')))).toBe('El código postal tiene 5 dígitos.');
  });

  it('no opina sobre un campo vacío: eso lo decide `required`', () => {
    expect(v(control(''))).toBeNull();
  });
});

describe('telefono', () => {
  const v = telefono();

  it('acepta diez dígitos con los espacios que el formateador inserta', () => {
    expect(v(control('81 1234 5678'))).toBeNull();
  });

  it('rechaza nueve dígitos', () => {
    expect(mensajeDeError(v(control('81 1234 567')))).toBe(
      'El teléfono a 10 dígitos, con la clave de tu ciudad.',
    );
  });
});

describe('curp', () => {
  const v = curp();

  it('acepta una CURP con dígito verificador correcto', () => {
    expect(v(control('PAEF990319HDFZSR09'))).toBeNull();
  });

  it('pide los 18 caracteres', () => {
    expect(mensajeDeError(v(control('PAEF990319HDF')))).toBe('Escribe tu CURP a 18 caracteres.');
  });

  it('rechaza un dígito verificador equivocado', () => {
    expect(mensajeDeError(v(control('PAEF990319HDFZSR00')))).toBe(
      'Dígito verificador incorrecto.',
    );
  });
});

describe('rfcConcuerdaConCurp', () => {
  const v = rfcConcuerdaConCurp('curp', 'rfc');

  function grupo(valorCurp: string, valorRfc: string) {
    return new FormGroup({ curp: new FormControl(valorCurp), rfc: new FormControl(valorRfc) });
  }

  it('acepta un RFC derivado de la misma CURP', () => {
    expect(v(grupo('PAEF990319HDFZSR09', 'PAEF990319AB1'))).toBeNull();
  });

  it('marca la discrepancia', () => {
    expect(mensajeDeError(v(grupo('PAEF990319HDFZSR09', 'HEGA851105XY2')))).toBe(
      'RFC no coincide con CURP (primeros 10 caracteres).',
    );
  });

  it('calla mientras el RFC está vacío: es opcional', () => {
    expect(v(grupo('PAEF990319HDFZSR09', ''))).toBeNull();
  });
});

describe('fechaTrio', () => {
  const v = fechaTrio('dia', 'mes', 'anio');

  function grupo(dia: string, mes: string, anio: string) {
    return new FormGroup({
      dia: new FormControl(dia),
      mes: new FormControl(mes),
      anio: new FormControl(anio),
    });
  }

  it('acepta una fecha real', () => {
    expect(v(grupo('19', '03', '1999'))).toBeNull();
  });

  it('rechaza el 31 de febrero', () => {
    expect(mensajeDeError(v(grupo('31', '02', '1999')))).toBe('Ese mes tiene 28 días.');
  });

  it('acepta el 29 de febrero en año bisiesto', () => {
    expect(v(grupo('29', '02', '2000'))).toBeNull();
  });

  it('rechaza el mes 13', () => {
    expect(mensajeDeError(v(grupo('01', '13', '1999')))).toBe('El mes va de 01 a 12.');
  });

  it('pide completar el trío', () => {
    expect(mensajeDeError(v(grupo('19', '', '1999')))).toBe('Completa día, mes y año.');
  });

  it('calla mientras el trío está entero vacío', () => {
    expect(v(grupo('', '', ''))).toBeNull();
  });
});

describe('mayorDeEdad', () => {
  const v = mayorDeEdad('dia', 'mes', 'anio');

  function grupo(anio: number) {
    return new FormGroup({
      dia: new FormControl('01'),
      mes: new FormControl('01'),
      anio: new FormControl(String(anio)),
    });
  }

  it('acepta a quien nació hace treinta años', () => {
    expect(v(grupo(new Date().getFullYear() - 30))).toBeNull();
  });

  it('rechaza a quien nació hace diez', () => {
    expect(mensajeDeError(v(grupo(new Date().getFullYear() - 10)))).toBe(
      'Debes ser mayor de edad para solicitar un crédito.',
    );
  });
});

describe('contrasena', () => {
  const v = contrasena();

  it('pide los caracteres que faltan, contándolos', () => {
    expect(mensajeDeError(v(control('abc')))).toBe('Muy corta: faltan 5 caracteres');
  });

  it('acepta ocho caracteres', () => {
    expect(v(control('abcd1234'))).toBeNull();
  });
});
