import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiBase, conRespaldo } from './api-base';

export interface DatosVerificacion {
  readonly numeroCliente: string;
  readonly nombreCompleto: string;
  readonly curp: string;
}

export interface ResultadoVerificacion {
  readonly encontrado: boolean;
  /** `55 •••• 12 34` — shown so the person knows which handset to pick up. */
  readonly telefonoEnmascarado?: string;
  /** ISO 8601, when an OTP was sent. */
  readonly expiraEn?: string;
  /** Present only under `DEMO_MODE`, rendered only under that label. */
  readonly codigo?: string;
}

/**
 * `POST /clientes/verificar` — the resume entry point.
 *
 * Someone who started an application and left comes back through
 * `verificar-cliente`: they identify themselves, the Worker finds their
 * expediente and sends a one-time code to the phone already on it, and
 * validating that code hands back the step they stopped at.
 *
 * **This endpoint writes.** A CURP that matches sends an OTP and records a
 * row, so it is not safe to exercise against the live Worker with a real
 * CURP. The local fallback below is what the wizard runs on until the owner
 * has run migrations 0001 and 0003 — `otp_codigos` and
 * `expedientes.paso_actual` do not exist yet.
 */
@Injectable({ providedIn: 'root' })
export class ClientesHttp extends ApiBase {
  verificar(datos: DatosVerificacion): Observable<ResultadoVerificacion> {
    return this.post<ResultadoVerificacion>('/clientes/verificar', datos).pipe(
      // Not found is the honest fallback: without a backend there is no
      // expediente to resume, and claiming otherwise would send the person
      // to an OTP screen for a code that will never arrive.
      conRespaldo<ResultadoVerificacion>(() => ({ encontrado: false })),
    );
  }
}
