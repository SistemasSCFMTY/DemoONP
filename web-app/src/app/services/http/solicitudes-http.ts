import { Injectable } from '@angular/core';
import { EMPTY, catchError, map, throwError, type Observable } from 'rxjs';
import type { Expediente, RespuestaSolicitud } from '../../model/interfaces/expediente';
import type { PasoId } from '../../model/interfaces/paso';
import { ApiBase, conRespaldo } from './api-base';
import { puedeReintentarseSinVideo } from './reintento-video';

export interface PasoGuardado {
  readonly expedienteId: string;
  /** An opaque slug. Hand it to `destinoDeReanudacion`, not to `pasoPorId`. */
  readonly paso: string | null;
}

/**
 * The twelve upload slots of `POST /solicitudes` (02-api-contract.md).
 *
 * `video` is the identity videograbación (03-videograbacion.md, CP-V2). The
 * part name must stay exactly `video`: the Worker's `TIPO_ARCHIVO_POR_PARTE`
 * maps it to the `video_identificacion` enum value, and a part it does not
 * recognise is ignored rather than stored.
 */
export type TipoArchivo =
  | 'id_frente'
  | 'id_reverso'
  | 'firma'
  | 'doc_id'
  | 'doc_curp'
  | 'doc_fiscal'
  | 'doc_fea'
  | 'doc_domicilio'
  | 'doc_poder'
  | 'doc_id_propietario'
  | 'doc_domicilio_propietario'
  | 'video';

/** What `enviar` resolved to: the Worker's answer, and whether it cost the video. */
export interface EnvioSolicitud {
  readonly respuesta: RespuestaSolicitud;
  /**
   * True when the first attempt died on the wire and the second one went out
   * without the `video` part. The expediente exists; the recording is not in
   * it, and the prospect is told so — 01-conventions.md §11, a runtime
   * fallback is never silent.
   */
  readonly videoOmitido: boolean;
}

export interface OpcionesEnvio {
  /**
   * Called once, when the first attempt has failed and the retry without the
   * video is about to go out. The screen uses it to say so while it waits:
   * the second attempt is the prospect's time, not ours to spend quietly.
   */
  readonly alReintentarSinVideo?: () => void;
}

/**
 * `POST /solicitudes` — the whole expediente as `multipart/form-data`.
 *
 * The folio comes back from the Worker. The source minted it in the browser
 * from a date plus a short random (`:3422`) — guessable and collidable, and
 * departure 7 in 00-master-plan.md. Nothing here invents one.
 *
 * SHA-256 per file is computed server-side; it is the evidentiary point of the
 * whole exercise. The browser only ships the bytes.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudesHttp extends ApiBase {
  /**
   * One attempt, and — only when a video was attached and only when the first
   * attempt died on the wire — exactly one more without it.
   *
   * The retry is deliberately narrow; `puedeReintentarseSinVideo` carries the
   * whole argument, including why a 5xx is refused and why there is no
   * client-side timeout. The second request is built from a fresh `Map`, so
   * "the retry carries no video part" is structural rather than a promise,
   * and the inner call has no `catchError` of its own, so a second failure is
   * final: **retry once, never a loop**.
   */
  enviar(
    expediente: Expediente,
    archivos: ReadonlyMap<TipoArchivo, File | Blob>,
    opciones: OpcionesEnvio = {},
  ): Observable<EnvioSolicitud> {
    const llevabaVideo = archivos.has('video');

    return this.postForm<RespuestaSolicitud>(
      '/solicitudes',
      armarCuerpo(expediente, archivos),
    ).pipe(
      map((respuesta) => ({ respuesta, videoOmitido: false })),
      catchError<EnvioSolicitud, Observable<EnvioSolicitud>>((err: unknown) => {
        if (!llevabaVideo || !puedeReintentarseSinVideo(err)) return throwError(() => err);
        opciones.alReintentarSinVideo?.();

        const sinVideo = new Map(archivos);
        sinVideo.delete('video');
        return this.postForm<RespuestaSolicitud>(
          '/solicitudes',
          armarCuerpo(expediente, sinVideo),
        ).pipe(map((respuesta) => ({ respuesta, videoOmitido: true })));
      }),
      // Outermost on purpose: the retry must get its chance before the
      // labelled offline stand-in does. Dead by default — `permitirMocks` is
      // false everywhere — and the LOCAL folio already says nothing was
      // registered, so it claims no dropped video of its own.
      conRespaldo<EnvioSolicitud>(() => ({ respuesta: respaldoFolio(), videoOmitido: false })),
    );
  }

  /**
   * `PATCH /solicitudes/paso` — record how far the applicant has got.
   *
   * **This must never block the flow.** It is bookkeeping: it exists so the
   * person can come back tomorrow, and a failed write is not their problem.
   * Errors are swallowed here rather than surfaced, and no caller waits on
   * the result. Migrations 0001 and 0003 have not been run, so against the
   * live Worker this currently 500s on every call — which is exactly the
   * case this has to survive silently.
   */
  guardarPaso(paso: PasoId): Observable<void> {
    return this.http
      .patch<void>(this.url('/solicitudes/paso'), { paso }, { withCredentials: true })
      .pipe(catchError(() => EMPTY));
  }

  /** `GET /solicitudes/paso` — where the cookie's expediente left off. */
  obtenerPaso(): Observable<PasoGuardado | null> {
    return this.get<PasoGuardado | null>('/solicitudes/paso').pipe(
      conRespaldo<PasoGuardado | null>(() => null),
    );
  }
}

/** A fresh `FormData` per attempt: a body is not reused between requests. */
function armarCuerpo(
  expediente: Expediente,
  archivos: ReadonlyMap<TipoArchivo, File | Blob>,
): FormData {
  const cuerpo = new FormData();
  cuerpo.append('expediente', JSON.stringify(expediente));
  for (const [tipo, archivo] of archivos) {
    cuerpo.append(tipo, archivo, nombreDeArchivo(tipo, archivo));
  }
  return cuerpo;
}

function nombreDeArchivo(tipo: TipoArchivo, archivo: File | Blob): string {
  if (archivo instanceof File && archivo.name) return archivo.name;
  const extension = archivo.type.split('/')[1] ?? 'bin';
  return `${tipo}.${extension}`;
}

/**
 * Fallback folio, used only when the Worker is unreachable and `permitirMocks`
 * is on. It is prefixed `LOCAL-` on purpose: if one of these ever shows up in
 * the panel, the submission never left the phone.
 */
function respaldoFolio(): RespuestaSolicitud {
  const ahora = new Date();
  const fecha = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    String(ahora.getDate()).padStart(2, '0'),
  ].join('');
  const azar = Math.random().toString(36).substring(2, 6).toUpperCase();
  return { folio: `LOCAL-${fecha}-${azar}`, id: `local-${azar}` };
}
