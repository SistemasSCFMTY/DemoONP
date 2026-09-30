import { describe, expect, it } from 'vitest';

import {
  ESTADOS_ASIGNABLES,
  ESTADOS_EXPEDIENTE,
  definicionEstado,
} from './estados-expediente';

/**
 * These assertions exist because the panel already shipped the wrong enum
 * once.
 *
 * The first `02-api-contract.md` listed four estados and spelled the third
 * `en_revision`; the panel followed it and the deployed Worker rejected every
 * estado change. Nothing in the type system could catch that — both sides
 * type-checked perfectly against a wrong agreement.
 *
 * So the enum is written out here as a literal, copied from
 * `public.estado_expediente`, and compared against what the app transmits. If
 * the database changes, this fails and says so.
 */
const ENUM_POSTGRES = [
  'borrador',
  'pendiente',
  'revision',
  'aprobado',
  'rechazado',
  'cancelado',
] as const;

describe('ESTADOS_EXPEDIENTE', () => {
  it('transmits exactly the values in public.estado_expediente', () => {
    expect(ESTADOS_EXPEDIENTE.map((e) => e.valor)).toEqual([...ENUM_POSTGRES]);
  });

  it('never transmits the label', () => {
    // "En revisión" is good Spanish for a human and a wrong value on the wire.
    const revision = ESTADOS_EXPEDIENTE.find((e) => e.valor === 'revision');
    expect(revision?.etiqueta).toBe('En revisión');
    expect(revision?.valor).toBe('revision');
  });

  it('gives every estado an icon, so colour never carries meaning alone', () => {
    for (const estado of ESTADOS_EXPEDIENTE) {
      expect(estado.icono).toBeTruthy();
      expect(estado.etiqueta.length).toBeGreaterThan(0);
    }
  });

  it('offers the operator only the four the source assigns', () => {
    expect(ESTADOS_ASIGNABLES.map((e) => e.valor)).toEqual([
      'pendiente',
      'revision',
      'aprobado',
      'rechazado',
    ]);
  });
});

describe('definicionEstado', () => {
  it('resolves each known estado to its own definition', () => {
    for (const valor of ENUM_POSTGRES) {
      expect(definicionEstado(valor).valor).toBe(valor);
    }
  });

  it('shows an unknown estado rather than mislabelling it', () => {
    // The source falls back to `pendiente` here (`:5444`), which would label
    // a record with a state it is not in. This is the departure from it.
    const desconocido = definicionEstado('en_revision' as never);

    expect(desconocido.etiqueta).toBe('en_revision');
    expect(desconocido.etiqueta).not.toBe('Pendiente');
    expect(desconocido.icono).toBe('CircleHelp');
  });

  it('degrades on a missing estado too', () => {
    expect(definicionEstado(null).etiqueta).toBe('Sin estado');
    expect(definicionEstado(undefined).icono).toBe('CircleHelp');
  });
});
