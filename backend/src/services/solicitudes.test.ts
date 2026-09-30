import { describe, expect, it } from 'vitest';

import type { Env } from '../env';
import type { ExpedientePayload } from '../schemas/expediente';
import { guardarExpediente, recibirSolicitud } from './solicitudes';

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

/**
 * El video no puede costar un expediente (CP-V1).
 *
 * Es la razón de ser del checkpoint. El video viaja dentro del mismo
 * multipart que la solicitud, así que si su rechazo tumbara el envío,
 * una grabación pesada o de un contenedor raro le costaría a alguien
 * las veintiocho pantallas que acaba de llenar.
 *
 * Esto recorre `recibirSolicitud` de verdad —el `try/catch` y el
 * arreglo `fallidos` reales—; lo único de mentiras es Supabase. La
 * distinción importa: un archivo que el ciclo se *salta* no aparece en
 * `archivosFallidos`. Que `video` esté ahí es la prueba de que se
 * intentó, se rechazó y se siguió.
 */

const ENV = { DEMO_SOFOM_ID: 'sofom-1' } as Env;

/** Un archivo de `bytes` bytes, sin contenido que valga nada. */
const archivoDe = (nombre: string, mime: string, bytes: number): File =>
  new File([new Uint8Array(bytes)], nombre, { type: mime });

interface Insercion {
  readonly tabla: string;
  readonly renglon: unknown;
}

/**
 * Cliente falso con tabla y bucket. Las inserciones que no llevan
 * `.select()` se esperan directo, así que la cadena es `thenable`,
 * igual que la de Supabase.
 */
function clienteConBucket(expediente: { id: string; folio: string }) {
  const inserciones: Insercion[] = [];
  const subidas: string[] = [];

  const sb = {
    from: (tabla: string) => ({
      insert: (renglon: unknown) => {
        const responder = () => {
          inserciones.push({ tabla, renglon });
          return { data: expediente, error: null };
        };
        const cadena: Record<string, unknown> = {
          select: () => cadena,
          single: async () => responder(),
          maybeSingle: async () => responder(),
          then: (ok: (v: unknown) => unknown, mal?: (e: unknown) => unknown) =>
            Promise.resolve(responder()).then(ok, mal),
        };
        return cadena;
      },
    }),
    storage: {
      from: () => ({
        upload: async (ruta: string) => {
          subidas.push(ruta);
          return { error: null };
        },
      }),
    },
  };

  return { sb: sb as never, inserciones, subidas };
}

describe('recibirSolicitud · un video que no pasa no tumba el expediente', () => {
  it('crea el expediente y devuelve «video» en archivosFallidos cuando pesa de más', async () => {
    const { sb, inserciones, subidas } = clienteConBucket({
      id: '22222222-2222-4222-8222-222222222222',
      folio: 'ONP-260930-0042',
    });

    const form = new FormData();
    form.set('expediente', JSON.stringify({ correo: 'x@y.mx', documento_html: '<p>x</p>' }));
    // Una firma chica, que sí debe aterrizar…
    form.set('firma', archivoDe('firma.png', 'image/png', 1024));
    // …y un video de 26 MB, que no.
    form.set('video', archivoDe('g.webm', 'video/webm', 26 * 1024 * 1024));

    const creada = await recibirSolicitud(sb, ENV, form);

    // 1. El expediente existe. Esto es lo que no se puede perder.
    expect(creada.folio).toBe('ONP-260930-0042');
    expect(creada.id).toBe('22222222-2222-4222-8222-222222222222');

    // 2. El video se intentó, se rechazó y quedó anotado. Un archivo
    //    que el ciclo se saltara no estaría en esta lista.
    expect(creada.archivosFallidos).toEqual(['video']);

    // 3. Nada del video llegó al bucket, y la firma sí.
    expect(subidas).toEqual(['ONP-260930-0042/firma.png']);

    // 4. La solicitud siguió hasta el final: renglón de `archivos`
    //    solo para la firma, y el documento firmado escrito.
    expect(inserciones.map((i) => i.tabla)).toEqual(['expedientes', 'archivos', 'documentos']);
    expect(inserciones[1]!.renglon).toHaveLength(1);
    expect(inserciones[1]!.renglon).toMatchObject([{ tipo: 'firma' }]);
  });

  it('registra el video como video_identificacion cuando sí pasa', async () => {
    const { sb, inserciones, subidas } = clienteConBucket({
      id: '33333333-3333-4333-8333-333333333333',
      folio: 'ONP-260930-0043',
    });

    const form = new FormData();
    form.set('expediente', JSON.stringify({}));
    form.set('video', archivoDe('g.webm', 'video/webm', 4096));

    const creada = await recibirSolicitud(sb, ENV, form);

    expect(creada.archivosFallidos).toEqual([]);
    expect(subidas).toEqual(['ONP-260930-0043/video_identificacion.webm']);
    expect(inserciones[1]!.renglon).toMatchObject([
      { tipo: 'video_identificacion', tipo_mime: 'video/webm' },
    ]);
  });

  it('sube el video al final, después de las fotos y los comprobantes', async () => {
    // El ciclo es secuencial y sigue el orden de `TIPO_ARCHIVO_POR_PARTE`.
    // Si el Worker se queda sin tiempo a media subida, lo barato ya
    // aterrizó.
    const { sb, subidas } = clienteConBucket({
      id: '44444444-4444-4444-8444-444444444444',
      folio: 'ONP-260930-0044',
    });

    const form = new FormData();
    form.set('expediente', JSON.stringify({}));
    form.set('video', archivoDe('g.webm', 'video/webm', 2048));
    form.set('id_frente', archivoDe('a.jpg', 'image/jpeg', 2048));
    form.set('doc_curp', archivoDe('c.pdf', 'application/pdf', 2048));

    await recibirSolicitud(sb, ENV, form);

    expect(subidas.at(-1)).toBe('ONP-260930-0044/video_identificacion.webm');
  });
});
