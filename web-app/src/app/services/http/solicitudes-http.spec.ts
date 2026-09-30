import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Expediente } from '../../model/interfaces/expediente';
import { puedeReintentarseSinVideo } from './reintento-video';
import { SolicitudesHttp, type EnvioSolicitud, type TipoArchivo } from './solicitudes-http';

/**
 * CP-V4 — el reintento sin vídeo.
 *
 * The video is ~97% of this request: 1,665,296 bytes of `video/mp4` against
 * 4–7 KB for every other part, measured on folio `ONP-260930-6659`. So a
 * submission that dies on a bad uplink is a submission the same person could
 * have completed without the recording, and that is what this retry buys.
 *
 * The part these tests exist to defend is not that the retry fires. It is
 * **that it refuses to fire on a failure the Worker answered**: a 5xx raised
 * after the `expedientes` row was written is indistinguishable from one
 * raised before it, and a blind second attempt would leave two folios, two
 * sets of KYC files, and an analyst who cannot tell which is real. Losing a
 * recording is recoverable. A duplicate expediente is not.
 */

const EXPEDIENTE = { folio: null, firmado: true } as unknown as Expediente;

const RESPUESTA = { folio: 'ONP-260930-6659', id: 'exp-1' };

/** A stand-in for the real 1.6 MB recording; the size is not what is tested. */
function video(): Blob {
  return new Blob(['mp4-bytes'], { type: 'video/mp4' });
}

function archivosCompletos(): Map<TipoArchivo, File | Blob> {
  return new Map<TipoArchivo, File | Blob>([
    ['id_frente', new Blob(['frente'], { type: 'image/jpeg' })],
    ['id_reverso', new Blob(['reverso'], { type: 'image/jpeg' })],
    ['firma', new Blob(['firma'], { type: 'image/png' })],
    ['doc_domicilio', new File(['recibo'], 'recibo.pdf', { type: 'application/pdf' })],
    ['video', video()],
  ]);
}

function montar() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    solicitudes: TestBed.inject(SolicitudesHttp),
    http: TestBed.inject(HttpTestingController),
  };
}

/** Collects what the subscription saw, so a test can assert on both arms. */
function observar(solicitudes: SolicitudesHttp, archivos: Map<TipoArchivo, File | Blob>) {
  const visto: { envio: EnvioSolicitud | null; error: unknown; reintentos: number } = {
    envio: null,
    error: null,
    reintentos: 0,
  };
  solicitudes
    .enviar(EXPEDIENTE, archivos, { alReintentarSinVideo: () => (visto.reintentos += 1) })
    .subscribe({
      next: (e) => (visto.envio = e),
      error: (err: unknown) => (visto.error = err),
    });
  return visto;
}

/** Angular's shape for a request that never got a response: a dropped
 *  connection, DNS, TLS, CORS. This is the only class that is retried. */
function morirEnLaRed(req: TestRequest): void {
  req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
}

function partes(req: TestRequest): FormData {
  return req.request.body as FormData;
}

/** Matched by path: the origin comes from `environment.apiBaseUrl`, and this
 *  suite is about the retry, not about where the Worker lives. */
const ES_ENVIO = (req: { url: string }) => req.url.endsWith('/solicitudes');

describe('SolicitudesHttp.enviar — el reintento sin vídeo', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('no reintenta nada cuando el primer envío responde 201', () => {
    const { solicitudes, http } = montar();
    const visto = observar(solicitudes, archivosCompletos());

    const req = http.expectOne(ES_ENVIO);
    expect(partes(req).has('video')).toBe(true);
    req.flush(RESPUESTA);

    http.expectNone(ES_ENVIO);
    http.verify();
    expect(visto.envio?.respuesta.folio).toBe('ONP-260930-6659');
    expect(visto.envio?.videoOmitido).toBe(false);
    expect(visto.reintentos).toBe(0);
  });

  it('reintenta una vez sin la parte `video` cuando el envío muere en la red', () => {
    const { solicitudes, http } = montar();
    const visto = observar(solicitudes, archivosCompletos());

    morirEnLaRed(http.expectOne(ES_ENVIO));

    const segundo = http.expectOne(ES_ENVIO);
    const cuerpo = partes(segundo);
    expect(cuerpo.has('video')).toBe(false);

    // Y todo lo demás sigue ahí: el expediente y los cuatro archivos.
    expect(cuerpo.get('expediente')).toBe(JSON.stringify(EXPEDIENTE));
    for (const parte of ['id_frente', 'id_reverso', 'firma', 'doc_domicilio']) {
      expect(cuerpo.has(parte)).toBe(true);
    }
    // El nombre del File se conserva; no se reconstruye como `doc_domicilio.pdf`.
    expect((cuerpo.get('doc_domicilio') as File).name).toBe('recibo.pdf');

    segundo.flush(RESPUESTA);

    expect(visto.envio?.respuesta.folio).toBe('ONP-260930-6659');
    expect(visto.envio?.videoOmitido).toBe(true);
    expect(visto.reintentos).toBe(1);
    http.verify();
  });

  it('reintenta UNA vez y no entra en ciclo: el segundo fallo es definitivo', () => {
    const { solicitudes, http } = montar();
    const visto = observar(solicitudes, archivosCompletos());

    morirEnLaRed(http.expectOne(ES_ENVIO));
    morirEnLaRed(http.expectOne(ES_ENVIO));

    // No hay un tercer intento, ni pendiente ni en vuelo.
    http.expectNone(ES_ENVIO);
    http.verify();
    expect(visto.reintentos).toBe(1);
    expect(visto.envio).toBeNull();
    expect((visto.error as HttpErrorResponse).status).toBe(0);
  });

  it('no reintenta si no había vídeo que quitar', () => {
    const sinVideo = archivosCompletos();
    sinVideo.delete('video');
    const { solicitudes, http } = montar();
    const visto = observar(solicitudes, sinVideo);

    morirEnLaRed(http.expectOne(ES_ENVIO));

    http.expectNone(ES_ENVIO);
    http.verify();
    expect(visto.reintentos).toBe(0);
    expect(visto.error).not.toBeNull();
  });

  /**
   * El caso que justifica todo el diseño. Un 500 significa que el cuerpo
   * completo llegó y el Worker corrió: el expediente puede existir ya. Un
   * segundo intento crearía un folio gemelo.
   */
  it('NO reintenta un 500: el expediente pudo haberse creado ya', () => {
    const { solicitudes, http } = montar();
    const visto = observar(solicitudes, archivosCompletos());

    http.expectOne(ES_ENVIO).flush('boom', { status: 500, statusText: 'Internal Server Error' });

    http.expectNone(ES_ENVIO);
    http.verify();
    expect(visto.reintentos).toBe(0);
    expect((visto.error as HttpErrorResponse).status).toBe(500);
  });

  for (const status of [400, 401, 413, 429, 502, 503, 504]) {
    it(`NO reintenta un ${status}: el Worker contestó, así que corrió`, () => {
      const { solicitudes, http } = montar();
      const visto = observar(solicitudes, archivosCompletos());

      http.expectOne(ES_ENVIO).flush('no', { status, statusText: 'nope' });

      http.expectNone(ES_ENVIO);
      http.verify();
      expect(visto.reintentos).toBe(0);
      expect((visto.error as HttpErrorResponse).status).toBe(status);
    });
  }
});

describe('puedeReintentarseSinVideo', () => {
  it('solo acepta el fallo de transporte, status 0', () => {
    expect(puedeReintentarseSinVideo(new HttpErrorResponse({ status: 0 }))).toBe(true);
  });

  it('rechaza todo lo que el Worker alcanzó a contestar', () => {
    for (const status of [400, 401, 403, 404, 409, 413, 429, 500, 502, 503, 504, 524]) {
      expect(puedeReintentarseSinVideo(new HttpErrorResponse({ status }))).toBe(false);
    }
  });

  it('rechaza lo que ni siquiera es un error de http', () => {
    expect(puedeReintentarseSinVideo(new Error('cualquier cosa'))).toBe(false);
    expect(puedeReintentarseSinVideo(null)).toBe(false);
    expect(puedeReintentarseSinVideo(undefined)).toBe(false);
  });
});
