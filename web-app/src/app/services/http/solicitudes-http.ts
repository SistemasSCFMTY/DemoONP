import { Injectable } from '@angular/core';
import { EMPTY, catchError, type Observable } from 'rxjs';
import type { Expediente, RespuestaSolicitud } from '../../model/interfaces/expediente';
import type { PasoId } from '../../model/interfaces/paso';
import { ApiBase, conRespaldo } from './api-base';

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
  enviar(
    expediente: Expediente,
    archivos: ReadonlyMap<TipoArchivo, File | Blob>,
  ): Observable<RespuestaSolicitud> {
    const cuerpo = new FormData();
    cuerpo.append('expediente', JSON.stringify(expediente));
    for (const [tipo, archivo] of archivos) {
      cuerpo.append(tipo, archivo, nombreDeArchivo(tipo, archivo));
    }
    return this.postForm<RespuestaSolicitud>('/solicitudes', cuerpo).pipe(
      conRespaldo(() => respaldoFolio()),
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
