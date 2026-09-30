import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiBase, conRespaldo } from './api-base';

export interface EnvioOtp {
  readonly enviado: boolean;
  /** ISO 8601. TTL is 120 s, matching the source. */
  readonly expiraEn: string;
  /** Present ONLY when the Worker runs with `DEMO_MODE=true`. The UI shows it
   *  under its "Modo demostración" label and nowhere else. */
  readonly codigo?: string;
}

export interface ValidacionOtp {
  readonly valido: boolean;
  /**
   * Present when the code was sent by `POST /clientes/verificar` — i.e. this
   * was a resume, not a registration. Validating also sets the httpOnly
   * `onp_prospecto` cookie, which is why every call here sends credentials.
   */
  readonly expedienteId?: string;
  /**
   * The step the applicant stopped at, as an opaque slug. The backend does
   * not know the list; `services/domain/reanudacion.ts` decides what to do
   * with it, including when it is a slug this build does not recognise.
   */
  readonly paso?: string | null;
}

/**
 * `POST /otp/enviar` and `POST /otp/validar` (02-api-contract.md, CP-B5).
 *
 * The code is generated and burned server-side. The source generated it in
 * the browser (`:2632`), which is the one thing an OTP must never be — the
 * factor is worthless if the device that proves possession also mints the
 * proof. Departure 3 in 00-master-plan.md.
 *
 * The local fallback exists only so the wizard survives a missing Worker on
 * stage. It is clearly labelled wherever it surfaces.
 */
@Injectable({ providedIn: 'root' })
export class OtpHttp extends ApiBase {
  /** The code the fallback minted, so `validar` can check against it. */
  private codigoDeRespaldo: string | null = null;
  private venceRespaldo = 0;

  enviar(telefono: string): Observable<EnvioOtp> {
    return this.post<EnvioOtp>('/otp/enviar', { telefono }).pipe(
      conRespaldo(() => this.respaldoEnviar()),
    );
  }

  validar(telefono: string, codigo: string): Observable<ValidacionOtp> {
    return this.post<ValidacionOtp>('/otp/validar', { telefono, codigo }).pipe(
      conRespaldo(() => this.respaldoValidar(codigo)),
    );
  }

  private respaldoEnviar(): EnvioOtp {
    this.codigoDeRespaldo = String(Math.floor(100000 + Math.random() * 900000));
    this.venceRespaldo = Date.now() + 120_000;
    return {
      enviado: true,
      expiraEn: new Date(this.venceRespaldo).toISOString(),
      codigo: this.codigoDeRespaldo,
    };
  }

  private respaldoValidar(codigo: string): ValidacionOtp {
    const valido =
      this.codigoDeRespaldo !== null &&
      codigo === this.codigoDeRespaldo &&
      Date.now() <= this.venceRespaldo;
    // Single use, like the real endpoint.
    if (valido) this.codigoDeRespaldo = null;
    return { valido };
  }
}
