/**
 * The SOFOM's own identity, as the Ajustes tab edits it.
 *
 * `GET /sofom` and `PUT /sofom`. These values are substituted into the
 * solicitud through the `sofom_*` claves, which is what the Formatos
 * catalogue lists at the bottom.
 *
 * Note what is **not** here, and is not coming: storage mode, Project URL and
 * anon key. The source's Ajustes tab had all three (`:2048`), and the whole
 * card is dropped by the owner's decision — a Supabase key typed into a
 * browser form is the thing CLAUDE.md forbids outright. The Worker owns the
 * credentials and sets them with `wrangler secret put`.
 *
 * This is also not the whitelabel. `web-app/src/app/brand.config.ts` is, and
 * it is a file, not a table. These rows feed the *documents*.
 */
export interface DatosSofom {
  readonly razon_social: string;
  readonly rfc: string;
  readonly domicilio: string;
  /** Null in the live row until someone fills it in. Verified 2026-09-30. */
  readonly telefono: string | null;
  readonly correo_contacto: string | null;
}
