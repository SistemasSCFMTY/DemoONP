import type { DatosVerificacion } from '../../services/http/clientes-http';
import type { AltaProspecto } from '../../services/http/prospectos-http';

export class ElegirSiEsCliente {
  static readonly type = '[Sesión] Elegir si es cliente';
  constructor(readonly esCliente: boolean) {}
}

export class RegistrarProspecto {
  static readonly type = '[Sesión] Registrar prospecto';
  constructor(readonly alta: AltaProspecto) {}
}

/**
 * `POST /clientes/verificar` — look for an expediente to resume.
 *
 * On a match the Worker sends a one-time code to the phone already on the
 * expediente, so this action both identifies the person and starts the OTP
 * clock. Nothing here decides whether they were found; the caller reads
 * `SesionState.verificacion` afterwards.
 */
export class VerificarCliente {
  static readonly type = '[Sesión] Verificar cliente';
  constructor(readonly datos: DatosVerificacion) {}
}

export class EnviarOtp {
  static readonly type = '[Sesión] Enviar OTP';
  constructor(readonly reenvio: boolean = false) {}
}

export class ValidarOtp {
  static readonly type = '[Sesión] Validar OTP';
  constructor(readonly codigo: string) {}
}

export class EstablecerFolio {
  static readonly type = '[Sesión] Establecer folio';
  constructor(readonly folio: string) {}
}
