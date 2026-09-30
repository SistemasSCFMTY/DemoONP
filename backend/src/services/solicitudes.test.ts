import { describe, expect, it } from 'vitest';

import type { ExpedientePayload } from '../schemas/expediente';
import { guardarExpediente } from './solicitudes';

/**
 * El registro crea el expediente en `borrador` y el envío lo completa.
 *
 * Lo que se prueba aquí es la bifurcación: con `expedienteId` se
 * **actualiza** ese renglón, sin él se **inserta** uno nuevo. Si se
 * rompiera, cada solicitante dejaría dos expedientes —un borrador
 * huérfano y una solicitud— y el panel mostraría el doble de trabajo
 * del que hay.
 */

const BORRADOR = '11111111-1111-4111-8111-111111111111';

/** Lo mínimo que el payload necesita para armar un renglón. */
function payload(extra: Partial<ExpedientePayload> = {}): ExpedientePayload {
  return { documento_html: '<p>x</p>', ...extra } as ExpedientePayload;
}

interface Llamada {
  readonly op: 'update' | 'insert' | 'select';
  readonly renglon?: Record<string, unknown>;
  readonly filtros: Record<string, unknown>;
}

/**
 * Un cliente de Supabase de mentiras, encadenable como el de verdad.
 * `respuestas` se consume en orden: una por operación terminal.
 */
function clienteFalso(respuestas: { data: unknown; error?: unknown }[]) {
  const llamadas: Llamada[] = [];

  function constructor(op: Llamada['op'], renglon?: Record<string, unknown>) {
    const filtros: Record<string, unknown> = {};
    const registrar = () => {
      llamadas.push({ op, renglon, filtros });
      return respuestas.shift() ?? { data: null, error: null };
    };
    const cadena: Record<string, unknown> = {
      eq: (col: string, val: unknown) => {
        filtros[col] = val;
        return cadena;
      },
      select: () => cadena,
      single: async () => registrar(),
      maybeSingle: async () => registrar(),
    };
    return cadena;
  }

  const sb = {
    from: () => ({
      update: (r: Record<string, unknown>) => constructor('update', r),
      insert: (r: Record<string, unknown>) => constructor('insert', r),
      select: () => constructor('select'),
    }),
  };

  return { sb: sb as never, llamadas };
}

describe('guardarExpediente', () => {
  it('completa el borrador en vez de abrir otro expediente', async () => {
    const { sb, llamadas } = clienteFalso([
      { data: { id: BORRADOR, folio: 'ONP-260930-0001' }, error: null },
    ]);

    const r = await guardarExpediente(sb, payload({ expedienteId: BORRADOR }), 'sofom-1');

    expect(r).toEqual({ id: BORRADOR, folio: 'ONP-260930-0001' });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]!.op).toBe('update');
    // Sólo toca el renglón del borrador, y sólo si sigue siéndolo.
    expect(llamadas[0]!.filtros).toEqual({ id: BORRADOR, estado: 'borrador' });
    // El folio no se reescribe: es el que la persona ya vio.
    expect(llamadas[0]!.renglon).not.toHaveProperty('folio');
    expect(llamadas[0]!.renglon).toMatchObject({ estado: 'pendiente' });
  });

  it('rechaza un segundo envío en vez de pisar un expediente ya enviado', async () => {
    const { sb } = clienteFalso([
      { data: null, error: null }, // el update no encontró un borrador
      { data: { estado: 'revision' }, error: null }, // pero el renglón existe
    ]);

    await expect(
      guardarExpediente(sb, payload({ expedienteId: BORRADOR }), 'sofom-1'),
    ).rejects.toThrow(/ya fue enviada/i);
  });

  it('inserta cuando el borrador se perdió, en vez de dejar a alguien sin enviar', async () => {
    const { sb, llamadas } = clienteFalso([
      { data: null, error: null }, // update: nada
      { data: null, error: null }, // select: tampoco existe
      { data: { id: 'nuevo', folio: 'ONP-260930-0002' }, error: null },
    ]);

    const r = await guardarExpediente(sb, payload({ expedienteId: BORRADOR }), 'sofom-1');

    expect(r.id).toBe('nuevo');
    expect(llamadas.at(-1)!.op).toBe('insert');
    // Folio nuevo, porque el que tenía el borrador se fue con él.
    expect(String(llamadas.at(-1)!.renglon!['folio'])).toMatch(/^ONP-\d{6}-\d{4}$/);
  });

  it('inserta con folio nuevo cuando el envío no trae expedienteId', async () => {
    const { sb, llamadas } = clienteFalso([
      { data: { id: 'nuevo', folio: 'ONP-260930-0003' }, error: null },
    ]);

    const r = await guardarExpediente(sb, payload(), 'sofom-1');

    expect(r.folio).toBe('ONP-260930-0003');
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]!.op).toBe('insert');
    expect(llamadas[0]!.renglon).toMatchObject({ estado: 'pendiente' });
    expect(String(llamadas[0]!.renglon!['folio'])).toMatch(/^ONP-\d{6}-\d{4}$/);
  });
});
