import { z } from 'zod';
import { texto } from './comunes';

/**
 * La pestaña Ajustes (CP-S6).
 *
 * Cinco campos, los que la fuente editaba en su editor de identidad
 * (`onp_fer_etapa2_pf.html:2087` en adelante). **No incluye
 * `nombre_corto`, `color_primario`, `logo_url` ni `activa`**, que la
 * tabla sí tiene: la marca visual vive en
 * `web-app/src/app/brand.config.ts` (desviación D3) y `activa` no es
 * algo que un panel de un solo tenant deba poder apagar sobre sí mismo.
 *
 * Que un campo no esté aquí también significa que el `update` no lo
 * toca — se escriben las columnas nombradas y ninguna más, así que
 * `nombre_corto`, que es NOT NULL, sobrevive intacto.
 */
export const SofomSchema = z.object({
  razon_social: z.string(),
  rfc: z.string().nullable(),
  domicilio: z.string().nullable(),
  telefono: z.string().nullable(),
  correo_contacto: z.string().nullable(),
});

export type Sofom = z.infer<typeof SofomSchema>;

/**
 * Lo que `PUT /sofom` acepta.
 *
 * `razon_social` es obligatoria porque aparece en el pie de cada
 * correo y en el aviso de privacidad; una SOFOM sin razón social es un
 * documento legal sin emisor. El resto normaliza vacío a `null` con el
 * mismo `oNulo` de siempre.
 */
export const SofomEntradaSchema = z.object({
  razon_social: z.string().trim().min(1, 'La razón social no puede ir vacía.').max(300),
  rfc: texto(13),
  domicilio: texto(400),
  telefono: texto(30),
  correo_contacto: texto(200),
});
