import { z } from 'zod';

/**
 * La pestaña Formatos (CP-S6).
 *
 * El `.docx` lo desarma el navegador y el panel manda el HTML ya
 * extraído. Es CP-B11 llegando por otro camino, y por la misma razón
 * que el OCR: JSZip más el desempaquetado del docx no caben en el
 * bundle del Worker (desviación D7).
 *
 * La clave de la solicitud es `solicitud_credito`
 * (onp_fer_etapa2_pf.html:3129).
 */

/**
 * Tope de `contenido_html`: un millón de caracteres.
 *
 * Una plantilla de solicitud son unas decenas de miles. Un millón deja
 * margen de sobra para un formato con tablas y estilos incrustados, y
 * pone un techo a lo que un cliente puede depositar en una columna que
 * el panel después renderiza.
 */
export const MAX_CONTENIDO = 1_000_000;

/**
 * La clave: minúsculas, dígitos y guion bajo.
 *
 * Es un identificador que el código compara (`solicitud_credito`), no
 * texto para leer. Cerrarlo a ese alfabeto evita que dos plantillas
 * difieran solo en un acento o un espacio al final y se traten como
 * distintas cuando el usuario cree que son la misma.
 */
export const ClaveSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9_]+$/, 'La clave solo admite minúsculas, dígitos y guion bajo.');

/** Un renglón de la lista. **Sin `contenido_html`** — ver el servicio. */
export const PlantillaResumenSchema = z.object({
  id: z.string(),
  clave: z.string(),
  nombre: z.string(),
  archivo_original: z.string().nullable(),
  version: z.number().int(),
  activa: z.boolean(),
  creado_en: z.string(),
});

/** El detalle, que sí lo trae. */
export const PlantillaSchema = PlantillaResumenSchema.extend({
  contenido_html: z.string(),
});

export const ListaPlantillasSchema = z.array(PlantillaResumenSchema);

/**
 * Lo que `POST /plantillas` acepta.
 *
 * `contenido_html` se valida en dos cosas y nada más: que sea cadena y
 * que no rebase el tope. **No se limpia** — ver el comentario del sitio
 * de escritura en `services/plantillas.ts`.
 */
export const PlantillaEntradaSchema = z.object({
  clave: ClaveSchema,
  nombre: z.string().trim().min(1).max(200),
  contenido_html: z
    .string({ message: 'El contenido de la plantilla debe ser texto.' })
    .max(MAX_CONTENIDO, 'La plantilla es demasiado grande.'),
  archivo_original: z.string().trim().max(300).nullable().optional().default(null),
});

export type PlantillaEntrada = z.infer<typeof PlantillaEntradaSchema>;
