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
  };
}

export const BRAND: BrandConfig = {
  razonSocial: 'ONP FER, S.A. de C.V., SOFOM, E.N.R.',
  nombreComercial: 'ONP FER',
  domicilio: '[DOMICILIO DE LA SOFOM]',
  logo: null,
  contacto: {
    telefono: '[TELÉFONO]',
    correo: '[CORREO]',
  },
};
