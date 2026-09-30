/**
 * The four evidentiary moments geolocation is captured at, named the way the
 * source names them in `verExpediente` (`onp_fer_etapa2_pf.html:5606`).
 *
 * An unrecognised etiqueta falls through to itself rather than being dropped —
 * the source does the same, and a location captured under a label this build
 * does not know about is still evidence.
 */
export const NOMBRE_MOMENTO: Readonly<Record<string, string>> = {
  autorizacion: 'Al autorizar',
  fotografia_identificacion: 'Al fotografiar la identificación',
  videograbacion: 'Al grabar el video',
  firma: 'Al firmar',
};
