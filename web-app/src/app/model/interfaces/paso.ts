/** Identifier of a wizard step. One per screen in the source's `progress` map. */
export type PasoId =
  | 'bienvenida'
  | 'catalogo'
  | 'privacidad'
  | 'terminos'
  | 'ayuda'
  | 'es-cliente'
  | 'simulador'
  | 'requisitos'
  | 'registro'
  | 'verificar-cliente'
  | 'otp'
  | 'auth-location'
  | 'form-generales'
  | 'form-domicilio'
  | 'form-contacto'
  | 'form-laborales'
  | 'envio-formulario'
  | 'pep-propio'
  | 'pep-familia'
  | 'declaratoria'
  | 'auth-buro'
  | 'id-photos'
  | 'documents'
  | 'biometrics'
  | 'video'
  | 'solicitud'
  | 'signature'
  | 'complete';

export interface Paso {
  readonly id: PasoId;
  /** Router path, without a leading slash. */
  readonly ruta: string;
  /** Topbar title. Ported verbatim from `TITULOS` (onp_fer_etapa2_pf.html:4383). */
  readonly titulo: string;
  /** Progress percentage. Ported verbatim from `progress` (:2156). */
  readonly progreso: number;
  /**
   * Informational screens open off the portada and are not part of the wizard
   * order: the guard never blocks them and the progress bar hides
   * (`PANTALLAS_INFO`, :2178).
   */
  readonly informativa: boolean;
}
