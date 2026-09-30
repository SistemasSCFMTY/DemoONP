import { describe, expect, it } from 'vitest';

import { subirArchivo } from './archivos';

/**
 * La parte `video` del multipart (CP-V1).
 *
 * Lo que se fija aquí es que el video entra con **su propia** regla y
 * no con la de las fotos: otros contenedores, otro tope. Un solo
 * límite compartido o mata la grabación —10 MB— o deja pasar una
 * supuesta foto de INE de 11 MB. Las dos direcciones se prueban.
 *
 * `subirArchivo` es la función real; lo único de mentiras es Supabase.
 */

/** Un cliente con solo lo que `subirArchivo` toca del Storage. */
function clienteFalso() {
  const subidas: { ruta: string; contentType: string }[] = [];
  const sb = {
    storage: {
      from: () => ({
        upload: async (ruta: string, _bytes: ArrayBuffer, opciones: { contentType: string }) => {
          subidas.push({ ruta, contentType: opciones.contentType });
          return { error: null };
        },
      }),
    },
  };
  return { sb: sb as never, subidas };
}

/** Un archivo de `bytes` bytes, sin contenido que valga nada. */
const archivoDe = (nombre: string, mime: string, bytes: number): File =>
  new File([new Uint8Array(bytes)], nombre, { type: mime });

const FOLIO = 'ONP-260930-0007';

describe('subirArchivo · la parte video', () => {
  it('guarda un webm como video_identificacion en {folio}/video_identificacion.webm', async () => {
    const { sb, subidas } = clienteFalso();

    const renglon = await subirArchivo(sb, FOLIO, 'video', archivoDe('g.webm', 'video/webm', 2048));

    // El nombre de la parte es `video`; la columna guarda el valor del
    // enum `tipo_archivo`, que es otro vocabulario.
    expect(renglon.tipo).toBe('video_identificacion');
    expect(renglon.ruta).toBe(`${FOLIO}/video_identificacion.webm`);
    expect(subidas).toEqual([
      { ruta: `${FOLIO}/video_identificacion.webm`, contentType: 'video/webm' },
    ]);
    // El sello se calcula en el servidor sobre los bytes que se
    // escriben. Es el valor probatorio del expediente.
    expect(renglon.hash_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(renglon.tamano_bytes).toBe(2048);
  });

  it('guarda un mp4 con extensión mp4: Safari no graba WebM', async () => {
    const { sb } = clienteFalso();

    const renglon = await subirArchivo(sb, FOLIO, 'video', archivoDe('g.mp4', 'video/mp4', 2048));

    expect(renglon.ruta).toBe(`${FOLIO}/video_identificacion.mp4`);
  });

  it('acepta el mime con códecs que entrega MediaRecorder', async () => {
    const { sb } = clienteFalso();

    // `MediaRecorder` no devuelve `video/webm` a secas y ese sufijo
    // viaja en `File.type`. Si el allowlist lo comparara literal, la
    // grabación real de CP-V2 se rechazaría por su propio códec.
    const renglon = await subirArchivo(
      sb,
      FOLIO,
      'video',
      archivoDe('g.webm', 'video/webm;codecs=vp8,opus', 2048),
    );

    expect(renglon.ruta).toBe(`${FOLIO}/video_identificacion.webm`);
    // El parámetro se conserva en la columna y en el Content-Type: es
    // lo que realmente llegó.
    expect(renglon.tipo_mime).toBe('video/webm;codecs=vp8,opus');
  });

  it('rechaza un mime que no es de video en la parte video', async () => {
    const { sb, subidas } = clienteFalso();

    await expect(
      subirArchivo(sb, FOLIO, 'video', archivoDe('no.png', 'image/png', 2048)),
    ).rejects.toThrow(/debe ser WebM o MP4/);
    expect(subidas).toHaveLength(0);
  });

  it('rechaza un video de más de 25 MB', async () => {
    const { sb, subidas } = clienteFalso();

    await expect(
      subirArchivo(sb, FOLIO, 'video', archivoDe('g.webm', 'video/webm', 26 * 1024 * 1024)),
    ).rejects.toThrow(/pesa más de 25 MB/);
    // Se rechaza antes de materializar los bytes y antes de tocar el bucket.
    expect(subidas).toHaveLength(0);
  });

  it('acepta un video de 20 MB, que con un solo tope de 10 MB se habría caído', async () => {
    const { sb } = clienteFalso();

    const renglon = await subirArchivo(
      sb,
      FOLIO,
      'video',
      archivoDe('g.webm', 'video/webm', 20 * 1024 * 1024),
    );

    expect(renglon.tipo).toBe('video_identificacion');
  });
});

describe('subirArchivo · las demás partes no heredan el tope del video', () => {
  it('sigue rechazando una foto de INE de 11 MB', async () => {
    const { sb, subidas } = clienteFalso();

    // Si los topes se hubieran unificado en 25 MB, esto pasaría.
    await expect(
      subirArchivo(sb, FOLIO, 'id_frente', archivoDe('ine.jpg', 'image/jpeg', 11 * 1024 * 1024)),
    ).rejects.toThrow(/pesa más de 10 MB/);
    expect(subidas).toHaveLength(0);
  });

  it('rechaza un video colado en una parte de documento', async () => {
    const { sb } = clienteFalso();

    await expect(
      subirArchivo(sb, FOLIO, 'doc_curp', archivoDe('g.webm', 'video/webm', 2048)),
    ).rejects.toThrow(/debe ser JPG, PNG, WEBP o PDF/);
  });

  it('sigue aceptando un PDF en una parte de documento', async () => {
    const { sb } = clienteFalso();

    const renglon = await subirArchivo(
      sb,
      FOLIO,
      'doc_curp',
      archivoDe('curp.pdf', 'application/pdf', 4096),
    );

    expect(renglon.ruta).toBe(`${FOLIO}/constancia_curp.pdf`);
  });
});
