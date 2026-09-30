import { Injectable } from '@angular/core';
import { Action, Selector, State, type StateContext } from '@ngxs/store';
import type { Ubicacion } from '../../model/interfaces/ubicacion';
import type { TipoArchivo } from '../../services/http/solicitudes-http';
import {
  BorrarFirma,
  DescartarFoto,
  ElegirTipoIdentificacion,
  GuardarDatosIne,
  GuardarDocumento,
  GuardarFirma,
  GuardarFoto,
  PermisoUbicacion,
  RegistrarBiometria,
  RegistrarUbicacion,
  RegistrarVideo,
} from './identidad.actions';
import { DATOS_INE_VACIOS, type DatosIne, type FotoCapturada } from './identidad.model';

export interface IdentidadModel {
  readonly permisoUbicacion: boolean;
  /** All four evidentiary moments, in capture order. */
  readonly ubicaciones: readonly Ubicacion[];
  readonly tipoIdentificacion: string;
  readonly frente: FotoCapturada | null;
  readonly reverso: FotoCapturada | null;
  readonly ine: DatosIne;
  /** `null` means the slot is empty; the key is the API's upload type. */
  readonly documentos: Readonly<Record<string, File | null>>;
  readonly biometriaHuella: boolean;
  readonly biometriaRostro: boolean;
  readonly confianzaHuella: string | null;
  readonly confianzaRostro: string | null;
  readonly videoGrabado: boolean;
  readonly firma: FotoCapturada | null;
}

const INICIAL: IdentidadModel = {
  permisoUbicacion: false,
  ubicaciones: [],
  tipoIdentificacion: '',
  frente: null,
  reverso: null,
  ine: DATOS_INE_VACIOS,
  documentos: {},
  biometriaHuella: false,
  biometriaRostro: false,
  confianzaHuella: null,
  confianzaRostro: null,
  videoGrabado: false,
  firma: null,
};

/**
 * Photographs, OCR results, documents, biometrics, video and the signature.
 *
 * Every Blob here is held in memory until `POST /solicitudes` ships it. None
 * of it touches localStorage or IndexedDB — that is departure 2 and it is not
 * negotiable: these are photographs of someone's identity document.
 */
@State<IdentidadModel>({ name: 'identidad', defaults: INICIAL })
@Injectable()
export class IdentidadState {
  @Selector()
  static todo(s: IdentidadModel): IdentidadModel {
    return s;
  }

  @Selector()
  static permisoUbicacion(s: IdentidadModel): boolean {
    return s.permisoUbicacion;
  }

  @Selector()
  static ubicaciones(s: IdentidadModel): readonly Ubicacion[] {
    return s.ubicaciones;
  }

  /** The capture written into the expediente's main columns: the first one,
   *  taken at the moment of authorisation (`ubicacionPrincipal`, :2320). */
  @Selector()
  static ubicacionPrincipal(s: IdentidadModel): Ubicacion | null {
    return s.ubicaciones.length ? s.ubicaciones[0] : null;
  }

  @Selector()
  static tipoIdentificacion(s: IdentidadModel): string {
    return s.tipoIdentificacion;
  }

  @Selector()
  static frente(s: IdentidadModel): FotoCapturada | null {
    return s.frente;
  }

  @Selector()
  static reverso(s: IdentidadModel): FotoCapturada | null {
    return s.reverso;
  }

  @Selector()
  static ine(s: IdentidadModel): DatosIne {
    return s.ine;
  }

  @Selector()
  static documentos(s: IdentidadModel): Readonly<Record<string, File | null>> {
    return s.documentos;
  }

  @Selector()
  static biometriaCompleta(s: IdentidadModel): boolean {
    return s.biometriaHuella && s.biometriaRostro;
  }

  @Selector()
  static videoGrabado(s: IdentidadModel): boolean {
    return s.videoGrabado;
  }

  @Selector()
  static firma(s: IdentidadModel): FotoCapturada | null {
    return s.firma;
  }

  @Action(PermisoUbicacion)
  permiso(ctx: StateContext<IdentidadModel>, { concedido }: PermisoUbicacion): void {
    ctx.patchState({ permisoUbicacion: concedido });
  }

  @Action(RegistrarUbicacion)
  ubicacion(ctx: StateContext<IdentidadModel>, { ubicacion }: RegistrarUbicacion): void {
    ctx.patchState({ ubicaciones: [...ctx.getState().ubicaciones, ubicacion] });
  }

  @Action(ElegirTipoIdentificacion)
  tipo(ctx: StateContext<IdentidadModel>, { tipo }: ElegirTipoIdentificacion): void {
    ctx.patchState({ tipoIdentificacion: tipo });
  }

  @Action(GuardarFoto)
  foto(ctx: StateContext<IdentidadModel>, { lado, imagen, vistaPrevia, calidad }: GuardarFoto): void {
    const foto: FotoCapturada = { imagen, vistaPrevia, calidad };
    ctx.patchState(lado === 'front' ? { frente: foto } : { reverso: foto });
  }

  @Action(DescartarFoto)
  descartar(ctx: StateContext<IdentidadModel>, { lado }: DescartarFoto): void {
    const anterior = lado === 'front' ? ctx.getState().frente : ctx.getState().reverso;
    if (anterior) URL.revokeObjectURL(anterior.vistaPrevia);
    ctx.patchState(lado === 'front' ? { frente: null } : { reverso: null });
  }

  @Action(GuardarDatosIne)
  datosIne(ctx: StateContext<IdentidadModel>, { datos }: GuardarDatosIne): void {
    ctx.patchState({ ine: { ...ctx.getState().ine, ...datos } });
  }

  @Action(GuardarDocumento)
  documento(ctx: StateContext<IdentidadModel>, { tipo, archivo }: GuardarDocumento): void {
    ctx.patchState({ documentos: { ...ctx.getState().documentos, [tipo as TipoArchivo]: archivo } });
  }

  @Action(RegistrarBiometria)
  biometria(ctx: StateContext<IdentidadModel>, { clase, confianza }: RegistrarBiometria): void {
    ctx.patchState(
      clase === 'huella'
        ? { biometriaHuella: true, confianzaHuella: confianza }
        : { biometriaRostro: true, confianzaRostro: confianza },
    );
  }

  @Action(RegistrarVideo)
  video(ctx: StateContext<IdentidadModel>): void {
    ctx.patchState({ videoGrabado: true });
  }

  @Action(GuardarFirma)
  firma(ctx: StateContext<IdentidadModel>, { imagen, vistaPrevia }: GuardarFirma): void {
    const anterior = ctx.getState().firma;
    if (anterior) URL.revokeObjectURL(anterior.vistaPrevia);
    ctx.patchState({
      firma: { imagen, vistaPrevia, calidad: { aprobada: true, revisiones: [] } },
    });
  }

  @Action(BorrarFirma)
  borrarFirma(ctx: StateContext<IdentidadModel>): void {
    const anterior = ctx.getState().firma;
    if (anterior) URL.revokeObjectURL(anterior.vistaPrevia);
    ctx.patchState({ firma: null });
  }
}
