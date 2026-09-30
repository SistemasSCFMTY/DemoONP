import { describe, expect, it } from 'vitest';
import { conFolioLibre, generarFolio } from './folio';

describe('generarFolio', () => {
  it('conserva el formato de la fuente, ONP-YYMMDD-NNNN', () => {
    expect(generarFolio(new Date('2026-10-01T12:00:00Z'))).toMatch(/^ONP-261001-\d{4}$/);
  });

  it('usa la fecha en UTC, no la del servidor', () => {
    // Un Worker corre en cualquier colo del mundo. Si el folio tomara
    // la fecha local, dos solicitudes de la misma tarde podrían salir
    // con días distintos según dónde aterrizó cada una.
    expect(generarFolio(new Date('2026-10-01T23:30:00Z'))).toMatch(/^ONP-261001-/);
    expect(generarFolio(new Date('2026-01-05T00:10:00Z'))).toMatch(/^ONP-260105-/);
  });

  it('no repite lo suficiente como para que se note', () => {
    const vistos = new Set(Array.from({ length: 500 }, () => generarFolio()));
    // 500 tiros sobre 10 000 valores: por el problema del cumpleaños se
    // esperan ~12 choques. Más de 60 significa que el generador está
    // sesgado, no que hubo mala suerte.
    expect(vistos.size).toBeGreaterThan(440);
  });
});

describe('conFolioLibre', () => {
  const choque = (e: unknown) => (e as Error).message === 'choque';

  it('reintenta con un folio nuevo cuando el índice único lo rechaza', async () => {
    const intentados: string[] = [];
    const resultado = await conFolioLibre(async (folio) => {
      intentados.push(folio);
      if (intentados.length < 3) throw new Error('choque');
      return folio;
    }, choque);

    expect(intentados).toHaveLength(3);
    expect(new Set(intentados).size).toBe(3); // tres folios distintos, no el mismo tres veces
    expect(resultado).toBe(intentados[2]);
  });

  it('no reintenta un error que no es de folio', async () => {
    let intentos = 0;
    await expect(
      conFolioLibre(async () => {
        intentos++;
        throw new Error('la red se cayó');
      }, choque),
    ).rejects.toThrow('la red se cayó');

    // Reintentar un fallo de red seis veces con seis folios distintos
    // deja basura y no resuelve nada.
    expect(intentos).toBe(1);
  });

  it('se rinde tras varios choques en vez de girar para siempre', async () => {
    let intentos = 0;
    await expect(
      conFolioLibre(async () => {
        intentos++;
        throw new Error('choque');
      }, choque),
    ).rejects.toThrow('choque');
    expect(intentos).toBeLessThanOrEqual(10);
  });
});
