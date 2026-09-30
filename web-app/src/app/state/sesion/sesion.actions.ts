import type { AltaProspecto } from '../../services/http/prospectos-http';

export class ElegirSiEsCliente {
  static readonly type = '[Sesión] Elegir si es cliente';
  constructor(readonly esCliente: boolean) {}
}

export class RegistrarProspecto {
  static readonly type = '[Sesión] Registrar prospecto';
  constructor(readonly alta: AltaProspecto) {}
}

export class VerificarCliente {
  static readonly type = '[Sesión] Verificar cliente';
  constructor(
    readonly numeroCliente: string,
    readonly nombre: string,
    readonly curp: string,
  ) {}
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
