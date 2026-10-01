import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, type StateContext } from '@ngxs/store';
import { tap } from 'rxjs';
import { ClientesHttp } from '../../services/http/clientes-http';
import { OtpHttp } from '../../services/http/otp-http';
import { ProspectosHttp } from '../../services/http/prospectos-http';
import {
  ElegirSiEsCliente,
  EnviarOtp,
  EstablecerFolio,
  RegistrarProspecto,
  RegistrarVideoNoAdjuntado,
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
  /**
   * The `expedientes` row in `borrador` that `POST /prospectos` reserved,
   * or the one a resume matched. It rides back on `POST /solicitudes` so the
   * draft becomes the submission instead of gaining a sibling.
   */
  readonly prospectoId: string | null;
  /** `55 •••• 12 34`, from a resume. Copy — it tells the person which
   *  handset to pick up, which "tu teléfono registrado" does not. */
  readonly telefonoEnmascarado: string | null;
  /** Whether `POST /clientes/verificar` found an expediente. Null before asking. */
  readonly encontrado: boolean | null;
  /** `DEMO_MODE` echo from the Worker. Rendered only under the
   *  "Modo demostración" label, never anywhere else. */
  readonly codigoDemo: string | null;
  readonly otpExpiraEn: number | null;
  readonly otpValidado: boolean;
  /** The step a resumed application stopped at, as the backend's opaque
   *  slug. Interpreted by `services/domain/reanudacion.ts`, never directly. */
  readonly paso: string | null;
  readonly folio: string | null;
  /**
   * The submission went out a second time without the videograbación,
   * because the first attempt died on the wire (CP-V4). About the
   * *submission*, not the capture — `IdentidadState` owns whether a
   * recording was ever made.
   */
  readonly videoNoAdjuntado: boolean;
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
  telefonoEnmascarado: null,
  encontrado: null,
  codigoDemo: null,
  otpExpiraEn: null,
  otpValidado: false,
  paso: null,
  folio: null,
  videoNoAdjuntado: false,
};

/**
 * The prospect's session: who they say they are, whether the OTP passed, the
 * draft expediente behind them, and the folio the Worker returned.
 *
 * Nothing in this state is persisted. It holds a name, a phone and an email —
 * PII under the LFPDPPP, and 01-conventions.md §7 keeps all of it in memory
 * and in the backend, nowhere else. The resume path does not change that: the
 * thing that survives a closed browser is the httpOnly `onp_prospecto`
 * cookie, which this app cannot read and which carries no field values.
 */
@State<SesionModel>({ name: 'sesion', defaults: INICIAL })
@Injectable()
export class SesionState {
  private readonly otp = inject(OtpHttp);
  private readonly prospectos = inject(ProspectosHttp);
  private readonly clientes = inject(ClientesHttp);

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
  static videoNoAdjuntado(s: SesionModel): boolean {
    return s.videoNoAdjuntado;
  }

  @Selector()
  static codigoDemo(s: SesionModel): string | null {
    return s.codigoDemo;
  }

  @Selector()
  static telefonoEnmascarado(s: SesionModel): string | null {
    return s.telefonoEnmascarado;
  }

  @Selector()
  static encontrado(s: SesionModel): boolean | null {
    return s.encontrado;
  }

  @Selector()
  static paso(s: SesionModel): string | null {
    return s.paso;
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
          // This id is the borrador expediente's, not a `prospectos` row's —
          // that table is gone.
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
  verificar(ctx: StateContext<SesionModel>, { datos }: VerificarCliente) {
    return this.clientes.verificar(datos).pipe(
      tap((r) =>
        ctx.patchState({
          encontrado: r.encontrado,
          esCliente: true,
          numeroCliente: datos.numeroCliente,
          telefonoEnmascarado: r.telefonoEnmascarado ?? null,
          // The Worker sent the code as part of verifying, so the OTP clock
          // starts here rather than on a second call.
          otpExpiraEn: r.expiraEn ? new Date(r.expiraEn).getTime() : null,
          codigoDemo: r.codigo ?? null,
          otpValidado: false,
        }),
      ),
    );
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
      tap((r) =>
        ctx.patchState({
          otpValidado: r.valido,
          // Only on a resume does the Worker hand these back. Keep whatever
          // we already had otherwise — a registration's draft id must not be
          // wiped by a validate that does not mention it.
          prospectoId: r.expedienteId ?? ctx.getState().prospectoId,
          paso: r.paso ?? null,
        }),
      ),
    );
  }

  @Action(EstablecerFolio)
  folio(ctx: StateContext<SesionModel>, { folio }: EstablecerFolio): void {
    ctx.patchState({ folio });
  }

  @Action(RegistrarVideoNoAdjuntado)
  videoNoAdjuntado(ctx: StateContext<SesionModel>): void {
    ctx.patchState({ videoNoAdjuntado: true });
  }
}
