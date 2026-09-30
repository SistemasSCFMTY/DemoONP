/**
 * La marca, para los correos.
 *
 * **Copia de `web-app/src/app/brand.config.ts` y de la tabla de §3 de
 * `01-conventions.md`.** Tres proyectos, sin paquete compartido — es la
 * política de duplicación que el dueño eligió (00-master-plan.md), y
 * estas copias **derivan en silencio**. Un PR que cambie una cambia las
 * otras.
 *
 * No se leen de la tabla `sofoms` a propósito, aunque el renglón exista:
 * un solo tenant, y la marca vive en un archivo (desviación D3). Que el
 * correo dependiera de una consulta sería construir la maquinaria
 * multi-tenant justo donde se decidió no tenerla.
 *
 * Aquí sí hay hex, y es la única excepción al «nada de hex en una
 * plantilla» de §3: un correo no tiene hoja de estilos ni tokens de
 * Tailwind. Cada valor va nombrado contra su token.
 */

export const MARCA = {
  razonSocial: 'ONP FER, S.A. de C.V., SOFOM, E.N.R.',
  nombreComercial: 'ONP FER',
  domicilio: '[DOMICILIO DE LA SOFOM]',
} as const;

/** Tokens de 01-conventions.md §3. Los nombres son los de la tabla. */
export const COLOR = {
  navy: '#1c3352',
  navyDeep: '#0e2036',
  gold: '#9c7a3c',
  bg: '#f6f4ef',
  surface: '#ffffff',
  text: '#1a1c1f',
  textSoft: '#525a66',
  border: '#e8e4d9',
} as const;

/**
 * Charis SIL para el título, Archivo para el cuerpo (§2).
 *
 * En correo, la mayoría de los clientes descarta las fuentes web:
 * Gmail quita el `@import`, Outlook nunca lo tuvo. Por eso cada pila
 * termina en un genérico que sí honra todo el mundo. El correo tiene
 * que verse bien sin las dos fuentes; con ellas, mejor.
 */
export const FUENTE_TITULO = "'Charis SIL', Georgia, 'Times New Roman', serif";
export const FUENTE_CUERPO = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Escapa texto que se interpola en el HTML del correo. */
export const escapar = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
