/**
 * A solicitud template the SOFOM uploaded.
 *
 * `GET /plantillas` returns these without `contenido_html` — the list view
 * has no use for a whole document, and the preview fetches the one row it is
 * about to render through `GET /plantillas/:id`.
 */
export interface PlantillaResumen {
  readonly id: string;
  /** Always `solicitud_credito` in this build; the API allows for more. */
  readonly clave: string;
  readonly nombre: string;
  /**
   * The original `.docx` filename, for the operator to recognise.
   * Null on rows created without one. Verified against the Worker,
   * 2026-09-30.
   */
  readonly archivo_original: string | null;
  readonly version: number;
  readonly activa: boolean;
  readonly creado_en: string;
}

/**
 * One template with its converted body.
 *
 * **`contenido_html` is untrusted on display**, like every other stored HTML
 * string in this app: it came out of a `.docx` an operator uploaded, and it is
 * previewed inside an authenticated staff session. It goes through
 * `sanitize(SecurityContext.HTML, …)` and nowhere near `document.write`
 * (`01-conventions.md` §12).
 */
export interface Plantilla extends PlantillaResumen {
  readonly contenido_html: string;
}

/**
 * `POST /plantillas`. The Worker assigns id, version and `activa`, and
 * deactivates the previous row for the same clave.
 *
 * It answers with the whole row, `contenido_html` included — verified
 * 2026-09-30, which is why `crearPlantilla` is typed `Plantilla` and not
 * `PlantillaResumen`.
 */
export interface NuevaPlantilla {
  readonly clave: string;
  readonly nombre: string;
  readonly contenido_html: string;
  readonly archivo_original: string;
}

/**
 * `GET /plantillas` returns **every version, active and not**, newest first.
 * The panel picks the active one itself rather than assuming the first row.
 */
export function plantillaActiva(
  plantillas: readonly PlantillaResumen[],
): PlantillaResumen | null {
  return plantillas.find((p) => p.activa && p.clave === CLAVE_SOLICITUD) ?? null;
}

/** The only clave this build uses. */
export const CLAVE_SOLICITUD = 'solicitud_credito';
