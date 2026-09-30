import type { Ubicacion } from '../../model/interfaces/ubicacion';
import type { TipoArchivo } from '../../services/http/solicitudes-http';
import type { DatosIne, LadoFoto, ResultadoCalidad } from './identidad.model';

export class RegistrarUbicacion {
  static readonly type = '[Identidad] Registrar ubicación';
  constructor(readonly ubicacion: Ubicacion) {}
}

export class PermisoUbicacion {
  static readonly type = '[Identidad] Permiso de ubicación';
  constructor(readonly concedido: boolean) {}
}

export class ElegirTipoIdentificacion {
  static readonly type = '[Identidad] Elegir tipo de identificación';
  constructor(readonly tipo: string) {}
}

export class GuardarFoto {
  static readonly type = '[Identidad] Guardar foto';
  constructor(
    readonly lado: LadoFoto,
    readonly imagen: Blob,
    readonly vistaPrevia: string,
    readonly calidad: ResultadoCalidad,
  ) {}
}

export class DescartarFoto {
  static readonly type = '[Identidad] Descartar foto';
  constructor(readonly lado: LadoFoto) {}
}

export class GuardarDatosIne {
  static readonly type = '[Identidad] Guardar datos INE';
  constructor(readonly datos: Partial<DatosIne>) {}
}

export class GuardarDocumento {
  static readonly type = '[Identidad] Guardar documento';
  constructor(
    readonly tipo: TipoArchivo,
    readonly archivo: File | null,
  ) {}
}

export class RegistrarBiometria {
  static readonly type = '[Identidad] Registrar biometría';
  constructor(
    readonly clase: 'huella' | 'rostro',
    readonly confianza: string,
  ) {}
}

export class RegistrarVideo {
  static readonly type = '[Identidad] Registrar video';
}

export class GuardarFirma {
  static readonly type = '[Identidad] Guardar firma';
  constructor(
    readonly imagen: Blob,
    readonly vistaPrevia: string,
  ) {}
}

export class BorrarFirma {
  static readonly type = '[Identidad] Borrar firma';
}
