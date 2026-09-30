import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiBase, conRespaldo } from './api-base';

export interface AltaProspecto {
  readonly nombres: string;
  readonly apellidoPaterno: string;
  readonly apellidoMaterno: string;
  readonly correo: string;
  readonly telefono: string;
  readonly password: string;
}

export interface ProspectoCreado {
  readonly id: string;
}

/**
 * `POST /prospectos` (02-api-contract.md, CP-B3/CP-B6).
 *
 * Creating a prospect triggers the Resend welcome email. That email must never
 * fail the request — the Worker logs the failure and returns 201 anyway — so
 * nothing here waits on or reports mail delivery.
 *
 * DEMO-DAY NOTE: Resend sends from the sandbox sender `onboarding@resend.dev`,
 * which delivers only to the address that owns the Resend account (deviation
 * D8). At the registro step, type that address.
 */
@Injectable({ providedIn: 'root' })
export class ProspectosHttp extends ApiBase {
  registrar(alta: AltaProspecto): Observable<ProspectoCreado> {
    return this.post<ProspectoCreado>('/prospectos', alta).pipe(
      conRespaldo(() => ({ id: `local-${Date.now().toString(36)}` })),
    );
  }
}
