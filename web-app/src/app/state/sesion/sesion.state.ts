import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, type StateContext } from '@ngxs/store';
import { tap } from 'rxjs';
import { OtpHttp } from '../../services/http/otp-http';
import { ProspectosHttp } from '../../services/http/prospectos-http';
import {
  ElegirSiEsCliente,
  EnviarOtp,
  EstablecerFolio,
  RegistrarProspecto,
  ValidarOtp,
  VerificarCliente,
} from './sesion.actions';

export interface SesionModel {
  /** Art. 7 fracc. II — the branch that decides the whole first stage. */
  readonly esCliente: boolean | null;
  readonly numeroCliente: string | null;
  /** Kept so the OTP screen can say which phone it sent to, and so
   *  `form-contacto` can pre-fill. Never persisted anywhere. */
  readonly telefono: string;
  readonly correo: string;
  readonly nombres: string;
  readonly apellidoPaterno: string;
  readonly apellidoMaterno: string;
  readonly prospectoId: string | null;
  /** `DEMO_MODE` echo from the Worker. Rendered only under the
   *  "Modo demostración" label, never anywhere else. */
  readonly codigoDemo: string | null;
  readonly otpExpiraEn: number | null;
  readonly otpValidado: boolean;
  readonly folio: string | null;
}

const INICIAL: SesionModel = {
  esCliente: null,
  numeroCliente: null,
  telefono: '',
  correo: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  prospectoId: null,
  codigoDemo: null,
  otpExpiraEn: null,
  otpValidado: false,
  folio: null,
};

/**
 * The prospect's session: who they say they are, whether the OTP passed, and
 * the folio the Worker returned.
 *
 * Nothing in this state is persisted. It holds a name, a phone and an email —
 * PII under the LFPDPPP, and 01-conventions.md §7 keeps all of it in memory
 * and in the backend, nowhere else.
 */
@State<SesionModel>({ name: 'sesion', defaults: INICIAL })
@Injectable()
export class SesionState {
  private readonly otp = inject(OtpHttp);
  private readonly prospectos = inject(ProspectosHttp);

  @Selector()
  static estado(s: SesionModel): SesionModel {
    return s;
  }

  @Selector()
  static esCliente(s: SesionModel): boolean | null {
    return s.esCliente;
  }

  @Selector()
  static folio(s: SesionModel): string | null {
    return s.folio;
  }

  @Selector()
  static codigoDemo(s: SesionModel): string | null {
    return s.codigoDemo;
  }

  @Action(ElegirSiEsCliente)
  elegir(ctx: StateContext<SesionModel>, { esCliente }: ElegirSiEsCliente): void {
    ctx.patchState({ esCliente });
  }

  @Action(RegistrarProspecto)
  registrar(ctx: StateContext<SesionModel>, { alta }: RegistrarProspecto) {
    return this.prospectos.registrar(alta).pipe(
      tap(({ id }) =>
        ctx.patchState({
          prospectoId: id,
          nombres: alta.nombres,
          apellidoPaterno: alta.apellidoPaterno,
          apellidoMaterno: alta.apellidoMaterno,
          correo: alta.correo,
          telefono: alta.telefono,
        }),
      ),
    );
  }

  @Action(VerificarCliente)
  verificar(ctx: StateContext<SesionModel>, { numeroCliente, curp }: VerificarCliente): void {
    ctx.patchState({ numeroCliente, esCliente: true, codigoDemo: null });
    // The CURP the existing client typed pre-fills form-generales, exactly as
    // the source does at :2617.
    void curp;
  }

  @Action(EnviarOtp)
  enviar(ctx: StateContext<SesionModel>) {
    const { telefono } = ctx.getState();
    return this.otp.enviar(telefono.replace(/\D/g, '')).pipe(
      tap((r) =>
        ctx.patchState({
          codigoDemo: r.codigo ?? null,
          otpExpiraEn: new Date(r.expiraEn).getTime(),
          otpValidado: false,
        }),
      ),
    );
  }

  @Action(ValidarOtp)
  validar(ctx: StateContext<SesionModel>, { codigo }: ValidarOtp) {
    const { telefono } = ctx.getState();
    return this.otp.validar(telefono.replace(/\D/g, ''), codigo).pipe(
      tap((r) => ctx.patchState({ otpValidado: r.valido })),
    );
  }

  @Action(EstablecerFolio)
  folio(ctx: StateContext<SesionModel>, { folio }: EstablecerFolio): void {
    ctx.patchState({ folio });
  }
}
