import type {
  ActuaPorCuenta,
  Autorizaciones,
  DatosContacto,
  DatosDomicilio,
  DatosGenerales,
  DatosLaborales,
  DatosPep,
  PropietarioReal,
} from './solicitud.model';

export class GuardarGenerales {
  static readonly type = '[Solicitud] Guardar generales';
  constructor(readonly datos: DatosGenerales) {}
}

export class GuardarDomicilio {
  static readonly type = '[Solicitud] Guardar domicilio';
  constructor(readonly datos: DatosDomicilio) {}
}

export class GuardarContacto {
  static readonly type = '[Solicitud] Guardar contacto';
  constructor(readonly datos: DatosContacto) {}
}

export class GuardarLaborales {
  static readonly type = '[Solicitud] Guardar laborales';
  constructor(readonly datos: DatosLaborales) {}
}

export class GuardarPepPropio {
  static readonly type = '[Solicitud] Guardar PEP propio';
  constructor(readonly datos: DatosPep) {}
}

export class GuardarPepFamilia {
  static readonly type = '[Solicitud] Guardar PEP familia';
  constructor(readonly datos: DatosPep) {}
}

export class GuardarDeclaratoria {
  static readonly type = '[Solicitud] Guardar declaratoria';
  constructor(
    readonly actuaPorCuenta: ActuaPorCuenta,
    readonly propietario: PropietarioReal | null,
  ) {}
}

export class GuardarAutorizaciones {
  static readonly type = '[Solicitud] Guardar autorizaciones';
  constructor(readonly datos: Partial<Autorizaciones>) {}
}

/** Pre-fills what the prospect already typed at registro, so the form screens
 *  do not ask for it twice (the source does this at :2560). */
export class PrellenarDesdeRegistro {
  static readonly type = '[Solicitud] Prellenar desde registro';
  constructor(
    readonly nombres: string,
    readonly apellidoPaterno: string,
    readonly apellidoMaterno: string,
    readonly correo: string,
    readonly telefono: string,
  ) {}
}

export class PrellenarCurp {
  static readonly type = '[Solicitud] Prellenar CURP';
  constructor(readonly curp: string) {}
}
