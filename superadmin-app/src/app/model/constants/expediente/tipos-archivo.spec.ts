import { describe, expect, it } from 'vitest';

import { TipoArchivo } from '../../interfaces/expediente-detalle';
import { NOMBRE_ARCHIVO, TIPO_ARCHIVO_VIDEO } from './tipos-archivo';

/**
 * The referee for the one piece of drift the compiler cannot catch.
 *
 * `NOMBRE_ARCHIVO` is `Record<TipoArchivo, string>`, so TypeScript already
 * refuses a missing label — but only against *this app's* copy of the union.
 * Nothing checks that copy against the Postgres enum the Worker actually
 * sends, and that gap is not hypothetical: eight of these values were absent
 * from the union for the whole of CP-S3, and every one of them rendered as a
 * nameless row in "Archivos recibidos" the moment the panel was pointed at
 * the real backend. The mock spoke the multipart vocabulary, so nothing on
 * this side ever noticed.
 *
 * The list below is copied by hand from `backend/src/schemas/comunes.ts` →
 * `TIPOS_ARCHIVO`. Copying it is the point (`01-conventions.md` §12): a value
 * added to the enum over there fails here until someone writes the Spanish
 * for it.
 */
const TIPOS_ARCHIVO_DE_POSTGRES = [
  'id_frente',
  'id_reverso',
  'firma',
  'video_identificacion',
  'huella',
  'rostro',
  'comprobante_domicilio',
  'constancia_curp',
  'constancia_fiscal',
  'constancia_fea',
  'poder_notarial',
  'id_propietario_real',
  'domicilio_propietario_real',
  'otro',
] as const satisfies readonly TipoArchivo[];

describe('NOMBRE_ARCHIVO', () => {
  it('nombra todos los valores del enum `tipo_archivo`', () => {
    for (const tipo of TIPOS_ARCHIVO_DE_POSTGRES) {
      expect(NOMBRE_ARCHIVO[tipo], `falta el nombre de «${tipo}»`).toBeTruthy();
    }
  });

  it('no tiene entradas de más', () => {
    // The other direction: a leftover key is a label for something the API
    // can never send, which is how the multipart vocabulary got in here.
    expect(Object.keys(NOMBRE_ARCHIVO).sort()).toEqual([...TIPOS_ARCHIVO_DE_POSTGRES].sort());
  });

  it('nombra la videograbación en español', () => {
    expect(NOMBRE_ARCHIVO[TIPO_ARCHIVO_VIDEO]).toBe('Videograbación de identificación');
  });
});
