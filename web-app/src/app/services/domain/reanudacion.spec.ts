import { destinoDeReanudacion, esPasoConocido, pasosHasta } from './reanudacion';

describe('esPasoConocido', () => {
  it('reconoce un paso del catálogo', () => {
    expect(esPasoConocido('form-laborales')).toBe(true);
  });

  it('rechaza lo que no lo es', () => {
    expect(esPasoConocido('paso-de-otra-version')).toBe(false);
    expect(esPasoConocido(null)).toBe(false);
    expect(esPasoConocido(undefined)).toBe(false);
    expect(esPasoConocido(7)).toBe(false);
    expect(esPasoConocido('')).toBe(false);
  });
});

describe('pasosHasta', () => {
  it('incluye el paso mismo', () => {
    expect(pasosHasta('form-domicilio')).toContain('form-domicilio');
  });

  it('incluye todo lo anterior, para que el guard deje volver a entrar', () => {
    const alcanzados = pasosHasta('form-laborales');
    expect(alcanzados).toContain('bienvenida');
    expect(alcanzados).toContain('auth-location');
    expect(alcanzados).toContain('form-generales');
  });

  it('no incluye nada posterior', () => {
    const alcanzados = pasosHasta('form-domicilio');
    expect(alcanzados).not.toContain('form-contacto');
    expect(alcanzados).not.toContain('signature');
  });

  it('en el primer paso devuelve solo ese', () => {
    expect(pasosHasta('bienvenida')).toEqual(['bienvenida']);
  });
});

describe('destinoDeReanudacion', () => {
  it('lleva al paso que el backend recordó', () => {
    const destino = destinoDeReanudacion('form-laborales');
    expect(destino.paso).toBe('form-laborales');
    expect(destino.ruta).toBe('/solicitud/form-laborales');
    expect(destino.reconocido).toBe(true);
  });

  it('marca alcanzado todo el camino, no solo el destino', () => {
    const destino = destinoDeReanudacion('declaratoria');
    expect(destino.alcanzados).toContain('pep-propio');
    expect(destino.alcanzados).toContain('declaratoria');
    expect(destino.alcanzados).not.toContain('auth-buro');
  });

  it('cae al primer paso si el expediente no registró ninguno', () => {
    const destino = destinoDeReanudacion(null);
    expect(destino.paso).toBe('bienvenida');
    expect(destino.ruta).toBe('/');
    expect(destino.reconocido).toBe(false);
  });

  it('cae al primer paso ante un slug de otra versión, en vez de fallar', () => {
    // The backend stores the slug opaquely, so a build that renamed or
    // removed a step gets something it does not know. It must not throw.
    const destino = destinoDeReanudacion('form-referencias-bancarias');
    expect(destino.paso).toBe('bienvenida');
    expect(destino.reconocido).toBe(false);
  });

  it('nunca devuelve una ruta vacía', () => {
    for (const slug of [null, undefined, '', 'basura', 'signature']) {
      expect(destinoDeReanudacion(slug).ruta.startsWith('/')).toBe(true);
    }
  });
});
