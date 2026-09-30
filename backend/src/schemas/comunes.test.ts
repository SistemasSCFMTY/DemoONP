import { describe, expect, it } from 'vitest';
import {
  EstadoSchema,
  PARTES_ARCHIVO,
  TIPO_ARCHIVO_POR_PARTE,
  TIPOS_ARCHIVO,
  TipoOParteSchema,
} from './comunes';

/**
 * Estos valores están duplicados a mano desde el enum de Postgres, y
 * equivocarse no se nota hasta que el insert revienta a media solicitud
 * con las fotos ya subidas. Por eso se fijan aquí.
 *
 * Sondeados en solo lectura contra el proyecto real el 2026-09-30.
 */
describe('vocabulario de la base', () => {
  it('estado es `revision`, no `en_revision`', () => {
    expect(EstadoSchema.safeParse('revision').success).toBe(true);
    expect(EstadoSchema.safeParse('en_revision').success).toBe(false);
  });

  it('cada parte del multipart mapea a un valor real del enum', () => {
    for (const parte of PARTES_ARCHIVO) {
      expect(TIPOS_ARCHIVO).toContain(TIPO_ARCHIVO_POR_PARTE[parte]);
    }
  });

  it('ningún `doc_*` del contrato es un valor del enum', () => {
    for (const parte of PARTES_ARCHIVO.filter((p) => p.startsWith('doc_'))) {
      expect(TIPOS_ARCHIVO).not.toContain(parte as never);
    }
  });

  it('dos partes no pisan el mismo tipo: compartirlo sobrescribiría el archivo', () => {
    // La ruta es `{folio}/{tipo}.{ext}` y `archivos` tiene un renglón
    // por tipo. Dos partes con el mismo tipo harían que la segunda
    // borrara la primera.
    const tipos = PARTES_ARCHIVO.map((p) => TIPO_ARCHIVO_POR_PARTE[p]);
    expect(new Set(tipos).size).toBe(tipos.length);
  });

  it('el :tipo de la ruta acepta los dos vocabularios', () => {
    expect(TipoOParteSchema.parse('doc_curp')).toBe('constancia_curp');
    expect(TipoOParteSchema.parse('constancia_curp')).toBe('constancia_curp');
    expect(TipoOParteSchema.parse('id_frente')).toBe('id_frente');
    expect(TipoOParteSchema.safeParse('doc_inventado').success).toBe(false);
  });
});
