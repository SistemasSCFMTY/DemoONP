import { llenarPlantilla } from './plantilla';

describe('llenarPlantilla', () => {
  it('sustituye las claves', () => {
    expect(llenarPlantilla('Folio {{folio}}', { folio: 'ONP-1' })).toBe('Folio ONP-1');
  });

  it('tolera espacios dentro de las llaves', () => {
    expect(llenarPlantilla('{{ folio }}', { folio: 'ONP-1' })).toBe('ONP-1');
  });

  it('deja vacía una clave que no existe, en vez de imprimir el marcador', () => {
    expect(llenarPlantilla('[{{ausente}}]', {})).toBe('[]');
  });

  it('conserva el bloque cuando su bandera está encendida', () => {
    const salida = llenarPlantilla('A{{#si_ine}}B{{/si_ine}}C', { __si_ine: '1' });
    expect(salida).toBe('ABC');
  });

  it('elimina el bloque y su contenido cuando está apagada', () => {
    const salida = llenarPlantilla('A{{#si_ine}}B{{clave}}{{/si_ine}}C', {
      __si_ine: '',
      clave: 'x',
    });
    expect(salida).toBe('AC');
  });

  it('escapa el HTML de los valores — el original los interpolaba crudos', () => {
    const salida = llenarPlantilla('<p>{{nombre}}</p>', {
      nombre: '<script>alert(1)</script>',
    });
    expect(salida).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('escapa los ampersands sin romper los que ya escapó', () => {
    expect(llenarPlantilla('{{empresa}}', { empresa: 'Ruiz & Hnos' })).toBe('Ruiz &amp; Hnos');
  });

  it('no escapa la firma, que es HTML que la propia app construyó', () => {
    const salida = llenarPlantilla('{{firma}}', { firma: '<img src="data:image/png;base64,AA">' });
    expect(salida).toBe('<img src="data:image/png;base64,AA">');
  });
});
