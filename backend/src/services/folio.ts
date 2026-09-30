/**
 * El folio.
 *
 * Formato heredado de la fuente, `ONP-YYMMDD-NNNN`
 * (`generarFolio`, onp_fer_etapa2_pf.html:3422), porque es lo que el
 * personal va a leer en voz alta y lo que aparece en el correo de
 * confirmación.
 *
 * Lo que cambia es dónde se genera y con qué. La fuente lo armaba en el
 * navegador con `Math.random()`: adivinable —son 9 000 valores por
 * día— y sin nada que impidiera que dos solicitudes simultáneas
 * cayeran en el mismo. Aquí se genera en el servidor con
 * `crypto.getRandomValues`, y la unicidad la garantiza el índice único
 * de `expedientes.folio`, no la esperanza: quien inserta reintenta si
 * choca (desviación D7 del plan maestro, «Departures from the source» 7).
 */

const INTENTOS = 6;

export function generarFolio(ahora: Date = new Date()): string {
  const yy = ahora.getUTCFullYear().toString().slice(-2);
  const mm = (ahora.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = ahora.getUTCDate().toString().padStart(2, '0');

  // Cuatro dígitos sin sesgo: 10 000 no divide a 65 536, así que se
  // descarta el residuo en vez de tomar el módulo y cargar el reparto
  // hacia los valores bajos.
  let azar: number;
  do {
    azar = crypto.getRandomValues(new Uint16Array(1))[0]!;
  } while (azar >= 60_000);

  return `ONP-${yy}${mm}${dd}-${(azar % 10_000).toString().padStart(4, '0')}`;
}

/**
 * Corre `intentar` con folios nuevos hasta que uno no choque.
 *
 * `esChoque` distingue una colisión de folio de cualquier otro fallo:
 * reintentar un error de red seis veces con seis folios distintos deja
 * basura, no resuelve nada.
 */
export async function conFolioLibre<T>(
  intentar: (folio: string) => Promise<T>,
  esChoque: (error: unknown) => boolean,
): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < INTENTOS; i++) {
    try {
      return await intentar(generarFolio());
    } catch (error) {
      if (!esChoque(error)) throw error;
      ultimo = error;
    }
  }
  throw ultimo;
}

/** Código de Postgres para violación de índice único. */
const CHOQUE_UNICO = '23505';

/**
 * ¿Este fallo es una colisión de folio, y no otra cosa?
 *
 * Vive aquí y no en quien lo usa porque hay dos caminos que reservan
 * folio —el registro en `borrador` y el envío— y una copia de esta
 * condición en cada uno es una copia que se va a desincronizar.
 */
export const esChoqueDeFolio = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: string }).code === CHOQUE_UNICO &&
  String((error as { message?: string }).message ?? '').includes('folio');
