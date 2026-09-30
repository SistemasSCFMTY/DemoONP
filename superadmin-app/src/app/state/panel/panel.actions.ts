import { CredencialesPanel } from '../../model/interfaces/sesion-panel';

/** `'[Context] Verb'` per §7. */
export class IniciarSesion {
  static readonly type = '[Panel] Iniciar sesión';
  constructor(readonly credenciales: CredencialesPanel) {}
}

/**
 * Asks the Worker who the session cookie belongs to. Dispatched by the guard
 * on a cold load, because the cookie is httpOnly and the app cannot read it.
 */
export class RestaurarSesion {
  static readonly type = '[Panel] Restaurar sesión';
}

export class CerrarSesion {
  static readonly type = '[Panel] Cerrar sesión';
}

/** Clears the login error when the operator starts typing again. */
export class LimpiarErrorSesion {
  static readonly type = '[Panel] Limpiar error de sesión';
}
