import { Injectable } from '@angular/core';
import { Action, Selector, State, type StateContext } from '@ngxs/store';
import {
  GuardarAutorizaciones,
  GuardarContacto,
  GuardarDeclaratoria,
  GuardarDomicilio,
  GuardarGenerales,
  GuardarLaborales,
  GuardarPepFamilia,
  GuardarPepPropio,
  PrellenarCurp,
  PrellenarDesdeRegistro,
} from './solicitud.actions';
import {
  AUTORIZACIONES_VACIAS,
  CONTACTO_VACIO,
  DOMICILIO_VACIO,
  GENERALES_VACIOS,
  LABORALES_VACIOS,
  PEP_VACIO,
  type ActuaPorCuenta,
  type Autorizaciones,
  type DatosContacto,
  type DatosDomicilio,
  type DatosGenerales,
  type DatosLaborales,
  type DatosPep,
  type PropietarioReal,
} from './solicitud.model';

export interface SolicitudModel {
  readonly generales: DatosGenerales;
  readonly domicilio: DatosDomicilio;
  readonly contacto: DatosContacto;
  readonly laborales: DatosLaborales;
  readonly pepPropio: DatosPep;
  readonly pepFamilia: DatosPep;
  readonly actuaPorCuenta: ActuaPorCuenta;
  readonly propietario: PropietarioReal | null;
  readonly autorizaciones: Autorizaciones;
}

const INICIAL: SolicitudModel = {
  generales: GENERALES_VACIOS,
  domicilio: DOMICILIO_VACIO,
  contacto: CONTACTO_VACIO,
  laborales: LABORALES_VACIOS,
  pepPropio: PEP_VACIO,
  pepFamilia: PEP_VACIO,
  actuaPorCuenta: 'propio',
  propietario: null,
  autorizaciones: AUTORIZACIONES_VACIAS,
};

/**
 * The expediente. The single source of truth for everything the four form
 * screens, the PEP declarations and the propietario real branch collect.
 *
 * Components dispatch and read selectors. They never mutate — every handler
 * here writes a fresh object (01-conventions.md §7).
 *
 * **Never persisted.** No `@ngxs/storage-plugin` on this state, no
 * localStorage, no IndexedDB. The backend is the only place the expediente
 * lands. This reverses the source, which wrote base64 INE photos into
 * IndexedDB (departure 2).
 */
@State<SolicitudModel>({ name: 'solicitud', defaults: INICIAL })
@Injectable()
export class SolicitudState {
  @Selector()
  static todo(s: SolicitudModel): SolicitudModel {
    return s;
  }

  @Selector()
  static generales(s: SolicitudModel): DatosGenerales {
    return s.generales;
  }

  @Selector()
  static domicilio(s: SolicitudModel): DatosDomicilio {
    return s.domicilio;
  }

  @Selector()
  static contacto(s: SolicitudModel): DatosContacto {
    return s.contacto;
  }

  @Selector()
  static laborales(s: SolicitudModel): DatosLaborales {
    return s.laborales;
  }

  @Selector()
  static pepPropio(s: SolicitudModel): DatosPep {
    return s.pepPropio;
  }

  @Selector()
  static pepFamilia(s: SolicitudModel): DatosPep {
    return s.pepFamilia;
  }

  @Selector()
  static actuaPorCuenta(s: SolicitudModel): ActuaPorCuenta {
    return s.actuaPorCuenta;
  }

  /** `documents` and the payload builder branch on this. */
  @Selector()
  static esTercero(s: SolicitudModel): boolean {
    return s.actuaPorCuenta === 'tercero';
  }

  @Selector()
  static propietario(s: SolicitudModel): PropietarioReal | null {
    return s.propietario;
  }

  @Selector()
  static autorizaciones(s: SolicitudModel): Autorizaciones {
    return s.autorizaciones;
  }

  @Action(GuardarGenerales)
  generales(ctx: StateContext<SolicitudModel>, { datos }: GuardarGenerales): void {
    ctx.patchState({ generales: { ...datos } });
  }

  @Action(GuardarDomicilio)
  domicilio(ctx: StateContext<SolicitudModel>, { datos }: GuardarDomicilio): void {
    ctx.patchState({ domicilio: { ...datos } });
  }

  @Action(GuardarContacto)
  contacto(ctx: StateContext<SolicitudModel>, { datos }: GuardarContacto): void {
    ctx.patchState({ contacto: { ...datos } });
  }

  @Action(GuardarLaborales)
  laborales(ctx: StateContext<SolicitudModel>, { datos }: GuardarLaborales): void {
    ctx.patchState({ laborales: { ...datos } });
  }

  @Action(GuardarPepPropio)
  pepPropio(ctx: StateContext<SolicitudModel>, { datos }: GuardarPepPropio): void {
    ctx.patchState({ pepPropio: { ...datos } });
  }

  @Action(GuardarPepFamilia)
  pepFamilia(ctx: StateContext<SolicitudModel>, { datos }: GuardarPepFamilia): void {
    ctx.patchState({ pepFamilia: { ...datos } });
  }

  @Action(GuardarDeclaratoria)
  declaratoria(
    ctx: StateContext<SolicitudModel>,
    { actuaPorCuenta, propietario }: GuardarDeclaratoria,
  ): void {
    // Declaring "a nombre propio" clears the tercero's data rather than
    // leaving it behind the radio, where it would still reach the payload.
    ctx.patchState({
      actuaPorCuenta,
      propietario: actuaPorCuenta === 'tercero' && propietario ? { ...propietario } : null,
    });
  }

  @Action(GuardarAutorizaciones)
  autorizaciones(ctx: StateContext<SolicitudModel>, { datos }: GuardarAutorizaciones): void {
    ctx.patchState({ autorizaciones: { ...ctx.getState().autorizaciones, ...datos } });
  }

  @Action(PrellenarDesdeRegistro)
  prellenar(ctx: StateContext<SolicitudModel>, a: PrellenarDesdeRegistro): void {
    const s = ctx.getState();
    ctx.patchState({
      generales: {
        ...s.generales,
        nombres: s.generales.nombres || a.nombres,
        apellidoPaterno: s.generales.apellidoPaterno || a.apellidoPaterno,
        apellidoMaterno: s.generales.apellidoMaterno || a.apellidoMaterno,
      },
      contacto: {
        ...s.contacto,
        correo: s.contacto.correo || a.correo,
        telefonoCelular: s.contacto.telefonoCelular || a.telefono,
      },
    });
  }

  @Action(PrellenarCurp)
  prellenarCurp(ctx: StateContext<SolicitudModel>, { curp }: PrellenarCurp): void {
    const s = ctx.getState();
    ctx.patchState({ generales: { ...s.generales, curp } });
  }
}
