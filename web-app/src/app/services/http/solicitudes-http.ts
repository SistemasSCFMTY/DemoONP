import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Expediente, RespuestaSolicitud } from '../../model/interfaces/expediente';
import { ApiBase, conRespaldo } from './api-base';

/** The eleven upload slots of `POST /solicitudes` (02-api-contract.md). */
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
  | 'doc_domicilio_propietario';

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
