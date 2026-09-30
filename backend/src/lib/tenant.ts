import type { Env } from '../env';
import { internal } from '../lib/errors';
import { log } from '../lib/log';

/**
 * El id de la SOFOM, y de dónde NO sale.
 *
 * Sale del secreto `DEMO_SOFOM_ID` y **nunca del cliente**. Ni de un
 * parámetro de ruta, ni de un campo del cuerpo, ni de un encabezado.
 * Somos un solo tenant y las tablas heredaron `sofom_id` de la etapa
 * en que no lo éramos: si ese valor pudiera venir de fuera, cualquiera
 * con sesión podría leer o escribir los expedientes de otra SOFOM con
 * solo cambiar un uuid. Que hoy solo exista un renglón en `sofoms` no
 * cambia nada — es una propiedad del código, no de los datos.
 *
 * Por eso esta función existe en vez de leer `c.env.DEMO_SOFOM_ID`
 * suelto en cada consulta: hay un solo lugar del que sale, y se ve.
 */
export function sofomActual(env: Env): string {
  const id = env.DEMO_SOFOM_ID;
  if (!id) {
    // Sin esto no hay nada que consultar y adivinar sería peor.
    // `supabase/verificacion.sql` imprime el valor.
    log.error('falta DEMO_SOFOM_ID');
    throw internal('DEMO_SOFOM_ID sin configurar');
  }
  return id;
}
