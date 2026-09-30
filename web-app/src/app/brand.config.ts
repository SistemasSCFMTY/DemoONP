/**
 * The whitelabel, in one file.
 *
 * Single tenant by decision (01-conventions.md §1, deviation D3): there is no
 * `sofoms` table, no tenant switcher and no admin UI for branding. Pitching a
 * different client is an edit to this file and a redeploy — which is the
 * whitelabel story, told without building the machinery for it.
 *
 * In the source these values were read from a `sofoms` row and painted into the
 * DOM by `pintarDatosSofom` (onp_fer_etapa2_pf.html:2197). Anything that function
 * touched belongs here, not hardcoded into a template.
 *
 * The palette lives in styles.css as Tailwind `@theme` tokens; it is named here
 * only so a reader can see the whole brand in one place.
 *
 * ---------------------------------------------------------------------------
 * THE CONTACT DETAILS BELOW ARE EXAMPLES, NOT ONP FER'S.
 *
 * The source shipped bracket placeholders — `[DOMICILIO DE LA SOFOM]`,
 * `[TELÉFONO]` — above a banner reading «Datos de ejemplo. Sustituye esta
 * información por los datos reales de la institución» (`:450`). The brackets
 * rendered literally on the aviso de privacidad, the términos, the ayuda screen
 * and the declaratoria, which reads as unfinished rather than as a placeholder.
 *
 * They are example values now instead of brackets. The banner stays exactly
 * where it was, so nothing here claims to be real. `domicilio` deliberately
 * matches the `sofoms` row in the database so the panel and the prospect app
 * agree on screen.
 *
 * Before this serves a real applicant, every field below is replaced and the
 * banner comes out — in the same commit.
 * ---------------------------------------------------------------------------
 */
export interface BrandConfig {
  /** Full legal name. Appears in the footer, the aviso de privacidad and the términos. */
  readonly razonSocial: string;
  /** Trading name — in the source, everything before the first comma of razonSocial. */
  readonly nombreComercial: string;
  /** Registered address. Appears in the aviso de privacidad and the ayuda screen. */
  readonly domicilio: string;
  /** Path under public/. Null renders nombreComercial as a wordmark instead. */
  readonly logo: string | null;
  /** Shown on the ayuda screen. */
  readonly contacto: {
    readonly telefono: string;
    readonly correo: string;
    readonly sitioWeb: string;
  };
  /**
   * Unidad Especializada de Atención a Usuarios — the CONDUSEF-mandated
   * complaints contact. Regulatory, and separate from general enquiries on
   * purpose: the source lists it as its own block (`:490`).
   */
  readonly une: {
    /** The person heading the UNE — CONDUSEF requires them named. */
    readonly titular: string;
    readonly telefono: string;
    readonly correo: string;
  };
}

export const BRAND: BrandConfig = {
  razonSocial: 'ONP FER, S.A. de C.V., SOFOM E.N.R.',
  nombreComercial: 'ONP FER',
  domicilio: 'Av. Ejemplo 100, Col. Centro, Monterrey, Nuevo León',
  logo: null,
  contacto: {
    telefono: '81 1234 5678',
    correo: 'contacto@onpfer.mx',
    sitioWeb: 'www.onpfer.mx',
  },
  une: {
    titular: 'Lic. Nombre Apellido',
    telefono: '81 1234 5679',
    correo: 'une@onpfer.mx',
  },
};
