/**
 * One geolocation capture.
 *
 * The permission is asked once; the capture happens at four moments, because
 * what carries evidentiary weight is where the person was during each act:
 * authorising, photographing the ID, recording the video and — above all —
 * signing (onp_fer_etapa2_pf.html:2263).
 */
export type MomentoUbicacion =
  | 'autorizacion'
  | 'fotografia_identificacion'
  | 'videograbacion'
  | 'firma';

export interface Ubicacion {
  readonly etiqueta: MomentoUbicacion;
  readonly latitud: number;
  readonly longitud: number;
  readonly precision_metros: number;
  /** ISO 8601. */
  readonly capturado_en: string;
}
