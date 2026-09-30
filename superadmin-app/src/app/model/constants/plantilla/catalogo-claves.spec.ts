import { describe, expect, it } from 'vitest';

import {
  CATALOGO_CLAVES,
  CLAVES_VALIDAS,
  CONDICIONALES,
  filtrarCatalogo,
  filtrarCondicionales,
} from './catalogo-claves';

/**
 * The catalogue is the tab that explains the templating story, and the search
 * is the only way through 80-odd claves. These pin both.
 */
describe('filtrarCatalogo', () => {
  it('returns everything for an empty query', () => {
    expect(filtrarCatalogo('')).toBe(CATALOGO_CLAVES);
    expect(filtrarCatalogo('   ')).toBe(CATALOGO_CLAVES);
  });

  it('matches on the clave', () => {
    const grupos = filtrarCatalogo('curp');
    const claves = grupos.flatMap((g) => g.claves.map((c) => c.clave));

    expect(claves).toContain('curp');
    expect(claves).toContain('pr_curp');
    expect(claves).not.toContain('rfc');
  });

  it('matches on the description, case-insensitively', () => {
    const claves = filtrarCatalogo('APELLIDO').flatMap((g) => g.claves.map((c) => c.clave));
    expect(claves).toContain('apellido_paterno');
    expect(claves).toContain('apellido_materno');
    // "Nombre, apellido paterno y materno" — matched by its description.
    expect(claves).toContain('nombre_completo');
  });

  it('keeps a whole group when the group name matches', () => {
    const grupos = filtrarCatalogo('domicilio');
    const domicilio = grupos.find((g) => g.grupo === 'Domicilio');

    expect(domicilio).toBeDefined();
    // Not just the claves with "domicilio" in the name — the whole group.
    expect(domicilio!.claves.map((c) => c.clave)).toContain('codigo_postal');
  });

  it('drops a group with no matches rather than leaving an empty heading', () => {
    for (const grupo of filtrarCatalogo('curp')) {
      expect(grupo.claves.length).toBeGreaterThan(0);
    }
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(filtrarCatalogo('zzzzz')).toEqual([]);
    expect(filtrarCondicionales('zzzzz')).toEqual([]);
  });
});

describe('filtrarCondicionales', () => {
  it('returns everything for an empty query', () => {
    expect(filtrarCondicionales('')).toBe(CONDICIONALES);
  });

  it('matches a conditional block on its clave', () => {
    expect(filtrarCondicionales('tercero').map((c) => c.clave)).toEqual(['si_tercero']);
  });
});

describe('CLAVES_VALIDAS', () => {
  it('holds every clave in the catalogue and every conditional', () => {
    for (const grupo of CATALOGO_CLAVES) {
      for (const c of grupo.claves) expect(CLAVES_VALIDAS.has(c.clave)).toBe(true);
    }
    for (const c of CONDICIONALES) expect(CLAVES_VALIDAS.has(c.clave)).toBe(true);
  });

  it('holds `firma`, which is substituted but has nothing to list', () => {
    expect(CLAVES_VALIDAS.has('firma')).toBe(true);
  });

  it('rejects a misspelling, which is what the upload warning depends on', () => {
    expect(CLAVES_VALIDAS.has('curpp')).toBe(false);
  });

  it('has no duplicate claves across groups', () => {
    const todas = CATALOGO_CLAVES.flatMap((g) => g.claves.map((c) => c.clave));
    expect(new Set(todas).size).toBe(todas.length);
  });
});
